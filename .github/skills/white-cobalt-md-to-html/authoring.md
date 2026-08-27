# Phase 1 — The markdown slide script

A deck starts as a written script, not as slides. The script is the artefact
people review, argue about, and rehearse from; the HTML is a rendering of it.
Keep the script as the source of truth and regenerate the deck from it.

## The convention

One `##` heading per slide. Everything under it belongs to that slide.

````markdown
## S5 — 피드백 반영 (2:40–3:20) `①②`

### 5주 동안, 고객 피드백대로 계속 다시 만들었습니다

기능을 더한 게 아니라 고객이 실제로 쓰는 방식과 언어에 맞췄습니다

| 영역 | 처음 만든 것 | 피드백 후 |
|---|---|---|
| **사용 경로** | Teams에서 파일 업로드 | **M365 Copilot 드래그앤드롭** |

> **스크립트**
> "5주 동안 피드백을 다섯 번 반영했는데, 바꾼 건 대부분 기능 추가가 아니라
> 고객이 쓰는 방식이었습니다."

⏱️ **40초 방어선** · 표는 훑고 상위 2개만 말로 설명

**디자인 메모** · 좌(처음) 흐리게 / 우(피드백 후) 강조. 카드 대신 얇은 구분선.
````

| Element | Becomes |
| --- | --- |
| `## S5 — 라벨 (2:40–3:20)` | Slide boundary. Label → `.sec`, timing → notes only |
| `` `①②` `` | `data-stage="1,2"` — which journey beats this slide belongs to |
| `### ...` | The slide headline (`<h2>`) |
| Plain paragraph after it | `.subtitle` |
| `> **스크립트**` block | `.slide-notes` — presenter notes, never rendered on the slide |
| `⏱️` / `**디자인 메모**` | Authoring instructions to you. They inform the build; they never appear in the deck |
| Tables, lists, quotes | Layout content — see [layouts.md](layouts.md) |

## Timings and stage markers live in notes, not on the slide

`(2:40–3:20)` tells you how much content the slide can carry. It does not go on
the slide — the audience does not need the run-of-show. Put it at the top of
`.slide-notes` so the presenter sees it in the `N` panel:

```html
<div class="slide-notes">[2:40–3:20] ※ 40초 방어선 — 표는 훑고 상위 2개만 설명.
5주 동안 피드백을 다섯 번 반영했는데...</div>
```

The `data-stage` attribute is different: it *does* render, as filled journey
markers in the top bar, so the audience can see where they are in a long
narrative. The controller generates the markers from the attribute — do not
hand-write them.

## Let the timing set the content budget

Roughly 55 seconds per slide at a normal speaking pace. A slide with a 40-second
budget cannot carry a 5-row table *and* a takeaway band *and* a chip list. It
can carry the table, with the presenter skimming it.

When the script's own notes say "훑고 넘어가기" or "줄여도 되는 곳", that is a
direct instruction: build that slide lighter than the ones marked "줄이면 안
되는 곳".

## Writing the notes

Notes carry the full spoken script, not a summary. They are what the presenter
actually reads at 5pm on a Friday, so include:

- the timing marker and any pacing warning
- the full spoken text, in the presenter's own voice
- production to-dos in brackets: `[제작 메모] 리포트 캡처(마스킹) 추가할 것`

`white-cobalt-html-to-pptx` carries `.slide-notes` straight through into the
PowerPoint notes pane, so anything you put here survives the port.

## Keep the script and the deck in sync

When the deck changes, update the markdown too. The pattern that works:

- **Design decisions** → a "덱 공통 디자인 원칙" section in the script, with the
  *reason*. "배경 장식 없음 — 한글 대형 타이포와 배경 선이 겹쳐 획을 침범"
  survives a month; "배경 장식 없음" alone gets re-litigated.
- **Content decisions** → a changelog entry recording what changed and why.

Without this the markdown decays into a stale first draft and the HTML becomes
the real source, which is much harder to edit and review.

## Redaction

Presentation scripts routinely carry customer material that must not be shown.
Keep an explicit masking table in the source markdown and apply it when
building — real names → role labels, partner names → "파트너사", competitor
products → "기존 접근". Quote customers anonymously.

Check for this before building, not after the deck has been shared.
