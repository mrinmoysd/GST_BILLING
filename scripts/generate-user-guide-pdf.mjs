import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";

const rootDir = process.cwd();
const defaultSource = path.join(rootDir, "docs", "user-guide", "GST_BILLING_USER_GUIDE_SOURCE.md");
const defaultOutput = path.join(rootDir, "docs", "user-guide", "output", "GST_Billing_User_Guide_Draft.pdf");

const sourcePath = path.resolve(process.argv[2] || defaultSource);
const outputPath = path.resolve(process.argv[3] || defaultOutput);

if (!fs.existsSync(sourcePath)) {
  console.error(`Source file not found: ${sourcePath}`);
  process.exit(1);
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });

const markdown = fs.readFileSync(sourcePath, "utf8");
const sourceDir = path.dirname(sourcePath);

const outputStream = fs.createWriteStream(outputPath);

const doc = new PDFDocument({
  size: "A4",
  margin: 54,
  autoFirstPage: false,
  bufferPages: true,
  info: {
    Title: "GST Billing User Guide",
    Author: "Codex",
    Subject: "End-to-end user tutorial for GST Billing",
  },
});

doc.pipe(outputStream);

const colors = {
  ink: "#162231",
  muted: "#667991",
  accent: "#1d6d96",
  bronze: "#99652a",
  border: "#d9e1eb",
  panel: "#f5f7fb",
  darkPanel: "#1a2535",
  white: "#ffffff",
};

function stripMarkdown(text) {
  return text
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .trim();
}

function ensureSpace(height = 24) {
  if (doc.y + height <= doc.page.height - doc.page.margins.bottom - 20) return;
  doc.addPage();
}

function writeHeading(level, text) {
  const clean = stripMarkdown(text);
  const size = level === 1 ? 27 : level === 2 ? 19 : level === 3 ? 14 : 12;
  ensureSpace(level === 1 ? 80 : 42);
  doc.moveDown(level === 1 ? 0.7 : 0.45);
  doc.font("Helvetica-Bold").fontSize(size).fillColor(colors.ink).text(clean, {
    width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
  });
  if (level <= 2) {
    doc.moveDown(0.2);
    doc
      .strokeColor(colors.border)
      .lineWidth(1)
      .moveTo(doc.page.margins.left, doc.y + 4)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y + 4)
      .stroke();
    doc.moveDown(0.5);
  } else {
    doc.moveDown(0.25);
  }
}

function writeParagraph(text) {
  const clean = stripMarkdown(text);
  if (!clean) {
    doc.moveDown(0.35);
    return;
  }
  ensureSpace(42);
  doc.font("Helvetica").fontSize(11).fillColor(colors.ink).text(clean, {
    width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
    lineGap: 3,
  });
  doc.moveDown(0.45);
}

function writeBullet(text) {
  const clean = stripMarkdown(text);
  ensureSpace(28);
  const startX = doc.page.margins.left;
  const startY = doc.y + 5;
  doc.circle(startX + 4, startY, 2.3).fill(colors.accent);
  doc
    .fillColor(colors.ink)
    .font("Helvetica")
    .fontSize(11)
    .text(clean, startX + 14, doc.y, {
      width: doc.page.width - doc.page.margins.left - doc.page.margins.right - 14,
      lineGap: 3,
    });
  doc.moveDown(0.22);
}

function writeDivider() {
  ensureSpace(18);
  doc
    .strokeColor(colors.border)
    .lineWidth(1)
    .moveTo(doc.page.margins.left, doc.y + 2)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y + 2)
    .stroke();
  doc.moveDown(0.65);
}

function writeImagePlaceholder(label, resolvedPath) {
  ensureSpace(220);
  const boxWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const boxHeight = 180;
  const x = doc.page.margins.left;
  const y = doc.y;
  doc.roundedRect(x, y, boxWidth, boxHeight, 14).fillAndStroke(colors.panel, colors.border);
  doc
    .fillColor(colors.muted)
    .font("Helvetica-Bold")
    .fontSize(12)
    .text("Screenshot placeholder", x + 18, y + 22, { width: boxWidth - 36, align: "center" });
  doc
    .font("Helvetica")
    .fontSize(10)
    .text(stripMarkdown(label) || "Image", x + 26, y + 58, { width: boxWidth - 52, align: "center" });
  doc
    .fontSize(9)
    .fillColor(colors.muted)
    .text(`Expected asset: ${path.relative(rootDir, resolvedPath)}`, x + 26, y + 92, {
      width: boxWidth - 52,
      align: "center",
    });
  doc.y += boxHeight + 16;
}

function writeImage(label, imagePath) {
  const resolvedPath = path.resolve(sourceDir, imagePath);
  if (!fs.existsSync(resolvedPath)) {
    writeImagePlaceholder(label, resolvedPath);
    return;
  }
  ensureSpace(250);
  doc.image(resolvedPath, {
    fit: [doc.page.width - doc.page.margins.left - doc.page.margins.right, 240],
    align: "center",
    valign: "center",
  });
  doc.moveDown(0.4);
  doc.font("Helvetica-Oblique").fontSize(9).fillColor(colors.muted).text(stripMarkdown(label), {
    align: "center",
  });
  doc.moveDown(0.8);
}

function renderCover() {
  doc.addPage();
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const x = doc.page.margins.left;
  const y = 76;

  doc.roundedRect(x, y, pageWidth, 170, 24).fill(colors.darkPanel);
  doc
    .fillColor(colors.white)
    .font("Helvetica-Bold")
    .fontSize(13)
    .text("GST Billing", x + 28, y + 30);
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#bfc9d9")
    .text("India-first billing operations", x + 28, y + 50);
  doc
    .fillColor(colors.white)
    .font("Helvetica-Bold")
    .fontSize(28)
    .text("End-to-End User Guide", x + 28, y + 84, { width: pageWidth - 56 });
  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor("#d7e2f0")
    .text("Draft PDF generated from the repository manuscript source.", x + 28, y + 126, {
      width: pageWidth - 56,
    });

  doc.moveDown(12);
  doc
    .fillColor(colors.ink)
    .font("Helvetica-Bold")
    .fontSize(18)
    .text("What this guide covers");
  doc.moveDown(0.6);

  [
    "Public entry, onboarding, and login",
    "Sales, purchases, inventory, collections, GST, accounting, POS, and field sales",
    "Reports, settings, governance, and internal admin workflows",
    "Step-by-step operator guidance with image placeholders ready for final screenshots",
  ].forEach((item) => writeBullet(item));

  doc.moveDown(0.8);
  doc
    .fillColor(colors.muted)
    .font("Helvetica")
    .fontSize(10)
    .text(`Generated on ${new Date().toISOString().slice(0, 10)}`, { align: "left" });
}

function renderBody() {
  doc.addPage();
  const lines = markdown.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      doc.moveDown(0.35);
      continue;
    }

    const imageMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imageMatch) {
      writeImage(imageMatch[1], imageMatch[2]);
      continue;
    }

    if (trimmed === "---") {
      writeDivider();
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      writeHeading(headingMatch[1].length, headingMatch[2]);
      continue;
    }

    const orderedMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (orderedMatch) {
      writeBullet(orderedMatch[1]);
      continue;
    }

    const bulletMatch = trimmed.match(/^-\s+(.*)$/);
    if (bulletMatch) {
      writeBullet(bulletMatch[1]);
      continue;
    }

    writeParagraph(trimmed);
  }
}

renderCover();
renderBody();

const range = doc.bufferedPageRange();
for (let i = 0; i < range.count; i += 1) {
  doc.switchToPage(i);
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(colors.muted)
    .text(`Page ${i + 1}`, 0, doc.page.height - 36, {
      width: doc.page.width,
      align: "center",
    });
}

doc.end();

await new Promise((resolve, reject) => {
  outputStream.on("finish", resolve);
  outputStream.on("error", reject);
});

console.log(`User guide PDF generated: ${outputPath}`);
