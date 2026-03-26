import { Injectable, NotFoundException } from '@nestjs/common';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import * as PDFKit from 'pdfkit';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InvoicePdfService {
  private readonly storageDir = join(process.cwd(), 'storage', 'invoices');

  constructor(private readonly prisma: PrismaService) {}

  private ensureStorageDir() {
    if (!existsSync(this.storageDir)) {
      mkdirSync(this.storageDir, { recursive: true });
    }
  }

  async regenerate(args: { companyId: string; invoiceId: string }) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: args.invoiceId, companyId: args.companyId },
      include: {
        customer: true,
        items: { include: { product: true } },
        company: true,
      },
    });

    if (!invoice) throw new NotFoundException('Invoice not found');

    const activeTemplate = await this.prisma.printTemplate.findFirst({
      where: {
        companyId: args.companyId,
        templateType: 'invoice',
        isDefault: true,
      },
    });

    const publishedVersion = activeTemplate?.publishedVersionId
      ? await this.prisma.printTemplateVersion.findFirst({
          where: {
            id: activeTemplate.publishedVersionId,
            companyId: args.companyId,
          },
        })
      : null;
    const layout =
      (publishedVersion?.layoutJson as
        | {
            header?: { title?: string; show_logo?: boolean };
            sections?: Array<{ key?: string; label?: string }>;
            footer?: { text?: string };
          }
        | null) ?? null;
    const visibleSections = new Set(
      Array.isArray(layout?.sections)
        ? layout!.sections.map((section) => String(section.key ?? ''))
        : ['party', 'items', 'totals', 'footer'],
    );

    this.ensureStorageDir();

    const filename = `invoice_${invoice.id}.pdf`;
    const filepath = join(this.storageDir, filename);

    // pdfkit is CJS; depending on TS module interop it may live on `.default`.
    const DocCtor =
      (PDFKit as unknown as { default?: any })?.default ?? (PDFKit as any);
    const doc = new DocCtor({ size: 'A4', margin: 50 });
    const stream = createWriteStream(filepath);

    doc.pipe(stream);

    if (layout?.header?.show_logo && invoice.company.logoUrl) {
      doc.fontSize(10).text(`Logo: ${invoice.company.logoUrl}`, { align: 'right' });
      doc.moveDown(0.5);
    }

    doc.fontSize(20).text(layout?.header?.title ?? 'Invoice', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text(`Invoice #: ${invoice.invoiceNumber ?? invoice.id}`);
    doc.text(`Status: ${invoice.status}`);
    if (visibleSections.has('party')) {
      doc.text(`Customer: ${invoice.customer.name}`);
      doc.text(
        `Issue date: ${invoice.issueDate ? invoice.issueDate.toISOString().slice(0, 10) : '-'}`,
      );
      if (invoice.customer.gstin) {
        doc.text(`Customer GSTIN: ${invoice.customer.gstin}`);
      }
    }

    if (visibleSections.has('items')) {
      doc.moveDown();
      doc.fontSize(12).text('Items:', { underline: true });
      doc.moveDown(0.5);

      invoice.items.forEach((it: (typeof invoice.items)[number], idx: number) => {
        doc.text(
          `${idx + 1}. ${it.product.name}  qty=${it.quantity.toString()}  unit=${it.unitPrice.toString()}  total=${it.lineTotal.toString()}`,
        );
      });
    }

    if (visibleSections.has('totals')) {
      doc.moveDown();
      doc.text(`Subtotal: ${invoice.subTotal.toString()}`);
      doc.text(`Tax: ${invoice.taxTotal.toString()}`);
      doc.fontSize(14).text(`Total: ${invoice.total.toString()}`);
    }

    if (visibleSections.has('footer')) {
      const footerText = layout?.footer?.text || invoice.notes || 'Generated from the default print template.';
      doc.moveDown();
      doc.fontSize(11).text(footerText);
    }

    doc.end();

    await new Promise<void>((resolve, reject) => {
      stream.on('finish', () => resolve());
      stream.on('error', reject);
    });

    const pdfUrl = `/api/companies/${args.companyId}/invoices/${args.invoiceId}/pdf`;

    const updated = await this.prisma.invoice.update({
      where: { id: invoice.id },
      data: { pdfUrl },
    });

    return { data: updated, filepath };
  }

  async getPath(args: { companyId: string; invoiceId: string }) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: args.invoiceId, companyId: args.companyId },
      select: { id: true },
    });

    if (!invoice) throw new NotFoundException('Invoice not found');

    const filename = `invoice_${invoice.id}.pdf`;
    const filepath = join(this.storageDir, filename);

    // If the PDF isn't present (e.g. async job not processed yet), generate it on-demand
    // so the download endpoint stays reliable.
    if (!existsSync(filepath)) {
      await this.regenerate(args);
    }

    return { filepath };
  }
}
