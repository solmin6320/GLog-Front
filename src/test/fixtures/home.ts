/**
 * 홈(CM-01) 픽스처 (F18). 공지는 백엔드 notice.graphqls NoticePage 모양 — 고정 공지가 위, 그 아래 최신순(서버 정렬).
 */
import { backend } from '../backend';
import { judgmentHistory, MEMBER_WARNINGS, warningHistory, weeklyActivity } from './activity';

const notice = (id: string, title: string, createdAt: string, o: { isPinned?: boolean; isSystem?: boolean } = {}) => ({
  id,
  title,
  content: `${title} 본문`,
  isPinned: o.isPinned ?? false,
  isSystem: o.isSystem ?? false,
  createdAt,
  updatedAt: null,
});

/** 잔디 인정 규칙(시스템 · 고정) → 정기 모임 → 스터디 모집 → 오래된 공지 (홈은 앞 3건만) */
export const NOTICES = [
  notice('2', '잔디 인정 규칙 안내', '2026-09-01T09:00:00+09:00', { isPinned: true, isSystem: true }),
  notice('4', '10월 정기 모임은 10/8(목) 저녁 7시예요', '2026-09-29T18:00:00+09:00'),
  notice('3', '2학기 스터디 팀 모집', '2026-09-15T12:00:00+09:00'),
  notice('1', '잔디로그를 시작해요', '2026-08-20T10:00:00+09:00'),
];

export const noticePage = (items = NOTICES) => ({ items, nextCursor: null });

/** 팀 하나 (세션 hasTeam · 프로필 현황판 링크용) */
export const myTeam = (id = '1', isLeader = true) => ({
  id,
  name: '사이드 프로젝트 A팀',
  isPublic: true,
  isLeader,
  memberCount: 4,
});

export const invitations = (n: number) => ({ items: Array.from({ length: n }, (_, i) => ({ id: String(i + 1) })), nextCursor: null });

/** 한동관 홈 한 벌: 팀 1개 · 받은 초대 2건 · 이번 주 · 경고 1/3(연속 통과 1) · 공지 */
export function installHome() {
  backend
    .on('myTeams', [myTeam()])
    .on('receivedTeamInvitations', invitations(2))
    .on('myWeeklyActivity', weeklyActivity())
    .on('myJudgmentHistory', judgmentHistory())
    .on('myWarningSummary', MEMBER_WARNINGS)
    .on('myWarningHistory', warningHistory())
    .on('notices', noticePage());
}
