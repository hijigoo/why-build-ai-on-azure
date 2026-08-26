// deck.data.js — deep-navy-md-to-pptx 예시 덱 스펙
// build-pptx.js 가 이 파일을 require 해서 .pptx 를 만든다.
//   node ../scripts/build-pptx.js deck.data.js   →  v1-why-build-ai-on-azure.pptx
//
// 각 슬라이드의 kind 별 필드는 PATTERNS.md 참고.
// note 는 발표자 노트(스피커 노트)로 들어간다.

module.exports = {
  title: "Why Build AI on Azure?",   // footer 왼쪽 + 파일명
  file: "why-build-ai-on-azure",
  version: "v1",
  author: "Kim",
  company: "Microsoft",

  cover: {
    icon: "cloud",
    kicker: "Microsoft Azure · Enterprise AI",
    title: "Why Build AI on Azure?",
    subtitle: "Azure 위에서 만드는 신뢰할 수 있는 Enterprise AI Platform",
    subtitle2: "데이터 · 온톨로지 · 에이전트 · 거버넌스를 하나의 스택으로",
    meta: "약 40분 발표 · 6개 완결 서비스 · 6계층 아키텍처",
    note: "안녕하세요. 오늘은 왜 엔터프라이즈 AI를 Azure 위에서 만들어야 하는지를 근거 중심으로 말씀드리겠습니다.",
  },

  slides: [
    {
      kind: "agenda",
      kicker: "Agenda · 오늘의 흐름",
      title: "네 개의 파트로 나눠 이야기합니다",
      items: [
        { n: 1, title: "왜 지금, 왜 Azure인가", desc: "에이전트 시대의 전환 · 4대 신뢰 근거", time: "~14분", icon: "compass" },
        { n: 2, title: "AX 전략과 비즈니스 가치", desc: "AX 3대 전략 · 에이전트 = 디지털 직원", time: "~4분", icon: "chart" },
        { n: 3, title: "Enterprise AI Platform (근거)", desc: "6계층 아키텍처 · Agentic DevOps · Governance", time: "~15분", icon: "layers" },
        { n: 4, title: "실현 — 다음 단계", desc: "역할별 시나리오 · 도입 로드맵 · 요약", time: "~7분", icon: "rocket" },
      ],
      note: "먼저 오늘의 전체 흐름을 안내드립니다. 네 개 파트로, 신뢰에서 시작해 근거로 마무리합니다.",
    },

    {
      kind: "divider", part: 1, label: "Part 1",
      title: "왜 지금, 왜 Azure인가",
      sub: "에이전트 시대의 전환과 신뢰의 근거",
      icon: "compass",
    },

    {
      kind: "cards", part: 1,
      kicker: "1. 왜 Azure인가",
      title: "네 가지 신뢰의 근거",
      intro: "화려한 데모가 아니라, 엔터프라이즈가 실제로 운영할 수 있게 하는 것.",
      cards: [
        { icon: "brain", title: "모델 리더십", desc: "Azure OpenAI · Microsoft Foundry 모델 카탈로그로 프론티어와 오픈 모델을 함께." },
        { icon: "shield", title: "Responsible AI", desc: "Azure AI Content Safety · Microsoft Entra · Microsoft Purview · Microsoft Defender." },
        { icon: "layers", title: "End-to-End 스택", desc: "Microsoft Fabric · OneLake에서 Foundry, Azure Monitor까지 하나로." },
        { icon: "github", title: "개발자 생태계", desc: "이미 쓰는 GitHub 위에서 · GitHub Copilot · Microsoft Foundry." },
      ],
      note: "Azure를 택하는 이유를 네 기둥으로 정리합니다. 각 기둥에는 구체적인 서비스가 있습니다.",
    },

    {
      kind: "table", part: 1,
      kicker: "2. 판단 기준",
      title: "네 가지 기준과 Azure의 답",
      head: ["판단 기준", "질문", "Azure의 답"],
      colW: [3.0, 4.65, 4.5],
      rows: [
        [{ text: "데이터 주권", bold: true }, "우리 데이터는 어디에 머무나?", "테넌트·리전 격리 · 파운데이션 모델 학습 미사용"],
        [{ text: "모델 선택", bold: true }, "한 모델에 종속되나?", "Foundry 카탈로그에서 선택·교체"],
        [{ text: "보안 경계", bold: true }, "AI를 누가 통제하나?", "Entra · Purview · Defender로 관통 통제"],
        [{ text: "운영·관측", bold: true }, "운영을 어떻게 보나?", "Azure Monitor · 평가 · 콘텐츠 안전"],
      ],
      caption: "질문만 던지지 않고, 각 기준에 Azure가 어떻게 답하는지까지 봅니다.",
      note: "고객이 실제로 묻는 여섯 기준을 표로 정리하고 답을 매칭합니다.",
    },

    {
      kind: "divider", part: 3, label: "Part 3",
      title: "Enterprise AI Platform",
      sub: "데이터에서 경험까지, 6계층으로 읽기",
      icon: "layers",
    },

    {
      kind: "flow", part: 3,
      kicker: "데이터의 여정",
      title: "다섯 단계로 이어지는 하나의 스택",
      steps: [
        { icon: "plug", title: "수집", desc: "흩어진 원천을 연결" },
        { icon: "db", title: "통합", desc: "OneLake로 하나의 레이크" },
        { icon: "brain", title: "의미 부여", desc: "온톨로지로 의미화" },
        { icon: "robot", title: "에이전트화", desc: "Foundry로 제작" },
        { icon: "usershield", title: "통제", desc: "Governance로 관측" },
      ],
      caption: "수집에서 통제까지, 끊기지 않는 하나의 흐름 위에서 AI가 운영됩니다.",
      note: "데이터가 어떻게 에이전트가 되고 통제되는지, 여정으로 보여줍니다.",
    },

    {
      kind: "stack", part: 3,
      kicker: "8. 계층 구조",
      title: "위에서 아래로 — 경험에서 데이터까지",
      layers: [
        { icon: "windows", title: "Experience", desc: "Microsoft 365 · Teams에서 바로 쓰는 경험" },
        { icon: "robot", title: "Agents", desc: "업무를 대신 실행하는 디지털 직원" },
        { icon: "cogs", title: "Agent Factory", desc: "Copilot Studio · Foundry로 제작" },
        { icon: "brain", title: "Ontology / IQ", desc: "비즈니스를 이해하는 지능" },
        { icon: "db", title: "Data / OneLake", desc: "흩어진 데이터를 하나로" },
      ],
      note: "같은 스택을 계층으로 다시 봅니다. 위는 경험, 아래는 데이터입니다.",
    },

    {
      kind: "twocol", part: 3,
      kicker: "누가 무엇으로 만드나",
      title: "현업과 개발자, 두 진입점",
      left: {
        icon: "users", title: "현업 · IT",
        items: ["Microsoft Copilot Studio로 로우코드 제작", "업무 지식으로 바로 시작", "거버넌스는 기본 연동"],
      },
      right: {
        icon: "code", title: "개발자 · 데이터 사이언티스트",
        items: ["Microsoft Foundry로 풀 코드", "GitHub에서 협업·배포", "모델·평가·관측 통합"],
      },
      note: "Copilot Studio와 Foundry는 상호운용됩니다. 역할에 따라 진입점이 다를 뿐입니다.",
    },

    {
      kind: "quote", part: 4,
      kicker: "한 문장으로",
      big: "Azure는 데이터·에이전트·거버넌스를 하나의 스택으로 잇는,\n신뢰할 수 있는 Enterprise AI Platform입니다.",
      sub: "제안하는 다음 단계 — 함께 여는 90분 워크숍",
      cards: [
        { title: "후보 업무 1개", desc: "ROI가 크고 데이터가 준비된 워크플로" },
        { title: "데이터·보안 요건", desc: "리전 · 규제 · 민감정보 · ID 기준" },
        { title: "파일럿 스코프·KPI", desc: "GA 서비스로 2~6주 구현 범위" },
      ],
      footnote: "함께할 분  업무 오너 · 데이터 · 보안 · IT     산출물  파일럿 설계서 1장",
      note: "오늘의 결론과 함께, 부담 없는 다음 단계로 90분 기술 워크숍을 제안합니다.",
    },
  ],
};
