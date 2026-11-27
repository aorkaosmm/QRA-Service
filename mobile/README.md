# Calendar RPG 모바일 시안 (반응형 웹)

폰에서 열면 앱 화면처럼, 넓은 화면에서는 **[폰 화면 | 홈 화면 위젯 | 설명]** 세 단으로 보이는 시안입니다.
그림만 있는 목업이 아니라 Windows 앱과 **같은 게임 엔진·화면 코드**(`../desktop/src`)를 브라우저 안 백엔드로 돌립니다.

- **앱 화면** — 위젯 화면을 모바일로 다듬은 것(아래 탭), 화면 아래 띠에서 용사가 슬라임과 싸움
- **홈 화면 위젯** — Android(달력 위젯·용사 위젯·라이브 배경화면), iPhone(바로 체크하는 위젯·잠금 화면 실시간 현황). 위젯의 체크 버튼도 실제로 동작
- **모바일에서 가능한 것** — Android·iPhone에서 용사와 슬라임을 어디까지 띄울 수 있는지 정리

## 보기

- 개발: 저장소 루트에서 `python -m http.server 8767` 실행 후 `http://localhost:8767/mobile/index.html`
- 한 파일로 묶기: `cd mobile && npm install && npm run build` → `dist/calendar-rpg-mobile.html` (도트 글꼴·코드 모두 포함, 약 1.6MB)

기록은 보는 사람의 브라우저(localStorage)에만 저장됩니다.
