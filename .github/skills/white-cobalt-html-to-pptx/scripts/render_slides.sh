#!/bin/bash
# Render a PPTX to one JPG per slide for visual QA.
#
# Note on fonts: LibreOffice substitutes missing fonts unpredictably, so Korean
# text can render with the wrong weight or absurd tracking even when the file is
# correct. Rebuild with DECK_SANS / DECK_LATIN set to a locally installed font
# before concluding the deck has a typography bug.
#
# Usage: render_slides.sh deck.pptx [outdir] [dpi]

set -euo pipefail

deck="${1:?usage: render_slides.sh deck.pptx [outdir] [dpi]}"
out="${2:-/tmp/deck-qa}"
dpi="${3:-110}"

[ -f "$deck" ] || { echo "not found: $deck"; exit 2; }
command -v soffice  >/dev/null || { echo "needs LibreOffice (soffice)"; exit 2; }
command -v pdftoppm >/dev/null || { echo "needs Poppler (pdftoppm)"; exit 2; }

rm -rf "$out"
mkdir -p "$out"
cp "$deck" "$out/deck.pptx"

soffice --headless --convert-to pdf "$out/deck.pptx" --outdir "$out" >/dev/null 2>&1
[ -f "$out/deck.pdf" ] || { echo "PDF conversion failed"; exit 1; }

pdftoppm -jpeg -r "$dpi" "$out/deck.pdf" "$out/slide"

echo "Rendered $(ls "$out"/slide-*.jpg | wc -l | tr -d ' ') slides to $out"
ls "$out"/slide-*.jpg
