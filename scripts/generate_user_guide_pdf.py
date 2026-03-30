#!/usr/bin/env python3

from __future__ import annotations

import os
import re
from pathlib import Path
from typing import List

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, StyleSheet1, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    Image,
    KeepTogether,
    ListFlowable,
    ListItem,
    PageBreak,
    PageTemplate,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "user-guide" / "GST_BILLING_USER_GUIDE_SOURCE.md"
OUTPUT = ROOT / "output" / "pdf" / "GST_Billing_User_Guide_Manual.pdf"
TMP_DIR = ROOT / "tmp" / "pdfs"


def build_styles() -> StyleSheet1:
    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="BodyCopy",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=10.5,
            leading=15,
            textColor=colors.HexColor("#203044"),
            spaceAfter=6,
            alignment=TA_JUSTIFY,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CoverKicker",
            parent=styles["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=14,
            textColor=colors.HexColor("#D9E5F3"),
            spaceAfter=8,
            alignment=TA_CENTER,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CoverTitle",
            parent=styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=26,
            leading=30,
            alignment=TA_CENTER,
            textColor=colors.white,
            spaceAfter=12,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CoverText",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=11,
            leading=16,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#E6EEF8"),
        )
    )
    styles.add(
        ParagraphStyle(
            name="CoverNote",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=10.5,
            leading=14,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#E6EEF8"),
        )
    )
    styles.add(
        ParagraphStyle(
            name="SectionTitle",
            parent=styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=22,
            leading=28,
            textColor=colors.HexColor("#182434"),
            spaceBefore=8,
            spaceAfter=10,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ChapterTitle",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=16,
            leading=22,
            textColor=colors.HexColor("#182434"),
            spaceBefore=10,
            spaceAfter=8,
        )
    )
    styles.add(
        ParagraphStyle(
            name="MinorTitle",
            parent=styles["Heading3"],
            fontName="Helvetica-Bold",
            fontSize=12.5,
            leading=17,
            textColor=colors.HexColor("#23415A"),
            spaceBefore=6,
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Caption",
            parent=styles["BodyText"],
            fontName="Helvetica-Oblique",
            fontSize=8.5,
            leading=11,
            textColor=colors.HexColor("#6D7E92"),
            alignment=TA_CENTER,
            spaceBefore=3,
            spaceAfter=12,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Placeholder",
            parent=styles["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=14,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#5E6F84"),
        )
    )
    return styles


STYLES = build_styles()


def clean_inline(text: str) -> str:
    text = re.sub(r"`([^`]+)`", r"<font face='Helvetica-Bold'>\1</font>", text)
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"\*(.+?)\*", r"<i>\1</i>", text)
    text = re.sub(r"\[(.*?)\]\((.*?)\)", r"<u>\1</u>", text)
    replacements = {
        "<u>": "%%U_OPEN%%",
        "</u>": "%%U_CLOSE%%",
        "<b>": "%%B_OPEN%%",
        "</b>": "%%B_CLOSE%%",
        "<i>": "%%I_OPEN%%",
        "</i>": "%%I_CLOSE%%",
        "<font face='Helvetica-Bold'>": "%%F_OPEN%%",
        "</font>": "%%F_CLOSE%%",
    }
    for original, token in replacements.items():
        text = text.replace(original, token)
    text = text.replace("&", "&amp;")
    text = text.replace("<", "&lt;").replace(">", "&gt;")
    for original, token in replacements.items():
        text = text.replace(token, original)
    return text


def image_flowable(path: Path, caption: str):
    if path.exists():
      img = Image(str(path))
      img._restrictSize(165 * mm, 105 * mm)
      return KeepTogether([img, Spacer(1, 3), Paragraph(clean_inline(caption), STYLES["Caption"])])

    placeholder = Table(
        [[Paragraph("Screenshot placeholder", STYLES["Placeholder"])], [Paragraph(clean_inline(caption), STYLES["Caption"])]],
        colWidths=[165 * mm],
        rowHeights=[22 * mm, 18 * mm],
    )
    placeholder.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F2F6FB")),
                ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#D5DFEA")),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )
    return KeepTogether([placeholder, Spacer(1, 10)])


def make_cover_story() -> List:
    story: List = []
    story.append(Spacer(1, 12 * mm))
    hero_panel = Table(
        [
            [Paragraph("GST Billing", STYLES["CoverKicker"])],
            [Paragraph("End-to-End User Guide", STYLES["CoverTitle"])],
            [
                Paragraph(
                    "A practical operator manual for billing, purchases, inventory, GST, accounting, collections, POS, field sales, settings, and internal admin workflows.",
                    STYLES["CoverText"],
                )
            ],
        ],
        colWidths=[170 * mm],
    )
    hero_panel.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#182434")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#182434")),
                ("LEFTPADDING", (0, 0), (-1, -1), 18),
                ("RIGHTPADDING", (0, 0), (-1, -1), 18),
                ("TOPPADDING", (0, 0), (-1, -1), 18),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 18),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
        )
    )
    story.append(hero_panel)
    story.append(Spacer(1, 8 * mm))
    cover_image = ROOT / "docs" / "user-guide" / "assets" / "public-landing.png"
    story.append(image_flowable(cover_image, "Public landing page and product positioning"))
    story.append(PageBreak())
    return story


def parse_markdown(source_path: Path) -> List:
    story: List = []
    lines = source_path.read_text(encoding="utf-8").splitlines()
    pending_bullets: List[str] = []

    def flush_bullets():
        nonlocal pending_bullets
        if not pending_bullets:
            return
        list_items = [
            ListItem(Paragraph(clean_inline(item), STYLES["BodyCopy"]), leftIndent=6) for item in pending_bullets
        ]
        story.append(
            ListFlowable(
                list_items,
                bulletType="bullet",
                bulletFontName="Helvetica-Bold",
                bulletColor=colors.HexColor("#1D6D96"),
                leftIndent=16,
            )
        )
        story.append(Spacer(1, 4))
        pending_bullets = []

    for raw in lines:
        line = raw.rstrip()
        stripped = line.strip()

        if not stripped:
            flush_bullets()
            story.append(Spacer(1, 4))
            continue

        if stripped == "---":
            flush_bullets()
            story.append(Spacer(1, 3))
            divider = Table([[""]], colWidths=[170 * mm], rowHeights=[1])
            divider.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#D9E1EB"))]))
            story.append(divider)
            story.append(Spacer(1, 8))
            continue

        image_match = re.match(r"^!\[(.*?)\]\((.*?)\)$", stripped)
        if image_match:
            flush_bullets()
            image_path = (source_path.parent / image_match.group(2)).resolve()
            story.append(image_flowable(image_path, image_match.group(1)))
            continue

        heading = re.match(r"^(#{1,3})\s+(.*)$", stripped)
        if heading:
            flush_bullets()
            level = len(heading.group(1))
            text = clean_inline(heading.group(2))
            style = STYLES["SectionTitle"] if level == 1 else STYLES["ChapterTitle"] if level == 2 else STYLES["MinorTitle"]
            story.append(Paragraph(text, style))
            continue

        bullet = re.match(r"^(?:-|\d+\.)\s+(.*)$", stripped)
        if bullet:
            pending_bullets.append(bullet.group(1))
            continue

        flush_bullets()
        story.append(Paragraph(clean_inline(stripped), STYLES["BodyCopy"]))

    flush_bullets()
    return story


def on_page(canvas, doc):
    page_no = canvas.getPageNumber()
    width, height = A4
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#D8E1EB"))
    canvas.line(18 * mm, height - 14 * mm, width - 18 * mm, height - 14 * mm)
    canvas.setFont("Helvetica-Bold", 8)
    canvas.setFillColor(colors.HexColor("#5F7289"))
    canvas.drawString(18 * mm, height - 11.5 * mm, "GST Billing User Guide")
    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(width - 18 * mm, height - 11.5 * mm, f"Page {page_no}")
    canvas.setStrokeColor(colors.HexColor("#D8E1EB"))
    canvas.line(18 * mm, 14 * mm, width - 18 * mm, 14 * mm)
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(colors.HexColor("#7A8A9E"))
    canvas.drawString(18 * mm, 9.5 * mm, "Generated from repository guide source")
    canvas.restoreState()


def build_pdf():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    TMP_DIR.mkdir(parents=True, exist_ok=True)

    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
        title="GST Billing User Guide",
        author="Codex",
    )

    story = []
    story.extend(make_cover_story())
    story.extend(parse_markdown(SOURCE))
    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)


if __name__ == "__main__":
    build_pdf()
    print(f"Generated: {OUTPUT}")
