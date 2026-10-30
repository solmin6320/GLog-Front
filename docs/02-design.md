# GLog-Front 설계서

> v1.0 · 2026-10-02 · 2단계(설계) 산출물
> 입력: `docs/01-requirements.md` · `docs/api/schema.graphql` v0.1 · 목업 v2 (`docs/design/mockup-v2/*.png`, 참고 코드 `docs/design/mockup-v2.reference.{css,js}`)
> 화면별 구성요소 · 문구 · 상태의 정본은 화면설계서 v0.7이다. 이 문서는 **코드를 어떻게 짜는지**만 정한다.

---

## 1. 기술 스택

| 영역 | 선택 | 버전 고정 |
|---|---|---|
| 언어 | TypeScript (strict) | `typescript@~5.9` |
| 빌드 | Vite + `@vitejs/plugin-react` | `vite@^7.3` · `@vitejs/plugin-react@^5` |
| UI | React | `react@^19.2` · `react-dom@^19.2` |
| 라우팅 | React Router 데이터 라우터 | `react-router@^7.18` |
| 데이터 | Apollo Client | `@apollo/client@^4` · `graphql@^16` · `rxjs@^7` |
| 계약 타입 | GraphQL Code Generator client-preset (+ 목용 `typescript` 플러그인) | `@graphql-codegen/cli@^7` · `@graphql-codegen/client-preset@^6` |
| 목 | MSW + 실행 가능한 SDL | `msw@^2` · `@graphql-tools/schema` |
| 스타일 | CSS Modules + 전역 토큰 CSS | (의존성 없음) |
| 글꼴 | Pretendard(npm 자체 호스팅) · Noto Serif KR(Google Fonts, 글 본문만) | `pretendard` |
| 테스트 | Vitest + jsdom + Testing Library + `msw/node` | `vitest@^4.1` |
| 린트 | ESLint flat config + typescript-eslint + react-hooks | `eslint@^9` |
| 런타임 | Node 24 · npm 11 | `.nvmrc`, `engines` |

### ADR

**ADR-01 최신 메이저 대신 검증된 조합.** `typescript@7`은 typescript-eslint가 지원하지 않는다(`<6.1`). `@vitejs/plugin-react@6`은 `vite@8`을 요구한다. 팀원이 자료를 찾기 쉬운 조합을 고르되, `npm audit`에 걸린 개발 도구(vitest 3 · codegen 5)는 패치된 메이저(vitest 4.1.11+ · codegen 7)로 올렸다. 설치 시점 `npm audit` 0건. 연동 단계 이후 한 번에 올린다.

**ADR-02 Apollo Client 4.** 명세가 Apollo를 정했다(기능명세서 FC). 3.x는 마지막 마이너가 4.x 이전 경고를 쏟아낸다. 새 프로젝트이므로 4를 쓴다. 훅은 `@apollo/client/react`에서 가져온다.

**ADR-03 목은 네트워크 계층(MSW) + 실행 가능한 SDL.** 목 서버가 `docs/api/schema.graphql`을 그대로 읽어 `makeExecutableSchema`로 실행한다. 목 리졸버가 계약과 다른 모양을 돌려주면 GraphQL 실행기가 바로 오류를 낸다. 화면 코드 · Apollo 설정은 목과 실서버에서 똑같다. 테스트도 같은 핸들러를 `msw/node`로 쓴다.

**ADR-04 CSS Modules + 토큰 변수.** 목업 v2가 순수 CSS 변수다. 1:1로 옮길 수 있고 런타임 비용이 없다. 앱(React Native)은 어차피 CSS를 못 쓰므로 공유 대상이 아니다. 앱이 재사용할 것은 `domain/`(라벨 · 규칙 표시)과 GraphQL 문서다.

**ADR-05 전역 상태 라이브러리 없음.** 서버 상태는 Apollo 캐시, 화면 상태는 URL, 세션은 React Context 하나. 폼은 제어 컴포넌트 + `shared/lib/validators.ts`.

**ADR-06 날짜 라이브러리 없음.** KST 계산은 `Intl.DateTimeFormat({ timeZone: 'Asia/Seoul' })`과 `YYYY-MM-DD` 문자열 산술로 한다. `new Date()`를 화면에서 직접 쓰지 않는다(5-3).

**ADR-07 생성 코드는 커밋한다.** `src/gql/`(codegen 결과)을 커밋한다. 빌드에 codegen이 필요 없고, 리뷰에서 계약 변화가 보인다. `npm run codegen:check`가 어긋남을 잡는다.

**ADR-08 라우트는 한 파일, 화면은 지연 로딩.** `src/app/router.tsx` 한 곳에 트리를 선언하고 각 화면을 `lazy`로 불러온다. 화면 파일 경로는 고정이다(9장) — 병렬 구현 때 라우터 충돌이 없다.

---

## 2. 폴더 구조

```
src/
  app/                    진입점 · 프로바이더 · 라우터
    main.tsx              목 모드면 MSW 워커를 먼저 켜고 렌더
    App.tsx               ApolloProvider · SessionProvider · ToastProvider · ConfirmProvider · RouterProvider
    router.tsx            라우트 트리 전체 (01-requirements 3-2)
  shared/
    config/env.ts         API_MODE · API_ORIGIN · 목 기본 시각
    api/
      client.ts           createApolloClient() — 링크 · 캐시 정책
      links.ts            authLink · errorLink · (목 모드) delayLink 없음 — 지연은 MSW가 담당
      errors.ts           normalizeError() → AppError { code, category, field? }
      tokenStore.ts       get/set/clear (localStorage 'glog.token')
      rest.ts             uploadProfileImage(file) — REST 유일
      usePagedList.ts     커서 목록 훅 (더 보기)
      pagination.ts       nodesConnection() 타입 정책
    lib/
      paths.ts            경로 · 쿼리 빌더 + 파서 (유일한 URL 계약)
      kst.ts              KST 날짜 유틸
      format.ts           주차 라벨 · 날짜 표기 · "오늘 오전 6시 기준"
      validators.ts       입력 검증 (E-29 · E-30 · E-56 · E-61~63)
      ids.ts              isBigintId · isObjectId
      useDocumentTitle.ts
      useHotkey.ts        `/` 단축키 (IME · 입력칸 · 모달 예외)
    ui/                   공통 컴포넌트 (6장). 각 폴더 = Component.tsx + Component.module.css + index.ts
    styles/
      tokens.css          목업 v2 :root 변수 + 접근성 보정
      global.css          리셋 · 글꼴 · 포커스 링 · 유틸
  domain/                 웹 · 앱 공유 가능한 순수 TS (React 의존 금지)
    badges.ts             toBadge(domain, value, context) → { tone, icon, label }
    banner.ts             pickHomeBanner(state) — E-39 → E-32 → E-36 → E-46
    messages.ts           오류 코드별 문구 · 표준 문구 4종
    weekly.ts             표시용 산술 ("n일 더", 게이지 칸)
  session/
    SessionProvider.tsx   me 쿼리 + tokenStore → { status, viewer, refresh, signOut }
    useSession.ts
  layouts/
    RootLayout.tsx        ScrollRestoration · 전역 오류 경계
    BareLayout/           로고 바 + 중앙 본문
    AppLayout/            Header · HeaderSearch · Drawer · 본문 오류 경계
    AdminLayout/          제목 · 날짜 · 가로 탭 6 + 배지
  guards/                 PublicOnly · PendingOnly · RequireActiveMember · RequireAdmin · TeamScope · RequireTeamLeader
  features/
    auth/                 AU-01 · AU-02 · AU-03
    home/                 CM-01
    errors/               CM-02 (NotFoundPage · ErrorPage)
    activity/             AC-01 · AC-02
    teams/                TM-01 ~ TM-08
    posts/                BD-01 · BD-03 · BD-04
    notices/              NT-01 · NT-02
    profile/              PR-01 · PR-02
    admin/                AD-01 탭 6
      각 feature/
        pages/            라우트가 부르는 화면 (기본 export)
        components/       그 영역 전용 컴포넌트
        api.ts            graphql() 문서 + 이 영역 훅 래퍼
        *.test.tsx
  gql/                    codegen 결과 (손대지 않음)
  mocks/
    browser.ts            setupWorker(...handlers)
    node.ts               setupServer(...handlers) — 테스트
    handlers.ts           graphql 실행 핸들러 + REST 핸들러 + 장애 주입
    schema.ts             SDL(?raw) + 리졸버 → 실행 스키마
    context.ts            Authorization → viewer, clock
    clock.ts              목 기준 시각 (기본 2026-10-01T10:00:00+09:00)
    control.ts            시나리오 · 장애 · 시각 설정 (localStorage 'glog.mock')
    errors.ts             gqlError(code, field?) — extensions.code를 붙인 GraphQLError
    db/
      seed.ts             시드 (목업 v2 인물 · 팀 · 글 · 판정)
      store.ts            메모리 DB + 리셋 · 조회 헬퍼
      derive.ts           주간 활동 · 인증일 · 마스킹 계산 (서버 역할 흉내)
    resolvers/            영역별 리졸버 (auth · me · activity · teams · posts · notices · profile · admin)
    DevToolbar.tsx        목 모드 전용 떠 있는 패널 (시나리오 · 장애 · 시각)
  test/
    setup.ts              msw/node · jest-dom · 시간대
    render.tsx            renderRoute(path, { as: persona }) — 실제 라우터 + 프로바이더
```

### 의존 방향 (lint로 강제)

```
app → layouts · guards · features → session · domain · shared
features/x → features/y  금지 (공유가 필요하면 shared 또는 domain으로 올린다)
features · layouts · guards → mocks  금지
features · layouts · guards → @apollo/client/link/* · fetch  금지 (S-2)
domain → React · Apollo · shared/ui  금지 (앱 재사용)
mocks → features  금지 (mocks는 schema · domain · shared/lib만)
```

`eslint.config.js`의 `no-restricted-imports` · `no-restricted-globals(fetch)`로 건다. 예외는 `shared/api/rest.ts` 한 파일.

---

## 3. 데이터 계층

### 3-1. Apollo 클라이언트

```ts
// shared/api/client.ts (요지)
const httpLink = new HttpLink({ uri: `${API_ORIGIN}/graphql` });
const authLink = new SetContextLink((prev) => {
  const t = tokenStore.get();
  return t ? { headers: { ...prev.headers, authorization: `Bearer ${t}` } } : {};
});
const errorLink = new ErrorLink(({ error }) => {
  const e = normalizeError(error);
  if (e.code === 'UNAUTHENTICATED') sessionEvents.emit('expired');      // 토큰 폐기 + /login + 토스트 E-03
  if (e.code === 'ACCOUNT_PENDING' || e.code === 'ACCOUNT_REJECTED') sessionEvents.emit('status-changed');
});
new ApolloClient({ link: ApolloLink.from([errorLink, authLink, httpLink]), cache });
```

- 세션 사건은 이벤트로 내보낸다. 링크가 라우터 · 토스트를 직접 부르지 않는다.
- 기본 `errorPolicy: 'none'` · `fetchPolicy: 'cache-and-network'`(조회 화면) — 화면에 들어올 때마다 최신 판정을 본다.
- `API_MODE=mock`이어도 `API_ORIGIN`은 `''`(같은 출처)라 MSW가 `/graphql`을 가로챈다.

### 3-2. 캐시 정책

| 대상 | 정책 |
|---|---|
| `Team` · `Member` · `Post` · `Comment` · `Notice` · `WeeklyJudgment` · `ExemptionPeriod` · `PersonalExemptionRequest` | `id` 정규화 (기본) |
| `TeamLabel` · `AdminTeamLabel` · `WarningState` · `LiveWeekState` · `DayActivity` · `RecalcPreview` | `keyFields: false` (값 객체, 부모에 묻힘) |
| `Me` | `keyFields: []` (싱글턴) |
| `WeekActivity` | `keyFields: ['weekStart']`이면 서로 다른 회원의 주가 섞인다 → `keyFields: false` |
| 목록 필드 (`posts` · `notices` · `adminMembers` · `adminContents` · `deletedWarnings` · `exemptionPeriods` · `personalExemptionRequests` · `AdminJudgmentWeek.rows` · `Member.judgmentHistory` · `Team.managedContents` · `Post.comments`) | `nodesConnection(keyArgs)` — `after`가 있으면 `nodes`를 이어 붙이고 없으면 교체 |

### 3-3. 목록 — `usePagedList`

```ts
const list = usePagedList(PostsDocument, {
  variables: { filter }, select: (d) => d.posts,
});
// list.nodes · list.totalCount · list.hasMore · list.loadMore() · list.loadingMore · list.error · list.refetch()
```

- 화면은 Connection 모양을 모른다. U-01이 "번호 페이지"로 결론 나면 이 훅만 바꾼다.
- [더 보기] 실패는 목록을 지우지 않고 버튼 자리에 "불러오지 못했어요. [다시 시도]".

### 3-4. 오류 정규화

```ts
type AppError = { code: ErrorCode; category: 'auth' | 'status' | 'forbidden' | 'notFound' | 'validation' | 'conflict' | 'server' | 'network'; field?: string };
normalizeError(err: unknown): AppError
```

- GraphQL 오류: `extensions.code ?? extensions.classification`. Spring for GraphQL 기본 분류(`UNAUTHORIZED` · `FORBIDDEN` · `NOT_FOUND` · `BAD_REQUEST` · `INTERNAL_ERROR`)도 같은 범주로 접는다.
- HTTP 401 → `UNAUTHENTICATED` · 5xx → `INTERNAL` · 응답 없음 → `network`.
- 모르는 코드 → `server` 범주 + 표준 서버 오류 문구.
- 화면 문구는 `domain/messages.ts`의 `messageFor(code, screen?)`로만 얻는다. 서버 `message`는 개발 콘솔에만.

### 3-5. 조회 화면의 상태 4종

모든 페이지는 `<QueryBoundary result={q}>` 로 감싼다.

| 상태 | 표시 |
|---|---|
| 첫 로딩 | 화면별 스켈레톤(`skeleton` prop). 스피너 금지(AU-02만 예외) |
| 오류 | `FORBIDDEN` → 403 본문 · `NOT_FOUND` → 404 본문 · `network` → E-51 본문 · 그 외 → 서버 오류 본문 + [다시 시도] |
| 빈 데이터 | 화면이 `EmptyState`를 직접 그린다 |
| 데이터 | children(data) |

`cache-and-network`로 다시 불러오는 중에는 기존 데이터를 그대로 보여 준다(깜빡임 없음).

### 3-6. 뮤테이션 규칙

- 버튼은 진행 중 `disabled` + 라벨 유지(중복 제출 방지).
- 성공 토스트 · 실패 토스트 문구는 `messages.ts`.
- **재계산 조작 5종**(정정 · 소급 면제 · 경고 복구 · 이행 체크 · 개인 면제 승인): `refetchQueries`로 영향받는 쿼리를 다시 부르고 `awaitRefetchQueries: true`.
- `expectedBasis`: 미리보기 응답의 `basis`를 그대로 실어 보낸다. `PREVIEW_STALE`이면 미리보기를 다시 부르고 문구를 띄운다.
- 낙관적 응답은 6-5 목록의 단일 값 조작에만.

---

## 4. 세션 · 인증

```ts
type SessionStatus = 'LOADING' | 'ANONYMOUS' | 'PENDING' | 'REJECTED' | 'ACTIVE';
type Session = { status; viewer?: { id; nickname; githubLogin; profileImageUrl; role; hasTeam; pendingInvitationCount }; refresh(): Promise<void>; signOut(): Promise<void>; completeLogin(code): Promise<SessionStatus> };
```

- 시작: 토큰이 없으면 `ANONYMOUS`. 있으면 `me` 조회 → `me.status`.
- `completeLogin(code)`: `exchangeLoginCode` → 토큰 저장 → 캐시 초기화 → `me` 재조회. **같은 code에 대한 Promise를 모듈 Map에 보관**(StrictMode 이중 실행 대비).
- `signOut()`: `logout` 뮤테이션(실패해도 진행) → 토큰 삭제 → `client.clearStore()` → `/login`.
- 만료(`expired` 이벤트): 토큰 삭제 → `clearStore` → `/login` + 토스트 "로그인이 만료됐어요. 다시 로그인해 주세요."
- 로딩 중(`LOADING`)에는 가드가 아무것도 그리지 않는다(빈 캔버스, 300ms 넘으면 로고 바만).
- 로그인 시작 URL: real = `${API_ORIGIN}/oauth2/authorization/github`, mock = `/auth/callback?code=mock-<persona>`.

---

## 5. 시간 · 날짜

- 기준 시각은 서버 `clock { now, currentWeekStart, currentWeekEnd }`. 앱 시작 때 한 번 받고 `useClock()`으로 읽는다. 브라우저 시계와의 차이(offset)를 저장해 E-27 배너 시각 계산에만 쓴다.
- `Date` 스칼라는 문자열 그대로 다룬다. `kst.ts`: `addDays(d, n)` · `weekdayOf(d)`(월=0) · `mondayOf(d)` · `isSameDate` · `formatMD(d)` → `9/28` · `formatWeekRange(start)` → `9/28 ~ 10/4` · `formatWeekLabel(start)` → `9월 28일 ~ 10월 4일` · `formatDateTime(iso)` → `9/29 14:20`.
- `DateTime`을 표시할 때만 `Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', ... })`.
- 갱신 기준 문구 `asOfLabel(updatedAt, now)` → "오늘 오전 6시 기준" / "어제 오전 6시 기준" / "9/29 오전 6시 기준". `updatedAt`이 null이면 문구 생략.
- 테스트는 `TZ=UTC`, `Asia/Seoul`, `America/Los_Angeles` 세 번 돈다(`npm run test:tz`).

---

## 6. 공통 UI 컴포넌트

모두 `src/shared/ui/`. 시각 값은 `docs/design/mockup-v2.reference.css`의 같은 이름 클래스에서 옮긴다(괄호 안).

| 컴포넌트 | 핵심 props | 근거 |
|---|---|---|
| `Button` | `variant: 'primary' \| 'outline' \| 'danger' \| 'text' \| 'dark'` · `size: 'xs' \| 'sm' \| 'md' \| 'lg'` · `icon` · `loading` · `as=Link`(`to`) | `.btn .btn-p .btn-o .btn-dg .btn-t .btn-dark` |
| `IconButton` | `label`(필수, aria-label) · `icon` | `.ib` |
| `Icon` | `name` (목업 PATHS 30개 + github) · `size` · `strokeWidth` | `PATHS` |
| `Pill` | `tone: 'ok' \| 'bad' \| 'info' \| 'mute' \| 'warn' \| 'solid' \| 'dark' \| 'line'` · `icon` · children | `.pill .p-*` |
| `StatusBadge` | `domain` · `value` · `context` → `domain/badges.ts` 결과를 `Pill`로 | PILL 표 |
| `Tag` | `label` · `to?` · `onRemove?` | `.tag` |
| `TeamTag` | `label: TeamLabel \| null` (PRIVATE · DELETED면 렌더 안 함) | `.team-tag` |
| `CategoryChip` | children | `.cat` |
| `Avatar` | `name` · `imageUrl?` · `size: 28 \| 32 \| 88` — 색은 이름 첫 글자 해시로 목업 6색 | `.av` · `AV` |
| `Logo` | — | `.logo .mark` |
| `WeekStrip` | `days: DayActivity[]` · `size: 12 \| 32 \| 46 \| 54` · `showLabels` · `legend` | `bigStrip` · `mstrip` · `sq` |
| `GrassHeatmap` | `days: GrassDay[]` · `cell` · `gap` (53주 × 7) | `heat` |
| `WarningGauge` | `count` · `max=3` | `.wbar` |
| `BigStat` | `label` · `value` · `unit` · `check?` | `.kl .big` |
| `SectionHeader` | `title` · `right?` | `.sh` |
| `PageTitle` | `title` · `sub?` · `actions?` | `.pt .pt-sub` |
| `Card` | `padding` | `.card` |
| `InfoBox` | `tone: 'blue' \| 'mute' \| 'red'` · `icon` · `action?` | `.box .box-blue .box-mute` |
| `Segmented` | `items: {value,label,count?}[]` · `value` · `onChange` (role=tablist) | `.seg` |
| `Tabs` | 가로 탭 + 배지 (AdminLayout) | `.atabs` |
| `TextField` · `TextArea` · `Select` · `SearchInput` | `label` · `required` · `hint` · `error` · `maxLength` · `counter` | `.field .inp` |
| `Radio` · `RadioCard` · `Switch` | 실제 `<input>` | `.radio-c` · 스위치 |
| `DataTable` | `columns` · `rows` · `rowKey` · `highlight?` · `empty` | `.tb table` |
| `RowList` | `<ul class=rows>` 래퍼 | `.rows` |
| `Foot` | 표 아래 각주 | `.foot` |
| `EmptyState` | `title` · `body?` · `action?` | v1 구조 |
| `Skeleton` | `lines` · `block` · 프리셋(`ListSkeleton` · `TableSkeleton` · `CardSkeleton`) | v1 구조 |
| `FullState` | `kind: 'forbidden' \| 'notFound' \| 'server' \| 'network'` · `onRetry?` · `backTo?` | 5-2-8 표준형 |
| `QueryBoundary` | 3-5 | — |
| `LoadMore` | `hasMore` · `loading` · `error` · `onLoadMore` · 끝이면 "여기까지예요." | E-57 |
| `Toast` · `useToast()` | `toast.success(msg)` · `toast.error(msg)` · 3초 · `aria-live=polite` | v1 구조 |
| `ConfirmDialog` · `useConfirm()` | `await confirm({ title, body, confirmLabel, tone: 'danger' \| 'primary' })` → boolean. 포커스 트랩 · Esc | v1 구조 |
| `Modal` | 공통 대화상자 (규칙 보기 · 이탈 확인) | — |
| `Kbd` | 단축키 표시 | `.kbd` |
| `VisuallyHidden` | 스크린리더 텍스트 | — |

### 6-1. `domain/badges.ts`

```ts
type BadgeSpec = { tone: PillTone; icon: IconName; label: string };
toBadge('judgment', 'FAIL', 'profile')   // { tone:'bad', icon:'x', label:'미달 (경고)' }
toBadge('judgment', 'FAIL', 'activity')  // { tone:'bad', icon:'x', label:'미달' }
toBadge('judgment', 'HOLD', 'member')    // { tone:'mute', icon:'clock', label:'확인 중' }   (M-05)
toBadge('judgment', 'HOLD', 'admin')     // { tone:'warn', icon:'clock', label:'보류' }
toBadge('judgment', 'EXCLUDED', _, { skipReason:'FIRST_WEEK' })  // '첫 참가'
toBadge('live', 'NOT_YET')               // { tone:'mute', icon:'ring', label:'아직' }
toBadge('live', 'CONDITION_MET')         // { tone:'ok', icon:'check', label:'통과' }
toBadge('warning', 'ACTIVE')             // '유효' · DEDUCTED '차감됨' · FULFILLED '이행 완료'
toBadge('penalty')                       // { tone:'solid', icon:'alert', label:'벌칙 대상' }
```

모르는 값 → `null`(배지 숨김). 전체 표는 A4 3장(26종)을 옮긴다.

### 6-2. 접근성

- 스트립 · 히트맵 칸마다 `VisuallyHidden`: "9월 29일 화요일, 잔디 1칸, 기록글 1개, 인증됨".
- 상태는 색 + 아이콘 + 글자 3중(배지가 보장).
- 포커스 링 `:focus-visible { outline: 2px solid var(--green); outline-offset: 2px }`.
- 대화상자: `role=dialog` · `aria-modal` · 첫 포커스 · 닫으면 여는 버튼으로 복귀.
- 토큰 보정(M-16): `--line-input: #87928B`, placeholder `--ink-3`.

---

## 7. 레이아웃

### 7-1. 헤더 (AppLayout)

목업 W-02: 높이 58 · 흰 배경 · 아래 1px 선. `[☰] 로고 ———— [검색창 288px] | [아바타 닉네임 ▾]`.

- 사용자 표시(아바타 + 닉네임)는 `/profile/me` 링크다(화면설계서 5-1-0-1 ④ 제안). 로그아웃은 드로어 하단.
- 768px 미만: 검색창을 돋보기 `IconButton`으로 접고, 누르면 헤더 전체 폭 검색으로 바뀐다.

### 7-2. 헤더 검색 (`HeaderSearch`)

| 동작 | 규칙 |
|---|---|
| 열기 | 검색창 클릭 · `/` 키(`useHotkey('/')` — 입력칸 · textarea · contenteditable · 열린 모달 · `isComposing` 중이면 무시) |
| 펼침 | 폭 288 → 480, 아래로 제안 목록. 배경 dim 없음(본문 클릭 시 닫힘) |
| 제안 | 입력이 있으면 3줄: "{q} — 트러블슈팅에서 검색" · "{q} — 개발일지에서 검색" · "#{q} — 태그 글 모아보기". 입력이 없으면 안내 문구만. **서버 호출 0건** |
| 키 | ↑↓ 이동 · Enter 선택(기본 첫 줄) · Esc 닫기 · Tab은 목록을 건너뛴다 |
| 검증 | 공백 제거 후 1자 → Enter 무시 + "2자 이상 입력해 주세요." · 50자 `maxLength` |
| 이동 | `paths.posts({ type, q })` 또는 `paths.posts({ type: 'troubleshooting', tag })` 로 push, 닫고 입력 초기화 |
| 하단 | "제목 · 내용 · 태그를 찾아요. 팀과 회원은 찾지 않아요." |
| ARIA | combobox 패턴: input `role=combobox` `aria-expanded` `aria-controls` `aria-activedescendant`, 목록 `role=listbox` |

### 7-3. 드로어

목업 W-03: 왼쪽 오버레이 · 폭 300 · 배경 dim · 그룹 제목 + 하위 링크 · 하단 로그아웃. 현재 경로 강조. 받은 초대 수 배지(`me.pendingInvitationCount`). 관리자 그룹은 `viewer.role === 'ADMIN'`일 때만. 링크를 누르면 닫힌다. Esc · 바깥 클릭으로 닫힌다. 본문 스크롤 잠금.

### 7-4. AdminLayout

`관리자` 제목 + 오른쪽 오늘 날짜(`clock.now` → "2026년 10월 1일 목요일") + 가로 탭 6개: 관리자 대시보드 · 경고 복구 · 벌칙(벌칙 대상 수) · 가입 승인(대기 수) · 면제 관리(요청 대기 수) · 공지 관리 · 게시물 관리. 배지 수는 `adminDashboardSummary` 한 번. 본문 폭 1120.

---

## 8. 목(mock) 설계

### 8-1. 구조

```
브라우저 → Apollo HttpLink → fetch('/graphql') ──MSW──▶ handlers.ts
                                                     ├ 장애 주입 (control.failure)
                                                     ├ 지연 (control.latency, 기본 250ms)
                                                     └ graphql.execute(schema, document, variables, context)
                                                          context = { viewer(Authorization), clock, db }
REST /api/members/me/profile-image ──MSW──▶ multipart 검사(5MB · 형식) → db 갱신 → { profileImageUrl }
```

- 스키마: `import sdl from '../../docs/api/schema.graphql?raw'` + `resolvers` → `makeExecutableSchema`.
- 리졸버가 던지는 오류: `gqlError('TEAM_JOIN_BLOCKED')` → `extensions: { code: 'TEAM_JOIN_BLOCKED', classification: 'FORBIDDEN' }` (Spring 응답 모양 흉내).
- 인증 없음/잘못된 토큰 → HTTP 200 + `UNAUTHENTICATED` 오류. 대기 회원이 `me` · `logout` 외 필드를 부르면 `ACCOUNT_PENDING`.
- 목 토큰 형식: `mock.<memberId>`. 서버가 발급하는 척만 한다.
- 목 DB는 메모리. **새로고침하면 시드로 돌아간다.** DevToolbar에 [데이터 초기화].

### 8-2. 페르소나 (시나리오)

| 키 | 회원 | 상태 | 쓰임 |
|---|---|---|---|
| `member` (기본) | 한동관 `@handong-gwan` | ACTIVE · 사이드 프로젝트 A팀 **팀장** · 알고리즘 스터디 팀원 · **관리자** | 목업 W-02 ~ W-16을 그대로 재현 |
| `plain` | 김철수 `@chulsoo-kim` | ACTIVE · A팀 팀원 · 관리자 아님 | 권한 없는 화면 · 남의 글 |
| `noteam` | 서연 `@seoyeon-lee` | ACTIVE · 팀 없음 · 받은 초대 1 | 팀 미소속 홈(5-2-7) |
| `penalty` | 박지훈 `@jihoon-park` | ACTIVE · 경고 3 · 벌칙 대상 | 벌칙 배너 · 경고 화면 |
| `pending` | 정다은 `@daeun-jung` | PENDING | AU-03 |
| `rejected` | 최민재 `@minjae-choi` | REJECTED | AU-03 거절 |

목업 W-14(한동관 프로필)에 [관리자 메뉴]가 있으므로 `member`가 관리자다. AU-01 목 모드 버튼 아래에 페르소나 선택(목 모드에서만 보이는 작은 셀렉트)을 둔다.

### 8-3. 장애 · 시각

`control.ts` (localStorage `glog.mock`):

| 값 | 효과 |
|---|---|
| `failure: 'none' \| 'network' \| 'server' \| 'slow'` | network = `HttpResponse.error()` · server = 첫 번째 필드에 `INTERNAL` · slow = 지연 3s |
| `failOnce: operationName` | 다음 한 번만 그 연산 실패 (재시도 확인용) |
| `now: ISO` | 목 기준 시각. 프리셋: 기본(목 10:00) · 일요일 23:40(E-27) · 월요일 03:00(판정 전) · 월요일 09:00(판정 후) |
| `grass: 'ok' \| 'failed' \| 'identity'` | 잔디 조회 상태 강제 (E-32 · E-08) |

`DevToolbar`는 `API_MODE=mock`일 때만 동적 import된다. 왼쪽 아래 작은 알약 → 펼치면 위 값들. 실서버 빌드에는 들어가지 않는다.

### 8-4. 시드 (목업 v2와 맞춤)

- 기준 주: 2026-09-28(월) ~ 10-04(일), 오늘 10-01(목) 10:00.
- 회원 12명: 한동관 · 김철수 · 이영희(`@younghee-dev`) · 박민수(`@minsu-park`) · 서연 · 박지훈 · 정하늘 · 최유진 · 정다은(대기) · 최민재(거절) · 대기 2명 더(승인 대기 3 = W-15).
- 팀: 사이드 프로젝트 A팀(공개 · 한동관 팀장 · 4명 · 초대코드 `JD7K-Q2MA`) · 알고리즘 스터디(비공개 · 6명) · 웹 프로젝트 B팀(공개).
- 한동관 이번 주: 월 잔디 3 · 화 잔디 1 + 기록글 1 · 수 0 · 목(오늘) 0 → 인증일 2/3 · 기록글 1/1 → "아직".
- 한동관 지난 판정: 9/21 통과 · 9/14 미달(경고, A팀 + 알고리즘 스터디) · 9/7 면제(전체 면제 기간) · 8/31 통과 · 8/24 첫 참가. 누적 경고 1 · 연속 통과 1.
- 글 20개 이상: 목업 POSTS 4개 + W-05 Redis 검색 결과 3개 + TM-05 기록글 5개 + 채움. 태그 10종(목업 TAGS). 트러블슈팅 · 개발일지 섞어서 `[더 보기]`가 생기게 25개.
- 공지: 잔디 인정 규칙 안내(고정 · 시스템) · 10월 정기 모임 · 2학기 스터디 팀 모집.
- 관리자: 9/21 주 판정 25행(통과 18 · 미달 4 · 면제 2 · 첫 참가 1, 9/28 07:00 실행) · 보류 1 · 벌칙 대상 2(박지훈 · 정하늘) · 삭제된 경고 2(이영희 추방 · 최유진 팀 삭제) · 면제 요청 대기 2.
- 받은 초대: 한동관 2건.

### 8-5. 서버 역할 흉내 (`mocks/db/derive.ts`)

목 리졸버는 **서버가 하는 계산**을 흉내 낸다. 프론트 코드(`src/features` · `src/domain`)는 이 파일을 import하지 않는다.

- 인증일: KST 날짜별 `grassCount > 0 || 기록글 ≥ 1`.
- 기록글 인정(`isRecord`): 필수 섹션이 다 채워지면 true (트러블슈팅 문제 · 원인 · 해결 / 개발일지 한 일 · 배운 점).
- 진행 중 상태: 팀 없음 → EXCLUDED · 면제 주 → EXEMPT · 인증일 ≥ 3 && 기록글 ≥ 1 → CONDITION_MET · 그 외 NOT_YET.
- 마스킹: 조회자가 팀원이 아니고 팀이 비공개면 `TeamLabel { kind: PRIVATE, name: null }` · `Post.publicTeam = null`.
- 권한 플래그: `viewerCanEdit = 작성자 || 그 글 소속 팀의 팀장` · `viewerCanDelete = 작성자 || ADMIN`.
- 재계산 미리보기(정정 · 복구 · 면제): 경고 수 ± 1 단순 규칙 + `basis = 'v' + db.version`. 뮤테이션이 오면 `expectedBasis !== basis`이면 `PREVIEW_STALE`.

---

## 9. 화면 파일 · 데이터 매핑

라우터가 부르는 파일 경로는 고정이다.

| 화면 | 파일 | 주 쿼리 | 주 뮤테이션 |
|---|---|---|---|
| AU-01 | `features/auth/pages/LoginPage.tsx` | — | — |
| AU-02 | `features/auth/pages/AuthCallbackPage.tsx` | — | `exchangeLoginCode` |
| AU-03 | `features/auth/pages/PendingPage.tsx` | `me` | `logout` |
| CM-01 | `features/home/pages/HomePage.tsx` | `me` · `myWeek` · `myWarnings.state` · `notices(first:3)` | — |
| CM-02 | `features/errors/pages/NotFoundPage.tsx` · `ErrorPage.tsx` | — | — |
| AC-01 | `features/activity/pages/WeeklyPage.tsx` | `myWeek(weekStart)` · `me.member.judgmentHistory` | — |
| AC-02 | `features/activity/pages/WarningsPage.tsx` | `myWarnings` | — |
| TM-01 | `features/teams/pages/TeamListPage.tsx` | `myTeams` · `me.pendingInvitationCount` | — |
| TM-02 | `features/teams/pages/TeamCreatePage.tsx` | — | `createTeam` |
| TM-03 | `features/teams/pages/TeamJoinPage.tsx` | — | `joinTeamByInviteCode` |
| TM-04 | `features/teams/pages/InvitationsPage.tsx` | `myInvitations` | `respondInvitation` |
| TM-05 | `features/teams/pages/TeamBoardPage.tsx` | `team(id){ currentWeekBoard recentPosts }` | — |
| TM-06 | `features/teams/pages/TeamManagePage.tsx` | `team(id){ members pendingInvitations managedContents inviteCode }` | `inviteMember` · `cancelInvitation` · `kickMember` · `transferLeadership` · `setTeamVisibility` · `leaveTeam` · `deleteTeam` |
| TM-08 | `features/teams/pages/TeamExemptionPage.tsx` | `team(id){ members exemptionRequests }` | `requestPersonalExemption` |
| BD-01 | `features/posts/pages/PostListPage.tsx` | `posts` · `postTypeCounts` · `popularTags` | — |
| BD-03 | `features/posts/pages/PostDetailPage.tsx` | `post(id)` | `deletePost` · `addComment` · `updateComment` · `deleteComment` |
| BD-04 | `features/posts/pages/PostEditorPage.tsx` (new · edit 공용) | `post(id)` (edit) · `myTeams` | `createPost` · `updatePost` |
| NT-01 | `features/notices/pages/NoticeListPage.tsx` | `notices` | — |
| NT-02 | `features/notices/pages/NoticeDetailPage.tsx` | `notice(id)` | — |
| PR-01 | `features/profile/pages/ProfilePage.tsx` (me · :userId 공용) | `member(id)` | — |
| PR-02 | `features/profile/pages/ProfileEditPage.tsx` | `me` | REST 업로드 · `resetProfileImage` |
| AD 대시보드 | `features/admin/pages/AdminDashboardPage.tsx` | `adminDashboardSummary` · `adminJudgmentWeek` · `heldJudgments` · `judgmentCorrectionPreview` | `correctJudgment` · `rerunHeldJudgments` |
| AD 경고 · 벌칙 | `features/admin/pages/AdminWarningsPage.tsx` | `penaltyTargets` · `deletedWarnings` · `restoreWarningPreview` | `fulfillPenalty` · `restoreWarning` |
| AD 가입 승인 | `features/admin/pages/AdminMembersPage.tsx` | `adminMembers` | `approveMember` · `rejectMember` · `revertMemberToPending` |
| AD 면제 | `features/admin/pages/AdminExemptionsPage.tsx` | `exemptionPeriods` · `exemptionPeriodPreview` · `personalExemptionRequests` · `personalExemptionApprovalPreview` | 면제 5종 |
| AD 공지 | `features/admin/pages/AdminNoticesPage.tsx` | `notices` | 공지 4종 |
| AD 게시물 | `features/admin/pages/AdminPostsPage.tsx` | `adminContents` | `deletePost` · `deleteComment` |

각 화면의 구성요소 번호(①②…) · 문구 · 상태 · 예외는 화면설계서 v0.7의 해당 절을 그대로 따른다. 구현 PR 설명에 화면설계서 절 번호를 적는다.

---

## 10. 테스트 전략

| 층 | 도구 | 대상 |
|---|---|---|
| 단위 | Vitest | `kst` · `format` · `validators` · `paths`(왕복) · `errors` · `badges` · `banner` · `derive`(목) |
| 화면 통합 | Vitest + RTL + `msw/node` | `renderRoute('/teams/1', { as: 'plain' })` — 실제 라우터 · Apollo · 목 핸들러. 수용 기준(ACC-*)을 테스트 이름에 적는다 |
| 계약 | codegen + `graphql-tools` | 모든 operation이 SDL에 대해 유효 (`npm run codegen` 실패 = 계약 위반) |
| 시간대 | `TZ=` 3종으로 `kst` · 주간 화면 테스트 반복 | ACC-KST |
| 수동 | 브라우저 (목 모드) | 목업 대조 · 반응형 360/768/960/1280 · 키보드만으로 주요 흐름 |

스크립트: `dev` · `build` · `preview` · `typecheck` · `lint` · `test` · `test:tz` · `codegen` · `codegen:check` · `check`(= typecheck + lint + test + codegen:check).

---

## 11. 환경 · 배포

| 변수 | 값 | 비고 |
|---|---|---|
| `VITE_API_MODE` | `mock` \| `real` | 기본 `mock` |
| `VITE_API_ORIGIN` | `''` \| `https://api.example.com` | real일 때 백엔드 출처 |
| `VITE_MOCK_NOW` | ISO | 목 기준 시각 기본값 덮어쓰기 |

- Render Static Site: 빌드 `npm ci && npm run build`, 게시 `dist`, 리라이트 `/* → /index.html`.
- **백엔드가 생기기 전까지 Render에도 `mock`으로 올린다**(시연용). MSW 워커 파일 `public/mockServiceWorker.js`는 목 모드에서만 등록한다.
- 연동 체크리스트: (1) `schema.graphql`을 백엔드 SDL로 교체 → `npm run codegen` 통과 (2) `VITE_API_MODE=real` (3) CORS · OAuth 콜백 URL (4) Nginx 업로드 한도(B-07).

---

## 12. 구현 계획

### 12-1. 순서

1. **기반 (팀장 직접)** — 스캐폴드 · 의존성 · 설정 · 토큰 CSS · 공통 UI 핵심 · Apollo · 오류 · 세션 · 경로 빌더 · KST 유틸 · 라우터 전체(자리표시 화면) · 가드 · 레이아웃(헤더 · 검색 · 드로어 · Admin 탭) · 목 인프라(핸들러 · 스키마 · 컨텍스트 · 시드 · 영역별 리졸버 빈 껍데기) · 테스트 하네스. **이 단계가 끝나면 모든 경로가 열리고 로그인 → 홈 흐름이 돈다.**
2. **영역 병렬 (에이전트 4명)** — 각자 자기 `features/<영역>/` · `mocks/resolvers/<영역>.ts` 만 고친다. 공통 컴포넌트가 더 필요하면 자기 영역 `components/`에 만들고 보고서에 "승격 후보"로 적는다.

| 담당 | 영역 | 화면 (1차 → 2차 → 3차) |
|---|---|---|
| 에이전트 A | `home` · `activity` · `profile` | CM-01 · AC-01 · PR-01 → AC-02 · PR-02 |
| 에이전트 B | `teams` | TM-01 · TM-02 · TM-03 · TM-05 → TM-04 · TM-06 → TM-08 |
| 에이전트 C | `posts` · `notices` | BD-01 · BD-03 · BD-04 → NT-01 · NT-02 |
| 에이전트 D | `admin` | 대시보드 조회 · 가입 승인 · 공지 관리 → 정정 패널 · 보류 · 면제 · 게시물 → 경고 복구 · 벌칙 |

3. **통합 (팀장)** — 승격 후보 정리 · 전체 `npm run check` · 브라우저 대조 · 수정.

### 12-2. 에이전트 공통 규칙

- 읽을 것: 이 문서 · `01-requirements.md` · 화면설계서의 자기 화면 절 · `schema.graphql`의 관련 타입 · 해당 목업 PNG. 분석 문서(A1~A5)는 필요한 절만.
- 고칠 수 있는 곳: 자기 `features/` 폴더 · 자기 `mocks/resolvers/` 파일 · 자기 테스트. **그 밖의 파일은 고치지 않고 보고한다.**
- 끝내기 전: `npm run typecheck && npm run lint && npm run test -- <영역>` 녹색.
- 보고: 만든 화면 · 남은 것 · 명세와 다르게 한 것과 이유 · 승격 후보 · 다른 영역에 필요한 변경.
