# 아이콘

`assets/icon-sprite.html`에 공식 아이콘이 `<symbol>`로 들어 있다. `<use>`로 참조한다.

```html
<svg class="ic" aria-hidden="true"><use href="#az-openai"></use></svg>
```

---

## 제품 → 아이콘 대응표

**이 표를 먼저 본다.** 심볼 이름만 보고 고르면 틀린다(이번에 Fabric에 스토리지 아이콘,
Copilot Studio에 Foundry 아이콘을 잘못 붙인 적이 있다).

| 제품 | 심볼 ID |
|---|---|
| Azure OpenAI | `az-openai` |
| Microsoft Foundry | `az-foundry` |
| Azure AI Search | `az-search` |
| Azure AI Content Safety | `az-safety` |
| Microsoft Entra ID | `az-entra` |
| Microsoft Defender | `az-defender` |
| Microsoft Purview | `az-purview` |
| Azure Data Factory | `az-adf` |
| Azure Monitor | `az-monitor` |
| Cost Management | `az-cost` |
| Private Link · VNet · 망분리 | `az-vnet` |
| Storage Accounts | `az-storage` |
| 데이터 레이크 (일반) | `az-lake` |
| Power Platform | `az-power` |
| 리전 · 데이터 상주 | `az-region` |
| **Microsoft Fabric** | `fab-fabric` |
| **OneLake** | `fab-onelake` |
| **Microsoft Copilot Studio** | `fab-copilot` |
| **Fabric IQ** | `fab-fabric` (Microsoft Fabric 녹색 F) |
| **Work IQ** | `fab-copilot` (Microsoft Copilot 컬러 리본) |
| **Foundry IQ** | `az-foundry` (Microsoft Foundry 리본) |
| 지식 그래프 (일반) | `fab-graphiq` |
| Microsoft 365 Copilot · Agent 365 | `ms-365` |
| GitHub · GitHub Copilot · Actions · Code Security | `gh-mark` |

`gh-mark`는 단색이므로 `ic-gh`를 함께 붙인다 (지면에 따라 색 자동 전환).

```html
<svg class="ic ic-gh" aria-hidden="true"><use href="#gh-mark"></use></svg>
```

---

## 포함된 심볼

| ID | 대상 | 출처 |
|---|---|---|
| `az-openai` | Azure OpenAI | Azure 공식 |
| `az-foundry` | Microsoft Foundry | Azure 공식 |
| `az-search` | Azure AI Search | Azure 공식 |
| `az-safety` | Azure AI Content Safety | Azure 공식 |
| `az-entra` | Microsoft Entra ID | Azure 공식 |
| `az-defender` | Microsoft Defender | Azure 공식 |
| `az-purview` | Microsoft Purview | Azure 공식 |
| `az-adf` | Azure Data Factory | Azure 공식 |
| `az-monitor` | Azure Monitor | Azure 공식 |
| `az-cost` | Cost Management | Azure 공식 |
| `az-vnet` | Private Link / VNet | Azure 공식 |
| `az-storage` | Storage Accounts | Azure 공식 |
| `az-lake` | Data Lake | Azure 공식 |
| `az-power` | Power Platform | Azure 공식 |
| `az-region` | Region Management | Azure 공식 |
| `fab-fabric` | Microsoft Fabric | Fabric 공식 |
| `fab-onelake` | OneLake | Fabric 공식 |
| `fab-copilot` | Copilot / Copilot Studio | Fabric 공식 |
| `fab-graphiq` | Graph Intelligence (Fabric IQ 등) | Fabric 공식 |
| `ms-365` | Microsoft 365 / Agent 365 | 브랜드 로고 |
| `gh-mark` | GitHub / GitHub Copilot | Octicons |

---

## 배치 위치별 클래스

```html
<!-- 카드 제목 앞 -->
<h3 class="sm"><svg class="ic" aria-hidden="true"><use href="#fab-onelake"></use></svg>제목</h3>

<!-- 카드 우상단 워터마크 -->
<div class="card"><svg class="ic ic-badge" aria-hidden="true"><use href="#az-entra"></use></svg>
  <div class="cn">라벨</div><h3 class="sm">제목</h3></div>

<!-- 표 셀 안 -->
<td><svg class="ic" aria-hidden="true"><use href="#az-purview"></use></svg>Microsoft Purview</td>

<!-- 리스트 제목 앞 -->
<div class="t"><svg class="ic" aria-hidden="true"><use href="#az-defender"></use></svg>항목</div>
```

`gh-mark`는 단색(`currentColor`)이라 `ic-gh`를 함께 붙인다. 밝은/어두운 지면에 맞춰 색이 자동 전환된다.

```html
<svg class="ic ic-gh" aria-hidden="true"><use href="#gh-mark"></use></svg>
```

---

## 배치 규칙

1. **의미가 맞을 때만** — Microsoft 365 Copilot에 Azure Monitor 아이콘을 쓰면 안 된다. 없으면 넣지 않는다.
2. **전부 아니면 전무** — 한 표/카드 그룹에서 일부 행에만 아이콘이 있으면 실수처럼 보인다.
3. **개념 슬라이드에는 넣지 않는다** — 표지, 파트 표지, 논지 전개 슬라이드는 그대로 둔다.
4. **한 슬라이드에 아이콘 하나만 외따로 두지 않는다** — 그룹 전체에 적용하거나 빼거나.

---

## 새 아이콘 추가

### 1. 공식 소스에서 SVG 받기

| 제품군 | 소스 |
|---|---|
| Azure 서비스 | `https://arch-center.azureedge.net/icons/Azure_Public_Service_Icons_V21.zip` |
| Microsoft Fabric | `https://github.com/microsoft/fabric-samples/raw/main/docs-samples/Icons.zip` → `v*/package/dist/svg/*_24_color.svg` |
| GitHub | Octicons `mark-github` |

```bash
# Azure 아이콘 세트에서 찾기
cd /tmp && curl -sLO https://arch-center.azureedge.net/icons/Azure_Public_Service_Icons_V21.zip
unzip -q Azure_Public_Service_Icons_V21.zip
find . -iname "*search*" -name "*.svg" | head
```

### 2. 심볼로 변환 — **id 네임스페이싱이 핵심**

원본 SVG들은 서로 같은 gradient id를 쓴다. 한 문서에 그대로 넣으면 **색이 뒤섞인다.**
아래 스크립트가 심볼별로 id를 격리해준다.

```bash
python3 .github/skills/deep-navy-pptx-to-html/scripts/make-symbol.py \
  az-newicon /path/to/icon.svg >> assets/icon-sprite-add.html
```

출력된 `<symbol>`을 `assets/icon-sprite.html`의 첫 `<symbol>` 앞에 붙여 넣는다.

### 3. 확인

```bash
node .github/skills/deep-navy-pptx-to-html/scripts/verify.js <url>
```

`missing icon refs`가 0인지 본다. 참조가 깨져도 화면에는 빈 자리로만 보이므로 눈으로는 못 잡는다.


---

## 세 IQ 아이콘 (자주 헷갈림)

Fabric IQ / Work IQ / Foundry IQ는 이름이 비슷해 아이콘을 바꿔 다는 실수가 잦다.
각각 **모체 제품의 브랜드 마크**를 그대로 쓴다.

| IQ | 심볼 | 생김새 |
|---|---|---|
| Fabric IQ | `fab-fabric` | Microsoft Fabric 녹색 "F" |
| Work IQ | `fab-copilot` | Microsoft Copilot 컬러 리본 |
| Foundry IQ | `az-foundry` | Microsoft Foundry 리본 |

Work IQ와 Microsoft Copilot Studio가 같은 `fab-copilot`을 쓰는 것은 의도된 것이다.
둘 다 Copilot 계열이라 브랜드 마크가 같다.

**브랜드 마크를 직접 그리지 않는다.** 공식 배포본에 없으면 의미가 가장 가까운 기존
심볼을 쓰거나 아예 넣지 않는다. 손으로 그린 로고는 결국 어색해진다.
