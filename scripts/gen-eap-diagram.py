#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
gen-eap-diagram.py — Enterprise AI Platform 아키텍처 다이어그램 생성기

    python3 scripts/gen-eap-diagram.py --check
    python3 scripts/gen-eap-diagram.py --emit generic
    python3 scripts/gen-eap-diagram.py --emit product

같은 마크업 템플릿에 라벨만 바꿔 끼워 **일반 버전**과 **제품 버전**을 만든다.
두 버전은 셀 개수까지 같게 설계했으므로, 텍스트를 걷어내면 구조가 완전히 동일하다.
(`--check` 가 그 동일성을 검증한다.)

지오메트리는 전부 고정 px 이라 라벨 길이가 레이아웃에 영향을 주지 않는다.
"""
import argparse
import re
import sys

# ── 라벨 데이터 ────────────────────────────────────────────────────────
# 두 버전은 반드시 같은 모양(같은 개수)이어야 한다. check()가 이를 강제한다.

GENERIC = {
    "users": "각 현업 및 전직원",
    "devops_head": "Agentic DevOps",
    "devops": [
        "소스코드 관리<br>및 협업",
        "CI/CD 및<br>DevOps 워크플로우",
        "코드 작성 · 테스트<br>문서화 · 리뷰",
        "코드 스캔 · 비밀키 탐지<br>오픈소스 취약점 분석",
    ],
    "gov_head": "Governance",
    "gov": [
        "에이전트<br>거버넌스 및 운영",
        "통합 데이터 거버넌스<br>및 컴플라이언스",
        "통합 ID 거버넌스<br>및 접근통제",
        "위협 및 보안<br>리스크 탐지",
    ],
    "layers": [
        ("AI<br>EXPERIENCE", "t6", ["전직원이 접근 가능한<br>에이전트 스토어",
                                    "직원 &amp; 에이전트<br>전사 협업 환경"]),
        ("AGENTS or<br>AI APP", "t5", ["개인 업무<br>생산성 향상",
                                       "팀 / 조직 단위 업무",
                                       "핵심 비즈니스 · 고객<br>매출 업무"]),
        ("AGENT<br>FACTORY", "t4", ["Low-Code / 현업 사용자<br>에이전트 개발",
                                    "Pro-Code / 고급 사용자<br>에이전트 개발"]),
        ("ONTOLOGY", "t3", ["데이터레이크 +<br>시맨틱 모델",
                            "온톨로지 기반<br>비즈니스 구조",
                            "기업 데이터 + 온톨로지<br>기반 컨텍스트"]),
        ("ONELAKE", "t2", ["준 실시간<br>데이터 복제 및 동기화",
                           "데이터 복제 없이 연결",
                           "ETL 및 파이프라인"]),
        ("EXISTING<br>DATA &amp; SYSTEM", "t1", ["Snowflake<br><b>CDP · 고객 데이터</b>",
                                                 "SAP<br><b>ERP · SCM</b>",
                                                 "Salesforce<br><b>CRM · 영업</b>",
                                                 "기타 데이터 소스<br><b>오브젝트 스토리지 · DB</b>"]),
    ],
    "conns": [
        "Agent 배포 &amp; 협업",
        "Agent 업무 적용",
        "Agent Grounding",
        "데이터 → 비즈니스 의미 구조로 변환",
        "이기종 데이터를 하나의 레이크로 연결",
    ],
    "personas": [("에이전트 빌더", 3), ("엔지니어", 3), ("거버넌스 &amp; 보안", 3)],
}

PRODUCT = {
    "users": "각 현업 및 전직원",
    "devops_head": "Agentic DevOps",
    "devops": [
        "GitHub<br>Enterprise",
        "GitHub<br>Actions",
        "GitHub<br>Copilot",
        "GitHub Code Security<br>· Secret Protection",
    ],
    "gov_head": "Governance",
    "gov": [
        "Microsoft<br>Agent 365",
        "Microsoft<br>Purview",
        "Microsoft<br>Entra ID",
        "Microsoft<br>Defender",
    ],
    "layers": [
        ("AI<br>EXPERIENCE", "t6", ["Microsoft 365 Copilot",
                                    "Microsoft Teams"]),
        ("AGENTS or<br>AI APP", "t5", ["Microsoft 365 Copilot<br>에이전트",
                                       "Workgroup Agents",
                                       "Business Agents"]),
        ("AGENT<br>FACTORY", "t4", ["Microsoft<br>Copilot Studio",
                                    "Microsoft<br>Foundry"]),
        ("ONTOLOGY", "t3", ["Fabric IQ", "Work IQ", "Foundry IQ"]),
        ("ONELAKE", "t2", ["Fabric 미러링<br>(Mirroring)",
                           "OneLake 숏컷<br>(Shortcut)",
                           "Fabric Data Factory"]),
        ("EXISTING<br>DATA &amp; SYSTEM", "t1", ["Snowflake<br><b>CDP · 고객 데이터</b>",
                                                 "SAP<br><b>ERP · SCM</b>",
                                                 "Salesforce<br><b>CRM · 영업</b>",
                                                 "기타 데이터 소스<br><b>오브젝트 스토리지 · DB</b>"]),
    ],
    "conns": GENERIC["conns"],
    "personas": GENERIC["personas"],
}

PERSON = ('<svg class="eap-fig" viewBox="0 0 24 24" aria-hidden="true">'
          '<path d="M12 12.6c2.5 0 4.5-2.2 4.5-4.9S14.5 2.8 12 2.8 7.5 5 7.5 7.7s2 4.9 4.5 4.9Z"/>'
          '<path d="M12 14.2c-3.9 0-7.1 2.7-7.1 6.1 0 .5.4.9.9.9h12.4c.5 0 .9-.4.9-.9 0-3.4-3.2-6.1-7.1-6.1Z"/>'
          '</svg>')

# ── CSS ────────────────────────────────────────────────────────────────
# 지오메트리는 전부 고정 px. 라벨 길이가 달라져도 박스 크기가 변하지 않으므로
# 일반 버전과 제품 버전의 프레임이 픽셀 단위로 같아진다.
CSS = """
/* Enterprise AI Platform 아키텍처 — scripts/gen-eap-diagram.py 가 생성 */
.eap{width:1728px;height:734px;display:flex;gap:12px;font-family:var(--f-body);
  color:var(--navy);letter-spacing:-.01em}
.eap-fig{width:20px;height:20px;fill:currentColor;flex:0 0 auto}

/* 좌우 페르소나 레일 — 위쪽 사용자 박스(64+24)만큼 내려 플랫폼 박스와 높이를 맞춘다 */
.eap-rail{width:92px;flex:0 0 92px;display:flex;flex-direction:column;justify-content:center;
  gap:18px;padding-top:76px}
.eap-persona{flex:0 0 224px;border:2px solid var(--navy);border-radius:7px;background:#fff;
  position:relative;display:flex;align-items:center;justify-content:center}
.eap-ptag{position:absolute;top:-13px;left:50%;transform:translateX(-50%);white-space:nowrap;
  background:var(--navy);color:#fff;font-size:14px;font-weight:700;padding:3px 10px;border-radius:3px}
.eap-rail:last-child .eap-persona{flex:0 0 300px}
.eap-pbody{display:flex;flex-direction:column;gap:18px;color:var(--navy);padding-top:6px}
.eap-pbody .eap-fig{width:32px;height:32px}

/* 상단 사용자 박스 — 좌우 여백 218px 은 가운데 계층 영역의 시작·끝과 정확히 같다
   (플랫폼 테두리 2 + 패딩 13 + 세로축 192 + 간격 11 = 218) */
.eap-main{flex:1;min-width:0;display:flex;flex-direction:column}
.eap-users{height:56px;flex:0 0 56px;border:2px solid var(--navy);border-radius:9px;background:#fff;
  position:relative;display:flex;align-items:center;margin:0 216px}
.eap-utag{position:absolute;left:-8px;top:50%;transform:translate(-100%,-50%);white-space:nowrap;
  background:var(--navy);color:#fff;font-size:17px;font-weight:700;padding:6px 15px;border-radius:5px}
.eap-ufigs{flex:1;display:flex;color:var(--navy)}
.eap-fgrp{flex:1;display:flex;justify-content:center;gap:14px}
.eap-ufigs .eap-fig{width:30px;height:30px}
/* 연결선은 사용자 박스와 같은 폭을 4등분해 각 칸 중앙에 그린다.
   (space-evenly 는 아이콘 묶음과 선의 폭 차이 때문에 중심이 어긋난다) */
.eap-drops{height:20px;flex:0 0 20px;display:flex;margin:0 218px}
.eap-drops i{flex:1;position:relative}
.eap-drops i::before{content:"";position:absolute;left:50%;top:0;bottom:0;width:3px;
  transform:translateX(-50%);background:var(--cobalt);opacity:.62}

/* 플랫폼 점선 박스 */
.eap-plat{flex:1;min-height:0;border:2px dashed var(--muted-2);border-radius:8px;padding:11px;
  position:relative}
.eap-plat-tag{position:absolute;top:-14px;left:16px;background:var(--cobalt);color:#fff;
  font-size:16px;font-weight:800;padding:3px 12px;border-radius:3px}
.eap-cols{height:100%;display:flex;gap:11px}

/* 좌우 세로축 */
.eap-side{width:192px;flex:0 0 192px;border-radius:6px;padding:9px;display:flex;
  flex-direction:column;gap:8px}
.eap-devops{background:#68727E}
.eap-gov{background:#12365E}
.eap-side-h{flex:0 0 auto;text-align:center;color:#fff;font-size:19px;font-weight:700;
  padding:4px 0 6px;line-height:1.24}
.eap-chip{flex:1;display:flex;align-items:center;justify-content:center;text-align:center;
  border-radius:5px;color:#fff;font-size:16px;font-weight:600;line-height:1.34;padding:4px 7px}
.eap-devops .eap-chip{background:#14304F}
.eap-gov .eap-chip{background:#1E4B8F}

/* 가운데 6계층 — 계층 높이는 고정, 남는 높이는 연결 구간이 균등하게 흡수한다 */
.eap-layers{flex:1;min-width:0;display:flex;flex-direction:column}
.eap-layer{flex:0 0 72px;display:flex;align-items:stretch;border-radius:5px;overflow:hidden}
.eap-lb{width:188px;flex:0 0 188px;display:flex;align-items:center;padding:0 13px;
  font-size:17px;font-weight:800;letter-spacing:.07em;line-height:1.28}
.eap-cells{flex:1;min-width:0;display:flex;gap:8px;padding:7px;align-items:stretch}
.eap-cell{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;
  justify-content:center;text-align:center;background:#fff;border:1px solid rgba(14,35,64,.18);
  border-radius:4px;font-size:19px;font-weight:600;line-height:1.28;color:var(--navy);padding:2px 8px}
.eap-cell b{display:block;margin-top:3px;font-size:14.5px;font-weight:600;color:var(--muted);
  letter-spacing:0}

/* 계층 색 사다리 — 아래(데이터)에서 위(경험)로 */
.eap-layer.t1{background:#E5EDFD} .eap-layer.t1 .eap-lb{color:var(--navy)}
.eap-layer.t2{background:#BFD5F5} .eap-layer.t2 .eap-lb{color:var(--navy)}
.eap-layer.t3{background:#12365E} .eap-layer.t3 .eap-lb{color:#fff}
.eap-layer.t4{background:#2C6BED} .eap-layer.t4 .eap-lb{color:#fff}
.eap-layer.t5{background:#24589F} .eap-layer.t5 .eap-lb{color:#fff}
.eap-layer.t6{background:#1E4B8F} .eap-layer.t6 .eap-lb{color:#fff}

/* 계층 사이 연결 */
.eap-conn{flex:1 1 auto;display:flex;align-items:center;justify-content:center;gap:24px}
.eap-tri{width:0;height:0;border-left:9px solid transparent;border-right:9px solid transparent;
  border-bottom:11px solid #A9B6C6}
.eap-pill{background:var(--navy);color:#fff;font-size:15.5px;font-weight:700;padding:4px 17px;
  border-radius:13px;white-space:nowrap}
"""


def build(d):
    """라벨 딕셔너리 하나로 다이어그램 마크업을 만든다."""
    o = []
    a = o.append

    a('<div class="eap">')

    # 좌측 페르소나 레일 (에이전트 빌더 · 엔지니어)
    a('<div class="eap-rail">')
    for name, n in d["personas"][:2]:
        a('<div class="eap-persona"><div class="eap-ptag">%s</div>'
          '<div class="eap-pbody">%s</div></div>' % (name, PERSON * n))
    a('</div>')

    a('<div class="eap-main">')

    # 상단 사용자 박스 — 아이콘을 4묶음으로 나눠 아래 연결선과 위치를 맞춘다
    a('<div class="eap-users"><span class="eap-utag">%s</span>'
      '<span class="eap-ufigs">%s</span></div>'
      % (d["users"], ('<i class="eap-fgrp">%s</i>' % (PERSON * 2)) * 4))
    a('<div class="eap-drops">%s</div>' % ('<i></i>' * 4))

    # 플랫폼 점선 박스
    a('<div class="eap-plat"><span class="eap-plat-tag">Enterprise AI Platform</span>')
    a('<div class="eap-cols">')

    # 왼쪽 세로축 — Agentic DevOps
    a('<div class="eap-side eap-devops"><div class="eap-side-h">%s</div>' % d["devops_head"])
    for c in d["devops"]:
        a('<div class="eap-chip">%s</div>' % c)
    a('</div>')

    # 가운데 6계층
    a('<div class="eap-layers">')
    for i, (label, tone, cells) in enumerate(d["layers"]):
        a('<div class="eap-layer %s"><div class="eap-lb">%s</div><div class="eap-cells">' % (tone, label))
        for c in cells:
            a('<span class="eap-cell">%s</span>' % c)
        a('</div></div>')
        if i < len(d["conns"]):
            a('<div class="eap-conn"><i class="eap-tri"></i>'
              '<span class="eap-pill">%s</span><i class="eap-tri"></i></div>' % d["conns"][i])
    a('</div>')

    # 오른쪽 세로축 — Governance
    a('<div class="eap-side eap-gov"><div class="eap-side-h">%s</div>' % d["gov_head"])
    for c in d["gov"]:
        a('<div class="eap-chip">%s</div>' % c)
    a('</div>')

    a('</div></div></div>')

    # 우측 페르소나 레일 (거버넌스 & 보안)
    name, n = d["personas"][2]
    a('<div class="eap-rail"><div class="eap-persona"><div class="eap-ptag">%s</div>'
      '<div class="eap-pbody">%s</div></div></div>' % (name, PERSON * n))

    a('</div>')
    return "\n".join(o)


def skeleton(markup):
    """레이아웃 구조만 남긴다 (동일성 검증용).

    텍스트와 줄바꿈·강조 같은 '내용 서식'은 걷어낸다. 셀은 고정 높이라
    한 줄이든 두 줄이든 박스 크기가 달라지지 않으므로, 지오메트리에
    영향을 주는 컨테이너 구조만 비교하면 된다.
    """
    s = re.sub(r'</?(?:br|b)\s*/?>', '', markup)
    s = re.sub(r'>[^<]+<', '><', s)
    return re.sub(r'\s+', ' ', s).strip()


def check():
    g, p = build(GENERIC), build(PRODUCT)
    ok = True

    # 1) 라벨 데이터의 '모양'이 같은가
    for key in ("devops", "gov", "conns", "personas"):
        if len(GENERIC[key]) != len(PRODUCT[key]):
            print("✗ %s 개수 불일치: %d vs %d" % (key, len(GENERIC[key]), len(PRODUCT[key])))
            ok = False
    if len(GENERIC["layers"]) != len(PRODUCT["layers"]):
        print("✗ layers 개수 불일치")
        ok = False
    else:
        for (gl, gt, gc), (pl, pt, pc) in zip(GENERIC["layers"], PRODUCT["layers"]):
            if len(gc) != len(pc) or gt != pt:
                print("✗ 계층 '%s' 셀 %d개 vs '%s' 셀 %d개" %
                      (re.sub('<[^>]+>', ' ', gl), len(gc), re.sub('<[^>]+>', ' ', pl), len(pc)))
                ok = False

    # 2) 고정 높이 박스를 넘길 만큼 긴 라벨이 없는가 (최대 2줄)
    for tag, d in (("일반", GENERIC), ("제품", PRODUCT)):
        labels = list(d["devops"]) + list(d["gov"]) + list(d["conns"])
        for _, _, cells in d["layers"]:
            labels += cells
        for lb in labels:
            if lb.count("<br>") > 1:
                print("✗ %s: 3줄 이상 라벨 — %r" % (tag, lb))
                ok = False

    # 3) 텍스트를 걷어낸 레이아웃 구조가 완전히 같은가
    if skeleton(g) == skeleton(p):
        print("✓ 레이아웃 구조 동일 — 텍스트 제거 후 마크업이 완전히 일치")
    else:
        print("✗ 레이아웃 구조 불일치")
        ok = False

    print("  일반 %d자 / 제품 %d자, 구조 태그 수 %d / %d"
          % (len(g), len(p), skeleton(g).count("<"), skeleton(p).count("<")))
    return 0 if ok else 1


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--emit", choices=["generic", "product", "css"])
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()
    if args.check or not args.emit:
        sys.exit(check())
    if args.emit == "css":
        print(CSS.strip())
    else:
        print(build(GENERIC if args.emit == "generic" else PRODUCT))


if __name__ == "__main__":
    main()
