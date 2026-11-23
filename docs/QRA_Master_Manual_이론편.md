# SAFETI/Phast QRA Master Manual (고급자용)


## 0. 문서 개요

이 매뉴얼은 DNV SAFETI/Phast로 QRA를 수행·검토하는 고급 사용자를 위한 단일 참조서다. 교육교재 4종(약 1,000쪽), HET 프로젝트 QRA Assumption Register, DNV 공개 Technical Documentation을 하나의 흐름(이론 → Phast/Safeti 입력 → 프로젝트 적용 → 검증)으로 재구성했다.

### 0.1 근거 자료

| 약어 | 자료 | 분량 | 이 매뉴얼에서의 역할 |
| --- | --- | --- | --- |
| \[기본\] | Safeti Training (Day 1–4 슬라이드 + Demonstrations & Exercises, 한글 번역본) | 678쪽 | Phast 기본 모델, Safeti 위험도 입력·구조·결과 |
| \[SA-03\] | Phast Advanced Training – Discharge | 76쪽 | 누출·장배관·시간변화·풀 증발 |
| \[SA-04\] | Phast Advanced Training – Dispersion & Toxics | 103쪽 | UDM, 건물 내/후류, 평균화시간, 독성 |
| \[SA-05\] | Phast Advanced Training – Flammables | 140쪽 | 복사열·화재·폭발 모델 |
| \[AR\] | HET-SHQRA-001 QRA Assumption Register Rev.0 (DNV Report 10640598 AI Rev.1, Appendix I) | 2026-11 / 65쪽 | 프로젝트 가정 26개 항목 |
| \[TD\] | DNV Phast/Safeti Technical Documentation (DISC, TVDI, PVAP, UDM, TXCS, JFSH, POLF, Fireball, OREM, VULN, Risk Reports) | 2023–2025판 | 모델 이론식·기본값 보강 |

2026-11-17 추가 자료(\[TUT\]): DNV Tutorial Manual 4종, 모두 **2026-08판**.

| 약어 | 자료 | 쪽수 | 반영 위치 |
| --- | --- | --- | --- |
| \[TUT-P\] | Tutorial – Phast and Phast Lite | 48 | II.7, V.11, 부록 D |
| \[TUT-S\] | Tutorial – Safeti and Safeti Lite | 67 | II.7, VI.4, IX, 부록 D |
| \[TUT-PX\] | Tutorial – Phast Extended explosions | 21 | V.11 |
| \[TUT-SX\] | Tutorial – Safeti Extended explosions | 20 | V.11, IX |

2026-11-17에 DNV Technical Documentation 묶음(1. Overview, 2. Material Properties, 3. Discharge, 4. Pool vaporisation, 5. Dispersion, 6. Toxic, 7. Fire, 8. Explosion, 9. Risk)을 추가로 받아 반영했다. 본문에서 아래 태그로 인용한다.

| 태그 | 문서 | 판/쪽 | 이 매뉴얼에서 쓰는 곳 |
| --- | --- | --- | --- |
| \[RD\] | Results differences between Phast and Safeti versions | 2023-12, 13p | 0.2, III.9, IV.11, V.11, VII.6 |
| \[NM\] | Phast & Safeti – Overview of new modelling and validation (Witlox) | 2017-10, 43p | III.9, IV.11, V.11, VII.6 |
| \[VV\] | Verification and validation – consequence models for accidental releases | 2023-12, 24p | III.9, IV.11, V.11 |
| \[FR\] | Phast methodology for application to risk regulations in France | 2023-12, 21p | IV.11(비교), IX.5 |
| \[XPRP\] | Property System theory (XPRP) | 2024-10, 121p | II.8, II.9 |
| \[MCUG\] | Multi-components in Phast and Safeti (User guide) | 2023-12, 24p | II.9 |
| \[PDB\] | Property Database summary | 2024-10(표지 2026-05), 64p | II.8, V.11 |
| \[MCP\] | Witlox 외, Modelling the consequence of hazardous multi-component two-phase releases (ASSE-MEC) | 9p | II.9 |

모델별 Theory·Verification·Validation 문서 태그:

| 묶음 | 태그(문서) | 쓰는 곳 |
| --- | --- | --- |
| 3. Discharge | \[DISC\] DISC Theory(65p), \[DISC-V\] DISC Validation(34p), \[ATEX\] ATEX Theory·Verification·Validation Review(67p), \[TVDI\] TVDI Theory(84p)·V&V(46p), \[GSPP\] Gaspipe Theory(90p), \[PBRK\] Pipebreak Theory(42p)·Validation(26p), \[CRTR\] Crater Theory(31p) | III.9 |
| 4. Pool | \[PVAP\] Theory(51p), \[PVAP-V\] Validation(54p), \[PVAP-VF\] Verification(40p) | IV.12, II.8 |
| 5. Dispersion | \[BWM\] Building Wake(57p), \[INBU\] In-building(29p), UDM Theory(165p), THRM Theory(33p)·Verification 1–4, UDM INEX Theory & Validation(74p), Droplet size Theory & Validation(148p), UDM Verification 1–8·A, UDM CCPS paper, UDM Executive Summary, UDM Validation(93p) | IV.11–IV.14 |
| 6. Toxic | \[TXCS\] TXCS Theory(22p) | IV.10a |
| 7. Fire | \[FB\] Fireball Theory·Review·Validation(71p), \[JFSH\] Jet fire Theory(39p), \[JFSH-V\] Validation(82p), \[POLF\] Pool fire Theory(45p), \[WHF\] Warehouse fire Theory(48p), \[EXPS\] Radiation exposure Theory(44p) | V.11–V.12 |
| 8. Explosion | \[OREM\] Obstructed Region Theory(76p), \[OREM-V\] Validation(105p), \[BLEVE\] BLEVE Blast(22p), \[SOLID\] Solid explosion(29p), \[DUST\] Dust explosion(30p) | V.13 |
| 9. Risk | \[MPACT\] MPACT Theory(157p), \[MPACT-VF\] Verification(119p), \[RR\] Risk Reports(55p), \[ROUTE\] Route(48p), \[VULN\] Vulnerability(14p), \[IRISK\] IRISK(19p) | V.13, VII.6–VII.7 |

읽은 범위: Overview·Material Properties 문서와 DISC Validation, TXCS는 전문을 읽었다. 나머지 모델 문서는 요약·서론·결론과 실무 항목(기본값, 권고, 검증 결론)을 검색해 읽었고, 수식 유도 전 과정을 모두 옮기지는 않았다.

### 0.2 기본값 주의

교재·Tutorial 예제의 기본값은 프로젝트 파일 설정과 다를 수 있다. Tutorial 기준의 실제 동작과 기본값은 II.7과 V.9a에 정리했다. 예를 들어 수소 기체 누출의 jet fire 기본 모델은 Miller 모델이다(\[SA-05\]). 프로젝트 파일의 Parameters 값은 반드시 실제 파일에서 다시 확인한다.

### 0.3 읽는 법

- Part I–II: QRA 이론 체계와 SAFETI 구조. 처음 맡는 스터디 설계에 사용.
- Part III–V: 결과(consequence) 모델. 각 장은 **이론 → Phast 입력/옵션 → 실무 판단** 순서.
- Part VI–VII: 빈도·점화·이벤트 트리·위험도 합산과 결과 해석.
- Part VIII: HET Assumption Register 26개 가정의 의미와 근거, 민감도.
- Part IX: QA/QC 체크리스트와 이번 검토에서 발견한 \[AR\] 확인 필요 사항.
- 부록: 기호, 출처, 추가 자료 요청 목록.

표기: 교재·문서 근거는 대괄호 약어로 표시한다. 수식은 TD 또는 교재의 식을 옮겼고, 교재에 없는 일반 이론은 출처를 따로 적었다.

## Part I. QRA 이론 기초

QRA는 “얼마나 나쁜가(consequence)”와 “얼마나 자주인가(frequency)”를 결합해 장소·사람·집단별 사망 위험도를 수치로 만드는 절차다. DNV는 위험을 “정해진 기간 또는 조건에서 특정 바람직하지 않은 사건이 일어날 가능성과 그 결과”로 정의한다(\[기본\] Module 1).

### I.1 QRA 절차와 도구 분담

1. Hazard 식별 (HAZID/HAZOP, 재료·재고·조건 선별)
2. 사고 가정(failure case 정의: 섹션·홀 사이즈·격리)
3. 결과 평가 — **Phast** (discharge → dispersion → effects)
4. 빈도 추정 — **Leak**(DNV) 또는 IOGP/HCRD 기반 parts count
5. 위험도 합산 — **Safeti**(MPACT: 이벤트 트리, 기상·풍향, 점화원, 인구, 취약성)
6. 기준 비교 → 미충족 시 결과 완화안 또는 빈도 저감안 도출 → 재계산 → 최적안 선정

결과만으로는 부족한 이유: 대형 사고는 대개 저빈도이고, 소형 사고도 고빈도면 지배적이 될 수 있다. 최악 케이스가 위험을 지배하는 경우는 드물고, 최악 케이스 중심 대책은 비용이 크다(\[기본\] Module 19).

### I.2 위험도 척도

| 척도 | 정의 | 단위 | SAFETI 결과 |
| --- | --- | --- | --- |
| LSIR (Location Specific IR) | 해당 위치에 1년 365일 24시간 보호 없이 있다고 가정한 사망 빈도 | /yr | IR contour (Multi-row/level/vulnerability) |
| IRPA (ISIR) | 특정 개인(직무 그룹)의 실제 체류시간·위치·실내외 비율을 반영한 연간 사망 확률 | /yr | RRP + group 계산 |
| AIR | 노출 인원 평균 IR | /yr | PLL/인원 |
| FAR | 10^8 노출시간당 사망자 수 | – | Category FAR |
| FN curve | N명 이상 사망 사고의 누적 빈도 F(N) | /yr | Smoothed / Raw FN |
| PLL | 연간 기대 사망자 수 ΣF·N | 명/yr | Category PLL |
| Risk Integral | ΣF·N^a (a=회피지수, a=1이면 PLL) | – | SR Ranking Grid |

핵심 식(용어는 부록 기호표 참조):

```latex
LSIR(x,y)=\sum_{e}\sum_{o}\sum_{w,\theta} f_e\,P_{o|e}\,P_{w,\theta}\,P_{ign,d}\,P_{d}(x,y\mid o,w,\theta)\,V
```

```latex
IRPA_g=\sum_{k} LSIR_k\,\varphi_{g,k}\,V_{k},\qquad FAR=\frac{10^8\,PLL}{h_p\,N_e}
```

```latex
F(N)=\sum_{o:\,N_o\ge N} F_o,\qquad PLL=\sum_o F_o\,\bar N_o
```

φ는 위치 k에 체류하는 연간 시간 비율, V는 실내/외 취약성이다. FAR=5, 8시간/교대, 280일/년이면 IRPA는 1.12×10⁻⁵/yr다(\[TD\] Risk Reports).

### I.3 허용 기준

프로젝트 기준(\[AR\] I.6.3, I.6.4 — TotalEnergies HSE-312 / Hanwha TotalEnergies QRA Guideline):

| 대상 | Intolerable (1st priority) | Tolerable (ALARP) | Acceptable |
| --- | --- | --- | --- |
| 작업자 IRPA | > 10⁻³ /yr | 10⁻³ \~ 10⁻⁶ | < 10⁻⁶ |
| 일반인(Public) IR | > 10⁻⁴ /yr | 10⁻⁴ \~ 10⁻⁶ | < 10⁻⁶ |
| 자산 escalation(타 유닛·저장설비) | Undesired > 10⁻⁴ /yr | 10⁻⁴ \~ 10⁻⁵ | Desired < 10⁻⁵ |

FN 곡선은 회사 허용 기준이 없다. 지역사회 위험 평가, 설계안 비교, 저감조치 효과, SIMOPS 검토에 사용한다(\[AR\] I.6.3). 영국 HSE(R2P2)는 일반적으로 작업자 10⁻³, 공중 10⁻⁴, 무시 가능 10⁻⁶ /yr을 사용하며, 교재 연습은 COMAH 기준을 쓴다.

### I.4 ALARP 판단의 핵심

- Tolerable 영역의 결과는 “저감이 합리적으로 실행 가능한가”의 입증이 필요하다.
- QRA의 가치는 절대값보다 **기여도 분석**(IR ranking, SR ranking, Category PLL)에 있다. 저감 대상을 정하는 근거가 된다.
- 가정이 바뀌면 결과는 무효가 된다. 그래서 Assumption Register가 필수다(\[AR\] I.1).

## Part II. SAFETI/Phast 구조와 워크플로우

SAFETI는 Phast의 결과 모델 체인 위에 MPACT 위험 모델을 얹은 구조다. 시나리오별로 기상 카테고리마다 discharge → dispersion → effect를 계산하고, 이를 이벤트 트리·풍향·점화원·인구·취약성과 결합해 Risk Array에 누적한다(\[기본\] Module 15, 19).

> **[그림] Phast–Safeti 계산 체인** — Phast(결과): 누출 시나리오(설비·물질·P·T, 홀·방향·기상) → Discharge(DISC·TVDI·ATEX) → Dispersion(UDM·PVAP·INBU) → Effects(TXCS·JFSH·POLF·Fireball·OREM). Safeti(위험): Event tree·점화 → Hazard zone(치사율 분포, 풍향별 회전) → Risk Array(격자 누적, f×Pw×PET×Pign×L×V) → IR·SR 결과(IR contour, FN, PLL, Ranking). Safeti 입력: 누출 빈도, 기상·풍향 확률, 점화원, 인구, 취약성.

윗줄은 시나리오·기상마다 반복되는 Phast 결과 계산이고, 아랫줄은 Safeti가 이를 이벤트 트리·풍향·점화원·인구·취약성과 곱해 Risk Array에 쌓는 과정이다.

### II.1 모델 모듈 맵

| 단계 | DNV 모델 | 내용 |
| --- | --- | --- |
| Discharge | DISC, TVDI, ATEX, 장배관(Long pipeline) | 저장→오리피스→대기압 팽창, 시간변화 |
| Dispersion | UDM(+INEX, THRM), PVAP, INBU, BWM | jet/dense/passive, rainout, 풀 증발 |
| Toxic | TXCS | dose, probit, indoor dose |
| Fire | JFSH, POLF, BLEV(fireball), EXPS(복사) | 화염 형상·SEP·view factor |
| Explosion | OREM(Multi-Energy, BST), TNT, BLEVE Blast | 과압·충격량 |
| Risk | MPACT, VULN, Risk Reports | 이벤트 트리, 취약성, IR/SR |

### II.2 Phast Asset Hierarchy

Study → Equipment → Scenario 3단 구조다. Equipment에 물질·재고·온도·압력을 한 번 정의하고, Scenario는 홀 사이즈·배관 길이 등만 추가한다. Folder는 계산에 영향이 없다(\[기본\] Module 3).

| Equipment | 사용 가능 Scenario |
| --- | --- |
| Pressure Vessel | Catastrophic Rupture, Leak, Fixed Duration, Short Pipe(Line/Disc/Relief Valve), TV Leak, TV Short Pipe, User Defined Source |
| Atmospheric Storage Tank | 위 목록 + Spill, Vent from Vapour Space(상압탱크 전용) |
| Standalone | TNT/ME/BST Explosion, Fireball, Jet Fire, Pool Fire, Pool Vaporisation, BLEVE Blast |
| Pipeline Polyline / Point | Breach (Safeti는 Section Breach 자동 생성 가능) |
| Warehouse | Fire scenario (PGS15 표준 또는 사용자 정의) |

Workspace 탭: Models, Weather, Parameters, Materials, Map(+Safeti의 Risk, 3D add-in의 Effects). Parameters는 폴더를 여러 개 두고 Study 노드마다 Weather/Parameter 조합을 지정할 수 있다(\[기본\] Module 13).

### II.3 Safeti 위험도 입력

| 입력 | 위치 | 주요 항목 |
| --- | --- | --- |
| Release frequency | 각 Scenario의 Risk 탭 (Grid로 일괄 입력 권장) | event frequency, 영향 유형(Toxic/Flammable/둘 다), 즉시점화 방식(Event tree / 직접입력 / material reactivity / Transport / UKOOA-CLA) |
| Weather probability | Weather 폴더 | 풍향 4·8·12·16·18개, 카테고리×풍향 행렬, 자동 정규화(합이 1이 아니면 “Normalise before calculations”), 북풍=0° |
| Population | Risk 탭 > Populations | Point/Rectangle/Polygon, 인원 또는 밀도, 실내 비율(Fraction indoors for SR), Category |
| Ignition | Risk 탭 > Ignitions | Point, Line/Polyline(Electrical), Rectangle/Polygon, Transportation; ignition probability, in-time period, operating probability, 차량 밀도·평균속도 |
| Risk Ranking Point | Risk 탭 > RRP | 기여도 상세 분석 지점(계산량 증가 주의) |
| Vulnerability | Risk 탭 | 영향 유형별 실내/외 취약성 |

### II.4 Run Row, Playlist, Combination

- **Run row** = Models playlist + Weather folder + Population playlist + Ignition playlist (+RRP)의 한 조합. 각 run row는 독립적으로 계산된다.
- **Weather folder**는 run row에 직접 할당하고, 나머지는 **Playlist**(항목 묶음)로 할당한다.
- **Combination factor**는 run row 결과를 가중 합산한다(최대 20개). 계산에 참여하지 않으므로 계산 후 수정해도 재계산이 필요 없다. 예: 주간 0.4 + 야간 0.6(\[기본\] Module 20).
- 동시에 존재하지 않는 상황(배치안 1 vs 2)을 합산하면 안 된다. 시간 분할(주/야, 여름/겨울)만 합산한다.

```latex
IR_{j,x,y,v}=\sum_{i=1}^{rows} r_{i,j}\,IR_{i,x,y,v}
```

설계 예시(\[기본\] Module 17): Toxic/Flammable × Day/Night × Summer/Winter × Onsite/Offsite = 16 run rows. 차원을 늘릴수록 분석은 유연해지지만 계산 부하가 빠르게 증가한다.

### II.5 실무 작업 순서

1. 목적·범위 확정(제출처, 반경, 포함/제외 설비, 인구·점화원 범위)
2. 자료 수집: P&ID, PFD/H&MB, plot plan, 주야간 인구, 기상, 교통량, 사고이력, 고장빈도 데이터
3. Materials/Mixtures 정의(혼합물 ≤ 6성분 권장, 최대 18)
4. Map/GIS: raster scale·origin, CAD(.dwg) 또는 georeferenced image, 좌표계(CRS)
5. Weather 카테고리·대기 파라미터
6. Parameters의 non-default 항목 입력(Assumption Register와 1:1 대조)
7. Equipment/Scenario 입력(Excel Export/Import로 대량 생성)
8. **Discharge 모드로 먼저 실행** → 누출률·상·지속시간 점검
9. Consequence 모드 실행 → Consequence Data 표로 이상값 검출
10. 빈도·풍향확률·인구·점화원·RRP 입력
11. Run row/Playlist/Combination 구성 → 위험도 계산
12. IR contour, FN, ranking으로 기여도 해석 → 민감도 → 보고서

### II.6 파일·관리 주의

- 파일은 단일 .psux(압축, 결과 포함).
- Phast 스터디를 Safeti로 열어 변환하면 되돌릴 수 없다. 변환 전 사본을 보관한다.
- .psux를 더블클릭하지 말고 프로그램을 먼저 실행한 뒤 File > Open으로 연다.
- System Materials(Matls.xml)·System Parameters(Params.xml)는 Admin Materials/Admin Parameters에서 관리한다. 경로는 C:\\ProgramData\\DNVGL\\(설치 폴더)\\Admin. 변경 시 그 PC의 모든 스터디에 영향을 주므로 프로젝트별 값은 Workspace Parameters에 둔다. 접속 비밀번호는 교재 Module 13–14 참조.
- Run mode: Series / Parallel / Smart(기본). 대형 스터디는 Parallel.
- 결과 유형: Consequence Data(표), Reports(약 40종), Graphs, GIS, 3D. Distance of interest는 Study 노드의 Dispersion 탭에서만 유효하다(\[기본\] Exercise Module 9).

### II.7 작업 흐름과 화면 구조(Tutorial 기준)

DNV는 결과 계산을 먼저 돌려 타당성을 검토한 뒤 위험 계산으로 넘어가라고 권한다. 결과를 이해하지 못하면 위험도 결과도 해석할 수 없기 때문이다(\[TUT-S\] 1.7).

| 항목 | 동작 |
| --- | --- |
| Run Mode | Discharge → Consequence → Effects(Extended explosions) → Risk(Safeti). Safeti 기본은 Risk, Phast + 폭발 add-on 기본은 Effects |
| 위험 계산 실행 | Run Row Selector에서만 가능. 시나리오를 선택하고 Run하면 Mode가 Risk여도 결과 계산만 한다 |
| Active Run Row | 주황 별표(\*). 입력 표시·검사·결과 계산이 이 행의 Weather 폴더·Playlist를 따른다. 선택되지 않은 항목은 회색 |
| Risk 탭 입력 | Mode가 Discharge/Consequence이면 대화상자에 Risk 탭이 보이지 않는다. 빈도 입력 전 Mode를 Risk로 |
| Playlist | ‘All’은 편집 불가. TV 시나리오와 같은 대조용 시나리오는 사본 Playlist에서 빼서 이중계산을 막는다 |
| Combination | 새 workspace는 Combination 1(첫 행 1). 추가한 Run Row는 계수 0으로 생기므로 반드시 수정(예: 주 0.4, 야 0.6) |
| Equipment(Safeti) | Pressure vessel, Atmospheric tank, Pipeline(Polyline/Point), Standalones, CFD hazards(외부 치사율 footprint 임포트), Warehouse, Route |
| Route Model | Scenario group + Route segments. 시나리오는 Event frequency 대신 Event probability(예: rupture 0.1, 액체 leak 0.6, 증기 leak 0.3). 빈도는 segment에 주고(예: 10⁻⁵/yr per 1000 m), Spacing of events는 최소 영향거리 이하(예: 50 m) |
| Plant boundary | 단지 내·외 점화원을 구분한다. FAR 보고서는 경계가 있어야 나온다 |
| Population | 면적형은 Population preferences의 기본 밀도로 초기값이 들어간다. 반드시 인원·실내비율을 덮어쓴다. Grid View는 처음에 잠겨 있다 |
| Weather 폴더 | 풍배도 표가 폴더 대화상자에 있다. 새 workspace는 dummy(균등) 확률이므로 반드시 교체. 새로 넣은 Weather는 확률 0으로 시작 |
| 기타 | Workspace Template > Save로 표준 설정 저장, Insert Equipment on GIS, Exclude from calculations, raster image는 파일을 옮길 때 절대경로로, 라이선스는 Thales |

Phast vs Phast Lite: Lite는 Parameters 탭, TV·User defined source·Spill·Standalones·Warehouse, Mode 선택, ME uniform confined 외 폭발모델이 없다. Safeti Lite는 Route, CFD hazards, Section breach, RRP, Risk transect, Plant boundary가 없다(\[TUT-P\], \[TUT-S\]).

시나리오 선택 팁(\[TUT-P\] 1.13, 1.16):

- 용기 본체의 홀은 Leak, 부착 배관 파단은 Short pipe. Leak는 마찰이 없어 유량이 더 크다.
- Short pipe는 Release height 필드가 없어 상을 계산하지 못한다. Phase to be released를 직접 지정한다.
- TV 시나리오를 Discharge 모드로 먼저 돌려 유량 감소를 본다. 예제는 1시간에 1% 감소여서 TV가 필요 없었다. 필요 없으면 Short pipe로 다시 정의한다(User defined source보다 유지보수가 쉽다).
- 혼잡구역에서 벽·설비에 부딪힐 누출은 Horizontal impingement(운동량 감소 → 초기 공기 혼합 감소).
- 화재 치사율(dose·probit·lethality)은 기본 비선택이다. Fireball/Jet/Pool fire 탭 또는 해당 Parameters에서 켜야 치사 거리가 나온다.
- 독성 실내 영향은 Equipment의 Toxic parameters에서 ‘Specify the downwind building type’을 켜야 계산된다. 기본 표시 치사 수준은 0.1%이다.

### II.8 물성 시스템(XPRP)과 물성 DB

모든 결과 모델(DISC/TVDI, PVAP, UDM 열역학, 화재)은 물성 시스템을 불러 밀도·엔탈피·엔트로피·상평형을 얻는다(\[XPRP\]). 구조는 3층이다.

| 층 | 역할 | 주의 |
| --- | --- | --- |
| 순수 성분 DB | DIPPR 2018(분자량, 임계점, NBP, 온도함수 물성 계수)+DNV DB(독성·가연·풀 화재·수면 물성). PROPERTY.MDB로 합쳐짐 | 온도함수 물성은 DIPPR 식 번호+계수로 저장. 임계온도 이상은 4가지 외삽(상수, 1차 도함수 상수, 2차 도함수 상수, DNV 수정온도법) 중 선택 |
| 혼합 물성(Properties) | 혼합규칙(ideal, Le Chatelier, Kendall-Monroe/Kouzel 점도), 상태방정식(Ideal, 1차 Virial, RK, SRK, PR) | 같은 EOS를 기·액 양쪽에 쓰는 것이 원칙. 액밀도는 EOS보다 DIPPR 포화액밀도나 COSTALD 권장 |
| Flash(상평형) | 등온(T,P), 일정 기화율(이슬점/기포점), 등엔트로피(오리피스 팽창), 등엔탈피(공기 혼합), 일정 에너지(h+½u², 배관·대기 팽창) | 2상(기·액)만. 고체·액액 2상은 못 다룸(CO₂ 고체는 ATEX/UDM 별도 처리) |

혼합물 단순 물성의 규칙(\[XPRP\] 3.2) — 결과에 직접 들어간다:

- **가연/독성 플래그**: 성분 플래그를 먼저 합친 뒤 가연이면 LFL을 Le Chatelier로 계산한다. 결과 LFL이 1.0(몰분율)을 넘으면 비가연으로 바꾼다. 독성이면 희석되지 않은 혼합물을 1시간 노출했을 때의 치사율을 probit으로 구해 0.001 미만이면 비독성으로 바꾼다.
- **화염 유형**: luminous와 smoky 성분 질량을 비교해 무거운 쪽. 독성·불활성 성분은 제외(\[RD\]).
- **인화점**: 성분 최솟값. **반응성(BST용)**: 성분 최댓값, 미지정 가연 성분은 high로 취급.
- **ERPG/NLIV**: 3가지 혼합규칙 중 선택. 양수 값을 가진 성분만 포함.
- **연소계수** Ct(양론 연료 농도)는 Le Chatelier, At는 별도 규칙. 연료 중 N은 100% NO로 가정.
- 'constant' 방법인 물성은 혼합물 대화상자의 Calculate를 눌렀을 때만 계산되고, 조성을 바꿔도 자동으로 갱신되지 않는다. 조성 수정 후 다시 Calculate.

독성 probit DB(\[PDB\] 4.5): Purple Book 값이 있으면 쓰고, 없으면 HSE SLOT(치사≈1%)·SLOD(50%) DTL과 N으로 A, B를 푼다. Purple Book은 mg/m³·min 기준이라 ppm·min으로 바꾼 A′를 쓴다(공기 밀도 1.25375 kg/m³, 282 K·101,510 Pa 기준).

```latex
A + B\ln(SLOT)=2.674\quad(1\%),\qquad A + B\ln(SLOD)=5\quad(50\%),\qquad SLOT,SLOD = C^N t\ [\mathrm{ppm^N\,min}]
```

- 벤젤·톨루엔은 Lees(2005) 값. Safeti-NL은 HSE 값을 쓰지 않는다.
- N₂·CO₂는 probit이 있어도 기본 플래그가 inert라 독성 계산이 안 된다. 질식·CO₂ 위험을 볼 때는 물질을 toxic으로 바꿔야 한다(Safeti-NL에는 HSE RR749 probit을 가진 별도 CO₂ 물질이 있다).
- ERPG는 AIHA 값을 쓴다. 질량 기준 값은 24.45 L/mol(25 °C)로 ppm 변환.
- 이름에 (TG)가 붙은 물질(네덜란드 검토용 probit)이 있다. 일반 프로젝트에서는 고르지 않도록 주의.

수면 풀(PVAP) 물성(\[PDB\] 4.2): 계면장력은 영향이 거의 없고, 용해열은 10⁵ J/kg를 넘으면 증발률을 크게 바꾼다(보수적 기본값을 정할 수 없으므로 실제 값 필요). 용해도는 상충 효과(용해 손실 vs 용해열), 문헌에 '매우 잘 녹음'만 있으면 1 kg/kg. 물–풀 열전달계수는 자료가 없으면 500 W/m²K(연속 누출에는 대체로 보수적, 순간 누출에는 아닐 수 있음). 물과 반응(Raj & Reid)은 암모니아만.

### II.9 혼합물: Pseudo-component(PC) vs Multi-component(MC)

전통적 PC 방식은 혼합물을 평균 물성의 순수 물질처럼 취급해 조성이 끝까지 고정되고, 이슬점과 이슬점이 같다. MC는 성분별 퓨가시티 평형으로 flash를 푼다(\[MCUG\], \[MCP\]).

```latex
z_i=\beta y_i+(1-\beta)x_i,\quad K_i=\frac{y_i}{x_i},\quad x_i=\frac{z_i}{1+\beta(K_i-1)},\quad f_i^{v}=f_i^{l}
```

이상용액이면 Kᵢ=Pᵢ^sat/P. 고압에서는 부피 효과 때문에 SRK/PR 퓨가시티가 필요하다. Cubic EOS 혼합규칙:

```latex
a\alpha=\sum_i\sum_j y_iy_j\sqrt{a_i\alpha_i a_j\alpha_j}\,(1-k_{ij}),\qquad b=\sum_i y_ib_i
```

DNV 구현은 kᵢⱼ 대신 cᵢⱼ=1−kᵢⱼ를 입력받는다(입력 시 혼동 주의). SRK α 초임계 처리: N₂·CO·CO₂·H₂S는 Mathias, H₂는 Graboski-Daubert.

| 템플릿 | 내용 | 쓸 때 |
| --- | --- | --- |
| Phast64 (·SRK/PR/RK) | 구 PC 방식 재현, 이상 퓨가시티, 혼합물 물성 다수가 constant | MC 라이선스 없을 때 유일한 선택 |
| PhastMC (기본) | SRK 기반 물성+이상 퓨가시티, constant 없음 | MC 기본. 고압에서 덜 정확하지만 견고 |
| Soave Redlich Kwong / Peng Robinson | 퓨가시티까지 EOS | 고압 탄화수소 혼합물. 두 식은 거의 같고 PR이 액밀도가 조금 낫다 |
| Ideal and SRK | SRK 물성+이상 퓨가시티 | — |
| Acid Association | 회합(2·3·6·8량체) | HF 전용 |

적용 범위와 한계(\[MCUG\] 2장, 부록 B):

- MC 가능: Catastrophic rupture, Leak, Short pipe(line rupture·disc·RV), Fixed duration, 단독 Pool vaporisation. **불가**: 시간변화 leak/short pipe, Spill, User-defined, 단독 화재·폭발. 선택은 Equipment 수준(아래 시나리오 전부 동일), Study에서 기본값 설정.
- **MC 저장 시나리오는 rainout이 없다**: 확산이 'equilibrium, no-rainout'으로 강제된다. 풀·풀 화재가 나오지 않으므로 무거운 혼합물은 rainout 이후 결과가 부정확하다. 구름 중심선이 지면에 닿을 때 액적이 남아 있으면 **UDM 1015 경고**가 나오니, 이 경고가 보이면 PC로 다시 돌려 비교한다.
- 극성 성분(메탄올, 물 등)이 많거나 공비·액액 분리가 있는 혼합물은 모델링 불가(활동도 계수 모델 미지원). 액상의 H₂·N₂·CO₂·CO·H₂S가 몇 % 이상이면 EOS도 적용 범위 밖이다. 이런 경우 경질가스–탄화수소 kᵢⱼ를 넣는다.
- 물은 특별 취급 없이 DIPPR 성분일 뿐이다(증기표 없음). 확산에서는 단일 에어로졸(SA)과 다중 에어로졸(MA) 중 선택하며, 습한 공기 중 탄화수소처럼 물과 섞이지 않는 경우 MA가 더 정확하다. 에어로졸 클래스(\[PDB\] 4.1): 극성/비극성/CO₂(AC=3, 고체)/양쪽 혼화(AC=11, 경알코올).

PC가 틀린 예(\[MCUG\] 4장): C1–C5 각 0.2 몰, 290 K·10 barg. PC는 이 조건을 증기로 판정해 액체 누출을 고를 수 없고, 포화액으로 강제하면 온도가 195 K(실제보다 약 100 K 낮음)가 된다. MC로 풀면 누출 액의 메탄은 0.02, 펜탄은 0.34로 바뀌고, 최종 온도는 235 K(PC 135 K)다. F1.5에서 LFL 거리는 PC 414 m, MC 435 m, ½LFL은 535 m와 576 m로 방향이 일정하지 않다.

실무 판단(HET): 에탄·에틸렌 주성분 스트림은 휘발도 차가 작아 PC 오차가 비교적 작다. 그러나 탈메탄탑 상부·연료가스(H₂·CH₄ 다량)나 C3+ 혼합 액체처럼 비등 범위가 넓은 스트림은 상 판정부터 달라질 수 있다. 이런 스트림은 표본으로 PC와 MC를 비교해 보고, MC를 쓰면 rainout이 없다는 점을 보고서에 적는다. \[AR\]에는 PC/MC 선택이 적혀 있지 않다.

## Part III. 누출(Discharge) 모델링

Discharge는 물질이 저장 압력에서 대기압으로 전환되는 과정이다. Phast는 저장점(stagnation) → 오리피스(vena contracta) → 대기 팽창 종료점(final) 순으로 풀고, final 조건(온도·액상분율·속도·액적경·유량·지속시간)이 UDM의 입력이 된다(\[SA-03\]).

### III.1 저장 조건과 상(phase)

- 가압용기/장배관: 포화액(bubble point, P 또는 T 지정) 또는 P·T 지정. 상압탱크: T만 지정.
- 과열액(superheat = Tst − Tsat(Pa) > 0) → flashing, 과냉액(< 0) → 액체-액체 팽창.
- CO₂는 오리피스 하류 고체(dry ice) 효과를 반영한다. 다른 물질은 고체상 진입 시 경고만 낸다.

### III.2 DISC 오리피스 모델 이론

액체 누출의 사전 압력(액두 포함):

```latex
P^*_{st}=P_{st}+\rho_L g\,\Delta H,\qquad \Delta H=H_L+\Delta H_P
```

저장점 → 오리피스는 등엔트로피 팽창이다:

```latex
h_{st}=h_o+\tfrac12 u_o^2,\qquad s_{st}=s_o,\qquad v_o=\frac{1-\eta_o}{\rho_{L,o}}+\frac{\eta_o}{\rho_{V,o}}
```

오리피스 압력은 P\_o = max(P\_a, P\_c)이고, choke 압력 P\_c는 질량플럭스 G\_o = u\_o/v\_o를 최대화하는 압력이다. 유량과 지속시간:

```latex
Q=C_D\,A_o\,G_o,\qquad t_{rel}=M_{st}/Q
```

- 비압축성 액체는 Bernoulli 옵션(u\_o = √(2(P\_st−P\_a)/ρ\_L))을 쓸 수 있다. 기본은 compressible flow 식이다.
- C\_D: 순수 액체는 0.6–1 범위의 하한을 쓴다고 TD가 설명하며, 부록에는 0.65가 나온다. 압축성 유체는 Bragg(1960) 기반 2차식으로 구한다(\[TD\] DISC). 두 값이 엇갈리므로 보고서의 C\_D 수치를 직접 확인한다.
- **Metastable liquid(기본, 보수적)**: 오리피스 상류에서 상변화를 허용하지 않는다. 액체가 같은 상으로 오리피스를 통과하므로 P\_o = P\_a, 유량이 최대가 된다. ‘Allow phase change(equilibrium)’는 더 정확할 수 있지만 비보수적일 수 있다(\[SA-03\]).

### III.3 시나리오별 적용

| Scenario | 특징 | 모델 포인트 |
| --- | --- | --- |
| Catastrophic rupture | 순간 방출, 방향 없음 | 엔트로피·엔탈피 보존, 팽창에너지, 액적경 상관식. 액두 평균압력 P\_i = P\_st + ½ρ\_L g H\_L |
| Leak | 연속, 방향 있음, 마찰 없음 | 액면 아래는 액체, 위는 증기 누출 |
| Fixed duration | 홀 크기 미정, 지속시간 지정 | Q = M/t (예: 1,000 kg / 600 s = 1.67 kg/s) |
| Line rupture | 짧은 배관 완전파단, 수축 없음 | 마찰·밸브·굴곡·이음 손실, Pump/Compressor/Control valve, 격리밸브로 지속시간 제한 |
| Relief valve | 입구 수축(RV 오리피스) + 배관 | Min RV diameter ratio, Safety factor(유로면적 배수) |
| Disc rupture | 수축 없음 | ‘Critical pressure’ 이상에서만 2상 누출 |
| Vent from vapour space | 상압탱크 충전 중 벤트 | y\_c = P\_v(T\_st)/P\_a, 배출체적 = 주입액체체적 |
| User Defined Source | 방출 조건 직접 입력 | 기존 시나리오에서 Create Source로 복사 후 수정(원 시나리오와 연동 안 됨) |

RV/Disc는 과압(증기 누출) 또는 과충전·액팽창(2상 누출)을 대상으로 한다. 큰 증기공간 용기는 증기, 작은 증기공간(반응기·액체용기)은 2상으로 본다.

### III.4 Short pipe 마찰 모델

단열 관로 흐름(질량·에너지·운동량 보존)을 풀고 마찰을 아래처럼 합산한다(\[TD\] DISC §3):

```latex
F_{friction}=\frac{4fL_{eff}}{D}+\sum_{i=1}^{3}N_iK_i+N_{coup}K_{coup}+N_{junc}K_{junc}+F_{entry}
```

- 교재: bend 1개 = 배관 10D 등가길이, coupling 0.04, junction 1.0 velocity head(\[SA-03\]). \[DISC\] 이론서도 bend 등가길이를 10D(Perry, 곡률반경/직경≈3)로 고정한다. 프로젝트 파일에서 실제 값을 확인한다.
- 밸브(excess-flow, non-return, shut-off)의 속도수두 손실은 기본 0이다.
- Choke는 dP/dl → −∞(dF/dP = 0)에서 일어난다. G를 반복해 경험적 마찰과 열역학적 마찰을 일치시킨다.

### III.5 장배관(Long pipeline)

- 적용: L ≫ 300D. 최소 breach 면적은 액체 20%, 기체 4%(\[기본\] Module 4). 항상 시간변화 모델이며 기본 대표 유량은 0–20 s 평균이다.
- 과냉액에는 적용 불가(TVD 모델로 전환 경고). 가압 기체·과열액만 대상.
- Breach aperture 0.2–1.0. 관끝 breach = 면적/단면적, 중간 breach = 0.5×면적/단면적.
- 상류(A)·하류(B) 가지의 교란영역 성장과 역류를 푸며, 총 유량 = A + B(disjoint flow).
- 매설 배관은 crater(점토·사질·혼합, 수직 상향 jet 가정)를 적용한다. Fracture length는 관 1본(12–16 m), 용접부를 넘으면 2본을 권장한다.
- Heat transfer 모델은 ‘No’ 권장. 밸브가 많으면 time step을 늘린다.
- Safeti Pipeline Risk는 ΔP < 20%, 길이 > 500 m 기준으로 sub-section을 자동 분할한다(\[기본\] Module 18).

### III.6 시간변화 누출(TVDI)

기본 Leak/Short pipe는 초기 유량(최대)으로 전량이 다 빠질 때까지 방출한다. 계산이 쉽고 보수적이다. TV 시나리오는 감압·액위 강하를 풀고, 기체는 대기압 도달, 액체는 액위가 누출점 아래로 내려가면 종료한다.

| 대표 유량 옵션 | 내용 | 권장 용도 |
| --- | --- | --- |
| Averaged rate | 전체 평균 | 간이 |
| Rate at given time | 특정 시각 유량 | 특정 관심 시각 |
| Average between 2 times | 구간 평균(장배관 기본 0–20 s) | 가연성 cloud |
| Up to 10 rates | 등질량 구간으로 observer 배치(10 rate = 9 등질량 구간) | 정밀 해석 |

- Segment data는 단시간 누출의 fireball과 실내 누출 계산에만 쓴다.
- 안전시스템: 격리 성공(‘time to isolation’에 중단), 격리 실패(인접 용기 재고 추가), blowdown(지정 지름으로 배출).

### III.7 대기 팽창(ATEX)과 액적

- ATEX 기본 ‘DNV Recommended’: 증기·CO₂는 conservation of momentum, 2상·액체는 closest to initial conditions(TD의 minimum thermodynamic change). Rainout이 없으면 2상에도 momentum 방법이 더 정확하다(\[SA-03\]).
- 액적경 기본 = Modified CCPS. 선택지: Original CCPS, Melhem, DNV JIP(Phase III). HSL rainout 실험에서 Modified CCPS가 가장 정확했다(\[TD\] V&V).
- Phast의 증기 팽창 온도는 이론값이라 이슬점 근처까지 낮아질 수 있다(\[AR\] I.3.8).

### III.8 실무 판단

- 누출 방향: Horizontal, Horizontal impingement, Angled, Vertical, Downward impinging. impingement는 운동량을 잃어 구름이 두껍고 짧아진다.
- In-building release: 건물 내 완전혼합 후 환기량으로 방출, 액적은 건물 내 포집(기본), 건물 내 압력상승 미고려.
- Discharge만 먼저 돌려 누출률 상식 검증(예: 기체 choke 여부, 액체 √ΔP 비례)을 한 뒤 전체 계산으로 넘어간다.
- 포화 액화가스를 5 ℃ → 50 ℃로 올리면 압력·플래시율이 커져 final 온도·액상분율이 크게 바뀐다. 교재 연습(Chlorine)으로 감도를 익힌다.

### III.9 Discharge 세부 모델과 검증

근거: \[DISC\] DISC Model Theory, \[DISC-V\] DISC Validation, \[ATEX\] ATEX Theory·Verification·Validation Review, \[TVDI\] TVDI Theory·V&V, \[GSPP\] Gaspipe Theory, \[PBRK\] Pipebreak Theory·Validation, \[CRTR\] Crater Theory, \[NM\], \[VV\].

**DISC 하위 모델** — 초기율(최악) 방출과 지속시간을 주고, 대기 팽창은 ATEX가 이어받는다.

| 모델 | 내용 | 핵심 가정·입력 |
| --- | --- | --- |
| Orifice(Leak) | 용기 구멍. 저장점→오리피스 등엔트로피 팽창 | 저장 압력은 액면 상부 기준, 액체 두두(+펌프 두두)를 더함. 기본 'Disallow liquid phase change'(metastable liquid): 액체는 오리피스까지 플래시하지 않고 오리피스 압력=대기압. 기체·2상은 질량플럭스가 최대가 되는 압력으로 choke. 2상 저장은 액/기/균질 2상(champagne) 중 선택. 증기 누출도 전체 재고가 방출된다고 보므로 재고·지속시간이 과대될 수 있다 |
| Short pipe | Line rupture, Relief valve(수축 오리피스+tailpipe), Disc rupture | 배관 내 질량·에너지·운동량 보존, 벽면 열전달 없음, 등에너지(h+½u²) flash. choke는 dF/dP=0. 유량은 오리피스 모델로 상한(파라미터로 해제 가능). 출구 속도가 음속을 10% 넘으면 경고. 배관 내 질량은 용기 재고에 더해짐 |
| Instantaneous | 전체 재고 순간 방출 | 저장→대기 한 단계, 사실상 ATEX가 계산 |
| Vapour vent | 충전 중 기상부 배출 | ATEX 호출 없음 |
| Fixed flow rate | 펌프(액)·압축기(기)·상류 제어밸브 | Q\_fixed에 맞게 저장 압력을 반복(상한 800 bar). PC 모드만, 2상 저장 상태 불가. 제어밸브는 파단 후 유량을 유지하도록 수축 직경을 둔다(제어 동특성은 모델링하지 않음). 하류 압력이 대기압보다 낮게 계산되면 오류 |

배관 마찰(\[DISC\] 3장): F\_friction = 벽면(Fanning, 조도 z₀) + bend(개당 10D 등가길이) + 밸브(종류별 K: excess flow, non-return, shut-off) + 이음쇠(K 고정값) + 입구 손실. 예: 10 m·0.2 m 배관에 bend 2개면 유효 길이 14 m. RV는 수축비(Aₒ/Aₚ)가 작을수록 입구 손실이 커지고, R\_neq는 과다 천공 등을 고려한 안전계수다.

방출계수(\[DISC\] 부록 B): 액체는 Cᵢ=0.650, 압축성 유체는 Bragg(1960) 일반화법으로 계산한다(범위 0.6–1). 'Is discharge coefficient specified?' 기본 FALSE. 오리피스 모델의 Bernoulli 옵션도 기본 FALSE다.

**검증 결론과 권고** (\[DISC-V\] 결론, \[VV\] 2장): 검증은 해석해(Bernoulli·이상기체)와 Sozzi & Sutherland, Uchida & Nariai(물), Shell 프로판·부탄 자료에 대해 수행했다.

- 오리피스 앞이 포화·과냉액일 때 균질평형(flashing) 가정은 유량을 과소 예측해 비보수적이다. metastable(no flashing) 기본값이 더 정확하고 대체로 보수적이다. 2상 유입에서는 두 가정의 결과가 같다.
- 포화액과 저압 과냉액의 오리피스·초단관(≤ 0.1 m)은 Bernoulli가 가장 잘 맞는다. 저건도(약 0.7% 미만) 2상은 Bernoulli+forced-phase로 보수적 상한을 잡을 수 있다.
- 물 기준 약 57 barg를 넘는 고압 과냉액은 비플래시 압축성 모델(기본)이 Bernoulli보다 낫다.
- 0.1 m보다 긴 배관은 균질평형 배관 모델이 적합하다. 평형에 도달하는 거리는 L/D가 아닌 절대 거리로 약 75–100 mm다(DIERS, Lees). 그보다 짧은 배관에 배관 모델을 쓰면 유량을 과소 예측할 수 있다.
- DIERS 설계용 최소 질량플럭스 모델을 누출원 모델로 쓰면 유량을 과소평가한다(CCPS QRA 지침).

**ATEX(대기 팽창)** (\[ATEX\]): 미지수는 팽창 후 직경·속도·온도(또는 액분율)·밀도·엔탈피다. 질량·에너지(h+½u²) 보존과 상태식에 더해 운동량 보존 또는 엔트로피 보존 중 하나를 쓴다.

```latex
G=\rho_{vc}A_{vc}u_{vc}=\rho_fA_fu_f,\qquad u_f=u_{vc}+\frac{P_{vc}-P_a}{\rho_{vc}u_{vc}}\ (\text{운동량}),\qquad h_f+\tfrac12u_f^2=h_{vc}+\tfrac12u_{vc}^2
```

- 옵션: 0 minimum thermodynamic change, 1 isentropic, 2 conservation of momentum, **4 DNV recommended(기본)**. 속도 상한은 기본 없음(고정값 또는 음속 상한 선택 가능).
- 결론: 운동량 보존+속도 상한 없음이 근거리 농도를 가장 정확하게 예측했다(BG 천연가스·에틸렌, HSL 수소, Desert Tortoise·FLADIS 암모니아, EEC 프로판, Goldfish HF, CO2PIPETRANS). 수소는 상한 제거 효과가 크고 천연가스는 작다. 둘 다 약간 과소 예측한다.
- 기체 누출에서는 운동량 보존이 선택된다. 액체 누출에서는 보통 isentropic이 선택된다. rainout이 있으면 isentropic을 유지한다. Phast rainout 상관식이 isentropic 조건에 맞춰져 있기 때문이다. rainout이 없는 액체 누출은 운동량 보존이 권고된다.
- UDM은 공기 혼합을 등엔탈피로 보아 초기 운동에너지를 빼므로 ATEX의 에너지 보존과 엄밀히 일치하지는 않는다.
- 액적 상관식: Original CCPS, Modified CCPS(기본), Melhem, JIP III. JIP 상관식은 오리피스 L/D(2–50 범위)를 쓴다. HSL·CCPS rainout 실험에서 Modified CCPS가 가장 정확했다(\[VV\] 표 1).
- 수소·천연가스처럼 음속이 큰 기체에서 상한을 두면 근거리 농도가 커지고 수평 누출의 부력 상승이 달라지므로, 프로젝트 파일에서 상한이 해제돼 있는지 확인한다.

**TVDI(시간변화 방출)** (\[TVDI\]): 용기(배관 유무)의 누출, 연결 배관 파단, 압력 방출장치를 다룬다. 매 시간 스텝마다 DISC로 유량을, ATEX로 대기 팽창을 구한다.

- 가정: 유체–벽–외기 사이 열전달 없음(단열), 기·액·벽은 열평형, 액 팽창(swell) 무시, 액상은 1개. 기체 팽창일(PV)을 포함한다.
- 질량 흐름: 생산 유입, 생산 기·액 유출, 사고 누출, blowdown(기상부). 격리(ESD)와 blowdown은 사용자가 지정한 시각에 일어난다. 구멍은 하나만 모델링한다.
- 균질 혼합 용기는 기체 또는 2상, 층분리 용기는 기체 또는 액체로 누출한다. MC 대상이면 기·액 조성을 시간에 따라 추적한다.
- 가압 액체 용기는 진공 방지 밸브와 공기 유입(gulping)을 모델링한다. 층분리 2상 용기는 공기 유입을 다루지 않는다.
- 단열 가정 때문에 저온(MDMT) 판단에는 쓰지 않는다. 실험에서는 유체가 벽보다 빨리 식는다.
- \[AR\]의 탐지·격리 시간(VI.6)은 TVDI의 isolation 시각에, blowdown은 blowdown 시각·밸브 크기에 대응한다. 입력 파일에서 직접 대조한다.
- TVDI 검증은 \[TVDI\] V&V 문서와 이상기체·물 해석해(\[VV\] 그림 3), CO₂ 실험이 있다.

**장배관(GASPIPE, PIPEBREAK, CRATER)** (\[GSPP\], \[PBRK\], \[CRTR\], \[NM\] 1.4):

| 모델 | 대상 | 특징 |
| --- | --- | --- |
| GASPIPE | 기체 장배관 | Fannerøp & Ryhming 기반. 상·하류 분기를 같은 방법으로 풀고, 등온 choke(속도 음속보다 약간 낮음)와 choke 압력 변화율을 반영. 비이상 상태식, 펌프 유입, 밸브 차단 포함. choke 압력은 빠르게 대기압 근처로 떨어진다 |
| PIPEBREAK(-II) | 액체·2상 장배관 | 임계점에서 특이점이 없도록 만든 적분 모델(에틸렌 Tc≈10 °C, \~100 bar 수송 대상). 초기 급감압, 과냉액 배액(drainage), 펌프 유입, 역류, 밸브 차단, 임의 위치·크기의 puncture, 양쪽 끝 기여. Isle of Grain 프로판·CO2PIPETRANS와 잘 맞고, 대체로 보수적(유량↑, 초기 재고↑, 감압 빠름, 온도↓) |
| CRATER | 매설 배관 | Cooltrans 모델. 분화구 출구면에서 초기 속도 감소와 공기 희석을 주고 수직 제트로 가정. 토양 clay/mixed/sandy. 매설 깊이가 깊을수록, 느슨한 토양(sandy)일수록 속도 감소가 크다. 보통 토피 1–1.5 m. puncture는 24–36″ 배관의 25–50 mm 구멍으로 검증. 큰 구멍은 보통 전단 파단으로 진전 |

- 두 분기(상류 A, 하류 B)의 방출은 같은 방향으로 부딪혀 하나의 구름(T)이 된다고 보고, 질량·운동량·에너지(또는 액 질량) 보존과 전체 SMD로 합친다.
- Safeti 장배관 위험: 구간은 밸브 위치로 나누고, 하위 구간은 초기 압력강하 20% 이하·배관 길이 20% 이상·500 m 이상으로 자동 설정한다. 사건 간격은 최대 치사 거리의 50%. 모델 선택: 개구율 20% 초과 액체는 PBRK, 4% 초과 기체는 GSPP, 그 외는 정상 DISC 오리피스. 방출 결과가 10% 이내로 비슷하면 시나리오를 통합한다. 이벤트 트리는 탐지 확률과 상·하류 격리 확률을 쓴다.

실무 판단(HET): 로딩암·이송 배관은 대부분 Short pipe나 Leak(배관 길이 > 0.1 m)로 다룬다. 에탄 액체는 임계온도(약 32 °C)에 가까워 물성과 플래시 거동에 민감하다. metastable 기본값, ATEX 'DNV recommended', Modified CCPS 상관식, 속도 상한 해제를 프로젝트 Parameters에서 확인한다. 장거리 에탄 수송 배관이 범위에 있다면 PIPEBREAK/GASPIPE 선택 기준과 매설 여부(CRATER)를 \[AR\]에 명시해야 한다.

## Part IV. 확산(Dispersion)·풀 증발·독성(Toxics)

UDM(Unified Dispersion Model)은 jet, 중가스(dense), 부력(buoyant), passive 확산과 액적 rainout·재증발을 하나의 적분형(integral) 모델로 푼다. 연속, 순간, 유한지속, 시간변화 누출을 모두 다룬다(\[TD\] UDM Theory). 장애물, 가변 조도, 비평탄 지형, 풍향 변화, 횡풍 누출은 다루지 않는다(\[TD\] V&V, \[기본\] Module 6).

### IV.1 확산 단계

| 연속 누출 | 순간 누출 |
| --- | --- |
| I. 초기 난류 팽창 jet(방출 운동량 혼합) | I. 급속 팽창(팽창에너지 혼합, 가압은 INEX) |
| II. dense 난류 plume | II. dense 난류 cloud |
| III. slumping(중력 퍼짐) | III. slumping cloud |
| IV. passive(대기 난류 혼합) | IV. passive |

고도 상태: elevated → touching down → ground-level → lift-off → elevated → mixing layer capping. Lift-off는 Richardson수 < −20이고 jet 단계(원형 퍼짐)일 때만 가능하다(\[SA-04\]).

### IV.2 UDM 지배 이론

- 미지수: cloud 질량, 속도(u\_x, u\_z), 위치(x, z), 기질 열·수증기 유입, 폭. 식: entrainment, 운동량(지면 항력·부력), 열전달, 수증기 전달, 퍼짐율.
- 농도는 단일 상사(similarity) 프로파일로 수평·수직 지수감쇠를 쓴다. 지수 m, n은 근접장에서 크고(날카로운 경계) 원거리에서 m = 2(Gaussian)가 된다(\[TD\] UDM CCPS paper).

| Entrainment | 구동력 | 계수 |
| --- | --- | --- |
| Jet | plume–풍속 차 | α₁ = 0.17 (Ricou-Spalding 0.282 / 1.7) |
| Cross-wind | 바람에 의한 휘어짐 | α₂ = 0.35 (Briggs 0.6 / 1.7) |
| Heavy gas | 상부 유입속도(κ = 0.4, u\*) | Ri\* < 0 Havens-Spicer, Ri\* > 0 Britter |
| Passive near-field | 대기 난류 | McFarlane(연속 고도 누출) |
| Passive far-field | Gaussian σ\_y, σ\_z | 경험 확산계수 |

- 접지한 중가스 plume은 jet과 heavy-gas entrainment의 **합이 아니라 큰 값**을 쓴다(McQuaid 실험 검증). 중가스 횡방향 퍼짐 C\_E = 1.15(Van Ulden).
- Passive 전환: cloud 밀도≈대기, 속도≈풍속, 비passive entrainment가 작아지고 중가스는 Ri가 작을 때. 전환대에서 근접장 항을 줄이고 원거리장 항을 키운다.
- Parameters > Far field의 passive 전환 기준은 예외적 경우에만 바꾼다(\[SA-04\]).

### IV.3 대기 조건

Pasquill 안정도: A(매우 불안정) … D(중립) … F(안정), G(매우 안정, 안개). 안정할수록 cloud가 높은 농도로 멀리 간다. 가연성 질량과 독성 dose가 커진다(\[기본\] Module 7).

| 10 m 풍속 (m/s) | 주간 일사 강 | 중 | 약 | 야간 구름 < 3/8 | 야간 엷은 구름 / > 4/8 | 두터운 구름(주야) |
| --- | --- | --- | --- | --- | --- | --- |
| < 2 | A | A–B | B | (–) | (–) | D |
| 2–3 | A–B | B | C | F | E | D |
| 3–4 | B | B–C | C | E | D | D |
| 4–6 | C | C–D | D | D | D | D |
| > 6 | C | D | D | D | D | D |

야간에는 A–C가 나오지 않는다. 이 점은 Part IX의 \[AR\] 기상 검토에서 다시 쓴다.

- 풍속 프로파일: power law(기본) 또는 constant. 온도 프로파일: logarithmic(기본). 풍속·온도는 높이, 안정도, 조도의 함수.
- Mixing layer height는 안정도별로 설정한다. 기본 Constrained(혼합층에서 cloud 상단 제한).
- Surface temperature(dispersion용)은 지면→cloud 열전달, (pool용)은 방유제 온도다.

조도: 교재 식은 z₀ = 10·exp(−0.4/SRP)이며, z₀는 돌출물 유효 평균높이의 약 1/30이다(\[SA-04\]). Purple Book 기본값:

| 지표 | z₀ (m) |
| --- | --- |
| 개방 수면(≥ 5 km) | 0.0002 |
| 갯벌·눈, 초목·장애물 없음 | 0.005 |
| 평탄 개활지, 초지 | 0.03 |
| 낮은 작물, 간헐적 큰 장애물(x/h > 20) | 0.10 |
| 높은 작물, 산발적 큰 장애물(15 < x/h < 20) | 0.25 |
| 공원·관목, 다수 장애물(x/h < 15) | 0.5 |
| 규칙적 대형 장애물(교외, 숲) | (1.0) |
| 도심(고층·저층) | (3.0) |

z₀가 커지면 지면 풍속은 낮아지고 난류는 커진다. 중가스 최대 위험거리에 큰 영향을 준다(\[AR\] I.2.1). z₀는 큰 장애물의 효과를 표현하지 못한다.

### IV.4 열역학·Rainout

- Cloud = 방출물질(증기·액) + 건조공기 + 수분(증기·액·얼음) + 기질 열.
- **Droplet non-equilibrium(기본)**: 액적 온도 < 증기 온도, 액적 질량·운동량·에너지식으로 궤적 계산. Equilibrium 옵션과 ‘No rainout, Equilibrium’(액적 강제 부유) 옵션이 있다. 기본값을 바꾸지 않는다(\[SA-04\]).
- 액적이 지면에 닿는 지점이 풀 중심이다. 방유벽이 액적 궤적을 막으면 방유벽 위치가 rainout점이 된다.
- 과열 jet(Tboil < Ta)은 에어로졸 + 비등 풀, 과냉 jet은 고속일 때만 에어로졸, 아니면 거의 100% rainout.

### IV.5 풀 확산·증발(PVAP)

```latex
M=\pi r^2 h\rho_L,\quad \frac{dM}{dt}=S-E_{vap}-E_{sol},\quad \frac{dr}{dt}=\sqrt{2g(h-h_{min})}\ (\text{land})
```

```latex
M C_{pL}\frac{dT}{dt}=Q_{spill}+Q_{cond}+Q_{conv}+Q_{rad}-Q_{vap},\qquad E_{vap}=Q_{vap}/\Delta h_{vap}
```

| 기질 | h\_min (m) | k\_s (W/m·K) | α\_s (m²/s) |
| --- | --- | --- | --- |
| 습한 토양 | 0.01 | 2.21 | 9.48×10⁻⁷ |
| 건조 토양 | 0.027 | 0.32 | 2.44×10⁻⁷ |
| 콘크리트 | 0.005 | 1.21 | 5.72×10⁻⁷ |
| 단열 콘크리트 | 0.005 | 0.22 | 8.27×10⁻⁷ |
| 수면 | 0.0018 | – | – |

- 바닥 전도는 Shaw-Briscoe 반무한 고체, 대류는 Fleischer(충류 Re ≤ 3.2×10⁵에서 Nu = 0.664Re^½Pr^⅓), 장파 복사 ε = 0.95. 육상 증발은 MacKay-Matsugu, 수면은 Dodge 상관식을 쓴다(\[TD\] PVAP).
- 수면 확산은 gravity-inertia(r ∝ t^½) → gravity-viscous(r ∝ t^¼) → viscous-surface tension. 물 위 암모니아는 용해열·반응열을 반영한다.
- 풀은 항상 원형이고 두께가 균일하다. 방유벽에 닿거나 h\_min에 도달할 때까지 퍼진다.
- 방유벽 옵션: cannot fail / rainout always inside / fails if overfilled(범람 시 방유벽 무시). 방유벽은 원형, 설비는 중심 가정. Catastrophic rupture의 방유벽 면적 배수는 HSE 권고 기본값을 쓴다.
- Spill scenario는 상압탱크에서만 가능하고, Standalone Pool vaporisation 결과는 확산에 자동 연결되지 않는다.

### IV.6 평균화 시간(Averaging time)

Passive 영역에서만 풍향 사행(meander)을 반영해 중심농도를 낮추고 폭을 넓힌다(\[TD\] TXCS eq.25):

```latex
c(x)=\left(\frac{t_{av}^{ins}}{t_{av}}\right)^{0.2}c_{ins}(x),\qquad \sigma_y(x)=\left(\frac{t_{av}}{t_{av}^{ins}}\right)^{0.2}\sigma_y^{ins}(x),\qquad t_{av}^{ins}=18.75\ \mathrm{s}
```

| 용도 | t\_av (s) | 중심농도 보정계수 |
| --- | --- | --- |
| Core / Flammable | 18.75 | 1.00 |
| Toxic(위험도 표준) | 600 | 0.50 |
| STEL | 900 | 0.46 |
| IDLH | 1800 | 0.40 |
| ERPG, NL 개입치(LBW/AGW/VRW) | 3600 | 0.35 |

- 양수 독성(N ≫ 1, 농도 지배)은 18.75 s, N ≈ 1(dose 지배)은 t\_av = t\_exp가 물리적으로 맞다. 이때 t\_av = min(max(18.75, t\_exp), 3600)(\[TD\] TXCS §4.3).
- 노출시간 t\_exp는 누적 dose의 5%–95% 사이 시간(f = 0.05)이다. 연속 누출이면 t\_exp ≈ 0.9 t\_dur.
- 정확한 독성 결과를 원하면 Core averaging time을 실제 평균화 시간과 같게 둔다(\[SA-04\]).
- Flammable averaging time은 바꾸지 않는다(\[SA-05\]).

### IV.7 유한지속·시간변화 확산

- Release observer를 일정 간격으로 두고 각각 정상상태 계산 → 시간 이동 → 질량 보정 → along-wind diffusion(AWD) 적용. AWD는 원거리 농도를 낮춘다.
- Gravity-spreading 보정: 저풍속 대형 중가스에서 cloud를 하류로 늘리고 좁힌다(면적 보존).
- Finite-duration correction(Phast 전용)은 최대농도만 예측한다.
- 기본(계산시간 최소): 용기 leak/line rupture는 초기 유량, 장배관은 0–20 s 평균. 정밀: 10 rate(9 등질량 구간).
- Observer 시간이동 문제가 있으면 pool observer를 줄이고, 증발율 변동이 크면 늘린다.

### IV.8 건물 내 누출(INBU)과 후류(BWM)

- INBU: 건물 내 완전혼합, 환기구를 통해 대기 방출, 내부 농도 축적·감쇠 계산. 기본 건물은 시간당 3회 환기. 폭발은 NFPA 2007/2013 옵션.
- BWM roof/lee(TNO SDI): 근접장 c = Q/(K·A·u), K = 1(기본). 위험도 계산에는 등가 건물(폭=길이=√(B·L), 풍향각 0)을 자동 적용한다.
- Chimney(Dutch National Model): 큰 굴뚝 영향 없음, 중간 굴뚝 plume 하강, 작은 굴뚝·지붕 누출은 후류에 완전 포집. 증기·비순간 누출에만 적용.
- CFD Dispersion Source: 가연성(또는 독성+가연성) 물질만, Leak와 Liquid spill 입력. 원 시나리오와 연동되지 않는다.

### IV.9 확산 종료점(Concentration of interest)

- 가연성: UFL, LFL, LFL fraction(기본 0.5). 기본으로 LFL fraction에서 계산 종료. ‘LFL fraction to finish’는 지연 폭발·flash fire의 최대거리도 정한다.
- 독성: Toxic parameters의 Minimum probability of death에서 종료(또는 사용자 지정 농도·거리). ERPG-1이 종료점 역할을 한다.
- Height of interest(General parameters)에서 독성 영향·농도 거리를 계산한다.

### IV.10 독성 영향(TXCS)

```latex
L_{tox}=\int_0^{T}C(x,t)^N\,dt\ \ (\text{정상: }L=C^N t_{dur}),\qquad Pr=A+B\ln L_{tox}
```

```latex
P_{death}=\tfrac12\left[1+\mathrm{erf}\left(\frac{Pr-5}{\sqrt2}\right)\right]
```

- 물질 DB는 ppm·분 단위 A, B, N을 저장하고, 내부 계산은 몰분율·초로 환산해 A에 반영한다. 교재 예: 염소 A = −4.81, B = 0.5.
- Dangerous dose: 계산 load가 DTL(기본 HSE SLOD, ppmⁿ·min) 이상이면 P = 1, 미만이면 0. 물질당 최대 6단계.
- 혼합물: Product of each toxic material(기본, 성분이 독립적으로 치명, P\_death = 1 − Π(1 − P\_i)), Most toxic material probit, Mixture probit(A, B, N 필요). Warehouse fire는 항상 Product 방식.
- 실내 dose: dC\_in/dt = (C\_out − C\_in)/τ, τ = 1/(환기율). Tail time은 외부 농도가 최대의 95% 감소한 시점부터 사람이 건물을 나오는 시점까지다. 건물은 풍하 방향에 있다고 가정하므로 위치 입력이 필요 없다.
- CO₂·N₂를 독성으로 보려면 ‘Carbon dioxide (toxic)’, ‘Nitrogen (asphyxiating)’을 쓴다.
- Hanna의 로그정규 농도 변동을 보면 UDM 시간평균 농도는 중앙값에 가깝다. 매우 짧은 노출의 최대 농도는 이보다 크다(\[SA-04\]).

### IV.10a TXCS 독성 계산 세부

근거: \[TXCS\] TXCS Model Theory. TXCS는 UDM 농도로 선량, probit, 치사확률, 적분 치사확률, 노출시간을 계산한다. DB의 A, B, N은 ppm·분 단위다. 내부에서는 몰분율·초로 계산하므로 A를 다음과 같이 바꾼다.

```latex
A'=A-B\ln 60+B N\ln 10^6,\qquad Pr=A'+B\ln\!\int C^N dt\ \ (C:\text{몰분율},\ t:\text{s})
```

**평균화 시간**: 풍향 사행(meander)은 passive 전환 뒤에만 들어간다(제트·중가스 단계는 미적용). 독성 기본 t\_av=600 s이면 passive 농도는 순간값(18.75 s)의 절반이다((18.75/600)^0.2≈0.50). 대안으로 t\_av = t\_exp(18.75–3600 s 범위) 옵션이 있고, 이때 노출시간은 선량의 5%→95%가 쌓이는 시간이다(중심선 기준, 비평균 구름으로 계산). N≫1인 농도 지배 물질은 평균화하지 않는 것이 맞고, N≈1인 선량 지배 물질은 평균화 시간이 노출시간을 넘지 않아야 한다. 10분과 1시간 평균의 농도 차이는 probit 자체의 불확실성보다 작다는 것이 독성학자 의견이다.

| 기능 | 내용 | 쓸 때 |
| --- | --- | --- |
| Probit(기본) | P\_death = ½\[1+erf((Pr−5)/√2)\] | 일반 위험 계산 |
| Dangerous toxic load | SLOD 이상 1, 미만 0의 계단(B=10⁶으로 구현) | HSE 방식. SLOD 밖 생존자와 바깥 사망자가 상쇄된다는 가정 |
| Concentration threshold | 농도가 임계값을 넘으면 치사확률 = max(지정 최소값, probit 값) | 고농도 노출 시 즉시 무력화(피난 불가) 반영 |
| Threshold dose effect | ERPG/STEL/IDLH 농도×기준 시간으로 만든 선량을 넘으면 1 | 영향 구역 산정. 혼합물은 additive(기본, 보수적) 또는 non-interactive |
| 실내 선량 | Bellamy 모델: dC\_in/dt=(C\_out−C\_in)/τ, τ=1/환기율. 외부 농도가 최댓값의 95% 아래로 떨어진 뒤 tail time이 지나면 밖으로 나간다 | 건물 안 인구. 외부에 더 남아 있는 구름 노출도 더해진다 |

혼합물 치사확률 3가지: (A) 사용자 지정 혼합 probit, (B) 가장 독한 성분 probit에 독성 성분 농도 합을 적용(한 성분이 압도적일 때), (C) 성분별 독립 치사 1−Π(1−pᵢ). 가장 독한 성분은 미리 정해지므로 위치에 따라 바뀌지 않는다.

실무 판단(HET): 에탄 터미널은 주로 가연성 위험이지만, 부대 설비에 독성 물질(예: 암모니아 냉동, H₂S 함유 연료가스)이 있으면 평균화 시간(600 s vs 18.75 s, \[AR\]과 대조)과 혼합물 방법을 명시한다.

### IV.11 UDM 세부 모델과 검증

**새 INEX(가압 순간 누출 초기 팽창)** (\[NM\] 2.1, \[VV\] 3.1):

| 항목 | 이전 INEX | 현재 INEX |
| --- | --- | --- |
| 팽창 에너지 | (정체 엔탈피−팽창 후 엔탈피)−(Pₛₜ−Pₐ)/ρₛₜ | f\_kin×(정체 엔탈피−팽창 후 엔탈피), f\_kin=0.04(Pattison 권고) |
| 구름 형상 | 구 | 구(고도) 또는 지면에 잘린 구 |
| 반경 팽창 | R(t) 해석식 | 반경 방향 운동량 보존(rainout 손실 제외) |
| 연직 운동 | 높이 고정 | UDM 연직 운동량식(중력 포함) |
| 액적 | 한 개가 고정 각도로 이동 | 구름 부피에 균일 분포 |
| INEX 중 rainout | 없음 | 접지 중 시간변화 rainout, K\_D(지면에 닿은 액적 중 rainout 비율, 기본 1) |
| UDM 전환 | dR/dt가 1 m/s로 감소 | INEX 유입률 = UDM 유입률(지면 구름은 중가스 확산속도보다 느려지면 더 일찍) |

구름 팽창속도는 f\_kin¹ᐟ⁸에 비례한다. Maurer(프로필렌 452 kg), Schmidli(R-12), Pettitt, Landis 실험에서 이전 INEX는 반경·속도를 과소 예측했고, 새 INEX는 더 가까웠다. 결과적으로 농도·선량은 작아지고(덜 보수적) rainout은 늘었다. 실험의 가시 구름 반경은 습도에 따라 커지지만 농도 영향은 작다. 새 시나리오에서는 순간 누출의 방유벽 면적에 배수 1.5가 기본 적용된다(HSL 월류 실험).

**시간변화 확산: 관찰자(observer) 방식과 AWD** (\[NM\] 2.2): 예전 방식은 누출량을 같은 질량의 세그먼트로 나눠 각각 정상 계산했다. 현재는 다음 순서로 계산한다.

1. 일정 시간 간격으로 관찰자를 방출하고 각각 정상 계산(GSC 포함)
2. 출력 시각별로 관찰자 농도 지정
3. 시간 이동(너무 가까워지거나 추월하지 않게)
4. 관찰자 속도가 다르면 질량 보존 보정(OMC)
5. Along-wind diffusion 적용

- 풀과 연결: rainout 전에는 누출점에서, 이후에는 풀의 **풍상 가장자리**에서 관찰자를 방출하고 풀 위를 지나며 질량을 주운다. 구름이 누출점보다 풍상에서 시작할 수 있다.
- 풀 하풍 끝에서 '전체 방출량 보존' 검사를 하고, 실패하면 단순 모델로 바꾼다(빠르게 증발하는 풀은 순간 누출로 처리). UDM3 188/189 오류가 나오면 관찰자 질량 보존 문제를 의심한다.
- AWD는 원거리 최대 농도를 낮춘다. 대략 x > uₐ·t(풍속×누출시간)인 구간에서 효과가 크고, 가연보다 독성에 중요하다. 폭발은 AWD 적용 전 가연 질량으로 계산한다(두 질량은 보통 비슷).

**하향 중력확산 보정(GSC)**: 횡풍 방향만 다루면 저풍속·고밀도 구름이 비현실적으로 넓어진다. GSC는 증분 구름 면적을 보존하면서 횡풍과 하풍 확산을 같게 맞춘다(좁고 길게). 풀/면원 위와 passive 전환대에는 적용하지 않는다. 옵션: (1) 없음, (10) 전체(Kit Fox에서 농도 과대), **(2) 기본: dW\_eff/dx>2면 전체, <0.5면 없음, 그 사이 점진 적용**. 대형 중가스 누출+매우 낮은 풍속에서만 의미 있다. 예: Cl₂ 10분 누출 F1.5에서 GSC 후 폭이 좁아지고 농도가 커졌고, AWD 후 원거리 농도는 작아졌다.

**기타 기본 설정** (\[RD\] 표 4·5):

- 종료 기준: mixed-basis(기본). 필요한 최원 거리까지 항상 계산한다. Safeti는 치사 1%(지정 시 개입치)까지, Phast는 최소 치사까지 계산해 독성 영역이 예전보다 커 보일 수 있다.
- 독성 스텝: 기상·시나리오마다 치사 1%까지 99등분. Safeti-NL은 실내 독성을 실외×0.1 대신 실내 모델로 계산.
- 건물 후류 모델(BWM, Safeti만): 건물·풍향 각도를 0으로, 직사각 건물을 같은 면적의 정사각형(√BL)으로 자동 치환한다. 건물 안은 위험 0, 후류 안은 균일, 하풍으로 감소.
- 육상 풀 증발: MacKay & Matsugu 상관식이 기본(증발↓, 도니가 거의 100% rainout인 상압탱크에서 효과 큼). 방유벽에 닿으면 풀 중심이 풍상으로 이동할 수 있다(덜 보수적).
- 방유벽 처리: 액적이 방유벽에 부딪히면 그 지점이 rainout점이되, 방유벽 중심은 누출점에 남는다(예전에는 rainout점으로 이동). 액적이 방유벽을 넘으면 방유벽 밖 rainout.

**검증·타당성** (\[VV\] 3장): 근거리 제트는 해석해·Pratte-Baines·Briggs 상승식, 중가스는 2D 해석해·McQuaid·HTAG 풍동·HEGADAS, passive는 Gauss 해석식, 열역학은 HEGADAS(HF는 Schotte), 유한지속은 HGSYSTEM/SLAB, 시간변화는 HEGADAS-T·Kit Fox와 비교했다. 대형 현장실험(Prairie Grass, Desert Tortoise, FLADIS, EEC, CO2PIPETRANS, Goldfish, Thorney Island, Maplin Sands, Burro, Coyote, Kit Fox)을 MG(관측/예측 기하평균 편의)·VG(분산)로 평가했다. 대체로 양호하고 **Maplin Sands는 과소 예측** 경향이다. 2상 제트는 '적당한' 수준이다. Kit Fox 순간 퍼프에서는 AWD가 FDC보다 MG가 낮아 더 보수적이다. Graniteville 염소 사고에서 다른 5개 모델과 비교했다. UDM 한계: 장애물, 가변 조도, 비평탄 지형, 지면으로 향한 하향 충돌(Jack Rabbit II 사례).

**비교: 프랑스 규제 방법** (\[FR\]) — 같은 Phast를 다르게 쓴다는 참고용이다.

- 기상: 수평 지면 누출 D5(주간)·F3(야간). 조도 산업단지 0.95 m(SRP 0.17), 저식생 0.18 m.
- 독성: SEI/SPEL(1%)/SELS(5%) 임계치를 dangerous dose(Cᴺ·t) 방식으로 넣는다. probit을 쓰지 않는다.
- 독성 평균화 시간: t\_av = max60 s, min(t\_exp, 600 s) 또는 3600 s 상한(Technip). N≫1이면 평균화 없이 18.75 s. SO₂ 예(1494 s 누출)에서 SEI 거리는 600 s일 때 816 m, 1494 s일 때 767 m.
- 혼합 독성 임계치는 Le Chatelier(예: Cl₂ 0.1+SO₂ 0.1+N₂ 0.8 → SEI 744 ppm). 일반적 방법은 성분별 치사확률을 1−Π(1−pᵢ)로 합친다.
- 가연: LFL(½LFL 아님), 폭발 중심은 cloud centroid, 과압 0.05/0.14/0.2/0.3 barg, ME 모델(TNT 금지). 화재 2분 미만은 복사 선량 1800/1000/600 (kW/m²)^4/3·s, 2분 이상은 8/5/3 kW/m².
- 이 방법은 법적 거리 산정용이다. 위험 계산용 치사 타원에는 600 s 고정 평균화가 권장된다(\[FR\] 2.2.3 끝).

### IV.12 PVAP 풀 확산·증발 세부

근거: \[PVAP\] PVAP Theory, \[PVAP-V\] Validation, \[PVAP-VF\] Verification. PVAP는 단독으로 돌리거나 UDM이 rainout 뒤 호출한다. 육상·수면, 순간·연속·시간변화 방출을 구분하고 질량·열수지를 따로 유지해 풀 온도가 변한다.

- **확산**: 육상은 TNO 중력 확산식 dr/dt=√(2g(h−h\_min))으로, 최소 두께에 가까워질수록 느려진다. 수면은 Dodge 모델(중력-관성 → 중력-점성 → 점성-표면장력)을 쓴다. 풀은 동심원으로 커지다가 방유벽에 닿거나 최소 두께에 이르면 멈춘다. 순간 누출은 최소 두께 도달 후 그 두께를 유지하며 줄어든다.
- **최소 두께 h\_min**: 젖은 흙 0.01 m, 마른 흙 0.027 m, 콘크리트·단열 콘크리트 0.005 m, 수면 0.0018 m(Purple Book). 매우 거친 흙(0.025 m)은 없다. h\_min이 커지면 최대 풀 면적이 작아져 증발율·풀 화재 크기가 줄어든다. 방유벽이 없는 연속 유출에서는 이 값이 풀 반경을 정하므로 기질 선택을 확인한다.
- **열수지(육상)**: 지면 전도(Shaw & Briscoe, 반무한 매질, 기질 열전도도·열확산율), 대기 대류(Fleischer), 일사(πr²S)·장파 복사, 증발 잠열. 비등 풀은 전도가, 증발 풀은 물질전달(MacKay & Matsugu 기본)이 지배한다. 수면은 용해·용해열·암모니아 반응(Raj & Reid)과 물–풀 열전달계수(II.8)를 쓴다.
- **검증**(\[PVAP-V\]): 육상 확산 최대 +50%, 육상 비등 양호, 육상 동시 확산·증발 30% 이내, 수면 비등 탄화수소 20% 이내(질소 +50%), 수면 확산 양호(순간이 연속보다 정확), 수면 동시 확산·증발은 과도하게 보수적, 암모니아 수면 반응 양호. 육상 증발은 MacKay & Matsugu가 가장 잘 맞아 기본이 됐다. 혼합물 풀은 HGSYSTEM LPOOL과 비교했고 LNG 혼합물 실험(Burgess)으로 검증했다(\[VV\] 3.5).
- **검토 의견**(\[PVAP-VF\], Webber, GASP 비교): PVAP는 증발과 비등을 따로 다루어 결과가 덜 매끄럽다. MacKay & Matsugu는 차원적으로 완전하지 않고, Dodge 수면 확산은 크기 확장에 주의가 필요하다. GASP는 최소 두께 0을 권고하지만 PVAP는 0을 허용하지 않는다.

실무 판단(HET): 에탄은 대기압 비점이 약 −89 °C인 극저온 비등 풀이다. 증발은 초기 지면 전도가 지배하고 기질 열물성에 민감하다. 탱크 방유벽·섬프(sump) 바닥 재질(콘크리트/단열 콘크리트)과 방유벽 면적을 \[AR\]과 입력에서 대조한다.

### IV.13 건물 영향: 후류(BWM)와 실내 누출(INBU)

**BWM(Building Wake Model)** (\[BWM\]): TNO 공식에 기반한다. 지붕·후류(recirculation zone) 내 정상·순간 방출은 SDI 모델, 지붕 굴뚝의 정상 수직 방출은 네덜란드 National Model로 계산한다.

- 후류 영역에 들어간 오염물은 전부 잡힌다고 보고, 그 안의 농도를 균일하게 둔 뒤 '가상 면원'으로 하풍 확산한다(순간 방출은 후류 체류시간 포함). 후류 길이는 Fackrell 식 옵션이 있다. 건물 축과 풍향의 각도를 허용하지만, Safeti는 위험 계산에서 각도를 0으로 두고 같은 면적의 정사각형 건물로 바꾼다(IV.11).
- 대기 조건은 건물 높이(지붕·후류 방출) 또는 굴뚝 높이에서 자동 설정된다. 너무 무거운 구름은 적용 범위 밖으로 검사한다. 창고 화재(WHFIRE) 결과를 입력으로 받을 수 있다. TNO SDI와 수계산으로 검증했다.

**INBU(In-building)** (\[INBU\]): 건물 안 누출을 이상 혼합으로 보고 외부 확산용 누출원을 바꾼다. 자연 환기(시간당 환기 횟수 n\_ac)와 강제 환기(환기량) × 순간·연속 누출의 4가지 조합이 있다. 액체 일부나 전부를 건물 안에 남길 수 있다.

- 자연 환기에서는 외부 방출 지속시간이 최소 한 번의 환기 시간 t\_ac = 1/n\_ac다(예: 4회/h면 900 s). 순간 누출은 환기 한 번 동안 일정률로 나간다고 본다. 외부 누출률이 낮아지고 공기가 섞여 밀도가 줄어든다.
- 실내 농도 상승·감소를 해석적으로 계산한다(INBU-TV, 외부 확산에는 쓰지 않음).
- 가연성: 실내 배기 폭발은 NFPA 68로 환기구 비율 1–16%에 대해 계산한다(건물이 0.1 bar 이상을 견디지 못하는 경우). 건물이 파괴되면 구속에 의한 강한 폭발을 TNT 효율로 보고한다.
- 선별(screening) 수준 모델이다. 정밀한 실내 농도가 필요하면 CFD를 쓴다.

실무 판단(HET): 분석기실·컴프레서 쉘터 등 실내 누출원이 있다면 INBU 적용 여부와 환기 횟수를 \[AR\]에 적는다. 건물 주변 독성 누출에서 BWM을 쓰면 건물 안은 위험 0으로 계산되므로 건물 인구의 취약성(VII.3)과 중복되지 않게 한다.

### IV.14 UDM 기술 문서 체계와 핵심 결론

UDM 기술 문서는 이론(UDM Theory), 열역학(THRM Theory, Verification 1–4: 개요·평형·HF·액적), 가압 순간(UDM INEX Theory & Validation), 액적·rainout(Droplet size Theory & Validation), 검증(Verification 1–8, A: 개요·passive·제트·중가스·전환·순간·유한지속·시간변화·대기), 타당성(UDM Validation), 요약(Executive Summary, CCPS paper)으로 나뉜다.

- **단일 농도 분포**: 제트의 가장자리가 뚜렷한 분포부터 Gauss 분포까지 하나의 형태를 써서 단계 전환 때 1차 불연속이 없다. 고도·접지 중·지면·부상(lift-off)·혼합층 캡핑을 연속으로 다룬다. 풍속·기온·기압·밀도의 고도 변화를 반영한다.
- **passive 전환 기준**: 속도비 0.1, 에너지비 0.3(HGSYSTEM과 동일), 밀도비 0.015, 임계 Richardson 수 15, 전환대 비 2. 평균화 효과는 전환 이후에만 들어간다. 모델 계수는 문헌 실험값에서 가져왔고 검증 실험에 맞추지 않았다.
- **열역학(THRM)**: 오염물과 습한 공기의 혼합(지면 수증기·열전달 포함)을 풀어 오염물(기·액), 물(기·액·얼음), 온도, 밀도를 구한다. 평형 모델(모든 성분 같은 온도)과 비평형 모델(액적 온도 별도, 액적 궤적·질량·온도 방정식)이 있고, CO₂(고체)·HF(중합·안개)는 전용 처리한다. 액적이 충분히 크면 rainout한다.
- **액적 크기와 rainout**(Droplet JIP I–IV): 관측 SMD는 JIP III 상관식이 가장 잘 맞았지만, rainout은 Modified CCPS가 가장 정확했다. UDM에 2차 분열 모델이 없어 초기 SMD 정확도가 rainout 정확도로 이어지지 않기 때문이다. 그래서 rainout 계산에는 Modified CCPS가 기본이다. 과냉 누출은 오리피스 속도 기준 Weber 수(Melhem)가 더 정확했다.
- **타당성 요약**(UDM Validation): Prairie Grass·Desert Tortoise·BP·Shell·EEC·Kit Fox 양호, 2상 에어로졸(Desert Tortoise, EEC, FLADIS) '적당', 가압 CO₂(매설 배관 COSHER 포함) 매우 우수(저농도 과대 경향), Kit Fox 연속 매우 우수, Thorney Island 양호. AWD는 전반적으로 MG가 낮아 더 보수적이다. 안정도 F가 가장 잘 맞고(약간 과대), D가 가장 나쁘다. LNG 풀(Burro, Maplin Sands, Coyote)은 PHMSA 방법으로 다시 평가했다. 일부 범주는 실험이 2건뿐이라 검증 자료가 부족하다.
- **검증(Verification 1–8, A)**: 각 단계를 해석해·HGSYSTEM·SLAB·다른 모델과 비교한다(IV.11 참조).

## Part V. 화재·폭발(Flammables)

점화 시점과 누출 형태가 결과 유형을 정한다. 즉시 점화는 jet fire·fireball·(early) pool fire, 지연 점화는 flash fire·VCE·(late) pool fire가 된다. Linked 모델은 가능한 모든 결과를, Standalone은 관심 현상 하나를 더 유연한 입력으로 푼다(\[SA-05\]).

### V.1 복사열 계산

```latex
I=SEP\cdot V,\qquad V_{A_1\to dA_2}=\iint_{A_1}\frac{\tau\cos\beta_1\cos\beta_2}{\pi r^2}\,dA_1
```

- Observer: Planar(기본, 평면 기울기·방위를 최대 복사가 되도록 탐색) vs Point(cosβ₂ = 1, 항상 최대). Point가 더 보수적이다.
- 복사 타원: 화염 풍상(A)·풍하(B)·횡풍(C) 3점으로 만든다. Reference height 기본 0 m.
- 결과: radiation at a point, vs distance, ellipse, contour(footprint/side/cross/user plane).

### V.2 복사 치사율

```latex
L_{rad}=I^{4/3}\,t,\qquad Pr=A+B\ln L_{rad}\ \ (\text{Safeti 기본 Purple Book: }A=-36.38,\ B=2.56,\ I\ [\mathrm{W/m^2}],\ t\ [\mathrm{s}])
```

- 화염 내부(fireball은 화구 아래 포함) → 치사율 1.
- 화염 외부에서 L > L\_cr = (35 kW/m²)^{4/3} × 20 s → 1(실내·외, IR·SR 모두).
- L < L\_cr: IR(옥외 무보호)은 probit, SR은 실내 0, 옥외 0.14×probit(옷에 불이 붙지 않는 경우)(\[SA-05\]).

Probit 선택의 영향(계산값). \[AR\]은 Eisenberg(Pr = −14.9 + 2.56 ln(I^{4/3}t), I kW/m²)을 제시한다. 이는 Purple Book보다 약 2.1 probit 낮다.

| I (kW/m²) | t (s) | Eisenberg P\_death | Purple Book P\_death |
| --- | --- | --- | --- |
| 12.5 | 20 | 0.0002 | 0.065 |
| 12.5 | 60 | 0.21 | 0.90 |
| 25 | 20 | 0.11 | 0.80 |
| 25 | 30 | 0.42 | 0.97 |
| 37.5 | 20 | 0.56 | 0.99 |

표의 값은 erf 식으로 직접 계산했다. Eisenberg에서 25 kW/m²·30 s가 약 42%로 \[AR\]의 LC50 정의(25 kW/m², ≥ 30 s)와 맞는다. 반면 \[AR\] Table 6.1.4의 옥외 취약성(12.5 kW/m² → 70%)은 두 probit보다 훨씬 보수적이다. 어느 방법이 SAFETI에 적용됐는지 Part IX에서 확인 항목으로 다룬다.

### V.3 Fireball

- 발생: 가압 가연물의 catastrophic rupture, 또는 연속 누출 지속시간 < Cut-off time(기본 20 s).
- 가연 질량(CCPS): 증기분율 ≥ 1/3이면 전량, 미만이면 3 × 증기질량.
- **Martinsen & Marx(기본, 동적)**: t\_flame = 0.9M^{0.25}, lift-off t\_lo = t\_flame/3. 지면 단계는 반경 증가·SEP 일정, 상승 단계는 반경 일정·등속 상승(중심높이 3r까지)·SEP 선형 감소. SEP 상한 400 kW/m².
- 정적 모델: TNO r = 3.24M^{0.325}, t = 0.852M^{0.26}, H = 2r(지상 보수적). HSE t = 0.45M^{1/3}(M ≤ 37 t), 2.59M^{1/6}(M > 37 t), H = r. Hybrid는 TNO 기하 + HSE SEP.

```latex
SEP=\frac{f_s\,M\,\Delta H_c}{4\pi r^2 t_{flame}},\qquad f_s=0.27\left(\frac{P_{sat}}{10^6\,\mathrm{Pa}}\right)^{0.32}
```

근거: \[TD\] Fireball. 일부 상수는 문서 추출이 깨져 있어 원본 확인이 필요하다(부록 자료요청).

### V.4 Pool fire(POLF)

- 형상: 기울어진 원기둥(D, H, θ). Early pool fire = 연소율과 풀 유입율이 같아지는 크기(즉시 점화), Late pool fire = 최대 풀 반경(지연 점화).
- 연소율: 물질 DB 값 > 0.001 kg/m²s면 사용, 아니면 연소속도 × 액밀도. 수면 풀은 2.5배.

```latex
\dot m=\dot m_{max}\left(1-e^{-D/L_b}\right),\qquad D_{early}=\min\left(D_{lim},\sqrt{\frac{4S}{\pi\dot m_{max}}}\right)
```

```latex
\frac{H}{D}=42\left(\frac{\dot m}{\rho_a\sqrt{gD}}\right)^{0.61}\ (\text{Thomas}),\qquad \cos\theta=1/u^*\ (u^*>1)
```

- SEP: Luminous E\_f = E\_m(1 − e^{−D/L\_s}). Smoky(> C5)는 E\_m 구역과 그을음 E\_s = 20 kW/m²(고정)의 조합. General은 χ\_R · ṁ · ΔH\_c/(1 + 4H/D), χ\_R = 0.4(Safeti) / 0.35(Safeti-NL).
- 예: 프로판 E\_m 160 kW/m², L\_s 2.75 m. 등유 E\_m 140, L\_s 8.33 m(\[TD\] POLF).
- Two-zone 모델은 smoky 물질(예: n-Hexane)에만 적용한다. 하부 luminous 구역 SEP가 더 크다.
- Phast는 KFX CFD로 원형·사각 풀 화재를 풀 수 있다(standalone).

### V.5 Jet fire(JFSH)

| 모델 | 형상 | 적용 |
| --- | --- | --- |
| Cone – DNV Recommended(기본) | 기울어진 원뿔대 | 비수평 증기: Chamberlain, 수평 증기: Johnson, 액체·상: Cook et al. |
| API RP 521 | 바나나형, 원 10개 | 수직·수평만, flare용 |
| Miller | 직선 2구간(운동량·부력), 선광원 | 저주도 화염(H₂, syngas). H₂ 증기 기본 |

Chamberlain 핵심 식(\[TD\] JFSH):

```latex
D_s=2r_j\sqrt{\rho_j/\rho_{amb}},\qquad L_B=L_{B0}\left(0.51e^{-0.4U_w}+0.49\right)\left(1-0.00607(\theta_{jv}-90)\right)
```

```latex
SEP=\frac{F_s\,\dot m\,\Delta H_c}{A},\qquad F_s=0.21e^{-0.00323v_j}+0.11
```

- 스토이키오메트리 질량분율 W\_st = M\_W/(15.816M\_W + 39.5), β = 2.85, SEP 상한 350 kW/m²(이전 400).
- Cook 2상: 유효원 직경에 Tsat 증기밀도 사용, 연소 질량 = M·min\[1, 3(1 − η\_rainout)\], 20 s 시간평균.
- Cone 모델은 음의 각도 누출, 횡풍, 지면 충돌(원뿔 회전·이동)을 처리한다.

### V.6 Flash fire

- 지연 점화 cloud의 연소. 복사 계산 없이 LFL(또는 LFL fraction) 면적으로 표현한다.
- 위험도: 연소 영역 내부 치사율 1, 외부 0. 풀 위에 cloud가 있으면 late pool fire와 결합한다.
- 즉시 flash fire는 ‘averaged cloud’ 농도가 UFL multiple × UFL로 낮아질 때 발생한다.

### V.7 Flammable parameters 주요 항목

| 항목 | 의미 | 기본/권고 |
| --- | --- | --- |
| Cut-off time for short continuous releases | 이보다 짧은 연속 누출은 fireball·early explosion도 계산 | 20 s |
| LFL fraction to finish | flash fire·지연폭발 최대거리, 확산 종료 | 0.5 (\[AR\]: 1.0) |
| Results grid-step X | late explosion 계산 간격 | 10 m |
| Match fireball duration and mass | t\_FB\[M\_out(t)\] = t가 되는 질량 사용 | 선택 |
| Flammable averaging time | passive 단계에서만 사용 | 18.75 s(변경 금지) |
| Exposure time | 피난 시작 전 체류시간 | 20 s가 흔한 값 |
| Radiation tolerance | 수렴 문제 시에만 변경 | – |

### V.8 증기운 폭발(VCE)

폭발 유형: Early(누출점 즉시 점화, 순간·단시간), Late(Phast 전용, 사용자 위치 또는 최악 위치), Delayed(Safeti 전용, LFL 이하로 떨어질 때까지 언제든). 폭발 질량은 점화 시점·위치에서 LFL–UFL 사이 질량이다(\[기본\] Module 10).

| 모델 | 특징 | 비고 |
| --- | --- | --- |
| Multi-Energy Uniform Confined(기본) | 전체 cloud를 단일 구속원, 중심 = cloud 중심, 0.3/0.1 barg 동심원 | Safeti-NL 유일 모델 |
| Multi-Energy User Defined | 구속원 최대 7개, 강도 3–10, 비구속 1–2 | 가장 큰 원만 표시 |
| Baker-Strehlow-Tang | 화염속도(Mach) 직접 또는 표에서, 충격량 예측 | 지면반사로 에너지 2배 |
| TNT | 효율 10%, 최대 1 barg | 비권장 |
| BLEVE Blast | CCPS 2판(2010) 기본, standalone 전용 | 물리적 파열 |

Multi-Energy 스케일링과 GAME 상관식(\[TD\] OREM, \[기본\] 3D Explosions):

```latex
r'=\frac{r}{(E/P_a)^{1/3}},\qquad P'_s=\frac{\Delta P_s}{P_a},\qquad t_p'=\frac{t_p\,a_0}{(E/P_a)^{1/3}}
```

```latex
P_0^{3D}=0.84\left(\frac{VBR\cdot L_p}{D}\right)^{2.75}S_L^{2.7}D^{0.7},\qquad P_0^{2D}=3.38\left(\frac{VBR\cdot L_p}{D}\right)^{2.25}S_L^{2.7}D^{0.7}
```

- VBR = 장애물 체적/구역 체적, D = 4V\_obst/A\_obst(수력직경), L\_p = (3V\_gr/2π)^{1/3}(반구 등가 반경), S\_L = 층류연소속도. GAME의 P\_0로 ME 곡선(1–10)을 선택한다. 주의: TD 추출본은 S\_L 지수 부호가 깨져 있어 GAME 원식(지수 +2.7)을 따랐다.
- 폭발에너지 E = f\_e · ΔH\_c · (구속 영역 내 가연질량, 화학양론 농도로 상한). 탄화수소 기준 3.5 MJ/m³.
- 구역 결합(RIGOS): 모서리 간 거리/큰 구역 최장 치수 ≤ 0.5이면 하나의 폭발원(기본). 또는 거리 기준(Yellow Book 10 장애물 직경, 최대 25 m).
- 3D 폭발(옵션 라이선스): cloud와 Obstructed region의 **체적** 겹침으로 폭발을 판단한다. 폭발 중심은 겹친 체적의 중심, 최대 18 풍향, Overpressure capping, 층류연소속도 입력.

BST 화염속도(Mach, 2005판 표, \[기본\] 3D Explosions):

| 구속도 | 반응성 | Congestion Low | Medium | High |
| --- | --- | --- | --- | --- |
| 2D | High | 0.59 | 5.2 | 5.2 |
| 2D | Medium | 0.47 | 0.66 | 1.6 |
| 2D | Low | 0.079 | 0.47 | 0.66 |
| 2.5D | High | 0.47 | 5.2 | 5.2 |
| 2.5D | Medium | 0.29 | 0.55 | 1.0 |
| 2.5D | Low | 0.053 | 0.35 | 0.5 |
| 3D | High | 0.36 | 5.2 | 5.2 |
| 3D | Medium | 0.11 | 0.44 | 0.5 |
| 3D | Low | 0.026 | 0.23 | 0.34 |

5.2는 DDT(폭궉 전이)를 포함하는 보수값이다. 2.5D Medium·High 칸은 추출 텍스트가 비어 SA-05 표(1.0)을 넣었다. 원본 표 확인 후 사용한다.

### V.9 과압 해석과 건물 적용

- Side-on(정압) / Dynamic(운동에너지) / Reflected(벽면 반사, 약 2배 이상). 건물 설계는 reflected를 쓴다.

```latex
P_{ref,90}=2P_s+\frac{(\gamma+1)P_s^2}{(\gamma-1)P_s+2\gamma P_a},\qquad I=\tfrac12 P_s t_p
```

- 사람 피해: VCE는 cloud 내부를 파괴하고 100 mbarg 이상에서 상당한 피해·사망을 낸다(\[AR\] I.5.5). 과압 세기는 cloud 크기가 아니라 장애물 체적을 채운 정도가 정한다.
- Clancy 손상표(발췌): 0.03 psi(0.2 kPa) 큰 창 파손 시작, 0.3 psi(2.1 kPa) ‘안전거리’, 1 psi(6.9 kPa) 주택 부분붕괴, 2.3 psi(15.8 kPa) 심각한 구조손상 하한, 3–4 psi 저장탱크 파열, 10 psi(68.9 kPa) 건물 완전파괴 가능(\[AR\] Table 6.2.2).

### V.9a 폭발 계산: 결과용과 위험용은 다르다

결과(consequence) 보고서·그래프의 폭발 거리는 위험 계산에 쓰이지 않는다. 위험 계산의 폭발은 Ribbon Settings 탭의 **Explosion method**가 정하고, 그 결과는 Risk 결과에만 나온다(\[TUT-S\] 1.7.4.9). 프로젝트 검토 시 Consequence Explosion 보고서를 위험 입력으로 오해하지 않는다.

| 구분 | 결과 계산(Explosion parameters 탭) | 위험 계산(Settings > Explosion method) |
| --- | --- | --- |
| 방법 | ME uniform confined(기본), ME user defined, BST, TNT | 3D Cloud ME/Purple Book Explosions 또는 3D Obstructed Region(Extended explosions add-on) |
| 장애물 | ME user defined는 cloud 분율로 구속원 최대 7개 | Map 탭 Obstruction Set(ME 또는 BST)을 Run Row별로 지정(Run Row Grid의 Obstructions 열) |
| 폭발 중심 | 기본 cloud front(50% LFL), Explosion parameters에서 변경 | Obstructed Region은 겹친 체적의 중심 |
| 결과 | Worst case radii(최저 과압 0.02 bar 기준 최악 점화시각) | IR contour, Effects 등고선, Exceedance curve(RRP) |

기본값(\[TUT-P\] 1.15.3, \[TUT-SX\] 1.3):

- ME uniform confined: cloud의 전체 가연 체적, 강도 10, 효율 12.5%. 근거리 과압이 가장 높지만 원거리는 다른 방법보다 낮을 수 있다.
- ME user defined: 비구속 영역 강도 2, 효율 100%. 공정 유닛은 흔히 강도 8–9를 쓴다.
- TNT: 효율 10%, 기본 Air burst(지면 근처는 Ground burst 선택).
- BST: Mach 직접 입력 또는 계산. 예제는 지면효과 보정 1.6, confined volume 500 m³.

Obstruction 입력(\[TUT-PX\] 1.3):

- Defined strength: Curve number(1–10, 7.5 같은 중간값 허용), Blockage ratio, Upper elevation(필수), Lower elevation(기본 0).
- Calculated strength: 팽창 차원과 장애물 치수를 주면 곡선 번호를 계산한다.
- 한 번의 계산은 ME 또는 BST 중 하나만 쓴다. 비교하려면 Study(Phast) 또는 Run Row(Safeti)를 나눈다.
- 예제 LNG Train은 모든 구역 BR 0.2, 파이프랙·압축구역 상단 27.5 m다. \[AR\] I.5.6의 VBR 20%와 같은 값이다.

BST and ME (3D options) 탭 기본값(화면 캐처 기준): Separation specification = Use ratio, Critical separation ratio 0.5, Cloud view = Normal dispersion, Concentration method for filling = Stoichiometric, Pressure exceedance = Calculate(최소 압력 필터 0.01 bar), Building reflection = Calculated angle, Building damage = Worst point, Detonation = Normal explosion. DNV는 대부분 기본값 유지를 권한다.

Obstructed Region에서만 쓰는 시나리오 Risk 탭 옵션(\[TUT-SX\] 1.3.6):

- **Minimum probability of delayed ignition**: 시나리오 전 시간이력에서 이 확률을 내는 ‘등가 점화원’ 강도를 계산한다. 각 시간스텝에서 실제 점화원·인구와 등가 점화원 중 큰 값을 쓴다. 예제값 0.15.
- **Conditional explosion probability**: 지연 점화가 flash fire가 아닌 폭발이 될 상대확률. 예제값 0.9.
- 둘 다 기본 비선택이다. 이때 점화원·인구가 cloud에 닿지 않으면 그 시간스텝의 지연 점화는 계산되지 않는다.

취약성과 결과(\[TUT-SX\] 1.4):

- Outdoor vulnerability의 Obstructed explosion 탭: Discrete overpressure, 개인위험·grid 인구는 Side-on, 건물 계산은 Reflected. 예제는 0.3 bar 이상 치사율 1 한 단계다.
- 이 설정에서는 옥외 IR 등고선이 flash fire에 지배되고 폭발은 0.3 bar 영역에서만 기여한다.
- Effects 탭에 과압(Reflected/Side-on)·충격량·복사·flash fire(LFL fraction)·독성(최소 치사확률) 수준을 두면 Multi-Vulnerability contour에 함께 나온다. Flash fire와 독성은 각 1개만 가능하다.
- 0.1 bar에서는 Reflected와 Side-on의 영향 거리 차이가 크고 0.3 bar에서는 작다.
- Exceedance curve(과압·동압·충격량·복사)는 Obstructed Region + RRP가 있을 때만 나온다.

Phast Extended explosions 주의(\[TUT-PX\] 1.3–1.4): Effects 계산은 Study 또는 workspace 노드를 선택했을 때만 돌고, Obstruction Set은 Study 대화상자에서 고른다. Effects 등고선의 풍향 수는 Weather 폴더에서 정하며 기본 8, 최대 18이다. Classic Grid parameters의 격자 범위를 자동 계산하면 화재 거리에 맞춰지므로 0.04 bar 같은 낮은 과압 등고선이 잘린다. 이때는 격자 범위를 직접 지정한다.

### V.10 Warehouse fire

창고 물질의 평균 분자구조에서 연소생성물(SO₂, NO₂, HCl)과 산소 요구량을 구하고, 산소제한·표면제한 화재를 판정해 50 ℃ 방출원으로 확산시킨다. 표준 PGS15 시나리오를 자동 생성할 수 있고, 혼합 독성은 Product of each toxic material을 쓴다(\[SA-05\]).

### V.11 화재·폭발 세부 모델, 물성 근거, 검증

**동적 파이어볼(TVFM, Martinsen & Marx)** (\[NM\] 3.1): 지속시간 t\_flame 상관식은 TNO와 비슷하다. 이륙 시각 t\_Lo = t\_flame/3 전에는 지면에서 반경이 커지고 SEP는 일정하다(HSE와 유사). 이륙 후에는 반경을 r\_flame으로 고정한 채 일정 속도로 중심 높이 H = 3r까지 상승하고(TNO 정적 모델은 2r 고정), SEP는 0까지 선형 감소한다. HSE 프로판 1,708 kg, GL 부탄 2,000 kg 실험에서 정적 모델보다 낫다. 근거리 지면 복사는 커지고 원거리는 작아진다.

**복사 치사 기준** (\[RD\] 표 6): 35 kW/m² 초과 시 100% 치사로 보는 단순 기준 대신, 복사 선량이 (20 s)×(35 kW/m²)^4/3를 넘으면 100% 치사다. Safeti(상용)는 이를 **파이어볼에만 기본 적용**하고, 제트·풀 화재는 옵션이다(화재 지속 20 s 미만일 때만 치사가 줄어듦). Part V.2의 선량·probit 설정과 함께 확인한다.

**제트 화재** (\[NM\] 3.2, \[RD\] 표 6): 최대 SEP 350 kW/m². 원뿔가 지면에 닿으면 밑면 중심을 축으로 회전하고, 밑면까지 닿으면 회전 후 위로 옮긴다(권장 기본, 지면 복사↓, 검증 개선). 시간변화 누출의 제트 화재 입력은 원 방출 결과를 'jet fire averaging time'(기본 20 s)으로 평균한다. 제트 화재 위험은 균일 분포 또는 풍배도 분포로 배분할 수 있다. 2상 제트 화재 검증(Bennett LPG, Sekulin & Acton 부탄, Selby & Burgan 원유)에서는 JFSH-Cook 화염길이가 Lowesmith보다 정확했고, 2상은 minimum thermodynamic change가 운동량 보존보다 정확했다.

**풀 화재** (\[RD\], \[PDB\] 4.3): smoky 물질은 two-zone 모델이 기본이다(근거리 복사↑, 원거리 동일). DB 근거는 다음과 같다.

```latex
\dot m_{max}=1.27\times10^{-6}\,\rho_L\frac{\Delta H_c}{\Delta H_v^*}\ (\text{general}),\qquad \dot m_{max}=10^{-3}\frac{\Delta H_c}{\Delta H_v^*}\ (\text{HC}),\qquad \Delta H_v^*=\Delta H_v+C_{pL}\max(0,T_b-T_a)
```

- 수면 풀에서 NBP < 주위 온도이면 연소율×2.5. 최대 연소율을 DB에 직접 넣은 것은 메탄·에탄·프로판·부탄뿐이고, 나머지는 식으로 계산한다. 수소는 식으로 0.024 kg/m²s가 나오지만 문헌값이 0.017–0.169로 흩어져 있다.
- 화염 유형: luminous는 메탄–부탄만(메탄 Lₛ 6.75 m, Eₘ 220 kW/m², 프로판 160). 탄소 5개 이상 탄화수소는 smoky(Eₘ 140, Eₛ 20 kW/m², Lₛ 8.33 m, Mudan). 나머지는 general(복사분율 0.40). 에틸렌은 단일 물질일 때 general에 해당하므로, 프로젝트 스트림의 화염 유형을 재료 탭에서 확인한다.
- 혼합물 화염 유형은 II.8 규칙(무거운 쪽)을 따른다.

**폭발** (\[RD\], \[PDB\] 4.4, \[VV\] 4.2):

- 폭발 위치 기준: Phast는 'Cloud Front (LFL)'을 더 지원하지 않고 'Cloud Front (LFL fraction)'을 쓴다. \[RD\]는 Safeti 위험 계산이 항상 구름 중심을 쓴다고 적었다. 반면 Tutorial의 '구름 앞끝 50% LFL' 기본값은 결과(consequence) 폭발에 대한 것이다(V.9a). 위험 계산은 \[MPACT\] 5.12–5.14로 정리됐다: Purple Book 방식은 점화 시점 구름의 앞·뒤 가장자리 사이에서 가연 질량 가중 평균 중심을 쓰고, Obstructed Region 방식은 구름이 걸친 장애물 영역을 폭발원으로 쓴다(V.13).
- 가연 시간 스텝은 CVIEW가 지면을 더 촘촘하게 덮도록 계산한다(과압이 늘거나 줄 수 있음). 하풍 21개 거리 스텝의 cloud view를 쓴다.
- 층류 연소속도(BST·ME 입력): 고반응성(수소, 아세틸렌, **에틸렌**, 에틸렌옥사이드, 프로필렌옥사이드), 저반응성(메탄, CO), 나머지는 중반응성(자료가 없으면 0.52 m/s, 프로판·사이클로헥산 기준). 에틸렌옥사이드·프로필렌옥사이드는 에틸렌 값 0.83 m/s를 쓴다. NFPA 68(2023)의 낮아진 값(메탄 0.37)은 GAME이 0.45 m/s로 만든 상관식과 어긋나므로 반영하지 않았다. 낮은 값을 쓰면 과압이 작아진다.
- 검증: ME와 BST(Baker-Strehlow-Tang)를 EMERGE(TNO 메탄·프로판)·BFETS(SCI 메탄)와 비교했다. Fitzgerald(2001)는 CAM과 ME가 BST보다 과압 예측이 정확하고, BST는 적용이 가장 쉽다고 결론 내렸다.

**화재 모델 검증 범위** (\[VV\] 4.1): 파이어볼(HSE 프로판, GL 부탄), 풀 화재(Johnson LNG, Montoir 35 m LNG, 헥산), 제트 화재(Chamberlain 수직 NG, Bennett 수평 NG·LPG, Sekulin 부탄, Selby 원유). 대부분 ±40% 범위에 들어온다. 화재 모델은 반경험 모델이라 검증 실험에 일부 맞춰져 있을 수 있다. 에탄·에틸렌 제트 화재나 파이어볼을 직접 검증한 실험은 목록에 없다.

### V.12 화재 모델 기술 문서 요약

근거: \[FB\] Fireball Model Theory·Review·Validation, \[JFSH\] JFSH Theory, \[JFSH-V\] JFSH Validation, \[POLF\] POLF Theory, \[WHF\] WHFIRE Theory, \[EXPS\] EXPS Radiation Model Theory.

| 모델 | 형상·방법 | 선택 기준·검증 |
| --- | --- | --- |
| Fireball | 균일 SEP 구. 정적(HSE, TNO)과 동적(Martinsen & Marx) | 최대 반경·지속시간·이륙 높이·복사분율·최대 SEP를 상관식으로. 동적 모델이 Johnson(Shell)·Roberts(HSE) 실험에서 더 잘 맞는다. 지속시간은 BG Pritchard 모델이 비교적 잘 맞았다(V.11 참조) |
| Jet fire – Cone | 원뿔대(frustum), 균일 SEP. Chamberlain(순수 기체), Cook(액체·2상 보정), Johnson(수평 기체) | 권고: 비기체는 Cook, 수평 기체는 Johnson, 그 외는 Chamberlain. 수평 액체·2상에서 Cook 화염길이는 측정치의 −30% 범위, 수평 기체에서 Johnson은 10% 이내 |
| Jet fire – Miller(M-MPS) | 화염 중심선을 따라 점광원을 분포(다점 광원) | 저휘도 기체(수소·syngas·H₂/CH₄ 혼합)에 권고 |
| Pool fire(POLF) | 기울어진 원통. 화염 높이 Thomas 상관식, 과잉 공기 유입 Delichatsios, smoky 물질은 two-zone | 개방형 화재(사용자 연소율·직경)도 가능. Froude 화염 높이에서 연기가 UDM으로 넘어간다. LNG(Johnson, Montoir)·헥산·등유 실험으로 검증 |
| Warehouse fire(WHFIRE) | TNO(Molag & Blom-Bruggeman) 방법. 저장 물질의 평균 화학식으로 NO₂·SO₂·HCl·HBr·HF 배출계수 산정 | 연소율은 환기·산소 요구량·소화설비로 결정. 미연소 독성물·다이옥신 등가량도 산정 |
| EXPS | 화염 형상별 시야계수와 화염 내부 포함(engulfment) 판정 | 관찰자 방향을 바꿔 시야계수를 최대화할 수 있다. 화염에 포함된 관찰자는 치사 100% |

**제트 화재와 ATEX 가정**(\[JFSH-V\]): 액체·2상 실험 10건에서 minimum thermodynamic change는 화염길이를 평균 34.6% 과대, SEP를 2% 과소 예측했다. 운동량 보존은 각각 45.8% 과대, 12.8% 과소였다. 복사량은 각각 91%, 113% 과대 예측했다. 두 가정 모두 보수적이며, 운동량 보존이 더 보수적이다. 복사 거리가 과도하게 크게 나오면 ATEX 옵션과 화염 모델 선택을 먼저 확인한다.

실무 판단(HET): 에탄 액체·2상 누출은 Cook, 에탄 기체 수평 누출은 Johnson, 수직 기체(벤트·플레어)는 Chamberlain이 문서의 권고에 맞는다. 프로젝트 파일의 Jet fire 모델 설정을 IX.2 체크리스트에서 확인한다.

### V.13 폭발 모델 기술 문서 요약

근거: \[OREM\] Obstructed Region Explosion Model Theory, \[OREM-V\] Validation, \[BLEVE\] BLEVE Blast Model Theory, \[SOLID\] Solid Explosion Model Theory, \[DUST\] Dust Explosion Model Theory, \[MPACT\] 5.12–5.14.

**OREM(장애물 영역 폭발)**: TNO Multi-Energy와 Baker-Strehlow-Tang 결과곡선으로 최대 과압·양의 위상 지속시간·충격량을 구한다. 폭발원은 확산 결과(3D 구름)와 장애물 영역 형상의 교차로 정한다. 인접 영역의 합체 여부는 이격거리 또는 임계 이격비(RIGOS)로 판단한다. Yellow Book 절차는 장애물 사이 간격이 D₁의 일정 배수, 1.5×D₂, 25 m를 넘으면 영역을 나눈다(바깥 경계 기준). 점화 위치를 장애물 영역 중심으로 두는 것이 보수적인 일반 가정이다.

- **'1/3 Rule'**: 구획의 약 30%만 채워도 완전히 채운 경우와 과압이 비슷하다는 실험에 근거해, 장애물 영역을 다 채운 구름은 그 안 가연 질량의 1/3만 폭발에 기여하게 하는 옵션이다(ME·BST 모두). GAMES 가스 처리 사례와 COSTFX II에서 검증했다.
- **검증**(\[OREM-V\]): BFETS 3a, EMERGE, GAMES, COSTFX II(수소), 2상 수소 실험과 비교했다. 폭연(deflagration)은 기본 설정(ME 곡선 7 또는 BST Mach 0.8866+1/3 Rule)으로 합리적이었다. DDT·폭궉은 기본 설정으로 과소 예측했다. 폭궉을 다루려면 장애물 영역을 양론 농도로 먼저 채우고 GAMES 상관식으로 강도를 구하거나, BST에서 그에 맞는 화염속도를 쓴다. 현재 DDT 판정은 ME의 VBR이나 BST 화염속도에만 의존해 실제 현상을 단순화한다.

**위험 계산의 폭발 방식**(\[MPACT\]):

| 방식 | 폭발 중심·강도 | 이벤트 트리 처리 |
| --- | --- | --- |
| Purple Book(Wiekema) | 구름 앞·뒤 가장자리 사이, 세그먼트별 가연 질량 가중 평균 중심. 반경 R = Cₛ(αE)^1/3, Cₛ 0.03(대파)·0.06(수리 가능 손상). 폭발 가연 질량은 LFL 기준(UFL 초과 제외 여부는 파라미터) | 지연 점화를 플래시와 폭발로 고정 비율 분할. 혼잡도는 반영하지 않음 |
| 3D Purple Book | ME 비장애 강도 10, 가연 질량의 12.5%를 장애물 영역으로 간주. 0.3 bar 실내·실외 치사 1, 0.1 bar 실내 치사 0.025 | Wiekema와 비슷한 결과를 내도록 설정한 방식. 실제 구름 형상 사용 |
| 3D Obstructed Region(ME/BST) | 구름이 걸친 장애물 영역이 폭발원. 점화원 높이도 구름과 비교 | 플래시와 폭발(필요하면 풀·제트 화재)을 하나의 결합 결과로 다루고, 그 확률은 플래시+폭발 분기의 합. 구름 안 관찰자는 플래시 치사(보통 1), 밖은 폭풍만, 여러 위험이 겹치면 생존확률을 곱한다 |

LFL fraction을 1보다 낮추면 플래시 구름은 커지지만 폭발 질량은 항상 LFL 기준이라, 질량 가중 폭발 중심이 기하 중심보다 누출원 쪽으로 옮겨간다.

**기타 폭발 모델**:

- **BLEVE blast**: CCPS 통합 방법. 파열 상태와 팽창 후 상태의 내부에너지 차로 폭발 에너지를 구하고, 지면 근접 여부(자유 공기/지면 폭발)로 보정해 최대 과압과 양의 위상 충격량을 구한다. 기체·증기·과열액·기액 혼합 용기에 적용하며, 가연성·비가연성 모두 다룬다. 실제 기체 Brode 옵션은 위험 계산에 쓰지 않는다.
- **Solid explosion**: 고체 화약. Kingery & Bulmash(Lees)와 중국 GB/T 37234 상관식.
- **Dust explosion**: 중국 GB 15605(분진 폭발 배기) 기반 배기 설계·영향 산정.

실무 판단(HET): \[AR\]은 폭발 위치를 centroid로 바꾼다고 적었다. 이는 Purple Book 방식의 질량 가중 중심과 같은 방향이지만, 위험 계산이 Obstructed Region 방식이면 폭발원은 장애물 영역이다. 프로젝트가 어느 Explosion method를 썼는지, 1/3 Rule을 적용했는지, 에탄·에틸렌(고반응성) 혼재 시 DDT 가능성을 어떻게 다뤘는지 \[AR\]에 명시해야 한다.

## Part VI. 빈도 분석: 누출빈도·점화·이벤트 트리·격리

빈도 분석은 (1) 섹션별 parts count × 일반 고장률로 누출빈도를 만들고, (2) 홀 크기 대역으로 나누고, (3) 점화확률·이벤트 트리로 결과 빈도를 배분하는 순서다. 교재 연습은 DNV Leak 빈도를, HET는 IOGP 434-01(2019, HCRD 기반)을 쓴다(\[AR\] I.4.1).

### VI.1 홀 크기 대역

| 빈도 산정 대역 (mm) | 결과 분석 대표 직경 (mm) |
| --- | --- |
| 1–5 | 5 |
| 5–20 | 20 |
| 20–65 | 65 |
| 65–150 | 150 |
| 150–Full bore | 배관 직경 또는 최대 플랜지 연결부 |

근거: TotalEnergies GS HSE-312(\[AR\] Table 3.2.1). 압력용기 catastrophic failure는 별도 failure case다. 대표 직경을 대역 상한으로 두는 방식은 결과 측면에서 보수적이다.

### VI.2 일반 고장률(발췌)

| 기기 | 누출빈도 (/yr) | Small 1–10 mm | Medium 10–50 | Large 50–150 | Very large > 150 |
| --- | --- | --- | --- | --- | --- |
| Centrifugal compressor | 5.80E-03 | 84.1% | 11.5% | 2.6% | 1.8% |
| Centrifugal pump | 3.50E-03 | 95.5% | 4.0% | 0.4% | 0.1% |
| Process/pressure vessel | 4.09E-03 | 69.0% | 17.3% | 5.9% | 7.8% |
| Filter | 1.86E-03 | 89.7% | 8.2% | 1.4% | 0.7% |
| S&T HX – shell | 1.64E-03 | 81.0% | 13.0% | 3.2% | 2.7% |
| Small bore fitting | 1.99E-04 | 86.5% | 13.5% | – | – |
| Flange 8″ | 1.52E-05 | 81.6% | 10.8% | 2.4% | 5.2% |
| Manual valve 8″ | 3.77E-05 | 81.6% | 12.7% | 3.1% | 2.6% |
| Actuated valve 8″ | 1.25E-04 | 81.5% | 12.7% | 3.1% | 2.7% |
| Pipework 8″ (/100 m) | 1.44E-03 | 85.3% | 10.8% | 2.3% | 1.6% |

주기기 고장률은 연결부 크기에 둔감하고, 밸브·플랜지·배관은 구경에 따라 달라진다. 실제 계산은 각 항목의 실제 구경을 쓴다(\[AR\] Table 4.1.1). 주의: 빈도 표의 대역(1–10/10–50/50–150/>150)과 VI.1의 홀 대역(1–5/5–20/20–65/65–150/>150)이 다르다. LEAK에서 연속 분포로 재분배했는지 확인이 필요하다(Part IX).

저장탱크·로딩암(\[AR\] Table 4.1.2, 4.1.3, UK HSE FRED 2017):

| 항목 | Single | Double(금속 외조) | Double(콘크리트 외조) | Full containment | Membrane |
| --- | --- | --- | --- | --- | --- |
| Catastrophic (/tank·yr) | 5.0E-06 | 5.0E-07 | 1.3E-08 | 1.0E-08 | 1.0E-08 |
| Major 250 mm | 1.0E-04 | 1.0E-05 | N/A | N/A | N/A |
| Minor 10 mm | 3.0E-04 | 1.0E-04 | N/A | N/A | N/A |
| Steel roof spill | 3.0E-04 | 1.0E-04 | 1.0E-04 | 4.0E-05 | 4.0E-05 |

- Full containment·Membrane 탱크는 내조 누출을 외조가 담으므로 홀 시나리오가 필요 없다. DNV는 이중 방호 탱크의 내·외조 동시 파열을 비현실적으로 본다.
- 로딩암(전송당): 1기 사용 시 guillotine 3.8E-05, 단면적 10% 홀 3.3E-05. 2기 사용 시 5.0E-05, 6.6E-05, 동시 파단 2.6E-06. HET는 Ethane MLA(HET-JF901)와 Vapour return arm(HET-JF902)을 연 12회, 최대 24시간 운전한다.

### VI.3 Parts count 규칙(\[AR\] I.4.2)

1. P&ID 기준으로 섹션별 용기·펌프·압축기·플랜지·소구경 피팅·밸브를 센다.
2. 주기기는 압력경계로 정의한다. 용기의 PSV·노즐 플랜지는 용기 고장률에 포함된다.
3. 밸브 1개당 플랜지 2개를 추가한다.
4. 계기(센서+밸브+플랜지)는 통째로 small bore fitting 1개, 2″ 미만 연결도 small bore fitting이다.
5. 배관 길이는 주기기 간 거리로 추정한다. 유닛 간 배관은 pipeline이 아닌 pipework로 보수적으로 본다.

### VI.4 점화확률

전체 점화확률은 누출률 의존 상관식(IOGP 434-06 / Energy Institute 2019)을 쓴다(\[AR\] I.4.3).

| 상관식 | 적용 | 최대 P\_ign |
| --- | --- | --- |
| No. 8 Large plant gas/LPG | 모든 기체, 플래시가 큰 액체 | 0.65 |
| No. 9 Large plant liquid | 플래시 ≤ 10% 액체 | 0.13 |

- 즉시:지연 = 40:60(EI 자료: 50:50\~30:70 범위, 육상 사고의 30%가 30 s, 70%가 2분 이내 점화).
- 누출물 온도 > 자연발화온도(AIT)이면 즉시 점화 67%.
- 산업·도시 환경의 지연 점화는 60 s 이후로 정의한다. 추가 점화원의 in-time period는 60 s로 입력한다(\[AR\] I.2.3).

Safeti 지연 점화 모델(점화원별)(\[기본\] Module 16):

```latex
P_{x,y,t}=f_{x,y}\left(1-e^{-\omega_{x,y}\,t}\right),\qquad \omega=-\frac{\ln(1-P_{ign})}{t_{period}}
```

f는 존재(운전) 확률, ω는 점화 강도(/s), t는 cloud 노출 시간이다. 두 번째 식은 ‘t\_period 동안 P\_ign’ 입력을 ω로 바꾸는 관계다. 인구도 약한 점화원으로 작용한다. MPACT Theory 원문의 상세 식(cloud 스텝별 점화원 평가)은 이번에 열람하지 못했다(부록 자료요청).

연속 독립 사건으로 보면 P\_total = P\_imm + (1 − P\_imm)·P\_del이다. HET는 전체 P\_ign을 먼저 정하고 40:60으로 나눈다. 두 정의가 섞이지 않게 SAFETI 입력(즉시점화 직접입력 + 점화원 ω 조정)을 검증한다. ET Ignition Report의 ‘Immediate/Delayed ignition probability’로 실제 배분을 확인할 수 있다(\[TD\] Risk Reports §5).

### VI.5 이벤트 트리

Gas 누출(\[AR\] Figure 5.1.1):

- 즉시 점화 + 단시간(< 20 s) → Fireball
- 즉시 점화 + 장시간 → Jet fire
- 지연 점화 → Flash fire(개방) 또는 Explosion(혼잡구역)
- 미점화 → 증기운, 독성이면 독성 영향

> **[그림] HET 가스 누출 이벤트 트리** — Gas 누출(f) → 즉시 점화(0.4·P_ign)? 예 → 단시간(<20 s)? 예: Fireball / 아니오: Jet fire. 즉시 점화 아니오 → 지연 점화(0.6·P_ign)? 예 → 혼잡구역 겹침: Explosion(VCE) / 개방: Flash fire. 지연 점화 아니오 → 미점화 cloud/독성.

P\_ign은 IOGP 상관식 No. 8의 누출률 의존 전체 점화확률이다. 지연 점화 분기는 Safeti에서 점화원과 cloud의 겹침으로 다시 계산되므로 실제 배분은 ET Ignition Report에서 확인한다.

Liquid 누출(\[AR\] Figure 5.1.2): 즉시 점화는 Fireball+pool fire(단시간) 또는 Jet fire+pool fire(rainout 시). 미점화 시 기상(플래시·풀 증발)은 지연 점화로 Flash fire/Explosion, 액체 풀은 Pool fire 또는 미점화 풀이다.

Safeti 특징:

- 단시간 누출의 fireball 비율을 정할 수 있다. HET는 100%다(\[AR\] I.5.1).
- Flash fire vs explosion은 cloud와 congestion의 겹침으로 정한다(\[AR\] I.5.5).
- Residual pool fire ignition(증기운이 LFL 아래로 희석된 뒤 남은 풀의 점화)은 기본 0.15, HET는 0이다.
- Long-duration 결과는 horizontal/vertical jet fire로 나뉘고, short-duration은 fireball·early explosion·early flash fire로 나뉘다(\[기본\] Module 19).

### VI.6 탐지·격리·누출량 규칙

탐지+격리 시간 T\_iso(\[AR\] I.3.7):

- 누출률 > 20% NFR: 180 s(가스감지기·공정 알람으로 신속 탐지)
- 그 외: 600 s
- 로딩암 full bore: 자동 감지·격리에서도 90 s 미만은 비현실적(감지 60 s + DCS 인터록 30 s). 더 짧으면 정량적 근거가 필요하고, 무인·원격 조작은 더 길게 본다.
- 기본 케이스는 격리 성공 100%. 최대 누출 지속 3600 s.

대표 누출률·지속시간(\[AR\] I.3.5):

| 유형 | 조건 | Q | T | 의미 |
| --- | --- | --- | --- | --- |
| Inventory driven | Q₀ > NFR, T₀ < 20 s | 순간 누출(섹션 재고 Mₛ) | Mₛ/Q | 초기 피크가 가연성 결과를 지배 |
| Inventory driven | Q₀ > NFR, T₀ > 20 s | 초기 2분 평균 | T\_iso + M\_iso/Q | 초기 피크는 빠르게 감쇠, 잔류 NFR은 무시 |
| Inventory driven | Q₀ < NFR | Q₀ | T\_iso + M\_iso/Q | 격리까지 초기율 지속 |
| Pumped(액체) | Q₀ > 2NFR | f × NFR (f = 1.25) | T\_iso + M\_iso/Q | 펌프 over-run 후 전방 유동이 지배 |
| Pumped(액체) | Q₀ < 2NFR | Q₀ (최대 f × NFR) | T\_iso + M\_iso/Q | 격리까지 초기율 |

- T₀ = M\_tot/Q₀, M\_tot = 격리 재고 + 격리밸브 상류 연결 재고.
- 독성 물질: Q = min(NFR, Q₀), T = (M\_iso + NFR·T\_iso)/Q.
- 누출 질량 M = Q × T. Q ≠ Q₀이면 속도 = Q/(ρ·A)로 다시 계산한다(\[AR\] I.3.8).
- 2상 누출은 최대 질량유량을 얻기 위해 액체 누출로 정의한다. 섹션 내 조건이 다르면 최고압 흐름을 대표로 한다(\[AR\] I.3.3).

재고 산정(\[AR\] I.3.6): 용기 체적 × 1.1(torispherical head) × 충전율 × 밀도. P&ID에 없으면 Thermosyphon reboiler 70%, Surge·Reflux drum·Separator 50%, Kettle reboiler·Column 25%, KO pot·Drier 10%.

## Part VII. 위험도 계산과 결과 해석

Safeti는 각 누출·기상의 모든 outcome을 hazard zone(치사율 분포)으로 만들고, 풍향별로 회전시켜 Risk Array 격자에 누적한다. 인구를 격자에 배분하면 사회적 위험도가 나온다(\[기본\] Module 19).

### VII.1 기상 입력(HET, 대산)

대기 파라미터(\[AR\] Table 2.1.1, Hanwha TotalEnergies 측정 2015.9–2016.9):

| 항목 | 값 | 영향 |
| --- | --- | --- |
| 기온 / 지표온도 | 15 ℃ / 15 ℃ | 증발율·중가스 확산에 일부 영향 |
| 상대습도 | 70 % | 중가스 cloud에 일부 영향 |
| 지표 조도 | 0.1 m (Purple Book ‘낮은 작물’) | 중가스 최대거리에 큰 영향 |
| 일사량 | 946 W/m² | 제한적 |
| 대기압 | 1.0145 bar | 제한적 |

기상 카테고리별 확률 합계(Table 2.2.3을 합산한 값):

| 카테고리 | 주간 (%) | 야간 (%) |
| --- | --- | --- |
| F1.5 | 33.4 | 39.9 |
| C2.5 | 33.4 | 39.9 |
| D4 | 25.8 | 16.0 |
| D6 | 7.2 | 3.9 |

- 정온(calm)은 1.5 m/s로 배정했다. 풍속 3 m/s 미만 빈도를 F1.5와 C2.5에 같은 비율로 나눈 것으로 보인다.
- 풍향은 18개(20° 간격)다. TOTAL은 congestion과 cloud의 상호작용 누락을 막기 위해 20–30개를 권고했지만 SAFETI 최대가 18개다(\[AR\] I.2.2).
- 주풍향은 NNNW(주 17.3%, 야 15.1%)와 SSW(주 13.3%, 야 10.8%)다. 이 방향의 풍하측 건물·인구가 위험도를 지배할 가능성이 크다.
- 평가 가능한 문제: 야간 C, 주간 F는 Pasquill 표와 맞지 않는다(Part IV.3). Part IX에서 다룬다.

### VII.2 결과 → 위험도 변환

1. **Event → Effect**: 이벤트 트리가 가능한 결과(jet fire, fireball, flash fire, explosion, toxic)와 확률을 정한다.
2. **Effect → Hazard zone**: 복사는 치사율 타원 여러 개(내부 = 화염·임계선량 기준 1.0, 중간 = probit, 외부 = minimum probability of death 예 0.01). 각 타원 구간에 평균 치사율(예: 1.0, 0.75, 0.255)을 부여한다.
3. **폭발**: Multi-Energy(Purple Book 방식) 과압을 Vulnerability의 과압별 치사율로 바꾼다.
4. **독성**: 이벤트 트리 없이 cloud의 P\_death 함수를 쓴다. 횡단면 적분 P\_I = ∫2P\_death dy로 폭방향 분포를 표현한다(\[TD\] TXCS).
5. **Hazard zone → Outcome**: 모든 zone을 각 풍향으로 회전해 outcome을 만든다.
6. **Vulnerability**: outcome의 치사율에 영향 유형별 실내/외 취약성을 곱한다. 기본값은 Purple Book 수치다.

Risk Array 셀 값(기본 400 × 400 격자, 셀 크기는 최대 outcome 크기로 결정):

```latex
IR_{cell}=\sum f_{event}\times P_{weather,\theta}\times P_{ET}\times P_{ign,d}\times L_{effect}\times V
```

Settings > Diagnostics를 켜면 RiskArray.csv로 출력할 수 있다. 검증용으로 유용하다.

### VII.3 취약성(Vulnerability)

HET 건물 취약성(\[AR\] Table 6.1.4):

| 영향 | 수준 | Outdoor | Temp | Admin/Typical | Plant | Protected |
| --- | --- | --- | --- | --- | --- | --- |
| Flash fire | LFL | 100% | 100% | 20% | 20% | 10% |
| 복사 | 4 kW/m² | 10% | 10% | 5% | 5% | 1% |
| 복사 | 12.5 kW/m² | 70% | 70% | 35% | 35% | 7% |
| 복사 | 37.5 kW/m² | 100% | 100% | 50% | 50% | 10% |
| 과압 | 50 mbar | 0% | 1% | 1% | 0% | 0% |
| 과압 | 100 mbar | 5% | 7% | 5% | 1% | 0% |
| 과압 | 300 mbar | 15% | 80% | 50% | 60% | 1% |
| 과압 | 500 mbar | 50% | 100% | 70% | 90% | 55% |
| 과압 | 1000 mbar | 60% | 100% | 100% | 100% | 100% |
| 독성 | 누적 dose | probit | 100% × 실내 probit | 20% × | 20% × | 10% × |

- 복사는 모든 노출시간에 적용한다. VULN 모델의 복사표는 보간 없는 계단함수이므로 4 ≤ I < 12.5 kW/m² 구간 전체가 10%다(\[TD\] VULN). 표의 주석도 이 보수성을 인정한다.
- 과압은 side-on 기준이고 기준점 사이는 log-linear 보간이다. 실내값은 CIA 지침에 기반한 DNV 관행이다.
- 독성 Protected 10%는 가스 유입 최소화 환기 설계를 전제로 한다. 독성 dose는 격리까지 + 재고 소진 + 임계농도 이하까지 전 기간을 누적한다.

참고 — Safeti 기본(Purple Book) 폭발: > 0.3 barg 실내·외 1.0, 0.1–0.3 barg 실내 0.025·옥외 0, ≤ 0.1 barg 0. CIA 실내 취약성(사무동 4층): 10 kPa 0.01, 30 kPa 0.62, 60 kPa 0.92, 100 kPa 1.0(\[TD\] VULN).

건물 등급(\[AR\] Table 2.4.1): B1 가설·목조(Temp), B2 철골+금속 외장, B3 비보강 조적, B4 철골/RC조+조적 채움(Admin/Typical, 기본), B5 방폭 RC(Protected, CCR 기본), B6 중간 보강 조적(Plant, 현장 건물 기본). 이 분류는 LSIR용이며 건물 설계하중(DAL)과는 별개다.

### VII.4 인구와 IRPA(HET)

HET 인구(\[AR\] Table 2.5.3–2.5.4):

| 그룹 | 위치 | 주간 | 야간 | 비고 |
| --- | --- | --- | --- | --- |
| Daily(08–17시) 실내 | Control Building(B5, 최대 18명) | 8 | 0 |  |
| Daily 실외 | Process Area | 8 | 0 |  |
| Shift(07–19시/19–07시) 실내 | Control Building | 1.3 | 1.3 |  |
| Shift 실외 | Process Area | 0.7 | 0.7 | 1인당 현장 4시간 반영 |

- 인구는 도형 내 균일 분포로 가정하고, 약한 점화원으로도 작용한다.
- IRPA 예: 교대자가 연간 근무시간의 비율 φ\_CB만큼 Control Building, φ\_PA만큼 Process Area에 있다면 IRPA = φ\_CB·LSIR\_CB,indoor + φ\_PA·LSIR\_PA,outdoor. φ는 Table 2.5.5(근무 길이·인원)에서 만든다.
- 기존 단지 건물 50여 동과 외부 주거 3개 지점은 상세 평가 범위 밖이지만 위험도 분포로 노출 정도를 가늠한다(\[AR\] I.2.5). 주의: 제공 PDF의 Table 2.5.1–2.5.2는 인원 숫자가 비어 있다.

### VII.5 결과 유형과 읽는 법

| 질문 | 결과 | 핵심 지표 |
| --- | --- | --- |
| 전체 위험 수준은? | IR contour(Multi-level), Smoothed FN | 10⁻³–10⁻⁸ 등고선(최대 10개), FN 기준선 |
| 특정 지점의 기여 요인은? | IR Ranking Grid / Details(RRP) | Total risk, % risk, Risk per outcome(= 발생 시 얼마나 나쁜가) |
| 사망자 수에 가장 크게 기여하는 사고는? | SR Ranking Grid | Risk integral, Average outcome |
| 어느 집단이 더 노출되나? | Category PLL(6단계 drill-down) | PLL = N̄ × F |
| 작업자 위험? | Category FAR | FAR = 10⁸·PLL/(h\_p·N\_e) |
| 설비 손상 빈도? | Exceedance curve(3D add-in) | 과압·복사 초과 빈도 |

- Raw FN은 비정수 N̄를 양쪽 정수로 나눠 빈도를 배분한다(N̄ = 1.4, F = 10⁻³이면 N ≥ 1에 0.6×10⁻³, N ≥ 2에 0.4×10⁻³). Smoothed FN은 outcome별 N 확률분포를 쓰며 필터링이 불가하다(\[TD\] Risk Reports).
- IR contour는 격자 선형보간이며 평활화하지 않는다. 외곽에 계단이 생길 수 있다.
- Results Wizard 선택은 Results 탭에 저장하고 복제·편집해 재사용한다.
- 저감 우선순위: RRP에서 % risk가 큰 시나리오·outcome부터 검토한다. Risk per outcome이 크고 빈도가 낮으면 결과 완화(방폭·이격), 빈도가 크면 빈도 저감(부품수·격리시간)이 효과적이다.

### VII.6 위험 계산 엔진(IRISK)

기존 MPACT 방식(\[NM\] 4장)은 개인·사회 위험이 핵심 계산을 공유해 효율적이었다. 대신 가연 결과를 특정 풍향 결과로 다루다 보니 '불가사리(starfish)' 등고선이 생기고, 이를 막으려면 풍배도를 세분(예: 5배)해야 했다. 어떤 모델을 함께 고르느냐에 따라 격자 해상도가 달라져 같은 사건의 결과가 변하는 약점도 있었다. 독성은 각도 범위에 맞을 확률로 풍향을 매끄럽게 적분했다.

| 항목 | 변경 | 영향 |
| --- | --- | --- |
| IRISK | 개인 위험을 사회 위험과 분리. 모든 사건에 풍향 연속 적분. OpenMP/CUDA 병렬(GPU) | 풍배도 세분 불필요, 등고선이 매끄럽고 기존 결과와 매우 가까움. 점화·사회 위험은 기존 MPACT 방식(풍배도 세분 포함) |
| 위험 격자 | 40,000 → 160,000칸 | 매끄럽고 정확 |
| FN 해상도 | 증가. 독성 구름 노출 인원 과대 버그 수정 | FN 분산 감소 |
| 점화 존재 계수 <1 | 격자 의존성 제거 | 위험 증감 |
| 가연 footprint | free-field 구름이 너무 작게 잡히던 문제 수정 | 이 버그 때문에 LFL 구름이 부지 경계를 못 넘으면 위험이 크게 과소평가됐음 |
| 가연 구름 없는 누출 | 저휘발성 유출 등에서 지연 점화 풀 화재 위험이 빠지던 버그 수정 | 지연 점화 풀 화재 위험 포함 |
| 영향 높이 | 독성·가연 높이 → 단일 effect height | 상용판은 결과 변화 가능 |
| 보고 누적 | 보고 수준 위험 누적 모델 | 결과 변화 없음(속도) |
| 장배관 | route 방식 → 구간화·사건 간격 자동 설정(III.5) | 배관 중간 홀 최악 가정보다 덜 보수적 |

향후 계획(\[NM\]): 홀 크기·풍속·누출 위치·점화 시각·폭발 강도를 연속 함수로 다루기, 적응 격자.

### VII.7 위험 모델 기술 문서 요약

근거: \[MPACT\] MPACT Risk Model Theory, \[MPACT-VF\] Verification, \[RR\] Risk Reports Theory, \[ROUTE\] Route Model Theory, \[VULN\] Vulnerability Model Theory, \[IRISK\] IRISK Theory.

**MPACT**: 독성·가연 결과를 풍향, 점화원, 과압 발생 장애물, 사건 위치·빈도와 겹쳐 인구 위에서 사망 위험을 계산한다. 결과는 FN, 개인 위험 격자, 사건별 기여 순위, 총 사망률, 네덜란드·영국 규제용 사회 위험 지표다. 재무 결과도 통합할 수 있다. 주요 기능은 ME/BST·vessel burst 폭발(V.13), 3D 구름 시점, 점화원 높이와 점화원 정지(shut-down) 옵션, 건물 유형별 인구와 인구 구분 유지, 건물 취약성의 복사·노출시간 기준이다. 즉시·지연 점화 분기와 지연 점화 확률은 \[MPACT\] 5.20–5.22(VI.4·VI.5). 검증 문서는 수계산으로 단계별 결과를 확인한다.

- 플래시 화재: 순간 누출과 연속·유한·시간변화 누출을 나눠 구름 시점마다 LFL fraction 외곽선을 쓴다. 구름 중심선이 부지 경계를 넘는지를 모든 높이에서 점검하고, 넘지 않는 구름은 free-field 기준으로 다룬다.
- 결합 결과: 단일 영향, 두 영향 결합, 폭발·플래시·풀·제트 결합, 실내 위험 직접 계산, 건물 내 사회 위험. 비정수 N은 보간한다.

**취약성(VULN)**: 복사는 표 참조 방식이다. 강도 구간별 취약성과 하나의 필요 노출시간을 입력하며, **보간 없는 계단 함수**다(예: 4 ≤ I < 12.5 kW/m² → 0.1, 최저 구간 미만이나 필요 시간 미만은 0). \[AR\] Table 6.1.4의 계단 취약성은 이 방식으로 구현할 수 있다. 폭발은 Purple Book(0.1·0.3 barg 두 단계), CIA 건물 4유형 곡선(강화 구조물 등), 선형 보간 과압 방식 등이 있고, ME·BST·vessel burst 결과에 적용한다(VII.3).

**위험 보고(Risk Reports)**: 모델이 낸 세부 결과를 보고용으로 묶는 계산을 정의한다.

- PLL = Σ F·N(사건·기상·방향·결과별). Risk Integral = Σ F·N^a(회피 지수 a, a=1이면 PLL과 같음). 평균 사망자 수는 PLL에서 구한다. 범주별·Run Row별·Combination별 PLL과 FAR가 있고, Combination 보고는 결합 계수를 적용하기 전 Run Row도 보여준다.
- 개인 위험 등고선은 격자 값을 선형 보간할 뿐 평활화하지 않는다. FN은 raw와 smoothed가 따로 있다(VII.5).

**Route 모델**: 경로(배관·수송로) 형상을 받아 등가 누출점을 배치하고 빈도를 배분한다. 사건 간격은 사용자 지정 또는 최대·50% 최대 치사 구역 반경에 따른 자동 설정이다. 간격을 너무 넓게 잡으면 등고선이 구슬 모양으로 끊긴다. 구간이 겹치지 않게 정의한다.

**IRISK**: 각 위험 사건(누출 위치 등)을 이산 점이 아닌 연속 확률 함수로 다루어 거친 등고선을 없앤다(VII.6).

실무 판단(HET): \[AR\]의 로딩암·이송 배관처럼 길이를 가진 설비는 Route 모델의 사건 간격이 등고선 모양을 좌우한다. 복사 취약성은 probit(기본)과 VULN 계단표 중 무엇을 썼는지 Part IX.1 #이슈와 함께 확인한다.

## Part VIII. HET Assumption Register(HET-SHQRA-001 Rev.0) 해설

HET(한화 에탄 탱크 터미널, 대산) QRA는 Lotte E&C FEED 범위에서 DNV가 SAFETI로 수행한다. Register는 26개 가정을 5개 군(배경 데이터, failure case, 빈도, 결과, 영향·기준)으로 묶는다. 가정이 바뀌면 결과가 무효가 되므로 각 항목은 입력 파일과 1:1로 대조해야 한다(\[AR\] I.1). 각 표의 ‘이론 근거’는 이 매뉴얼의 해당 Part를 가리킨다.

### VIII.1 배경 데이터(I.2)

| No. | 항목 | 핵심 가정 | 이론 근거·의미 | 민감도·검토 |
| --- | --- | --- | --- | --- |
| 1 | 대기 파라미터(I.2.1) | 15 ℃, RH 70%, z₀ 0.1 m, 946 W/m², 1.0145 bar | IV.3, VII.1 | z₀가 중가스 거리에 크다. 에탄은 저온 중가스 거동 가능 → z₀ 0.03/0.25 민감도 권장 |
| 2 | 기상(I.2.2) | 2015–16 현장 1년 자료, calm → 1.5 m/s, F1.5/C2.5/D4/D6 × 주야, 18 풍향 | VII.1 | 주간 F·야간 C의 물리적 타당성, 1년 자료 대표성(기상청 장기자료 비교) |
| 3 | 점화원(I.2.3) | 즉시(< 60 s):지연 = 40:60, 추가 점화원 in-time period 60 s | VI.4 | 지연 점화가 flash fire·VCE 빈도와 규모를 정한다. 점화원 강도·위치 목록 확인 |
| 4 | 건물 등급(I.2.4) | B1–B6 → Temp/Admin/Plant/Protected | VII.3 | CCR은 B5 + 가스 유입 방지 전제. BSA 결과로 재평가 예정 |
| 5 | 인구(I.2.5) | HET 주간 16명·야간 2명, 기존 건물·외부 3지점은 상세평가 제외 | VII.4 | 표 2.5.1/2.5.2 수치 공란 여부, Group IR용 근무표(2.5.5) 확인 |

### VIII.2 Failure case 정의(I.3)

| No. | 항목 | 핵심 가정 | 이론 근거·의미 | 민감도·검토 |
| --- | --- | --- | --- | --- |
| 6 | Hazard ID(I.3.1) | 스팀·N₂·공기·폐수·비위험 유틸리티 제외 | I.1 | Onsite 위험도 목적이므로 소형 사고도 제외 불가 |
| 7 | Failure case(I.3.2) | 5개 홀(5/20/65/150 mm/FB), 용기 파열 별도, 유닛 간 배관은 pipework, 2차 사고 미전파 | VI.1 | Escalation은 기준치(37.5 kW/m², 300 mbarg)로만 평가 |
| 8 | 섹션 파라미터(I.3.3) | 2상은 액체로 누출 정의(최대 질량유량), 최고압 조건, 높이 1 m, 수평 누출, 연결 재고 포함 | III.2, III.8 | 고가 설비(공냉기·파이프랙)는 실제 높이 적용 여부 |
| 9 | 누출 유형(I.3.4) | Vapour / Liquid(플래시 < 10%) / Flashing(≥ 20%) | III.1, IV.4 | 10–20% 구간 분류 기준이 없다 |
| 10 | 누출률·지속(I.3.5) | VI.6 표, 최대 3600 s, 독성은 min(NFR, Q₀) | III.6, VI.6 | 20 s 순간화·초기 2분 평균이 fireball·cloud 크기를 좌우 |
| 11 | 재고(I.3.6) | 체적 × 1.1, 충전율(70/50/25/10%) | VI.6 | P&ID 충전율 우선, 에탄 탱크·BOG 계통 적용값 확인 |
| 12 | 탐지·격리(I.3.7) | > 20% NFR 180 s, 그 외 600 s, 로딩암 ≥ 90 s, 성공 100% | VI.6 | ESD 실패확률 미반영 → 민감도 필수 |
| 13 | 기타(I.3.8) | M = Q×T, 속도 재계산, Phast 팽창 온도, 액적 ‘JIP III’ | III.7 | 기본은 Modified CCPS. 적용 상관식 명확화 필요 |

### VIII.3 빈도(I.4)

| No. | 항목 | 핵심 가정 | 이론 근거·의미 | 민감도·검토 |
| --- | --- | --- | --- | --- |
| 14 | 일반 고장률(I.4.1) | IOGP 434-01(2019) / HCRD, 탱크·로딩암 HSE FRED 2017 | VI.2 | 대역 불일치(VI.1 vs VI.2), Full containment는 홀 제외 |
| 15 | Parts count(I.4.2) | 압력경계 규칙, 밸브당 플랜지 2, 계기 = SBF 1 | VI.3 | P&ID 리비전 동기화 |
| 16 | 점화확률(I.4.3) | IOGP 434-06 No. 8(≤ 0.65)/No. 9(≤ 0.13), 40:60, AIT 초과 67% | VI.4 | 에탄은 No. 8. 입력 방식(직접 vs 점화원)과 ET 보고서 대조 |

### VIII.4 결과 분석(I.5)

| No. | 항목 | 핵심 가정 | 이론 근거·의미 | 민감도·검토 |
| --- | --- | --- | --- | --- |
| 17 | 결과 기반(I.5.1) | SAFETI, 단시간(< 20 s) 100% fireball, Non-default: LFL fraction to finish 0.5→1.0, residual pool fire 0.15→0, explosion location cloud front→centroid, minimum explosive mass 0→1000 kg | V.7, VI.5 | 1000 kg 미만 cloud의 혼잡구역 폭발이 제외된다 → 민감도 권장 |
| 18 | 물질·혼합물(I.5.2) | > 1 wt% 성분 + H₂S 등, 미량 불활성 무시, 수분 > 55 wt% 비가연, 최중질은 C20 | II.5 | Pseudo-component 기본, 문제 시 multi-component |
| 19 | 확산(I.5.3) | 수평(무충돌) + zero-momentum 원통형 cloud(같은 체적, 누출점 중심), 정상상태 cloud만 1 m 높이, 독성은 수평 | IV.1, IV.9 | 수평은 flash fire 최악, zero-momentum은 폭발 최악. 두 결과의 가중치 확인 |
| 20 | 화재(I.5.4) | Phast 기본, flash fire = LFL, 최대 풀 직경 25 m(약 500 m²), fireball은 가연범위 밖 질량 포함 전량 | V.3–V.6 | 핵심 기여 시나리오는 방향·플래시율·FDC 등 재검토 예정 |
| 21 | 폭발(I.5.5) | TNO Multi-Energy + congestion, 곡선 7(1 bar)/6(0.5 bar)/5, Yellow Book 규칙 + Pitblado/Alderman | V.8 | 곡선 선택이 과압 거리를 지배한다 |
| 22 | Congested volume(I.5.6) | 주 공정구역 곡선 7, 압축기 shelter·파이프랙 곡선 5, VBR 20%, 단일 set로 결합 허용 | V.8 | 작성일 Apr 2025(다른 항목은 Sep 2026). 최신 plot plan 반영 확인 |

### VIII.5 영향·기준(I.6)

| No. | 항목 | 핵심 가정 | 이론 근거·의미 | 민감도·검토 |
| --- | --- | --- | --- | --- |
| 23 | 사람 취약성(I.6.1) | 복사 SEI 3, LC1 5, LC50 25 kW/m²(Eisenberg). Flash fire LC1·LC50 = LFL, SEI = 110% LFL 거리. 과압 SEI 5, LC1 14, LC50 35 kPa, Pr = −15.6 + 1.93 ln P(Pa). LC50 이내 100%, 1% 미만 0 | V.2, VII.3 | Probit과 Table 6.1.4 중 실제 적용값 명시 필요 |
| 24 | 자산 취약성(I.6.2) | 설비 37.5 kW/m², escalation 300 mbarg(DNV T11) | V.9 | 25 kW/m² 목재 비점화 발화, 12.5 kW/m² 파일럿 발화 |
| 25 | 사람 위험 기준(I.6.3) | 작업자 10⁻³/10⁻⁶, 공중 10⁻⁴/10⁻⁶, FN 기준 없음 | I.3 | IRPA 그룹 정의 일치 |
| 26 | 자산 위험 기준(I.6.4) | Escalation > 10⁻⁴ undesired, < 10⁻⁵ desired | I.3 | Exceedance 빈도 산출 방법 명시 |

### VIII.6 가정들의 상호작용

- **격리시간(No.12) × 누출률 규칙(No.10)**: 180/600 s가 T = T\_iso + M\_iso/Q를 통해 지속시간과 누출량을 정한다. 독성 dose와 지연점화 확률에 바로 영향을 준다.
- **20 s 기준의 일치**: I.3.5의 순간화(T₀ < 20 s), I.5.1의 단시간 fireball(< 20 s), Phast Cut-off time(20 s)이 같은 값이다. 하나만 바꾸면 이벤트 트리 경로가 어긋난다.
- **확산 두 극단(No.19) × 폭발(No.21–22)**: zero-momentum cloud는 누출점 혼잡구역에 최대 체적을 둔다. 폭발 위험의 대부분이 여기서 나오므로 두 경우의 확률 배분을 보고서에 명시해야 한다.
- **LFL fraction 1.0 × flash fire = LFL × 취약성**: flash fire를 LFL 내부에서만 치명적으로 보는 설정과 일관된다. 다만 점화원 탐색도 LFL까지만 이뤄진다.

## Part IX. QA/QC, 흔한 오류, 민감도 분석

이번 검토에서 \[AR\] Rev.0에 확인이 필요한 항목 14건을 찾았다. 우선순위 High 5건은 결과에 직접 영향을 주므로 다음 리비전 전에 DNV와 협의할 것을 권한다.

### IX.1 \[AR\] 확인 필요 사항

| # | 우선 | 항목 | 내용 | 권고 |
| --- | --- | --- | --- | --- |
| 1 | High | 야간 C2.5 / 주간 F1.5 | Pasquill 표상 야간 A–C, 주간 E–F는 나오지 않는다. 저풍속을 F/C에 반반 배분한 것으로 보인다(주 33.4%, 야 39.9%) | 배분 근거 명시. 대안: 야간 F·E 중심, 주간 B·C 중심 |
| 2 | High | 복사 치사 기준 이원화 | Table 6.1.1은 Eisenberg probit, Table 6.1.4는 계단 취약성(12.5 kW/m² → 70%), Safeti 기본은 Purple Book probit. 세 값의 치사율 차이가 크다(V.2 표) | SAFETI에 실제 입력한 방식과 노출시간을 명시 |
| 3 | High | 격리 성공 100% | ESD 요구시 실패확률(PFD) 미반영. SIL 평가와 연계 불가 | 실패 분기(예: PFD 0.01–0.1, 3600 s) 민감도 |
| 4 | High | 최소 폭발질량 1000 kg | CCPS 인용이지만 곡선 7 혼잡구역에서는 1000 kg 미만도 유의한 과압이 가능하다 | 0 kg / 100 kg 민감도, 건물 영향 비교 |
| 5 | High | 홀 대역 불일치 | 결과 대역(1–5/5–20/20–65/65–150/>150)과 IOGP 빈도 대역(1–10/10–50/50–150/>150)이 다르다 | LEAK의 누적분포 재배분 방법 명시 |
| 6 | Med | 액적 상관식 | AR은 ‘JIP III’ 상관식을 기술. Phast 기본은 Modified CCPS이며 HSL 검증에서 더 정확했다 | 실제 설정값 확인, 문구 최신화 |
| 7 | Med | 플래시 10–20% 공백 | Liquid < 10%, Flashing ≥ 20% 사이 분류가 없다. 점화 상관식(No.8/9)은 10%가 경계 | ≥ 10%를 Flashing으로 통일 |
| 8 | Med | 풍향 18개 | TOTAL 권고 20–30개 미충족 | 풍향 사이 혼잡구역 누락 여부 확인, 불리한 방향 수동 검토 |
| 9 | Med | 기상자료 1년 | 2015–16 단일 연도 | 서산 기상대 등 장기 자료와 풍미 비교 |
| 10 | Med | Zero-momentum 가중 | 수평/원통형 두 cloud의 배분 비율이 없다 | 확률 분할(예: 50:50) 명시 |
| 11 | Low | 섹션 참조 오류 | I.4.5, I.4.6, I.6.2–6.3 등 존재하지 않거나 다른 항목을 참조한다. 혼잡구역을 I.2.4/I.2.5로 참조 | 편집 수정 |
| 12 | Low | 문서 이력 | 표지 Nov 06 / 이력 Nov 02 / DNV Report Rev.1 / I.5.6 Apr 2025 | 리비전 정합 |
| 13 | Low | 인구표 공란 | Table 2.5.1, 2.5.2 인원 값이 비어 있다 | 값 기입 또는 ‘미사용’ 명시 |
| 14 | Low | 기본 누출높이 1 m | 에탄 중가스 cloud는 지면 높이에서 가장 넓다 | 탱크 상부·파이프랙 누출은 실제 높이 적용 확인 |

### IX.2 계산 단계별 체크리스트

입력·스터디 구조

- [ ] Parameters의 non-default 항목이 \[AR\] Table 5.1.1과 일치(Admin Parameters 비교 기능 사용)
- [ ] 물질 조성 ≤ 6성분, 독성·가연성 플래그, CO₂/N₂ 독성 물질 사용 여부
- [ ] Map scale·origin·CRS, 설비 좌표·누출 높이·방향
- [ ] Weather 폴더·풍향 수·정규화, run row별 폴더 할당
- [ ] Combination factor 합 = 1(시간 분할만 합산)

Discharge

- [ ] Discharge 모드 결과로 Q·상·T 검산(기체 choke, 액체 √ΔP)
- [ ] 2상을 액체로 정의한 케이스의 final 액상분율·액적경 확인
- [ ] Q ≠ Q₀ 케이스의 속도 재계산(User Defined Source) 반영
- [ ] 최대 3600 s, 격리 재고 vs 연결 재고 구분

Dispersion·Toxic

- [ ] Passive 전환·touchdown·rainout 위치가 물리적으로 타당
- [ ] Toxic averaging time(600 s 또는 exposure time)과 Core averaging time
- [ ] 독성 probit A·B·N 단위(ppm·min) 출처
- [ ] 풀 최대 직경 25 m 제한 반영(bund 또는 사용자 지정)

Fire·Explosion

- [ ] 단시간(< 20 s) 사건의 fireball 질량·SEP(≤ 400 kW/m²)
- [ ] Jet fire 모델(기본: Cone/Miller) 확인
- [ ] Obstructed region 곡선 번호·VBR·높이·결합 기준(RIGOS 0.5)
- [ ] Explosion location = centroid, minimum explosive mass = 1000 kg

Frequency·Risk

- [ ] Parts count와 P&ID 리비전 일치, 로딩암 운전횟수 12회/년 반영
- [ ] ET Ignition report의 즉시/지연 비율이 40:60에 맞음
- [ ] RRP를 CCR·변전소·경계·집결지에 배치
- [ ] IR 등고선 10⁻³–10⁻⁸과 FN 기준선 설정(Risk Preferences)
- [ ] 상위 기여 시나리오에 대해 모델링 가정(방향·플래시·FDC) 재검토

### IX.3 흔한 오류

| 오류 | 증상 | 대책 |
| --- | --- | --- |
| Distance of interest를 설비에 입력 | 결과가 안 나옴 | Study 노드 Dispersion 탭에 입력 |
| Phast 파일을 Safeti로 변환 | Phast로 되돌릴 수 없음 | 사본 보관 후 변환 |
| 동시에 존재하지 않는 run row 합산 | 위험 과대 | 배치안은 별도 비교 |
| Flammable averaging time 변경 | LFL 거리 변화 | 18.75 s 유지 |
| 풍향 확률 합 ≠ 1, 정규화 미선택 | 위험 스케일 오류 | Normalise before calculations |
| Admin Parameters에서 프로젝트 값 변경 | 다른 스터디까지 변경 | Workspace Parameters 사용 |
| 독성·가연성 물질을 한 run row에서 중복 계산 | 이중 계산 | 교재처럼 독성 우선 등 규칙 명시 |
| RRP를 과다 생성 | 계산시간·파일 증가 | 목적 지점만 |

### IX.4 권장 민감도 케이스

| 케이스 | 변경 | 주로 영향받는 결과 |
| --- | --- | --- |
| S1 격리 실패 | ESD PFD 0.01–0.1 분기, 3600 s | 독성·flash fire·FN 꼬리 |
| S2 기상 | 야간 C2.5 → F/E, 주간 F1.5 → B/C | flash fire·폭발 거리, 야간 IR |
| S3 조도 | z₀ 0.03 / 0.25 m | 중가스 LFL 거리 |
| S4 최소 폭발질량 | 1000 → 0 kg | 건물 IR·과압 초과빈도 |
| S5 혼잡도 | 곡선 7 → 6, VBR 20 → 10% | 폭발 위험 |
| S6 복사 치사 | Table 6.1.4 vs Purple Book probit | jet fire 기여도 |
| S7 점화 분할 | 40:60 → 30:70 / 50:50 | jet fire vs flash fire·폭발 비중 |
| S8 로딩암 격리 | 90 s → 180 s | 제티 주변 위험 |

### IX.5 Tutorial·기술 문서 반영 추가 점검

Tutorial과 모델 기술 문서를 대조해 \[AR\]과 프로젝트 파일에서 추가로 확인할 항목이다.

- [ ] **기상(IX.1 #1 보강)**: Safeti Tutorial은 기본 3개 기상 중 F 1.5 m/s를 주간에 맞지 않는다며 주간 Run Row에서 B 3 m/s로 바꾸고, D 5 m/s는 야간에 맞지 않는다며 삭제한다. \[AR\]의 주간 F1.5 사용 근거를 확인한다.
- [ ] **LFL fraction to finish**: \[AR\]은 1.0, Tutorial 폭발 예제는 0.5. 0.5면 플래시 구름이 커지고, 질량 가중 폭발 중심이 누출원 쪽으로 옮겨간다(V.13). 선택 근거를 적는다.
- [ ] **Explosion method**: 위험 계산이 Purple Book/3D Purple Book/Obstructed Region 중 무엇인지, 결과(consequence) 폭발 보고서를 위험 입력으로 오해하지 않았는지(V.9a), 1/3 Rule 적용 여부, 에틸렌(고반응성) 혼재 시 DDT 처리.
- [ ] **최소 지연 점화 확률·조건부 폭발 확률**: Tutorial 예제는 0.15와 0.9다. \[AR\] 이벤트 트리(VI.5)와 같은 값을 썼는지 대조한다.
- [ ] **혼합물 PC/MC**: 비등 범위가 넓은 스트림의 상 판정, MC 사용 시 rainout 없음과 UDM 1015 경고(II.9). 혼합물 조성 수정 후 Calculate 재실행(II.8).
- [ ] **Discharge 설정**: metastable liquid, 방출계수 자동 계산, ATEX 'DNV recommended', 속도 상한 없음, Modified CCPS 상관식(III.9). 0.1 m 이하 초단관을 배관 모델로 다루지 않았는지.
- [ ] **TVDI**: \[AR\] 탐지·격리 시간과 blowdown이 isolation·blowdown 입력에 들어갔는지, 단열 가정을 보고서에 적었는지.
- [ ] **Jet fire 모델**: 비기체 Cook, 수평 기체 Johnson, 그 외 Chamberlain, 저휘도 기체 Miller(V.12). 제트 화재 averaging time 20 s.
- [ ] **복사 치사**: 파이어볼 선량 기준이 제트·풀 화재에도 켜져 있는지, 사람 취약성이 probit인지 VULN 계단표(\[AR\] Table 6.1.4)인지(VII.7).
- [ ] **독성**: 평균화 시간(600 s/18.75 s/노출시간), 혼합물 방법, CO₂·N₂ 독성 물질 사용 여부(IV.10a, II.8).
- [ ] **풀**: 방유벽·섬프 기질과 최소 두께, 순간 누출 방유벽 면적 배수(기본 1.5), 에탄 비등 풀의 기질 열물성(IV.12).
- [ ] **장배관·경로**: PIPEBREAK/GASPIPE/DISC 선택 기준, 매설 여부(CRATER), Route 사건 간격(III.9, VII.7).
- [ ] **건물**: BWM·INBU 적용 여부와 건물 인구 취약성의 중복(IV.13).
- [ ] **운영 파일**: Combination에 새 Run Row를 넣으면 결합 계수가 0으로 들어간다(Tutorial). 최종 결합 계수를 확인한다.

## 부록

### A. 주요 기호

| 기호 | 의미 | 단위 |
| --- | --- | --- |
| Q, Q₀, NFR | 대표 누출률, 초기(최대) 누출률, 정상 유량 | kg/s |
| T\_iso, M\_iso, M\_tot | 탐지+격리 시간, 격리 재고, 격리+상류 연결 재고 | s, kg |
| C\_D, G\_o, P\_c | 방출계수, 질량플럭스, choke 압력 | –, kg/m²s, Pa |
| η | 액상(또는 증기) 질량분율 | – |
| z₀, SRP | 조도 길이, 표면 조도 파라미터 | m, – |
| t\_av, t\_exp | 평균화 시간, 노출 시간 | s |
| A, B, N | probit 상수, 독성 지수 | – |
| L\_tox, L\_rad | 독성 load, 복사 dose | ppmⁿ·min, (W/m²)^{4/3}·s |
| SEP, V, τ | 표면방사력, view factor, 대기투과율 | kW/m², –, – |
| VBR, L\_p, S\_L | 체적차단비, 화염경로 길이, 층류연소속도 | –, m, m/s |
| f, ω | 점화원 존재확률, 점화강도 | –, 1/s |
| r\_{i,j} | run row i의 combination j 계수 | – |
| LSIR, IRPA, PLL, FAR | 위치·개인 위험, 연간 기대사망자, 치명사고율 | /yr, /yr, 명/yr, /10⁸h |

### B. 추가 자료 요청 목록

DNV 공개 문서로 대부분 보강했지만, 아래는 접근이 막혔거나 공개되지 않아 확보하지 못했다. 구해 주시면 해당 Part에 반영하겠다.

| # | 자료 | 사유 | 반영할 곳 |
| --- | --- | --- | --- |
| 1 | DNV MPACT Risk Model Theory (2025) | 사이트가 자동 열람 차단(robots) | VI.4 지연점화 식, VI.5 이벤트트리 기본값, VII.2 |
| 2 | DNV UDM Theory (Dec 2023) 전문 | 공개되어 있으나 내용 추출 실패. CCPS 논문으로 대체 | IV.2 entrainment 식, passive 전환 기준 |
| 3 | SAFETI 프로젝트 파일의 Parameters 보고서(또는 Params.xml) | 실제 기본값·변경값 확인 | 전반, IX.2 |
| 4 | Safeti/Phast Release Notes | 교재 이후 기본값 변경 확인 | 0.2, V.5 |
| 5 | Hanwha TotalEnergies QRA Guideline 2025, TotalEnergies GS HSE-312 (2022) | \[AR\] 근거 원문 | I.3, VI.1, VII.3 |
| 6 | DNV Technical Notes T11(구조 취약성), T13(Failure case), T15(Human impact), G16(LNG QRA) | DNV 내부 문서 | V.9, VI, VII.3 |
| 7 | IOGP 434-01(2019), 434-03(2022), 434-06(2021); EI 점화확률 지침(2019) | 상관식 원문·수치표 | VI.2, VI.4 |
| 8 | TNO Yellow Book(CPR 14E) · Purple Book(CPR 18E), CCPS CPQRA 2nd ed. | ME 곡선·취약성 기본값 원문 | V.8, VII.3 |
| 9 | DNV Droplet size(JIP III) 이론서, ATEX 이론서, EXPS(복사) 이론서 | 액적·팽창·투과율 상세식 | III.7, V.1 |
| 10 | HET QRA 본문, Appendix A/B(failure case·빈도), Appendix II | 섹션·재고·빈도 실제값 | VIII, IX |

2026-11-17 자료 수령으로 해결된 요청: MPACT·UDM·TXCS·POLF·JFSH·Fireball·OREM·ATEX·DISC·TVDI·PVAP·BWM 등 모델 이론·검증 문서, 물성 시스템·물성 DB. 위 표에서 모델 이론서 요청은 종료된 것으로 본다. 남은 요청:

- 프로젝트 스터디 파일의 Parameters 보고서(폭발 방식, LFL fraction, 최소 지연 점화·조건부 폭발 확률, ATEX·액적 옵션, Jet fire 모델, 독성 평균화 시간, 취약성 방식) — IX.5 점검에 필요
- (선택) RADS 복사 계산·Vessel burst 모델 문서. 점화(UKOOA/Cox-Lees-Ang 등)·플래시 화재·화재 영향 구역은 \[MPACT\] 5장으로 대부분 다뤄진다

### C. 출처

제공 자료: Safeti Training(678쪽), Phast Advanced Training SA-03/SA-04/SA-05, HET-SHQRA-001 Rev.0(DNV Report 10640598 AI Rev.1).

DNV Phast/Safeti Technical Documentation(열람한 문서):

- [DISC Model Theory](https://myworkspace.dnv.com/download/public/phast/technical_documentation/03_discharge/DISC%20Model%20Theory.pdf)
- [TVDI Model Theory](https://myworkspace.dnv.com/download/public/phast/technical_documentation/03_discharge/time-varying_discharge/TVDI%20Model%20Theory.pdf) (목록·요약만 확인)
- [PVAP Model Theory](https://myworkspace.dnv.com/download/public/phast/technical_documentation/04_pool_vaporization/PVAP%20Model%20Theory.pdf)
- [UDM CCPS paper (Witlox & Holt)](https://myworkspace.dnv.com/download/public/phast/technical_documentation/05_dispersion/udm/UDM_CCPS_Paper.pdf)
- [UDM Theory](https://myworkspace.dnv.com/download/public/phast/technical_documentation/05_dispersion/udm/theory/UDM%20Theory.pdf) (목차 확인만)
- [TXCS Toxic Model Theory](https://myworkspace.dnv.com/download/public/phast/technical_documentation/06_toxic_effects/TXCS%20Model%20Theory.pdf)
- [JFSH Jet Fire Model Theory](https://myworkspace.dnv.com/download/public/phast/technical_documentation/07_fire_models/JFSH%20Jet%20Fire%20Model%20Theory.pdf)
- [POLF Pool Fire Model Theory](https://myworkspace.dnv.com/download/public/phast/technical_documentation/07_fire_models/POLF%20Pool%20Fire%20Model%20Theory.pdf)
- [Fireball Model Theory, Review, Validation](https://myworkspace.dnv.com/download/public/phast/technical_documentation/07_fire_models/Fireball%20Model%20Theory_Review_Validation.pdf)
- [Obstructed Region Explosion Model Theory](https://myworkspace.dnv.com/download/public/phast/technical_documentation/08_explosions/Obstructed%20Region%20Explosion%20Model%20Theory.pdf)
- [Vulnerability Model Theory](https://myworkspace.dnv.com/download/public/phast/technical_documentation/09_risk/Vulnerability%20Model%20Theory.pdf)
- [Risk Reports Theory](https://myworkspace.dnv.com/download/public/phast/technical_documentation/09_risk/Risk%20Reports%20Theory.pdf)
- [Phast & Safeti consequence model verification and validation](https://myworkspace.dnv.com/download/public/phast/technical_documentation/01_overview/Phast&Safeti%20consequence%20model%20verification%20and%20validation.pdf)
- [DNV Knowledge Centre – Technical Documentation 목록](https://mysoftware.dnv.com/knowledge-centre/phast-and-safeti/tech-doc/09risk)

DNV Technical Documentation(2026-11-17 수령, 사용자 제공): 0.1의 두 태그 표에 문서명과 쪽수를 적었다. 묶음은 1. Overview(4), 2. Material Properties(4), 3. Discharge(3)·3.1 Long pipeline(4)·3.2 Time-varying discharge(2), 4. Pool vaporisation(3), 5. Dispersion(BWM, INBU, UDM 20건), 6. Toxic(1), 7. Fire(6), 8. Explosion(5), 9. Risk(6)이다.

일반 참고(본문 인용): HSE R2P2(영국 위험 허용 기준), Eisenberg probit(Lees), GAME(Eggen 1995), RIGOS(2002).

### D. 기본값·권고값 대조표

프로젝트 Parameters와 비교할 때 쓴다. 값은 문서에 적힌 기본값 또는 예제값이며, 실제 파일에서 다시 확인한다.

| 분야 | 항목 | 값 | 근거 |
| --- | --- | --- | --- |
| Discharge | 오리피스 상변화 | Disallow liquid phase change(metastable) | \[DISC\] |
| Discharge | 액체 방출계수 / 압축성 | 0.650 / Bragg 방법(0.6–1) | \[DISC\] |
| Discharge | bend 등가길이 | 10D | \[DISC\] |
| ATEX | 팩창 방법 / 속도 상한 | DNV recommended / 없음 | \[DISC\], \[ATEX\] |
| ATEX | 액적 상관식 | Modified CCPS | \[DISC\], Droplet |
| Pipeline | 하위 구간 / 사건 간격 / 통합 허용차 | 압력강하 ≤ 20%·길이 ≥ 20%·≥ 500 m / 최대 치사 거리 50% / 10% | \[NM\] |
| Pipeline | 모델 선택 | 개구율 > 20% 액체 PBRK, > 4% 기체 GSPP, 그 외 DISC | \[NM\] |
| INEX | f\_kin / K\_D / 순간 누출 방유벽 배수 | 0.04 / 1 / 1.5 | \[NM\], \[RD\] |
| UDM | GSC | 옵션 2(dW/dx > 2 전체, < 0.5 없음) | \[NM\] |
| UDM | passive 전환 | 속도비 0.1, 에너지비 0.3, 밀도비 0.015, Ri\* 15 | UDM Theory |
| UDM/TXCS | 평균화 시간 | 순간 18.75 s, 독성 600 s(농도 0.5배) | \[TXCS\] |
| TXCS | 독성 스텝 | 치사 1%까지 99등분 | \[RD\] |
| PVAP | 최소 두께 | 젖은 흙 0.01, 마른 흙 0.027, 콘크리트 0.005, 수면 0.0018 m | \[PVAP\] |
| PVAP | 육상 증발 / 물 열전달계수 | MacKay & Matsugu / 500 W/m²K(자료 없을 때) | \[PVAP-V\], \[PDB\] |
| Pool fire | smoky / general | Eₘ 140·Eₛ 20 kW/m²·Lₛ 8.33 m / 복사분율 0.40 | \[PDB\] |
| Pool fire | 수면 연소율 | ×2.5(NBP < 주위 온도) | \[PDB\] |
| Jet fire | 최대 SEP / averaging time | 350 kW/m² / 20 s | \[RD\] |
| Fireball | 치사 기준 | 선량 (20 s)·(35 kW/m²)^4/3 | \[RD\] |
| Explosion | ME uniform confined | 강도 10, 효율 12.5%, 가연 체적 전체 | \[TUT-P\] |
| Explosion | 결과 폭발 중심 / 최저 과압 | 구름 앞끝 50% LFL / 0.02 bar | \[TUT-P\] |
| Explosion | 3D Purple Book | ME 10, 12.5%, 0.3 bar 치사 1, 0.1 bar 실내 0.025 | \[MPACT\] |
| Explosion | Purple Book 반경 계수 Cₛ | 0.03(대파), 0.06(수리 가능) | \[MPACT\] |
| Explosion | 폭연 검증 권고 | ME 곡선 7 또는 BST Mach 0.8866 + 1/3 Rule | \[OREM-V\] |
| Explosion | 층류 연소속도 | 고반응성(에틸렌) 0.83, 중반응성 기본 0.52 m/s | \[PDB\] |
| Risk | 최소 지연 점화 / 조건부 폭발(예제) | 0.15 / 0.9 | \[TUT-SX\] |
| Risk | Combination 새 Run Row 계수 | 0 | \[TUT-S\] |
| Risk | 위험 격자 | 160,000칸 | \[RD\] |
