# A4. 디자인 시스템 분석 — 구현용 토큰 · 컴포넌트 · 레이아웃 · 접근성

> 작성 2026-10-02 · 담당: 디자인 시스템 분석가 · 산출 범위: 웹 프론트(React)만
> 근거 문서: 기능명세서 v1.9 / 화면설계서 v0.7 (2026-09-30) / DB명세서 v0.4 / **목업 v2 HTML + 웹 이미지 W-01~W-16 (2026-09-29 스크린샷 기준)** / 목업 v1 `잔디로그_목업.html` (2026-09-13, 참고용) / `_인수인계.md`
> 표기: **(제안)** = 명세에 근거 없음, 이 문서가 새로 정한 것 · **(추측)** = 명세 취지에서 도출만 한 것 · `§` = 화면설계서 절 번호 · `W-xx` = 목업 v2 웹 이미지 번호

---

## 0. 요약 — 구현팀이 먼저 알아야 할 것

1. **토큰의 원천은 목업 v2의 `:root` 23개 변수 + 하드코딩 색 22개다.** v1(IBM Plex Sans KR · `#1F7A4D` · 다크 테마)과 값이 다르다. 인수인계 2026-09-29 항목이 "9/13판은 참고용으로 남겨 뒀다"고 적었으므로 **값은 v2를 따른다.** 토스트 · 확인 모달 · 빈 상태 · 스켈레톤 · 보류 배지 · 좁은 관리자 화면은 v2에 없어 **v1의 구조를 v2 토큰으로 다시 칠해** 쓴다.
2. **화면 22개 중 목업 v2에 그려진 것은 12개 화면(+헤더 검색 2상태, 드로어)뿐이다.** AU-02 · AU-03 · CM-02 · TM-02 · TM-03 · TM-04 · TM-08 · NT-01 · NT-02 · PR-02, AD-01의 탭 4개(가입 승인 · 면제 · 공지 · 게시물)는 기존 컴포넌트 조합으로 만들어야 한다 (4-0 표의 "목업 없음" 열).
3. **주간 진행 스트립은 이 서비스의 시그니처 컴포넌트다.** 한 칸이 4가지 정보를 겹쳐 싣는다 — 잔디 단계(배경 5단계) · 기록글(오른쪽 위 파란 모서리) · 인증일(아래 밑줄 + 굵은 요일) · 날짜 상태(오늘 = 진한 테두리 / 미래 = 점선). 화면설계서 CM-01 ② · TM-05 ⑥은 아직 "요일 7칸 점(●○)"으로 적혀 있어 **목업 v2가 더 최신 시각 결정**이다.
4. **상태 배지는 "색 + 아이콘 + 라벨" 3중 표기가 확정 원칙이다** (v1 디자인 시스템 · 인수인계 4장). v2는 판정 계열은 지켰지만 "인증 미포함" · "기록글 n개" · "정정 중"은 아이콘이 없다. 배지 26종을 4-7에 전수로 정리했고 **DB enum → 화면 라벨 매핑을 한 파일에 모으는 구조**를 제안한다 — 목(mock) API를 실제 GraphQL로 갈아끼워도 화면이 안 바뀌게 하는 핵심이다.
5. **목업은 반응형 규칙이 0줄이다.** 명세에 있는 기준은 **768px**(헤더 검색 접힘, §5-1-0-1 · 제안)과 **960px**(AD-01 "모바일 웹" 상태, §5-1-10 와이어프레임)뿐이다. 이 둘을 브레이크포인트로 채택하고 화면별 동작을 3-4에 정했다.
6. **WCAG 대비 측정 결과 텍스트 색은 대부분 통과하지만, 입력칸 테두리(1.31:1) · placeholder(2.63:1) · 기록글 모서리-진한 잔디(1.22:1)는 실패한다.** 5장에 수치와 대안 색을 적었다. 목업 충실도와 충돌하므로 의뢰인 확인 사항으로 올렸다.
7. **목업에는 구현하면 안 되는 문구 · 렌더링 결함이 있다** — W-10 "(미결 Q-01)" 내부 메모, W-05 하단 설명 주석, W-06 원형으로 깨진 잔디 칸, W-15 "전/체" 줄바꿈. 7장에 목록화했다.

---

## 1. 근거와 우선순위

| 상황 | 따르는 쪽 | 판단 근거 |
|---|---|---|
| 색 · 폰트 · 크기 · 간격 값 | **목업 v2** | 인수인계 2026-09-29: v2가 사용자 스크린샷 22장을 기준으로 새로 만든 최신 시각안. v1은 "참고용으로 남겨 뒀다" |
| 화면 구성요소의 **존재 여부 · 노출 조건 · 동작** | **화면설계서 v0.7** | §5-1-0 "구성요소 표"가 동작 · 권한의 기준. v0.7(9/30)이 v2(9/29)보다 하루 늦다 |
| 화면설계서 레이아웃(와이어프레임)과 v2 시각이 다를 때 | **목업 v2 시각 + 화면설계서 구성요소** | v0.7의 변경 범위는 "헤더 검색 추가"뿐이다(§머리말 · 인수인계 09-30). 나머지 와이어프레임은 v0.3~v0.6 때 그린 그대로라 v2 스크린샷이 시각적으로 더 최신이다 **(추측)** |
| v2에 없는 컴포넌트 (토스트 · 모달 · 빈 상태 · 스켈레톤 · 보류 배지 · 좁은 관리자) | **목업 v1 구조 + v2 토큰** | v1 "디자인 시스템" 탭과 "화면 9-7 관리자 공통 요소"가 유일한 시각 근거 |
| 문구 | **화면설계서 §5-4 문구** (최종 문구라고 §5-4-0에 명시) | 단, §5-2-8 규칙과 충돌하는 문구는 6장에 표시 |
| 필드명 · 열거값 | **DB명세서 v0.4** | 배지 매핑(4-7)의 키 |

---

## 2. 디자인 토큰

### 2-1. 색 — 목업 v2 `:root` 변수 (원시 → 의미 토큰 제안)

토큰 이름은 `color.{역할}.{세부}` 형식이며 CSS 변수로는 `--color-{역할}-{세부}`로 노출한다 **(제안)**.

| v2 변수 | hex | 의미 토큰 (제안) | 목업에서 쓰인 곳 |
|---|---|---|---|
| `--outer` | `#E2E7E3` | **토큰화하지 않음** | 목업 문서 바깥 배경. 앱에는 없다. 앱 `body` 배경은 `--canvas`다 |
| `--canvas` | `#F4F6F3` | `color.bg.canvas` | 본문 배경 (전 화면) |
| `--surface` | `#FFFFFF` | `color.bg.surface` | 헤더 · 드로어 · 카드 · 표 · 입력 · 팝업 |
| `--surface-2` | `#F7F9F7` | `color.bg.subtle` | 표 헤더(th) · 검색 팝업 푸터 · 아이콘 버튼 hover |
| `--line` | `#DCE2DE` | `color.border.default` | 카드 · 표 · 입력 테두리, 섹션 구분선, 경고 게이지 꺼진 칸 |
| `--line-2` | `#E9EDEA` | `color.border.subtle` | 표 행 사이, 글 상세 항목 사이(W-12), 팝업 푸터 위 |
| `--ink` | `#17201B` | `color.text.primary` | 제목 · 본문 · 수치 |
| `--ink-2` | `#3F4A44` | `color.text.secondary` | 보조 본문 · 배지 중립 · 태그 |
| `--ink-3` | `#66716B` | `color.text.tertiary` | 메타 · 힌트 · 표 헤더 · 주석(`.foot`) |
| `--ink-4` | `#98A29C` | `color.text.disabled` | placeholder · 비활성 chevron(W-06 → 다음 주) · 카드 chevron(W-08) |
| `--green` | `#1E6B3C` | `color.brand.primary` | 주 버튼 · 포커스 링 · 드로어 활성 · 글 소제목(W-12) · 탭 결과 수(W-05) |
| `--green-h` | `#17552F` | `color.brand.primaryHover` | 주 버튼 hover |
| `--green-bg` | `#E6F3EA` | `color.status.pass.bg` | 통과 · 차감됨 배지 배경 |
| `--green-tint` | `#EEF6F0` | `color.bg.selected` | 드로어 활성 행 · 검색 제안 선택 줄 · 표 본인 행(W-09) · 라디오 카드 선택 · 성공 안내 박스 |
| `--h0`~`--h4` | `#E7ECE9` `#C0E3CD` `#7FC49B` `#3A9A5E` `#1E6B3C` | `color.grass.0`~`4` | 주간 스트립 · 미니 스트립 · 히트맵 · 로고 마크(h3/h1) · 토글 켜짐(h3) |
| `--blue` | `#2A4AA8` | `color.record` · `color.status.exempt.fg` · `color.link` | 기록글 모서리 · 면제 배지 · 텍스트 링크 · "정정 중"(W-15) — **역할 3개가 한 색에 겹친다 (8장 C-11)** |
| `--blue-bg` | `#E7EDF8` | `color.status.exempt.bg` · `color.notice.info.bg` | 면제 배지 · "기록글 1개" 배지(W-06) · 받은 초대 박스 |
| `--blue-ink` | `#24397F` | `color.notice.info.fg` | 받은 초대 박스 글자 |
| `--red` | `#B42318` | `color.danger.fg` · `color.status.fail.fg` · `color.status.penalty.bg` · `color.count.bg` · `color.required` | 미달 · 벌칙 대상(채움) · 숫자 원 배지 · 필수 `*` · 위험 버튼 글자 |
| `--red-bg` | `#FDECEA` | `color.status.fail.bg` | 미달 배지 |
| `--red-line` | `#F2C6C1` | `color.danger.border` | 위험 버튼 테두리 · 팀 삭제 영역 테두리 |
| `--amber` | `#9C4A0A` | `color.warning.fg` · `color.gauge.on` · `color.pin` | 유효 경고 배지 · 경고 게이지 켜진 칸 · 공지 고정 핀 |
| `--amber-bg` | `#FCEFE2` | `color.warning.bg` | 유효 경고 배지 |
| `--dark` | `#1B1F23` | `color.neutral.inverse` | GitHub 로그인 버튼 · 팀장 배지 · 오늘 칸 테두리 · 인증일 밑줄 · 현재 페이지 번호 |

### 2-2. `:root` 밖에 하드코딩된 색 → 토큰화 대상

| hex | 쓰인 곳 (v2 CSS 클래스 · 화면) | 의미 토큰 (제안) |
|---|---|---|
| `#ECEFED` | `.p-mute` 배경 (첫 참가 · 아직 · 진행 중 · 인증 미포함) | `color.status.neutral.bg` |
| `#E8ECE9` | `.tag` 배경 (W-05 · W-11 · W-12) | `color.tag.bg` |
| `#E9EEEB` | `.box-mute` 배경 (W-13 인증 안내) | `color.notice.neutral.bg` |
| `#EEF2FB` | `.tb tr.hl-b` 정정 중인 행 (W-15) | `color.row.editing` |
| `#FFF1B8` | 검색어 형광 `mark` (W-05) | `color.highlight` |
| `#8DB89E` | `.btn-p[disabled]` (W-12 댓글 등록) | `color.brand.primaryDisabled` |
| `#B5C0B9` | `.btn-o:hover` 테두리 · W-05 검색 입력 테두리 | `color.border.strong` |
| `#C9D1CC` | 헤더 검색창 테두리 | `color.border.control` |
| `#9DA8A1` | 헤더 검색창 hover 테두리 | `color.border.controlHover` |
| `#BCC6C0` | `kbd` 테두리 | `color.border.kbd` |
| `#5E6A63` | 헤더 검색 닫힘 문구 | `color.text.tertiary`로 통합 **(제안)** — 대비 5.65 vs 5.07로 차이가 시각적으로 무의미 |
| `#C5CDC8` | 미래 날 점선 (`.sq.fut`) | `color.strip.futureBorder` |
| `#E4E9E6` | 세그먼트 탭 트랙 (`.seg`) | `color.bg.track` |
| `#9AA59E` | 라디오 원 테두리 (`.rdo`) | `color.border.radio` |
| `#D8DFDB` / `#6F7A74` | 프로필 기본 이미지 배경 / 아이콘 (W-14) | `color.avatar.placeholder.bg` / `.fg` |
| `#FFF7F6` | 팀 삭제 위험 영역 배경 (W-10) | `color.danger.bg` |
| `#27302B` | 글 본문 serif 텍스트 (W-12) | `color.text.article` |
| `#E6EBE8` | 앱 A-08 아이콘 타일 | `color.bg.iconTile` (전체 화면 상태 화면에 재사용, 4-20) |
| `#3B7A57` `#4B5FA8` `#9A5B3A` `#7A5A9A` `#4F7A86` `#8A6A3A` | 아바타 이니셜 배경 (목업은 성씨별 고정) | `color.avatar.1`~`6` — **회원 id 해시 % 6으로 고정 배정 (제안)**. 흰 글자 대비 4.71~6.0 모두 AA 통과 |
| `#D2D9D4` `#D5DCD7` `#1F2421` `rgba(226,231,227,.92)` | 목업 문서 크롬 · 폰 프레임 | **토큰화하지 않음** (목업 전용) |

### 2-3. 상태색 묶음 (배지 · 박스 공용)

| 의미 토큰 묶음 (제안) | fg | bg | 테두리 | 쓰는 상태 |
|---|---|---|---|---|
| `status.pass` | `#1E6B3C` | `#E6F3EA` | — | 통과 · 차감됨 · 인증 1일 |
| `status.fail` | `#B42318` | `#FDECEA` | — | 미달 · 미달 (경고) |
| `status.exempt` | `#2A4AA8` | `#E7EDF8` | — | 면제 · (W-06) 기록글 n개 |
| `status.neutral` | `#3F4A44` | `#ECEFED` | — | 첫 참가 · 아직 · 진행 중 · 인증 미포함 · 제외 |
| `status.warning` | `#9C4A0A` | `#FCEFE2` | — | 유효 · 보류 **(제안 — v1도 보류를 warn 계열로 둠)** |
| `status.penalty` | `#FFFFFF` | `#B42318` | — | 벌칙 대상 (채움형) |
| `status.inverse` | `#FFFFFF` | `#1B1F23` | — | 팀장 |
| `status.outline` | `#3F4A44` | `#FFFFFF` | `#DCE2DE` | 공개 · 비공개 · 글 종류(`.cat`) |
| `notice.info` | `#24397F` | `#E7EDF8` | — | 받은 초대 · E-36 · E-46 배너 **(배너는 제안)** |
| `notice.success` | `#1E6B3C` | `#EEF6F0` | — | "필수 항목을 다 채웠어요" (앱 A-05) |
| `notice.neutral` | `#3F4A44` | `#E9EEEB` | — | "필수 항목을 다 채우면 인증에 들어가요" (W-13) |
| `notice.warning` | `#9C4A0A` | `#FCEFE2` | **(제안)** `#F0D2B4` | E-39 · E-27 · E-08 · E-32 배너 — **v2에 없음 (제안)** |
| `danger.zone` | `#B42318` | `#FFF7F6` | `#F2C6C1` | 팀 삭제 영역 (W-10) |

### 2-4. 오버레이 · 그림자

| 토큰 (제안) | 값 | 쓰인 곳 |
|---|---|---|
| `overlay.scrim` | `rgba(40,48,44,.45)` | 드로어 뒤 (W-03) · 모달 뒤 **(모달은 제안)** |
| `overlay.dim` | `rgba(30,40,34,.22)` | 헤더 검색 입력 중 본문 가림 (W-04) — 헤더는 가리지 않는다 |
| `shadow.raised` | `0 1px 2px rgba(0,0,0,.08)` | 세그먼트 탭 선택 칸 |
| `shadow.popover` | `0 18px 44px rgba(20,30,25,.18)` | 검색 제안 팝업 |
| `shadow.modal` | `0 1px 2px rgba(20,30,25,.06), 0 14px 34px rgba(20,30,25,.10)` | 목업 프레임 그림자 → 모달 · 토스트에 재사용 **(제안)** |
| `shadow.focusRing` | `0 0 0 3px rgba(30,107,60,.16)` + 테두리 `#1E6B3C` | 헤더 검색 열림 상태. **모든 입력 포커스에 같은 규칙 적용 (제안 · v1 `.inp:focus`와 같은 방식)** |
| `shadow.todayRing` | `inset 0 0 0 2px #1B1F23` | 스트립 오늘 칸 |

### 2-5. 타이포그래피

**패밀리**

| 토큰 | 값 (v2 그대로) | 용도 |
|---|---|---|
| `font.sans` | `"Pretendard Variable","Pretendard","Noto Sans KR",system-ui,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif` | UI 전체 |
| `font.serif` | `"Noto Serif KR","Nanum Myeongjo","AppleMyungjo",serif` | **회원이 쓴 장문** — 글 상세 본문(W-12 16px/1.95) · 글쓰기 필수 항목 textarea(W-13 14.5px/1.7). 관리자 사유 입력(W-15)은 sans로 되돌린다 |
| `font.mono` | `ui-monospace,SFMono-Regular,Menlo,Consolas,monospace` | `kbd`(키 표시)만 |

로딩: v2는 Pretendard v1.3.9 dynamic-subset(jsDelivr) + Google Fonts(Noto Sans KR 400–800, Noto Serif KR 400·500). 구현에서는 **`pretendard` npm 패키지 자체 호스팅 + Noto Serif KR 400·500만 로드 (제안)** — 외부 CDN 장애가 화면 전체 폰트를 바꾸지 않게 한다. 굵기는 400 · 500 · 600 · 700 · 800 다섯 단계를 쓴다.

**크기 스케일** (v2에서 실제 쓰인 값 23종을 역할로 묶음)

| 토큰 (제안) | 크기 / 굵기 / 자간 / 줄간격 | 쓰인 곳 |
|---|---|---|
| `text.hero` | 46 / 800 / -.04em | 로그인 "잔디로그" (W-01) |
| `text.num.xl` | 40 / 800 / -.04em / 1 · tabular-nums | 홈 인증일 · 기록글 수치, AC-02 누적 경고 (`.big`) |
| `text.num.lg` | 32 / 800 / -.04em / 1 | 홈 · 프로필 경고 `1 / 3` |
| `text.num.md` | 30 / 800 / -.04em / 1 | AC-01 이번 주 판정 카드 |
| `text.num.unit` | 17 / 600 / -.01em · `text.tertiary` | 수치 뒤 `/ 3일` (`.big small`) |
| `text.num.kpi` | 23 / 700 · tabular-nums | 관리자 KPI 카드 · 초대코드(23/800/+.14em) |
| `text.title.post` | 32 / 800 / -.035em / 1.3 | 글 상세 제목 (W-12) |
| `text.title.page` | 26 / 800 / -.035em / 1.3 | 페이지 제목 `.pt` |
| `text.title.panel` | 20 / 700 | 관리자 탭 안 제목 (W-16) |
| `text.title.section` | 17 / 700 / -.02em | 섹션 제목 `.sh h2` · 카드 제목 · 로고 17/800/-.03em |
| `text.title.item` | 16 / 700 / -.02em | 게시판 목록 글 제목 |
| `text.body.lg` | 15 / 400~700 | 홈 진행 안내 · 현황판 이름 · 인증일 수 |
| `text.article` | 16 / 400 / — / 1.95 · serif · `color.text.article` | 글 상세 본문 |
| `text.article.label` | 14 / 800 · `brand.primary` | 본문 소제목 "문제 · 원인 · 해결" |
| `text.control` | 14.5 / 400~600 | 입력값 · 드로어 대메뉴 · 세그먼트 · 관리자 탭 |
| `text.body` | 14 / 400 / — / 1.5 | 기본 본문 · 표 · 버튼(700) · 라벨(700) |
| `text.body.sm` | 13.5 / 400~600 | 보조 본문 · 드로어 서브메뉴 · 헤더 검색 · 셀렉트 |
| `text.meta` | 13 / 400 · `text.tertiary` | 작성자 · 날짜 · `btn-sm` |
| `text.label` | 12.5 / 500~600 | 배지 · 표 헤더 · 힌트 · 주석 · 요일 라벨 · 태그 |
| `text.caption` | 12 / 400 | `.xs` (기준 시각 · "나") · 검색 팝업 푸터 |
| `text.micro` | 11.5 / 500~700 | `kbd` · 검색 팝업 그룹 제목 |
| `text.count` | 11 / 700 | 숫자 원 배지 |

**줄간격**: 기본 1.5(`body`) · 제목 1.3 · 큰 수치 1 · textarea 1.7 · 설명 단락 1.75(W-07) · 글 본문 1.95.
**자간**: -.04em(히어로 · 큰 수치) / -.035em(페이지 · 글 제목) / -.03em(로고) / -.02em(섹션 · 목록 제목) / -.01em(수치 단위) / +.14em(초대코드).

### 2-6. 간격 · 크기 · 모서리

**간격** — v2 padding · margin · gap에 실제 쓰인 값의 빈도 상위: 10 · 12 · 14 · 16 · 18 · 20 · 22 · 6 · 8 · 40. 2px 단위가 섞여 있어 4px 그리드가 아니다. 목업 재현을 위해 **2px 단위 스케일을 그대로 토큰화 (제안)**.

| 토큰 (제안) | px | 대표 사용처 |
|---|---|---|
| `space.0.5` | 2 | 세그먼트 칸 사이 · 로고 마크 칸 사이 |
| `space.1` | 4 | 배지 아이콘-글자 · 페이지 부제 위 |
| `space.1.5` | 6 | 버튼 묶음 사이(xs) · 요일 라벨 위 |
| `space.2` | 8 | 버튼 묶음 사이 · 태그 사이 · 라벨-입력 |
| `space.2.5` | 10 | 섹션 제목 안 · 셀렉트 안 |
| `space.3` | 12 | 카드 사이 · 드로어 패딩 · KPI 사이 |
| `space.3.5` | 14 | 헤더 요소 사이 · 섹션 제목 아래 |
| `space.4` | 16 | 표 셀 좌우 · 박스 좌우 |
| `space.4.5` | 18 | 카드 안 · 글 목록 행 위아래 |
| `space.5` | 20 | 헤더 좌우 · 필드 아래 · 카드 안 |
| `space.5.5` | 22 | 카드 안 큰 패딩 · 섹션 간 소 |
| `space.6` | 24 | 본문 좌우 거터 · 카드 안 |
| `space.7` | 28 | 구분선 위아래 · KPI 아래 |
| `space.8` | 32 | 본문 위 패딩 · 홈 3단 그리드 사이 |
| `space.10` | 40 | 2단 그리드 사이 · 섹션 사이 |
| `space.11` | 44 | 큰 섹션 사이 (W-06 · W-14) |

**컨트롤 높이**

| 토큰 (제안) | px | 쓰인 곳 |
|---|---|---|
| `size.control.xs` | 28 | `btn-xs` (팀장 넘기기 · 추방 · 수정) · 페이지 번호 |
| `size.control.sm` | 32 | `btn-sm` |
| `size.control.md` | 34 | 아이콘 버튼 `.ib` · 헤더 검색창 |
| `size.control.lg` | 40 | 기본 버튼 · 관리자 툴바 셀렉트 · 툴바 검색 |
| `size.control.xl` | 46 | 기본 입력칸 · 입력 옆 버튼(초대 · 댓글 등록) |
| `size.control.2xl` | 52 | 로그인 버튼(폭 400) · 글쓰기 [등록] |
| `size.header` | 58 | 공통 헤더 · 드로어 머리 |
| `size.drawer` | 300 | 드로어 폭 |
| `size.avatar` | 32 / 28(sm) / 88(프로필) | |

**모서리**

| 토큰 (제안) | px | 쓰인 곳 |
|---|---|---|
| `radius.2xs` | 2.5 | 히트맵 칸 |
| `radius.xs` | 3 | 미니 스트립 칸 · 형광 mark · 범례 칸 |
| `radius.sm` | 5 | `kbd` |
| `radius.badge` | 6 | 배지(`.pill`) · 글 종류(`.cat`) · 큰 스트립 칸 |
| `radius.btn.xs` | 7 | `btn-xs` |
| `radius.md` | 8 | `btn-sm` · 아이콘 버튼 · 헤더 검색 · 세그먼트 칸 · 팝업 항목 |
| `radius.control` | 9 | 기본 버튼 · 입력 · 셀렉트 · 드로어 행 |
| `radius.lg` | 10 | 세그먼트 트랙 · 안내 박스 · 라디오 카드 |
| `radius.xl` | 12 | 카드 · 표 · 검색 팝업 · 위험 영역 |
| `radius.pill` | 13 / 14 | 태그(h26) · 토글(h28) — `999px`로 통일 **(제안)** |
| `radius.full` | 50% | 아바타 · 숫자 원 배지 · 라디오 |

### 2-7. z-index · 모션

| 토큰 (제안) | 값 | 근거 |
|---|---|---|
| `z.dim` | 7 | v2 `.dim::after` |
| `z.header` | 8 | v2 `.wf-top` — 검색 dim 위에 헤더가 남는다 |
| `z.popover` | 9 | v2 `.gs-pop` |
| `z.drawerScrim` / `z.drawer` | 10 / 11 | v2 |
| `z.modal` | 20 | **(제안)** v2 없음 |
| `z.toast` | 30 | **(제안)** 모달 위에도 보여야 한다 (모달 안 동작 결과 토스트) |
| `motion.fast` | 140ms ease | v1 `.btn` transition .14s **(제안 — v2는 전환 효과 없음)** |
| `motion.reduce` | `prefers-reduced-motion: reduce`면 애니메이션 · 스켈레톤 반짝임 정지 | v1 65행. v2에서 빠짐 → 다시 넣는다 **(제안)** |

### 2-8. 목업 v1 → v2에서 바뀐 값 (구현 시 v1 값을 가져오지 말 것)

| 항목 | v1 (9/13) | v2 (9/29) |
|---|---|---|
| 글꼴 | IBM Plex Sans KR / IBM Plex Mono(수치 · 표 헤더) | Pretendard / Noto Serif KR(본문) / 시스템 mono(키 표시만) |
| 주색 | `--green-700 #1F7A4D` | `--green #1E6B3C` |
| 상태색 | `--ok #1F7A4D` `--warn #B26A05` `--bad #C0392F` `--info #2B5F86` | `--green` `--amber #9C4A0A` `--red #B42318` `--blue #2A4AA8` |
| 다크 테마 | 있음(`prefers-color-scheme` + `data-theme`) | **없음** |
| 메뉴 | 진한 남색 사이드바(`--nav #122230`)를 드로어로 | 흰 드로어 + 초록 틴트 활성 |
| 배지 | 알약형 r20 · 11.5px · 유니코드 기호 아이콘 | 사각형 r6 · 12.5px/600 · lucide SVG 아이콘 |
| 표 헤더 | mono · 대문자 · 자간 | sans 12.5/600 · `surface-2` 배경 |
| 수치 | mono 600 | sans 800 · tabular-nums |

---

## 3. 레이아웃

### 3-1. 앱 셸

| 요소 | 값 (v2) | 근거 |
|---|---|---|
| 공통 헤더 | 높이 58 · 흰 배경 · 아래 1px `border.default` · 좌우 20 · 요소 사이 14 · 순서 **☰ · 로고 · (여백) · 검색창 · 세로선(1×24) · 사용자** | §4-3 웹 헤더 · §5-1-0-1 · W-02 |
| 본문 | 배경 `bg.canvas` · 패딩 위 32 / 좌우 24 / 아래 60 · 가운데 정렬 컨테이너 | v2 `.wf-body` |
| 드로어 | 왼쪽 고정 300 · 전체 높이 · 스크림 `overlay.scrim` · **해상도 무관 동일** | §4-3 · 기능명세서 10장 · 인수인계 3장 확정 |
| 인증 화면(AU 계열) | 로고만 있는 상단 바 + 가운데 정렬 본문 (W-01) | 목업 W-01. 단 §4-3은 "헤더 자체가 없다" → 8장 C-02 |

### 3-2. 본문 폭 3종 — 화면별 배정

| 폭 토큰 (제안) | max-width | v2 클래스 | 목업 화면 | 목업 없는 화면 배정 **(제안)** |
|---|---|---|---|---|
| `layout.width.md` | 700 | `.w-md` | W-10 TM-06 · W-12 BD-03 · W-13 BD-04 | TM-02 · TM-03 · TM-08 · PR-02 (입력 폼) · NT-02 (읽기 상세, BD-03과 같은 이유) |
| `layout.width.lg` | 960 (기본) | `.w-lg` | W-01 AU-01 · W-02~W-04 CM-01 · W-05 · W-11 BD-01 · W-06 AC-01 · W-07 AC-02 · W-08 TM-01 · W-09 TM-05 · W-14 PR-01 | TM-04 · NT-01 (목록) · AU-03 · CM-02 (가운데 정렬 단독 화면) |
| `layout.width.xl` | 1120 | `.w-xl` | W-15 · W-16 AD-01 | AD-01 탭 전체 (members · exemptions · notices · posts) |

AU-02(로그인 처리중)는 폭 개념 없이 화면 중앙 정렬 **(제안)**.

### 3-3. 화면별 그리드 (v2 인라인 스타일에서 추출)

| 화면 | 그리드 | 960 미만 동작 **(제안)** |
|---|---|---|
| CM-01 홈 (W-02) | `1fr · 1px 세로선 · 274px` gap 32. 왼쪽 = 이번 주 진행, 오른쪽 = 내 경고 + 받은 초대 | 1열. 순서 ② → ④ → ⑤ (§5-1-3 "앱 차이": 세로 1열, ④⑤ 각각 한 줄) |
| CM-01 ② 내부 | 스트립(46px 칸) + 수치 2개, gap 40 | 768 미만: 수치를 스트립 아래로 |
| AC-01 (W-06) | `1fr 340px` gap 40. 왼쪽 = 스트립(54px) + 날짜별 표, 오른쪽 = 이번 주 판정 카드 | 1열. 판정 카드를 표 위로 **(제안 — 결론이 먼저)** |
| AC-02 (W-07) | `1fr 1fr` gap 40 두 번 (누적 경고 / 연속 통과, 기준 / 벌칙 안내) | 1열 |
| PR-01 (W-14) | 머리 `88px 아바타 + 정보` gap 26 · 하단 `320px 1fr` gap 40 (경고 / 판정 이력) | 1열 |
| AD-01 대시보드 (W-15) | KPI `repeat(4,1fr)` gap 12 · 본문 `1fr 360px` gap 20 (목록 / 정정 패널) | KPI 2×2. **목록과 패널을 나란히 두지 않고 [정정] 시 패널로 순차 전환** (§5-1-10 ②-0 마지막 인용) |
| AU-01 (W-01) | 세로 중앙 정렬, 버튼 폭 400 | 버튼 `width:100%; max-width:400` |

### 3-4. 반응형 기준

v2 CSS에는 미디어 쿼리가 하나도 없다. 명세에 있는 수치는 두 개뿐이다.

| 브레이크포인트 (제안 토큰) | 값 | 명세 근거 | 바뀌는 것 |
|---|---|---|---|
| `bp.sm` | **768px 미만** | §5-1-0-1 "상태: 좁은 화면" (제안) | 헤더 검색창 → 돋보기 아이콘 버튼. 누르면 검색창이 로고 자리까지 헤더 한 줄을 차지하고 제안 목록은 헤더 아래 전체 폭 · 사용자 표시는 이름 숨김(아바타만) **(제안)** · 본문 좌우 거터 24 → 16 **(제안)** · 2단 이상 그리드 1열 · 표 → 가로 스크롤 |
| `bp.md` | **960px 미만** | §5-1-10 와이어프레임 "모바일 웹 · 폭 960px 미만" · v1 `@media screen and (max-width:960px)` | AD-01 좁은 브라우저 상태: 표 가로 스크롤 + **첫 열(회원) · 마지막 열(처리) sticky 고정** · 정정 패널 순차 전환 · 관리자 탭 가로 스크롤 · 대시보드 KPI 2×2. 회원 화면도 3-3의 2단 그리드를 여기서 1열로 |
| 데스크톱 | 960px 이상 | — | 목업 그대로 |

**지켜야 할 고정 규칙**

- **드로어 동작은 모든 폭에서 같다** (§4-3 · §5-1-10 · 기능명세서 10장 · 인수인계 3장 "확정"). 폭에 따라 사이드바로 펼치거나 하단 탭으로 바꾸지 않는다. 폭만 `min(300px, 100vw - 56px)` **(제안)**.
- v1 인수인계 6장의 함정: 반응형 쿼리를 `@media screen and (...)`로 한정해야 인쇄에 새지 않는다. 웹 앱에서 인쇄 요구는 없지만 같은 원칙으로 둔다 **(제안)**.
- TM-05 표는 768 미만에서 **팀원 1명 = 카드 1장**으로 바꾼다 — §5-1-5 "앱 차이"와 앱 A-02를 모바일 웹에도 적용 **(추측)**. AC-01 표는 날짜 · 인증일 2열 + 내역 한 줄 아래로 (§5-1-21 앱 차이 · 추측).
- PR-01 히트맵은 768 미만에서 가로 스크롤 + **처음 위치를 오른쪽 끝(최근)으로** (§5-1-9 앱 차이 · 끝 위치는 제안).
- 스트립 큰 칸 크기는 `clamp(36px, (컨테이너 폭 - 6×7px) / 7, 54px)` **(제안)** — 7칸이 한 줄을 넘지 않게.

---

## 4. 컴포넌트 인벤토리

### 4-0. 전체 목록

| # | 컴포넌트 (제안 이름) | 변형 | 쓰이는 화면 | 목업 v2 | 명세 근거 |
|---|---|---|---|---|---|
| 1 | `AppHeader` | 회원용 / 인증 화면용(로고만) | 전 화면 | W-02 등 · W-01 | §4-3 · §5-1-0-1 |
| 2 | `HeaderSearch` | 닫힘 / 입력 중 / 1자 안내 / 좁은 화면 | 회원 웹 전 화면 | W-02 · W-04 (1자 · 좁은 화면 없음) | §5-1-0-1 · E-61~E-63 |
| 3 | `NavDrawer` | 일반 회원 / 관리자(관리자 그룹 추가) | 전 화면 | W-03 (관리자 그룹 없음) | §4-1 · §4-3 |
| 4 | `WeekStrip` | 크기 32 / 46 / 54 · 범례 유무 | AU-01(장식) · CM-01 · AC-01 | W-01 · W-02 · W-06 | §5-1-3 ② · §5-1-21 ② |
| 5 | `MiniStrip` | 표 셀용 12px | TM-05 · AC-01 표 | W-09 · W-06 | §5-1-5 ⑥ |
| 6 | `GrassHeatmap` | 12개월(53주) | PR-01 | W-14 | §5-1-9 ⑦ |
| 7 | `StatusBadge` | 26종 (4-7) | 다수 | 일부 | §5-1-5 · §5-1-9 ⑩ · §5-1-22 ③ 등 |
| 8 | `Pill` · `Tag` · `CategoryChip` · `TeamTag` · `CountBadge` | 4-8 | 다수 | 있음 | |
| 9 | `WarningGauge` | 0~3 · 벌칙 대상 | CM-01 · AC-02 | W-02 · W-07 (3단계 없음) | §5-1-3 ④ · §5-1-22 ① |
| 10 | `BigStat` · `KpiCard` | 크기 3 · KPI 강조색 | CM-01 · AC-01 · AC-02 · PR-01 · AD-01 | 있음 | |
| 11 | `Card` · `NoticeBox` · `StatusBanner` · `DangerZone` | 4-11 | 다수 | 배너 없음 | §5-1-3 ⑥ |
| 12 | `DataTable` · `RowList` · `PostListItem` | 행 강조 · 정렬 · sticky | 다수 | 있음 | |
| 13 | `SegmentedTabs` · `AdminTabs` | 결과 수 표시 | BD-01 · BD-04 · AD-01 | W-05 · W-11 · W-13 · W-15 | §5-1-6 ① · §5-1-10 ② |
| 14 | 폼: `Field` · `TextInput` · `Textarea` · `Select` · `TagInput` · `SearchInput` · `RadioCard` · `Switch` · `Checkbox` · `FileInput` | 4-14 | 다수 | 체크박스 · 파일 없음 | |
| 15 | `Button` · `IconButton` · `TextButton` | 변형 6 · 크기 5 · 상태 5 | 다수 | 있음 | |
| 16 | `EmptyState` | CTA 유무 | §5-4-9 전 목록 | **없음** (v1) | §5-4-9 |
| 17 | `Skeleton` | 카드 3개 · 행 · 패널 | 전 화면 로딩 | **없음** (v1) | E-54 |
| 18 | `Toast` | 성공 · 실패 · 중립 · 동작 버튼 | 다수 | **없음** (v1) | §5-2-8 표시 위치 2 |
| 19 | `ConfirmDialog` | 단순 확인형 · 영향 미리보기형 × 기본 · 위험 | 되돌릴 수 없는 행동 전부 | **없음** (v1 화면 9-7) | §5-2-8 표시 위치 3 · §5-1-10 공통 요소 |
| 20 | `FullPageState` | 권한 없음 · 없음 · 서버 오류 · 네트워크 · 삭제된 글 · 거절 · 승인 대기 | CM-02 · AU-03 · E-09/31/51/52/53 | **없음** (앱 A-08이 시각 참고) | §5-1-12 · §5-2-8 표준형 |
| 21 | `LoadMore` · `Pagination` | | BD-01 · NT-01 · PR-01 · AD-01 | W-11 · W-14 · W-15 | E-57 · Q-06 |
| 22 | `Avatar` | 이미지 · 이니셜 · 기본 아이콘 · 크기 3 | 다수 | 있음 | §5-1-9 ① |
| 23 | `Icon` · `Logo` · `Kbd` · `TextLink` · `Tooltip` · `Spinner` | | | 툴팁 · 스피너 없음 | E-25 · §5-1-11 |

#### 4-0-1. 목업 없는 화면 — 컴포넌트 조합표 (0장 2번의 "목업 없음" 목록)

> 재실행 보완 (2026-10-02). v2에 없는 화면 10개와 AD-01 탭 4개를 **새 컴포넌트 없이** 4-1~4-23 조합으로 만든다. ①②…는 각 화면 절 구성요소 표의 번호이고, 폭은 3-2 배정을 따른다. AD-01 ②-1(경고 복구 · 벌칙)은 W-16, 대시보드는 W-15에 있어 여기서 뺐다.

| 화면 (§) | 폭 · 셸 | 조합 (구성요소 → 컴포넌트) | 상태 · 로딩 · 빈 상태 | 모달 · 토스트 · 오류 | 주의 |
|---|---|---|---|---|---|
| AU-02 로그인 처리중 (§5-1-11) | 화면 중앙 · 헤더 없음 | ① `Spinner` + "로그인하는 중이에요" `text.body.lg` · ② 실패 = `FullPageState` 축약형 + `Button primary` [로그인으로] | 처리중 / 실패. 3초 넘게 머물면 ②로 바꾼다 (§5-1-11 제안) | E-04 → AU-01로 돌아가 `Toast` + [다시 시도] (4-18) | **`Spinner`를 쓰는 유일한 화면** (4-17 · 4-23) |
| AU-03 승인 대기 (§5-1-2) | 960 가운데 정렬 · 인증 화면용 헤더(로고만, C-02) | ① `FullPageState` 아이콘 타일 `clock` **(제안)** · ② 제목 21/800 · ③ 보조 14 `text.tertiary` · ④ "@{githubLogin} 으로 신청했어요" 13.5 `text.secondary` · ⑤ `Button primary xl` 폭 400 (AU-01 로그인 버튼과 같은 폭) · ⑥ "로그아웃" | 기본 / 확인중(⑤ 비활성 + "확인 중...") / 승인됨(→ CM-01) / 거절(E-02: 같은 틀에 아이콘 `x` + E-02 문구, ⑤ 숨김 **(추측)**) | ⑦ `Toast` 중립 "아직 승인되지 않았어요." · E-51은 `Toast` + 버튼 복귀 | ⑥은 명세상 "텍스트 링크"지만 토큰 폐기라는 **동작**이라 `<button>` `TextButton`으로 만든다 **(제안)** |
| CM-02 에러 · 404 (§5-1-12) | 960 · 로그인 상태면 헤더 유지 | 4-20 `FullPageState` 4상태(404 · 서버 오류 · 권한 없음 · 네트워크) 그대로 | — | — | 상태 코드 · 스택 · GraphQL 메시지 노출 금지 (§5-1-12) |
| TM-02 팀 생성 (§5-1-13) | 700 | `PageHeader` · ① `Field` + `TextInput` (1~20자, 제안) · ② `Field` + `Textarea` (선택 · 100자 · **sans 14** — 회원 장문 글이 아니라서, 제안) · ③ `RadioCard` 2개 (공개 기본 / 비공개, 보조 줄 = §5-2-4 차이 한 줄) · ④ `Button primary` "팀 만들기" | 입력 / 생성중("만드는 중...") / **생성 완료**: 폼 자리를 ⑤ `Card`로 바꾼다 — 초대코드(W-10 TM-06 ①의 23/800/+.14em 표시 재사용) + `Button outline sm` [복사] + `NoticeBox` warning 변형 "이 코드는 다시 발급할 수 없어요. 꼭 저장해 주세요." + ⑥ `Button primary` "팀 보러 가기" | `Toast` "복사했어요." · EX-TM02-01 인라인 "팀 이름을 입력해 주세요." | 생성 완료 상태의 이탈 경고(`beforeunload` · 이탈 확인 모달) 강도는 **Q-01 결론에 달렸다.** B안(다시 볼 수 없음)이면 필수 |
| TM-03 팀 참가 (§5-1-14) | 700 | `PageHeader` · ① `TextInput` + ② `Button primary lg`(46, 입력 옆 — TM-06 아이디 초대와 같은 배치) · ③ `Field` 오류 · ④ `TextLink` "받은 초대 보기" → TM-04 | 입력 / 확인중("확인 중...") / 실패(③) | E-10 인라인 · E-11 인라인 + [팀 보러 가기] · E-12 인라인(**남은 기간 · 추방 사실 노출 금지**) · 성공 `Toast` "팀에 참가했어요." | placeholder "초대코드를 입력하세요"는 "~해 주세요"로 통일 (R-09) |
| TM-04 받은 초대 (§5-1-15) | 960 | `PageHeader` · ① `Card` 목록 (팀 이름 `text.title.section` + "{팀장} 님이 초대했어요" + 날짜 `text.meta`) · 카드 오른쪽 ③ `Button outline sm` [거절] · ② `Button primary sm` [수락] (주 동작을 오른쪽에 — C-20 원칙, 제안) | `Skeleton` 카드 3개 (E-54) · ④ `EmptyState` "받은 초대가 없어요." (CTA 없음) | `Toast` "팀에 참가했어요." / "거절했어요." · E-17 · E-18은 `Toast` + 카드 제거 **(제안)** · 거절은 §5-2-8 확인 대상이 아니라 모달 없음 | **비공개 팀이어도 실제 팀 이름을 보여준다** (§5-1-15 ①) — 아래 "비공개 팀 이름" 규칙의 예외 |
| TM-08 개인 면제 요청 (§5-1-17) | 700 | `PageHeader` · ① 폼용 `Select` (팀원 + 본인) · ② 폼용 `Select` (`M/D ~ M/D`) · ③ `Textarea` **sans 14 · 높이 76** (관리자에게 보내는 사유 — W-15 사유 입력과 같은 규칙, 제안) · ④ `Button primary` "면제 요청하기" · ⑤ `RowList` "{대상} · {주차}" + `StatusBadge` `exemptionReq.*` + 거절이면 아래 줄 "사유: {관리자 입력}" `text.meta` | ⑥ `EmptyState` "요청한 면제가 없어요." + [면제 요청하기] (→ ①로 포커스) | `Toast` "요청을 보냈어요." · E-47 · E-44는 ② 아래 인라인 **(제안)** | 그 팀 팀장 전용 — 가드 실패 시 E-09 |
| NT-01 공지 목록 (§5-1-18) | 960 | `PageHeader` "공지사항" · ①② `RowList` (W-02 · W-04 CM-01 공지 행과 같은 모양: 고정은 `pin` 아이콘 `color.pin`, 제목, 오른쪽 날짜) · ③ `LoadMore` | `Skeleton` 행 · ④ `EmptyState` 한 줄형 "등록된 공지가 없어요." | E-57 끝이면 "여기까지예요." | 📌 이모지 금지 → `pin` 아이콘 (R-17) · 행 전체를 `<a>`로 |
| NT-02 공지 상세 (§5-1-19) | 700 | ① "고정" 배지 = `status.outline` 묶음 + `pin` 아이콘만 `color.pin` **(제안 — amber 채움을 쓰면 "유효" 경고 배지와 섞인다)** · ② 제목 `text.title.post` · ③ 작성일 `text.meta` · ④ 본문 = BD-03 본문 스타일(`text.article` serif 16/1.95) 재사용 + `white-space: pre-line` **(제안)** | 기본만. 댓글 영역 없음 | E-53 → `FullPageState` "찾는 내용이 없어요. 삭제됐을 수 있어요." + [뒤로] | 잔디 인정 규칙 공지의 6행 규칙(§5-1-19)은 본문 텍스트로 담긴다 — 본문 입력이 평문이라 표 서식을 쓸 수 없다 **(추측)** |
| PR-02 프로필 수정 (§5-1-20) | 700 | ① `Avatar` 88 (사진 → 기본 아이콘, 4-22) · ② `FileInput` (`Button outline` "사진 바꾸기", `accept` jpg · png · webp) · ③ `TextButton` "기본 이미지로 되돌리기" (사진 있을 때만) · ⑤ `Button ghost` [취소] · ④ `Button primary` [저장] | 기본 / 업로드중("저장 중...") | `Toast` "저장했어요." · E-56 인라인(② 아래) · E-55 실패 `Toast` + 기존 이미지 유지 · ⑤ 변경이 있으면 `ConfirmDialog` 선택형 — E-26 틀을 빌린 "바꾼 사진이 저장되지 않아요. 나갈까요?" **(제안 문구)** | 업로드는 REST multipart 어댑터 (9장) · 닉네임 · GitHub 아이디는 수정 불가라 입력칸으로 그리지 않는다 |
| AD-01 ②-2 가입 승인 `members` | 1120 · 공통 골격(머리 + `AdminTabs`) | ⑤ 툴바: `SearchInput` 40 ("이름 · GitHub 아이디") + 툴바 `Select` (승인 대기 / 거절 / 전체) + 건수 `text.meta` · ⑥ `DataTable`: 회원(`Avatar sm` + 닉네임 + `TextLink` "@{githubLogin}" + `ExternalLink` 아이콘 + sr "새 탭에서 열림") · 신청 `M/D HH:mm` · 상태 `member.pending` / `member.rejected` · 처리 ⑦ `Button primary xs` [승인] · ⑧ `Button danger-outline xs` [거절] 또는 `Button outline xs` [승인 대기로] | `Skeleton` 패널 · `EmptyState` "승인 대기 중인 회원이 없어요." | [거절] → `ConfirmDialog` 단순 확인형, **tone 기본** (되돌릴 수 있어서, 제안 · C-25) · `Toast` "승인했어요." · 탭 `CountBadge` −1 | 팀 소속 · 활동 이력 열 금지 (②-2 인용문) · 페이지 이동은 C-10 |
| AD-01 ②-3 면제 관리 `exemptions` | 1120 | `SectionHeader` 2개. ⑤ 면제 기간 `DataTable` ("M/D ~ M/D" · 사유 · 행 `TextButton` [수정] · 위험 tone [삭제]) + `TableFootnote` "전체 회원에게 적용돼요." **(제안 문구)** · ⑥ 등록 툴바 (`Select` 주 + `TextInput` 사유 + `Button primary` [등록]) · ⑦ 개인 면제 요청 `RowList` "{요청 팀장} → {대상 회원} · {주차}" + 사유 + [승인] `primary xs` · [거절] `danger-outline xs` | `EmptyState` "면제 기간과 대기 중인 요청이 없어요." + [면제 기간 등록] | 과거 주간 등록 → **영향 미리보기형** (E-45) · [삭제] → 단순 확인형 · ⑦ [거절] → 단순 확인형 본문에 `Textarea`(sans) 1개를 넣은 **사유 입력형** (E-48, 4-19에 없는 변형 — 제안) | ⑦에 **팀 이름 금지** (②-3) · E-44 안내는 `NoticeBox` info |
| AD-01 ②-4 공지 관리 `notices` | 1120 | ⑤ `Button primary` [공지 작성] (머리 오른쪽) · ⑥ `RowList` (`pin` 아이콘 + 제목 + 날짜 + `TextButton` [수정] · 위험 tone [삭제] + 고정 토글 `Button outline xs` `aria-pressed`) · ⑦ 에디터 패널 (목록 자리 교체): `TextInput` 제목 · `Textarea` 본문 (NT-02 표시와 같은 serif, 제안) · `Checkbox` "상단 고정" · [취소] `ghost` · [저장] `primary` | `EmptyState` "등록된 공지가 없어요." + [공지 작성] | [삭제] → 단순 확인형 danger · 저장 `Toast` "저장했어요." **(추측)** · EX-AD01-02 잔디 인정 규칙 공지는 [삭제] 비활성 + 옆 문구 "이 공지는 판정 기준 안내라 삭제할 수 없어요." **(제안 — 비활성 사유를 밝히는 4-15 규칙)** | 고정 해제에 확인 모달을 띄울지 설계서 안에서 갈린다 → C-25 |
| AD-01 ②-5 게시물 관리 `posts` | 1120 | ⑤ 툴바: `SearchInput` ("제목 · 내용 · 작성자") + 툴바 `Select` (글 + 댓글 / 글만 / 댓글만) · ⑥ `DataTable`: 종류 `CategoryChip` ("글" / "댓글" — W-10 팀 글 관리와 같은 칩) · 제목 (링크 → BD-03) · 작성자 · 날짜 · ⑦ `Button danger-outline xs` [삭제] | `EmptyState` "관리할 게시물이 없어요." | [삭제] → 단순 확인형 danger · `Toast` "삭제했어요." | **팀 열 금지 · `TeamTag` 렌더링 금지** (②-5 — 비공개 팀 이름이 새는 경로) |

**조합 규칙**

| 규칙 | 내용 | 근거 |
|---|---|---|
| 조회 실패 vs 동작 실패 | 화면 데이터 **조회**가 네트워크로 실패하면 본문을 `FullPageState`로 바꾸고 헤더 · 드로어는 남긴다. 버튼 **동작**(수락 · 저장 · 확인)이 실패하면 `Toast` + 버튼 복귀 + **입력값 유지** | E-51 "입력 중이던 내용은 유지" · AU-03 E-51 "토스트, 버튼 복귀" · 4-20 **(추측)** |
| 확인 모달 tone | 되돌릴 수 있는 행동(가입 거절 · 고정 해제)은 기본 tone, 데이터가 사라지는 행동만 danger tone | ②-2 "거절은 되돌릴 수 있다" · 4-19 **(제안)** |
| 비공개 팀 이름 | 프로필 · 게시글 맥락에서는 **열람자와 무관하게** 숨긴다 (게시글 `TeamTag` 미렌더링 · 프로필 경고 카테고리는 "비공개 팀"). 팀 화면 밖에서 실제 이름이 나오는 곳은 **TM-04 초대 카드(초대받은 당사자)** 와 **AD-01 ②-1** 두 곳뿐이다 | §5-2-4 "열람자를 구분하지 않고 무조건" · §5-1-15 ① · ②-1 인용문 |
| 새 컴포넌트 없음 | 위 14개는 4-1~4-23만으로 만든다. 더 필요한 것은 `ConfirmDialog` 사유 입력 슬롯 하나다 | 인수인계 "화면을 새로 만들거나 화면 ID를 새로 발급하지 않는다" |

---

### 4-1. `AppHeader`

| 부분 | 시각 (v2) | 동작 · 상태 | 근거 |
|---|---|---|---|
| ☰ | `IconButton` 34×34 · 아이콘 20 · hover `bg.subtle` | 클릭 → 드로어. `aria-expanded` · `aria-controls` | §5-1-0-1 ① |
| 로고 | 2×2 마크(8px 칸 · gap 2 · r2 · 색 `grass.3 / grass.1 / grass.1 / grass.3`) + "잔디로그" 17/800/-.03em | 링크 → CM-01 | ② |
| 검색창 | 4-2 | | ③ |
| 세로선 | 1×24 `border.default` · `aria-hidden` | | §4-3 |
| 사용자 | `Avatar sm(28)` + 닉네임 13.5 `text.secondary` · gap 9 | 클릭 → PR-01 **(제안 — §5-1-0-1 ④에도 제안으로 적힘)** | ④ |
| 인증 화면용 | 로고만. ☰ · 검색 · 사용자 없음 | | W-01 · 8장 C-02 |

### 4-2. `HeaderSearch` (§5-1-0-1)

| 상태 | 시각 (v2) | 동작 |
|---|---|---|
| 닫힘 | 34 높이 · 폭 288 · 테두리 `border.control` r8 · 돋보기 16 + `kbd "/"` + "를 눌러 글 검색" 13.5 · hover 테두리 `border.controlHover` | 클릭 또는 `/` → 입력 중 |
| 입력 중 | 폭 470 · 테두리 `brand.primary` + `shadow.focusRing` · 오른쪽 `kbd "Esc"` · 본문 `overlay.dim` (헤더는 가리지 않음) | ↑↓ 이동 · Enter 실행 · Esc · 바깥 클릭 → 닫힘(입력 비움) |
| 제안 팝업 | 헤더 아래 8px · 폭 470 · r12 · `shadow.popover` · 그룹 제목 11.5/700 `text.tertiary` · 행 9/10 패딩 r8 14px · **선택 줄 `bg.selected` + 오른쪽 ↵ kbd** · 푸터 `bg.subtle` 12px "↑↓ 이동 · Enter 검색 · 제목 · 내용 · 태그를 찾아요. 팀과 회원은 찾지 않아요." | 3줄 고정: 트러블슈팅 검색 / 개발일지 검색 / #태그 모아보기. **BD-01 개발일지 탭을 보던 중이면 둘째 줄이 기본 선택** |
| 1자 안내 (E-61) | **목업 없음** → 팝업 자리에 안내 한 줄 "2자 이상 입력해 주세요." **(제안: 팝업과 같은 상자, 행 1개)** | Enter 무시 |
| 50자 (E-63) | 입력 차단 + 같은 자리 안내 **(제안)** | |
| 좁은 화면 (<768) | **목업 없음** → 돋보기 `IconButton` → 헤더 전체 폭 입력 · 팝업 전체 폭 | §5-1-0-1 (제안) |

서버 요청 없음 — 팝업은 입력 문자열로만 만든다(인수인계 09-30). **컴포넌트가 API 레이어를 import하지 않는다.** Enter 결과는 라우팅(`/posts?type=&q=` · `/posts?tag=`)뿐이다.

### 4-3. `NavDrawer`

| 부분 | 시각 (v2 W-03) | 비고 |
|---|---|---|
| 머리 | 높이 58 · 로고 + 닫기 X(`IconButton`) · 아래 테두리 | |
| 대메뉴 행 | 높이 40 · 좌우 12 · r9 · 아이콘 18 + 14.5/600 · gap 12 | 아이콘: 홈 `home` · 내 활동 `grid` · 팀 `users` · 게시판 `file` · 공지사항 `mega` · 프로필 `user` · 관리자 `shield` **(관리자 아이콘은 제안 — W-14 [관리자 메뉴] 버튼과 통일)** |
| 대메뉴 활성 | `bg.selected` + `brand.primary` 글자 | W-03은 "홈" 활성만 보여준다 |
| 서브메뉴 | 왼쪽 21 들여쓰기 + 세로선 1px `border.default` + 안쪽 16 · 행 34 · 13.5 `text.secondary` | |
| 서브메뉴 활성 | **목업 없음** → `text.primary` 600 + 상위 대메뉴 글자 `brand.primary` **(제안)** — 인수인계 3장 "현재 서브메뉴가 강조되고 그 대메뉴가 함께 밝아진다" | |
| 숫자 배지 | 20px 빨간 원 · 흰 11/700 (받은 초대 2) | 관리자 서브메뉴 대기 건수에도 같은 배지 (§5-1-10 ②) |
| 바닥 | 위 테두리 · 18/22 패딩 · "로그아웃" 14/600 | |
| 본문 넘침 | v2는 `overflow:hidden`이라 W-03에서 "프로필" 그룹이 잘린다 | **세로 스크롤 필수** (7장 D-05) |

메뉴 항목 (§4-1 · W-03): 홈 / 내 활동(주간 활동 · 내 경고 · 벌칙) / 팀(내 팀 목록 · 팀 만들기 · 팀 참가 · 받은 초대) / 게시판(트러블슈팅 · 개발일지) / 공지사항(공지 목록) / 프로필(내 프로필) / **관리자(관리자만 · 6개 — v2 W-03에 없음, 8장 C-08)**.

### 4-4. `WeekStrip` — 주간 진행 스트립 (시그니처)

**한 칸에 겹치는 4개 층**

| 층 | 표현 (v2) | 값 | 판정 의미 |
|---|---|---|---|
| ① 잔디 단계 | 칸 배경 `grass.0`~`grass.4` · r6 | GitHub 기여 단계 0~4 | 잔디 1칸 이상이면 인증 근거 |
| ② 기록글 | 오른쪽 위 직각삼각형 `color.record`(파랑). 크기 = 칸 × 0.3 (46→14 · 54→16 · 32→10) | 그날 기록글 있음 | 인증 근거 |
| ③ 인증일 | 칸 아래 요일 라벨이 `text.primary` 700으로 굵어지고, 그 아래 22×3.5 r3 `neutral.inverse` 밑줄 | ① 또는 ② | **인증일 1일** |
| ④ 날짜 상태 | 오늘 = `shadow.todayRing`(2px 진한 안쪽 테두리) / 미래 = 투명 배경 + 1.5px 점선 `strip.futureBorder` / 지난 날 = 그대로 | | 미래 칸은 ①②③을 그리지 않는다 |

| 변형 | 칸 크기 | 범례 | 쓰인 곳 |
|---|---|---|---|
| 장식 | 32 (모서리 10) | 없음 | AU-01 로그인 (W-01) — **실제 데이터 아님, `aria-hidden` (제안)** |
| 기본 | 46 | 있음 — "■ 잔디 · ◥ 기록글 · ▬ 인증일" 12.5 `text.secondary` (범례 칸 12) | CM-01 ② (W-02) |
| 큰 | 54 | 없음 | AC-01 ② (W-06) |

칸 사이 7 · 칸-라벨 6. 요일 라벨 12.5/500 `text.tertiary`.

**데이터 계약 (제안)** — 목 API와 실제 API가 같은 모양을 내도록 컴포넌트 props를 먼저 고정한다.

```ts
type StripDay = {
  date: string;              // 'YYYY-MM-DD' (KST)
  state: 'past' | 'today' | 'future';
  grassLevel: 0 | 1 | 2 | 3 | 4 | null; // null = 단계 모름 (지난 주차, 아래 주의)
  grassCount: number | null;
  hasRecord: boolean;
  verified: boolean;         // 서버 값을 그대로 쓴다. 화면에서 다시 계산하지 않는다
};
```

> **주의 — 지난 주차는 잔디 단계를 모른다.** DB `judgment_day`는 `has_grass` 불리언만 저장한다(DB명세서 1-8). 잔디 캐시는 26시간 TTL이라 지난 주 칸 수를 복원할 수 없다. 그런데 목업 W-06은 지난 주를 보여줄 수 있는 같은 화면에 "■■■ 3칸"을 그린다. 지난 주차 열람 시 `grassLevel: null`이면 **`grass.3` 단색 + "잔디 있음"** 으로 그린다 **(제안)** — 8장 C-14.

### 4-5. `MiniStrip`

12px 칸 · 간격 3 · r3 · 모서리 6 · 미래 점선 1px · 오늘 테두리 없음(목업). TM-05 표 "인증일" 칸(W-09)에서 `MiniStrip + "{n}일"` 15/700.
AC-01 날짜별 표의 "GitHub 잔디" 칸(W-06)은 **칸 수만큼 같은 단계 사각형을 나열** + "3칸" 12 `text.tertiary`. 1칸일 때 v2는 `mstrip` 래퍼가 빠져 원형으로 깨져 있다(7장 D-03) — 항상 같은 컴포넌트로 그린다.

### 4-6. `GrassHeatmap`

| 항목 | 값 (v2 W-14) |
|---|---|
| 배치 | CSS grid · 7행 · 열 방향 흐름 · 53열(12개월) |
| 칸 | 11.6px · 간격 3.2 · r2.5 · `grass.0`~`4` |
| 컨테이너 | `Card` 패딩 18 · 오른쪽 위 "오늘 오전 6시 기준" (§5-2-6 필수 병기) |
| 범례 | **v2 없음.** v1은 "적음 □□□□□ 많음" 범례가 있었다 → 다시 넣는다 **(제안)** |
| 상호작용 | 없음(목업). 칸 hover · 포커스 시 "9월 29일 · 기여 3회" 툴팁 **(제안)** |
| 데이터 | GitHub `contributionCalendar`의 단계 → 0~4 **(추측)** |

### 4-7. `StatusBadge` — 전수 (DB enum → UI 라벨)

시각 공통 (v2 `.pill`): 높이 24 · 좌우 9 · r6 · 12.5/600 · 아이콘 12px(획 2.4) · gap 4. **색 + 아이콘 + 라벨 3개를 항상 함께 쓴다** (v1 디자인 시스템 원칙 · 인수인계 4장 "3중 표기").

| 키 (제안) | 라벨 | 색 묶음 | 아이콘 (v2) | 목업 | 쓰는 화면 · 명세 | 데이터 근거 |
|---|---|---|---|---|---|---|
| `judgment.pass` | 통과 | `status.pass` | check | W-06 · W-09 · W-14 · W-15 | AC-01 ⑤ · TM-05 ⑥ · PR-01 ⑩ · AD-01 ⑦ | `weekly_judgment.status = PASS` · TM-05 이번 주는 **계산값** |
| `judgment.fail` | 미달 | `status.fail` | x | W-06 · W-15 | AC-01 ⑤ · AD-01 ⑦ · TM-05(주가 끝난 뒤만) | `FAIL` |
| `judgment.failWarned` | 미달 (경고) | `status.fail` | x | W-14 | PR-01 ⑩ | `FAIL` (PR-01 맥락) |
| `judgment.exempt` | 면제 | `status.exempt` | half(반원) | W-06 · W-14 | AC-01 ⑤ · PR-01 ⑩ | `EXEMPT` + `skip_reason ∈ {EXEMPTION_PERIOD, PERSONAL_EXEMPTION}` |
| `judgment.firstWeek` | 첫 참가 | `status.neutral` | minus | W-06 · W-15 | AC-01 ⑤ "제외 중 첫 참가 주는 '첫 참가'" | `EXCLUDED` + `FIRST_WEEK` |
| `judgment.excluded` | 제외 | `status.neutral` | **목업 없음** → `circle-dashed` **(제안)** | — | PR-01 ⑩ · TM-05 "제외" (제안) | `EXCLUDED` + `NO_TEAM` |
| `judgment.hold` | 보류 | `status.warning` **(제안)** | **v2 없음** (v1 ⏸) → `pause` **(제안)** | — | AD-01 ⑦⑧ — **"아직"과 배지를 공유하지 않는다** (§5-1-10 ②-0) | `HOLD` + `API_ERROR` |
| `judgment.holdRelogin` | 재로그인 필요 | `status.warning` | `user-x` **(제안)** | — | AD-01 E-08 | `HOLD` + `IDENTITY_MISMATCH` |
| `week.pending` | 아직 | `status.neutral` | ring(작은 원) | W-09 | TM-05 ⑥ · TM-01 ⑧ | **계산값** (DB 없음) |
| `week.inProgress` | 진행 중 | `status.neutral` | clock | W-14 | PR-01 ⑩ · AC-01 ② (W-06엔 없음, 8장 C-05) | **계산값** (이번 주) |
| `day.verified` | 1일 | `status.pass` | check | W-06 | AC-01 ② 인증일 칸 | `judgment_day` has_grass ∨ has_record |
| `day.record` | 기록글 n개 | `status.exempt` · **아이콘 없음** | — | W-06 | AC-01 ② | `has_record` — 아이콘 `file-text` 추가 **(제안)** |
| `warning.active` | 유효 | `status.warning` | alert(삼각) | W-07 | AC-02 ③ | 살아 있는 경고 · 차감 전 — **재계산 결과로만 알 수 있다 (추측, DB 1-9에 상태 컬럼 없음)** |
| `warning.deducted` | 차감됨 | `status.pass` | check | W-07 | AC-02 ③ | 재계산 결과 **(추측)** |
| `warning.fulfilled` | 이행 완료 | **목업 없음** | — | — | Q-13 A안일 때만 | `penalty_fulfillment` |
| `penalty` | 벌칙 대상 | `status.penalty`(채움) | alert | W-15 · W-16 | CM-01 ④ · PR-01 ⑧ · AC-02 ① · AD-01 · **TM-05엔 절대 표시 안 함** (§5-1-5) | 살아 있는 경고 3 |
| `post.notRecord` | 인증 미포함 | `status.neutral` · 500 · **아이콘 없음** | — | W-11 | BD-01 ⑩ · BD-03 E-25 · 툴팁 "필수 항목을 다 채우면 인증에 들어가요." | `post_index.is_record = false` — 아이콘 `circle-slash` 추가 **(제안)** |
| `row.correcting` | 정정 중 | 텍스트 `color.link` 600 + 행 `row.editing` | 없음 | W-15 | 인수인계 4-2 "색 단독 의존 제거" | UI 상태 |
| `member.pending` | 승인 대기 | `status.warning` **(제안)** | clock | — (v1 b-warn) | AD-01 ②-2 ⑥ | `member.status = PENDING` |
| `member.rejected` | 거절됨 | `status.fail` **(제안)** | x | — (v1 b-bad) | AD-01 ②-2 ⑥ | `REJECTED` |
| `invite.pending` | 대기 중 | 텍스트 12 `text.tertiary` | 없음 | W-10 | TM-06 ③ | `team_invitation.status = PENDING` |
| `exemptionReq.*` | 대기 중 / 승인됨 / 거절됨 · 사유 | neutral / pass / fail **(제안)** | clock / check / x | — | TM-08 ⑤ · AD-01 ②-3 ⑦ | `personal_exemption.status` |
| `team.leader` | 팀장 | `status.inverse` | 없음 | W-08 · W-10 | TM-01 ⑤ · TM-06 ④ | `team_member` 역할 |
| `team.public` | 공개 | `status.outline` | 없음 | W-08 · W-09 | TM-01 ⑥ · TM-05 ② | `team.is_public = true` |
| `team.private` | 비공개 | `status.outline` | lock | W-08 | TM-01 ⑥ | `is_public = false` |
| `notice.pinned` | 고정 | 핀 아이콘 `color.pin` (목록에선 아이콘만) | pin | W-02 | CM-01 ⑦ · NT-01 ① · NT-02 ① ("📌 고정" → 이모지 대신 아이콘, 6장 R-08) | `notice.is_pinned` |

> **구조 제안 — 매핑은 한 파일에 둔다.** `toBadge(domain, value, context)` 하나가 DB enum(`PASS` · `EXCLUDED`+`FIRST_WEEK` …)을 위 표의 키로 바꾼다. 같은 `FAIL`이 PR-01에서는 "미달 (경고)", AC-01에서는 "미달"인 것처럼 **맥락에 따라 라벨이 달라지므로** 화면 컴포넌트가 enum 문자열을 직접 비교하지 않게 한다. "아직 · 진행 중 · 통과(이번 주)"는 DB에 없는 계산값이라 **서버가 계산해 내려줄지, 프론트가 계산할지**를 API 담당과 먼저 정해야 한다(판정 규칙이 프론트에 복제되는 위험).

### 4-8. 작은 표시 요소

| 컴포넌트 | 시각 (v2) | 쓰인 곳 |
|---|---|---|
| `Tag` (해시태그) | 높이 26 · 좌우 10 · 알약 · `tag.bg` · 12.5/500 `text.secondary` · `#` 접두 | BD-01 ④⑦ · BD-03 ⑤ · BD-04 ⑦(입력 안에서는 × 포함) |
| `Tag` 선택됨 (필터) | **목업 없음** → `brand.primary` 배경 + 흰 글자 + `aria-pressed` **(제안 — v1 `.chip[aria-pressed]`와 같은 방식)** | BD-01 ④ "선택된 태그는 채움 표시" |
| `CategoryChip` | 높이 24 · 좌우 8 · 1px `border.default` · r6 · 흰 배경 · 12.5/500 | 글 종류(트러블슈팅 · 개발일지) · 팀 글 관리(글 · 댓글) — W-09 · W-10 · W-12 |
| `TeamTag` | `users` 아이콘 13 + 팀 이름 12.5/500 `text.secondary` (배경 없음) | BD-01 ⑧ · BD-03 ⑥ — **비공개 팀이면 렌더링 자체를 하지 않는다** |
| 소속 팀 칩 | `CategoryChip` 높이 32 · 좌우 12 · `users` 아이콘 | PR-01 ⑫ (W-14) — 공개 팀만 |
| `CountBadge` | 지름 19~20 · `count.bg` · 흰 11/700 | 드로어 받은 초대 · 관리자 탭 · 관리자 서브메뉴 |
| `Kbd` | 최소 19×20 · 1px `border.kbd` + 아래 2px · r5 · mono 11.5/500 | 헤더 검색 `/` · `Esc` · ↑ ↓ · Enter · ↵ |

### 4-9. `WarningGauge`

| 상태 | 시각 | 근거 |
|---|---|---|
| 0~2 | 26×7 막대 3개 · gap 4 · r4 · 켜짐 `gauge.on`(amber) / 꺼짐 `border.default` | v2 `.wbar` (W-02 · W-07) |
| 3 (벌칙 대상) | **v2 없음** → 3칸 모두 `danger.fg` + 옆에 `penalty` 배지 **(제안 — v1 `.warndots i.pen`이 빨강)** | CM-01 ④ "3이면 벌칙 대상 배지를 빨갛게" |
| 접근성 | 막대는 장식(`aria-hidden`). 옆 "1 / 3" 수치가 정보다 | |

§5-1-22 ①은 "3칸 게이지(● ○ ○)"로 적었고 v2는 막대다. 시각은 v2를 따른다(8장 C-06).

### 4-10. `BigStat` · `KpiCard`

| 컴포넌트 | 시각 | 쓰인 곳 |
|---|---|---|
| `BigStat` | 라벨 13.5/600 `text.secondary`(+ 선택 ✓ 아이콘 `brand.primary`) → 수치 `text.num.xl/lg/md` + 단위 `text.num.unit` → 선택 보조 문구 12 | CM-01 ②④ · AC-01 ④ · AC-02 ①② · PR-01 ⑧ |
| 조건 충족 ✓ | 라벨 옆 check 15 `brand.primary` — "기록글 ✓" | CM-01 ② · AC-01 ④ |
| `KpiCard` | `Card` 20/18 패딩 · 라벨 14 `text.secondary` 왼쪽 · 수치 23/700 오른쪽 · **벌칙 대상은 수치 `danger.fg`** | AD-01 ⑤ (W-15). **클릭 → 해당 탭** (§5-1-10 ⑤) → 링크 + hover 테두리 `border.strong` **(제안)** |

### 4-11. 컨테이너 · 안내

| 컴포넌트 | 시각 (v2) | 쓰인 곳 |
|---|---|---|
| `Card` | 흰 · 1px `border.default` · r12 · 패딩은 내용별(18 / 20·22 / 22·24) | 팀 카드(W-08, 오른쪽 chevron, **카드 전체가 링크**) · 판정 카드 · 히트맵 · 관련 커밋 · 공개 설정 |
| `NoticeBox` | r10 · 13/16 패딩 · 13.5 · 아이콘 + 문구 + 선택 오른쪽 버튼 · 변형 info / success / neutral | 받은 초대(W-02 · W-08, info) · 인증 안내(W-13 neutral / 앱 A-05 success) |
| `StatusBanner` | **v2 없음** → `NoticeBox` + `notice.warning` 변형 + 오른쪽 링크 버튼 **(제안)** | CM-01 ⑥ (E-39 → E-32 → E-36 → E-46 우선순위로 1개만) · PR-01 E-08/E-39 · BD-04 E-27 · 팀장 남의 글 수정 배너 · TM-05 E-32 |
| `DangerZone` | 1px `danger.border` · `danger.bg` · r12 · 18/20 · 제목 `danger.fg` 700 + 설명 + `Button danger-outline` | TM-06 ⑨ 팀 삭제 (W-10) |
| `Divider` | 1px `border.default` · 위아래 28 | BD-04 필수/선택 경계 (W-13) |
| `SectionHeader` | 제목 17/700 + 오른쪽 슬롯(기준 시각 12 · 건수 · "전체보기" 링크) · 아래 14 | 전 화면 `.sh` |
| `PageHeader` | 제목 26/800 + 부제 14 `text.tertiary` + 오른쪽 액션 | 전 화면 `.pt` |

### 4-12. 목록 · 표

| 컴포넌트 | 시각 (v2) | 상태 · 변형 | 쓰인 곳 |
|---|---|---|---|
| `DataTable` | `Card`와 같은 외곽(r12 · 흰 · 테두리) · th 12.5/600 `text.tertiary` `bg.subtle` 12/16 · td 13/16 · 행 구분 `border.subtle` · 14px | 본인 행 `bg.selected`(W-09) · 편집 중 행 `row.editing`(W-15) · 오른쪽 정렬 열 · 수치 열 tabular · 미래 행은 `colspan` 회색 문구(W-06) · **<960 가로 스크롤 + 첫 · 끝 열 sticky** | AC-01 · AC-02 · TM-05 · PR-01 · AD-01 |
| `TableFootnote` | 12.5 `text.tertiary` · 위 10 | | 표 아래 설명 전부 |
| `RowList` | 위 테두리 + 행마다 아래 테두리 · 최소 높이 52 · gap 12 · 오른쪽 메타 13 `text.tertiary` | 행 전체 링크(공지 · 팀 기록글 — TM-05 ⑦ "항목 클릭 → BD-03") / 행 안 버튼(팀원 · 초대 · 팀 글 · 댓글) / 정보만(팀별 경고 — PR-01 ⑨ 동작 없음) **(재실행 보완 — 빠진 칸)** | 공지(W-02) · 팀 기록글(W-09) · 팀원 · 초대 · 팀 글(W-10) · 댓글(W-12) · 팀별 경고(W-14) |
| `PostListItem` | 위아래 18 · 아래 테두리 · 제목 16/700 · 태그 줄 · "작성자(600) 날짜 댓글 n" 13 | 검색어 `mark` 형광(W-05) · 인증 미포함 배지 · **항목 전체가 링크** | BD-01 ⑥~⑩ |
| `CommentItem` | 아바타 32 + 이름 700 + 시각 12 + 본문 · 오른쪽 [수정] [삭제] | 인라인 편집 상태 **(목업 없음)** · 0건 "첫 댓글을 남겨보세요." | BD-03 ⑩⑪ |

### 4-13. 탭

| 컴포넌트 | 시각 (v2) | 상태 | 쓰인 곳 | 의미 |
|---|---|---|---|---|
| `SegmentedTabs` | 트랙 `bg.track` · 패딩 4 · r10 · 칸 높이 38 · 좌우 18 · r8 · 14.5/600 `text.secondary` | 선택 = 흰 배경 + `text.primary` + `shadow.raised` · **결과 수 표시**(선택 칸 `brand.primary`, 나머지 `text.tertiary`, W-05) | BD-01 ① · BD-04 ② | BD-01: URL `?type=` 동기화 · BD-04: **수정 모드에서 비활성** (§5-1-7 ②) |
| `AdminTabs` | 아래 1px 테두리 · 칸 높이 44 · 좌우 14 · 14.5/600 `text.tertiary` · 칸 옆 `CountBadge` | 선택 = `text.primary` + 아래 2px `text.primary` | AD-01 6개 (W-15 · W-16) | **라우트 링크** (`/admin`, `/admin/:tab`) — `aria-current="page"` |

### 4-14. 폼

| 컴포넌트 | 시각 (v2) | 상태 | 쓰인 곳 |
|---|---|---|---|
| `Field` | 라벨 14/700 · 아래 8 · 필수 `*` `color.required` · 선택 표시 "선택" / "최대 5개" 12.5/500 `text.tertiary` · 힌트 12.5 `text.tertiary` 위 7 · 필드 간 20 | 오류: **목업 없음** → 테두리 `danger.fg` + 링 `rgba(180,35,24,.14)` + 힌트 `danger.fg` "{항목}을 입력해 주세요." **(제안 — §5-2-8 "빨간 테두리" + v1 `.inp.err`)** | 전 폼 |
| `TextInput` | 높이 46 · r9 · 1px `border.default` · 좌우 14 · 14.5 · 왼쪽 아이콘 16~17 | focus = `brand.primary` 테두리 + `shadow.focusRing` **(제안)** · 강조값(`strong` 700, 글 제목) · 비활성 · 오류 | BD-04 ③ · TM-06 ② · TM-02 · TM-03 |
| `SearchInput` | `TextInput` + 돋보기 + 값이 있으면 오른쪽 × 버튼 · 값 600 | 값 있음 테두리 `border.strong`(W-05) | BD-01 ③ · 관리자 툴바(높이 40 · 13.5) |
| `Textarea` | 높이 120 · 12/14 패딩 · **serif 14.5/1.7** | 관리자 사유는 sans 14 · 높이 76 (W-15) | BD-04 ④⑤⑥ · AD-01 ⑩ · TM-08 ③ |
| `Select` | (a) 폼용: `TextInput` 모양 + 오른쪽 chevron-down (W-13 소속 팀) (b) 툴바용: 높이 40 · r9 · 좌우 12 · 13.5 `text.secondary` (W-15) | **줄바꿈 금지 + 최소 폭** (7장 D-04) | BD-04 ⑨ · AD-01 ⑥ · TM-08 ①② |
| `TagInput` | `TextInput` 안에 `Tag`(× 포함) 나열 + "태그 입력 후 Enter" | 5개 도달 시 입력 비활성 + "태그는 5개까지 달 수 있어요." (E-30) | BD-04 ⑦ |
| `RadioCard` | 1px `border.default` · r10 · 13/14 패딩 · 원 19px(1.5px `border.radio`) + 제목 700 + 보조 12 | 선택 = 2px `brand.primary` + `bg.selected` + 안쪽 점 10px `brand.primary` | AD-01 ⑩ 정정 결과 · TM-02 ③ 공개 설정 **(제안)** |
| `Switch` | 46×28 알약 · 켜짐 `grass.3` · 손잡이 22 흰 | 꺼짐: **목업 없음** → `strip.futureBorder` 계열 회색 **(제안)** · `role="switch"` | TM-06 ⑦ 공개 설정 |
| `Checkbox` | **목업 없음** **(제안: RadioCard 원을 r4 사각으로)** | | AD-01 ②-4 공지 "상단 고정" |
| `FileInput` | **목업 없음** **(제안: 88px 원형 미리보기 + `Button outline` "사진 바꾸기")** | 5MB · jpg/png/webp 선검증 (E-56) | PR-02 ② — **REST multipart 전용**이라 업로드 함수를 GraphQL 클라이언트와 분리한다 |

### 4-15. `Button`

**공통**: inline-flex · gap 7 · r9 · 1px 투명 테두리 · 14/700 · `white-space: nowrap`.

| 변형 (v2 클래스) | 기본 | hover | 비활성 | 쓰인 곳 |
|---|---|---|---|---|
| `primary` (`btn-p`) | `brand.primary` 배경 · 흰 글자 | `brand.primaryHover` | `brand.primaryDisabled` 배경 · `not-allowed` | 글쓰기 · 팀 만들기 · 등록 · 초대 · 이행 완료 · 정정하고 재계산 |
| `inverse` (`btn-dark`) | `neutral.inverse` · 흰 | **목업 없음** → 밝기 −8% **(제안)** | | **GitHub 로그인 한 곳만** (W-01) · 현재 페이지 번호 |
| `outline` (`btn-o`) | 흰 · 1px `border.default` · `text.primary` | 테두리 `border.strong` | **목업 없음** **(제안: 글자 `text.disabled`)** | 보러 가기 · 자세히 · 초대코드 입력 · 수정 · 복구 · 더 보기 · 팀장 넘기기 |
| `danger-outline` (`btn-dg`) | 흰 · 1px `danger.border` · `danger.fg` | **목업 없음** → `danger.bg` 배경 **(제안)** | | 추방 · 글 삭제 · 팀 삭제 |
| `danger` (채움) | **v2 없음** → `danger.fg` 배경 · 흰 **(제안 — v1 `.btn-d`)** | | | **위험 확인 모달의 실행 버튼만** (추방하기 · 팀 삭제 · 삭제) |
| `ghost` (`btn-t`) | 투명 · `text.primary` · 좌우 10 | **목업 없음** → `bg.subtle` **(제안)** | | 취소 (W-13 · W-15) |

| 크기 | 높이 · 좌우 · 글자 · r | 쓰인 곳 |
|---|---|---|
| `xs` | 28 · 10 · 12.5 · 7 | 팀원 행 액션 · 팀 글 [수정] · 페이지 번호 |
| `sm` | 32 · 12 · 13 · 8 | 자세히 · 보러 가기 · 복사 · 수정/삭제(글 상세) · 이행 완료 · 복구 |
| `md` (기본) | 40 · 16 · 14 · 9 | 대부분 |
| `lg` | 46 (입력칸 높이와 맞춤) | 아이디 초대 [초대] · 댓글 [등록] |
| `xl` | 52 · 24 · 14~16 | 로그인(폭 400 · 16px) · 글쓰기 [등록] |

| 상태 | 규칙 | 근거 |
|---|---|---|
| 로딩 | **비활성 + 라벨 교체** — "이동 중..." · "저장 중..." · "확인 중..." · "만드는 중..." · **스피너를 넣지 않는다** (v1 `.btn.load` 스피너는 버리고 E-54 "스피너 금지" 취지를 따름 · 추측) | AU-01 ③ · BD-04 ⑫ · AU-03 ⑤ · TM-02 ④ · TM-03 ② · PR-02 ④ |
| 비활성 사유 | 비활성 버튼은 왜 눌리지 않는지 라벨이나 옆 문구로 밝힌다 | v1 디자인 시스템 "버튼 · 상태" |
| 포커스 · 눌림 | 포커스 = 5-4 `:focus-visible` 링 (전 변형 공통, 바깥 2px `brand.primary`). 눌림(`:active`) = **v2 없음** → hover 색을 유지하고 별도 토큰을 두지 않는다 **(제안)** | v2 34행 · 재실행 보완 |
| 텍스트 액션 | v2는 "정정"(W-15) · 댓글 "수정 / 삭제"(W-12) · 보낸 초대 "취소"(W-10)를 `<span>`으로 그렸다 → **반드시 `<button>` `TextButton`**(기본 / 위험 tone) | 키보드 접근 (5장) |
| `IconButton` | 34×34 · r8 · 아이콘 20 · `text.secondary` · hover `bg.subtle` · **`aria-label` 필수** | ☰ · 닫기 X · 정정 패널 X |

### 4-16. `EmptyState` (v2 없음 · v1 구조)

가운데 정렬 · 위아래 44 · 아이콘(**이모지 금지** → lucide 아이콘 26px `text.disabled`) · 제목 14.5/700 · 설명 12.5 `text.tertiary` · 선택 CTA `Button sm`. 문구는 §5-4-9 표를 **그대로** 쓴다(최종 문구). 공지 · 댓글처럼 좁은 자리는 아이콘 없는 한 줄형 **(제안)**.

### 4-17. `Skeleton` (v2 없음 · v1 구조)

`bg.subtle` → `bg.track` 반짝임 1.3s · r6. 모양은 최종 레이아웃 그대로 — 목록은 **카드 3개**, 표는 행, 관리자는 패널(E-54 · §5-1-10). `prefers-reduced-motion`이면 반짝임 정지. **스피너는 AU-02 한 곳만** (§5-1-11 ①).

### 4-18. `Toast` (v2 없음 · v1 구조)

| 항목 | 값 |
|---|---|
| 시각 | `neutral.inverse` 배경 · 흰 13~14 · r10 · 10/15 패딩 · 앞 아이콘(성공 check `grass.2` / 실패 x `#F3A79F` / 중립 info) · `shadow.modal` **(v1 색을 v2 토큰으로 치환 · 제안)** |
| 위치 | 화면 아래 가운데 · 아래 24 **(제안)** — 헤더 검색 팝업 · 드로어와 겹치지 않게 |
| 시간 | **3초** (§5-2-8 표시 위치 2) · hover · 포커스 중엔 멈춤 **(제안)** |
| 동작 버튼 | 선택 1개 — "로그인이 취소됐어요." + [다시 시도] (E-04) · E-51 [다시 시도] |
| 접근성 | 성공 · 중립 `role="status"` (polite) · 실패 `role="alert"` |
| 문구 | "등록했어요." "수정했어요." "삭제했어요." "복사했어요." "초대를 보냈어요." "팀에 참가했어요." "거절했어요." "팀에서 나왔어요." "팀을 삭제했어요." "공개 설정을 바꿨어요." "저장했어요." "요청을 보냈어요." "승인했어요." "정정했어요." "처리했어요." "{n}명 처리했어요." "아직 승인되지 않았어요." "로그인에 실패했어요. 다시 시도해 주세요." "로그인이 만료됐어요. 다시 로그인해 주세요." "인터넷 연결을 확인해 주세요." (§5-1 각 화면 · §5-4) |

### 4-19. `ConfirmDialog` — 2종 (v2 없음 · v1 화면 9-7 + §5-1-10 공통 요소)

**화면마다 모달을 새로 만들지 않는다** (§5-1-10 공통 요소 · 인수인계 5-1 "ConfirmDialog를 하나로 통일").

| 변형 | 구성 | 쓰는 곳 |
|---|---|---|
| **단순 확인형** | 제목(16/700) + 무엇이 바뀌는지 한 문단(필요하면 `notice.warning` 박스) + [취소] [실행] | 가입 거절 · 공지 삭제 · 고정 해제 · 게시물 삭제 · 벌칙 이행 체크 · 추방 · 팀장 넘기기 · 팀 삭제 · 팀 나가기 · 글 삭제(+E-28 한 줄) · 댓글 삭제 · 전체 재시도 · 면제 기간 삭제 |
| **영향 미리보기형** | 제목 + **바뀌는 수치를 항목별로** "항목 · 전 → 후" 표 (예: 누적 경고 2회 → 3회 / 벌칙 대상 재진입 / 복구 후 카테고리 삭제된 팀) + [취소] [실행] | 판정 정정 · 소급 면제 · 경고 복구 (E-42 · E-43 · E-45 · E-49 · E-50 · E-58 · E-59) |
| tone `danger` | 실행 버튼 `danger`(채움) + 머리 위 3px `danger.fg` 선 (v1 `.modal.danger`) | 추방 · 팀 삭제 · 글/댓글/게시물 삭제 |
| 선택형 (같은 껍데기) | 버튼 두 개가 모두 진행 동작 | BD-04 ⑭ [더 쓰기] [그대로 올리기] · E-26 [계속 쓰기] [나가기] · BD-04 ② 종류 전환 확인 |
| 정보형 (같은 껍데기) | 본문만 + [닫기] **(제안)** | AU-01 ⑤ 잔디 인정 규칙 (비로그인이라 NT-02로 못 감) |

시각 (v1 → v2 토큰): 폭 420(미리보기형 500) · r16 · `shadow.modal` · 머리 16/18 · 본문 16/18 · 바닥 13/18 `bg.subtle` + 위 테두리 · 버튼 오른쪽 정렬 **[취소] 왼쪽 · [실행] 오른쪽** · 뒤 `overlay.scrim`.
동작: 열리면 포커스 이동(위험형은 [취소]에 · 제안), 포커스 가둠, Esc = 취소, 닫히면 연 버튼으로 포커스 복귀, 모달 안에서는 `/` 단축키 무효(E-62).

### 4-20. `FullPageState`

v2 웹에는 없고 **앱 A-08(관리자 기능 안내)이 유일한 시각 참고**다: 64px r16 아이콘 타일(`bg.iconTile`) + 제목 21/800 + 설명 14 `text.tertiary` + 버튼(primary 48) · 세로 중앙 **(추측 — 웹에도 같은 모양 적용)**.

| 상태 | 문구 (§5-2-8 표준형 · §5-1-12) | 버튼 | 헤더 |
|---|---|---|---|
| 권한 없음 (E-09) | "이 페이지에 들어올 권한이 없어요." | [홈으로] | 유지 |
| 없는 경로 (E-53) | "찾는 페이지가 없어요." / 리소스: "찾는 내용이 없어요. 삭제됐을 수 있어요." | [홈으로] / [뒤로] | 로그인 상태면 유지 |
| 서버 오류 (E-52) | "잠시 문제가 생겼어요. 조금 뒤에 다시 시도해 주세요." | [다시 시도] [홈으로] | 유지 |
| 네트워크 (E-51) | "인터넷 연결을 확인해 주세요." | [다시 시도] | **본문만 대체, 헤더 · 드로어 유지** (§4-4 · AD-01 E-51) |
| 삭제된 글 (E-31) | "삭제된 글이에요." | [목록으로] | 유지 · 댓글 영역 숨김 |
| 승인 대기 (AU-03) · 거절 (E-02) | §5-1-2 문구 | [승인됐는지 확인] · 로그아웃 링크 | 없음 |

### 4-21. `LoadMore` · `Pagination`

| 컴포넌트 | 시각 | 쓰인 곳 | 비고 |
|---|---|---|---|
| `LoadMore` | 가운데 `Button outline`(md 또는 sm) "더 보기" → 끝이면 텍스트 "여기까지예요." | BD-01 ⑪ (W-11) · PR-01 ⑪ (W-14) · NT-01 ③ · E-57 | 커서 기반 20개(제안 · Q-06) |
| `Pagination` | 34폭 `btn-xs` · 현재 `inverse` · 나머지 `outline` | AD-01 ⑦ (W-15) | **E-57 "더 보기"와 충돌** (8장 C-10) |

### 4-22. `Avatar`

| 형태 | 시각 | 쓰인 곳 |
|---|---|---|
| 이니셜 | 원 · 흰 700 이니셜 · `avatar.1~6` · 32(13px) / 28(12px) | 헤더 · 표 · 댓글 · 팀원 |
| 사진 | 원 · `object-fit: cover` | `member.profile_image_url`이 있을 때 (DB 1-1) |
| 기본 이미지 | 88 원 · `avatar.placeholder.bg` + `user` 아이콘 40(획 1.6) | PR-01 ① (W-14) · PR-02 ① |

목업은 **헤더에서는 이니셜 "한"(초록)**, **프로필에서는 기본 아이콘**으로 같은 사람을 다르게 그렸다. 우선순위를 **사진 → 이니셜 → (프로필 큰 자리만) 기본 아이콘**으로 통일한다 **(제안)**.

### 4-23. 아이콘 · 로고 · 기타

| 항목 | 내용 |
|---|---|
| 아이콘 세트 | lucide 계열 stroke 아이콘(v2 `PATHS` 주석 "lucide 계열"). 기본 16px · 획 2 · 배지 안 12px · 획 2.4. `lucide-react` 사용 **(제안)**. 매핑 **(추측)**: menu→Menu · x→X · search→Search · home→House · grid→Grid2x2Plus · users→Users · file→FileText · mega→Megaphone · user→User · chevL/R/D→ChevronLeft/Right/Down · pin→Pin · check→Check · alert→TriangleAlert · lock→Lock · copy→Copy · pencil→Pencil · ext→ExternalLink · info→Info · shield→ShieldCheck · clock→Clock · more→Ellipsis · minus→Minus · ring→Circle · half→반원 채움(직접 SVG) · hash→Hash · enter→CornerDownLeft |
| GitHub 마크 | 채움 SVG(v2 `GH`). lucide의 브랜드 아이콘은 쓰지 않는다 **(제안)** |
| 모든 장식 아이콘 | `aria-hidden="true"` (v2가 이미 그렇게 함) |
| `TextLink` | `color.link` · 밑줄 오프셋 3 · 13.5/500 — "전체보기" · "잔디 인정 규칙 보기" |
| `Tooltip` | **v2 없음** — "인증 미포함" 툴팁 (BD-01 ⑩) · 히트맵 칸 · 헤더 검색 `title` **(제안: 포커스로도 열리는 툴팁, `aria-describedby`)** |
| `Spinner` | AU-02 전용. 다른 곳에서 쓰지 않는다 |

---

## 5. 접근성

### 5-1. 대비 측정 (WCAG 2.1, 직접 계산)

| 조합 | 대비 | 판정 (텍스트 AA 4.5 · 비텍스트 3.0) | 조치 |
|---|---|---|---|
| `text.primary` / `bg.canvas` | 15.35 | 통과 | |
| `text.secondary` / `bg.canvas` | 8.50 | 통과 | |
| `text.tertiary` / `bg.canvas` · `bg.surface` · `bg.subtle` | 4.67 · 5.07 · 4.80 | 통과 (여유 적음) | 이보다 밝은 배경(`bg.track` 4.13)에는 쓰지 않는다 → W-05 "개발일지 **1**"은 `text.secondary`로 **(제안)** |
| **`text.disabled` `#98A29C` / 흰 (placeholder)** | **2.63** | **실패** | placeholder를 `text.tertiary`로 **(제안)** — 목업보다 진해짐 (의뢰인 질문) |
| 배지 5종 fg/bg (통과 · 미달 · 면제 · 유효 · 중립) | 5.70 · 5.75 · 6.76 · 5.47 · 7.97 | 통과 | |
| 흰 / `penalty` · `brand.primary` · `inverse` | 6.57 · 6.51 · 16.58 | 통과 | |
| 흰 / `brand.primaryDisabled` | 2.21 | 비활성은 예외 | 비활성 사유를 문구로 밝힌다 |
| `color.link` / `bg.canvas` | 7.31 | 통과 | |
| **입력 테두리 `border.default` / 흰** | **1.31** | **실패** (1.4.11 입력 경계) | 입력 · 셀렉트 · 라디오 · 스위치 테두리만 `#87928B`(3.22) **(제안)** — 카드 · 표 테두리는 장식이라 그대로 |
| 헤더 검색 테두리 `#C9D1CC` / 흰 | 1.56 | 실패 | 같음 |
| 라디오 원 `#9AA59E` / 흰 | 2.55 | 실패 | 같음 |
| 미래 점선 / `bg.canvas` | 1.49 | 실패 | 라벨 "아직 오지 않은 날"을 스크린리더 텍스트로 제공 (5-3) |
| 잔디 인접 단계 (h0/canvas 1.10 · h1/h0 1.16 · h2/h1 1.47 · h3/h2 1.72 · h4/h3 1.85) | — | 색 단독으론 구분 불가 | GitHub과 같은 한계. **숫자를 텍스트로 병행**(표 "3칸" · 툴팁 · sr 텍스트) |
| **기록글 모서리 파랑 / `grass.4`** · `grass.3` | **1.22** · 2.26 | **실패** | 진한 잔디 날에 기록글 표시가 사라진다(W-01 토요일). 모서리에 1.5px 흰 경계선을 두르거나 모서리 크기를 키운다 **(제안)** |
| 오늘 테두리 `inverse` / `grass.0` | 13.87 | 통과 | |
| 경고 게이지 켜짐 / 꺼짐 | 4.70 | 통과 | |
| 아바타 6색 / 흰 글자 | 4.71 ~ 6.00 | 통과 | |

### 5-2. 색만으로 상태를 전하지 않는지

| 요소 | v2 현황 | 조치 |
|---|---|---|
| 판정 · 경고 배지 | 색 + 아이콘 + 라벨 | 유지 |
| "인증 미포함" · "기록글 n개" · 보류(미도입) | 색 + 라벨 (아이콘 없음) | 아이콘 추가 **(제안, 4-7)** |
| "정정 중" 행 | 색 행 + 파란 텍스트 라벨 | 라벨이 있어 통과. 행에 `aria-current="true"` **(제안)** |
| 본인 행 (TM-05) | 초록 행 + "나" 라벨 | 통과 |
| KPI 벌칙 대상 빨간 수치 | 색 + "벌칙 대상" 라벨 | 통과 |
| 주간 스트립 | 단계는 색만, 기록글은 색 모서리만, 인증일은 밑줄 + 굵기 | **칸마다 sr 텍스트 필수** (5-3) |
| 히트맵 | 색만 | 표 요약 sr 텍스트 + 툴팁 |
| 위험 버튼 | 빨강 + 라벨("추방" · "삭제") | 통과 |
| 필수 항목 `*` | 빨강 별표 | `aria-required` + sr "필수" |

### 5-3. 스크린리더 텍스트 (제안)

| 컴포넌트 | 읽히는 문장 예 |
|---|---|
| `WeekStrip` | 목록으로 두고 칸마다 "9월 29일 화요일, 잔디 1칸, 기록글 있음, 인증됨" / "10월 1일 목요일, 오늘, 활동 없음" / "10월 2일 금요일, 아직 오지 않은 날". 범례는 `aria-hidden` |
| `MiniStrip` (표 칸) | 칸들은 `aria-hidden`, 셀에 "인증 2일" 텍스트만 |
| `GrassHeatmap` | 그림 역할 + "최근 12개월 기여 그래프, 오늘 오전 6시 기준" + 칸별 툴팁 |
| `WarningGauge` | 막대 `aria-hidden`, "경고 1회, 3회 중" |
| 헤더 검색 닫힘 | "슬래시 키로 글 검색" (§5-1-0-1 접근성 · 제안) |
| `CountBadge` | "받은 초대 2건" |

### 5-4. 포커스 · 키보드

| 항목 | 규칙 |
|---|---|
| 포커스 링 | `:focus-visible { outline: 2px solid brand.primary; outline-offset: 2px }` — v2 34행 그대로. 바깥 오프셋이라 초록 버튼 위에서도 배경과 대비 5.99 |
| 입력 포커스 | 테두리 `brand.primary` + `shadow.focusRing` (헤더 검색 열림과 같은 규칙 · 제안) |
| `/` 단축키 | 문서 어디서든 → 헤더 검색 열기. **`input` · `textarea` · `select` · `contenteditable` · 열린 모달 안 · IME 조합 중(`isComposing`)에는 무시** (E-62 · §5-1-0-1). 검색 열림 중 Esc = 닫기 |
| 헤더 검색 | 래퍼 `role="search"`. 입력은 combobox 패턴(`aria-expanded` · `aria-controls` · `aria-activedescendant`), 팝업 `role="listbox"` · 줄 `role="option"` · ↑↓ 순환 · Enter 실행 (§5-1-0-1 접근성) |
| 드로어 | `role="dialog"` `aria-modal` · 열 때 첫 메뉴로 포커스 · 포커스 가둠 · Esc · 스크림 클릭 닫기 · 닫으면 ☰로 복귀 · 현재 화면 `aria-current="page"` |
| 모달 | 4-19 동작 |
| 탭 | BD-01 · BD-04 세그먼트 = `tablist`/`tab` + ←→ 이동 **(제안)** · 관리자 탭 = 라우트 링크 `nav` |
| 카드 · 행 클릭 | TM-01 팀 카드 · BD-01 글 · 공지 행은 `<a>`로 감싼다 (div onClick 금지) |
| 텍스트 액션 | "정정" · "수정" · "삭제" · "취소"는 `<button>` (v2는 `<span>`) |
| 라디오 카드 · 스위치 | 네이티브 `input[type=radio]` 감싸기 · 스위치 `role="switch"` `aria-checked` |
| 표 | `<th scope>` · 정렬 열 없음 · sticky 열도 DOM 순서 유지 |
| 터치 대상 | 최소 28px(`btn-xs`)로 WCAG 2.2 AA(24px) 충족 · 모바일 768 미만에서는 행 액션 `btn-sm`(32)으로 키운다 **(제안)** |
| 언어 · 모션 | `<html lang="ko">` · `prefers-reduced-motion` 존중 |

---

## 6. 문구 규칙(§5-2-8) 점검

### 6-1. 목업 v2 문구 중 규칙과 충돌하거나 주의할 것

| # | 화면 | 목업 문구 | 걸리는 규칙 | 판단 · 조치 |
|---|---|---|---|---|
| R-01 | W-10 TM-06 ① | "다시 발급할 수 없어요. 이 영역을 보여줄지는 정해지지 않았어요 (미결 Q-01)." | 용어(내부 문서 번호 노출) | **둘째 문장은 목업 메모다. 구현 금지.** 첫 문장만 쓴다 |
| R-02 | W-05 BD-01 | "세 번째 글은 제목에는 없고 태그 #Redis로 찾은 결과예요." | — | 목업 설명용 주석. **구현 금지** |
| R-03 | W-07 AC-02 ⑤ | "경고가 3회에 도달하면 벌칙 대상이 되고, 그 뒤로는 연속 통과해도 차감되지 않아요." (47자) | 길이 40자 | §5-1-22 ⑤ 원문 그대로라 **명세 자체가 규칙을 넘는다.** 두 문장 분리 제안: "경고가 3회가 되면 벌칙 대상이 돼요. 그 뒤로는 연속 통과해도 차감되지 않아요." **(제안)** |
| R-04 | W-07 표 주석 | "팀에서 추방되거나 팀이 삭제되면 그 카테고리가 빠지고, 남은 카테고리가 없으면 경고가 사라져요." (53자) | 길이 | 목업 전용 문구. 분리 **(제안)** |
| R-05 | W-09 TM-05 주석 | "“아직”은 조건을 채우지 못했지만 주가 끝나지 않아 만회할 수 있다는 뜻이에요." (44자) | 길이 | 분리 **(제안)** |
| R-06 | W-14 PR-01 주석 | "경고 1개에 여러 팀이 함께 붙을 수 있어서, 팀별 합계는 누적 경고 수와 다를 수 있어요." (51자) | 길이 | 인수인계 3장 "이 사실을 문구로 밝힌다"는 확정. 분리 **(제안)** |
| R-07 | W-16 AD-01 주석 | "벌칙을 누구에게 통보할지 판단할 수 있도록, 이 화면에서만 비공개 팀 이름도 그대로 보여요." (51자) | 길이 | 분리 **(제안)** |
| R-08 | W-02 CM-01 ③ | "아직 통과 전이에요. 1일 더 인증하면 통과!" | 말투(해요체) | 둘째 문장이 감탄형 명사 종결. §5-1-3 ③ 원문이라 그대로 두되 기록해 둔다 |
| R-09 | W-12 BD-03 ⑫ | "댓글을 입력하세요" | 표준형 "{항목}을 입력해 주세요." | 같은 목업 W-13은 "배운 점을 적어 주세요". placeholder 어미를 "~해 주세요"로 통일 **(제안)**. §5-1-14 TM-03 "초대코드를 입력하세요"도 같은 건 |
| R-10 | W-13 BD-04 ⑩ | "필수 항목을 다 채우면 인증에 들어가요 (1 / 2)" | — | 규칙 위반은 아니나 "(1 / 2)" 진행 수는 §5-1-7 ⑩에 없다 → **(제안)** 표시로 채택 |

이모지 · 기술 용어(토큰 · 서버 · API · GraphQL) · 합쇼체는 v2 UI 문구에서 발견되지 않았다. 게시글 예시(W-11 "Flyway 체크섬 불일치로 서버가 안 뜨는 문제")는 회원이 쓴 콘텐츠라 규칙 대상이 아니다.

### 6-2. 화면설계서 쪽 문구가 §5-2-8을 어기는 것 (구현 시 그대로 옮기면 안 됨)

| # | 위치 | 원문 | 문제 | 해요체 안 **(제안)** |
|---|---|---|---|---|
| R-11 | §5-1-5 TM-05 ⑤ 와이어 · 표 | "인증일은 오늘 오전 6시 기준**입니다**" | 합쇼체 | 목업 W-09 "기준이에요"가 이미 맞다 → **목업을 따른다** |
| R-12 | E-42 | "다시 벌칙 대상이 **됩니다**. 복구할까요?" | 합쇼체 | "복구하면 다시 벌칙 대상이 돼요. 복구할까요?" (v1 모달 문구) |
| R-13 | E-43 | "'삭제된 팀'으로 표시**됩니다**." | 합쇼체 | "복구하면 '삭제된 팀'으로 보여요." |
| R-14 | E-45 | "이후 경고가 다시 계산**됩니다**. 진행할까요?" | 합쇼체 | "이후 경고를 다시 계산해요. 진행할까요?" |
| R-15 | E-49 · E-50 | "{n}개로 바**뀝니다**." · "빠**집니다**." | 합쇼체 | "경고가 {n}개에서 {n}개로 바뀌어요." · "벌칙 대상에서 빠져요." |
| R-16 | E-58 · E-59 | "경고 수는 그대로 **둡니다**." · "기록만 되살**립니다**." | 합쇼체 · 두 버전 불일치(§5-1-10 표 vs §5-4-7) | "기록만 고치고 경고 수는 그대로 둬요." · "기록만 되살리고 경고 수는 그대로 둬요." |
| R-17 | §5-1-19 NT-02 ① · §5-1-3 와이어 | "📌" | 이모지 금지 | v2처럼 `pin` SVG 아이콘 |
| R-18 | 목업 v1 빈 상태 | "🌱" "⚠" "✉" | 이모지 금지 | v1 구조를 가져올 때 아이콘으로 교체 |

---

## 7. 목업 결함 — 구현 시 따라 하지 말 것

| # | 화면 | 결함 | 올바른 구현 |
|---|---|---|---|
| D-01 | W-10 | "(미결 Q-01)" 메모가 UI 문구에 섞임 | R-01 |
| D-02 | W-05 | 하단 설명 주석 | R-02 |
| D-03 | W-06 9/29 행 | 잔디 1칸이 `mstrip` 래퍼 없이 그려져 **원형**이 되고 "1칸"이 줄바꿈됨 | `MiniStrip` 하나로 1칸도 사각형 |
| D-04 | W-15 툴바 | 결과 필터 "전체"가 "전/체"로, 주차 셀렉트가 두 줄로 꺾임 (폭 92 · 186 고정) | `white-space: nowrap` + `min-width: max-content` |
| D-05 | W-03 | 드로어 본문 `overflow:hidden` → 프로필 그룹이 잘림 | `overflow-y: auto` |
| D-06 | W-10 · W-12 · W-15 | 보낸 초대 [취소] · 댓글 [수정] [삭제] · 표 [정정]이 `<span>` | `<button>` (5-4) |
| D-07 | W-10 | 스위치가 `<span>`이며 꺼짐 상태 없음 | `role="switch"` + 꺼짐 색 (4-14) |
| D-08 | 전 화면 | 입력 요소가 `<div class="inp">` 모형 | 실제 `<input>` · `<textarea>` · `<select>` |
| D-09 | 문서 크롬 | `--outer` 배경 · 1280 프레임 · 둥근 모서리 · 그림자 | 목업 액자다. 앱 `body`는 `bg.canvas` 전체 폭 |

---

## 8. 문서 간 충돌 · 모순

| # | 항목 | 화면설계서 v0.7 (9/30) | 목업 v2 (9/29) | 최신 · 따르는 쪽 판단 |
|---|---|---|---|---|
| C-01 | 드로어 "홈" 항목 | §4-3 "홈 진입: 웹 = 로고 클릭(**GNB에 '홈' 항목 없음**)" ↔ 같은 §4-3 "대메뉴(**홈** · 내 활동 …)" · §4-1-1 대메뉴 7개에 홈 포함 | W-03 드로어 첫 항목 "홈" | **화면설계서 내부 모순.** 인수인계 3장 확정 규칙("대메뉴 7개: 홈 / …")과 v2가 일치 → **홈 포함** |
| C-02 | AU 계열 헤더 | §4-3 · §5-1-0-1 "AU 계열에는 **헤더 자체가 없다**" | W-01 로고만 있는 상단 바 | v0.7이 하루 늦지만 v2 W-01 설명은 "검색창을 두지 않는다"고만 적음. 로고 바는 네비 기능이 없어 취지(=GNB 없음)와 충돌하지 않는다고 보고 **W-01을 따른다 (추측)** |
| C-03 | 홈 주간 진행 표현 | CM-01 ② "요일 7칸 **점** 표시(●●●○○○○, 인증된 날 채움)" | 잔디 5단계 칸 + 기록글 모서리 + 인증일 밑줄 + 오늘/미래 | v0.7은 CM-01을 고치지 않았다 → **v2 (추측)**. TM-05 ⑥도 같은 건 |
| C-04 | 홈 ④⑤ 배치 | 와이어: ④ 내 경고 · ⑤ 받은 초대 **가로 2단 카드**, ⑥ 배너 자리 | 오른쪽 274px 열에 ④ 위 · ⑤ 아래, 카드 테두리 없음 | 시각은 v2. ⑥ 배너는 v2에 없으므로 4-11 `StatusBanner`로 보충 |
| C-05 | AC-01 "진행 중" 배지 | ② "이번 주는 **'진행 중' 배지** + 오늘 오전 6시 기준 병기" | W-06에 진행 중 배지 없음(기준 시각만), 대신 큰 스트립 추가 | 둘 다 넣는다 — 배지는 명세 구성요소, 스트립은 v2 시각 |
| C-06 | AC-02 경고 게이지 · 제목 | ① "누적 경고 [1회]" + "3칸 게이지 ● ○ ○" · 와이어 제목 "경고 · 벌칙" | "1 / 3회" + 막대 3개 · 제목 "내 경고 · 벌칙" | v2 (드로어 라벨 "내 경고 · 벌칙"과 일치 · 인수인계 4-2 "라벨 통일") |
| C-07 | TM-05 보조 메뉴 라벨 | 와이어 "[팀 관리] [면제 요청]" ↔ 같은 절 표 "팀원 관리 / 개인 면제 요청" | "팀장 전용 · 팀원 관리 · 개인 면제 요청" | **설계서 내부 모순.** 표 = v2 → 표를 따른다 |
| C-08 | **관리자 메뉴 위치** | §4-2 "관리자 레이아웃(**좌측 메뉴 + 우측 패널**)" · §5-1-10 ② "**☰ 드로어 안** 관리자 대메뉴 아래 서브메뉴 6개 + 숫자 배지" · 와이어 왼쪽 메뉴 열 · 인수인계 4장 "좁은 브라우저: 관리자 항목만 담은 가로 탭바 + [나가기]" | W-15 · W-16 본문 안 **가로 탭 6개 + 숫자 배지**, W-03 드로어에 **관리자 그룹 없음** | 세 갈래로 다르다. **의뢰인 확인 필요** (질문 1). 잠정안: 드로어에 관리자 그룹(확정 규칙 "대메뉴 7개") **+** 페이지 안 가로 탭(v2) 둘 다 **(제안)** |
| C-09 | 관리자 머리 | ① 옆 "2026년 9월 15일 월요일 · **이번 주 판정 완료**" | 날짜만 | 판정 완료 표시는 판정 실행 확인 취지(인수인계 4장 "문제 5") → 넣는다 **(추측)** |
| C-10 | 관리자 목록 페이지 이동 | E-57 "커서 20개 · [더 보기] · 여기까지예요" (AD-01 포함) · Q-06 미결 | W-15 번호 페이지 [1][2] | Q-06 결론 필요 (질문 3). 결론 전엔 `LoadMore`로 통일 **(제안)** |
| C-11 | 파란색 의미 겹침 | — | 파랑 = 기록글(스트립 모서리 · W-06 "기록글 1개") **이자** 면제 배지 **이자** 링크 · "정정 중" | 한 화면(W-06)에 "기록글 1개"(파랑)와 "면제"(파랑)가 함께 나온다. "기록글 n개"는 `status.neutral` + `file-text` 아이콘으로 바꾸고 파랑은 스트립 모서리에만 두는 안 **(제안)** |
| C-12 | 판정 정정 확인 방식 | §5-2-8 4원칙 "판정 정정 → **확인 다이얼로그**" · §5-1-10 공통 요소 "판정 정정 = **영향 미리보기형 모달**" | W-15 정정 패널 안에 이미 재계산 미리보기 + [정정하고 재계산] | 패널 + 모달이면 미리보기를 두 번 본다. **패널 자체를 영향 미리보기형으로 간주하고 추가 모달 없음 (추측)**. 소급 면제 · 경고 복구는 패널이 없으므로 모달 |
| C-13 | 정정 결과값 | ⑩ 라디오 "통과 / 미달 / 면제" | "미달(지금 결과) / 통과로 정정 / 면제로 정정" | 같은 3값을 현재 결과 + 바꿀 값으로 표현 → v2. "제외"는 Q-05 미결 |
| C-14 | 지난 주차 잔디 칸 수 | AC-01 ② "지난 주차는 판정 시점에 저장한 값(DB `judgment_day`)" | W-06 표 "■■■ 3칸" · 스트립 단계색 | DB 1-8 `judgment_day`는 `has_grass` **불리언만** 저장 → 지난 주 칸 수 · 단계 복원 불가. 4-4 `grassLevel: null` 처리 **(제안)** 또는 DB에 칸 수 컬럼 추가를 백엔드와 협의 |
| C-15 | TM-01 "미달 n명" | ⑧ "이번 주 통과 · **미달** · 아직" + "판정 전이므로 '미달'로 단정하지 않는다" ↔ TM-05 "미달 — 주가 끝나고 판정이 확정된 뒤에만" | W-08 "미달 0명" | **설계서 내부 모순.** 이번 주 미달은 정의상 항상 0이다. 질문 4 |
| C-16 | BD-04 ⑭ 버튼 순서 | §5-1-7 와이어 "[더 쓰기] [그대로 올리기]" ↔ E-24 "[그대로 올리기] [더 쓰기]" | 없음 | 설계서 내부 불일치. 모달 규칙(안전 왼쪽 · 진행 오른쪽)으로 **[더 쓰기] [그대로 올리기]** **(제안)** |
| C-17 | BD-04 ⑩ 위치 | 와이어: 소속 팀 ⑨ 아래, 버튼 바로 위 | W-13: 필수 항목 바로 아래, 구분선 위 | v2 (입력 직후 실시간 피드백이 자연스러움) |
| C-18 | BD-03 ⑧ 관련 커밋 | "링크 주소를 축약 표시 + ↗" | GitHub 아이콘 카드 "jandilog/server · a1b2c3d" | v2 (`{repo} · {sha 7자}`) |
| C-19 | BD-01 ⑨ 메타 구분자 | "{작성자} · {M/D} · 댓글 {n}" | 가운뎃점 없이 공백 | 사소. v2 시각 |
| C-20 | TM-01 ② 버튼 순서 | "[팀 만들기] [초대코드 입력]" | [초대코드 입력](outline) [팀 만들기](primary) | v2 (주 동작이 오른쪽 끝) |
| C-21 | PR-01 프로필 사진 vs 헤더 아바타 | ① 업로드 전 기본 이미지 | 헤더 = 이니셜 초록 원, 프로필 = 회색 기본 아이콘 | 4-22 우선순위로 통일 **(제안)** |
| C-22 | 목업 기준 문서 | README "어떻게 보이는가 = `잔디로그_목업_웹.pdf`(v1, 44p)" | 인수인계 09-29 "v2를 새로 만들었고 v1은 참고용" | README가 갱신되지 않았다. **v2 기준** |
| C-23 | 다크 모드 | 명세 언급 없음 | v1 있음 → v2 없음 | 질문 2 |
| C-24 | 버튼 로딩 표시 | E-54 "스피너 금지"(로딩 화면 규칙) · 각 화면 "버튼 비활성 + 라벨 교체" | v1 `.btn.load` 스피너 | 라벨 교체만 (4-15) |
| C-25 | 확인 모달 대상 (재실행 보완) | §5-1-10 ②-4 ⑥ "[고정] → **즉시 토글**" ↔ 같은 절 공통 요소 "단순 확인형: 가입 거절 · 공지 삭제 · **고정 해제** …". 또 ②-2 "**거절은 되돌릴 수 있다**" ↔ 공통 요소 머리 "**되돌릴 수 없는** 행동은 모두 같은 확인 모달". §5-2-8 표시 위치 3의 목록(추방 · 팀 삭제 · 글 삭제 · 팀장 위임 · 벌칙 이행 체크 · 판정 정정)에는 둘 다 없다 | 없음 (AD-01 공지 · 가입 승인 탭 목업 없음) | **설계서 내부 모순.** 잠정안: 고정 켜기 = 즉시, 고정 해제 · 가입 거절 = 단순 확인형 **기본 tone** — 두 문장을 모두 만족시킨다 **(추측)**. 팀이 정하면 되는 문제 |

---

## 9. 백엔드 연동을 고려한 디자인 시스템 구조 (제안)

| 원칙 | 내용 | 이유 |
|---|---|---|
| 표시 컴포넌트는 API를 모른다 | `components/ui/*`는 props만 받는다. GraphQL 훅 · 목 데이터 import 금지 | 목 API → Apollo로 바꿀 때 화면 · 디자인 시스템을 건드리지 않는다 |
| enum → UI 매핑 한 곳 | `toBadge()` · 라벨 · 아이콘 · 색 묶음을 `domain/presentation.ts` 하나에 (4-7) | 백엔드 enum 이름(`PASS` · `EXCLUDED`+`FIRST_WEEK`)이 확정 · 변경돼도 수정 지점이 하나 |
| 계산값의 출처를 props로 고정 | `WeekStrip`은 `verified`를 받기만 하고 계산하지 않는다 · "아직 / 진행 중"도 상태 키로 받는다 | 판정 규칙(인증일 = 잔디 ∨ 기록글)이 프론트에 복제되면 서버와 어긋난다 |
| 토큰을 TS 객체로도 내보내기 | `tokens.ts` → CSS 변수 생성 + 같은 객체를 앱(React Native)에서 import | 기능명세서 11장 "웹 먼저, 앱은 같은 GraphQL 재사용" — 색 · 배지 매핑도 재사용 |
| 업로드 분리 | `FileInput`은 `File`만 넘기고 업로드는 REST 어댑터가 맡는다 | 프로필 이미지만 REST multipart (§5-1-20) |
| 문구 상수화 | §5-4 최종 문구를 `copy.ts`로 · 6-2 해요체 수정안 반영 | 문구 규칙 점검을 한 파일에서 |

---

## 10. 남은 일 · 확인 필요

**팀이 정하면 되는 것 (이 문서의 제안)**: 2px 간격 스케일 · 모달 · 토스트 위치 · 보류 배지 색 · 기록글 배지 색 분리(C-11) · 정정 패널 추가 모달 생략(C-12) · 버튼 hover/비활성 미정의 변형 · 빈 상태 아이콘 · 768/960 화면별 동작.

**의뢰인 확인이 필요한 것**: 구조화 출력의 `questionsForUser` 참조 — 관리자 메뉴 위치(C-08), 다크 모드(C-23), 페이지 이동 방식 Q-06(C-10), TM-01 이번 주 "미달" 의미(C-15), 접근성 목표 수준(5-1 입력 테두리 · placeholder 색 변경 여부), 벌칙 이행 전 경고 표시 Q-13(배지 `warning.fulfilled` 존재 여부).

---

## 11. 재실행 보완 메모 (2026-10-02)

지난 실행 결과를 원본과 다시 대조했다. 본문은 고치지 않고 보완 · 정정만 여기에 모은다.

| # | 위치 | 내용 | 조치 |
|---|---|---|---|
| V-01 | 0장 2번 "4-0 표의 '목업 없음' 열" | 4-0은 컴포넌트 단위 표라 그런 열이 없었다 | **4-0-1 조합표를 새로 넣었다** (화면 10개 + AD-01 탭 4개) |
| V-02 | 0장 1번 "`:root` 23개 변수" | 실제 v2 `:root`(12~25행)는 **색 28개**(`--h0`~`--h4` 5개 포함) **+ 폰트 3개 = 31개**다. 23은 2-1 표의 색 행 수(`--outer` 제외, h0~h4를 한 행으로)다. "하드코딩 색 22개"는 아바타 6색을 뺀 수이고, 넣으면 28개다 | 값 · 토큰 표(2-1 · 2-2)는 그대로 맞다. 개수 표현만 읽을 때 주의 |
| V-03 | 3-4 "v2 CSS에는 미디어 쿼리가 하나도 없다" | 정확히는 `@media print` 1개(264행, 목업 PDF 인쇄용)가 있고 **폭 기준 반응형 쿼리가 0개**다 | 결론(반응형 규칙 없음)은 같다 |
| V-04 | 1장 "v2 = 9/29" | 인수인계 09-30 항목에서 **W-04를 9/30에 한 번 더 고쳤다** (제안 목록의 건수 삭제 — "서버에 묻지 않는다" 결정과 맞춤). W-04 이미지에 건수가 없음을 직접 확인했다 | 헤더 검색(전 화면 헤더의 검색창 · W-04 · W-05)은 화면설계서 v0.7 §5-1-0-1과 **같은 날 맞춘 것**이라 "v0.7이 하루 늦다"는 판단을 적용하지 않는다. 각 화면 본문은 9/29 시각안 그대로 |
| V-05 | 5-1 대비 표 | 22개 조합을 WCAG 2.1 상대 휘도 공식으로 다시 계산했다 — **전부 일치** | 없음 |
| V-06 | 2-4 그림자 | v2에서 표에 없는 rgba 2개: `0 8px 20px rgba(30,107,60,.35)`(앱 FAB) · `0 16px 40px rgba(20,30,25,.16)`(폰 프레임) | 웹 토큰 대상 아님. 앱을 만들 때 `shadow.fab`으로 **(제안)** |
| V-07 | 4-15 버튼 상태 | 포커스 · 눌림 행이 없었다 | 행 추가 |
| V-08 | 8장 | 확인 모달 대상이 §5-1-10 안에서 갈린다 | C-25 추가 |
| V-09 | 4-12 `RowList` 행 | 칸 하나가 빠져 "쓰인 곳"이 "상태 · 변형" 열로 밀려 렌더링됐다 | 빠진 칸만 채웠다 (나머지 칸은 그대로) |
| V-10 | 10장 의뢰인 질문 | 구조화 출력에 3개를 더 올렸다: **Q-01** 초대코드 재확인 가능 여부(4-0-1 TM-02 이탈 경고 강도) · **C-14** 지난 주 잔디 칸 수를 DB에 저장할지(DB명세서 변경) · **§5-4 최종 문구** 중 §5-2-8 위반 문구(6-1 R-03 · 6-2 R-12~R-16)를 고쳐도 되는지 | 셋 다 명세 원본을 바꾸는 결정이라 팀이 정할 수 없다 |
