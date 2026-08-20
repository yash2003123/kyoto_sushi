#!/usr/bin/env python3
"""
Build the self-hosted font subsets.

Why this exists: Zen Old Mincho and Zen Kaku Gothic New ship with several
hundred CJK subsets each. Pulling them through next/font/google meant 731
@font-face rules — 174KB of render-blocking CSS gzipped — and, with preload on,
8.2MB of font downloads, for a page whose whole purpose is being fast on mobile
data in Leuven.

The site needs Latin plus about a dozen Japanese characters (the noren glyphs
and the course labels). So we subset once, commit the result, and load it with
next/font/local: six @font-face rules and a few hundred KB.

Run after changing the menu data or adding Japanese copy:

    python3 scripts/subset-fonts.py path/to/source-ttfs

Sources are the OFL originals from github.com/google/fonts; they are not
committed, only the subsets they produce.
"""

import pathlib
import re
import sys

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "fonts"

FACES = [
    ("ZenOldMincho-Regular.ttf", "ZenOldMincho-400.woff2"),
    ("ZenOldMincho-Bold.ttf", "ZenOldMincho-700.woff2"),
    ("ZenOldMincho-Black.ttf", "ZenOldMincho-900.woff2"),
    ("ZenKakuGothicNew-Regular.ttf", "ZenKakuGothicNew-400.woff2"),
    ("ZenKakuGothicNew-Medium.ttf", "ZenKakuGothicNew-500.woff2"),
    ("ZenKakuGothicNew-Bold.ttf", "ZenKakuGothicNew-700.woff2"),
]

# Latin-1 plus Latin Extended-A: everything Dutch and French need, with room
# for a customer's name in the order confirmation.
BASE_RANGES = [(0x20, 0x7E), (0xA0, 0xFF), (0x100, 0x17F)]

# Typography and currency the copy actually uses.
EXTRA = "‘’“”–—…·€×→≤≥•⁄"


def used_characters() -> set:
    """Every non-ASCII character appearing in the app's own source and data."""
    found = set()
    for path in (ROOT / "src").rglob("*"):
        if path.suffix not in {".ts", ".tsx", ".json", ".css"}:
            continue
        if "fonts" in path.parts:
            continue
        for char in path.read_text(encoding="utf-8"):
            if ord(char) > 0x7F:
                found.add(char)
    return found


def main() -> int:
    source_dir = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "source-fonts")
    if not source_dir.is_dir():
        print(f"source directory not found: {source_dir}", file=sys.stderr)
        return 1

    codepoints = {c for lo, hi in BASE_RANGES for c in range(lo, hi + 1)}
    codepoints |= {ord(c) for c in EXTRA}
    discovered = used_characters()
    codepoints |= {ord(c) for c in discovered}

    cjk = "".join(sorted(c for c in discovered if ord(c) > 0x2E80))
    print(f"{len(codepoints)} codepoints; Japanese in use: {cjk}")

    OUT.mkdir(parents=True, exist_ok=True)
    total = 0

    for source_name, out_name in FACES:
        source = source_dir / source_name
        if not source.exists():
            print(f"missing {source}", file=sys.stderr)
            return 1

        font = TTFont(source)
        options = subset.Options()
        options.flavor = "woff2"
        options.desubroutinize = True
        options.layout_features = ["kern", "liga", "clig", "calt", "palt", "vert", "vrt2"]
        options.name_IDs = ["*"]
        options.notdef_outline = True
        options.drop_tables += ["DSIG"]

        subsetter = subset.Subsetter(options=options)
        subsetter.populate(unicodes=codepoints)
        subsetter.subset(font)

        destination = OUT / out_name
        font.flavor = "woff2"
        font.save(destination)
        size = destination.stat().st_size
        total += size
        print(f"  {out_name:32} {size / 1024:7.1f} kB")

    print(f"total {total / 1024:.1f} kB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
