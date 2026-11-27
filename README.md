# Calendar RPG

일정과 일일임무(할 일·공부·업무·식사…)를 끝낼 때마다 경험치와 전리품(골드 + 일반/희귀/영웅/전설 장비)을 얻어 도트 용사를 키우는 달력 위젯입니다.
용사는 Windows 작업표시줄 위에서 슬라임과 싸웁니다. 맞으면 뒤로 튕겨 나가고, 머리 위로 데미지 숫자가 떠오릅니다.

## 다운로드 (Windows)

| 파일 | 설명 |
|---|---|
| [CalendarRPG-Setup-0.2.0.exe](https://github.com/aorkaosmm/QRA-Service/releases/download/calendar-rpg-v0.2.0/CalendarRPG-Setup-0.2.0.exe) | 설치판 — Windows 알림, 시작 메뉴, Windows 시작 시 실행 |
| [CalendarRPG-Portable-0.2.0.exe](https://github.com/aorkaosmm/QRA-Service/releases/download/calendar-rpg-v0.2.0/CalendarRPG-Portable-0.2.0.exe) | 포터블 — 설치 없이 바로 실행 |

코드 서명이 없어서 처음 실행할 때 "Windows의 PC 보호" 창이 뜨면 **추가 정보 → 실행**을 누르세요.
이 브랜치(`Calendar-RPG`)에 `desktop/`이 바뀌어 푸시되면 GitHub Actions가 Windows에서 다시 빌드해 위 링크의 파일을 새로 올립니다.
이전 이름(QuestBar)으로 쓰던 데이터는 처음 실행할 때 자동으로 옮겨집니다.

## 구성

| 폴더 | 내용 |
|---|---|
| [`desktop/`](desktop/) | Windows 위젯 앱 (Electron) — 사용법·보상 규칙·개발 방법은 [`desktop/README.md`](desktop/README.md) |
| `.github/workflows/` | Windows 설치 파일 빌드·릴리스 자동화 |

게임 규칙 엔진(`desktop/src/core`)은 순수 JS라 모바일 앱·온라인 소셜 서버에서 그대로 재사용합니다.
