# Calendar RPG — 안드로이드 앱

Windows 위젯과 **같은 게임 엔진·화면**(`../desktop/src`)을 안드로이드 앱으로 감싼 것입니다(Capacitor).
여기에 안드로이드에서만 되는 기능을 네이티브(Java)로 더했습니다.

| 기능 | 설명 |
|---|---|
| 앱 화면 | 캘린더·오늘·가방·상점·설정 (아래 탭), 화면 아래 띠에서 용사가 슬라임과 싸움 |
| 홈 화면 위젯 · 오늘의 임무 | 오늘 할 일·일일임무 4개까지 보여 주고 **바로 체크**. 경험치·전리품은 앱을 열 때 지급 ("보상 대기 N개" 표시) |
| 홈 화면 위젯 · 용사 | 장착 장비 색이 반영된 용사가 숨쉬는 2장 움직임, 레벨·체력·경험치·골드 |
| 라이브 배경화면 | 도트 밤하늘 아래에서 내 용사(장비 반영)가 슬라임과 싸움. 누르면 공격·점프. 홈 화면이 보일 때만 움직여 배터리 절약 |
| 일정 알림 | 시간을 정한 일정·일일임무를 기기 알림으로 (7일치 미리 예약) |
| 뒤로 가기 | 창 닫기 → 캘린더 탭 → 앱 내리기 |

위젯과 라이브 배경화면은 앱 **설정 탭 → 안드로이드 홈 화면**에서 추가할 수 있어요.

## 받기

[CalendarRPG-0.3.0.apk](https://github.com/aorkaosmm/QRA-Service/releases/download/calendar-rpg-android-v0.3.0/CalendarRPG-0.3.0.apk) — 폰에서 내려받아 설치. 막히면 "출처를 알 수 없는 앱 설치"를 허용해 주세요.

## 빌드

필요: Node.js 22, JDK 21, Android SDK(플랫폼 36).

```bash
npm install
```
```bash
npm run apk
```
결과: `android/app/build/outputs/apk/release/app-release.apk`

- `npm run build:web` — `web/` + 공용 코드 → `www/` (JS·CSS·도트 글꼴) 와 네이티브용 `sprites.json`
- `node scripts/make-android-assets.mjs` — 앱 아이콘·시작 화면·위젯 미리보기·배경화면 썸네일 다시 만들기
- `cd android && ./gradlew testReleaseUnitTest` — 위젯·배경화면 네이티브 테스트(Robolectric, 실제 픽셀로 그려 `app/build/test-out/`에 PNG 저장)

## 서명

`android/app/test-signing.keystore` 는 **공개 테스트용 서명 키**입니다(비밀번호도 `build.gradle`에 공개).
어디서 빌드해도 같은 서명이라 새 APK가 기존 앱을 덮어쓰며 업데이트됩니다.
플레이 스토어 등 정식 배포 전에는 비공개 키를 새로 만들어 GitHub 비밀값으로 옮겨야 합니다.

## 데이터

앱 기록은 기기 안(SharedPreferences)에만 저장됩니다. 설정 탭의 **가져오기**로 Windows 판에서 내보낸 JSON을 불러올 수 있어요.
