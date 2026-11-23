# SAFETI/Phast QRA Master Manual — Claude Code 작업 인계서

> 이 문서는 claude.ai 대화에서 진행한 작업을 Claude Code 세션이 이어받기 위한 인계서다.
> 같이 넘기는 파일: `QRA_Master_Manual_이론편.md`(이론 매뉴얼 전문, 약 9만 자).
> Claude Code는 이 문서를 처음부터 끝까지 읽은 뒤 **5장(진행할 작업)** 순서대로 진행한다.

---

## 0. 한눈에 보기

| 항목 | 내용 |
|---|---|
| 목표 | ① 이론 매뉴얼(완료) ② Phast 프로그램 분석 결과 MD ③ 이론 매뉴얼과 1:1로 맞물린 **사용설명서**(실습 캡처 포함) |
| 사용자 | 공정안전 엔지니어(공정안전 설계팀). Phast로 Dispersion Study 수행, KOSHA GUIDE·API RP 581 기반 누출원 모델링. 한국어 사용 |
| 실습 환경 | **개인 컴퓨터(Windows), Phast만 설치**(Safeti 없음). 회사 PC에서는 작업하지 않는다 |
| 용도 | 개인 보관용(회사 배포 아님). 사용자는 라이선스가 비영리 목적의 리버스 엔지니어링을 허용한다고 확인함 |
| 이론 매뉴얼 원본 | Claude Docs 문서 https://claude.ai/artifact/3C477jjviNRFSaNohFJouU (MD 사본 = `QRA_Master_Manual_이론편.md`) |
| 교재형 PDF | A4 74쪽 교재 디자인판 생성 완료(표지·차례·장 표지·머리글·박스·수식 번호·책갈피). 재생성 방법은 7장 |

---

## 1. 배경

- 대상 프로젝트: **HET(한화토탈에너지스 에탄 탱크 터미널, 대산)** QRA. DNV가 SAFETI로 수행. 가정 문서는 **HET-SHQRA-001 QRA Assumption Register Rev.0**(이하 [AR]).
- 처음 요청: SAFETI 교육 교재 4종 + [AR]로 "사용 실무 + 이론을 모두 담은 고급자용 QRA Master Manual" 작성. 이론·모델 출처는 DNV 자료로 보강.
- 이후 사용자가 DNV Tutorial 4종과 Technical Documentation 묶음(1. Overview ~ 9. Risk, 약 80여 건)을 제공해 모두 반영함.
- 현재 이론 매뉴얼은 **이론 + SAFETI 구성요소 설명** 중심이다. 실제 화면 조작 절차(사용설명서)는 아직 없다. 이것을 Claude Code 세션에서 만든다.

---

## 2. 작성 규칙 (사용자 지시 — 반드시 지킬 것)

1. **한국어**로 쓴다. 기술 용어는 영문 병기 가능(예: 평균화 시간(averaging time)).
2. **소프트웨어 버전을 언급하지 않는다.** "8.0부터", "9.31 기준", "이전 버전" 같은 표현 금지. 모델은 현재 동작 그대로 서술한다.
3. **자료 작성 시기와 SAFETI 버전 사이의 차이는 무시한다.** 예전 문서라서 못 믿는다는 식의 단서를 달지 않는다.
4. 출처는 대괄호 태그로 표기한다(예: [AR], [DISC], [MPACT]). 태그 목록은 이론 매뉴얼 0.1절.
5. 실무 판단은 "실무 판단(HET):" 문단으로 쓴다(교재 PDF에서 주황 박스로 바뀜). 근거는 "근거:" 문단으로 쓴다(회색 박스).
6. 표·체크리스트·식(LaTeX)을 적극 쓴다. 식은 ```latex 코드블록으로 쓰면 교재 PDF에서 번호가 붙은 수식 박스가 된다.
7. 숫자는 출처가 있는 값만 쓴다. 추정·예시값은 반드시 "예시값"이라고 밝힌다.

---

## 3. 이론 매뉴얼 구성 (현재 상태)

| 장 | 제목 | 주요 내용 |
|---|---|---|
| 0 | 문서 개요 | 0.1 근거 자료(교재·[AR]·Tutorial·Technical Doc 태그 표), 0.2 기본값 주의, 0.3 읽는 법 |
| I | QRA 이론 기초 | 절차, 위험도 척도(LSIR·IRPA·FN·PLL·FAR), 허용 기준, ALARP |
| II | SAFETI/Phast 구조와 워크플로우 | 모듈 맵, Asset 계층, 입력, Run Row/Playlist/Combination, 작업 순서, 파일 관리, II.7 작업 흐름·화면(Tutorial), **II.8 물성 시스템(XPRP)·DB, II.9 혼합물 PC vs MC** |
| III | 누출(Discharge) 모델링 | 저장 조건, DISC 식, 시나리오별 적용, Short pipe, 장배관, 시간변화, 대기 팽창, **III.9 DISC·ATEX·TVDI·GASPIPE·PIPEBREAK·CRATER 세부와 검증** |
| IV | 확산(Dispersion)·독성 | UDM 단계·지배 이론, 기상, 열역학·rainout, 풀 확산·증발, 평균화 시간, 건물 내, 확산 종료, 독성, **IV.10a TXCS, IV.11 UDM 세부(INEX·관찰자·AWD·GSC)·검증, IV.12 PVAP, IV.13 BWM·INBU, IV.14 UDM 문서 체계** |
| V | 화재·폭발 | 복사 계산·치사율, Fireball, Pool fire, Jet fire, Flash fire, VCE(ME/BST), 과압 해석, **V.9a 결과용 vs 위험용 폭발, V.11 세부·물성 근거·검증, V.12 화재 모델 문서, V.13 폭발 모델 문서(OREM·1/3 Rule·BLEVE)** |
| VI | 빈도 분석 | 홀 대역, 고장률, Parts count, 점화확률, 이벤트 트리, 탐지·격리 |
| VII | 위험도 계산과 결과 해석 | 기상 입력, 결과→위험 변환, 취약성, 인구, 결과 유형, **VII.6 IRISK, VII.7 MPACT·VULN·Risk Reports·Route** |
| VIII | HET Assumption Register 해설 | 배경·Failure case·빈도·결과·영향/기준·가정 상호작용 |
| IX | QA/QC, 흔한 오류, 민감도 | IX.1 [AR] 확인 필요 14건, IX.2 단계별 체크리스트, IX.3 흔한 오류, IX.4 민감도 케이스, **IX.5 Tutorial·기술 문서 반영 추가 점검 14건** |
| 부록 | A 기호, B 자료 요청, C 출처, D 기본값·권고값 대조표 |

### 3.1 [AR] 확인 필요 사항 요약 (IX.1)

| # | 우선 | 항목 |
|---|---|---|
| 1 | High | 야간 C2.5 / 주간 F1.5 기상 배분(Tutorial도 주간 F1.5·야간 D5를 부적합으로 봄) |
| 2 | High | 복사 치사 기준 이원화(Eisenberg probit / 계단표 12.5 kW/m²→70% / Purple Book probit) |
| 3 | High | 격리 성공 100%(ESD PFD 미반영) |
| 4 | High | 최소 폭발질량 1000 kg |
| 5 | High | 결과용 홀 대역과 IOGP 빈도 대역 불일치 |
| 6 | Med | 액적 상관식(JIP III 기술 vs 기본 Modified CCPS) |
| 7 | Med | 플래시 분율 10–20% 공백 |
| 8 | Med | 풍향 18개 |
| 9 | Med | 기상자료 1년 |
| 10 | Med | Zero-momentum 두 cloud 가중 |
| 11–14 | Low | 섹션 참조 오류, 문서 이력, 인구표 공란, 기본 누출높이 1 m |

### 3.2 아직 확정하지 못한 항목 (IX.5 — 실제 프로그램 화면에서 확인 필요)

Phast 실습과 프로그램 분석으로 **"어느 화면, 어느 입력칸, 기본값이 얼마인지"**까지 확정해 이론 매뉴얼에 반영할 대상이다. Safeti 전용 항목(★)은 Phast로 확인할 수 없으므로 "Safeti에서 확인 필요"로 남긴다.

1. LFL fraction to finish(AR 1.0 vs Tutorial 예제 0.5)
2. Explosion method★, 1/3 Rule, 에틸렌 혼재 시 DDT 처리
3. 최소 지연 점화 확률·조건부 폭발 확률★(Tutorial 예제 0.15/0.9)
4. 혼합물 PC/MC 선택, UDM 1015 경고, 조성 수정 후 Calculate
5. Discharge: metastable liquid, 방출계수 자동 계산, ATEX 'DNV recommended', 속도 상한 없음, Modified CCPS, 0.1 m 이하 배관 처리
6. TVDI 격리·blowdown 입력, 단열 가정
7. Jet fire 모델(Cook/Johnson/Chamberlain/Miller), averaging time 20 s
8. 복사 치사(파이어볼 선량 기준 적용 범위, probit vs 계단표)
9. 독성 평균화 시간(600 s / 18.75 s / 노출시간), 혼합물 방법, CO₂·N₂ 독성 물질
10. 풀 기질·최소 두께, 순간 누출 방유벽 면적 배수(1.5)
11. 장배관 모델 선택(PIPEBREAK/GASPIPE/DISC), CRATER, Route 간격★
12. BWM·INBU
13. Combination 결합 계수★
14. 기상(Run Row별 풍속·안정도)★

---

## 4. 이론 매뉴얼에서 확인된 주요 기본값 (부록 D 요약 — 실습 시 대조용)

| 분야 | 항목 | 값 |
|---|---|---|
| Discharge | 오리피스 상변화 | Disallow liquid phase change(metastable) |
| Discharge | 방출계수 | 액체 0.650, 압축성 Bragg 방법(0.6–1) |
| Discharge | bend 등가길이 | 10D |
| ATEX | 팽창 방법 / 속도 상한 | DNV recommended / 없음 |
| ATEX | 액적 상관식 | Modified CCPS |
| INEX | f_kin / K_D / 순간 누출 방유벽 배수 | 0.04 / 1 / 1.5 |
| UDM | GSC | 옵션 2(dW/dx>2 전체, <0.5 없음) |
| UDM | passive 전환 | 속도비 0.1, 에너지비 0.3, 밀도비 0.015, Ri* 15 |
| UDM/TXCS | 평균화 시간 | 순간 18.75 s, 독성 600 s(농도 약 0.5배) |
| PVAP | 최소 두께 | 젖은 흙 0.01, 마른 흙 0.027, 콘크리트 0.005, 수면 0.0018 m |
| PVAP | 육상 증발 / 물 열전달계수 | MacKay & Matsugu / 500 W/m²K |
| Pool fire | smoky / general | Eₘ 140·Eₛ 20 kW/m²·Lₛ 8.33 m / 복사분율 0.40 |
| Jet fire | 최대 SEP / averaging time | 350 kW/m² / 20 s |
| Fireball | 치사 기준 | 선량 (20 s)·(35 kW/m²)^4/3 |
| Explosion | ME uniform confined | 강도 10, 효율 12.5%, 가연 체적 전체 |
| Explosion | 결과 폭발 중심 / 최저 과압 | 구름 앞끝 50% LFL / 0.02 bar |
| Explosion | 폭연 검증 권고 | ME 곡선 7 또는 BST Mach 0.8866 + 1/3 Rule |
| Explosion | 층류 연소속도 | 고반응성(에틸렌) 0.83, 중반응성 기본 0.52 m/s |

---

## 5. 진행할 작업 (Claude Code 세션)

### 5.0 시작 전 준비 (사용자에게 확인)

- [ ] 개인 컴퓨터에 Phast 설치·라이선스 활성 확인
- [ ] 작업 폴더 생성: 예) `Documents\Phast_Manual\`
  - `01_RE\` (분석 결과 MD, 설정 파일 사본)
  - `02_Studies\` (연습용 스터디 파일)
  - `03_Captures\` (화면 캡처, 이름 규칙: `U-<절번호>_<순번>_<내용>.png` 예: `U-III.2_03_leak_input.png`)
  - `04_UserManual\` (사용설명서 MD·PDF)
- [ ] 화면 제어 도구(컴퓨터 사용) 승인, Phast 제어 승인
- [ ] 디컴파일러(ILSpy 등) 설치 여부 확인 — 없으면 설치하지 않고 화면·파일·블랙박스 분석만 한다

**안전 규칙**
- 원본·업무 스터디 파일은 열거나 덮어쓰지 않는다. 연습용 새 스터디만 만든다.
- System/Admin Parameters(그 PC의 모든 스터디에 영향)는 바꾸지 않는다. 바꿀 설정은 Workspace(스터디) 수준에서만 바꾼다.
- 디컴파일한 코드 자체는 산출물에 넣지 않는다. 확인된 사실(파라미터 이름·기본값·식 일치 여부)만 기록한다.

### 5.1 1단계 — 프로그램 분석(RE) → `Phast_프로그램구성_엔지니어링.md`

**방법**
1. **화면 구조 조사:** 리본·메뉴, Study/Workspace 트리, Equipment·Scenario 종류, 모든 입력 대화상자 탭, Parameters 트리 전체, 결과 보고서·그래프 종류를 캡처하며 목록화.
2. **설정·데이터 파일 분석:** 설치 폴더와 ProgramData의 사용자 설정 파일(Params.xml, Matls.xml 등), 물성 DB(PROPERTY.MDB 등), 도움말 파일을 읽어 정리.
3. **(디컴파일러가 있으면)** GUI 계층 어셈블리에서 파라미터 정의(이름·기본값·단위·허용 범위)와 모델 호출 순서를 확인. 계산 엔진(네이티브 코드)은 블랙박스로 다룬다.
4. **블랙박스 검증:** 변수 하나씩 바꿔 결과 비교 → 이론 매뉴얼의 식·기본값 확인(5.3의 손계산 목록 활용).

**`Phast_프로그램구성_엔지니어링.md` 목차(안)**
1. 프로그램 구성: 모듈(DISC/TVDI/ATEX/UDM/PVAP/TXCS/JFSH/POLF/Fireball/ME·BST·TNT 등)과 호출 흐름도
2. 데이터 구조: Study → Workspace → Equipment → Scenario → Weather → Run Row → 결과
3. 입력 항목 대응표: 화면 경로 | 입력칸 | 내부 파라미터 이름 | 기본값 | 단위 | 이론 매뉴얼 절
4. Parameters 전체 목록(그룹별)과 기본값
5. 물성 시스템: 물질 DB 항목, 혼합물 처리(PC/MC), 확인된 물성 출처
6. 결과물: 보고서·그래프 종류와 각 값의 정의
7. 블랙박스 검증 결과표: 시험 | 입력 | 예상(이론) | Phast 결과 | 오차 | 판정
8. 이론 매뉴얼과 다른 점·새로 확인된 점 → 매뉴얼 수정 목록

**이론 매뉴얼 반영:** 3.2의 IX.5 항목과 부록 D를 확정값으로 갱신한다. 원본은 Claude Docs 문서이므로, Claude Code에서는 `QRA_Master_Manual_이론편.md`를 수정하고 변경 목록을 따로 남긴다(나중에 문서에 반영).

### 5.2 2단계 — Phast 직접 모델링 3종 → 사용설명서

Phast만 있으므로 Safeti 위험 계산(Part VII)은 실습에서 제외한다.

> 아래 입력값은 **예시값**이다. HET 실제 운전 조건이 있으면 사용자에게 받아 바꾼다. 에탄은 임계온도 약 32 °C, 대기압 비점 약 −89 °C.

#### 실습 1 — Dispersion Study (이론 III.2–III.9, IV.1–IV.14)

| 케이스 | 설정(예시값) | 확인할 것 |
|---|---|---|
| D-1 기체 누출 | 에탄 기체 배관, 20 barg·15 °C, 25 mm Leak, 수평, 1 m 높이 | 초기 유량, 출구 상태(ATEX), LFL·½LFL 거리 |
| D-2 액체/2상 누출 | 가압 액체 에탄(포화 근처), 25 mm Leak | 플래시 분율, 액적 SMD, rainout 여부, 중가스 거동 |
| D-3 Short pipe | D-2와 같은 조건, 배관 길이·bend 수 변경 | 마찰 효과, 0.1 m 이하 배관 처리 |
| D-4 시간변화(TVDI) | 용기 재고 지정, 격리·blowdown 시각 지정 | 유량 시간이력, 평균 유량, 격리 효과 |
| 민감도 | 기상 F1.5 / D5 / B3, 평균화 시간 18.75/600 s, 조도, 누출 방향 | 거리 변화와 이론 매뉴얼 설명 일치 여부 |

#### 실습 2 — Pool fire Study (이론 IV.5, IV.12, V.1–V.4, V.11–V.12)

| 케이스 | 설정(예시값) | 확인할 것 |
|---|---|---|
| P-1 rainout 풀 | D-2의 rainout 결과로 풀 형성 | 풀 확산 반경, 증발률, 최소 두께 효과 |
| P-2 방유벽 풀 | 방유벽 면적 지정, 기질(콘크리트/단열 콘크리트) 비교 | 비등 풀 증발(지면 전도), 기질 민감도 |
| P-3 Late/Early pool fire | P-1·P-2의 풀 화재 | 연소율, 화염 높이·기울기, SEP, 4/12.5/37.5 kW/m² 거리 |
| P-4 화염 모델 비교 | single zone vs two-zone(smoky), 풍속 변경 | 근거리·원거리 복사 차이 |

#### 실습 3 — Explosion Study (이론 V.8–V.9a, V.11, V.13)

| 케이스 | 설정(예시값) | 확인할 것 |
|---|---|---|
| E-1 Multi-Energy | D-1/D-2 가연 구름, uniform confined(강도 10, 효율 12.5%) | 과압 거리(0.02/0.07/0.14/0.21 bar 등), 폭발 중심 |
| E-2 장애물 영역 | 장애물 영역(Obstructed region) 입력, 곡선 번호·blockage | 장애물 영역 기반 과압, 1/3 Rule 효과 |
| E-3 BST | 반응성(에탄 중반응성 / 에틸렌 고반응성), 화염속도 | ME와 결과 비교 |
| E-4 TNT | TNT 효율 | 다른 방법과 비교 |
| 민감도 | LFL fraction(0.5/1.0), 폭발 중심 기준 | 폭발 질량·중심 위치 변화 |

### 5.3 이론 대조 손계산 목록 (블랙박스 검증·사용설명서 "이론 대조" 절)

| # | 검증 | 식/방법 | 이론 매뉴얼 |
|---|---|---|---|
| 1 | 액체 누출률 | Bernoulli: Q = C_D·A·√(2ρΔP + ρ²·2gh), C_D 0.65 | III.2, III.9 |
| 2 | 기체 choked 유량 | 이상기체 choked 식(γ, P₀, T₀), 압축성 C_D | III.2 |
| 3 | 플래시 분율 | 등엔탈피: x = C_p(T₀−T_b)/h_fg (근사) | III.7, IV.4 |
| 4 | 평균화 시간 | c(t_av) = c(18.75 s)·(18.75/t_av)^0.2 → 600 s에서 약 0.50 | IV.6, IV.10a |
| 5 | 혼합물 LFL | Le Chatelier: 1/LFL = Σ yᵢ/LFLᵢ | II.8 |
| 6 | 독성 probit | Pr = A + B·ln(Cᴺ·t), ppm·min ↔ 내부 단위 변환 | IV.10, IV.10a |
| 7 | 풀 연소율 | ṁ_max = 10⁻³·ΔH_c/ΔH_v* (탄화수소) | V.4, V.11 |
| 8 | 복사 | I = SEP·F·τ, 시야계수·투과율 | V.1 |
| 9 | 복사 치사 | L = I^(4/3)·t, Pr = A + B·ln L | V.2 |
| 10 | ME 과압 | 환산거리 r' = r/(E/P₀)^(1/3), 곡선 번호별 과압 | V.8 |
| 11 | TNT 등가 | W_TNT = η·m·ΔH_c / 4.68 MJ/kg | V.8 |

### 5.4 3단계 — 사용설명서 작성

**구성:** 이론 매뉴얼과 같은 번호 체계. 사용설명서 절 번호 앞에 `U-`를 붙인다(예: 이론 III.2 ↔ U-III.2).

**각 실습 절의 형식**
1. 목적 — 이 기능으로 무엇을 계산하는가
2. 화면 경로 — 메뉴·탭·대화상자(캡처)
3. 입력 항목표 — 입력칸 | 이론 기호·식 | 기본값 | 이번 실습 값 | 확인 포인트
4. 실행 — 실행 방법, 경고·오류 메시지와 의미(예: UDM 1015)
5. 결과 읽기 — 보고서·그래프 위치, 각 값의 정의
6. 이론 대조 — 5.3 손계산과 Phast 결과 비교표
7. 흔한 실수 — 이론 매뉴얼 IX.3과 연결

**대응표(초안)**

| 사용설명서 | 내용 | 이론 매뉴얼 |
|---|---|---|
| U-II | 프로그램 구성·화면·스터디 만들기·물질 정의·혼합물 | II.1–II.9 |
| U-III | 누출 시나리오 입력과 방출 결과(실습 1 D-1~D-4) | III.1–III.9 |
| U-IV | 확산·독성 결과, 기상·평균화 시간 민감도(실습 1) | IV.1–IV.14 |
| U-IV.5/12 | 풀 형성·증발(실습 2 P-1·P-2) | IV.5, IV.12 |
| U-V.1–V.4 | 풀 화재 복사(실습 2 P-3·P-4) | V.1–V.4, V.11–V.12 |
| U-V.8–V.13 | 폭발(실습 3 E-1~E-4) | V.8–V.9a, V.11, V.13 |
| U-IX | 실습 중 확인한 체크리스트·오류 사례 | IX.2–IX.5 |
| U-부록 | 화면 입력칸 ↔ 파라미터 대응표(1단계 결과) | 부록 D |

**산출물:** `04_UserManual\Phast_사용설명서.md`(캡처는 상대경로로 삽입) → 필요하면 교재형 PDF.

---

## 6. 남은 자료·확인 요청

- (필수에 가까움) 업무 스터디의 Parameters 값 — IX.5 확정용. 단, 개인 PC 실습은 연습 스터디로 진행하므로, 업무 값은 사용자가 따로 확인해 알려 준다.
- (선택) RADS 복사 계산·Vessel burst 모델 문서. 점화·플래시 화재·화재 영향 구역은 [MPACT] 5장으로 대부분 다뤄짐.
- (사용자 제공 시) HET 실제 운전 조건(에탄 저장·이송 압력·온도, 배관 크기, 방유벽 면적, 혼잡구역 치수) — 실습 예시값 대체용.

---

## 7. 참고: 교재형 PDF 재생성 방법

claude.ai 세션에서 쓴 방식이다(Claude Code에서 재현할 때 참고).
1. 매뉴얼 MD → pandoc(`-f markdown+pipe_tables+task_lists --mathml`)으로 HTML
2. BeautifulSoup로 장 표지·절 번호 배지·출처 태그·"실무 판단"/"근거" 박스·체크리스트·수식 번호 처리
3. CSS Paged Media(A4, 장별 named page로 머리글, 쪽번호)로 스타일링
4. Chrome headless(playwright `page.pdf`)로 렌더링. 넓은 수식은 렌더 전 JS로 scale 축소
5. 1차 렌더 후 숨은 마커로 각 절의 쪽번호를 읽어 차례에 채워 2차 렌더, pypdf로 책갈피 추가
- 글꼴: Noto Sans CJK KR(제목), Noto Serif CJK KR(본문). 색: 남색 #14284B, 주황 #E36F2C, 청록 #1F7A8C

---

## 8. 출처 (제공 자료)

- 교육 교재: Safeti Training(678쪽), Phast Advanced Training SA-03 Discharge / SA-04 Dispersion & Toxics / SA-05 Flammables
- 프로젝트: HET-SHQRA-001 QRA Assumption Register Rev.0
- DNV Tutorial: Phast & Phast Lite, Safeti & Safeti Lite, Phast Extended explosions, Safeti Extended explosions
- DNV Technical Documentation:
  - 1 Overview(Results differences, New modelling, V&V, French methodology)
  - 2 Material Properties(XPRP, Multicomponents, Property Database, MC paper)
  - 3 Discharge(DISC Theory·Validation, ATEX Review / Long pipeline: Crater, Gaspipe, Pipebreak Theory·Validation / TVDI Theory·V&V)
  - 4 Pool vaporisation(PVAP Theory·Validation·Verification)
  - 5 Dispersion(BWM, INBU, UDM Theory·THRM·INEX·Droplet·Verification 1–8·A·Validation·CCPS paper·Executive Summary)
  - 6 Toxic(TXCS)
  - 7 Fire(Fireball, JFSH Theory·Validation, POLF, WHFIRE, EXPS)
  - 8 Explosion(OREM Theory·Validation, Solid, BLEVE, Dust)
  - 9 Risk(MPACT Theory·Verification, Risk Reports, Route, Vulnerability, IRISK)
- 읽은 범위: Overview·Material Properties·DISC Validation·TXCS는 전문, 나머지 모델 문서는 요약·서론·결론과 실무 항목(기본값·권고·검증 결론) 검색 위주. 1단계 분석 중 필요한 문서는 다시 정독할 것.
