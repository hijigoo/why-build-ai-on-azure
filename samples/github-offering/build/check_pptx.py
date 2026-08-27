#!/usr/bin/env python3
"""Validate a generated PPTX against the ISO-29500 schemas.

The pptx skill's own validator only checks a handful of parts and silently
passes malformed slide XML — a broken <p:timing> block sailed through it and
straight into PowerPoint's "presentation needs repair" dialog. This checks
every XML part in the package instead.

Usage: python3 build/check_pptx.py deck.pptx [deck2.pptx ...]
Requires lxml:  pip install lxml
"""

from __future__ import annotations

import os
import re
import sys
import zipfile

try:
    from lxml import etree
except ImportError:  # pragma: no cover
    sys.exit("check_pptx.py needs lxml — install it with: pip install lxml")

SCHEMA_DIR = os.path.expanduser(
    "~/.copilot/skills/pptx/scripts/office/schemas/ISO-IEC29500-4_2016"
)

# Which schema owns which part of the package.
PARTS = [
    (re.compile(r"^ppt/slides/slide\d+\.xml$"), "pml.xsd"),
    (re.compile(r"^ppt/slideLayouts/slideLayout\d+\.xml$"), "pml.xsd"),
    (re.compile(r"^ppt/slideMasters/slideMaster\d+\.xml$"), "pml.xsd"),
    (re.compile(r"^ppt/notesSlides/notesSlide\d+\.xml$"), "pml.xsd"),
    (re.compile(r"^ppt/notesMasters/notesMaster\d+\.xml$"), "pml.xsd"),
    (re.compile(r"^ppt/presentation\.xml$"), "pml.xsd"),
    (re.compile(r"^ppt/theme/theme\d+\.xml$"), "dml-main.xsd"),
]


def schema_for(name: str):
    for pattern, xsd in PARTS:
        if pattern.match(name):
            return xsd
    return None


# Schema deviations that PowerPoint itself requires. The XSD sequence puts
# notesMasterIdLst before sldIdLst, and pptxgenjs emits it after. "Correcting"
# it to the schema order makes PowerPoint reject the whole package with the
# repair dialog, verified by opening both orders in PowerPoint, so the schema
# loses this argument and the deviation is expected rather than reported.
KNOWN_DEVIATIONS = [
    ("ppt/presentation.xml", "notesMasterIdLst"),
]


def is_known(part: str, message: str) -> bool:
    return any(part == p and token in message for p, token in KNOWN_DEVIATIONS)


def check(path: str) -> int:
    cache: dict[str, etree.XMLSchema] = {}
    package = zipfile.ZipFile(path)
    failures = 0
    waived = 0

    for name in package.namelist():
        xsd = schema_for(name)
        if not xsd:
            continue
        if xsd not in cache:
            cache[xsd] = etree.XMLSchema(etree.parse(os.path.join(SCHEMA_DIR, xsd)))
        schema = cache[xsd]
        try:
            doc = etree.fromstring(package.read(name))
        except etree.XMLSyntaxError as exc:
            print(f"  {name}: not well-formed — {exc}")
            failures += 1
            continue
        if not schema.validate(doc):
            for error in schema.error_log:
                if is_known(name, error.message):
                    waived += 1
                    continue
                print(f"  {name}:{error.line} {error.message}")
                failures += 1

    label = os.path.basename(path)
    note = f" ({waived} known deviation(s) waived)" if waived else ""
    print(f"{label}: {'OK' if not failures else f'{failures} schema error(s)'}{note}")
    return failures


if __name__ == "__main__":
    targets = sys.argv[1:]
    if not targets:
        sys.exit("usage: check_pptx.py deck.pptx [deck2.pptx ...]")
    sys.exit(1 if sum(check(t) for t in targets) else 0)
