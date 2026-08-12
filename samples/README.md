# 샘플 덱

`markdown-to-scroll-deck` 스킬로 만든 예시 문서 모음입니다.
스킬의 워크플로와 결과물이 어떤 모습인지 확인하는 용도입니다.

| 폴더 | 주제 | 분량 |
|---|---|---|
| [`foundry-network-isolation/`](./foundry-network-isolation/) | Microsoft Foundry 네트워크 격리 | 19장 |

저장소 루트의 **Why Build AI on Azure?**(49장)도 같은 스킬로 만든 문서입니다.
스킬 소개와 사용법은 [최상위 README](../README.md)를 참고하세요.

## 각 폴더의 구성

```
<주제>/
├── <주제>.md        원고 — 공식 문서로 사실 확인하며 작성
├── slides.html      슬라이드 조각 — 패턴을 복사해 내용만 교체
└── <주제>.html      완성 문서 — build.py가 조립, 브라우저에서 바로 열림
```

`slides.html`을 고친 뒤 다시 빌드하면 완성 문서가 갱신됩니다.

```bash
python3 ../../.github/skills/markdown-to-scroll-deck/scripts/build.py slides.html \
  -o <주제>.html --title "..." --h1 "..." --kicker "..."
```

빌드 후에는 검증을 거칩니다. 내용 넘침은 화면으로 보이지 않아 스크립트로 잡아야 합니다.

```bash
node ../../.github/skills/markdown-to-scroll-deck/scripts/verify.js <url> --density
```
