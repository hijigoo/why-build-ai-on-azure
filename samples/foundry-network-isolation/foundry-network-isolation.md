# Microsoft Foundry 네트워크 격리

> 엔터프라이즈 보안·인프라 담당자와 클라우드 아키텍트를 위한 기술 자료입니다.
> Foundry를 사설 네트워크 경계 안에서 운영하기 위한 선택지와 제약을 정리했습니다.
>
> **작성 기준** — Microsoft Learn 공식 문서, 2026년 8월 확인.
> 네트워크 격리 영역은 변화가 빠릅니다. 도입 시점에 지원 리전과 기능 상태를 다시 확인해야 합니다.

---

## Part 1. 왜 네트워크 격리인가

### 네트워크 격리란

네트워크를 여러 구간으로 나누고 각 구간을 독립된 작은 네트워크처럼 다루는 보안 전략입니다.
규제 산업의 기업은 데이터와 모델이 무단 접근·변조·유출되지 않도록 이 구조를 요구합니다.

AI 워크로드에서 특히 중요한 이유는, 에이전트가 **사내 데이터를 읽고 외부로 나가는 경로를 동시에 가지기 때문**입니다.
격리하지 않으면 데이터 유출 경로가 그대로 열려 있는 셈이 됩니다.

### 세 영역으로 나눠 생각한다

Foundry의 네트워크 격리는 세 방향을 각각 따져야 합니다.

| 영역 | 무엇을 통제하나 | 대표 수단 |
|---|---|---|
| 인바운드 | Foundry 리소스로 **들어오는** 접근 | 공용 네트워크 접근 차단 + 프라이빗 엔드포인트 |
| 아웃바운드 (리소스) | Foundry가 **다른 Azure 서비스로** 나가는 경로 | Private Link |
| 아웃바운드 (에이전트) | 에이전트 클라이언트가 **데이터·외부로** 나가는 경로 | 가상 네트워크 주입 |

세 번째가 기존 PaaS와 다른 지점입니다. 고객이 학습·엔드포인트용 IaaS 컴퓨트를 직접 관리하지 않는 대신,
**에이전트 클라이언트가 고객 소유 서브넷에 주입**되어 모든 트래픽이 고객이 정의한 경계 안에 머무릅니다.

---

## Part 2. 인바운드 격리

### 공용 네트워크 접근 세 가지 선택

공용 네트워크 접근(PNA) 플래그가 인바운드 정책을 결정합니다.

| 설정 | 동작 | 쓰는 경우 |
|---|---|---|
| Disabled | 프라이빗 엔드포인트로만 접근 | 가장 강한 격리. 규제 대응 기본값 |
| Selected networks | 지정한 IP 주소·가상 네트워크만 허용 | 사무실 IP 등 제한적 공개가 필요할 때 |
| Enabled | 공용 엔드포인트 개방 | 개발·평가 환경 |

프라이빗 엔드포인트를 제거해도 리소스가 공개 상태가 되지는 않습니다.
반대로 공용 접근을 켜도 기존 프라이빗 엔드포인트는 그대로 유지됩니다. 두 설정은 독립적입니다.

### 프라이빗 엔드포인트 구성

포털에서 Foundry 리소스를 만들 때 **Networking** 탭에서 공용 접근을 Disabled로 두고 프라이빗 엔드포인트를 추가합니다.
포털 UI에서 대상은 "account"로 표시되며, 여기서 Foundry 리소스를 선택합니다.

필요한 권한은 세 가지로 나뉩니다.

- 가상 네트워크에 대한 **Network Contributor** — 엔드포인트 생성
- Foundry 프로젝트에 대한 **Contributor** 또는 **Owner** — 연결 승인
- 프라이빗 DNS 영역을 직접 관리한다면 **Private DNS Zone Contributor**

승인 권한이 없으면 연결이 **Pending** 상태에 머물고, 리소스 소유자가 승인해야 트래픽이 흐릅니다.

### DNS가 실제 관문이다

프라이빗 엔드포인트를 만들면 Azure가 Foundry 리소스의 CNAME 레코드를 `privatelink` 접두사가 붙은
하위 도메인의 별칭으로 갱신하고, 그에 대응하는 프라이빗 DNS 영역을 만듭니다.

같은 연결 문자열을 쓰더라도 **어디서 조회하느냐에 따라 결과가 달라집니다.**

- 가상 네트워크 **안에서** 조회 → 프라이빗 엔드포인트의 사설 IP
- 가상 네트워크 **밖에서** 조회 → 공용 엔드포인트

사내 DNS 서버를 쓴다면 `privatelink` 하위 도메인을 가상 네트워크의 프라이빗 DNS 영역으로 위임해야 합니다.
이 설정을 빠뜨리면 이름이 공용 IP로 풀려 연결이 실패합니다. 격리 구성에서 가장 자주 발생하는 문제입니다.

### 격리된 Foundry에 접속하는 방법

공용 접근을 끈 뒤에는 가상 네트워크 안에서 접근해야 합니다.

- **Azure VPN Gateway** — 지점 간(P2S) 또는 사이트 간(S2S)
- **ExpressRoute** — 연결 공급자를 통한 전용 회선
- **Azure Bastion + 점프박스 VM** — 가상 네트워크 안의 VM을 개발 환경으로 사용

### 구성 검증

포털에서 프라이빗 엔드포인트 연결이 **Approved**인지 확인한 뒤, 가상 네트워크 안의 VM에서 확인합니다.

```
nslookup <foundry-endpoint-hostname>
Test-NetConnection <private-endpoint-ip> -Port 443
```

이름이 사설 IP로 풀리고 443 포트가 열려 있으면 정상입니다.

### 신뢰할 수 있는 Azure 서비스 예외

네트워크 규칙을 유지하면서 일부 Azure 서비스에는 접근을 허용할 수 있습니다.
해당 서비스의 관리 ID에 적절한 역할이 부여되어 있어야 합니다.

| 서비스 | 리소스 공급자 |
|---|---|
| Foundry Tools | `Microsoft.CognitiveServices` |
| Azure AI Search | `Microsoft.Search` |
| Azure Machine Learning | `Microsoft.MachineLearningServices` |

---

## Part 3. 아웃바운드 격리

### 두 가지 방식

에이전트의 아웃바운드를 격리하는 방법은 두 갈래입니다. **처음에 고른 방식을 나중에 바꿀 수 없으므로**
설계 단계에서 결정해야 합니다.

| 기준 | BYO 가상 네트워크 (주입) | 관리형 가상 네트워크 |
|---|---|---|
| 네트워크 소유 | 고객 구독 | Microsoft 테넌트 |
| 통제 수준 | 높음 — 서브넷·경로·방화벽을 직접 설계 | 낮음 — 플랫폼이 대행 |
| 운영 부담 | 직접 구축·유지 | 안전한 기본값 제공 |
| 방화벽 | 자체 Azure Firewall 사용 | 관리형 방화벽 자동 생성 |
| 프라이빗 엔드포인트 | 고객이 직접 생성 | 관리형(고객에게 NIC 비노출) |
| 지원 리전 | 제약 없음 | 일부 리전만 |

### BYO 가상 네트워크 — 주입 방식

에이전트 클라이언트를 고객 소유 서브넷에 주입합니다. 서브넷 요건이 명확합니다.

- `Microsoft.App/environments`에 **위임된** 서브넷
- 크기 **/27 이상**

포털, Bicep, Terraform으로 배포할 수 있습니다.

**주의할 점** — Azure Storage, Azure AI Search, Azure Cosmos DB에 대한 프라이빗 엔드포인트는
Foundry 배포 시 **자동으로 만들어지지 않습니다.** 각 리소스 페이지에서 별도로 만들어야 합니다.

### Standard 설정과 데이터 보관

Standard 설정은 **BYO 리소스**를 전제로 합니다. Azure Storage, Azure AI Search, Azure Cosmos DB를
고객이 지정하고, Foundry Agent Service가 처리한 데이터는 모두 이 리소스에 저장됩니다.
데이터가 고객 테넌트 안에 남으므로 규정 준수 요건을 맞추기 쉽습니다.

Basic 설정은 필요한 리소스를 배포 과정에서 자동으로 만들고 관리합니다.

### 관리형 가상 네트워크 — 격리 모드

Microsoft 테넌트에 관리형 가상 네트워크가 만들어지고, 프로젝트에서 만든 에이전트는 자동으로 이 네트워크를 씁니다.
아웃바운드 정책은 두 가지 모드로 나뉩니다.

| 모드 | 동작 | 쓰는 경우 |
|---|---|---|
| Allow internet outbound | 인터넷으로 나가는 트래픽 전부 허용 | 폭넓은 연결이 필요하고 제약이 수용 가능할 때 |
| Allow only approved outbound | 서비스 태그·프라이빗 엔드포인트·FQDN 규칙으로 제한 | 데이터 유출 위험을 최소화해야 할 때 |

승인된 아웃바운드 모드에서 FQDN 규칙을 만들면 **관리형 Azure Firewall이 자동 생성**되며 방화벽 비용이 발생합니다.
FQDN 규칙은 80·443 포트만 지원합니다.

관리형 프라이빗 엔드포인트는 고객 구독에 네트워크 인터페이스를 만들지 않습니다.
표준 프라이빗 엔드포인트와 달리 서브넷에 사설 IP를 가진 NIC가 보이지 않습니다.

### 관리형 가상 네트워크의 제약

도입 판단에 직접 영향을 주는 항목들입니다.

- **지원 리전이 한정적입니다.** East US, East US2, Japan East, France Central, UAE North, Brazil South,
  Spain Central, Germany West Central, Italy North, South Central US, Australia East, Sweden Central,
  Canada East, South Africa North, West US, West US 3, South India, UK South.
  **한국 리전은 아직 목록에 없습니다.**
- **모드를 되돌릴 수 없습니다.** 인터넷 아웃바운드로 설정한 뒤 비활성화로 되돌릴 수 없고,
  승인된 아웃바운드로 설정한 뒤 인터넷 아웃바운드로 완화할 수 없습니다.
- **활성화 후 해제할 수 없습니다.** BYO 가상 네트워크에서 관리형으로 넘어가는 경로도 없어 재배포가 필요합니다.
- **Azure Portal UI가 아직 없습니다.** Bicep, Terraform, `az rest`로 배포합니다.
- 자체 Azure Firewall을 반입할 수 없고, 계정마다 별도 관리형 방화벽이 만들어집니다.
- 온프레미스 리소스에 사설로 접근해야 한다면 Application Gateway를 사용합니다.
- `az cognitiveservices account managed-network` 명령 그룹은 Preview 상태입니다.

관리형 네트워크 리소스 배포에는 Foundry 리소스 범위의 `Foundry Account Owner`,
RBAC 할당을 위한 `Owner` 또는 `Role Based Access Administrator`, 에이전트 제작을 위한 프로젝트 범위 `Foundry User`가 필요합니다.
또한 Foundry 리소스의 관리 ID에 `Azure AI Enterprise Network Connection Approver` 역할을 부여해야
필요한 프라이빗 엔드포인트가 생성·승인됩니다.

### 허브-스포크와 방화벽

이그레스를 통제하려면 Azure Firewall 등으로 나가는 트래픽을 검사합니다.
공유 방화벽을 두는 허브 가상 네트워크와 Foundry용 스포크 가상 네트워크를 피어링하는 구조가 일반적입니다.

### 방화벽 허용 목록

가상 네트워크 주입으로 배포하고 방화벽으로 이그레스를 통제한다면, 시나리오별로 다음을 허용해야 합니다.

| 시나리오 | FQDN / 서비스 태그 | 용도 |
|---|---|---|
| 에이전트 | `*.identity.azure.net`, `login.microsoftonline.com`, `*.login.microsoftonline.com`, `*.login.microsoft.com` 또는 AAD 서비스 태그 | Agent 서비스의 Container App 위임 |
| 평가·추적 | `*.blob.core.windows.net`, `settings.sdk.monitor.azure.com` | 평가자 카탈로그, Application Insights 전송 |
| 파인튜닝 | `raw.githubusercontent.com` | 포털에서 큐레이션된 샘플 데이터셋 사용 시 |
| 호스티드 에이전트 → Agent 365 | `AzureFrontDoor.Frontend` | 관측·추적 엔드포인트 (TCP 443) |

---

## Part 4. 에이전트 도구는 어디까지 되는가

격리 환경에서 모든 도구가 동일하게 동작하지는 않습니다. 도구마다 트래픽이 흐르는 경로가 다릅니다.

### 지원 현황

| 도구 | 상태 | 트래픽 경로 |
|---|---|---|
| MCP Tool (Private MCP) | 지원 | 고객 가상 네트워크 서브넷 |
| Azure AI Search | 지원 | 프라이빗 엔드포인트 |
| OpenAPI 도구 | 지원 | 고객 가상 네트워크 서브넷 |
| Azure Functions | 지원 | 고객 가상 네트워크 서브넷 |
| Agent-to-Agent (A2A) | 지원 | 고객 가상 네트워크 서브넷 |
| Function Calling | 지원 | Microsoft 백본 |
| Bing Grounding | 지원 | 공용 엔드포인트 |
| Websearch | 지원 | 공용 엔드포인트 |
| SharePoint Grounding | 지원 | 공용 엔드포인트 |
| Foundry IQ | 지원 | MCP 경유 |
| Code Interpreter | 부분 지원 | Microsoft 백본. 파일 없이 동작. 업로드·다운로드 미지원 |
| Fabric IQ | 부분 지원 | MCP 경유. Fabric 항목 유형별로 상이 |
| Fabric Data Agent | 미지원 | Fabric 리소스의 공용 접근이 필요 |
| Logic Apps | 미지원 | 개발 중 |
| File Search | 미지원 | 개발 중 |
| Browser Automation | 미지원 | 개발 중 |
| Computer Use | 미지원 | 개발 중 |
| Image Generation | 미지원 | 개발 중 |

### 공용 엔드포인트 도구를 주의해야 하는 이유

Bing Grounding, Websearch, SharePoint Grounding은 격리 환경에서도 **동작하지만 공용 인터넷을 경유합니다.**
모든 트래픽이 사설 네트워크에 머물러야 하는 조직이라면 요건을 충족하지 못합니다.
필요하다면 Azure Policy로 이 도구들의 사용을 차단할 수 있습니다.

### 구성이 필요한 경우

가상 네트워크 서브넷을 쓰는 도구(MCP, Azure AI Search, OpenAPI, A2A, Azure Functions)만 추가 구성이 필요합니다.
Microsoft 백본과 공용 엔드포인트를 쓰는 도구는 별도 네트워크 설정이 없습니다.

Azure AI Search는 검색 서비스에 프라이빗 엔드포인트가 있어야 합니다.
인덱서가 프라이빗 엔드포인트를 통과해야 한다면 인덱서의 `executionEnvironment`를 `"Private"`로 설정합니다.
그러지 않으면 멀티테넌트 실행이 기본값이라 프라이빗 엔드포인트를 통과하지 못하고,
**오류 없이 색인이 비는 형태로 실패**합니다. 진단이 어려운 문제이므로 미리 확인해야 합니다.

---

## Part 5. 도입 전에 알아야 할 것

### 되돌릴 수 없는 결정들

- **아웃바운드 네트워킹은 변경할 수 없습니다.** 위임한 서브넷을 다른 서브넷으로 바꿀 수 없고,
  이미 배포한 Foundry에 가상 네트워크 주입을 추가할 수도 없습니다. 재배포가 유일한 방법입니다.
- 관리형 가상 네트워크는 활성화 후 해제할 수 없습니다.

### 기능별 제약

| 기능 | 상태 | 비고 |
|---|---|---|
| Workflow Agents | 부분 지원 | 인바운드는 지원. 아웃바운드 가상 네트워크 주입은 미지원 |
| AI Gateway (APIM) | 부분 지원 | Foundry 포털에서 만들면 공용으로 생성됨. Azure Portal에서 별도 격리 구성 필요 |
| 평가용 합성 데이터 생성 | 미지원 | 자체 데이터를 준비해 평가 |
| 호스티드 에이전트 + 사설 ACR | 조건부 | 2026년 6월 25일 이후 생성한 프로젝트만 사설 레지스트리 지원 |

### 네트워크 설계 제약

- 프라이빗 엔드포인트는 가상 네트워크와 **같은 리전·같은 구독**에 배포합니다.
- **Approved** 상태의 엔드포인트만 트래픽을 전달합니다.
- `172.17.0.0/16` 대역은 사용하지 않습니다. Docker 브리지 네트워킹이 예약한 범위입니다.

### Teams·Microsoft 365 게시

공용 네트워크 접근을 끈 상태에서도 에이전트를 Microsoft Teams와 Microsoft 365에 게시할 수 있습니다.
다만 추가 설정이 필요합니다.

### 배포 전 체크리스트

**먼저 정한다 — 되돌리기 어려운 결정**

1. 인바운드 정책을 정한다 — 완전 차단인지, 특정 IP 허용인지
2. 아웃바운드 방식을 정한다 — BYO 가상 네트워크인지 관리형인지 (**되돌릴 수 없음**)
3. 관리형을 고른다면 대상 리전이 지원 목록에 있는지 확인한다
4. 서브넷을 준비한다 — `Microsoft.App/environments` 위임, /27 이상

**그다음 구성하고 검증한다**

5. Standard 설정이라면 Storage·AI Search·Cosmos DB를 준비하고 **프라이빗 엔드포인트를 각각 만든다**
6. 프라이빗 DNS 영역을 가상 네트워크에 연결하고, 사내 DNS라면 위임을 설정한다
7. 쓰려는 에이전트 도구가 격리 환경에서 지원되는지 확인한다
8. 가상 네트워크 안에서 `nslookup`과 포트 443 연결로 검증한다

방화벽을 둔다면 위의 FQDN 허용 목록에서 쓰는 기능에 해당하는 항목만 엽니다.

### 참고 문서

- [Microsoft Foundry 네트워크 격리 구성](https://learn.microsoft.com/azure/foundry/how-to/configure-private-link)
- [Foundry 프로젝트의 관리형 가상 네트워크 구성](https://learn.microsoft.com/azure/foundry/how-to/managed-virtual-network)
- [Agent Service와 가상 네트워크 사용](https://learn.microsoft.com/azure/ai-services/agents/how-to/virtual-networks)
- [foundry-samples 인프라 템플릿](https://github.com/microsoft-foundry/foundry-samples)
