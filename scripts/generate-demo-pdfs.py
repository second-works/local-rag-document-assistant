#!/usr/bin/env python3
"""Generate the three five-page demo PDFs from the shared JSON fixture."""

from __future__ import annotations

import json
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.platypus import (
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
FIXTURE = ROOT / "fixtures" / "demo-backoffice-documents.json"
OUTPUT = ROOT / "output" / "pdf"
FONT_NAME = "HeiseiKakuGo-W5"

INK = colors.HexColor("#17332E")
MUTED = colors.HexColor("#667A74")
ACCENT = colors.HexColor("#0D7566")
PALE = colors.HexColor("#EDF7F3")
LINE = colors.HexColor("#D9E7E2")
WARNING = colors.HexColor("#8A5C1D")
WARNING_BG = colors.HexColor("#FFF8E8")


def register_fonts() -> None:
    pdfmetrics.registerFont(UnicodeCIDFont(FONT_NAME))


def styles() -> dict[str, ParagraphStyle]:
    return {
        "document": ParagraphStyle(
            "Document",
            fontName=FONT_NAME,
            fontSize=13,
            leading=17,
            textColor=colors.white,
        ),
        "meta": ParagraphStyle(
            "Meta",
            fontName=FONT_NAME,
            fontSize=8,
            leading=11,
            textColor=colors.HexColor("#D7ECE6"),
        ),
        "badge": ParagraphStyle(
            "Badge",
            fontName=FONT_NAME,
            fontSize=7.5,
            leading=10,
            alignment=TA_CENTER,
            textColor=ACCENT,
        ),
        "chapter": ParagraphStyle(
            "Chapter",
            fontName=FONT_NAME,
            fontSize=17,
            leading=23,
            textColor=INK,
            spaceAfter=5 * mm,
        ),
        "heading": ParagraphStyle(
            "Heading",
            fontName=FONT_NAME,
            fontSize=10.5,
            leading=14,
            textColor=INK,
            spaceAfter=1.8 * mm,
        ),
        "body": ParagraphStyle(
            "Body",
            fontName=FONT_NAME,
            fontSize=8.7,
            leading=14,
            textColor=INK,
            alignment=TA_LEFT,
        ),
        "notice-title": ParagraphStyle(
            "NoticeTitle",
            fontName=FONT_NAME,
            fontSize=8,
            leading=11,
            textColor=WARNING,
        ),
        "notice": ParagraphStyle(
            "Notice",
            fontName=FONT_NAME,
            fontSize=7.2,
            leading=10.8,
            textColor=WARNING,
        ),
        "footer": ParagraphStyle(
            "Footer",
            fontName=FONT_NAME,
            fontSize=7,
            leading=9,
            textColor=MUTED,
            alignment=TA_CENTER,
        ),
    }


def item_card(item: dict[str, str], style: dict[str, ParagraphStyle]) -> Table:
    badge = Table(
        [[Paragraph(item["category"], style["badge"])]],
        colWidths=[42 * mm],
        style=TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), PALE),
                ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#BBDCCF")),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 3),
                ("RIGHTPADDING", (0, 0), (-1, -1), 3),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ]
        ),
    )
    content = [
        [Paragraph(item["heading"], style["heading"]), badge],
        [Paragraph(item["body"], style["body"]), ""],
    ]
    return Table(
        content,
        colWidths=[119 * mm, 42 * mm],
        style=TableStyle(
            [
                ("SPAN", (0, 1), (1, 1)),
                ("BOX", (0, 0), (-1, -1), 0.7, LINE),
                ("BACKGROUND", (0, 0), (-1, -1), colors.white),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, 0), 8),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 4),
                ("TOPPADDING", (0, 1), (-1, 1), 2),
                ("BOTTOMPADDING", (0, 1), (-1, 1), 9),
            ]
        ),
    )


def page_story(
    document: dict[str, object],
    page: dict[str, object],
    page_number: int,
    disclaimer: str,
    checked_at: str,
    style: dict[str, ParagraphStyle],
) -> list[object]:
    header = Table(
        [
            [
                Paragraph(str(document["name"]), style["document"]),
                Paragraph("DEMO DOCUMENT", style["badge"]),
            ],
            [
                Paragraph(
                    f'{document["version"]} ・ 制定日 {document["enactedAt"]} ・ ポートフォリオ用',
                    style["meta"],
                ),
                "",
            ],
        ],
        colWidths=[131 * mm, 30 * mm],
        style=TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), ACCENT),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, 0), 10),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 4),
                ("TOPPADDING", (0, 1), (-1, 1), 0),
                ("BOTTOMPADDING", (0, 1), (-1, 1), 9),
            ]
        ),
    )

    notice = Table(
        [
            [Paragraph("利用上の注意", style["notice-title"])],
            [Paragraph(disclaimer, style["notice"])],
        ],
        colWidths=[161 * mm],
        style=TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), WARNING_BG),
                ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#EAD7B5")),
                ("LEFTPADDING", (0, 0), (-1, -1), 9),
                ("RIGHTPADDING", (0, 0), (-1, -1), 9),
                ("TOPPADDING", (0, 0), (-1, 0), 6),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 1),
                ("TOPPADDING", (0, 1), (-1, 1), 1),
                ("BOTTOMPADDING", (0, 1), (-1, 1), 7),
            ]
        ),
    )

    story: list[object] = [
        header,
        Spacer(1, 7 * mm),
        Paragraph(str(page["chapter"]), style["chapter"]),
    ]
    for item in page["items"]:  # type: ignore[index]
        story.extend([KeepTogether(item_card(item, style)), Spacer(1, 3.2 * mm)])
    story.extend(
        [
            Spacer(1, 1.2 * mm),
            notice,
            Spacer(1, 3 * mm),
            Paragraph(
                f"公的資料確認日 {checked_at} ・ {page_number} / 5 ページ",
                style["footer"],
            ),
        ]
    )
    return story


def build_document(document: dict[str, object], data: dict[str, object], style: dict[str, ParagraphStyle]) -> Path:
    output_path = OUTPUT / str(document["name"])
    pdf = SimpleDocTemplate(
        str(output_path),
        pagesize=A4,
        leftMargin=24 * mm,
        rightMargin=24 * mm,
        topMargin=18 * mm,
        bottomMargin=14 * mm,
        title=str(document["name"]),
        author="Local RAG Document Assistant demo",
    )
    story: list[object] = []
    pages = document["pages"]
    for index, page in enumerate(pages):  # type: ignore[assignment]
        story.extend(
            page_story(
                document,
                page,
                index + 1,
                str(data["disclaimer"]),
                str(data["checkedAt"]),
                style,
            )
        )
        if index < len(pages) - 1:  # type: ignore[arg-type]
            story.append(PageBreak())
    pdf.build(story)
    return output_path


def main() -> None:
    register_fonts()
    data = json.loads(FIXTURE.read_text(encoding="utf-8"))
    OUTPUT.mkdir(parents=True, exist_ok=True)
    generated = [build_document(document, data, styles()) for document in data["documents"]]
    for path in generated:
        print(path.relative_to(ROOT))


if __name__ == "__main__":
    main()
