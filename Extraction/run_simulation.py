"""Quick simulation: run GeminiOrderExtractor on 10 sample files and
print the structured output next to the ground-truth CSV for visual
comparison.

The module itself does no file I/O — reading the file and detecting
its MIME type is the caller's job.
"""

from __future__ import annotations

import io
import mimetypes
import sys
from pathlib import Path

from extraction import GeminiOrderExtractor

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

DATA_DIR = Path(__file__).parent / "Data" / "1. Orders"

SAMPLES = [
    "A0233_0001.jpg",
    "B0244_0001.txt",
    "B0433_0001.jpg",
    "B0491_0001.jpg",
    "B0578_0001.m4a",
    "E0131_001.txt",
    "F0245_0001_01.m4a",
    "H0289_0001.png",
    "N0158_0001.png",
    "S0942_0001.txt",
]

_EXT_MIME = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".pdf": "application/pdf",
    ".m4a": "audio/mp4",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".ogg": "audio/ogg",
}


def detect_mime(path: Path) -> str:
    """Detect a file's MIME type from its extension.

    Parameters
    ----------
    path : Path
        File to inspect.

    Returns
    -------
    str
        Detected MIME type, or ``application/octet-stream`` if unknown.
    """
    ext = path.suffix.lower()
    if ext in _EXT_MIME:
        return _EXT_MIME[ext]
    mime, _ = mimetypes.guess_type(str(path))
    return mime or "application/octet-stream"


def show_ground_truth(path: Path) -> None:
    """Print the ground-truth CSV next to the source file, if present."""
    csv = path.with_suffix(".csv")
    if not csv.is_file():
        csv = DATA_DIR / f"{path.stem.rsplit('_', 1)[0]}.csv"
    if not csv.is_file():
        print("  [No ground-truth CSV found]")
        return
    print(f"  [Ground truth CSV: {csv.name}]")
    print("  " + "-" * 60)
    for line in csv.read_text(encoding="utf-8", errors="replace").splitlines()[:20]:
        print(f"  | {line}")
    print("  " + "-" * 60)


def show_extraction(order) -> None:
    """Pretty-print an ExtractedOrder for visual inspection."""
    print(f"  customer_hint : {order.customer_hint!r}")
    print(f"  delivery_note : {order.delivery_note!r}")
    head = order.raw_text[:200]
    suffix = "..." if len(order.raw_text) > 200 else ""
    print(f"  raw_text      : {head!r}{suffix}")
    print(f"  items ({len(order.items)}):")
    for i, item in enumerate(order.items, 1):
        print(
            f"    {i:>2}. raw_text={item.raw_text!r:<45} "
            f"qty={item.quantity} unit={item.unit_hint!r} "
            f"notes={item.notes!r}"
        )


def run_one(extractor: GeminiOrderExtractor, path: Path) -> None:
    """Run extraction on a single sample file."""
    mime = detect_mime(path)
    if mime == "text/plain" or path.suffix.lower() == ".txt":
        order = extractor.extract(
            text=path.read_text(encoding="utf-8", errors="replace")
        )
    else:
        order = extractor.extract(file_bytes=path.read_bytes(), mime_type=mime)
    show_extraction(order)


def main() -> None:
    extractor = GeminiOrderExtractor()
    print(f"Live: {extractor.live_enabled}   Model: {extractor.model}\n")

    for idx, fname in enumerate(SAMPLES, 1):
        path = DATA_DIR / fname
        print("=" * 78)
        print(f"[{idx:>2}/{len(SAMPLES)}] {fname}")
        print("=" * 78)
        if not path.is_file():
            print(f"  !! Missing file: {path}")
            continue
        show_ground_truth(path)
        try:
            run_one(extractor, path)
        except Exception as exc:
            print(f"  !! Extraction failed: {type(exc).__name__}: {exc}")
        print()


if __name__ == "__main__":
    main()
