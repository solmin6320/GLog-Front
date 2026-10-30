# 구현 계약서 — 모듈 간 인터페이스

> v1.0 · 2026-10-02 · 3단계(구현) 공용 계약
> 병렬로 일하는 에이전트가 서로의 코드를 기다리지 않고 짤 수 있게, **모듈마다 export 이름과 시그니처를 고정**한다.
> 이 문서와 다르게 만들어야 하면 바꾸지 말고 보고서에 적는다. 팀장이 통합 때 고친다.

공통 규칙

- 경로 별칭 `@/` = `src/`. 스타일은 CSS Modules(`X.module.css`) + `src/shared/styles/tokens.css` 변수. 색 하드코딩 금지(토큰에 없으면 tokens.css에 추가를 보고).
- 문구는 해요체 · 기술 용어 금지(요구사항 5-4). 오류 문구는 `@/domain/messages`에서.
- 날짜는 `@/shared/lib/kst` · `@/shared/lib/format`만. 화면에서 `new Date()`로 오늘을 정하지 않는다(`useClock()`).
- 경로는 `@/shared/lib/paths`의 `paths.*`로만 만든다.
- GraphQL 문서는 `import { graphql } from '@/gql'`로 쓰고 `npm run codegen`으로 타입을 만든다. 연산 이름은 전역 유일(`<영역><이름>` 예: `TeamBoardQuery`).
- 이미 있는 파일(건드리지 말 것): `src/shared/lib/{kst,format,paths,ids}.ts` · `src/shared/config/env.ts` · `src/shared/styles/{tokens,global}.css` · `src/vite-env.d.ts` · `docs/api/schema.graphql` · 설정 파일 전부.

---

## 1. `@/shared/ui` — 공통 컴포넌트 (웨이브 1 · UI 담당)

`src/shared/ui/index.ts` 배럴에서 전부 export. 폴더 하나에 컴포넌트 하나(`Button/Button.tsx` · `Button.module.css` · `index.ts`).

```ts
// 아이콘 (목업 PATHS + 추가분). lucide 계열 stroke 아이콘, viewBox 24
export type IconName =
  | 'menu' | 'x' | 'search' | 'home' | 'grid' | 'users' | 'file' | 'mega' | 'user'
  | 'chevL' | 'chevR' | 'chevD' | 'pin' | 'check' | 'alert' | 'lock' | 'copy' | 'pencil'
  | 'ext' | 'info' | 'shield' | 'clock' | 'more' | 'minus' | 'ring' | 'half' | 'hash'
  | 'enter' | 'github' | 'logout' | 'trash' | 'plus' | 'calendar' | 'refresh';
export function Icon(p: { name: IconName; size?: number; strokeWidth?: number; className?: string; title?: string }): JSX.Element;

type BtnVariant = 'primary' | 'outline' | 'danger' | 'text' | 'dark';
type BtnSize = 'xs' | 'sm' | 'md' | 'lg';          // 28 · 32 · 40 · 52px
export function Button(p: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: BtnSize; icon?: IconName; loading?: boolean; fullWidth?: boolean }): JSX.Element;
export function LinkButton(p: { to: string; variant?: BtnVariant; size?: BtnSize; icon?: IconName; children: ReactNode; className?: string }): JSX.Element; // react-router Link
export function IconButton(p: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; icon: IconName; size?: 'sm' | 'md' }): JSX.Element;
export function TextLink(p: { to: string; children: ReactNode }): JSX.Element; // 목업 .lnk (파란 밑줄)

export type PillTone = 'ok' | 'bad' | 'info' | 'mute' | 'warn' | 'solid' | 'dark' | 'line';
export function Pill(p: { tone: PillTone; icon?: IconName | null; children: ReactNode }): JSX.Element;
export function StatusBadge(p: BadgeArgs): JSX.Element | null;   // toBadge(p) → Pill. null이면 렌더 안 함
export function Tag(p: { label: string; to?: string; onRemove?: () => void; active?: boolean }): JSX.Element; // '#'은 컴포넌트가 붙인다
export function TeamTag(p: { label: { kind: 'PUBLIC' | 'PRIVATE' | 'DELETED'; name?: string | null } | { name: string } | null | undefined }): JSX.Element | null; // PUBLIC 또는 {name}만 렌더
export function CategoryChip(p: { children: ReactNode; icon?: IconName }): JSX.Element; // .cat
export function Avatar(p: { name: string; imageUrl?: string | null; size?: 28 | 32 | 40 | 88 }): JSX.Element; // 이미지 없으면 첫 글자 + --av-1..6 (이름 해시)
export function Logo(p: { to?: string }): JSX.Element; // 2×2 마크 + '잔디로그'

// 잔디 스트립 — DayActivity 모양 그대로 받는다
export type StripDay = { date: string; grassLevel?: number | null; grassCount?: number | null; hasRecord: boolean; recordCount?: number | null; verified: boolean; isToday: boolean; isFuture: boolean };
export function WeekStrip(p: { days: StripDay[]; size?: 12 | 32 | 46 | 54; showLabels?: boolean; legend?: boolean; fallbackLevel?: number; className?: string }): JSX.Element;
//   size 12 = 표 안 미니(mstrip, 라벨 없음). grassLevel이 null이고 hasGrass면 fallbackLevel(기본 3)로 칠한다(M-17 지난 주).
//   칸마다 VisuallyHidden: "9월 29일 화요일, 잔디 1칸, 기록글 1개, 인증됨" / "아직 오지 않은 날"
export function GrassHeatmap(p: { days: { date: string; count: number; level: number }[]; cell?: number; gap?: number }): JSX.Element; // 열=주(월~일 행)
export function WarningGauge(p: { count: number; max?: number }): JSX.Element; // .wbar
export function BigStat(p: { label: ReactNode; value: ReactNode; unit?: ReactNode; check?: boolean; size?: 'md' | 'lg' }): JSX.Element; // .kl + .big

export function PageContainer(p: { width?: 'md' | 'lg' | 'xl'; children: ReactNode }): JSX.Element; // 700 · 960(기본) · 1120, 좌우 패딩 24 (모바일 16)
export function PageTitle(p: { title: ReactNode; sub?: ReactNode; actions?: ReactNode; meta?: ReactNode }): JSX.Element; // h1.pt
export function SectionHeader(p: { title: ReactNode; right?: ReactNode; as?: 'h2' | 'h3'; id?: string }): JSX.Element; // .sh
export function Card(p: HTMLAttributes<HTMLDivElement> & { padding?: number | string; as?: 'div' | 'section' | 'aside' }): JSX.Element;
export function InfoBox(p: { tone: 'blue' | 'mute' | 'ok' | 'red' | 'warn'; icon?: IconName; action?: ReactNode; children: ReactNode; role?: 'status' | 'alert' }): JSX.Element; // .box
export function Foot(p: { children: ReactNode }): JSX.Element; // .foot
export function Hint(p: { children: ReactNode; id?: string; tone?: 'mute' | 'error' }): JSX.Element; // .hint
export function Divider(): JSX.Element; // .hr

export function Segmented<T extends string>(p: { items: { value: T; label: string; count?: number | null }[]; value: T; onChange: (v: T) => void; ariaLabel: string }): JSX.Element; // role=tablist
export function Tabs(p: { items: { to: string; label: string; count?: number | null; end?: boolean }[]; ariaLabel: string }): JSX.Element; // NavLink 가로 탭 (.atabs), count>0이면 빨간 원 배지

export function TextField(p: InputHTMLAttributes<HTMLInputElement> & { label: string; required?: boolean; optionalLabel?: string; hint?: ReactNode; error?: string | null; counter?: boolean; icon?: IconName }): JSX.Element; // forwardRef. id 자동, aria-describedby · aria-invalid
export function TextArea(p: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; required?: boolean; optionalLabel?: string; hint?: ReactNode; error?: string | null; counter?: boolean; serif?: boolean }): JSX.Element; // forwardRef
export function Select(p: SelectHTMLAttributes<HTMLSelectElement> & { label?: string; options: { value: string; label: string }[]; hint?: ReactNode; error?: string | null }): JSX.Element;
export function SearchInput(p: { value: string; onChange: (v: string) => void; onSubmit: (v: string) => void; placeholder: string; maxLength?: number; ariaLabel: string; size?: 'md' | 'sm'; error?: string | null }): JSX.Element; // form role=search, 지우기(✕) 버튼
export function RadioCard(p: { name: string; value: string; checked: boolean; onChange: (v: string) => void; title: ReactNode; description?: ReactNode; disabled?: boolean }): JSX.Element; // .radio-c, 실제 input[type=radio]
export function Switch(p: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: ReactNode; disabled?: boolean }): JSX.Element; // role=switch

export type Column<T> = { key: string; header: ReactNode; render: (row: T) => ReactNode; align?: 'left' | 'right'; width?: string };
export function DataTable<T>(p: { columns: Column<T>[]; rows: T[]; rowKey: (row: T) => string; rowTone?: (row: T) => 'me' | 'focus' | undefined; empty?: ReactNode; caption?: string; footer?: ReactNode }): JSX.Element; // .tb, 좁은 화면 가로 스크롤
export function RowList(p: { children: ReactNode; ariaLabel?: string }): JSX.Element; // ul.rows
export function RowItem(p: { children: ReactNode; right?: ReactNode; to?: string; alignTop?: boolean }): JSX.Element; // li, to면 행 전체 링크

export function EmptyState(p: { title: string; body?: ReactNode; action?: ReactNode; icon?: IconName }): JSX.Element;
export function Skeleton(p: { width?: number | string; height?: number | string; radius?: number }): JSX.Element;
export function ListSkeleton(p: { rows?: number }): JSX.Element;
export function TableSkeleton(p: { rows?: number; cols?: number }): JSX.Element;
export function CardSkeleton(p: { height?: number }): JSX.Element;
export function PageSkeleton(): JSX.Element; // 제목 + 카드 2 + 목록
export function Spinner(p: { label: string }): JSX.Element; // AU-02 전용

export type FullStateKind = 'forbidden' | 'notFound' | 'server' | 'network' | 'deleted';
export function FullState(p: { kind: FullStateKind; onRetry?: () => void; title?: string; body?: ReactNode; action?: ReactNode }): JSX.Element;
//   forbidden: "이 페이지에 들어올 권한이 없어요." + [홈으로]
//   notFound : "찾는 내용이 없어요. 삭제됐을 수 있어요." + [뒤로](history.back, 히스토리 없으면 홈)
//   server   : "잠시 문제가 생겼어요. 조금 뒤에 다시 시도해 주세요." + [다시 시도](onRetry)
//   network  : "인터넷 연결을 확인해 주세요." + [다시 시도]   (E-51)
//   deleted  : "삭제된 글이에요." + [목록으로] (action으로 덮어쓰기)
export function QueryBoundary<T>(p: {
  loading: boolean; error?: unknown; data: T | undefined | null;
  skeleton?: ReactNode; onRetry?: () => void;
  children: (data: T) => ReactNode;
}): JSX.Element;
//   data가 있으면 children(data) (다시 불러오는 중에도). 없고 loading이면 skeleton(기본 PageSkeleton).
//   error → normalizeError(@/shared/api/errors) → forbidden/notFound/network/server FullState. data가 null이고 error 없으면 notFound.
export function LoadMore(p: { hasMore: boolean; loading: boolean; error?: boolean; onLoadMore: () => void; endText?: string | null }): JSX.Element;
//   hasMore → [더 보기] · error → "불러오지 못했어요." + [다시 시도] · 끝 → endText ?? '여기까지예요.' (null이면 아무것도 안 그림)

export function ToastProvider(p: { children: ReactNode }): JSX.Element;
export function useToast(): { success(msg: string): void; error(msg: string): void; info(msg: string): void }; // 3초, 아래 가운데, aria-live=polite
export type ConfirmOptions = { title: string; body?: ReactNode; confirmLabel?: string; cancelLabel?: string; tone?: 'danger' | 'primary' };
export function ConfirmProvider(p: { children: ReactNode }): JSX.Element;
export function useConfirm(): (o: ConfirmOptions) => Promise<boolean>;
export function Modal(p: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; size?: 'sm' | 'md' | 'lg' }): JSX.Element | null; // role=dialog, 포커스 트랩, Esc, 닫으면 포커스 복귀
export function Kbd(p: { children: ReactNode }): JSX.Element;
export function VisuallyHidden(p: { children: ReactNode; as?: 'span' | 'div' | 'h2' }): JSX.Element;
```

## 2. `@/domain` — 순수 TS (React · Apollo import 금지)

### 2-1. `@/domain/badges` (UI 담당)

```ts
export type BadgeIcon = 'check' | 'x' | 'half' | 'minus' | 'ring' | 'clock' | 'alert' | 'lock' | 'file' | 'shield' | 'users';
export type BadgeTone = 'ok' | 'bad' | 'info' | 'mute' | 'warn' | 'solid' | 'dark' | 'line';
export type BadgeSpec = { tone: BadgeTone; icon: BadgeIcon | null; label: string };
export type BadgeArgs =
  | { kind: 'judgment'; status: string; skipReason?: string | null; context: 'member' | 'profile' | 'admin'; label?: string }
  | { kind: 'live'; status: string; skipReason?: string | null; label?: string }   // 진행 중 주: CONDITION_MET 통과 · NOT_YET 아직 · EXEMPT 면제 · EXCLUDED 제외(첫 참가/팀 없음)
  | { kind: 'progress' }                                        // '진행 중' (PR-01 이번 주)
  | { kind: 'warning'; standing: string }                        // ACTIVE 유효 · DEDUCTED 차감됨 · FULFILLED 이행 완료
  | { kind: 'penalty' }                                          // 벌칙 대상 (solid red)
  | { kind: 'memberStatus'; status: string }                     // PENDING 승인 대기 · ACTIVE 승인됨 · REJECTED 거절됨
  | { kind: 'exemptionRequest'; status: string }                 // PENDING 대기 · APPROVED 승인 · REJECTED 반려
  | { kind: 'teamRole'; role: string }                           // LEADER 팀장(dark) · MEMBER → null
  | { kind: 'visibility'; isPublic: boolean }                    // 공개(line) · 비공개(line + lock)
  | { kind: 'record'; count?: number }                           // '기록글 n개' 중립(mute + file) (M-19)
  | { kind: 'notRecord' }                                        // '인증 미포함' (mute)
  | { kind: 'corrected' };                                       // '정정됨' (info)
export function toBadge(a: BadgeArgs): BadgeSpec | null;   // 모르는 값 → null
// judgment: PASS 통과(ok,check) · FAIL '미달'(bad,x) — context 'profile'이면 '미달 (경고)' · EXEMPT 면제(info,half)
//   EXCLUDED + FIRST_WEEK '첫 참가'(mute,minus) · EXCLUDED + NO_TEAM '팀 없음'(mute,minus) · EXCLUDED 기타 '제외'
//   HOLD: admin '보류'(warn,clock) · member/profile '확인 중'(mute,clock) (M-05)
```

### 2-2. `@/domain/messages` · `banner` · `weekly` (데이터 담당)

```ts
// messages.ts
export const MSG: {
  forbidden: string; notFound: string; server: string; network: string; expired: string; deletedPost: string;
  required: (label: string) => string;          // '{label}을 입력해 주세요.' (받침에 따라 을/를)
  searchTooShort: string;                       // '2자 이상 입력해 주세요.'
  previewStale: string; saved: string; deleted: string; copied: string;
};
export function messageFor(err: { code: string; field?: string }, overrides?: Partial<Record<string, string>>): string; // 22개 코드 → 문구 (A3 7-2). 모르는 코드 → MSG.server
export function josa(word: string, pair: '을/를' | '이/가' | '은/는' | '과/와' | '으로/로'): string;

// banner.ts — CM-01 ⑥ 상태 배너 1개 고르기 (E-39 비공개 기여 → E-32 잔디 실패/E-08 → E-36 첫 주 → E-46 면제 주간)
//   벌칙 문구(E-40)는 배너가 아니라 ④ 경고 카드 하단이다. 'penalty' 키는 돌려주지 않는다(통합 때 정정)
export type HomeBannerInput = { isPenaltyTarget: boolean; grassStatus: 'OK' | 'FAILED' | 'IDENTITY_MISMATCH' | string; skipReason?: string | null; liveStatus?: string | null; privateContributionSuspected: boolean };
export type HomeBanner = { key: 'penalty' | 'grassFailed' | 'grassIdentity' | 'firstWeek' | 'exempt' | 'privateContribution'; tone: 'red' | 'warn' | 'blue' | 'mute'; text: string };
export function pickHomeBanner(i: HomeBannerInput): HomeBanner | null;

// weekly.ts — 표시용 산술만
export function daysLeftToPass(verifiedDays: number | null | undefined, needed = 3): number;     // max(0, needed - v)
export function liveProgressText(live: { status: string; verifiedDaysNeeded: number; recordsNeeded: number } | null): string | null;
//   CONDITION_MET '이번 주 조건을 채웠어요. 월요일 판정에서 확정돼요.'
//   NOT_YET  '아직 통과 전이에요. {n}일 더 인증하면 통과!' / 기록글만 부족 '기록글 1개를 쓰면 통과!' / 둘 다 '{n}일 더 인증하고 기록글 1개를 쓰면 통과!'
//   EXEMPT '이번 주는 면제예요.' · EXCLUDED → null
export function deductionText(weeksUntilDeduction: number | null | undefined): string | null;     // '다음 차감까지 1주 남았어요.'
```

## 3. `@/shared/api` · `@/session` (데이터 담당)

```ts
// shared/api/tokenStore.ts
export const tokenStore: { get(): string | null; set(token: string): void; clear(): void }; // localStorage 'glog.token', try/catch

// shared/api/sessionEvents.ts
export type SessionEvent = 'expired' | 'status-changed';
export const sessionEvents: { on(e: SessionEvent, fn: () => void): () => void; emit(e: SessionEvent): void };

// shared/api/errors.ts
export type ErrorCode =
  | 'UNAUTHENTICATED' | 'ACCOUNT_PENDING' | 'ACCOUNT_REJECTED' | 'FORBIDDEN' | 'NOT_FOUND' | 'POST_DELETED'
  | 'LOGIN_CODE_INVALID' | 'VALIDATION_FAILED' | 'INVITE_CODE_NOT_FOUND' | 'ALREADY_TEAM_MEMBER' | 'TEAM_JOIN_BLOCKED'
  | 'INVITEE_NOT_FOUND' | 'TEAM_GONE' | 'LEADER_MUST_TRANSFER' | 'LAST_MEMBER' | 'EXEMPTION_DUPLICATE'
  | 'JUDGMENT_NOT_CORRECTABLE' | 'SYSTEM_NOTICE_UNDELETABLE' | 'PREVIEW_STALE' | 'RECALC_BUSY' | 'INTERNAL' | 'NETWORK';
export type ErrorCategory = 'auth' | 'status' | 'forbidden' | 'notFound' | 'validation' | 'conflict' | 'server' | 'network';
export type AppError = { code: ErrorCode; category: ErrorCategory; field?: string };
export function normalizeError(err: unknown): AppError;     // 3-4절 규칙. AppError를 받으면 그대로
export function isAppError(v: unknown): v is AppError;

// shared/api/client.ts
export function createApolloClient(opts?: { uri?: string }): ApolloClient;   // 링크 · 캐시 정책(설계서 3-1 · 3-2)
export const apolloClient: ApolloClient;                                     // 앱 싱글턴 (테스트는 createApolloClient)

// shared/api/usePagedList.ts
export function usePagedList<TData, TVars extends OperationVariables, TNode>(
  doc: TypedDocumentNode<TData, TVars>,
  o: { variables: TVars; select: (d: TData) => { nodes: TNode[]; pageInfo: { hasNextPage: boolean; endCursor?: string | null }; totalCount?: number } | null | undefined; skip?: boolean; pageSize?: number },
): { nodes: TNode[]; totalCount: number | null; hasMore: boolean; loadMore: () => void; loadingMore: boolean; loadMoreError: boolean; loading: boolean; error: unknown; data: TData | undefined; refetch: () => void };
//   커서 변수 이름은 `after`, 크기는 `first` 고정.

// shared/api/useAction.ts — 뮤테이션 공통 처리
export function useAction<A extends unknown[], R>(fn: (...a: A) => Promise<R>, o?: { success?: string | ((r: R) => string); errorOverrides?: Partial<Record<ErrorCode, string>>; onError?: (e: AppError) => boolean | void }):
  { run: (...a: A) => Promise<R | undefined>; pending: boolean; error: AppError | null; reset(): void };
//   실패: onError가 true를 돌려주면 처리 끝(인라인 표시 등), 아니면 messageFor로 토스트. UNAUTHENTICATED는 링크가 처리하므로 토스트 안 함.

// shared/api/rest.ts — 유일한 fetch
export async function uploadProfileImage(file: File): Promise<{ profileImageUrl: string }>; // 실패 시 AppError throw

// session/
export type SessionStatus = 'LOADING' | 'ANONYMOUS' | 'PENDING' | 'REJECTED' | 'ACTIVE';
export type Viewer = { id: string; memberId: string; nickname: string; githubLogin: string; profileImageUrl: string | null; role: 'MEMBER' | 'ADMIN'; hasTeam: boolean; pendingInvitationCount: number };
export type Clock = { now: string; today: string; currentWeekStart: string; currentWeekEnd: string };
export type Session = {
  status: SessionStatus; viewer: Viewer | null; clock: Clock | null;
  refresh(): Promise<SessionStatus>;                 // me 재조회 (AU-03 [승인됐는지 확인])
  completeLogin(code: string): Promise<SessionStatus>; // 같은 code는 1회만 교환 (StrictMode)
  signOut(): Promise<void>;
  loginUrl(persona?: string): string;                // real: `${apiOrigin}/oauth2/authorization/github`, mock: `/auth/callback?code=mock-${persona ?? 'member'}`
};
export function SessionProvider(p: { children: ReactNode }): JSX.Element; // ToastProvider · ApolloProvider 안쪽에 둔다
export function useSession(): Session;
export function useViewer(): Viewer;      // ACTIVE 아래에서만. viewer 없으면 throw
export function useClock(): Clock;        // clock 없으면 throw (RequireActiveMember 아래에서는 항상 있음)
export function useIsAdmin(): boolean;
```

`session/api.ts`의 문서 (다른 곳에서 같은 필드를 다시 부르지 않는다):

```graphql
query SessionQuery {
  clock { now currentWeekStart currentWeekEnd }
  me { id status role hasTeam pendingInvitationCount member { id nickname githubLogin profileImageUrl } }
}
mutation SessionExchangeLoginCode($code: String!) { exchangeLoginCode(code: $code) { status accessToken expiresAt } }
mutation SessionLogout { logout }
```

`Me.id`와 `Member.id`는 같은 회원 id다(목). `Viewer.id = me.id`, `Viewer.memberId = me.member.id`.

## 4. 앱 셸 (셸 담당)

```ts
// app/router.tsx
export const routes: RouteObject[];           // 요구사항 3-2 트리 전체. 화면은 `lazy: () => import(...)` (Component 기본 export)
export function createAppRouter(): Router;    // createBrowserRouter(routes)
// app/AppProviders.tsx
export function AppProviders(p: { client: ApolloClient; children: ReactNode }): JSX.Element;
//   ToastProvider > ApolloProvider > SessionProvider > ConfirmProvider > children
// app/main.tsx — isMockMode면 `await (await import('@/mocks/browser')).startMockWorker()` 후 렌더. 목 모드면 DevToolbar도 lazy 렌더
// guards/*.tsx — 각 가드는 <Outlet/>을 감싸는 라우트 element. 이름: PublicOnly · PendingOnly · RequireActiveMember · RequireAdmin · TeamScope · RequireTeamLeader
//   TeamScope: teamId 형식 검사 → TeamScopeQuery(team(id){ id name isPublic viewerRole memberCount }) → useTeamScope()로 하위에 제공
export function useTeamScope(): { team: { id: string; name: string; isPublic: boolean; viewerRole: 'LEADER' | 'MEMBER' | null; memberCount: number }; refetch(): void };
// layouts/: RootLayout · BareLayout · AppLayout(Header · HeaderSearch · Drawer) · AdminLayout
```

화면 파일(웨이브 2가 채운다)은 설계서 9장 경로 그대로. 각 파일은 **기본 export 컴포넌트**. 셸 담당이 자리표시로 먼저 만든다:

```tsx
export default function TeamBoardPage() { return <Placeholder id="TM-05" title="팀 현황판" />; }
```

`Placeholder`는 `@/features/errors/components/Placeholder` (셸 담당).

## 5. `@/mocks` (목 담당)

```ts
// mocks/control.ts
export type PersonaKey = 'member' | 'plain' | 'noteam' | 'penalty' | 'pending' | 'rejected';
export const MOCK_PERSONAS: { key: PersonaKey; label: string; memberId: string }[];
export function mockTokenFor(p: PersonaKey): string;          // 'mock.<memberId>'
export type MockControl = { failure: 'none' | 'network' | 'server' | 'slow'; failOnce: string | null; now: string; grass: 'auto' | 'ok' | 'failed' | 'identity'; latency: number };
export function getMockControl(): MockControl;
export function setMockControl(p: Partial<MockControl>): void; // localStorage 'glog.mock'
export function resetMockDb(): void;                           // 시드로 되돌림 (테스트 beforeEach)
// mocks/browser.ts
export async function startMockWorker(): Promise<void>;        // onUnhandledRequest: 'bypass'
// mocks/node.ts
export const server: SetupServerApi;
// mocks/handlers.ts
export const handlers: RequestHandler[];
// mocks/errors.ts
export function gqlError(code: ErrorCode, opts?: { field?: string; message?: string }): GraphQLError; // extensions { code, classification, field }
// mocks/DevToolbar.tsx
export default function DevToolbar(): JSX.Element;
// mocks/resolvers/<area>.ts — 각 파일은 `export const <area>Resolvers: Resolvers` ({ Query?, Mutation?, 타입별 필드 })
//   area: auth · common · activity · teams · posts · notices · profile · admin
```

로그인 코드 형식: `mock-<PersonaKey>` (그 외 → `LOGIN_CODE_INVALID`). 같은 코드 재사용도 허용(새로고침 대비)하되 **잘못된 코드만** 실패.

## 6. 테스트 하네스 (테스트 담당)

```ts
// test/setup.ts — jest-dom, msw server listen/resetHandlers/close, beforeEach: localStorage.clear() + resetMockDb()
// test/render.tsx
export function renderRoute(path: string, o?: { as?: PersonaKey | null; now?: string }): RenderResult & { user: UserEvent; router: Router };
//   as 기본 'member'. null이면 비로그인. tokenStore.set(mockTokenFor(as)) · setMockControl({ now }) 후
//   createApolloClient() + createMemoryRouter(routes, { initialEntries: [path] }) + <AppProviders>.
export function renderWithProviders(ui: ReactElement, o?: { as?: PersonaKey | null }): RenderResult & { user: UserEvent };
```
