/**
 * 목 시드 (설계서 8-4). 목업 v2 숫자를 기준 시각 2026-10-01(목) 10:00 KST · 페르소나 member(한동관)로 재현한다.
 *
 * 맞춘 화면: W-02 홈 · W-05 Redis 검색(트러블슈팅 3 · 개발일지 1) · W-06 주간 · W-07 경고 · W-08 내 팀 ·
 * W-09 A팀 현황판 · W-10 팀 관리 · W-11 게시판 · W-12 글 상세 · W-14 프로필(글 12 · 댓글 34) ·
 * W-15 관리자(승인 대기 3 · 미달 4 · 벌칙 2 · 면제 대기 2, 9/21 주 통과 18 · 미달 4 · 면제 2 · 첫 참가 1) · W-16.
 *
 * 이 파일은 순수 데이터다 — 다른 목 모듈(derive · clock)을 import하지 않는다.
 */
import { addDays, kstIso, weekDates } from '@/shared/lib/kst';
import type { PostType, SkipReason } from '../__generated__/schema-types';
import { COMMENT_OID_PREFIX, objectId, POST_OID_PREFIX } from './ids';
import type {
  CommentRow,
  DbState,
  ExemptionPeriodRow,
  Id,
  InvitationRow,
  JudgmentDay,
  JudgmentRow,
  MemberRow,
  MembershipRow,
  NoticeRow,
  PersonalExemptionRow,
  PostRow,
  PostSectionKey,
  TeamRow,
  WarningRow,
} from './store';

/* ------------------------------------------------------------------ */
/* 공통                                                                 */
/* ------------------------------------------------------------------ */

/** '2026-09-29 14:20' → '2026-09-29T14:20:00+09:00' */
const t = (s: string): string => {
  const [d = '', hm = '00:00'] = s.split(' ');
  const [h = 0, m = 0] = hm.split(':').map(Number);
  return kstIso(d, h, m);
};

/** 판정 배치 실행 시각: 그 주 다음 월요일 07:00 */
export const executionTimeOf = (weekStart: string) => kstIso(addDays(weekStart, 7), 7, 0);

/** 페르소나 회원 id (control.ts와 공유) */
export const PERSONA_MEMBER_IDS = {
  member: '1',
  plain: '2',
  noteam: '5',
  penalty: '6',
  pending: '9',
  rejected: '10',
} as const;

/* ------------------------------------------------------------------ */
/* 회원                                                                 */
/* ------------------------------------------------------------------ */

type MemberSeed = [id: string, nickname: string, login: string, createdAt: string, firstTeam: string | null];

const ACTIVE_MEMBERS: MemberSeed[] = [
  ['1', '한동관', 'handong-gwan', '2026-08-10 20:00', '2026-08-24 10:00'],
  ['2', '김철수', 'chulsoo-kim', '2026-08-03 19:10', '2026-08-05 21:00'],
  ['3', '이영희', 'younghee-dev', '2026-08-03 20:30', '2026-08-06 18:00'],
  ['4', '박민수', 'minsu-park', '2026-08-04 09:00', '2026-08-06 20:00'],
  ['5', '서연', 'seoyeon-lee', '2026-09-15 13:00', '2026-09-23 19:00'],
  ['6', '박지훈', 'jihoon-park', '2026-08-04 22:00', '2026-08-07 10:00'],
  ['7', '정하늘', 'haneul-jung', '2026-08-05 08:30', '2026-08-07 12:00'],
  ['8', '최유진', 'yujin-choi', '2026-08-05 21:45', '2026-08-08 15:00'],
  ['13', '오민석', 'minseok-oh', '2026-08-02 10:00', '2026-08-03 21:00'],
  ['14', '장예린', 'yerin-jang', '2026-08-02 11:00', '2026-08-03 21:30'],
  ['15', '임도윤', 'doyun-lim', '2026-08-02 12:00', '2026-08-03 22:00'],
  ['16', '한지우', 'jiwoo-han', '2026-08-02 13:00', '2026-08-04 19:00'],
  ['17', '송하준', 'hajun-song', '2026-08-02 14:00', '2026-08-04 19:30'],
  ['18', '윤채원', 'chaewon-yoon', '2026-08-02 15:00', '2026-08-04 20:00'],
  ['19', '조성민', 'sungmin-cho', '2026-08-02 16:00', '2026-08-04 20:30'],
  ['20', '배수아', 'sua-bae', '2026-08-02 17:00', '2026-08-04 21:00'],
  ['21', '신우진', 'woojin-shin', '2026-08-02 18:00', '2026-08-05 19:00'],
  ['22', '권나연', 'nayeon-kwon', '2026-08-02 19:00', '2026-08-05 19:30'],
  ['23', '황태윤', 'taeyoon-hwang', '2026-08-02 20:00', '2026-08-05 20:00'],
  ['24', '안소희', 'sohee-ahn', '2026-08-02 21:00', '2026-08-05 20:30'],
  ['25', '류건우', 'gunwoo-ryu', '2026-08-02 22:00', '2026-08-05 21:00'],
  ['26', '문지아', 'jia-moon', '2026-08-03 10:00', '2026-08-06 19:00'],
  ['27', '홍승현', 'seunghyun-hong', '2026-08-03 11:00', '2026-08-06 19:30'],
  ['28', '양다인', 'dain-yang', '2026-08-03 12:00', '2026-08-06 20:00'],
  ['29', '노현우', 'hyunwoo-noh', '2026-08-03 13:00', '2026-08-06 20:30'],
  ['30', '백서윤', 'seoyun-baek', '2026-08-03 14:00', '2026-08-06 21:00'],
];

function members(): MemberRow[] {
  const active: MemberRow[] = ACTIVE_MEMBERS.map(([id, nickname, githubLogin, createdAt, firstTeam]) => ({
    id,
    nickname,
    githubLogin,
    profileImageUrl: null,
    status: 'ACTIVE',
    role: id === '1' ? 'ADMIN' : 'MEMBER',
    createdAt: t(createdAt),
    firstTeamJoinedAt: firstTeam ? t(firstTeam) : null,
    grassMode: id === '30' ? 'zero' : 'random',
    grassStatus: id === '20' ? 'FAILED' : 'OK',
  }));
  const other = (id: string, nickname: string, githubLogin: string, status: 'PENDING' | 'REJECTED', createdAt: string): MemberRow => ({
    id,
    nickname,
    githubLogin,
    profileImageUrl: null,
    status,
    role: 'MEMBER',
    createdAt: t(createdAt),
    firstTeamJoinedAt: null,
    grassMode: 'random',
    grassStatus: 'OK',
  });
  return [
    ...active,
    other('9', '정다은', 'daeun-jung', 'PENDING', '2026-09-30 21:15'),
    other('10', '최민재', 'minjae-choi', 'REJECTED', '2026-09-20 13:00'),
    other('11', '윤서준', 'seojun-yoon', 'PENDING', '2026-09-29 08:40'),
    other('12', '강지민', 'jimin-kang', 'PENDING', '2026-10-01 09:10'),
  ].sort((a, b) => Number(a.id) - Number(b.id));
}

/* ------------------------------------------------------------------ */
/* 팀 · 소속 · 초대                                                      */
/* ------------------------------------------------------------------ */

function teams(): TeamRow[] {
  const team = (
    id: string,
    name: string,
    description: string | null,
    isPublic: boolean,
    leaderId: string,
    inviteCode: string | null,
    createdAt: string,
    deletedAt: string | null = null,
  ): TeamRow => ({ id, name, description, isPublic, leaderId, inviteCode, createdAt: t(createdAt), deletedAt: deletedAt ? t(deletedAt) : null });
  return [
    team('1', '사이드 프로젝트 A팀', '잔디로그 서버와 앱을 함께 만드는 팀이에요.', true, '1', 'JD7K-Q2MA', '2026-08-24 10:00'),
    team('2', '알고리즘 스터디', '매주 세 문제씩 풀고 풀이를 나눠요.', false, '13', 'AL9G-R4TM', '2026-08-03 21:00'),
    team('3', '웹 프로젝트 B팀', '동아리 홈페이지를 새로 만들어요.', true, '16', 'WB3N-7KQX', '2026-06-01 19:00'),
    team('4', '모바일 스터디', null, true, '8', null, '2026-08-08 15:00', '2026-09-20 22:00'),
    team('5', '데이터 엔지니어링 팀', '공공 데이터로 파이프라인을 만들어 봐요.', true, '21', 'DE5P-8HWN', '2026-08-05 19:00'),
    team('6', '클라우드 인프라 스터디', '쿠버네티스와 테라폼을 같이 공부해요.', false, '26', 'CL6S-2VYD', '2026-08-06 19:00'),
  ];
}

function memberships(): MembershipRow[] {
  const m = (teamId: string, memberId: string, joinedAt: string, leader = false): MembershipRow => ({
    teamId,
    memberId,
    role: leader ? 'LEADER' : 'MEMBER',
    joinedAt: t(joinedAt),
  });
  return [
    // 사이드 프로젝트 A팀 (공개 · 4명) — W-09 · W-10 순서
    m('1', '1', '2026-08-24 10:00', true),
    m('1', '2', '2026-08-24 21:00'),
    m('1', '3', '2026-08-25 18:00'),
    m('1', '4', '2026-08-25 20:00'),
    // 알고리즘 스터디 (비공개 · 6명)
    m('2', '13', '2026-08-03 21:00', true),
    m('2', '14', '2026-08-03 21:30'),
    m('2', '15', '2026-08-03 22:00'),
    m('2', '6', '2026-08-07 10:00'),
    m('2', '1', '2026-09-02 20:00'),
    m('2', '8', '2026-09-10 21:00'),
    // 웹 프로젝트 B팀 (공개 · 6명) — 서연은 9/23 참가 · 9/29 탈퇴, 이영희는 9/25 추방
    m('3', '16', '2026-06-01 19:00', true),
    m('3', '7', '2026-08-07 12:00'),
    m('3', '17', '2026-08-04 19:30'),
    m('3', '18', '2026-08-04 20:00'),
    m('3', '19', '2026-08-04 20:30'),
    m('3', '20', '2026-08-04 21:00'),
    // 데이터 엔지니어링 팀 (공개 · 5명)
    m('5', '21', '2026-08-05 19:00', true),
    m('5', '22', '2026-08-05 19:30'),
    m('5', '23', '2026-08-05 20:00'),
    m('5', '24', '2026-08-05 20:30'),
    m('5', '25', '2026-08-05 21:00'),
    // 클라우드 인프라 스터디 (비공개 · 5명)
    m('6', '26', '2026-08-06 19:00', true),
    m('6', '27', '2026-08-06 19:30'),
    m('6', '28', '2026-08-06 20:00'),
    m('6', '29', '2026-08-06 20:30'),
    m('6', '30', '2026-08-06 21:00'),
  ];
}

function invitations(): InvitationRow[] {
  return [
    // W-10 A팀이 보낸 초대 (서연 = noteam 페르소나의 받은 초대 1건)
    { id: '1', teamId: '1', inviteeId: '5', createdAt: t('2026-09-30 11:00'), status: 'PENDING' },
    // 한동관이 받은 초대 2건 (W-02 · W-08). 비공개 팀이어도 초대받은 사람에게는 실명
    { id: '2', teamId: '3', inviteeId: '1', createdAt: t('2026-09-29 19:00'), status: 'PENDING' },
    { id: '3', teamId: '6', inviteeId: '1', createdAt: t('2026-09-30 09:00'), status: 'PENDING' },
    // 지난 초대 (목록에 안 나온다)
    { id: '4', teamId: '2', inviteeId: '1', createdAt: t('2026-09-01 20:00'), status: 'ACCEPTED' },
    { id: '5', teamId: '1', inviteeId: '6', createdAt: t('2026-09-05 20:00'), status: 'DECLINED' },
  ];
}

/* ------------------------------------------------------------------ */
/* 게시글                                                               */
/* ------------------------------------------------------------------ */

type PostSeed = {
  key: string;
  type: PostType;
  title: string;
  author: string;
  team?: string;
  at: string;
  tags: string[];
  /** TROUBLESHOOTING: [문제, 원인, 해결] · DEVLOG: [한 일, 배운 점]. null = 작성되지 않음 */
  body: (string | null)[];
  commit?: string;
  updated?: string;
  deleted?: string;
};

const POSTS: PostSeed[] = [
  /* ---- 이번 주 (9/28 ~ 10/1 10:00) ---- */
  {
    key: 'redisTtl',
    type: 'TROUBLESHOOTING',
    title: 'Redis TTL이 적용되지 않던 문제',
    author: '1',
    team: '1',
    at: '2026-09-29 14:20',
    tags: ['Redis', 'Spring'],
    body: [
      'TTL을 걸었는데 키가 사라지지 않았어요. 캐시가 계속 남아서 새 잔디 데이터가 화면에 반영되지 않았어요.',
      'set 다음에 expire를 따로 호출했는데, 두 명령 사이에 다른 요청이 set을 한 번 더 실행하면서 TTL이 풀려 버렸어요.',
      'set 명령에 ex 옵션을 같이 넘겨서 저장과 만료 설정을 한 번에 하도록 바꿨어요. 같은 문제가 생기지 않게 캐시 저장은 한 곳에서만 하도록 모았어요.',
    ],
    commit: 'https://github.com/jandilog/server/commit/a1b2c3d4e5f60718293a4b5c6d7e8f9012345678',
  },
  {
    key: 'graphqlN1',
    type: 'TROUBLESHOOTING',
    title: 'GraphQL N+1을 @BatchMapping으로 해결하기',
    author: '2',
    at: '2026-09-28 21:10',
    tags: ['GraphQL', 'Spring'],
    body: [
      '게시글 목록을 부를 때마다 작성자 조회 쿼리가 글 수만큼 나갔어요.',
      null,
      '@SchemaMapping 대신 @BatchMapping으로 작성자를 한 번에 묶어서 조회하도록 바꿨어요.',
    ],
  },
  {
    key: 'schemaDraft',
    type: 'DEVLOG',
    title: 'GraphQL 스키마 초안 정리',
    author: '2',
    team: '1',
    at: '2026-09-29 22:40',
    tags: ['GraphQL'],
    body: ['화면별로 필요한 필드를 모아서 스키마 초안을 만들었어요.', '목록은 커서 방식으로 통일하면 화면 코드가 단순해진다는 걸 알았어요.'],
  },
  {
    key: 'apolloCache',
    type: 'DEVLOG',
    title: 'Apollo 캐시 정규화 정리',
    author: '2',
    at: '2026-10-01 08:30',
    tags: ['React'],
    body: ['id가 없는 값 객체를 캐시에서 어떻게 다루는지 정리했어요.', 'keyFields를 false로 두면 부모 객체에 묻혀서 저장된다는 걸 배웠어요.'],
  },
  {
    key: 'segTree',
    type: 'DEVLOG',
    title: '세그먼트 트리 지연 전파 정리',
    author: '13',
    team: '2',
    at: '2026-09-30 23:00',
    tags: ['알고리즘'],
    body: ['구간 갱신 문제 두 개를 지연 전파로 풀었어요.', '갱신을 미뤄 두는 시점을 그림으로 그려 보니 이해가 쉬웠어요.'],
  },
  {
    key: 'dijkstra',
    type: 'DEVLOG',
    title: '다익스트라 시간 초과 풀이 정리',
    author: '8',
    team: '2',
    at: '2026-09-29 20:00',
    tags: ['알고리즘'],
    body: [
      '시간 초과가 나던 최단 경로 문제를 다시 풀었어요.',
      '큐에서 꺼낸 거리가 이미 갱신된 값보다 크면 건너뛰어야 한다는 걸 배웠어요.',
    ],
  },
  {
    key: 'platinum',
    type: 'DEVLOG',
    title: '백준 플래티넘 도전기 2주차',
    author: '15',
    team: '2',
    at: '2026-09-28 23:30',
    tags: [],
    body: ['플래티넘 5 문제 두 개를 풀었어요.', '막히면 30분 뒤에 풀이를 보는 규칙이 오히려 도움이 됐어요.'],
  },
  /* ---- 지난 주 (9/21 ~ 9/27) ---- */
  {
    key: 'expoDeeplink',
    type: 'TROUBLESHOOTING',
    title: 'Expo 딥링크가 안드로이드에서만 열리지 않을 때',
    author: '4',
    team: '1',
    at: '2026-09-26 19:30',
    tags: ['Expo', 'ReactNative'],
    body: [
      '초대 링크를 누르면 iOS에서는 앱이 열리는데 안드로이드에서는 브라우저만 열렸어요.',
      'app.json의 intentFilters에 호스트를 적지 않아서 안드로이드가 링크를 앱에 넘기지 않았어요.',
      'intentFilters에 scheme과 host를 함께 적고 개발 빌드를 다시 만들었어요.',
    ],
  },
  {
    key: 'flyway',
    type: 'TROUBLESHOOTING',
    title: 'Flyway 체크섬 불일치로 서버가 안 뜨는 문제',
    author: '3',
    at: '2026-09-24 13:00',
    updated: '2026-09-30 21:00',
    tags: ['Flyway', 'MariaDB'],
    body: [
      '배포 서버에서만 Flyway 검증 단계에서 서버가 멈췄어요.',
      '이미 적용된 마이그레이션 파일의 주석을 고쳐서 체크섬이 달라졌어요.',
      '파일을 원래대로 돌리고, 바꿀 내용은 새 버전 파일로 추가했어요.',
    ],
  },
  {
    key: 'dockerCompose',
    type: 'DEVLOG',
    title: 'Docker Compose로 로컬 DB 통일',
    author: '1',
    team: '1',
    at: '2026-09-22 21:00',
    tags: ['Docker', 'Redis'],
    body: ['MariaDB · MongoDB · Redis 컨테이너를 compose 파일 하나로 묶었어요.', '팀원마다 다르던 DB 버전을 맞추니 재현 안 되던 버그가 줄었어요.'],
  },
  {
    key: 'boardTable',
    type: 'DEVLOG',
    title: '팀 현황판 표 컴포넌트 만들기',
    author: '2',
    team: '1',
    at: '2026-09-21 20:00',
    tags: ['React'],
    body: ['팀 현황판 표를 만들고 요일 7칸 점 표시를 붙였어요.', '좁은 화면에서는 표를 가로로 스크롤하게 두는 편이 읽기 쉬웠어요.'],
  },
  {
    key: 'rnKeyboard',
    type: 'TROUBLESHOOTING',
    title: 'React Native 키보드가 입력창을 가리는 문제',
    author: '4',
    team: '1',
    at: '2026-09-22 22:10',
    tags: ['Expo'],
    body: [
      '댓글 입력창을 누르면 키보드가 올라와서 입력창이 가려졌어요.',
      '화면 바깥 컨테이너에 KeyboardAvoidingView를 두지 않았어요.',
      'KeyboardAvoidingView로 감싸고 플랫폼별 behavior를 다르게 줬어요.',
    ],
  },
  {
    key: 'appTabs',
    type: 'DEVLOG',
    title: '앱 탭 내비게이션 구조 잡기',
    author: '4',
    team: '1',
    at: '2026-09-24 21:30',
    tags: ['ReactNative'],
    body: ['홈 · 팀 · 게시판 · 프로필 탭 구조를 만들었어요.', '탭마다 스택을 따로 두면 뒤로 가기가 자연스럽다는 걸 배웠어요.'],
  },
  {
    key: 'nginx413',
    type: 'TROUBLESHOOTING',
    title: 'Nginx 업로드 용량 413 오류',
    author: '16',
    team: '3',
    at: '2026-09-23 18:00',
    tags: ['배포'],
    body: [
      '프로필 사진을 올리면 413 응답이 돌아왔어요.',
      'Nginx 기본 요청 크기 제한이 1MB였어요.',
      'client_max_body_size를 5m으로 올리고 컨테이너를 다시 띄웠어요.',
    ],
  },
  {
    key: 'tossVite',
    type: 'DEVLOG',
    title: 'Vite로 옮긴 이유',
    author: '7',
    team: '3',
    at: '2026-09-20 22:00',
    tags: ['React', '배포'],
    body: ['빌드 도구를 Vite로 바꾸고 배포 설정을 정리했어요.', '개발 서버가 빨라지니 작은 수정도 바로 확인하게 됐어요.'],
  },
  {
    key: 'k8sFirst',
    type: 'DEVLOG',
    title: '쿠버네티스 첫 배포 일지',
    author: '30',
    team: '6',
    at: '2026-09-25 22:00',
    tags: ['배포'],
    body: ['로컬 클러스터에 서비스 하나를 처음 배포했어요.', '디플로이먼트와 서비스의 역할 차이를 직접 띄워 보며 이해했어요.'],
  },
  /* ---- 9/14 주 ---- */
  {
    key: 'upstash',
    type: 'TROUBLESHOOTING',
    title: 'Upstash Redis 명령 수가 갑자기 늘어난 이유',
    author: '3',
    at: '2026-09-19 11:00',
    tags: ['Redis', 'Upstash'],
    body: [
      '하루 무료 명령 수를 오전에 다 써 버렸어요.',
      '헬스체크가 10초마다 캐시 서버에 PING을 보내고 있었어요.',
      '헬스체크 간격을 늘리고 캐시 확인은 따로 떼어 냈어요.',
    ],
  },
  {
    key: 'healthCheck',
    type: 'TROUBLESHOOTING',
    title: '헬스체크에서 캐시 서버를 뺀 이유',
    author: '1',
    team: '1',
    at: '2026-09-15 16:00',
    updated: '2026-09-23 20:00',
    tags: ['Redis', 'Actuator'],
    body: [
      '캐시 서버가 잠깐 느려지면 서버 전체가 비정상으로 표시됐어요.',
      'Actuator 헬스체크에 캐시 서버 상태가 기본으로 포함돼 있었어요.',
      '캐시 서버 상태는 헬스체크 그룹에서 빼고 따로 모니터링하도록 바꿨어요.',
    ],
  },
  {
    key: 'apolloMigrate',
    type: 'TROUBLESHOOTING',
    title: 'Apollo로 옮기며 겪은 캐시 꼬임',
    author: '17',
    team: '3',
    at: '2026-09-17 21:00',
    tags: ['React', 'GraphQL'],
    body: [
      '목록에서 글을 지웠는데 다른 탭 목록에는 그대로 남았어요.',
      '삭제 후 캐시에서 해당 객체를 지우지 않았어요.',
      'cache.evict로 객체를 지우고 gc를 불러 목록 참조를 정리했어요.',
    ],
  },
  {
    key: 'txPropagation',
    type: 'TROUBLESHOOTING',
    title: 'Spring 트랜잭션 전파 때문에 롤백이 안 되던 문제',
    author: '27',
    team: '6',
    at: '2026-09-16 22:00',
    tags: ['Spring'],
    body: [
      '예외가 났는데 일부 데이터가 저장된 채로 남았어요.',
      '안쪽 메서드가 REQUIRES_NEW로 따로 커밋되고 있었어요.',
      '전파 속성을 기본값으로 돌리고 같은 트랜잭션에서 처리했어요.',
    ],
  },
  {
    key: 'mongoAgg',
    type: 'TROUBLESHOOTING',
    title: 'MongoDB 집계 파이프라인이 느릴 때',
    author: '28',
    team: '6',
    at: '2026-09-18 21:00',
    tags: ['MongoDB'],
    body: [
      '태그 집계 화면이 5초 넘게 걸렸어요.',
      '$match보다 $unwind가 먼저 와서 모든 문서를 펼치고 있었어요.',
      '$match를 맨 앞으로 옮기고 인덱스를 탈 수 있게 조건을 바꿨어요.',
    ],
  },
  /* ---- 9/7 주 (전체 면제) ---- */
  {
    key: 'devEnv',
    type: 'DEVLOG',
    title: '개강 주간 개발 환경 다시 세팅하기',
    author: '1',
    at: '2026-09-08 22:00',
    tags: ['Docker'],
    body: ['새 노트북에 개발 환경을 다시 만들었어요.', '설치 순서를 문서로 남겨 두니 두 번째는 한 시간 만에 끝났어요.'],
  },
  {
    key: 'actionsCache',
    type: 'TROUBLESHOOTING',
    title: 'GitHub Actions 캐시가 안 먹던 문제',
    author: '1',
    team: '1',
    at: '2026-09-10 23:00',
    tags: ['Docker'],
    body: [
      '빌드할 때마다 의존성을 처음부터 내려받았어요.',
      '캐시 키에 lock 파일 해시 대신 커밋 해시를 쓰고 있었어요.',
      '캐시 키를 lock 파일 해시로 바꾸고 restore-keys를 추가했어요.',
    ],
  },
  {
    key: 'mariaDeadlock',
    type: 'TROUBLESHOOTING',
    title: 'MariaDB 데드락 로그 읽는 법',
    author: '21',
    team: '5',
    at: '2026-09-11 20:00',
    tags: ['MariaDB'],
    body: [
      '배치가 가끔 데드락으로 실패했어요.',
      '두 작업이 같은 두 행을 서로 반대 순서로 잠그고 있었어요.',
      '잠그는 순서를 id 순으로 통일하고 재시도를 넣었어요.',
    ],
  },
  {
    key: 'dockerSlim',
    type: 'TROUBLESHOOTING',
    title: 'Docker 이미지 용량을 1GB에서 200MB로',
    author: '22',
    team: '5',
    at: '2026-09-09 19:00',
    tags: ['Docker'],
    body: [
      '배포 이미지가 1GB가 넘어서 올리는 데 오래 걸렸어요.',
      '빌드 도구와 소스가 실행 이미지에 그대로 들어가 있었어요.',
      '멀티 스테이지 빌드로 실행에 필요한 파일만 남겼어요.',
    ],
  },
  /* ---- 8/31 주 ---- */
  {
    key: 'springBatch',
    type: 'TROUBLESHOOTING',
    title: 'Spring Batch 청크 크기를 줄여 메모리 부족 막기',
    author: '1',
    team: '1',
    at: '2026-09-01 22:00',
    tags: ['Spring'],
    body: [
      '잔디 수집 배치가 회원이 늘자 메모리 부족으로 멈췄어요.',
      '청크 크기를 1000으로 잡아 한 번에 너무 많은 응답을 들고 있었어요.',
      '청크 크기를 100으로 줄이고 처리 결과를 바로 비우도록 바꿨어요.',
    ],
  },
  {
    key: 'mongoIndex',
    type: 'DEVLOG',
    title: 'MongoDB 인덱스 설계 메모',
    author: '1',
    team: '1',
    at: '2026-09-04 21:00',
    tags: ['MongoDB'],
    body: ['게시글 검색과 목록 조회에 필요한 인덱스를 정리했어요.', '복합 인덱스는 조건 순서가 중요하다는 걸 실행 계획으로 확인했어요.'],
  },
  {
    key: 'expoPush',
    type: 'TROUBLESHOOTING',
    title: 'Expo 푸시 알림 토큰이 null로 오는 문제',
    author: '19',
    at: '2026-09-02 20:00',
    tags: ['Expo'],
    body: [
      '실기기에서 푸시 토큰이 계속 null이었어요.',
      '알림 권한을 묻기 전에 토큰을 요청하고 있었어요.',
      '권한을 먼저 받은 뒤 토큰을 요청하도록 순서를 바꿨어요.',
    ],
  },
  /* ---- 8/24 주 (한동관 첫 참가) ---- */
  {
    key: 'kickoff',
    type: 'DEVLOG',
    title: '잔디로그 첫 기획 회의 정리',
    author: '1',
    team: '1',
    at: '2026-08-25 21:00',
    tags: ['Spring'],
    body: ['첫 회의에서 주간 판정 규칙과 화면 목록을 정했어요.', '규칙을 먼저 글로 정리해 두니 화면 논의가 빨라졌어요.'],
  },
  {
    key: 'cors',
    type: 'TROUBLESHOOTING',
    title: '로컬에서만 되는 CORS 설정',
    author: '1',
    team: '1',
    at: '2026-08-27 20:30',
    tags: ['Spring'],
    body: [
      '배포하자 프론트에서 모든 요청이 CORS 오류로 막혔어요.',
      '허용 출처 목록에 localhost만 들어 있었어요.',
      '허용 출처를 환경 변수로 빼서 배포 주소를 넣었어요.',
    ],
  },
  {
    key: 'jpaLazy',
    type: 'TROUBLESHOOTING',
    title: 'JPA 지연 로딩 예외 정리',
    author: '6',
    team: '2',
    at: '2026-08-26 22:00',
    tags: ['Spring'],
    body: [
      '응답을 만들 때 LazyInitializationException이 났어요.',
      '트랜잭션이 끝난 뒤 연관 객체를 꺼내고 있었어요.',
      '필요한 연관 객체를 조회 쿼리에서 함께 가져오도록 바꿨어요.',
    ],
  },
  {
    key: 'graphqlDate',
    type: 'TROUBLESHOOTING',
    title: 'GraphQL Date 스칼라 직렬화 오류',
    author: '18',
    team: '3',
    at: '2026-08-28 21:00',
    tags: ['GraphQL', 'Spring'],
    body: [
      'Date 필드를 내려주면 직렬화 오류가 났어요.',
      '커스텀 스칼라를 등록하지 않아 LocalDate를 변환하지 못했어요.',
      'RuntimeWiringConfigurer로 Date 스칼라를 등록했어요.',
    ],
  },
  /* ---- 그 전 ---- */
  {
    key: 'flywayOrder',
    type: 'TROUBLESHOOTING',
    title: 'Flyway 마이그레이션 순서가 꼬였을 때',
    author: '23',
    team: '5',
    at: '2026-08-21 20:00',
    tags: ['Flyway', 'MariaDB'],
    body: [
      '브랜치를 합친 뒤 마이그레이션이 적용되지 않았어요.',
      '두 브랜치에서 같은 버전 번호를 썼어요.',
      '버전 번호를 날짜 기반으로 바꾸고 outOfOrder를 잠시 켰어요.',
    ],
  },
  {
    key: 'static404',
    type: 'TROUBLESHOOTING',
    title: '배포 후 정적 파일이 404로 뜨는 문제',
    author: '24',
    team: '5',
    at: '2026-08-19 22:00',
    tags: ['배포'],
    body: [
      '새로고침하면 화면 대신 404가 나왔어요.',
      '정적 호스팅에서 모든 경로를 index.html로 돌리는 설정이 없었어요.',
      '리라이트 규칙을 추가했어요.',
    ],
  },
  {
    key: 'jacksonDate',
    type: 'TROUBLESHOOTING',
    title: 'Spring Boot 3 업그레이드 후 날짜 형식이 바뀐 문제',
    author: '25',
    at: '2026-08-16 20:00',
    tags: ['Spring'],
    body: [
      '업그레이드 후 API의 날짜가 숫자 배열로 내려왔어요.',
      '날짜 모듈 설정이 기본값으로 돌아갔어요.',
      'WRITE_DATES_AS_TIMESTAMPS를 끄고 형식을 명시했어요.',
    ],
  },
  {
    key: 'oauthFlow',
    type: 'DEVLOG',
    title: 'Spring Security OAuth2 로그인 흐름 이해하기',
    author: '1',
    at: '2026-08-12 22:00',
    tags: ['Spring'],
    body: ['GitHub 로그인 흐름을 단계별로 그려 봤어요.', '성공 핸들러에서 일회용 코드를 넘기는 방식이 안전하다는 걸 배웠어요.'],
  },
  {
    key: 'mariaTz',
    type: 'TROUBLESHOOTING',
    title: 'MariaDB 타임존이 9시간 밀리던 문제',
    author: '1',
    at: '2026-08-14 21:00',
    tags: ['MariaDB'],
    body: [
      '저장한 시각이 화면에서 9시간 늦게 보였어요.',
      'DB 서버 타임존은 UTC, 접속 설정은 서울로 서로 달랐어요.',
      '접속 URL에 serverTimezone을 맞추고 저장은 KST로 통일했어요.',
    ],
  },
  {
    key: 'expoBuild',
    type: 'DEVLOG',
    title: 'Expo 개발 빌드 처음 세팅하기',
    author: '1',
    at: '2026-08-18 23:00',
    tags: ['Expo'],
    body: ['Expo Go 대신 개발 빌드를 처음 만들었어요.', '네이티브 모듈을 쓰려면 개발 빌드가 필요하다는 걸 알았어요.'],
  },
  /* ---- 삭제된 글 (E-31) ---- */
  {
    key: 'deletedMemo',
    type: 'DEVLOG',
    title: '임시 메모',
    author: '2',
    at: '2026-09-27 10:00',
    tags: [],
    body: ['나중에 정리할 메모예요.', null],
    deleted: '2026-09-30 09:00',
  },
];

const TS_KEYS: PostSectionKey[] = ['problem', 'cause', 'solution'];
const DEVLOG_KEYS: PostSectionKey[] = ['did', 'learned'];
export const sectionKeysOf = (type: PostType): PostSectionKey[] => (type === 'TROUBLESHOOTING' ? TS_KEYS : DEVLOG_KEYS);

function posts(): { rows: PostRow[]; idByKey: Record<string, Id> } {
  const sorted = [...POSTS].sort((a, b) => Date.parse(t(a.at)) - Date.parse(t(b.at)));
  const idByKey: Record<string, Id> = {};
  const rows = sorted.map((p, i): PostRow => {
    const id = objectId(POST_OID_PREFIX, i + 1);
    idByKey[p.key] = id;
    const keys = sectionKeysOf(p.type);
    return {
      id,
      type: p.type,
      title: p.title,
      sections: Object.fromEntries(keys.map((k, n) => [k, p.body[n] ?? null])),
      tags: p.tags,
      commitUrls: p.commit ? [p.commit] : [],
      authorId: p.author,
      teamId: p.team ?? null,
      createdAt: t(p.at),
      updatedAt: p.updated ? t(p.updated) : null,
      deletedAt: p.deleted ? t(p.deleted) : null,
    };
  });
  return { rows, idByKey };
}

/* ------------------------------------------------------------------ */
/* 댓글 — 목업 개수를 맞추고, 한동관 댓글 합계 34개(W-14)                  */
/* ------------------------------------------------------------------ */

const ME_COMMENT_TOTAL = 34;
const COMMENT_PHRASES = [
  '정리 감사해요. 저도 비슷하게 막혔었어요.',
  '원인 찾은 과정이 특히 도움이 됐어요.',
  '혹시 다른 방법도 시도해 보셨어요?',
  '다음 회의 때 같이 이야기해 봐요.',
  '이 부분 저희 팀 코드에도 적용해 볼게요.',
  '그림으로 설명해 주셔서 이해가 쉬웠어요.',
  '저는 설정 파일 쪽을 의심했는데 아니었군요.',
  '좋은 글이에요! 북마크해 둘게요.',
];
const COMMENT_POOL = ['2', '3', '4', '13', '16', '7', '21', '26'];

function comments(idByKey: Record<string, Id>, postRows: PostRow[]): CommentRow[] {
  const explicit: Record<string, [author: string, at: string, content: string][]> = {
    redisTtl: [
      ['2', '2026-09-29 15:02', '저도 같은 문제 겪었어요. ex 옵션 몰랐는데 덕분에 알았어요.'],
      ['1', '2026-09-29 15:30', '저도 한참 헤맸어요. 커밋 링크 참고해 주세요!'],
      ['3', '2026-09-29 16:10', '저도 같은 문제 겪었어요'],
    ],
    graphqlN1: [],
    healthCheck: [],
    expoDeeplink: [
      ['1', '2026-09-26 20:05', 'intentFilters 설정 위치까지 적어 주셔서 좋아요.'],
      ['2', '2026-09-26 20:40', '저도 iOS만 확인하고 넘어갈 뻔했어요.'],
      ['4', '2026-09-26 21:00', '다음에는 체크리스트에 넣어 둘게요.'],
      ['1', '2026-09-26 21:30', '팀 위키에도 옮겨 두면 좋겠어요.'],
      ['3', '2026-09-27 10:00', '덕분에 바로 해결했어요!'],
    ],
    flyway: [
      ['1', '2026-09-24 14:00', '이미 적용된 파일은 건드리지 않기, 기억할게요.'],
      ['4', '2026-09-24 15:20', 'repair 명령은 써 보셨어요?'],
    ],
    upstash: [['2', '2026-09-19 13:00', 'PING도 명령 수에 들어가는군요.']],
    nginx413: [
      ['17', '2026-09-23 19:00', '저희 팀도 같은 설정이 필요했어요.'],
      ['1', '2026-09-23 20:00', '업로드 한도 5MB랑 맞추셨군요. 좋아요.'],
    ],
    deletedMemo: [],
  };

  type Draft = { postId: Id; authorId: Id; at: string; content: string; explicit: boolean };
  const drafts: Draft[] = [];
  for (const [key, list] of Object.entries(explicit)) {
    const postId = idByKey[key];
    if (!postId) continue;
    for (const [authorId, at, content] of list) drafts.push({ postId, authorId, at: t(at), content, explicit: true });
  }

  // 나머지 글: 1~3개씩, 짝수 번째는 한동관
  const generated: Draft[] = [];
  postRows.forEach((p, i) => {
    const key = Object.entries(idByKey).find(([, id]) => id === p.id)?.[0] ?? '';
    if (key in explicit) return;
    const n = 1 + (i % 3);
    for (let j = 0; j < n; j += 1) {
      const at = new Date(Date.parse(p.createdAt) + (j + 1) * 20 * 60_000);
      generated.push({
        postId: p.id,
        authorId: j % 2 === 0 ? '1' : (COMMENT_POOL[(i + j) % COMMENT_POOL.length] ?? '2'),
        at: kstIsoFromDate(at),
        content: COMMENT_PHRASES[(i * 3 + j) % COMMENT_PHRASES.length] ?? '좋은 글이에요.',
        explicit: false,
      });
    }
  });

  // 한동관 합계를 34개로 맞춘다 (생성분의 작성자만 조정)
  const mine = () => drafts.filter((d) => d.authorId === '1').length + generated.filter((d) => d.authorId === '1').length;
  for (let k = generated.length - 1; k >= 0 && mine() > ME_COMMENT_TOTAL; k -= 1) {
    const g = generated[k];
    if (g && g.authorId === '1') g.authorId = COMMENT_POOL[k % COMMENT_POOL.length] ?? '2';
  }
  for (let k = 0; k < generated.length && mine() < ME_COMMENT_TOTAL; k += 1) {
    const g = generated[k];
    if (g && g.authorId !== '1') g.authorId = '1';
  }

  return [...drafts, ...generated]
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at))
    .map((d, i) => ({
      id: objectId(COMMENT_OID_PREFIX, i + 1),
      postId: d.postId,
      authorId: d.authorId,
      content: d.content,
      createdAt: d.at,
      updatedAt: null,
      deletedAt: null,
    }));
}

function kstIsoFromDate(d: Date): string {
  const k = new Date(d.getTime() + 9 * 3_600_000);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${k.getUTCFullYear()}-${p(k.getUTCMonth() + 1)}-${p(k.getUTCDate())}T${p(k.getUTCHours())}:${p(k.getUTCMinutes())}:${p(k.getUTCSeconds())}+09:00`;
}

/* ------------------------------------------------------------------ */
/* 공지                                                                 */
/* ------------------------------------------------------------------ */

function notices(): NoticeRow[] {
  const n = (id: string, title: string, content: string, at: string, opts: { pinned?: boolean; system?: boolean; updated?: string } = {}): NoticeRow => ({
    id,
    title,
    content,
    isPinned: !!opts.pinned,
    isSystem: !!opts.system,
    createdAt: t(at),
    updatedAt: opts.updated ? t(opts.updated) : null,
    deletedAt: null,
  });
  return [
    n('1', '잔디로그 정식 오픈', '오늘부터 잔디로그를 정식으로 써요.\n첫 로그인 후 관리자 승인을 기다려 주세요.', '2026-08-20 10:00'),
    n(
      '2',
      '잔디 인정 규칙 안내',
      [
        '매주 월요일 오전에 지난 한 주(월~일)를 개인 단위로 판정해요.',
        '',
        '통과 조건',
        '- 인증일 3일 이상: GitHub 잔디가 있거나 기록글을 쓴 날을 하루로 세요. 둘 다 있어도 하루예요.',
        '- 기록글 1개 이상: 필수 항목을 모두 채운 글만 인정돼요.',
        '',
        '경고와 차감',
        '- 조건을 못 채우면 경고 1회가 쌓여요.',
        '- 2주 연속 통과하면 가장 오래된 경고 1개가 차감돼요.',
        '- 경고 3회가 되면 벌칙 대상이 되고, 그동안은 차감되지 않아요.',
        '',
        'GitHub 잔디는 매일 오전 6시에 한 번 불러와요. 비공개 저장소 기여를 세려면 GitHub 프로필에서 비공개 기여 표시를 켜 주세요.',
      ].join('\n'),
      '2026-09-01 09:00',
      { pinned: true, system: true },
    ),
    n('3', 'GitHub 비공개 기여 설정 확인해 주세요', '비공개 저장소에서 작업했다면 GitHub 설정에서 비공개 기여 표시를 켜야 잔디가 보여요.', '2026-09-10 10:00'),
    n('4', '추석 연휴에도 판정은 그대로 진행돼요', '연휴 주간(9/21 ~ 9/27)도 평소처럼 판정해요.\n사정이 있으면 팀장에게 개인 면제를 요청해 주세요.', '2026-09-18 15:00'),
    n('5', '2학기 스터디 팀 모집', '2학기에 새로 만들 스터디 팀을 모집해요.\n관심 있는 주제를 동아리 채널에 남겨 주세요.', '2026-09-22 12:00'),
    n('6', '10월 정기 모임은 10/8(목) 저녁 7시예요', '장소: 공학관 301호\n준비물: 이번 학기 목표 한 줄', '2026-09-29 18:00'),
  ];
}

/* ------------------------------------------------------------------ */
/* 잔디 덮어쓰기 (이번 주 · 한동관 판정 주)                               */
/* ------------------------------------------------------------------ */

export const SEED_CURRENT_WEEK = '2026-09-28';

function grassOverrides(): Record<Id, Record<string, number>> {
  const week = (weekStart: string, counts: number[]) =>
    Object.fromEntries(weekDates(weekStart).map((d, i) => [d, counts[i] ?? 0]));
  const cw = (counts: number[]) => week(SEED_CURRENT_WEEK, [...counts, 0, 0, 0, 0, 0, 0, 0].slice(0, 7));
  return {
    // 한동관: 이번 주 월 3 · 화 1 · 수 0 · 목 0 (HOME_DAYS) + 판정 주 스냅숏과 맞춘 값
    '1': {
      ...week('2026-08-31', [1, 0, 0, 0, 0, 0, 0]),
      ...week('2026-09-14', [0, 0, 2, 0, 0, 0, 0]),
      ...week('2026-09-21', [2, 0, 1, 0, 3, 0, 0]),
      ...cw([3, 1, 0, 0]),
    },
    // A팀 (W-09 TEAM 배열)
    '2': cw([2, 0, 3, 1]),
    '3': cw([0, 0, 0, 0]),
    '4': cw([4, 2, 3, 1]),
    // 알고리즘 스터디: 통과 3(오민석 · 최유진 · 임도윤) · 아직 3 (W-08)
    '13': cw([2, 1, 0, 3]),
    '8': cw([1, 0, 2, 0]),
    '15': cw([0, 2, 1, 1]),
    '6': cw([0, 0, 1, 0]),
    '14': cw([1, 0, 0, 2]),
    '5': cw([0, 1, 0, 0]),
  };
}

/* ------------------------------------------------------------------ */
/* 판정 · 경고                                                          */
/* ------------------------------------------------------------------ */

const JUDGED_WEEKS = ['2026-08-24', '2026-08-31', '2026-09-07', '2026-09-14', '2026-09-21'] as const;
const EXEMPTION_WEEK = '2026-09-07';

/** P 통과 · F 미달(+카테고리) · X1 첫 참가 · PX 개인 면제 · H 보류(API 오류) · '-' 판정 없음 */
type Plan =
  | { s: 'P'; v: number; r: number }
  | { s: 'F'; v: number; r: number; cats: Id[]; deleted?: { reason: 'KICKED' | 'TEAM_DELETED'; at: string } }
  | { s: 'X1' }
  | { s: 'PX' }
  | { s: 'H' }
  | { s: '-' };

const P = (v: number, r: number): Plan => ({ s: 'P', v, r });
const F = (v: number, r: number, cats: Id[], deleted?: { reason: 'KICKED' | 'TEAM_DELETED'; at: string }): Plan => ({ s: 'F', v, r, cats, deleted });

/** 이름 있는 회원의 주별 계획 (9/7은 전체 면제라 생략) */
const NAMED_PLANS: Record<Id, Partial<Record<(typeof JUDGED_WEEKS)[number], Plan>>> = {
  // 한동관: 8/24 첫 참가 · 8/31 통과 · 9/7 면제 · 9/14 미달(A팀 + 알고리즘) · 9/21 통과 (W-06)
  '1': { '2026-08-24': { s: 'X1' }, '2026-08-31': P(3, 2), '2026-09-14': F(1, 0, ['1', '2']), '2026-09-21': P(4, 1) },
  '2': { '2026-08-24': P(5, 2), '2026-08-31': P(4, 1), '2026-09-14': P(3, 1), '2026-09-21': P(4, 1) },
  '3': {
    '2026-08-24': P(3, 1),
    '2026-08-31': F(2, 0, ['1']),
    '2026-09-14': F(1, 0, ['3'], { reason: 'KICKED', at: '2026-09-25 18:00' }),
    '2026-09-21': F(2, 0, ['1']),
  },
  '4': { '2026-08-24': P(4, 2), '2026-08-31': P(3, 1), '2026-09-14': P(4, 1), '2026-09-21': P(5, 3) },
  '5': { '2026-08-24': { s: '-' }, '2026-08-31': { s: '-' }, '2026-09-07': { s: '-' }, '2026-09-14': { s: '-' }, '2026-09-21': { s: 'X1' } },
  '6': { '2026-08-24': P(3, 1), '2026-08-31': F(1, 0, ['1', '2']), '2026-09-14': F(2, 0, ['1', '2']), '2026-09-21': F(0, 0, ['2']) },
  '7': { '2026-08-24': F(1, 0, ['3']), '2026-08-31': F(2, 0, ['3']), '2026-09-14': F(0, 0, ['3']), '2026-09-21': P(3, 1) },
  '8': {
    '2026-08-24': P(4, 1),
    '2026-08-31': F(2, 0, ['4'], { reason: 'TEAM_DELETED', at: '2026-09-20 22:00' }),
    '2026-09-14': P(3, 2),
    '2026-09-21': P(4, 1),
  },
  // 채움 회원 예외
  '17': { '2026-08-24': F(2, 0, ['3']), '2026-09-21': F(1, 0, ['3']) },
  '18': { '2026-08-31': F(2, 1, ['3']) },
  '24': { '2026-09-14': F(2, 0, ['5']) },
  '25': { '2026-09-14': P(2, 0) }, // 미달 → 통과로 정정된 판정 (아래 corrections). 인증일 · 기록글은 판정 당시 값 그대로
  '27': { '2026-09-21': F(3, 0, ['6']) },
  '14': { '2026-09-21': { s: 'PX' } },
  '22': { '2026-09-21': { s: 'PX' } },
  '29': { '2026-09-21': { s: 'H' } },
};

const FILLER_IDS = ['13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30'];
const JUDGED_MEMBER_IDS = ['1', '2', '3', '4', '5', '6', '7', '8', ...FILLER_IDS];

/** 결정적 의사 난수 0..1 */
export function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

/** 판정 스냅숏: 인증일 v · 기록글 r을 요일에 흩뿌린다 */
function synthDays(v: number, r: number): JudgmentDay[] {
  const order = [0, 2, 4, 1, 3, 5, 6];
  const days: JudgmentDay[] = Array.from({ length: 7 }, () => ({ hasGrass: false, hasRecord: false }));
  order.slice(0, v).forEach((d, i) => {
    const day = days[d];
    if (!day) return;
    if (i < r) day.hasRecord = true;
    if (i >= r || i % 2 === 0) day.hasGrass = true;
  });
  return days;
}

type JudgmentBuild = { judgments: JudgmentRow[]; warnings: WarningRow[]; corrections: DbState['judgmentCorrections'] };

function judgmentsAndWarnings(postRows: PostRow[], overrides: Record<Id, Record<string, number>>, idByKey: Record<string, Id>): JudgmentBuild {
  const judgments: JudgmentRow[] = [];
  const warnings: WarningRow[] = [];
  let jid = 0;
  let wid = 0;

  // 시드 이전 이력: 한동관 7/13 경고(차감됨, 웹 프로젝트 B팀) — W-07
  wid += 1;
  warnings.push({
    id: String(wid),
    memberId: '1',
    weekStart: '2026-07-13',
    judgmentId: null,
    verifiedDays: 2,
    recordCount: 0,
    teamIds: ['3'],
    originalTeamIds: ['3'],
    deleted: null,
    retractedAt: null,
    fixedStanding: 'DEDUCTED',
  });

  /** 한동관 스냅숏은 잔디 덮어쓰기 + 그 주 기록글에서 계산 (헬스체크 글은 판정 당시 미완성이라 뺀다) */
  const actualDays = (memberId: Id, weekStart: string, ignore: Id[]): JudgmentDay[] =>
    weekDates(weekStart).map((d) => {
      const grass = overrides[memberId]?.[d] ?? 0;
      const hasRecord = postRows.some(
        (p) =>
          p.authorId === memberId &&
          !ignore.includes(p.id) &&
          !p.deletedAt &&
          p.createdAt.slice(0, 10) === d &&
          Object.values(p.sections).every((b) => !!b && b.trim().length > 0),
      );
      return { hasGrass: grass > 0, hasRecord };
    });

  for (const weekStart of JUDGED_WEEKS) {
    const executedAt = executionTimeOf(weekStart);
    for (const memberId of JUDGED_MEMBER_IDS) {
      let plan: Plan | undefined = NAMED_PLANS[memberId]?.[weekStart];
      if (!plan) {
        const h = hash01(`${memberId}:${weekStart}`);
        plan = P(3 + Math.floor(h * 4), 1 + Math.floor(hash01(`r${memberId}${weekStart}`) * 3));
      }
      if (plan.s === '-') continue;
      jid += 1;
      const id = String(jid);
      const useActual = memberId === '1';
      const base = {
        id,
        memberId,
        weekStart,
        holdReason: null,
        corrected: false,
        executedAt,
        judgedAt: executedAt,
      } as const;
      const exemptByPeriod = weekStart === EXEMPTION_WEEK && !NAMED_PLANS[memberId]?.[weekStart];
      if (exemptByPeriod) {
        judgments.push({ ...base, status: 'EXEMPT', skipReason: 'EXEMPTION_PERIOD', verifiedDays: null, recordCount: null, days: useActual ? actualDays(memberId, weekStart, []) : synthDays(2, 1) });
        continue;
      }
      switch (plan.s) {
        case 'X1':
          judgments.push({ ...base, status: 'EXCLUDED', skipReason: 'FIRST_WEEK' as SkipReason, verifiedDays: null, recordCount: null, days: useActual ? actualDays(memberId, weekStart, []) : synthDays(2, 0) });
          break;
        case 'PX':
          judgments.push({ ...base, status: 'EXEMPT', skipReason: 'PERSONAL_EXEMPTION', verifiedDays: null, recordCount: null, days: synthDays(1, 0) });
          break;
        case 'H':
          judgments.push({ ...base, status: 'HOLD', skipReason: null, holdReason: 'API_ERROR', verifiedDays: null, recordCount: null, days: synthDays(0, 0), judgedAt: null });
          break;
        case 'P':
        case 'F': {
          const ignore = memberId === '1' && weekStart === '2026-09-14' && idByKey.healthCheck ? [idByKey.healthCheck] : [];
          const days = useActual ? actualDays(memberId, weekStart, ignore) : synthDays(plan.v, plan.r);
          judgments.push({ ...base, status: plan.s === 'P' ? 'PASS' : 'FAIL', skipReason: null, verifiedDays: plan.v, recordCount: plan.r, days });
          if (plan.s === 'F') {
            wid += 1;
            warnings.push({
              id: String(wid),
              memberId,
              weekStart,
              judgmentId: id,
              verifiedDays: plan.v,
              recordCount: plan.r,
              teamIds: plan.deleted ? [] : plan.cats,
              originalTeamIds: plan.cats,
              deleted: plan.deleted ? { reason: plan.deleted.reason, at: t(plan.deleted.at) } : null,
              retractedAt: null,
            });
          }
          break;
        }
      }
    }
  }

  // 정정 이력 1건: 류건우 9/14 미달 → 통과 (경고 회수)
  const corrected = judgments.find((j) => j.memberId === '25' && j.weekStart === '2026-09-14');
  const corrections: DbState['judgmentCorrections'] = [];
  if (corrected) {
    corrected.corrected = true;
    corrections.push({
      id: '1',
      judgmentId: corrected.id,
      beforeStatus: 'FAIL',
      afterStatus: 'PASS',
      reason: 'GitHub 비공개 기여 설정이 꺼져 있었던 것을 확인했어요',
      correctedById: '1',
      correctedAt: t('2026-09-22 11:00'),
    });
    wid += 1;
    warnings.push({
      id: String(wid),
      memberId: '25',
      weekStart: '2026-09-14',
      judgmentId: corrected.id,
      verifiedDays: 2,
      recordCount: 0,
      teamIds: ['5'],
      originalTeamIds: ['5'],
      deleted: null,
      retractedAt: t('2026-09-22 11:00'),
    });
  }

  return { judgments, warnings, corrections };
}

/* ------------------------------------------------------------------ */
/* 면제                                                                 */
/* ------------------------------------------------------------------ */

function exemptionPeriods(): ExemptionPeriodRow[] {
  return [
    { id: '1', weekStart: EXEMPTION_WEEK, reason: '2학기 개강 주간', createdAt: t('2026-09-01 10:00'), updatedAt: null },
    { id: '2', weekStart: '2026-10-19', reason: '중간고사 기간', createdAt: t('2026-09-25 10:00'), updatedAt: null },
    { id: '3', weekStart: '2026-10-26', reason: '중간고사 기간 (2주차)', createdAt: t('2026-09-25 10:05'), updatedAt: null },
  ];
}

function personalExemptions(): PersonalExemptionRow[] {
  const pe = (
    id: string,
    memberId: string,
    requestedById: string,
    teamId: string,
    weekStart: string,
    reason: string,
    status: PersonalExemptionRow['status'],
    createdAt: string,
    respondedAt: string | null = null,
    rejectReason: string | null = null,
  ): PersonalExemptionRow => ({
    id,
    memberId,
    requestedById,
    teamId,
    weekStart,
    reason,
    status,
    rejectReason,
    createdAt: t(createdAt),
    respondedAt: respondedAt ? t(respondedAt) : null,
  });
  return [
    pe('1', '14', '13', '2', '2026-09-21', '가족 행사로 일주일 동안 지방에 있어요.', 'APPROVED', '2026-09-18 20:00', '2026-09-19 10:00'),
    pe('2', '22', '21', '5', '2026-09-21', '입원 치료 중이에요.', 'APPROVED', '2026-09-20 09:00', '2026-09-20 15:00'),
    pe('3', '3', '1', '1', '2026-09-21', '개인 사정', 'REJECTED', '2026-09-22 10:00', '2026-09-24 11:00', '사유를 조금 더 자세히 적어 주세요.'),
    // 대기 2건 (W-15 '면제 요청 대기 2')
    pe('4', '19', '16', '3', SEED_CURRENT_WEEK, '예비군 훈련이 있어요.', 'PENDING', '2026-09-28 10:00'),
    pe('5', '2', '1', '1', '2026-10-05', '학회 발표 준비로 한 주 쉬어요.', 'PENDING', '2026-09-30 18:00'),
  ];
}

/* ------------------------------------------------------------------ */
/* 조립                                                                 */
/* ------------------------------------------------------------------ */

export function createSeed(): DbState {
  const { rows: postRows, idByKey } = posts();
  const overrides = grassOverrides();
  const { judgments, warnings, corrections } = judgmentsAndWarnings(postRows, overrides, idByKey);
  return {
    version: 1,
    members: members(),
    teams: teams(),
    memberships: memberships(),
    invitations: invitations(),
    teamJoinBlocks: [{ teamId: '3', memberId: '3', until: t('2026-10-25 18:00') }],
    posts: postRows,
    comments: comments(idByKey, postRows),
    notices: notices(),
    judgments,
    judgmentCorrections: corrections,
    warnings,
    penaltyFulfillments: [],
    exemptionPeriods: exemptionPeriods(),
    personalExemptions: personalExemptions(),
    grassOverrides: overrides,
  };
}

/** 시드 글 id 찾기 (테스트 · 문서용) */
export function seedPostId(key: string): Id | undefined {
  return posts().idByKey[key];
}
