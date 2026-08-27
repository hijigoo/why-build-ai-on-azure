#!/bin/bash
# Open a PPTX in real PowerPoint and report whether it loaded clean.
#
# Why this exists: schema validity does not predict whether PowerPoint accepts a
# file. A change made purely to satisfy the XSD is what produced the
# "presentation needs repair" dialog in the build this skill came from. Opening
# it is the only authority. Use check_pptx.py for the deterministic, CI-able
# part; use this for the gate that actually matters.
#
# How it decides, and why this way:
#
#   The obvious approach -- ask PowerPoint over its AppleScript object model --
#   does not work, and failed repeatedly before this script was written. A modal
#   dialog blocks the very queries you would use to detect that modal, so a
#   broken file and a busy app are indistinguishable. Worse, `active
#   presentation` can answer from a stale document, which once reported 13
#   slides for an 11-slide file. Both false passes and false failures on the
#   same bytes.
#
#   The accessibility layer does not have that problem. System Events reads the
#   window list from outside the app, so a modal cannot hide itself -- it is
#   exactly what shows up. A repair prompt is an AXDialog window, or a sheet
#   attached to the document window. A clean load is one AXStandardWindow with
#   zero sheets.
#
#   So: detect modals from outside first. Only once that comes back clean is the
#   object model safe to ask -- and then it is worth asking, because
#   PowerPoint's own effect count proves the timing block survived parsing,
#   which check_pptx.py cannot prove (it only sees that the XML is present).
#
# Usage: ppt_open_test.sh deck.pptx
# macOS with Microsoft PowerPoint installed only.
#
# Exit: 0 accepted, 1 rejected/animations lost, 2 usage, 3 could not decide.

set -uo pipefail

if [ $# -lt 1 ]; then
  echo "usage: ppt_open_test.sh deck.pptx"
  exit 2
fi

f="$1"
[ -f "$f" ] || { echo "not found: $f"; exit 2; }
base="$(basename "$f")"

# Start from a genuinely clean app state. This matters more than it looks: a
# rejected file leaves PowerPoint holding a "<name> - 복구됨 / Repaired" window,
# and a polite `quit` cannot always dismiss it because the repair prompt is a
# system alert. The next run then reads the *previous* document and answers
# about the wrong file. Observed in practice, which is why this escalates.
osascript -e "tell application \"Microsoft PowerPoint\"
  if it is running then
    repeat with p in (every presentation)
      if name of p is \"${base}\" then close p saving no
    end repeat
  end if
end tell" >/dev/null 2>&1
sleep 3

# Only the previous copy of *this* file is closed, not every open document.
# Closing everything was tried and backfired: with zero documents left the app
# stops materialising windows for subsequent opens, so a good file reads as a
# refusal. The window-identity assertion further down is what actually protects
# against answering about a stale document, so the blunt reset buys nothing.
#
# Force-killing was tried too, and is worse -- it leaves PowerPoint unable to
# open anything at all until it is quit by hand.

# A stale lock file makes PowerPoint open read-only or prompt.
rm -f "$(dirname "$f")/~\$${base}" 2>/dev/null

stem="${base%.*}"
read_windows() {
  osascript -e '
tell application "System Events"
  if not (exists process "Microsoft PowerPoint") then return "ERR:not running"
  tell process "Microsoft PowerPoint"
    set out to ""
    repeat with w in windows
      set sub to "?"
      try
        set sub to (value of attribute "AXSubrole" of w) as string
      end try
      set nsheet to 0
      try
        set nsheet to count of sheets of w
      end try
      set out to out & sub & "|" & (name of w) & "|" & (nsheet as string) & linefeed
    end repeat
    if out is "" then set out to "NONE"
    return out
  end tell
end tell' 2>&1
}

perm_problem() {
  [[ "$1" == *"-1719"* || "$1" == *"assistive"* || "$1" == *"not allowed"* ]]
}

# --- 1. Wait for a verdict, from outside the app ------------------------------
# Poll rather than sleep a fixed amount. A cold start can take well over half a
# minute, and a fixed wait short enough to be tolerable will call a perfectly
# good deck rejected -- the worst failure this script can have, because it sends
# you hunting a bug that is not there.
#
# "No windows at all" is deliberately NOT treated as a verdict on the first
# attempt: it is also what a dropped launch request looks like. Only a result
# that survives a second, warm open is trusted.
windows=""
for attempt in 1 2; do
  echo "Opening ${base} in PowerPoint… (attempt ${attempt})"
  # Hand the file to PowerPoint directly rather than via `open -a`. Measured
  # difference: after the app has been in a bad state, `open -a` launches it but
  # silently drops the document, leaving zero windows and no way to tell that
  # apart from a refusal. The object model open actually delivers the file.
  osascript -e "tell application \"Microsoft PowerPoint\"
    activate
    open POSIX file \"$(cd "$(dirname "$f")" && pwd)/${base}\"
  end tell" >/dev/null 2>&1
  deadline=$(( $(date +%s) + 75 ))
  while [ "$(date +%s)" -lt "$deadline" ]; do
    windows=$(read_windows)
    perm_problem "$windows" && break
    # Our document showed up, or a dialog did: either way we can decide now.
    if echo "$windows" | awk -F'|' -v s="$stem" 'NF>=3 && index($2, s)==1 {exit 0} END {exit 1}'; then
      break
    fi
    if echo "$windows" | grep -qi 'AXDialog\|AXSystemDialog'; then
      break
    fi
    sleep 3
  done
  perm_problem "$windows" && break
  # Anything other than "the app is sitting there with nothing open" is a real
  # answer; stop retrying.
  [[ "$windows" == "NONE" || "$windows" == "ERR:"* ]] || break
  sleep 4
done

if perm_problem "$windows"; then
  cat <<'EOF'

  Cannot read the window list: this terminal lacks Accessibility permission.
  Grant it under System Settings > Privacy & Security > Accessibility, or read
  the screen yourself:

    Repair dialog  -> REJECTED. See the bisect hint below.
    Opens normally -> confirm Animations > Animation Pane is not empty.

EOF
  exit 3
fi

echo "$windows" | grep -v '^$' | sed 's/^/  window: /'

# The window title must belong to the file we asked for. Without this the check
# is worthless: a leftover document answers happily and you "verify" the wrong
# bytes. PowerPoint titles the window with the basename, extension dropped.
ours=$(echo "$windows" | awk -F'|' -v s="$stem" 'NF>=3 && index($2, s)==1')

# A rejection is only ever claimed on positive evidence -- a dialog, a repaired
# title, a modal sheet. "Nothing showed up" is NOT evidence: PowerPoint can sit
# there with no windows for reasons that have nothing to do with the file, and
# calling that a rejection sends you hunting a bug that does not exist. That
# failure mode is worse than admitting the run was inconclusive.
if [[ "$windows" == "ERR:"* || "$windows" == "NONE" ]]; then
  cat <<EOF
INCONCLUSIVE: PowerPoint opened no window at all.
That is not proof the file is bad -- the app itself may be wedged. Quit
PowerPoint by hand, reopen it, and run this again. If it still shows nothing,
open ${base} yourself and read the screen.
EOF
  exit 3
elif [ -z "$ours" ]; then
  cat <<EOF
INCONCLUSIVE: a window is open, but none of them belong to ${base}.
The open request probably never reached the app. Try again with PowerPoint
already running and idle.
EOF
  exit 3
elif echo "$ours" | grep -qi '복구\|repair\|recover'; then
  echo "REJECTED: PowerPoint opened it only after repairing it."
  bisect=1
elif echo "$windows" | grep -qi 'AXDialog\|AXSystemDialog'; then
  echo "REJECTED: PowerPoint raised a modal dialog (almost certainly the repair prompt)."
  bisect=1
elif echo "$ours" | awk -F'|' '$3+0 > 0 {found=1} END {exit !found}'; then
  echo "REJECTED: a modal sheet is attached to the document window."
  bisect=1
else
  bisect=0
fi

if [ "$bisect" = 1 ]; then
  cat <<'EOF'

  Bisect with:
    python3 add_animations.py --no-anim deck.pptx manifest.json
  which keeps the OOXML fixes but drops the timing block. If --no-anim opens,
  the timing is at fault. If it still fails, the generator or some other
  post-process step is -- and check you are not rewriting ppt/presentation.xml,
  which is the one file that must be left exactly as pptxgenjs wrote it.

EOF
  exit 1
fi

# --- 2. No modal, so the object model is safe to ask --------------------------
counts=$(osascript -e "
tell application \"Microsoft PowerPoint\"
  set p to presentation \"${base}\"
  set n to count of slides of p
  set tot to 0
  repeat with i from 1 to n
    set tot to tot + (count of (every effect of main sequence of timeline of slide i of p))
  end repeat
  return (n as string) & \" \" & (tot as string)
end tell" 2>&1)

if [[ ! "$counts" =~ ^[0-9]+\ [0-9]+$ ]]; then
  echo "Opened clean (no modal), but could not read slide/effect counts:"
  echo "  $counts"
  echo "Confirm by eye: Animations > Animation Pane on a content slide."
  exit 3
fi

slides=${counts% *}
effects=${counts#* }
echo "PowerPoint parsed: slides=${slides} effects=${effects}"

if [ "$effects" -eq 0 ]; then
  echo "REJECTED: the deck opens, but PowerPoint dropped every animation."
  echo "The timing block is being silently discarded -- see animation.md."
  exit 1
fi

echo "ACCEPTED: opens clean and animations survived."
