# A3. API 계약 초안 — 프론트 ↔ 백엔드 (GraphQL + REST 1개)

> 작성: API 계약 분석 담당 · 2026-10-02 · **초안**
> 기준 문서: 기능명세서 **v1.9** · 화면설계서 **v0.7** · DB명세서 **v0.4** · 목업 **v2**(2026-09-29 스크린샷 기준, HTML 9/30 갱신) · `_인수인계.md`
> 짝 파일: [`A3-schema.draft.graphql`](./A3-schema.draft.graphql) — 이 문서의 부록 A와 같은 내용이며 **그 파일이 원본**이다
> 표기: **(제안)** = 명세 근거 없음 · **(추측)** = 명세 취지에서 도출 · **[Q-xx]** = 화면설계서 5-4-10 미결 항목 · **C-xx** = 이 문서 9장 충돌 번호

---

## 1. 한눈에 보기

| # | 결론 | 근거 |
|---|---|---|
| 1 | **스키마 우선(schema-first)으로 간다.** Spring for GraphQL은 `schema.graphqls`를 먼저 두고 컨트롤러를 맞추는 방식이라, 이 초안 SDL을 그대로 백엔드 출발점으로 넘길 수 있다. 화면은 **이름 붙은 operation 문서(.graphql) + 생성 타입**에만 의존시키고, 목 ↔ 실서버 교체는 ApolloLink/네트워크 계층 한 곳에서만 일어나게 한다 | 기능명세서 0장 공통 스킬 · 11장 "앱은 같은 GraphQL 쿼리를 재사용" |
| 2 | 루트 필드는 **Query 28 · Mutation 36 = 64개**다. 인수인계 5-1의 "신설 5 + CRUD 18 = 23개"는 화면 요구를 다 담지 못한다(C-16) | 3장 · 6장 |
| 3 | **비공개 팀 마스킹은 서버가 한다.** 마스킹된 표기(`TeamLabel`)에는 일부러 `id`를 두지 않는다. 같은 `Team:{id}`가 실명 모양과 마스킹 모양으로 Apollo 정규화 캐시에 함께 들어가면 서로 덮어써서, 화면에 실명이 새거나 TM-01에서 내 팀 이름이 "비공개 팀"으로 깨진다 | 기능명세서 2장 · 화면설계서 5-2-4 · E-23 |
| 4 | **버튼 노출 같은 권한 판단은 서버 계산 필드로 받는다**(`viewerCanEdit` · `viewerCanDelete` · `viewerRole`). 비공개 팀 글은 팀 정보가 숨겨지므로 "내가 이 글 팀의 팀장인가"를 클라이언트가 스스로 계산할 수 없다 | BD-03 ④⑪ · 5-2-4 |
| 5 | **예상할 수 있는 상태는 오류가 아니라 데이터로 받는다.** 잔디 조회 실패(E-32) · 아이디 변경(E-08) · 삭제된 글(E-31) · 거절 계정(E-02)은 상태 필드나 union으로 내려와야, 화면 일부만 대체하라는 명세(CM-01 ② 배너 등)를 지킬 수 있다 | 5-4 각 예외의 "처리" 열 |
| 6 | Spring for GraphQL의 기본 오류 분류는 `extensions.classification`에 `UNAUTHORIZED / FORBIDDEN / NOT_FOUND / BAD_REQUEST / INTERNAL_ERROR`로 실린다. `UNAUTHENTICATED`가 아니다. 또 **만료 토큰은 JWT 필터에서 HTTP 401로 먼저 끊긴다.** E-03은 두 경로를 모두 잡아야 하고, 도메인 코드는 `extensions.code`로 따로 합의한다 | 7장 |
| 7 | **승인 대기 회원에게도 인증 수단이 필요하다.** AU-03 ⑤ "승인됐는지 확인"과 ④ `@{githubLogin}`은 본인 조회가 필요한데 FC-03은 승인 후에만 토큰을 저장한다(C-01). 해법으로 **본인 상태 조회 전용 제한 토큰** **(제안)**을 낸다. 상태는 토큰 클레임이 아니라 매 요청 DB 값으로 판단해야 승인 직후 재발급 없이 반영된다 | 4장 |
| 8 | **재계산을 일으키는 조작(정정 · 소급 면제 · 경고 복구 · 이행 체크)은 낙관적 갱신을 하지 않는다.** 미리보기는 별도 Query로 두고, 반영 직전 재검증용 `basis`를 **선택 필드**로 둔다. 인수인계가 "잘라낼 순서 3번"으로 꼽은 기능이라, 잘라내도 스키마가 바뀌지 않는다. 미리보기가 필요한 곳은 인수인계의 2개가 아니라 **4개**다 | 기능명세서 7장 · 8장 |
| 9 | **[Q-06] 페이지네이션이 스키마를 가장 넓게 흔든다.** 초안은 커서 Connection(`nodes + pageInfo + totalCount`)으로 통일하고, 프론트는 페이지 훅으로 감싸 방식이 바뀌어도 화면이 그대로 있게 한다. 다만 목업 W-15와 AD-01 와이어프레임의 **번호형 페이지는 커서와 맞지 않는다**(C-06) | 8장 |
| 10 | 미결 13건 중 **스키마 모양을 바꾸는 것은 Q-05 · Q-06 · Q-11뿐**이다. Q-01 · Q-12 · Q-13은 nullable 또는 선택 필드로 초안에 미리 흡수했다. 나머지는 서버 계산 결과만 바꾼다 | 10장 |

---

## 2. 공통 계약

### 2-1. 전송 · 엔드포인트

| 항목 | 계약 | 근거 |
|---|---|---|
| GraphQL | `POST {API_ORIGIN}/graphql` 하나. `Content-Type: application/json` | 기능명세서 10장 "요청 주소가 /graphql 하나" |
| REST 예외 | `POST {API_ORIGIN}/api/members/me/profile-image` (multipart) **1개뿐** — 5장 | 기능명세서 8장 · PR-02 비고 "이미지 업로드만 REST" |
| 인증 리다이렉트 | `/oauth2/authorization/github` · `/login/oauth2/code/github`는 API가 아니라 **브라우저 이동 경로**다. Spring Security 기본 경로를 쓴다 **(제안)** | 기능명세서 1장 · FC-03 |
| 인증 헤더 | `Authorization: Bearer <JWT>`. 쿠키를 쓰지 않으므로 CORS에 `credentials`가 필요 없다 | 기능명세서 0장 "JWT 인증" · 10장 CORS |
| HTTP 수준 권한 | `/graphql`은 HTTP에서 permitAll로 열고, 권한은 전부 **메서드 단위 `@PreAuthorize`**로 건다. 그래야 비로그인 `exchangeLoginCode` · `clock` · `me`가 동작한다 **(제안)** | 기능명세서 10장 · 5-2-3 |
| 실시간 | 구독(Subscription) · 폴링을 두지 않는다. 승인 확인도 버튼 재조회다 | FC-03 비고 "AU-03에서 승인을 폴링하지 않는다" · 기능명세서 0장 알림 제외 |

### 2-2. 이름 · 값 규칙

| 항목 | 규칙 | 근거 |
|---|---|---|
| enum 값 | **DB ENUM 값과 글자까지 같게** 둔다(`PASS/FAIL/EXEMPT/EXCLUDED/HOLD` 등). DB 컬럼이 아닌 계산 값만 새 이름을 쓰고 (제안)/(추측)을 붙였다 | DB명세서 1장 · 부록 DDL |
| 화면 라벨 | 서버는 enum만 보내고, 문구 매핑은 프론트 한 곳에서 한다(3-1 표). 앱도 같은 표를 쓴다 | 5-2-8 문구 규칙 |
| ID | 모두 GraphQL `ID`(문자열). MariaDB BIGINT와 MongoDB ObjectId(24자)를 구분하지 않는다 | DB 1-0 · 3-1 |
| 날짜 | `Date` = `yyyy-MM-dd`(KST). **주차는 그 주 월요일 `Date` 하나**로 식별한다 | DB 1-0 주차 표기 · 기능명세서 5장 |
| 시각 | `DateTime` = ISO-8601 + `+09:00`. DB DATETIME은 KST 값이므로 서버가 오프셋을 붙인다 **(제안)** | DB 1-0 시간대 |
| 서버 시각 | `clock { now currentWeekStart currentWeekEnd }`로 받는다. **주차 경계 · E-27 배너 · "이번 주에서 → 비활성"(AC-01 ①)을 브라우저 시계로 계산하지 않는다** **(제안)** | E-27 "클라이언트 시계 무시" |
| 스칼라 구현 | 백엔드는 graphql-java-extended-scalars의 Date · DateTime을 쓰면 된다 **(제안)** | — |

### 2-3. 설계 원칙 6개

1. **실명과 마스킹 표기를 다른 타입으로 둔다.** 실명은 `Team`(정규화 대상), 마스킹은 `TeamLabel { kind, name }`(값 객체, id 없음), 관리자 실명은 `AdminTeamLabel`로 쓴다. 비공개 팀 실명은 **볼 자격이 있는 경로로만** 내려간다: 내 팀 목록, 팀 현황판, 받은 초대(TM-04 ①), BD-04 셀렉트(⑨), 관리자 경고 복구 · 벌칙. 근거는 5-2-4와 기능명세서 9장이다.
2. **권한 판단은 서버가 계산해 내려준다.** `viewerRole` · `viewerCanEdit` · `viewerCanDelete` · `viewerIsAuthor` · `canRetry` · `canCorrect`가 그 필드다. 화면 가드는 1차 방어일 뿐이다(5-2-3).
3. **같은 `Team`에 중첩 경로로도 닿을 수 있다.** 예를 들어 `post.publicTeam`, `member.publicTeams`, `myInvitations.team`이다. 그래서 `Team.currentWeekBoard` · `members` · `inviteCode` · `pendingInvitations` · `managedContents` · `exemptionRequests`는 루트 `team(id)`만이 아니라 **필드 단위로 권한을 검사**해야 한다. 대안으로 팀원 전용 필드를 별도 타입(예: `TeamWorkspace`)으로 떼어 `team(id)`에서만 닿게 할 수도 있다 **(제안 — 백엔드 선택)**.
4. **예상할 수 있는 상태는 데이터로 받는다.** `GrassFetchStatus`, `PostLookup = Post | DeletedPost`, `AuthPayload.status`, `LiveWeekStatus`가 그 예다. 오류는 정말 예외인 경우(권한 없음, 없는 리소스, 검증 실패, 서버 오류)에만 쓴다.
5. **판정 규칙은 서버 한 곳에 둔다.** "통과 예정 / 아직", 남은 인증일, 다음 차감까지 남은 주가 그런 값이다. 웹과 앱(RN)이 같은 규칙을 두 번 구현하지 않게 한다(기능명세서 11장).
6. **스키마는 늘리기만 한다.** 동결(3주차 말) 뒤에는 필드 · enum 값 추가만 허용한다. 프론트는 **모르는 enum 값이 와도 깨지지 않게** 기본 분기(예: "알 수 없음" 배지 대신 숨김)를 둔다.

### 2-4. N+1 · 성능 메모

목록의 중첩 필드는 `@BatchMapping`으로 묶는다(기능명세서 10장). 대상은 `Post.author` · `Post.commentCount` · `Post.publicTeam` · `TeamWeekRow.member` · `Team.memberCount` · `AdminJudgmentRow.member`다. 잔디 필드(`days`, `grassCalendar`)는 모두 **Redis 하루 캐시**를 읽고, 화면에서 GitHub를 직접 부르지 않는다(기능명세서 5장).

---

## 3. 화면별 필요 데이터

### 3-0. 화면 → 데이터 → 스키마 위치

| 화면 | 영역 | 필요한 데이터 | 스키마 위치 | 근거 · 비고 |
|---|---|---|---|---|
| **AU-01** | ③ | 로그인 시작(리다이렉트) | `GET /oauth2/authorization/github?client=web` **(제안)** | 기능명세서 1장 |
| AU-01 | ⑤ | 잔디 인정 규칙 6줄 | 비로그인이라 회원 API를 쓸 수 없다 → **프론트 정적 내장 (제안)** | 기능명세서 4장 표 · C-18 |
| AU-01 | ⑥ | 실패 · 취소 여부 | `/auth/callback?error=` → AU-01로 전달 | E-04 |
| **AU-02** | ①② | 일회용 코드 → 토큰 · 상태 | `exchangeLoginCode(code)` → `AuthPayload` | FC-03 · E-05~E-07 |
| **AU-03** | ④ | 신청한 GitHub 아이디 | `me.member.githubLogin` (제한 토큰) | C-01 |
| AU-03 | ⑤ | 현재 승인 상태 | `me.status` (network-only) | E-02 |
| **공통 헤더** | ④ | 아바타 · 닉네임 | `me.member { nickname profileImageUrl }` | 5-1-0-1 |
| 공통 헤더 | ③⑤ | **없음** — 입력 중 서버에 묻지 않는다 | — (Enter → BD-01 쿼리) | 5-1-0-1 ⑤ · 인수인계 9/30 |
| 드로어 | 배지 · 관리자 메뉴 | 받은 초대 수 · 관리자 여부 | `me.pendingInvitationCount` · `me.role` | 목업 W-03 · 4-3 |
| **CM-01** | ① | 닉네임 · 팀 소속 여부 | `me.member.nickname` · `me.hasTeam` | 5-2-7 |
| CM-01 | ② | 주 범위 · 요일 7칸 · 인증일 n/3 · 기록글 n/1 · 기준 시각 | `myWeek { days[].verified verifiedDays recordCount grassUpdatedAt }` | 5-2-6 |
| CM-01 | ③ | 통과 여부 · 남은 일수 · E-41 | `myWeek.live` · `myWarnings.state.weeksUntilDeduction` | E-41 |
| CM-01 | ④ | 경고 n/3 · 벌칙 대상 · E-40 | `myWarnings.state { activeCount isPenaltyTarget }` | E-40 |
| CM-01 | ⑤ | 받은 초대 수 | `me.pendingInvitationCount` | 0이면 영역 숨김 |
| CM-01 | ⑥ | E-39 · E-32 · E-36 · E-46 판단값 | `myWeek { privateContributionSuspected grassStatus live { status skipReason } }` | 우선순위 적용은 프론트 |
| CM-01 | ⑦⑧ | 공지 3건(고정 먼저) | `notices(first: 3)` | EX-CM01-01 |
| CM-01 | E-39 [설정 방법] | 잔디 인정 규칙 공지 id | `grassRuleNotice { id }` **(제안)** | — |
| **AC-01** | ① | 주 이동 · 이번 주면 → 비활성 | `clock.currentWeekStart` · `myWeek(weekStart)` | AC-01 ① 제안 |
| AC-01 | ② | 7행: 날짜 · 잔디(칸 수 · 단계) · 기록글(개수) · 인증일 · 내역 · "진행 중" · 기준 시각 | `myWeek.days[]` — **지난 주는 boolean만** | C-07 |
| AC-01 | ④ | 인증일 n/3 · 기록글 n/1 · 문구 | `myWeek.live` | 이번 주만 |
| AC-01 | ⑤ | 지난 판정: 주차 · 인증일 · 기록글 · 결과 | `member(id).judgmentHistory` | 첫 참가 = `EXCLUDED + FIRST_WEEK` |
| **AC-02** | ①② | 누적 경고 · 벌칙까지 · 연속 통과 n/2 | `myWarnings.state` | Q-10 |
| AC-02 | ③ | 발생 주차 · 사유 · 카테고리 · 상태 | `myWarnings.history[] { categories: [TeamLabel] standing }` | Q-13 · C-02 |
| **TM-01** | ③ | 받은 초대 수 | `me.pendingInvitationCount` | |
| TM-01 | ④~⑧ | 이름 · 팀장 여부 · 공개 · 팀원 수 · 통과/미달/아직 | `myTeams { name viewerRole isPublic memberCount currentWeekSummary }` | C-12 |
| **TM-02** | ⑤⑥ | 생성된 팀 id · 초대코드 | `createTeam` → `CreateTeamPayload { team inviteCode }` | Q-01 |
| **TM-03** | ②③ | 참가한 팀 id 또는 오류 코드 | `joinTeamByInviteCode(code)` | E-10 · E-11 · E-12 |
| **TM-04** | ① | 팀 실명 · 초대한 팀장 · 받은 날짜 | `myInvitations { team invitedBy createdAt }` | C-09 |
| **TM-05** | ①~④ | 팀 이름(실명) · 공개 · 팀장 여부 | `team(id) { name isPublic viewerRole }` | E-09 · E-53 |
| TM-05 | ⑤ | 주 범위 · 기준 시각 | `currentWeekBoard { weekStart weekEnd grassUpdatedAt }` | 5-2-6 |
| TM-05 | ⑥ | 팀원별 이름 · 나 · 7칸 · 인증일 · 기록글 · **이 팀 경고** · 상태 | `currentWeekBoard.rows[]` — **누적 경고 · 벌칙 여부 없음** | 기능명세서 2장(확정) · C-17 |
| TM-05 | ⑦⑧ | 이 팀 글 5건 | `recentPosts(first: 5)` | Q-12 |
| TM-05 | ⑨ | 빈 상태 판단 | 프론트 계산(전원 인증일 0 · 기록글 0) | |
| **TM-06** | ① | 초대코드 | `team.inviteCode` (Q-01에 따라 null) | |
| TM-06 | ②③ | 보낸 초대 | `pendingInvitations` | |
| TM-06 | ④~⑥ | 팀원 · 아이디 · 팀장 | `members { member role }` | |
| TM-06 | ⑦ | 공개 여부 | `isPublic` | |
| TM-06 | ⑧ | 팀 글 · 댓글 | `managedContents` | 수정만 |
| **TM-08** | ①② | 팀원 + 본인 · 이번 주/다음 주 | `team.members` · `clock` | TM-08 ② 제안 |
| TM-08 | ⑤ | 요청 · 상태 · 거절 사유 | `team.exemptionRequests` | C-10 |
| **BD-01** | ① | 검색 시 탭별 건수 | `postTypeCounts(filter)` **(제안)** | 목업 W-05 |
| BD-01 | ④ | 인기 태그 10 | `popularTags(type)` **(제안)** | |
| BD-01 | ⑥~⑩ ⑬ | 제목 · 태그 · 공개 팀 이름 · 작성자 · 날짜 · 댓글 수 · 인증 미포함 · 결과 수 | `posts { nodes { title tags publicTeam author createdAt commentCount isRecord } totalCount }` | E-25 |
| BD-01 | ⑪ | 다음 페이지 | `pageInfo` | Q-06 · E-57 |
| **BD-03** | ①~⑧ | 종류 · 제목 · 작성자 · 시각 · (수정됨) · 태그 · 공개 팀 · 본문 · 커밋 | `post(id)` → `Post` | |
| BD-03 | ④⑪ | 수정 · 삭제 노출 | `viewerCanEdit` · `viewerCanDelete` (글 · 댓글 각각) | BD-03 비고 |
| BD-03 | E-28 | 판정이 끝난 주의 글인가 | `writtenDate` < `clock.currentWeekStart` | |
| BD-03 | 삭제됨 | 삭제 안내(404와 구분) | `DeletedPost` | E-31 |
| **BD-04** | ②~⑧ | 수정 모드 기존 값 | `post { type title sections tags commitUrls }` | |
| BD-04 | ⑨ | 내 팀 목록 + 현재 연결 팀 | `myTeams` · `post.editTeamId` | |
| BD-04 | 팀장 수정 배너 | 남의 글을 수정 중인가 | `viewerCanEdit && !viewerIsAuthor` | BD-04 비고 |
| BD-04 | E-27 | 서버 시각 | `clock.now` | |
| **NT-01 · NT-02** | 전부 | 공지 목록 · 상세 | `notices` · `notice(id)` | |
| **PR-01** | ①~③ | 사진 · 닉네임 · 아이디 | `member(id)` | |
| PR-01 | ④⑤ | 본인 여부 · 관리자 여부 | `me.id == member.id` · `me.role` | ⑤는 웹만 |
| PR-01 | ⑥ | 게시글 수 · 댓글 수 | `postCount` · `commentCount` | DB 4-5 |
| PR-01 | ⑦ | 잔디 12개월 · 기준 시각 · E-08/E-32/E-39 | `grassCalendar` | |
| PR-01 | ⑧⑨ | 경고 합계 · 벌칙 · 팀별(중복 집계) | `warningState { activeCount isPenaltyTarget byCategory }` | C-17 · C-19 |
| PR-01 | ⑩⑪ | 진행 중 + 지난 8주 · 더 보기 | `currentWeek` · `judgmentHistory(first: 8)` | |
| PR-01 | ⑫ | 공개 소속 팀 · 이동 가능 여부 | `publicTeams { viewerRole }` | |
| **PR-02** | ①~③ | 현재 사진 · 기본 이미지로 | `me.member.profileImageUrl` · `resetProfileImage` | |
| PR-02 | ②④ | 파일 업로드 | **REST** (5장) | E-55 · E-56 |
| **AD-01** 공통 ② | 메뉴 배지 | 처리 대기 건수 | `adminDashboardSummary` | AD-01 비고 "한 번에 받아 공유" |
| AD-01 ⑤ | 카드 4개 | 승인 대기 · 이번 주 미달 · 벌칙 대상 · 면제 요청 대기 | `adminDashboardSummary` | C-13 |
| AD-01 ⑥~⑧ | 판정 결과 | 주차 · 검색 · 필터 · 집계 · 실행 시각 · 행 | `adminJudgmentWeek(weekStart) { counts executedAt rows(filter, search) }` | |
| AD-01 ⑨ | 보류 | 보류 목록 · 사유 · 재시도 가능 여부 | `heldJudgments` · `canRetry` | E-08 · E-32 |
| AD-01 ⑩ | 정정 패널 | 미리보기 → 반영 | `judgmentCorrectionPreview` → `correctJudgment` | 기능명세서 7장 |
| AD-01 ②-1 | 경고 복구 · 벌칙 | 벌칙 대상 · 이행 · 삭제된 경고 · 복구 | `penaltyTargets` · `fulfillPenalty` · `deletedWarnings` · `restoreWarningPreview` · `restoreWarning` | 비공개 팀 실명 |
| AD-01 ②-2 | 가입 승인 | 목록 · 승인 · 거절 · 되돌리기 | `adminMembers` · `approveMember` · `rejectMember` · `revertMemberToPending` | |
| AD-01 ②-3 | 면제 관리 | 기간 · 소급 미리보기 · 개인 요청 | `exemptionPeriods` · `exemptionPeriodPreview` · `personalExemptionRequests` · `personalExemptionApprovalPreview` | C-04 · C-05 |
| AD-01 ②-4 | 공지 관리 | 목록 · 작성 · 수정 · 삭제 · 고정 | `notices` · `createNotice` · `updateNotice` · `deleteNotice` · `setNoticePinned` | |
| AD-01 ②-5 | 게시물 관리 | 글 + 댓글 혼합 목록 · 삭제 | `adminContents` · `deletePost` · `deleteComment` | 팀 열 없음 |
| **CM-02** | — | 없음(오류 코드로 상태 결정) | — | |

### 3-1. enum → 화면 라벨 매핑 (프론트 한 곳에 둔다)

| enum | 값 | 화면 라벨 | 근거 |
|---|---|---|---|
| `JudgmentStatus` | `PASS` | 통과 | PR-01 ⑩ · AC-01 ⑤ |
| | `FAIL` | 미달 / PR-01은 `hasActiveWarning`이면 "미달 (경고)" | 목업 W-14 `failw` |
| | `EXEMPT` | 면제 | |
| | `EXCLUDED` + `FIRST_WEEK` | 첫 참가 | AC-01 ⑤ · 목업 W-06 · W-15 |
| | `EXCLUDED` + `NO_TEAM` | 제외 | PR-01 ⑩ |
| | `HOLD` | 관리자: 보류(+사유). **회원 화면 라벨은 명세에 없다** | C-15 |
| (판정 전 이번 주) | `WeekActivity.isCurrentWeek` | 진행 중 | PR-01 ⑩ · 목업 W-14 `prog` |
| `LiveWeekStatus` | `CONDITION_MET` | TM-05 "통과" · AC-01 ④ "통과 예정" | TM-05 비고 |
| | `NOT_YET` | 아직 | TM-05 비고 · 목업 `pending` |
| | `EXCLUDED` · `EXEMPT` | 제외 **(제안)** · CM-01은 E-36 · E-46 배너 | TM-05 비고 제안 |
| `WarningStanding` | `ACTIVE` · `DEDUCTED` · `FULFILLED` | 유효 · 차감됨 · 이행 완료[Q-13] | AC-02 ③ · 목업 W-07 |
| `TeamLabelKind` | `PRIVATE` · `DELETED` | "비공개 팀" · "삭제된 팀" | E-23 · E-43 |
| `MemberStatus` | `PENDING` · `REJECTED` | 대기 · 거절 | AD-01 ②-2 |
| `PersonalExemptionStatus` | `PENDING` · `APPROVED` · `REJECTED` | 대기 중 · 승인됨 · 거절됨 · 사유: … | TM-08 ⑤ |
| `WarningDeleteReason` | `KICKED` · `TEAM_DELETED` | 추방 · 팀 삭제 | 목업 W-16 |
| `HoldReason` | `API_ERROR` | "GitHub 응답 실패로 아직 판정하지 못했어요." | AD-01 ⑨ |
| | `IDENTITY_MISMATCH` | "본인이 다시 로그인해야 풀려요" + [재시도] 비활성 **(제안)** | E-08 |
| `PenaltyChange` | `ENTER` · `RELEASE` | 벌칙 대상 진입 · 해제 | AD-01 ⑩ · E-42 · E-50 |
| `PostType` | `TROUBLESHOOTING` ↔ `?type=troubleshooting` / `DEVLOG` ↔ `devlog` | 트러블슈팅 · 개발일지 | 4-4 · BD-01 경로 |

---

## 4. 인증 흐름 (기능명세서 1장 · AU-01~AU-03 · FC-03)

### 4-1. 단계별 계약

| # | 단계 | 주체 | 계약 | 예외 |
|---|---|---|---|---|
| 1 | AU-01 ③ 클릭 | 웹 | `location.assign(API_ORIGIN + "/oauth2/authorization/github?client=web")`. 버튼을 "이동 중..."으로 바꾸고 비활성 | — |
| 2 | 복귀 대상 기억 | 백엔드 | `client=web\|app`을 세션 또는 쿠키에 담아 콜백까지 유지한다. Spring 기본 resolver에는 이 파라미터가 없어 커스텀 `OAuth2AuthorizationRequestResolver`가 필요하다 **(제안)**. 복귀 주소는 **허용 목록 2개(웹 origin · 앱 스킴)로만** 한다(오픈 리다이렉트 방지) | — |
| 3 | GitHub 승인 | GitHub → 백엔드 | `GET /login/oauth2/code/github` (Spring 기본). state 검증은 Spring이 한다 | 취소 → `error=access_denied` |
| 4 | 회원 upsert | 백엔드 | `github_id`로 찾고, 없으면 `PENDING`으로 생성한다. `github_login`은 매번 최신값으로 덮어쓴다 | DB 1-1 |
| 5 | 일회용 코드 발급 | 백엔드 | Redis `authcode:{code}` → memberId, **TTL 60초**, 1회 소비 후 삭제(`GETDEL`) | DB 2장 · E-05 · E-06 |
| 6 | 리다이렉트 | 백엔드 | 웹 `{WEB}/auth/callback?code=…` / 앱 `jandilog://auth?code=…`(4-4 제안). 실패 시 `{WEB}/auth/callback?error=access_denied\|server_error` **(제안)** | E-04 · E-07 |
| 7 | AU-02 진입 | 웹 | **코드를 읽자마자 `history.replaceState`로 주소에서 지운다**(새로고침 · 뒤로가기 재사용 방지). `error=access_denied`면 AU-01 + 토스트 "로그인이 취소됐어요." | E-04 |
| 8 | 토큰 교환 | 웹 → GraphQL | `mutation ExchangeLoginCode($code)` → `AuthPayload { status accessToken expiresAt me }`. 토큰 없이 호출한다 | `LOGIN_CODE_INVALID` → E-05 문구 |
| 9 | 분기 | 웹 | `ACTIVE` → 토큰 저장 → **CM-01(`/`)** / `PENDING` → 제한 토큰 저장 → AU-03 / `REJECTED` → 토큰 없음 → 거절 안내 | 4-3 기본 화면 · E-01 · E-02 |
| 10 | 승인 확인 | AU-03 ⑤ | `query PendingStatus { me { status member { githubLogin } } }` (network-only) → `ACTIVE`면 CM-01, `REJECTED`면 거절 안내, 그대로면 토스트 "아직 승인되지 않았어요." | E-02 |

> **React 개발 모드 함정.** `StrictMode`는 개발 중 effect를 두 번 실행한다. AU-02에서 교환을 effect로 부르면 **같은 코드로 두 번 교환**하게 되고, 두 번째가 E-05로 실패해 성공한 로그인이 실패 화면으로 바뀐다. 코드 단위로 진행 중인 Promise를 모듈 변수에 캐시해서 한 번만 부른다 **(제안)**.
> **3초 넘게 머무르면 실패로 전환한다(AU-02 비고 제안).** 교환 요청에 타임아웃을 건다.

### 4-2. 승인 대기 회원의 토큰 (C-01 해법 제안)

| 안 | 내용 | 장점 | 단점 |
|---|---|---|---|
| **A (권장 · 제안)** | `PENDING`에도 토큰을 발급한다. 서버는 **요청마다 DB에서 status · role을 읽어** 권한을 매긴다. `PENDING`이 부를 수 있는 것은 `me` · `clock` · `logout`뿐이고, 나머지는 `ACCOUNT_PENDING` | AU-03 ④⑤가 명세대로 동작한다. 승인 직후 같은 토큰이 그대로 회원 토큰이 된다(재발급 불필요) | FC-03 그림 수정 필요(승인 시에만 저장 → 대기도 저장) |
| B | 대기에는 토큰을 주지 않는다. ⑤를 누르면 GitHub 로그인을 다시 탄다 | FC-03 그대로 | ⑤가 "확인"이 아니라 재로그인이 된다. ④에 필요한 아이디도 따로 넘겨야 한다 |
| C | 토큰 클레임에 status를 넣고 승인 후 재발급한다 | 요청마다 DB를 읽지 않음 | 재발급 API(리프레시)가 새로 필요하다. 명세에 없음 |

### 4-3. 토큰 저장 위치 · 만료(E-03)

| 안 | 내용 | 장점 | 단점 |
|---|---|---|---|
| **localStorage** | **FC-03에 명시**("웹 localStorage · 앱 SecureStore") | 새로고침 유지, 구현 단순, 쿠키 · CORS 문제 없음 | XSS가 나면 토큰이 털린다 → 글 본문을 HTML로 렌더하지 않는다(텍스트 + 줄바꿈만, NT-02 ④와 같은 원칙), CSP 권장 |
| 메모리 + HttpOnly 리프레시 쿠키 | 액세스 토큰은 메모리에, 리프레시는 쿠키에 | XSS로 토큰을 직접 읽을 수 없다 | **리프레시 API가 명세에 없다.** Render(웹)와 Lightsail(API)이 다른 사이트면 쿠키가 크로스사이트가 되어 SameSite=None이 필요하고, Safari 등의 제3자 쿠키 차단에 걸린다. 같은 등록 도메인의 서브도메인으로 맞추면 가능 |
| sessionStorage | 탭 단위 | 탭을 닫으면 사라짐 | 새 탭마다 다시 로그인해야 한다 |

**초안 결정(팀 내부):** 1차는 **FC-03대로 localStorage**를 쓴다. 단 `tokenStore` 인터페이스(`get/set/clear`) 뒤에 숨겨서 저장 방식을 바꿔도 화면은 그대로 있게 한다.

**만료 처리(E-03) 계약**

1. **감지 경로 3개를 모두 잡는다.** ① HTTP 401(JWT 필터가 만료 · 위조 토큰을 GraphQL 전에 끊는다) ② GraphQL 오류 `extensions.code = UNAUTHENTICATED` 또는 `classification = UNAUTHORIZED` ③ 앱 시작 시 토큰 `exp`를 미리 확인한다 **(제안)**.
2. 처리: 토큰 폐기 → `apolloClient.clearStore()` → `/login` → 토스트 "로그인이 만료됐어요. 다시 로그인해 주세요." 동시에 401이 여러 개 와도 **토스트는 한 번만** 띄운다.
3. 다시 로그인하면 **항상 CM-01**로 간다. 원래 보던 화면으로 돌려보내지 않는다(4-3 "기본 화면은 홈으로 고정").
4. **위험:** BD-04에서 글을 쓰다 토큰이 만료되면 저장이 실패하고 재로그인하면서 글이 사라진다. 임시저장은 제외 범위(기능명세서 0장)라 복구할 수 없다 → **토큰 수명을 넉넉히(예: 7일) (제안)** 잡아 확률을 낮춘다. 리프레시 토큰이 없으니 수명이 곧 재로그인 주기다.
5. 로그아웃: `logout` 뮤테이션(무상태라 서버 처리 없음, 제안) → 토큰 폐기 → `clearStore()`. 다른 탭은 `storage` 이벤트로 함께 로그아웃시킨다 **(제안)**.
6. 앱(RN): 같은 `exchangeLoginCode`를 쓰고 저장만 SecureStore로 한다. 딥링크 스킴은 미확정이다(4-4 제안).

---

## 5. REST 예외 — 프로필 이미지 업로드 (기능명세서 8장 · PR-02)

| 항목 | 계약 **(제안)** |
|---|---|
| 업로드 | `POST {API_ORIGIN}/api/members/me/profile-image` |
| 헤더 | `Authorization: Bearer <JWT>`. **`Content-Type`을 직접 넣지 않는다** — 브라우저가 `multipart/form-data; boundary=…`를 붙인다. 직접 넣으면 boundary가 빠져 서버가 파싱하지 못한다 |
| 본문 | `FormData` 파트 `file` 1개. jpg · png · webp, **5MB 이하**(E-56 제안) |
| 200 | `{ "profileImageUrl": "https://<bucket>/profile/12/3f9c….webp" }` — 객체 키에 UUID를 넣어 브라우저 캐시를 피한다 |
| 401 | `{ "code": "UNAUTHENTICATED" }` → E-03 |
| 413 | `{ "code": "FILE_TOO_LARGE", "maxBytes": 5242880 }` → "5MB 이하 이미지만 올릴 수 있어요." |
| 415 | `{ "code": "UNSUPPORTED_MEDIA_TYPE", "allowed": ["image/jpeg","image/png","image/webp"] }` → "jpg, png, webp만 올릴 수 있어요." |
| 502 | `{ "code": "UPLOAD_FAILED" }` (S3 실패) → "사진을 올리지 못했어요. 다시 시도해 주세요." · 기존 이미지 유지(E-55) |
| 기본 이미지로 | 파일이 없으므로 GraphQL `resetProfileImage`를 쓴다(REST는 업로드 1개만 둔다는 원칙) |

**프론트 흐름(PR-02):** 파일 선택 → 크기 · 확장자 선검증(E-56) → 미리보기는 `URL.createObjectURL` → [저장] → 업로드한다. 기본 이미지로 되돌렸다면 `resetProfileImage`를 부른다 → 성공하면 `cache.modify`로 `Member:{id}.profileImageUrl`만 바꾼다 → PR-01 이동 + 토스트 "저장했어요." 실패하면 버튼을 되살리고 기존 사진을 유지한다.

**백엔드 · 인프라 확인 사항**

- **Nginx 기본 `client_max_body_size`는 1MB다.** 5MB 제한보다 먼저 Nginx가 **HTML** 413을 돌려준다 → `6m` 이상으로 올리고, 프론트는 **본문 형식과 무관하게 상태 코드로** 분기한다. Spring은 `spring.servlet.multipart.max-file-size=5MB`로 맞춘다.
- 서버는 확장자가 아니라 **파일 시그니처(매직 바이트)**로 형식을 검증한다. 휴대폰 사진의 **EXIF(GPS 위치)를 지운다** **(제안 — 고등학생 사용자 개인정보)**.
- CORS 허용 목록에 `/api/**`의 `POST`와 `Authorization` 헤더를 포함한다(기능명세서 10장 "웹 도메인만 허용").
- 앱(RN)은 `FormData`에 `{ uri, name, type }`을 넣는다. 계약은 같다.

---

## 6. 화면별 operation 목록

> 이름은 operation 문서 이름(PascalCase)이다. 화면 코드는 이 문서에서 생성된 훅 · 타입만 import한다. 루트 필드 정의는 부록 A.

### 6-1. Query

| operation | 루트 필드 | 변수 | 쓰는 화면 | fetchPolicy **(제안)** |
|---|---|---|---|---|
| `Bootstrap` | `clock` · `me { … member { … } }` | — | 앱 시작 · 라우터 가드 · 공통 헤더 ④ · 드로어 | cache-first, 로그인 · 로그아웃 시 재조회 |
| `PendingStatus` | `me { status member { githubLogin } }` | — | AU-03 ④⑤ | network-only |
| `HomeDashboard` | `myWeek` · `myWarnings { state }` · `notices(first: 3)` · `grassRuleNotice { id }` | — | CM-01 | cache-and-network |
| `MyWeek` | `myWeek(weekStart)` | `weekStart: Date` | AC-01 ①②④ | cache-and-network |
| `JudgmentHistory` | `member(id) { judgmentHistory(first, after) }` | `memberId, first, after` | AC-01 ⑤ · PR-01 ⑪ 더 보기 | cache-first + merge |
| `MyWarnings` | `myWarnings` | — | AC-02 | cache-and-network |
| `MyTeams` | `myTeams { … currentWeekSummary }` · `me { pendingInvitationCount }` | — | TM-01 | cache-and-network |
| `MyTeamOptions` | `myTeams { id name isPublic }` | — | BD-04 ⑨ | cache-first |
| `MyInvitations` | `myInvitations` | — | TM-04 | network-only |
| `TeamBoard` | `team(id) { name isPublic viewerRole currentWeekBoard recentPosts }` | `teamId` | TM-05 | cache-and-network |
| `TeamManage` | `team(id) { inviteCode members pendingInvitations managedContents isPublic }` | `teamId` | TM-06 | network-only |
| `TeamExemption` | `team(id) { members exemptionRequests }` · `clock` | `teamId` | TM-08 | network-only |
| `Posts` | `posts(filter, first, after)` | `filter: PostFilter!, first, after` | BD-01(헤더 검색 결과 포함) | cache-first + merge |
| `PostTypeCounts` | `postTypeCounts(filter)` | `filter` | BD-01 ① (`q`가 있을 때만) | cache-first |
| `PopularTags` | `popularTags(type, first)` | `type` | BD-01 ④ | cache-first |
| `PostDetail` | `post(id) { … on Post { … comments } … on DeletedPost { id } }` | `id` | BD-03 | cache-and-network |
| `PostForEdit` | `post(id)` · `myTeams` | `id` | BD-04 수정 모드 | network-only |
| `Notices` | `notices(first, after)` | `first, after` | NT-01 · AD-01 ②-4 | cache-first + merge |
| `NoticeDetail` | `notice(id)` | `id` | NT-02 | cache-first |
| `Profile` | `member(id) { … grassCalendar warningState currentWeek judgmentHistory(first: 8) publicTeams }` | `memberId` | PR-01 | cache-and-network |
| `ProfileEdit` | `me { member { id nickname profileImageUrl } }` | — | PR-02 | cache-first |
| `AdminSummary` | `adminDashboardSummary` | — | AD-01 레이아웃(배지) · ⑤ | cache-and-network |
| `AdminJudgments` | `adminJudgmentWeek(weekStart) { counts executedAt rows(filter, search, first, after) }` | `weekStart, filter, search, first, after` | AD-01 ⑥⑦⑧ | network-only |
| `HeldJudgments` | `heldJudgments` | — | AD-01 ⑨ | network-only |
| `JudgmentCorrectionPreview` | `judgmentCorrectionPreview` | `judgmentId, newStatus` | AD-01 ⑩ | **no-cache** |
| `AdminWarningsTab` | `penaltyTargets` · `deletedWarnings(first, after)` | `first, after` | AD-01 ②-1 | network-only |
| `RestoreWarningPreview` | `restoreWarningPreview` | `warningId` | AD-01 ②-1 ⑧ | no-cache |
| `AdminMembers` | `adminMembers` | `filter, search, first, after` | AD-01 ②-2 | network-only |
| `AdminExemptions` | `exemptionPeriods` · `personalExemptionRequests(status: PENDING)` | `first, after` | AD-01 ②-3 | network-only |
| `ExemptionPeriodPreview` | `exemptionPeriodPreview` | `weekStart, periodId, removing` | AD-01 ②-3 ⑥ | no-cache |
| `PersonalExemptionApprovalPreview` | `personalExemptionApprovalPreview` | `requestId` | AD-01 ②-3 ⑦ | no-cache |
| `AdminContents` | `adminContents` | `filter, search, first, after` | AD-01 ②-5 | network-only |

### 6-2. Mutation

| operation | 변수 | 쓰는 화면 · 영역 | 확인 다이얼로그 | 성공 후 이동 · 토스트 |
|---|---|---|---|---|
| `ExchangeLoginCode` | `code` | AU-02 | — | 상태별 분기(4-1 ⑨) |
| `Logout` | — | AU-03 ⑥ · 드로어 하단 | — | AU-01 |
| `CreateTeam` | `input` | TM-02 ④ | — | ⑤ 초대코드 표시 |
| `JoinTeamByInviteCode` | `code` | TM-03 ② | — | TM-05 · "팀에 참가했어요." |
| `InviteMember` | `teamId, githubLogin` | TM-06 ② | — | "초대를 보냈어요." |
| `CancelInvitation` | `invitationId` | TM-06 ③ | — | 행 제거 |
| `RespondInvitation` | `invitationId, accept` | TM-04 ②③ | — | 수락: TM-05 · 거절: "거절했어요." |
| `LeaveTeam` | `teamId` | TM-05 ④ | ○ | TM-01 · "팀에서 나왔어요." |
| `KickMember` | `teamId, memberId` | TM-06 ⑤ | ○ | 행 제거 |
| `TransferLeadership` | `teamId, memberId` | TM-06 ⑥ | ○ | TM-05 |
| `SetTeamVisibility` | `teamId, isPublic` | TM-06 ⑦ | — | "공개 설정을 바꿨어요." |
| `DeleteTeam` | `teamId` | TM-06 ⑨ · E-20 | ○ | TM-01 · "팀을 삭제했어요." |
| `RequestPersonalExemption` | `input` | TM-08 ④ | — | "요청을 보냈어요." |
| `CreatePost` | `input` | BD-04 ⑫ | 필수 항목이 비면 ⑭ 모달 | BD-03 · "등록했어요." |
| `UpdatePost` | `id, input` | BD-04 ⑫ | 〃 | BD-03 · "수정했어요." |
| `DeletePost` | `id` | BD-03 ④ · AD-01 ②-5 | ○ (E-28 문구 추가) | BD-01 · "삭제했어요." |
| `AddComment` | `postId, content` | BD-03 ⑫ | — | 목록 끝에 추가 · ⑨ +1 |
| `UpdateComment` | `id, content` | BD-03 ⑪ · TM-06 ⑧ | — | 인라인 |
| `DeleteComment` | `id` | BD-03 ⑪ · AD-01 ②-5 | ○ | ⑨ −1 |
| `ResetProfileImage` | — | PR-02 ③④ | — | PR-01 · "저장했어요." |
| (REST) 업로드 | `file` | PR-02 ②④ | — | 〃 |
| `RerunHeldJudgments` | `judgmentIds?` | AD-01 ⑦ [재시도] · ⑨ [전체 재시도] | ○ (⑨) | "{n}명 처리했어요." |
| `CorrectJudgment` | `input` | AD-01 ⑩ | 영향 미리보기형 | "정정했어요." |
| `FulfillPenalty` | `memberId` | AD-01 ②-1 ⑥ | ○ 단순 확인형 | "처리했어요." |
| `RestoreWarning` | `warningId, expectedBasis?` | AD-01 ②-1 ⑧ | 영향 미리보기형 | 행 제거 |
| `ApproveMember` | `memberId` | AD-01 ②-2 ⑦ | — (즉시) | "승인했어요." |
| `RejectMember` | `memberId` | AD-01 ②-2 ⑧ | ○ | 행 상태 전환 |
| `RevertMemberToPending` | `memberId` | AD-01 ②-2 ⑧ | — | 〃 |
| `CreateExemptionPeriod` · `UpdateExemptionPeriod` · `DeleteExemptionPeriod` | `input` / `id` | AD-01 ②-3 ⑤⑥ | 과거 주면 영향 미리보기형 | 목록 갱신 |
| `ApprovePersonalExemption` | `requestId, expectedBasis?` | AD-01 ②-3 ⑦ | 소급이면 미리보기 (C-04) | 행 제거 · 배지 −1 |
| `RejectPersonalExemption` | `requestId, reason` | AD-01 ②-3 ⑦ | 사유 입력 | 〃 |
| `CreateNotice` · `UpdateNotice` | `input` | AD-01 ②-4 ⑦ | — | 목록 복귀 |
| `DeleteNotice` | `id` | AD-01 ②-4 ⑥ | ○ | 행 제거 |
| `SetNoticePinned` | `id, pinned` | AD-01 ②-4 ⑥ | 해제만 ○(공통 요소 표) | 맨 위로 이동 |

---

## 7. 오류 코드 체계 → 화면 처리

### 7-1. 실리는 자리

```json
{
  "data": { "team": null },
  "errors": [{
    "message": "(화면에 쓰지 않는다)",
    "path": ["team"],
    "extensions": { "classification": "FORBIDDEN", "code": "FORBIDDEN" }
  }]
}
```

- **`classification`**: Spring for GraphQL이 기본으로 넣는다(`BAD_REQUEST` · `UNAUTHORIZED` · `FORBIDDEN` · `NOT_FOUND` · `INTERNAL_ERROR`). Spring Security 연동 시 인증 없음은 `UNAUTHORIZED`, 권한 없음은 `FORBIDDEN`으로 온다.
- **`code`**: 도메인 코드다 **(제안)**. 백엔드가 `DataFetcherExceptionResolverAdapter`에서 도메인 예외를 아래 표 코드로 바꿔 넣는다. 프론트는 `code ?? classification` 순서로 읽는다.
- **`message`는 화면에 쓰지 않는다.** 문구는 프론트가 코드로 고른다. 5-2-8이 "토큰 · 서버 · API · 401 · GraphQL 노출 금지"를 요구한다.
- 실행 전 단계 오류(문법 · 검증)는 서버와 클라이언트 버전에 따라 HTTP 4xx로 올 수도 있다. 오류 링크는 `networkError`와 `graphQLErrors`를 모두 본다.

### 7-2. 코드표

| code | classification · HTTP | 언제 | 화면 처리 | 문구(5-4 최종) | 예외 |
|---|---|---|---|---|---|
| `UNAUTHENTICATED` | `UNAUTHORIZED` · **또는 HTTP 401** | 토큰 없음 · 만료 · 위조 | 토큰 폐기 → AU-01 + 토스트 (4-3) | "로그인이 만료됐어요. 다시 로그인해 주세요." | E-03 |
| `ACCOUNT_PENDING` | `FORBIDDEN` | 대기 계정이 회원 기능 호출 | AU-03 강제 이동 | (AU-03 화면) | E-01 |
| `ACCOUNT_REJECTED` | `FORBIDDEN` | 거절 계정 | 거절 안내 화면 | "가입이 승인되지 않았어요. 동아리 운영진에게 문의해 주세요." | E-02 |
| `FORBIDDEN` | `FORBIDDEN` | 비소속 팀 · 남의 글 수정 · 비관리자의 관리자 기능 | 조회면 전체 화면 403 + [홈으로], 액션이면 토스트 | "이 페이지에 들어올 권한이 없어요." | E-09 · EX-TM05-01 |
| `NOT_FOUND` | `NOT_FOUND` | 없는 리소스(조회는 null로 오고, 액션 대상이 없을 때 이 코드) | 404 + [뒤로] | "찾는 내용이 없어요. 삭제됐을 수 있어요." | E-53 |
| `POST_DELETED` | `NOT_FOUND` | 삭제된 글에 수정 · 댓글 · 삭제 | 안내 + [목록으로] | "삭제된 글이에요." | E-31 · EX-BD03-02 · EX-BD04-02 |
| `LOGIN_CODE_INVALID` | `BAD_REQUEST` | 코드 재사용 · 만료 | AU-02 ② | "로그인 정보가 만료됐어요. 처음부터 다시 해주세요." | E-05 · E-06 |
| `VALIDATION_FAILED` | `BAD_REQUEST` | 길이 · 형식 · 개수. `extensions.field`에 필드명 | 인라인 · 빨간 테두리 | "{항목}을 입력해 주세요." / "{항목}은 {N}자까지 쓸 수 있어요." / E-29 · E-30 · E-61 · E-63 | 5-2-8 |
| `INVITE_CODE_NOT_FOUND` | `BAD_REQUEST` | | TM-03 ③ 인라인 | "그런 초대코드가 없어요. 다시 확인해 주세요." | E-10 |
| `ALREADY_TEAM_MEMBER` | `BAD_REQUEST` | 코드 참가 · 아이디 초대 · 초대 수락. `extensions.teamId`(참가 쪽만) | 화면별 문구 | E-11 "이미 참가한 팀이에요." + [팀 보러 가기] / E-16 "이미 팀에 있는 회원이에요." / E-17 "이미 참가한 팀이에요. 초대는 정리했어요." | E-11 · E-16 · E-17 |
| `TEAM_JOIN_BLOCKED` | `FORBIDDEN` | 추방 1년 차단. **남은 기간 등 부가 정보를 extensions에 넣지 않는다** | 인라인 | "이 팀에는 참가할 수 없어요. 팀장에게 문의해 주세요." | E-12 |
| `INVITEE_NOT_FOUND` | `NOT_FOUND` | 가입하지 않은 아이디 | 인라인 | "그 아이디의 회원을 찾을 수 없어요. 먼저 가입해야 초대할 수 있어요." | E-15 |
| `TEAM_GONE` | `NOT_FOUND` | 수락 시점에 팀 삭제됨 | 카드 제거 + 토스트 | "없어진 팀이에요." | E-18 |
| `LEADER_MUST_TRANSFER` | `BAD_REQUEST` | 팀장이 나가기 | 안내 | "팀장은 다른 팀원에게 팀장을 넘긴 뒤에 나갈 수 있어요." | E-19 |
| `LAST_MEMBER` | `BAD_REQUEST` | 혼자 남은 팀장 | 삭제 확인으로 전환 | "혼자 있는 팀이에요. 나가면 팀이 삭제돼요. 삭제할까요?" | E-20 (추측) |
| `EXEMPTION_DUPLICATE` | `BAD_REQUEST` | 같은 회원 · 주에 대기 · 승인 건 있음 | 토스트 | "이미 요청한 주간이에요." | E-47 |
| `JUDGMENT_NOT_CORRECTABLE` | `BAD_REQUEST` | `HOLD` 정정 시도 등 | 토스트(서버 오류 표준형) | — | 기능명세서 7장 |
| `SYSTEM_NOTICE_UNDELETABLE` | `BAD_REQUEST` | 잔디 인정 규칙 공지 삭제 | 토스트 | "이 공지는 판정 기준 안내라 삭제할 수 없어요." | EX-AD01-02 |
| `PREVIEW_STALE` | `BAD_REQUEST` | 미리보기 이후 상태가 바뀜(`expectedBasis` 불일치) | 미리보기 재조회 + 안내 | "다른 변경이 먼저 반영됐어요. 바뀐 결과를 다시 확인해 주세요." **(제안 문구)** | AD-01 ⑩ 비고 |
| `RECALC_BUSY` | `INTERNAL_ERROR` | 재계산 락 대기 초과 | 서버 오류 표준형 + [다시 시도] | 표준 서버 오류 문구 | Q-08 |
| `INTERNAL` | `INTERNAL_ERROR` · HTTP 5xx(배포 중 Nginx 502 포함) | 그 외 | 전체 화면 또는 토스트 + [다시 시도] | "잠시 문제가 생겼어요. 조금 뒤에 다시 시도해 주세요." | E-52 |
| (네트워크) | 응답 없음 | 오프라인 · DNS · 타임아웃 | **본문만 대체, 헤더 · 드로어 유지**, 입력 내용 유지 | "인터넷 연결을 확인해 주세요." + [다시 시도] | E-51 |

### 7-3. 부분 실패 정책 **(제안)**

- 기본 `errorPolicy: 'none'`: 오류가 하나라도 있으면 그 화면을 E-51 · E-52로 대체한다(5-2-8 표시 위치 4원칙 ④).
- **CM-01만 `'all'`**: 공지 조회가 실패해도 주간 진행 카드는 보여준다. 잔디 실패는 오류가 아니라 `grassStatus`로 오므로 배너만 바뀐다.
- 조회 중의 `FORBIDDEN` · `NOT_FOUND`는 라우트 단위 오류 바운더리가 CM-02 상태(권한 없음 · 404)로 바꾼다. 액션 중 오류는 토스트로 띄운다.

---

## 8. 페이지네이션 · 낙관적 갱신 · 캐시

### 8-1. [Q-06] 커서 vs 오프셋 — 목록별 사정

| 목록 | 저장소 · 정렬 | 화면 UI | 커서 | 오프셋 |
|---|---|---|---|---|
| BD-01 글 · 검색 결과 | MongoDB · 최신순(검색도 최신순, BD-01 비고) | [더 보기] / 앱 무한 스크롤 | `_id` 커서가 자연스럽다(DB 6장) | 쓰는 동안 새 글이 끼면 중복 · 누락 |
| BD-03 댓글 | MongoDB · 등록순 | 명세 없음 | 자연스럽다 | — |
| NT-01 공지 | MariaDB · `is_pinned DESC, created_at DESC` | [더 보기] | 복합 커서 필요 | 단순 |
| PR-01 ⑩ · AC-01 ⑤ 판정 이력 | MariaDB · `week_start DESC` | 8주씩 [더 보기] | `weekStart`가 회원별로 유일해 간단하다 | 단순 |
| TM-06 ⑧ · AD-01 ②-5 글 + 댓글 혼합 | MongoDB 컬렉션 2개를 합쳐 정렬 | 명세 없음 · 목록 | **두 컬렉션 병합 커서라 어렵다** | 병합 후 skip — 규모가 작으면 가능 |
| AD-01 ⑦ 판정 결과 | MariaDB · 주차 고정 | **번호형 [1][2]**(목업 W-15) | 번호 이동이 안 된다 | 자연스럽다 |
| AD-01 ②-2 가입 승인 | MariaDB | **번호형 [1][2][3]**(와이어프레임) | 〃 | 〃 |
| AD-01 기타(벌칙 · 삭제 경고 · 면제) | MariaDB · 소량 | 목록 | 어느 쪽이든 | 어느 쪽이든 |

**초안이 한 것:** 모든 목록을 `XxxConnection { nodes, pageInfo { hasNextPage endCursor }, totalCount }` + `first/after`로 통일했다(E-57 "커서 20개" 제안을 따름). 프론트는 `usePagedList()` 훅 하나로 감싸 `{ items, loadMore, hasMore, totalCount }`만 화면에 노출한다. 오프셋으로 결정되면 훅 내부와 SDL 인자만 바뀌고 화면은 그대로다. **AD-01 번호형 UI는 커서로는 만들 수 없으므로** 결정에 따라 [더 보기]로 바꾸거나 관리자 표만 오프셋으로 둬야 한다(C-06, 13장 질문 3).

**Apollo 캐시:** `posts`는 `keyArgs: ['filter']`에 `merge`로 이어 붙인다. Relay 기본 정책(`relayStylePagination`)은 `edges` 모양을 전제하므로 `nodes` 모양에 맞춘 커스텀 merge가 필요하다.

### 8-2. 낙관적 갱신 가능 여부

| 뮤테이션 | 낙관적 | 이유 |
|---|---|---|
| `UpdateComment` · `CancelInvitation` · `RevertMemberToPending` | ○ | 값 하나만 바뀌고 되돌리기 쉽다 |
| `SetTeamVisibility` · `SetNoticePinned` | ○ | "즉시 반영 · 즉시 토글"(TM-06 ⑦ · AD-01 ②-4 ⑥). 실패하면 원복 + 토스트 |
| `ApproveMember` | ○ | "즉시 승인"(AD-01 ②-2 ⑦) · 인수인계 5-1 "단일 필드 증감은 부분 갱신" |
| `AddComment` | △ | 맨 아래에 임시로 추가할 수 있다. 실패하면 **항목을 지우고 입력칸 내용을 되살려야** 한다(E-51 "입력 내용 유지") |
| `CreatePost` · `UpdatePost` | ✕ | `isRecord` · `writtenDate` · `id`를 서버가 정한다. 저장 후 BD-03으로 이동한다 |
| `DeletePost` · `DeleteComment` · `LeaveTeam` · `KickMember` · `TransferLeadership` · `DeleteTeam` · `RejectMember` · `DeleteNotice` | ✕ | **되돌릴 수 없는 행동**이라 확인 다이얼로그 후 서버 응답을 기다린다(5-2-8 ③) |
| `JoinTeamByInviteCode` · `InviteMember` · `RespondInvitation` · `RequestPersonalExemption` · `CreateTeam` | ✕ | 성공 여부를 서버만 안다(E-10~E-18 · E-47). 응답값(팀 id · 초대코드)이 필요하다 |
| `CorrectJudgment` · `RestoreWarning` · 면제 기간 등록 · 수정 · 삭제(소급) | **✕ 금지** | 연쇄 재계산이라 파급 범위를 클라이언트가 예측할 수 없다(인수인계 5-1) |
| `FulfillPenalty` · `ApprovePersonalExemption` | ✕ **(인수인계와 다름)** | 인수인계 5-1은 "단일 필드 증감 → 부분 갱신"으로 묶었지만, 이행 체크는 경고 수 · 연속 · 벌칙 목록을 함께 바꾸고 개인 면제 승인은 소급이 될 수 있다(C-04). **재조회로 처리**한다 **(제안)** |
| `RerunHeldJudgments` | ✕ | 외부 API라 결과가 불확실하다 |

### 8-3. 뮤테이션 후 캐시 갱신 지도 **(제안)**

| 뮤테이션 | 갱신 · 무효화 대상 |
|---|---|
| `CreatePost` · `DeletePost` | `Query.posts` · `postTypeCounts` · `popularTags` 제거, `myWeek` 재조회(기록글은 실시간, 5-2-6), 연결 팀 `Team.recentPosts` · `currentWeekBoard`, `Member.postCount` |
| `UpdatePost` | 정규화된 `Post`는 자동 갱신된다. 태그 · 팀이 바뀌었으면 `Query.posts` 제거 |
| `AddComment` · `DeleteComment` | `Post.comments` · `Post.commentCount` · `Member.commentCount` |
| `JoinTeamByInviteCode` · `RespondInvitation(수락)` · `CreateTeam` | `myTeams` · `Me.hasTeam` · `Me.pendingInvitationCount` · `myWeek`(첫 참가 주 E-36) |
| `LeaveTeam` · `DeleteTeam` · `KickMember` | `myTeams` · `Team:{id}` 제거 · `Me.hasTeam` · `Query.posts`(팀 배지가 사라진다) |
| `SetTeamVisibility` | `Team.isPublic`, 그리고 **`Query.posts`와 열어 둔 프로필(`Member.publicTeams` · `warningState.byCategory`) 제거** — 공개 여부가 바뀌면 다른 화면의 팀 이름 노출이 달라진다 |
| `TransferLeadership` | `Team.viewerRole` 재조회 → TM-06 접근 권한이 없어지므로 TM-05로 이동 |
| `CorrectJudgment` · `RestoreWarning` · `FulfillPenalty` · 면제 계열 | `AdminJudgments` · `HeldJudgments` · `AdminSummary` · `AdminWarningsTab` 재조회, 대상 `Member:{id}`의 `warningState` · `judgmentHistory` 제거 |
| `ApproveMember` · `RejectMember` · `RevertMemberToPending` | 해당 행 · `AdminSummary.pendingMemberCount` |
| 공지 계열 | `Query.notices` 제거(고정 순서가 바뀐다) |

> **다른 사람의 화면은 바로 바뀌지 않는다.** 구독 · 폴링이 없으므로 다른 회원의 캐시는 다음 조회 때 갱신된다. 수치 화면(CM-01 · TM-05 · AD-01)에 `cache-and-network`를 쓰는 이유다.

---

## 9. 문서 간 충돌 · 공백

> 최신 판단 원칙: **규칙 · 권한 · 예외는 화면설계서 v0.7(9/30)이 기준**이다. 목업 v2는 사용자가 9/29에 준 스크린샷을 그대로 그린 것이다. v0.7 개정은 헤더 검색 관련 절만 고쳤으므로, **검색이 아닌 화면의 배치 · 시각 요소는 목업 v2가 사용자의 최신 의도에 가깝다**고 본다(인수인계 9/29 · 9/30 기록).

| # | 충돌 · 공백 | A쪽 | B쪽 | 최신 판단 · 계약 처리 |
|---|---|---|---|---|
| **C-01** | 승인 대기 회원의 인증 수단 | FC-03: 토큰 저장은 **승인 상태에서만**, E-02 "거절은 토큰 미발급" | AU-03 ④ `@{githubLogin}` · ⑤ "본인 승인 상태를 재조회" | 둘 다 v0.7 문서 안의 충돌. AU-03이 동작하려면 대기 회원도 조회할 수 있어야 한다 → 4-2 A안(제한 토큰) **제안** · 13장 질문 1 |
| **C-02** | 경고 현재 상태의 저장 위치 | AC-02 비고: "둘 다 DB `member_warning_state`를 읽는다" | DB명세서 v0.4: 그런 테이블이 없다. 경고 수는 판정 이력 replay로 계산한다(4-3, 기능명세서 6장) | DB명세서(v0.4, 같은 날) · 기능명세서가 맞다. 스키마는 `WarningState`를 **계산 필드**로 둔다 |
| **C-03** | 정정 · 소급 면제로 "회수"된 경고 | FC-04 비고: 회수는 추방 · 팀 삭제와 **사유를 구분해 저장**(DB 1-9 인용) | DB 1-9 `delete_reason`은 `KICKED · TEAM_DELETED`뿐 | AD-01 ②-1 ⑦ "회수된 경고는 나오지 않는다"를 구현할 근거 컬럼이 없다. `RETRACTED` 추가 또는 회수 시 물리 삭제 중 하나를 백엔드가 정해야 한다 **(제안)** |
| **C-04** | 개인 면제 승인이 소급이 되는 경우 | AD-01 ②-3 ⑦ "[승인] 즉시" | 기능명세서 7장 "소급 면제는 실행 전에 재계산 미리보기를 **반드시**" | 이번 주 요청이 월요일 판정 **뒤에** 승인되면 소급 면제가 된다. 초안은 `isRetroactive` + `personalExemptionApprovalPreview`를 넣었다 (추측) · 질문 2 |
| **C-05** | 과거 면제 기간의 수정 · 삭제 | DB 1-12 "면제 기간은 수정할 수 있다 · 과거 주간 등록 · 수정 시 소급 재계산" | 면제된 주는 판정하지 않으므로 `judgment_day`(7일 근거)가 없고, 잔디 캐시는 26시간 뒤 사라진다(DB 2장) | 면제를 **빼는** 쪽(삭제 · 다른 주로 이동)은 그 주를 판정할 데이터가 없다. 규칙이 필요하다 · 질문 2 |
| **C-06** | 관리자 목록 페이지네이션 | E-57 "AD-01 커서 20개 **(제안)**" | AD-01 와이어프레임 가입 승인 탭 `[1][2][3]` · 목업 W-15 번호형 `1 2` | 번호형이 두 곳(화면설계서 그림 + 목업)에 그려져 있고 E-57은 제안이다. 번호 이동은 커서로 만들 수 없다 → Q-06과 함께 결정 · 질문 3 |
| **C-07** | 지난 주차의 칸 수 · 개수 | 목업 W-06(이번 주): "잔디 3칸" · "기록글 1개" · 잔디 단계 색 | AC-01 ② "지난 주차는 `judgment_day` 값" · DB 1-8은 `has_grass` · `has_record` **boolean만** | 지난 주는 ✓/— 수준까지만 그릴 수 있다. 스키마는 `grassCount` · `grassLevel` · `recordCount`를 nullable로 둔다. 개수가 필요하면 DB 1-8에 컬럼을 추가해야 한다 |
| **C-08** | 관련 커밋 개수 | DB 3-1 `commitUrls: [...]` 배열 | BD-04 ⑧ · BD-03 ⑧ · 목업 W-12 · W-13: **1칸** · 기능명세서 3장 "관련 커밋 링크"(개수 미정) | 스키마는 배열로 두고 1차 화면은 0~1개만 쓴다 **(제안)**. 나중에 늘려도 스키마는 그대로다 |
| **C-09** | 아이디 초대 처리 | TM-04 ③ "거절 → **초대 삭제**" · TM-06 ③ [취소](철회) · TM-04 ① "{초대한 팀장}" | DB 1-4 `status = DECLINED`로 보존, **철회 상태값 없음**, **초대한 사람 컬럼 없음** | 거절은 DB대로 상태 보존, 철회는 행 삭제(DB 1-0 "나머지는 실제 삭제"), 초대한 사람은 조회 시점 팀장으로 표시 (추측) |
| **C-10** | 팀 화면의 면제 요청 목록 | TM-08 ⑤: **이 팀** 화면의 요청 목록 | DB 1-13 `personal_exemption`에 `team_id`가 없다 | "이 팀장이 요청 · 대상이 지금 이 팀 소속"으로 거른다 (추측). 한 팀장이 두 팀을 맡고 대상이 두 팀에 모두 속하면 양쪽에 다 보인다 |
| **C-11** | 삭제 정책 | DB 1-0 "경고만 소프트 삭제, 나머지는 실제 삭제" | MongoDB `posts.deletedAt` · `comments.deletedAt` · `post_index.deleted_at`(소프트) · E-31 "삭제된 글 안내"(글이 남아 있어야 가능) | 글 · 댓글은 소프트 삭제로 본다. 계약은 `PostLookup = Post \| DeletedPost` |
| **C-12** | 진행 중인 주의 "미달" | TM-01 ⑧ "이번 주 통과 n명 · **미달 n명** · 아직 n명" | TM-05 비고 "미달은 주가 끝나고 판정이 확정된 뒤에만" | 진행 중인 주에는 미달이 항상 0이다(목업 W-08도 두 팀 모두 0명). `failCount`는 남겨 두되 의도를 확인할 필요가 있다 |
| **C-13** | "이번 주 미달" 용어 | AD-01 ⑤ · 목업 W-15 카드 "이번 주 미달 4" | 같은 목업의 판정 결과는 **지난 주**(9/21~9/27, 9/28 실행). 이번 주는 아직 판정 전 | "가장 최근 실행된 판정의 미달"로 해석해 `latestWeekFailCount` + `latestJudgedWeekStart`로 둔다 (추측) |
| **C-14** | 벌칙 도달 날짜 | 목업 W-16 "도달 9/28"(판정일 = 월요일) | DB 1-11 `reached_week` = 경고 3회에 도달한 **주의 월요일**(= 9/21) | 둘 다 내려준다(`reachedWeekStart` · `reachedAt`). 화면 표기는 팀이 맞춘다 |
| **C-15** | 회원 화면의 보류 주 표시 | AD-01: 보류는 "진행 중"과 다른 상태 · 배지 | PR-01 ⑩ 결과값(통과 · 미달(경고) · 면제 · 제외 · 진행 중)과 AC-01 ⑤에 **보류가 없다** | 회원에게 보류 주를 어떻게 보일지 정해야 한다. 팀이 문구를 정할 수 있다(예: "확인 중") **(제안)** |
| **C-16** | GraphQL 규모 추정 | 인수인계 5-1 "신설 5개 + 나머지 18개 CRUD" | 실제 화면 요구: Query 28 · Mutation 36. 면제 소급 미리보기 2종 · 탭별 건수 · 인기 태그 · 서버 시각 · 보류 재실행 등이 빠져 있었다 | 일정 산정(11장 3주차 동결)을 다시 볼 필요가 있다 |
| **C-17** | 경고 노출 범위의 일관성 | TM-05: 다른 팀 경고가 새지 않게 누적 경고 · 벌칙 대상을 **숨긴다**(기능명세서 2장 확정) | PR-01 "상태: 타인"은 ⑧ 누적 경고 · **벌칙 대상 배지** · ⑨ 공개 팀 이름 카테고리를 **그대로 보인다** | 팀원 이름을 한 번 누르면(TM-05 ⑥ → PR-01) 숨긴 값이 보인다. API는 명세대로 두되 의도를 확인할 필요가 있다 · 질문 5 |
| **C-18** | 로그인 화면의 규칙 모달 | AU-01 ⑤ 잔디 인정 규칙 모달 **(제안)** | 공지는 회원 전용(NT-02 권한), 비로그인은 API를 쓸 수 없다 | 정적 텍스트로 내장한다 **(제안)**. 공지를 고쳐도 로그인 화면에는 반영되지 않는 차이가 생긴다 |
| **C-19** | 프로필 팀별 경고의 집계 대상 | PR-01 ⑨ "{팀 이름} {n}회" — 유효 · 차감 포함 여부가 명시되지 않음 | 목업 W-07(유효: A팀 · 비공개 팀 / 차감: B팀) ↔ W-14(A팀 1 · 비공개 팀 1, **B팀 없음**) | 목업 대조상 **유효 경고만** 센다 (추측). 비공개 팀이 둘 이상이면 "비공개 팀" 줄이 여러 개 나오는지도 미정이다 |
| **C-20** | 관리자 메뉴 위치 (API 영향 없음) | 화면설계서 AD-01 ②: ☰ 드로어 안 서브메뉴, 좁은 화면만 가로 탭바 | 목업 W-15 · W-16: **데스크톱에서도 가로 탭 + 배지**, W-03 드로어에는 관리자 계정인데도 관리자 대메뉴가 없다 | 배치는 목업 v2가 최신일 가능성이 높다(위 원칙). 배지 데이터는 어느 쪽이든 `adminDashboardSummary` 하나 |

---

## 10. 미결 Q-01~Q-13이 흔드는 곳

| Q | 흔드는 스키마 위치 | 초안의 흡수 방식 | 모양 변경 | 프론트 영향 |
|---|---|---|---|---|
| Q-01 초대코드 재열람 | `Team.inviteCode` · `CreateTeamPayload.inviteCode` | `Team.inviteCode`를 nullable로 둬서 A · B 모두 같은 모양 | **없음** | TM-06 ①은 값이 있을 때만 표시. B안이면 TM-02 ⑤ 이탈 경고를 강화 |
| Q-02 재초대 자동 복원 | 없음(서버 동작) | — | 없음 | AD-01 ②-1 ⑦ 목록 내용, AC-02 ③ 이력 |
| Q-03 보류 주 연속 처리 | `WarningState` · `RecalcPreview` 값 | — | 없음 | 표시 값만 |
| Q-04 소속 기준 시점 | `WarningRecord.categories` · 판정 대상 여부 | — | 없음 | 표시 값만 |
| **Q-05** 정정에 "제외" | `CorrectableJudgmentStatus` · `CorrectJudgmentInput` | — | **B안이면 enum 값 + `skipReason` 입력 추가** | AD-01 ⑩ 라디오 3 → 4 |
| **Q-06** 커서 vs 오프셋 | **모든 `*Connection`과 목록 인자** | 커서로 통일 + `usePagedList` 훅 | **오프셋이면 인자(page, size) · 반환(totalPages) 변경** | 훅 내부만. 번호형 UI는 결정에 종속(C-06) |
| Q-07 재시도 횟수 | (`retry_count` 비노출) | 노출하지 않음 | 없음 | 없음 |
| Q-08 락 위치 | 오류 코드 `RECALC_BUSY` | 코드만 예약 | 없음 | 토스트 |
| Q-09 조기 판별 | `HoldReason`이 정해지는 시점 | — | 없음 | AD-01 ⑨ 문구가 더 일찍 정확해짐 |
| Q-10 경계 규칙 4개 | `activeCount` 상한 · `consecutivePasses` · `weeksUntilDeduction` | nullable · 화면 게이지는 3에서 자름 | 없음 | AC-02 ② 문구 · CM-01 E-41 |
| **Q-11** 기록글 날짜 귀속 | `Post.writtenDate` 의미 | 이름만 확정 | **"채운 날 기준"이면 `recognizedDate` 같은 필드 추가가 필요할 수 있다** | E-27 배너 · AC-01 ② |
| Q-12 팀 · 작성자 필터 | `PostFilter.teamId` · `authorId` | **선택 필드로 미리 넣음** | 없음(B안이면 안 씀) | TM-05 ⑧ · PR-01 ⑥ 링크 노출 여부 |
| Q-13 이행 전 경고 표시 | `WarningStanding.FULFILLED` | **값을 미리 넣음**(A) — B안이면 안 쓴다 | 없음 | AC-02 ③ · PR-01 ⑨ |

**정리:** 3주차 말 동결 전에 스키마 때문에 반드시 결론이 필요한 것은 **Q-05 · Q-06 · Q-11** 세 건이다. 나머지 열 건은 서버 로직이나 화면 문구 문제라 동결 뒤에도 스키마를 바꾸지 않고 결정할 수 있다.

---

## 11. 목 서버 후보 비교 (결론 없음)

| 기준 | A. MSW `graphql.*` 핸들러 | B. Apollo `SchemaLink` + `@graphql-tools/mock` | C. MSW 핸들러 안에서 SDL 실행(graphql-js `execute`) | D. 별도 Node 목 서버(Yoga · Apollo Server + mocks) |
|---|---|---|---|---|
| 실제 HTTP 경로 재현(헤더 · 401 · 5xx · 지연 · 오프라인) | **○** 서비스 워커가 fetch를 가로챈다. E-03 · E-51 · E-52 재현이 쉽다 | **✕** 네트워크를 거치지 않는다. authLink · errorLink의 HTTP 분기가 실행되지 않는다 | ○ | ○ (CORS까지 재현) |
| 응답이 SDL과 맞는지 검증 | ✕ 손으로 쓴 픽스처라 어긋날 수 있다(codegen `typescript-msw`로 타입은 맞출 수 있다) | **○** 스키마로 실행해 잘못된 필드 · 타입은 실서버처럼 실패한다 | **○** | ○ |
| REST 업로드(5장) 모킹 | **○** 같은 도구의 `http.post` | ✕ 따로 필요(MSW 등) | ○ | ○ (라우트 추가) |
| 상태 유지(뮤테이션 → 다음 조회 반영) | 직접 구현(메모리 DB 객체) | `createMockStore`로 일부 지원 | 리졸버로 직접 구현 | 리졸버로 직접 구현 |
| 테스트 재사용(Vitest · Playwright · Storybook) | ○ 브라우저 · Node 양쪽 같은 핸들러 | △ Apollo 클라이언트 구성이 운영과 달라진다 | ○ | △ 프로세스를 띄워야 한다 |
| 앱(RN) 재사용 | △ RN은 서비스 워커가 없어 `msw/native` 설정이 따로 필요 | ○ JS만 있으면 된다 | △ | **○** 주소만 바꾸면 된다 |
| 설정 · 번들 부담 | 낮음(`mockServiceWorker.js` 1개) | 중간(graphql-tools + 스키마가 개발 번들에 들어감) | 중간~높음 | 프로세스 · 배포 관리 |
| 운영 빌드 유출 위험 | 동적 import · 환경변수로 막아야 한다 | 〃 | 〃 | 없음(별도 프로세스) |
| 오류 · 지연 주입 | 핸들러마다 쉽다 | 리졸버에서 throw는 쉽지만 HTTP 오류는 어렵다 | 쉽다 | 쉽다 |
| 실서버로 바꿀 때 | 서비스 워커를 끄면 끝 | 링크 체인을 다시 구성해야 한다 | 서비스 워커를 끄면 끝 | URL만 교체 |

참고 E. `MockedProvider`(Apollo)는 **컴포넌트 단위 테스트 전용**이다. 개발 중 앱 전체를 돌리는 목 서버 후보는 아니다.

**고를 때 물어볼 것:** ① 인증 · 오류 경로(E-03 · E-51)를 목 단계에서 얼마나 검증할 것인가 ② SDL 변경(동결 전까지 잦다)을 목 응답이 자동으로 따라가야 하는가 ③ 앱 팀(5주차)이 같은 목을 쓸 것인가 ④ 테스트 담당이 Playwright로 E2E를 돌릴 것인가.

---

## 12. 교체 가능한 구조 · 목 시나리오 (제안)

### 12-1. 화면 코드를 고치지 않고 실서버로 바꾸기 위한 규칙

| 규칙 | 내용 |
|---|---|
| 계층 | `src/api/`(스키마 사본 · operation 문서 · 생성 타입 · Apollo 클라이언트 · REST 함수 · tokenStore) ↔ `src/mocks/`(목 전용) ↔ 화면. **화면은 `src/mocks`를 import하지 않는다** |
| 스위치 | 환경변수 `VITE_API_MODE=mock\|real`, `VITE_API_ORIGIN`, `VITE_GRAPHQL_PATH=/graphql`. 목 코드는 `mock`일 때만 동적 import해서 운영 번들에서 빠지게 한다 |
| 타입 | `schema.graphql`(이 초안 사본) → graphql-codegen → 화면은 생성 훅 · 타입만 쓴다. 백엔드 스키마가 나오면 **사본만 교체하고 codegen을 다시 돌려** 깨지는 곳을 컴파일러가 찾게 한다 |
| 오류 · 문구 | `code → 문구` 매핑과 `enum → 라벨` 매핑을 각각 한 파일에 둔다(3-1 · 7-2). 화면에 문자열 비교를 흩뿌리지 않는다 |
| 페이지 | `usePagedList` 하나(8-1) |
| 인증 | `tokenStore` + `authLink` + `errorLink`(4-3). 목 모드에서는 AU-01 버튼이 `/auth/callback?code=mock-<페르소나>`로 바로 간다. `exchangeLoginCode` 목이 코드 값으로 페르소나를 고른다 — OAuth 없이 AU-02 · AU-03 분기를 그대로 시험한다 |
| 통합 점검 | 실서버 스키마와 이 초안의 차이를 스키마 diff 도구로 비교해 PR에 붙인다 |

### 12-2. 목 페르소나 (목업 등장인물 재사용)

| 코드 | 페르소나 | 덮는 분기 |
|---|---|---|
| `mock-pending` | 승인 대기 | AU-03 · E-01 · C-01 |
| `mock-rejected` | 거절 | E-02 |
| `mock-newbie` | 회원 · 팀 없음 | CM-01 ⑨ · 5-2-7 · TM-01 빈 상태 · AC-01 팀 미소속 |
| `mock-first` | 서연 — 첫 참가 주 | E-36 · TM-05 "제외" · W-15 "첫 참가" |
| `mock-member` | 김철수 — 팀원, 통과 | TM-05 [팀 나가기] · 글 수정 · 삭제 권한 |
| `mock-leader` | **한동관 — 관리자 + A팀(공개) 팀장 + 알고리즘 스터디(비공개) 팀원**, 경고 1(A팀 · 비공개 팀), 연속 1, 받은 초대 2 | 목업 W-02~W-16 기본 상태 · 마스킹 · 팀장 보조 메뉴 · 관리자 |
| `mock-penalty` | 박지훈 — 경고 3, 벌칙 대상 | E-40 · AD-01 ②-1 · ⑩ 미리보기 "3회 → 2회 · 해제" |
| 공통 데이터 | 보류 2건(API_ERROR · IDENTITY_MISMATCH) · 삭제된 경고 2건(추방 · 팀 삭제) · 삭제된 글 1개 · 비공개 팀 글 · 인증 미포함 글 · 잔디 실패 회원(E-32) · 비공개 기여 의심(E-39) | E-08 · E-31 · E-23 · E-25 · E-43 |

---

## 13. 의뢰인에게 확인할 것

| # | 질문 | 왜 의뢰인만 정할 수 있나 | 팀 제안 |
|---|---|---|---|
| 1 | **승인 대기 회원에게 "본인 상태 확인 전용" 토큰을 줘도 되나요?** (FC-03 수정) | FC-03 그림과 AU-03 화면이 서로 맞지 않는다(C-01). 명세 문서를 고치는 결정이다 | 4-2 A안 |
| 2 | **이미 판정이 끝난 주에 대해** ⓐ 개인 면제를 승인하면 정정처럼 미리보기를 거쳐야 하나요? ⓑ 면제 기간을 **지우거나 다른 주로 옮기면** 그 주는 어떻게 되나요? (다시 판정 / 과거 면제 기간은 수정 · 삭제 금지 / 그대로 면제 유지) | 판정 · 경고 규칙(기능명세서 7장)의 빈칸이다(C-04 · C-05). ⓑ는 판정할 근거 데이터가 남지 않는다 | ⓐ 미리보기 거침 · ⓑ 이미 판정된 주의 면제 기간은 수정 · 삭제 금지 |
| 3 | **[Q-06] 목록을 "더 보기"(커서)로 통일해도 되나요?** 목업 W-15와 AD-01 그림의 **번호형 페이지(1 · 2 · 3)**를 꼭 유지해야 하면 관리자 표만 오프셋으로 갑니다 | 목업에 그린 UI를 바꾸는 결정이다(C-06). 모든 목록의 반환 모양이 걸린다 | 회원 화면은 커서, 관리자 표는 번호형 유지 시에만 오프셋 |
| 4 | **[Q-05 · Q-11] 스키마 동결 전에 꼭 필요한 두 결론**: 정정 결과에 "제외"를 넣을지, 기록글을 작성일과 필수 항목을 다 채운 날 중 어느 날로 인정할지 | 둘 다 기능명세서에 규정이 없는 판정 규칙이고, 스키마 모양이 바뀐다(10장) | Q-05 현행 유지(면제로 우회) · Q-11 작성일 기준 |
| 5 | **타인 프로필에서 누적 경고 · 벌칙 대상 배지를 보여주는 게 맞나요?** 팀 현황판은 같은 정보를 숨기는데, 이름을 누르면 프로필에서 보입니다 | 공개 범위 정책이다(C-17 · 기능명세서 2장 · 8장) | 명세대로 두되 의도 확인 |
| 6 | **[Q-12 · Q-13] 화면 링크 두 개**: 팀 현황판 "전체보기"(팀 필터)와 프로필 "게시글 수"(작성자 필터)를 살릴지, 벌칙 이행으로 초기화된 경고를 이력에 "이행 완료"로 남길지 숨길지 | 기능명세서 3장 · 6장에 없는 화면 동작이다. 스키마는 양쪽 모두 받을 수 있게 해 뒀다 | 필터 추가(A) · "이행 완료" 표시(A) |

---

## 부록 A. GraphQL SDL 초안 (`A3-schema.draft.graphql`과 같은 내용)

전체 SDL은 [`A3-schema.draft.graphql`](./A3-schema.draft.graphql) 참조.
