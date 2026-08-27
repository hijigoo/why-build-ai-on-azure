# 샘플 덱

스킬로 만든 예시 문서 모음입니다.
스킬의 워크플로와 결과물이 어떤 모습인지 확인하는 용도입니다.

| 폴더 | 주제 | 분량 | 만든 스킬 |
|---|---|---|---|
| [`foundry-network-isolation/`](./foundry-network-isolation/) | Microsoft Foundry 네트워크 격리 | 19장 | `deep-navy-md-to-html` |
| [`github-offering/`](./github-offering/) | GitHub Copilot Offering — 모델 · 에이전트 · SDLC · 거버넌스 · 도입 | 21장 | `white-cobalt-md-to-html` |

저장소 루트의 **Why Build AI on Azure?**(36장)는 `deep-navy-md-to-html` 로 만든 문서입니다.
스킬 소개와 사용법은 [최상위 README](../README.md)를 참고하세요.

## Deep Navy 샘플의 구성

```
<주제>/
├── <주제>.md        원고 — 공식 문서로 사실 확인하며 작성
├── slides.html      슬라이드 조각 — 패턴을 복사해 내용만 교체
└── <주제>.html      완성 문서 — build.py가 조립, 브라우저에서 바로 열림
```

`slides.html`을 고친 뒤 다시 빌드하면 완성 문서가 갱신됩니다.

```bash
python3 ../../.github/skills/deep-navy-md-to-html/scripts/build.py slides.html \
  -o <주제>.html --title "..." --h1 "..." --kicker "..."
```

빌드 후에는 검증을 거칩니다. 내용 넘침은 화면으로 보이지 않아 스크립트로 잡아야 합니다.

```bash
node ../../.github/skills/deep-navy-md-to-html/scripts/verify.js <url> --density
```

## Blue Accent 샘플의 구성

`github-offering/` 은 원고에서 HTML 을 바로 만들고, 그 HTML 을 PPTX 로 옮기는 구성입니다.
중간 조각 파일 없이 원고가 곧 소스입니다.

```
copilot-offering.md  →  copilot-offering.html  →  copilot-offering.pptx
  (원고)                 (white-cobalt-md-to-html)   (build/ 파이프라인)
```

발표자 노트는 HTML 의 `.slide-notes` 에 들어 있고, PPTX 로 옮길 때 그대로 넘어갑니다.
PPTX 빌드는 [`github-offering/build/README.md`](./github-offering/build/) 를 참고하세요 —
애니메이션 주입과 노트 줄바꿈 복원까지 **세 단계를 순서대로** 실행해야 합니다.
