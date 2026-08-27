# PPTX 빌드 파이프라인

`copilot-offering.html` 과 **같은 디자인·같은 애니메이션**의 `.pptx` 를 만드는 스크립트입니다.
[`blue-accent-html-to-pptx`](https://github.com/) 스킬의 워크플로를 이 덱에 맞춰 구현한 것입니다.

## 빌드

세 단계를 **순서대로** 실행합니다. 중간 단계를 건너뛰면 조용히 깨집니다.

```bash
cd samples/github-offering

node build/make-deck.js                                          # 1. 슬라이드 생성
python3 build/add_animations.py copilot-offering.pptx \
        build/anim-manifest.json                                 # 2. 애니메이션 주입
python3 build/fix_notes.py copilot-offering.pptx                 # 3. 노트 줄바꿈 복원
```

검증:

```bash
python3 build/check_pptx.py copilot-offering.pptx   # 구조 검증
node build/audit_fit.js                             # 텍스트 넘침 감사
```

## 3단계를 반드시 실행해야 하는 이유

pptxgenjs 는 `addNotes()` 문자열에 개행이 있으면 **노트 전체를 조용히 버립니다.**
경고도 없습니다. 그래서 생성기는 개행을 sentinel(`\u2424`)로 바꿔 넣고,
`fix_notes.py` 가 그것을 실제 `<a:br/>` 로 되돌립니다.

이 단계를 빠뜨리면 발표자 노트에 `␤` 문자가 그대로 보입니다.
(수직 탭 `0x0B` 로 대체하려 하지 마세요 — XML 1.0 비적법 문자라 PowerPoint 가 파일을 거부합니다.)

## 파일

| 파일 | 역할 |
|---|---|
| `make-deck.js` | 슬라이드 생성기. 좌표는 **stage 픽셀**(1920×1080)로 쓰고 `px()` 가 한 번만 변환합니다 |
| `add_animations.py` | `p:timing` 등장 애니메이션 주입 |
| `fix_notes.py` | 노트 줄바꿈 복원 (**필수**) |
| `check_pptx.py` | OOXML 구조 검증 |
| `audit_fit.js` | 텍스트가 상자를 넘치는지 감사 |

`anim-manifest.json` 은 `make-deck.js` 가 만드는 **빌드 산출물**이라 저장소에 두지 않습니다.

## 원고를 고쳤다면

`copilot-offering.md` → `copilot-offering.html` → **여기** 순서입니다.
발표자 노트는 HTML 의 `.slide-notes` 에서 읽어오므로, HTML 을 먼저 갱신해야
노트가 함께 따라옵니다.

## 경로 재지정

```bash
DECK_HTML=other.html DECK_OUT=other.pptx node build/make-deck.js
```
