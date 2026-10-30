# src/mocks — 브라우저 안 가짜 백엔드

실서버(Spring) 없이 모든 화면이 돌게 하는 목 서버. 화면 코드는 이 폴더를 모른다 — Apollo가 `/graphql`로 보내는 요청을 MSW가 가로채
`docs/api/schema.graphql`(계약 SDL)을 그대로 실행한다. 실서버로 바꿀 때 화면 코드는 바뀌지 않는다.

```
fetch /graphql ──MSW──▶ handlers.ts ─ 장애 주입 · 지연 ─▶ executeMock() ─▶ schema.ts (SDL + 리졸버 + 가드)
                                                              context = { auth, viewer, clock }
POST /api/members/me/profile-image ──▶ handlers.ts (multipart · 5MB · jpg/png/webp)
```

| 파일 | 하는 일 |
|---|---|
| `control.ts` | 페르소나 · `mockTokenFor` · 제어판(`glog.mock`) · `resetMockDb` |
| `clock.ts` | 목 기준 시각 `currentClock()` · 잔디 갱신 시각 · 판정 실행 시각 · DevToolbar 프리셋 |
| `errors.ts` | `gqlError(code, { field, message })` → `extensions { code, classification, field }` |
| `context.ts` | `Authorization: Bearer mock.<id>` → `{ auth, viewer, clock }` |
| `schema.ts` | SDL + 영역 리졸버 합치기 + 루트 필드 가드 · `executeMock()` |
| `handlers.ts` · `browser.ts` · `node.ts` | MSW 핸들러 · 브라우저 워커 · 테스트 서버 |
| `db/store.ts` | 메모리 테이블 · `touch()` · id 발급 · 단순 조회 |
| `db/seed.ts` | 시드 (목업 v2 숫자) |
| `db/derive.ts` | 서버 계산 흉내 (인증일 · 진행 상태 · 경고 replay · 마스킹 · 미리보기) |
| `views.ts` | 행 → GraphQL 객체 빌더 (조회자별 마스킹 · `viewerCan*`) · `paginate` · 권한 헬퍼 |
| `resolvers/<area>.ts` | `auth · common · activity · teams · posts · notices · profile · admin` |
| `DevToolbar.tsx` | 왼쪽 아래 "목 모드" 알약 |

## 페르소나 (설계서 8-2)

로그인 코드 `mock-<key>` → 토큰 `mock.<memberId>`. 같은 코드 재사용 가능, 모르는 코드만 `AUTH_CODE_INVALID`.

| key | id | 회원 | 상태 |
|---|---|---|---|
| `member` | 1 | 한동관 `@handong-gwan` | ACTIVE · **관리자** · A팀(1) 팀장 · 알고리즘 스터디(2) 팀원 · 받은 초대 2 |
| `plain` | 2 | 김철수 `@chulsoo-kim` | ACTIVE · A팀 팀원 · 이번 주 통과 조건 충족 |
| `noteam` | 5 | 서연 `@seoyeon-lee` | ACTIVE · 팀 없음(9/29 탈퇴) · 받은 초대 1 (A팀) |
| `penalty` | 6 | 박지훈 `@jihoon-park` | ACTIVE · 경고 3 · 벌칙 대상(9/21 주 도달) |
| `pending` | 9 | 정다은 `@daeun-jung` | PENDING (제한 토큰: `me` · `clock` · `logout`만) |
| `rejected` | 10 | 최민재 `@minjae-choi` | REJECTED (제한 토큰) |

그 밖: 회원 30명(대기 3 · 거절 1) · 팀 6개(1 A팀 공개 · 2 알고리즘 스터디 비공개 · 3 웹 프로젝트 B팀 공개 · 4 모바일 스터디 **삭제됨** ·
5 데이터 엔지니어링 팀 공개 · 6 클라우드 인프라 스터디 비공개) · 글 38개(트러블슈팅 23 · 개발일지 15) + 삭제된 글 1 ·
판정 8/24 ~ 9/21 5주(9/7 전체 면제, 9/21 = 통과 18 · 미달 4 · 면제 2 · 첫 참가 1 · 보류 1) · 공지 6(고정 시스템 공지 = 잔디 인정 규칙).
id 형식: 회원 · 팀 · 판정 · 경고 · 공지 = bigint 문자열, 글 · 댓글 = ObjectId 24 hex (`seedPostId('redisTtl')`로 찾기).

## 제어판 (`control.ts`, localStorage `glog.mock`)

| 값 | 효과 |
|---|---|
| `failure` | `network` = `HttpResponse.error()` · `server` = 첫 루트 필드에 `INTERNAL` · `slow` = 3초 |
| `failOnce` | 다음 한 번만 그 operationName을 `INTERNAL`로 |
| `now` | 목 기준 시각 (기본 `env.mockNow` = 2026-10-01 10:00 KST). 시드 행은 `createdAt` · 판정 `executedAt`이 now 이후면 안 보인다 → "월 03:00"이면 9/21 판정이 아직 없다 |
| `grass` | `auto`(시드) · `ok` · `failed` · `identity` — **조회자 본인 잔디에만** 적용 |
| `latency` | 응답 지연 ms (기본 `env.mockLatency`, 테스트 0) |

## 접근 규칙 (schema.ts 가드 — 리졸버에서 다시 검사하지 않아도 된다)

- 공개: `clock` · `exchangeLoginCode` · `logout`
- `me`: 토큰 없음 → `null` · 잘못된 토큰 → `UNAUTHENTICATED` · 대기 · 거절도 허용
- 그 밖: 토큰 없음/잘못됨 → `UNAUTHENTICATED` · PENDING → `ACCOUNT_PENDING` · REJECTED → `ACCOUNT_REJECTED`
- `resolvers/admin.ts`에 넣은 루트 필드는 전부 관리자 전용 → MEMBER면 `FORBIDDEN`
- 팀 소속 · 팀장 · 작성자 같은 **데이터 권한**은 리졸버(또는 뷰)에서: `requireTeamMember` · `requireTeamLeader` · `canEditPost` · `canDelete` · `canEditComment`

## 뮤테이션 추가하기 (웨이브 2)

자기 영역 파일의 `notImplemented` 자리를 바꾼다. 다른 영역 파일은 건드리지 않는다.

```ts
// resolvers/posts.ts
import type { MutationAddCommentArgs } from '../__generated__/schema-types';
import { db, findPost, nextObjectId, touch } from '../db/store';
import { gqlError, invalid } from '../errors';
import { commentView, requireViewer } from '../views';

addComment: (_: unknown, { postId, content }: MutationAddCommentArgs, ctx: MockContext) => {
  const viewer = requireViewer(ctx);                       // 가드 통과 = ACTIVE 회원
  const post = findPost(postId);
  if (!post) throw gqlError('NOT_FOUND');
  if (post.deletedAt) throw gqlError('POST_DELETED');
  const text = content.trim();
  if (text.length < 1 || text.length > 500) throw invalid('content');
  const row = { id: nextObjectId('comments'), postId, authorId: viewer.id, content: text,
                createdAt: ctx.clock.now, updatedAt: null, deletedAt: null };
  db.comments.push(row);
  touch();                                                // ← 꼭. version이 올라가 미리보기 basis가 바뀐다
  return commentView(ctx, row);                           // ← 결과는 항상 views 빌더로
},
```

규칙
1. 입력 검사 실패는 `invalid('<입력 필드>')` (= `VALIDATION_FAILED` + `extensions.field`). 도메인 오류는 `gqlError('<코드>')`.
2. 행을 고쳤으면 `touch()`. 시각은 `ctx.clock.now`(새 행은 항상 보인다). id는 `nextId('<table>')` · `nextObjectId('posts' | 'comments')`.
3. 결과 객체는 `views.ts` 빌더로 만든다 (`postView` · `teamView` · `memberView` · `noticeView` · `recalcPayloadView` …). 하위 필드는 알아서 풀린다.
4. 재계산 조작(정정 · 소급 면제 · 경고 복구 · 이행 체크 · 개인 면제 승인): 첫 줄에서 `assertBasis(expectedBasis)` → 행 수정 → `touch()` → `recalcPayloadView(ctx, memberId, judgment)`.
   경고 수 · 연속 · 벌칙은 저장하지 않는다 — `derive.replayWarnings()`가 판정 이력에서 매번 다시 계산한다. 그러니 **판정 행과 경고 행만 바르게 고치면 된다**:
   - 미달 → 통과/면제 정정: `judgment.status` · `corrected = true` + 그 주 `warning.retractedAt = now`
   - 통과 → 미달 정정: 경고 행 추가(`teamIds` = 지금 소속 팀, `judgmentId`)
   - 추방: 그 팀을 `warning.teamIds`에서 빼고, 비면 `warning.deleted = { reason: 'KICKED', at }` (팀 삭제는 `'TEAM_DELETED'`)
   - 경고 복구: `deleted = null`, `teamIds` = 살아 있는 `originalTeamIds`
   - 이행 체크: `db.penaltyFulfillments.push({ effectiveWeekStart: ctx.clock.currentWeekStart, … })`
5. 미리보기 쿼리는 이미 구현돼 있다 — 반영 결과가 미리보기와 같아야 한다 (`correctionScenario` · `weekExemptionScenario` · `restoreWarningIds` 참고).

## 헬퍼 요약

`db/store.ts` — `db`(테이블) · `touch` · `nextId` · `nextObjectId` · `find{Member,Team,Post,Comment,Notice,Judgment,Warning,Invitation,ExemptionPeriod,PersonalExemption}` ·
`findMemberByLogin` · `liveTeam` · `teamsOfMember` · `membershipOf` · `membershipsOfTeam` · `isTeamMember` · `isTeamLeader` · `cmpTime` · `isAtOrBefore`

`db/derive.ts` — 보이기: `visiblePosts` · `visibleComments` · `allVisibleComments` · `visibleNotices` · `visibleJudgments` · `judgmentFor` ·
글: `isRecord` · `requiredSections` · `writtenDateOf` · `inFinalizedWeek` · 잔디: `grassCount` · `grassLevel` · `grassStatusOf` · `grassCalendarData` ·
주간: `weekActivity` · `liveWeek` · `currentWeekDays` · `exemptionPeriodOn` · `approvedPersonalExemption` ·
경고: `replayWarnings` · `warningState` · `warningHistory` · `teamWarningCount` · 미리보기: `recalcPreview` · `correctionScenario` · `weekExemptionScenario` · `currentBasis` · `assertBasis` ·
팀 표기: `teamLabel`(비공개 → PRIVATE, 조회자 무관) · `adminTeamLabel` · `publicTeamOf` · 관리자: `latestExecutedWeek` · `judgmentsOfWeek` · `judgmentCounts` · `isRetroactiveWeek` · `penaltyTargetIds` · `isMondayDate`

`views.ts` — `paginate(items, { first, after }, map, defaultFirst)` · `requireViewer` · `requireTeamMember` · `requireTeamLeader` · `canEditPost` · `canDelete` · `canEditComment` ·
`memberView` · `meView` · `teamView` · `postView` · `postLookupView` · `commentView` · `noticeView` · `judgmentView` · `weekActivityView` · `warningStateView` ·
`receivedInvitationView` · `sentInvitationView` · `exemptionPeriodView` · `personalExemptionView` · `adminJudgmentRowView` · `adminMemberRowView` ·
`recalcPreviewView` · `recalcPayloadView` · `penaltyTargetView` · `deletedWarningView` · `contentItems` · `contentRowView` · `pendingInvitationsFor`

## 테스트

`npx vitest run src/mocks` — `executeMock({ query, variables, authorization })`로 MSW 없이 스키마를 바로 실행한다.
화면 테스트는 `test/setup.ts`가 `server`(msw/node)를 켜고 매 테스트 `resetMockDb()` + `localStorage.clear()`를 한다.
주의: Vitest + jsdom에서는 jsdom `FormData`/`File`을 node fetch가 파일로 보내지 못한다 — 업로드 테스트는 multipart 본문을 직접 만든다(`mocks.test.ts` 참고).
