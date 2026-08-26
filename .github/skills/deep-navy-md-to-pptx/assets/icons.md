# 아이콘 (assets/icons)

Font Awesome 계열 아이콘 **43종**을 SVG 로 동봉했다. 런타임 의존성이 없으므로
스킬 폴더만 복사해도 아이콘이 그대로 나온다.

스펙에서는 파일명(확장자 제외)을 `icon` 값으로 쓴다.

```js
{ icon: "shield", title: "Responsible AI", desc: "..." }
```

## 고르는 기준

**의미가 맞을 때만 넣는다.** 장식용으로 아무 아이콘이나 붙이면 신뢰가 깎인다.
맞는 게 없으면 아이콘을 빼는 편이 낫다(`icon` 을 생략하면 된다).

## 목록

| 주제 | 키 |
|---|---|
| AI · 모델 | `brain` `robot` `magic` `flask` `bulb` |
| 데이터 | `db` `server` `cubes` `layers` `stream` |
| 보안 · 거버넌스 | `shield` `lock` `key` `usershield` `eye` `clipboard` `balance` |
| 아키텍처 · 통합 | `diagram` `sitemap` `network` `plug` `route` `cloud` |
| 개발 | `code` `github` `tools` `cogs` `bolt` |
| 사람 · 조직 | `users` `comments` `handshake` `building` |
| 성과 · 방향 | `chart` `check` `star` `rocket` `compass` `clock` |
| 브랜드 | `microsoft` `windows` |
| 기타 | `search` `warn` `question` |

## 색조(톤)

색은 `assets/theme.js` 의 `iconTones` 가 정한다. 스펙에서 직접 지정하지 않고
레이아웃이 배경에 맞춰 자동으로 고른다.

| 톤 | 색 | 쓰이는 곳 |
|---|---|---|
| `w` | WHITE | 어두운 원형 배경 위 (표지·간지·강조 밴드) |
| `n` | NAVY | 밝은 ICE 원형 배경 위 (카드·목록) |
| `m` | MID | 보조 |
| `a` | ACCENT | 강조 |

## 아이콘 추가하기

1. SVG 를 `assets/icons/<키>.svg` 로 저장한다.
2. 색이 바뀌어야 하므로 `fill`/`stroke` 를 **`currentColor`** 로 둔다.
   (고정 색으로 두면 톤 전환이 먹지 않는다.)
3. `viewBox` 를 반드시 포함한다. 정사각형 비율을 권장한다.

빌드가 자동으로 인식한다. 별도 등록 절차는 없다.
