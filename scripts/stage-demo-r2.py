#!/usr/bin/env python3
"""Prepare exact R2 object-key payloads without changing remote state."""

from __future__ import annotations

import hashlib
import json
import shutil
from pathlib import Path

from pypdf import PdfReader, PdfWriter

ROOT = Path(__file__).resolve().parents[1]
FIXTURE = ROOT / "fixtures" / "demo-backoffice-documents.json"
PDF_DIR = ROOT / "output" / "pdf"
STAGING = ROOT / ".r2-staging"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def split_document(document: dict[str, object]) -> list[dict[str, object]]:
    source = PDF_DIR / str(document["name"])
    reader = PdfReader(source)
    pages = document["pages"]
    if len(reader.pages) != len(pages):  # type: ignore[arg-type]
        raise ValueError(f"page count mismatch: {source}")

    document_id = str(document["documentId"])
    base_key = Path("documents") / document_id
    base_path = STAGING / "payloads" / document_id / "full.pdf"
    base_path.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, base_path)

    objects = [
        {
            "key": base_key.as_posix(),
            "source": str(source.relative_to(ROOT)),
            "size": base_path.stat().st_size,
            "sha256": sha256(base_path),
            "contentType": "application/pdf",
        }
    ]

    for index, page in enumerate(reader.pages, start=1):
        page_key = base_key / "pages" / str(index)
        page_path = STAGING / "payloads" / document_id / "pages" / f"{index}.pdf"
        page_path.parent.mkdir(parents=True, exist_ok=True)
        writer = PdfWriter()
        writer.add_page(page)
        with page_path.open("wb") as stream:
            writer.write(stream)
        objects.append(
            {
                "key": page_key.as_posix(),
                "source": str(page_path.relative_to(ROOT)),
                "size": page_path.stat().st_size,
                "sha256": sha256(page_path),
                "contentType": "application/pdf",
            }
        )
    return objects


def main() -> None:
    data = json.loads(FIXTURE.read_text(encoding="utf-8"))
    if STAGING.exists():
        shutil.rmtree(STAGING)
    objects = []
    for document in data["documents"]:
        objects.extend(split_document(document))
    manifest = {
        "checkedAt": data["checkedAt"],
        "bucket": "local-rag-document-assistant-documents",
        "documents": len(data["documents"]),
        "objects": objects,
    }
    manifest_path = STAGING / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(manifest_path.relative_to(ROOT))
    print(f"staged {len(objects)} objects")


if __name__ == "__main__":
    main()
