// theme.js — 덱 디자인 토큰 (스크롤덱 스킬의 deck.css 에 대응)
//
// 이 파일 하나가 덱의 색·폰트·형태를 결정한다. 테마를 바꾸려면 여기만 고친다.
// scripts/build-pptx.js 는 이 값을 읽어 슬라이드를 그린다.

// ---------- 팔레트 ----------
// DARK/NAVY/MID : 딥네이비 3단계. 표지·구분·강조 배경.
// SKY/ICE/ICE2  : 밝은 파랑 3단계. 어두운 배경 위 보조 텍스트, 카드 배경.
// BG            : 본문 슬라이드 바탕.
// ACCENT/ACCENT2: 코발트 강조. 진행 표시줄·아이콘·밑줄.
// GOLD/GREEN    : Preview / GA 배지 전용. 다른 용도로 쓰지 말 것.
// TEXT/MUTED/LINE/SUBLT : 본문·보조 텍스트·구분선.
const palette = {
  DARK: "0F2547", NAVY: "1A3D6D", MID: "2F5B93", SKY: "7AA5D6",
  ICE: "DBE7F6", ICE2: "EEF4FB", BG: "F5F8FC",
  ACCENT: "4F8FB6", ACCENT2: "6FA9CC", GOLD: "F5B841", GREEN: "2E9E6B",
  TEXT: "1B2A41", MUTED: "5F708A", LINE: "D4E0F0", WHITE: "FFFFFF", SUBLT: "C7D8EC",
};

// ---------- 타이포그래피 ----------
// macOS 기준 Apple SD Gothic Neo. Windows 에서는 자동으로 맑은 고딕으로 대체된다.
// 한글 폰트를 바꾸려면 body/heading 을 같이 바꿔 톤을 맞출 것.
const font = {
  body: "Apple SD Gothic Neo",
  heading: "Apple SD Gothic Neo",
};

// ---------- 무대 규격 ----------
// 16:9 와이드. 인치 단위(pptxgenjs 기본).
const stage = { w: 13.333, h: 7.5 };

// ---------- 그림자 기본값 ----------
const shadow = {
  type: "outer", color: "1A2A44", opacity: 0.22, blur: 8, offset: 3, angle: 90,
};

// ---------- 아이콘 톤 ----------
// icon("cloud","w") 처럼 톤 키로 색을 고른다. 값은 palette 키 이름.
// 톤을 추가하면 assets/icons 의 모든 SVG 가 그 색으로도 준비된다.
const iconTones = {
  w: "WHITE",   // 어두운 원형 배경 위
  n: "NAVY",    // 밝은(ICE) 원형 배경 위
  m: "MID",
  a: "ACCENT",
};

// ---------- 상단 진행 표시줄 ----------
// 덱을 몇 개 파트로 나눌지. 슬라이드 스펙의 part 값(1..parts)이 현재 구간을 켠다.
const progress = { parts: 4, height: 0.075, gap: 0.05 };

module.exports = { palette, font, stage, shadow, iconTones, progress };
