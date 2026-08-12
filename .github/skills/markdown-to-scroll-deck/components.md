# 컴포넌트

`.s-body` 안에 넣는다. 모두 `deck.css`에 정의되어 있다.

**공통 규칙** — 세로 구분선을 쓰지 않는다. 강조는 상단 액센트 바와 가로 헤어라인으로만 한다.

---

## 1. 카드 그리드

3~6개 항목을 병렬로 보여줄 때. 가장 많이 쓴다.

```html
<div class="grid g3 stagger">
  <div class="card">
    <div class="cn">라벨</div>
    <h3 class="sm">카드 제목</h3>
    <p>한두 문장 설명. <b>강조</b>는 이렇게.</p>
    <div class="svc">관련 서비스 · 이름</div>
  </div>
  <div class="card tone-2"> … </div>
  <div class="card tone-3"> … </div>
</div>
```

- `g2` `g3` `g4` `g5` — 열 수
- `tone-2` `tone-3` `tone-4` — 상단 바 색을 단계적으로 흐리게
- `card solid` — 네이비 채움 (강조 카드)
- `h3` 기본 / `h3 class="sm"` 작게
- `.ic-badge` 아이콘을 카드 우상단에 워터마크로 배치 가능

**항목 수 가이드** — g3는 3~6개, g4는 4~8개. 그 이상이면 표나 리스트를 쓴다.

---

## 2. 리스트

번호 + 제목 + 설명. 순서가 있는 항목에 쓴다.

```html
<div class="list stagger">
  <div class="li">
    <div class="b">01</div>
    <div class="tx">
      <div class="t">항목 제목</div>
      <div class="d">설명 한 줄. <b>강조</b> 포함.</div>
    </div>
  </div>
</div>
```

- `list tight` — 항목 5~6개일 때
- `list xtight` — 항목 7개 이상일 때

---

## 3. 표

비교·매핑에 쓴다. 세로선은 없다.

```html
<table class="tbl reveal r3">
  <colgroup><col style="width:24%"><col style="width:38%"><col style="width:38%"></colgroup>
  <thead><tr><th>구분</th><th>항목</th><th>설명</th></tr></thead>
  <tbody>
    <tr><td><strong>행 제목</strong></td><td>내용</td><td>내용<span class="sub">부연은 이렇게</span></td></tr>
  </tbody>
</table>
```

- `tbl sm` — 행이 6개 이상일 때
- `<td class="c">` — 가운데 정렬
- `<span class="sub">` — 셀 안 작은 부연

**행 수 가이드** — 기본 5행, `sm`으로 8행까지. 그 이상은 슬라이드를 나눈다.

---

## 4. 가로 흐름

단계·프로세스를 보여줄 때.

```html
<div class="flow stagger">
  <div class="fnode"><div class="fn-n">STEP 1</div><div class="fn-t">단계 이름</div>
    <div class="fn-d">보조 설명</div></div>
  <div class="farrow"></div>
  <div class="fnode acc"> … </div>
  <div class="farrow"></div>
  <div class="fnode end"> … </div>
</div>
```

- `acc` — 강조 노드 / `end` — 마지막(네이비 채움) 노드
- `fn-t sm` — 제목 작게
- `<div class="farrow"><span class="lb">전환 라벨</span></div>` — 화살표 위 라벨

**노드 수** — 3~5개. 6개 이상이면 좁아서 읽기 어렵다.

---

## 5. 세로 스택 (계층)

아키텍처 계층처럼 아래에서 위로 쌓이는 구조.

```html
<div class="stack stagger">
  <div class="layer">
    <span class="lx">06</span>
    <span class="ln">계층 이름</span>
    <span class="ld">역할 설명</span>
    <span class="lsvc">관련 서비스</span>
  </div>
  <div class="vsep">▼ 전환 설명</div>
  <div class="layer hot"> … </div>   <!-- hot = 강조 -->
</div>
```

---

## 6. 콜아웃

한 줄 결론이나 주의사항.

```html
<div class="callout reveal r6" style="margin-top:36px">
  <b>핵심</b> — 강조하고 싶은 결론 한 문장.
</div>
```

- 기본(코발트) / `callout warn`(주의) / `callout plain`(중립)

---

## 7. 두 칼럼

```html
<div class="cols">
  <div class="c1">
    <div class="colhead">왼쪽 제목</div>
    … 컴포넌트 …
  </div>
  <div class="c2">
    <div class="colhead">오른쪽 제목</div>
    … 컴포넌트 …
  </div>
</div>
```

- `cols w6-4` / `cols w4-6` — 6:4, 4:6 비율

---

## 8. 통계 / KPI

```html
<div class="stats reveal r4">
  <div class="stat"><div class="k">라벨</div><div class="v">값 <i>강조</i></div>
    <div class="sd">보조 설명</div></div>
</div>
```

---

## 9. 배지

성숙도·상태 표시.

```html
<span class="badge ga">GA</span>      <!-- 초록: 정식 출시 -->
<span class="badge pv">Preview</span> <!-- 주황: 미리보기 -->
<span class="badge nb">낮음</span>     <!-- 파랑: 중립 -->
```

---

## 10. 인용 / 선언

마무리 슬라이드용. `.slide dark`와 함께 쓴다.

```html
<p class="quote reveal r2">
  한 문장으로 정리한<br><span class="hl">핵심 메시지</span>.
</p>
```

---

## 밀도 기준

한 슬라이드의 본문 글자 수는 **400~500자**가 적당하다. 600자를 넘으면 압축을 검토한다.

```bash
# 슬라이드별 글자 수 확인 (verify.js가 함께 출력한다)
node .github/skills/markdown-to-scroll-deck/scripts/verify.js <url> --density
```

넘칠 때 순서:
1. 문장을 짧게 (부연을 설명란으로)
2. 표 셀·카드 불릿을 줄임
3. `tight` / `xtight` / `sm` 변형 적용
4. 슬라이드를 두 장으로 분리

**폰트 크기를 줄이는 것은 최후의 수단이다.**
