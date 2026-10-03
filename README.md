# 잔디로그 웹 (GLog-Front)

동아리 회원이 매주 GitHub 잔디와 기록글로 활동을 인증하고, 팀 · 경고 · 벌칙 · 면제를 관리하는 **잔디로그의 웹 프론트엔드**입니다.

- React 19 · TypeScript · React Router 7 · Apollo Client 4 (GraphQL) · CSS Modules · Vite
- 백엔드(Spring for GraphQL)가 아직 없어서 **목(mock) API로 전 화면이 동작**합니다. MSW가 네트워크 계층에서 `/graphql`과 업로드 REST를 가로채고, `docs/api/schema.graphql`을 그대로 실행합니다.
- 실제 백엔드로 바꿀 때 **화면 코드는 고치지 않습니다.** 환경 변수와 계약 파일만 바뀝니다.

## 빠르게 시작하기

Node 24 · npm 11이 필요합니다(`.nvmrc`).

```bash
npm ci
npm run dev          # http://localhost:5173 — 기본 목 모드
```

1. 로그인 화면에서 **페르소나**(목 모드에서만 보이는 선택 상자)를 고르고 로그인합니다. GitHub에 가지 않습니다.
2. 왼쪽 아래 **DevToolbar**(목 모드 전용 알약 버튼)로 시나리오를 바꿉니다.
   - 장애: 없음 · 네트워크 끊김 · 서버 오류 · 느림(3초), 특정 연산 한 번만 실패
   - 기준 시각: 기본(2026-10-01 목 10:00 KST) · 일요일 23:40 · 월요일 판정 전/후
   - 잔디 조회 상태 강제(정상 · 실패 · 아이디 변경), 데이터 초기화
3. 목 데이터는 메모리에만 있어서 **새로고침하면 시드로 돌아갑니다.**

| 페르소나 | 회원 | 상태 | 확인할 수 있는 것 |
|---|---|---|---|
| `member` (기본) | 한동관 | 활동 중 · A팀 팀장 · 관리자 | 목업 W-02 ~ W-16 전부 |
| `plain` | 김철수 | 활동 중 · A팀 팀원 | 권한 없는 화면 · 남의 글 |
| `noteam` | 서연 | 팀 없음 · 받은 초대 1 | 팀 미소속 홈 |
| `penalty` | 박지훈 | 경고 3 · 벌칙 대상 | 벌칙 배너 · 경고 화면 |
| `pending` | 정다은 | 승인 대기 | 승인 대기 화면 |
| `rejected` | 최민재 | 거절 | 거절 안내 |

## 스크립트

| 명령 | 하는 일 |
|---|---|
| `npm run dev` | 개발 서버 (목 모드면 MSW 워커가 먼저 뜹니다) |
| `npm run build` | 타입 검사 + 프로덕션 빌드 (`dist/`) |
| `npm run preview` | 빌드 결과 미리 보기 |
| `npm run typecheck` | `tsc -b --noEmit` |
| `npm run lint` | ESLint (화면 → 목 · fetch · Apollo 링크 직접 사용 금지 규칙 포함) |
| `npm test` · `npm run test:watch` | Vitest (jsdom + Testing Library + msw/node) |
| `npm run test:tz` | 테스트를 `UTC` · `Asia/Seoul` · `America/Los_Angeles`에서 세 번 |
| `npm run codegen` | `docs/api/schema.graphql` + 연산 문서 → `src/gql/` 타입 생성 |
| `npm run codegen:check` | 생성 타입이 최신인지 확인 (CI) |
| `npm run check` | typecheck + lint + test + codegen:check |

CI(`.github/workflows/ci.yml`)는 PR마다 `npm ci` → typecheck → lint → test:tz → codegen:check → build(목 모드)를 돌립니다.

## 환경 변수

`.env.example`을 `.env.local`로 복사해서 씁니다. 모두 선택입니다.

| 변수 | 값 | 기본 | 설명 |
|---|---|---|---|
| `VITE_API_MODE` | `mock` \| `real` | `mock` | `mock`이면 MSW가 API를 흉내 냅니다 |
| `VITE_API_ORIGIN` | 예: `https://api.example.com` | 빈 값(같은 출처) | `real` 모드의 백엔드 출처. 끝에 `/` 없이 |
| `VITE_MOCK_NOW` | ISO 시각 | `2026-10-01T10:00:00+09:00` | 목 기준 시각 |
| `VITE_MOCK_LATENCY` | ms | `250` | 목 응답 지연 |

## 폴더 한눈에 보기

```
src/
  app/        진입점 · 프로바이더 · 라우터(라우트 트리 전체)
  layouts/    RootLayout · BareLayout · AppLayout(헤더 · 헤더 검색 · 드로어) · AdminLayout
  guards/     로그인 · 승인 · 관리자 · 팀장 가드
  features/   화면 영역별 코드 (auth · home · activity · teams · posts · notices · profile · admin · errors)
  session/    세션(me · clock) 컨텍스트
  domain/     웹 · 앱이 같이 쓸 수 있는 순수 TS (배지 · 문구 · 배너 규칙)
  shared/     공통 UI(ui/) · Apollo · 오류 정규화(api/) · 경로 · 날짜 · 검증(lib/) · 토큰 CSS(styles/)
  gql/        codegen 결과 (손대지 않음, 커밋함)
  mocks/      MSW 핸들러 · 목 스키마 실행 · 시드 · DevToolbar
  test/       테스트 준비(setup) · 하네스(renderRoute · renderWithProviders)
```

자세한 구조 · 의존 방향 · 규칙은 [`docs/02-design.md`](docs/02-design.md)에 있습니다.

## 실제 백엔드로 바꾸기

설계서 11장 체크리스트입니다.

1. `docs/api/schema.graphql`을 백엔드 SDL로 교체하고 `npm run codegen`이 통과하는지 확인합니다. 실패하면 계약이 어긋난 것입니다.
2. `VITE_API_MODE=real`, `VITE_API_ORIGIN=<백엔드 출처>`로 빌드합니다. 이때는 MSW 워커와 DevToolbar를 불러오지 않습니다.
3. 백엔드 CORS에 프론트 출처를 허용하고, GitHub OAuth 콜백이 프론트 `/auth/callback?code=…`로 돌아오게 맞춥니다.
4. 프로필 사진 업로드 한도(5MB)를 Nginx 등 앞단에서도 맞춥니다.

## 테스트 쓰기

```tsx
import { screen } from '@testing-library/react';
import { renderRoute } from '@/test/render';

it('ACC-TM05-01 팀원이 현황판을 본다', async () => {
  renderRoute('/teams/1', { as: 'plain' });
  expect(await screen.findByRole('heading', { name: '사이드 프로젝트 A팀' })).toBeInTheDocument();
});
```

- `renderRoute(path, { as, now })`: 실제 라우트 트리 + Apollo + 세션 + 목 핸들러. `as` 기본 `member`, `null`이면 비로그인.
- `renderWithProviders(ui, { as })`: 컴포넌트 하나를 프로바이더 + 메모리 라우터 안에서.
- 테스트마다 localStorage와 목 DB가 초기화됩니다. 핸들러에 없는 요청은 실패합니다.
- 테스트 이름에 수용 기준 번호(`ACC-*`)를 적습니다.

## 문서

| 문서 | 내용 |
|---|---|
| [`docs/01-requirements.md`](docs/01-requirements.md) | 요구사항 정의서 — 범위 · 라우트 · 권한 · 수용 기준 |
| [`docs/02-design.md`](docs/02-design.md) | 설계서 — 기술 스택 · 폴더 · 데이터 계층 · 목 · 테스트 · 배포 |
| [`docs/03-implementation-contracts.md`](docs/03-implementation-contracts.md) | 구현 계약서 — 모듈별 export 이름과 시그니처 |
| [`docs/api/schema.graphql`](docs/api/schema.graphql) | API 계약(GraphQL SDL) — 목과 실서버의 공통 계약 |
| [`docs/analysis/`](docs/analysis/) | 분석 문서 A1 화면 · 라우트, A2 도메인 규칙, A3 API 계약, A4 디자인 시스템, A5 범위 · 위험 · 수용 기준 |
| [`docs/design/`](docs/design/) | 목업 v2 스크린샷과 참고 CSS · JS |
