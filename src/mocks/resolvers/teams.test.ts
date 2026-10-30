import { describe, expect, it } from 'vitest';
import { mockTokenFor, type PersonaKey } from '../control';
import { db } from '../db/store';
import { executeMock } from '../schema';

type Json = Record<string, unknown>;
type Who = PersonaKey | { id: string };

async function run(query: string, as: Who = 'member', variables?: Json) {
  const token = typeof as === 'string' ? mockTokenFor(as) : `mock.${as.id}`;
  const res = await executeMock({ query, variables, authorization: `Bearer ${token}` });
  return { data: res.data as Json | null | undefined, codes: (res.errors ?? []).map((e) => e.extensions?.code), errors: res.errors };
}

async function ok(query: string, as: Who = 'member', variables?: Json): Promise<Json> {
  const r = await run(query, as, variables);
  expect(r.errors?.map((e) => e.message) ?? []).toEqual([]);
  return r.data as Json;
}

const codesOf = async (query: string, as: Who = 'member', variables?: Json) => (await run(query, as, variables)).codes;
const fieldOf = async (query: string, as: Who = 'member') => (await run(query, as)).errors?.[0]?.extensions?.field;

const TEAM = 'id name isPublic isLeader memberCount joinedAt';

describe('teams 목 리졸버 — 생성 · 참가 (TM-02 · TM-03)', () => {
  it('createTeam: 만든 사람이 팀장, 초대코드 XXXX-XXXX는 응답에 반드시 온다', async () => {
    const d = await ok(`mutation { createTeam(input: { name: "  새 팀  ", isPublic: false }) { inviteCode team { ${TEAM} } } }`, 'noteam');
    const payload = d.createTeam as { inviteCode: string; team: Json };
    expect(payload.inviteCode).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(payload.team).toMatchObject({ name: '새 팀', isPublic: false, isLeader: true, memberCount: 1 });
    expect(await ok(`{ teamInviteCode(teamId: "${payload.team.id as string}") }`, 'noteam')).toEqual({ teamInviteCode: payload.inviteCode });
    expect(await ok('{ myTeams { id } }', 'noteam')).toEqual({ myTeams: [{ id: payload.team.id }] });
  });

  it('createTeam: isPublic을 생략하면 공개', async () => {
    const d = await ok('mutation { createTeam(input: { name: "기본" }) { team { isPublic } } }', 'noteam');
    expect(d.createTeam).toEqual({ team: { isPublic: true } });
  });

  it('createTeam: 이름 빈 값 · 21자 · 설명 101자는 VALIDATION_FAILED', async () => {
    expect(await fieldOf('mutation { createTeam(input: { name: "  ", isPublic: true }) { inviteCode } }')).toBe('name');
    expect(await fieldOf(`mutation { createTeam(input: { name: "${'가'.repeat(21)}", isPublic: true }) { inviteCode } }`)).toBe('name');
    expect(await fieldOf(`mutation { createTeam(input: { name: "팀", description: "${'a'.repeat(101)}", isPublic: true }) { inviteCode } }`)).toBe(
      'description',
    );
  });

  it('joinTeamByCode: 대소문자 무시 · E-10 · E-11 · E-12', async () => {
    const join = (code: string) => `mutation { joinTeamByCode(code: "${code}") { ${TEAM} } }`;
    expect(await codesOf(join('NOPE-0000'), 'noteam')).toEqual(['TEAM_CODE_NOT_FOUND']);
    expect(await codesOf(join('jd7k-q2ma'), 'plain')).toEqual(['TEAM_ALREADY_JOINED']);
    // 이영희(3)는 시드에서 B팀(3) 초대코드 차단 중 — 사유 · 기간은 응답에 없다
    const blocked = await run(join('WB3N-7KQX'), { id: '3' });
    expect(blocked.codes).toEqual(['TEAM_JOIN_BLOCKED']);
    expect(blocked.errors?.[0]?.message).not.toMatch(/2026|until/);
    const d = await ok(join(' wb3n-7kqx '), 'noteam');
    expect(d.joinTeamByCode).toMatchObject({ id: '3', isLeader: false });
    expect((d.joinTeamByCode as Json).joinedAt).toBeTruthy();
  });
});

describe('teams 목 리졸버 — 초대 (TM-04 · TM-06 ②③)', () => {
  const invite = (login: string) => `mutation { inviteToTeam(teamId: "1", githubLogin: "${login}") { id invitee { githubLogin } } }`;
  const received = '{ receivedTeamInvitations { items { id teamId teamName inviter { nickname } } nextCursor } }';

  it('inviteToTeam: 가입 안 한 아이디 · 대기 회원 → INVITEE_NOT_FOUND, 팀원 → INVITEE_ALREADY_MEMBER, 팀장 아님 → FORBIDDEN', async () => {
    expect(await codesOf(invite('no-such-user'))).toEqual(['INVITEE_NOT_FOUND']);
    expect(await codesOf(invite('daeun-jung'))).toEqual(['INVITEE_NOT_FOUND']);
    expect(await codesOf(invite('@chulsoo-kim'))).toEqual(['INVITEE_ALREADY_MEMBER']);
    expect(await codesOf(invite('jihoon-park'), 'plain')).toEqual(['FORBIDDEN']);
    expect(await codesOf(invite('-bad-'))).toEqual(['VALIDATION_FAILED']);
  });

  it('inviteToTeam → 상대 TM-04에 카드 · 중복 초대 INVITATION_DUPLICATE · cancelTeamInvitation → 카드 없음 (ACC-TM06-04 · 05)', async () => {
    const d = await ok(invite('@JIHOON-PARK'));
    const inv = d.inviteToTeam as { id: string; invitee: Json };
    expect(inv.invitee).toEqual({ githubLogin: 'jihoon-park' });
    expect(await codesOf(invite('jihoon-park'))).toEqual(['INVITATION_DUPLICATE']);
    // 보낸 초대는 최신순 — 방금 보낸 초대가 맨 위
    const sent = await ok('{ sentTeamInvitations(teamId: "1") { items { id } nextCursor } }');
    expect((sent.sentTeamInvitations as { items: Json[] }).items[0]).toEqual({ id: inv.id });
    expect(await ok(received, 'penalty')).toEqual({
      receivedTeamInvitations: {
        items: [{ id: inv.id, teamId: '1', teamName: '사이드 프로젝트 A팀', inviter: { nickname: '한동관' } }],
        nextCursor: null,
      },
    });
    expect(await ok(`mutation { cancelTeamInvitation(invitationId: "${inv.id}") }`)).toEqual({ cancelTeamInvitation: true });
    expect(await ok('{ receivedTeamInvitations { items { id } } }', 'penalty')).toEqual({ receivedTeamInvitations: { items: [] } });
    expect(await codesOf(`mutation { cancelTeamInvitation(invitationId: "${inv.id}") }`)).toEqual(['NOT_FOUND']);
  });

  it('추방된 회원도 아이디 초대는 받고 수락할 수 있다 (E-13 · ACC-TM04-06)', async () => {
    // 이영희(3)는 B팀 초대코드 차단 중. B팀 팀장(16)이 아이디로 초대
    const d = await ok('mutation { inviteToTeam(teamId: "3", githubLogin: "younghee-dev") { id } }', { id: '16' });
    const id = (d.inviteToTeam as Json).id as string;
    const r = await ok(`mutation { acceptTeamInvitation(invitationId: "${id}") { id isLeader } }`, { id: '3' });
    expect(r.acceptTeamInvitation).toEqual({ id: '3', isLeader: false });
  });

  it('acceptTeamInvitation → 소속 · 배지 수 감소, declineTeamInvitation → 카드 삭제', async () => {
    const accept = await ok('mutation { acceptTeamInvitation(invitationId: "2") { id isLeader } }');
    expect(accept.acceptTeamInvitation).toEqual({ id: '3', isLeader: false });
    expect(await ok('{ receivedTeamInvitations { items { id } } }')).toEqual({ receivedTeamInvitations: { items: [{ id: '3' }] } });
    expect(await ok('mutation { declineTeamInvitation(invitationId: "3") }')).toEqual({ declineTeamInvitation: true });
    expect(await ok('{ receivedTeamInvitations { items { id } } }')).toEqual({
      receivedTeamInvitations: { items: [] },
    });
    // 남의 초대 · 이미 처리한 초대
    expect(await codesOf('mutation { acceptTeamInvitation(invitationId: "1") { id } }')).toEqual(['NOT_FOUND']);
    expect(await codesOf('mutation { acceptTeamInvitation(invitationId: "2") { id } }')).toEqual(['NOT_FOUND']);
  });

  it('acceptTeamInvitation: 팀 삭제 → TEAM_GONE(E-18), 이미 참가 → INVITATION_ALREADY_JOINED + 초대 정리(E-17)', async () => {
    await ok('mutation { deleteTeam(teamId: "6") }', { id: '26' });
    expect(await codesOf('mutation { acceptTeamInvitation(invitationId: "3") { id } }')).toEqual(['TEAM_GONE']);
    await ok('mutation { joinTeamByCode(code: "JD7K-Q2MA") { id } }', 'noteam');
    expect(await codesOf('mutation { acceptTeamInvitation(invitationId: "1") { id } }', 'noteam')).toEqual(['INVITATION_ALREADY_JOINED']);
    expect(await ok('{ receivedTeamInvitations { items { id } } }', 'noteam')).toEqual({ receivedTeamInvitations: { items: [] } });
  });
});

describe('teams 목 리졸버 — 조회 권한 (TM-05 · TM-06, 시스템 관리자 예외)', () => {
  it('없는 팀 NOT_FOUND · 비소속 FORBIDDEN · 시스템 관리자는 비소속 팀도 본다(isLeader false · joinedAt null)', async () => {
    expect(await codesOf('{ team(id: "999") { id } }')).toEqual(['NOT_FOUND']);
    expect(await codesOf('{ team(id: "3") { id } }', 'plain')).toEqual(['FORBIDDEN']);
    expect(await codesOf('{ teamBoard(teamId: "3") { weekStart } }', 'plain')).toEqual(['FORBIDDEN']);
    expect(await ok('{ team(id: "3") { id isLeader joinedAt } }')).toEqual({ team: { id: '3', isLeader: false, joinedAt: null } });
  });

  it('teamMembers: 팀장이 맨 앞 · 팀 글 관리는 그 팀 팀장만(관리자 예외 없음)', async () => {
    const d = await ok('{ teamMembers(teamId: "1") { items { id isLeader } nextCursor } }', 'plain');
    const items = (d.teamMembers as { items: Json[] }).items;
    expect(items[0]).toEqual({ id: '1', isLeader: true });
    expect(items.slice(1).every((x) => x.isLeader === false)).toBe(true);
    expect(await codesOf('{ teamPosts(teamId: "1") { items { id } } }', 'plain')).toEqual(['FORBIDDEN']);
    expect(await codesOf('{ teamPosts(teamId: "3") { items { id } } }')).toEqual(['FORBIDDEN']);
    const posts = await ok('{ teamPosts(teamId: "1") { items { id } } teamComments(teamId: "1") { items { id postId } } }');
    expect((posts.teamPosts as { items: Json[] }).items.length).toBeGreaterThan(0);
  });
});

describe('teams 목 리졸버 — 나가기 · 추방 · 위임 · 공개 · 삭제 (TM-05 ④ · TM-06)', () => {
  it('leaveTeam: 팀원은 나가고 경고는 남는다 · 팀장은 E-19 · 혼자 남은 팀장은 E-20', async () => {
    const warningsBefore = db.warnings.filter((w) => w.memberId === '3' && !w.deleted).length;
    expect(await ok('mutation { leaveTeam(teamId: "1") }', { id: '3' })).toEqual({ leaveTeam: true });
    expect(db.warnings.filter((w) => w.memberId === '3' && !w.deleted).length).toBe(warningsBefore);
    expect(await codesOf('{ team(id: "1") { id } }', { id: '3' })).toEqual(['FORBIDDEN']);
    expect(await codesOf('mutation { leaveTeam(teamId: "1") }')).toEqual(['LEADER_MUST_TRANSFER']);
    const created = await ok('mutation { createTeam(input: { name: "혼자", isPublic: true }) { team { id } } }', 'noteam');
    const id = ((created.createTeam as Json).team as Json).id as string;
    expect(await codesOf(`mutation { leaveTeam(teamId: "${id}") }`, 'noteam')).toEqual(['LEADER_LAST_MEMBER']);
  });

  it('kickTeamMember: 그 팀 카테고리만 빠지고 비면 KICKED 소프트 삭제 · 초대코드 1년 차단 (E-22)', async () => {
    expect(await ok('mutation { kickTeamMember(teamId: "1", memberId: "3") }')).toEqual({ kickTeamMember: true });
    const team = await ok('{ team(id: "1") { memberCount } teamMembers(teamId: "1") { items { id } } }');
    expect(team.team).toEqual({ memberCount: 3 });
    expect((team.teamMembers as { items: Json[] }).items.map((m) => m.id)).toEqual(['1', '2', '4']);
    const aWarnings = db.warnings.filter((w) => w.memberId === '3' && w.originalTeamIds.includes('1'));
    expect(aWarnings.length).toBeGreaterThan(0);
    for (const w of aWarnings) expect(w.deleted?.reason).toBe('KICKED');
    expect(await codesOf('mutation { joinTeamByCode(code: "JD7K-Q2MA") { id } }', { id: '3' })).toEqual(['TEAM_JOIN_BLOCKED']);
    // 한동관의 9/14 경고는 A팀 + 알고리즘 — 다른 팀원 추방과 무관
    expect(db.warnings.find((w) => w.memberId === '1' && w.teamIds.includes('1'))).toBeTruthy();
    expect(await codesOf('mutation { kickTeamMember(teamId: "1", memberId: "1") }')).toEqual(['VALIDATION_FAILED']);
    expect(await codesOf('mutation { kickTeamMember(teamId: "1", memberId: "99") }')).toEqual(['TEAM_MEMBER_NOT_FOUND']);
    expect(await codesOf('mutation { kickTeamMember(teamId: "1", memberId: "4") }', 'plain')).toEqual(['FORBIDDEN']);
  });

  it('transferTeamLeadership: 결과의 isLeader는 false · 새 팀장만 초대코드를 본다', async () => {
    const d = await ok('mutation { transferTeamLeadership(teamId: "1", newLeaderId: "2") { isLeader leader { id } } }');
    expect(d.transferTeamLeadership).toEqual({ isLeader: false, leader: { id: '2' } });
    expect(await ok('{ team(id: "1") { isLeader } teamInviteCode(teamId: "1") }', 'plain')).toEqual({
      team: { isLeader: true },
      teamInviteCode: 'JD7K-Q2MA',
    });
    expect(await ok('mutation { leaveTeam(teamId: "1") }')).toEqual({ leaveTeam: true });
  });

  it('updateTeam: 공개 설정 바로 반영 · 팀장만', async () => {
    expect(await ok('mutation { updateTeam(teamId: "1", input: { isPublic: false }) { id isPublic } }')).toEqual({
      updateTeam: { id: '1', isPublic: false },
    });
    expect(await ok('{ member(id: "2") { publicTeams { id } } }', 'plain')).toEqual({ member: { publicTeams: [] } });
    expect(await codesOf('mutation { updateTeam(teamId: "1", input: { isPublic: true }) { id } }', 'plain')).toEqual(['FORBIDDEN']);
  });

  it('deleteTeam: 팀은 없음(E-53) · 글은 남고 팀 이름표만 사라진다(E-21) · 경고 카테고리 제거', async () => {
    expect(await ok('mutation { deleteTeam(teamId: "1") }')).toEqual({ deleteTeam: true });
    expect(await codesOf('{ team(id: "1") { id } }', 'plain')).toEqual(['NOT_FOUND']);
    expect(await ok('{ myTeams { id } }', 'plain')).toEqual({ myTeams: [] });
    const posts = db.posts.filter((p) => p.teamId === '1' && !p.deletedAt);
    expect(posts.length).toBeGreaterThan(0);
    const post = posts[0];
    expect(await ok(`{ post(id: "${post?.id}") { id teamName } }`, 'plain')).toEqual({
      post: { id: post?.id, teamName: null },
    });
    expect(db.warnings.some((w) => !w.deleted && w.teamIds.includes('1'))).toBe(false);
    expect(db.warnings.filter((w) => w.memberId === '3' && w.deleted?.reason === 'TEAM_DELETED').length).toBeGreaterThan(0);
  });
});

describe('teams 목 리졸버 — 개인 면제 요청 (TM-08)', () => {
  const request = (memberId: string, weekStart: string, reason = '학회 일정') =>
    `mutation { requestPersonalExemption(teamId: "1", memberId: "${memberId}", weekStart: "${weekStart}", reason: "${reason}") {
      id status weekStart member { id } requester { id } overlapsExemptionPeriod } }`;

  it('대기 요청이 생기고 내 요청 목록 맨 위에 보인다 (ACC-TM08-03)', async () => {
    const d = await ok(request('4', '2026-09-28'));
    expect(d.requestPersonalExemption).toMatchObject({
      status: 'PENDING',
      weekStart: '2026-09-28',
      member: { id: '4' },
      requester: { id: '1' },
      overlapsExemptionPeriod: false,
    });
    const list = await ok('{ myPersonalExemptionRequests { items { member { id } status } nextCursor } }');
    expect((list.myPersonalExemptionRequests as { items: Json[] }).items[0]).toEqual({ member: { id: '4' }, status: 'PENDING' });
  });

  it('중복(E-47) · 주 범위 · 대상 · 사유 검사 · 그 팀 팀장만', async () => {
    expect(await codesOf(request('2', '2026-10-05'))).toEqual(['EXEMPTION_REQUEST_DUPLICATE']);
    expect(await fieldOf(request('4', '2026-10-12'))).toBe('weekStart');
    expect(await fieldOf(request('5', '2026-09-28'))).toBe('memberId');
    expect(await fieldOf(request('4', '2026-09-28', ' '))).toBe('reason');
    expect(await codesOf(request('4', '2026-09-28'), 'plain')).toEqual(['FORBIDDEN']);
    // 본인(팀장)도 대상이 될 수 있다
    expect(((await ok(request('1', '2026-10-05'))).requestPersonalExemption as Json).member).toEqual({ id: '1' });
  });

  it('전체 면제 기간과 겹치면 요청은 보관하고 overlapsExemptionPeriod = true (E-44)', async () => {
    db.exemptionPeriods.push({ id: '99', weekStart: '2026-10-05', reason: '축제', createdAt: '2026-09-30T10:00:00+09:00', updatedAt: null });
    const d = await ok(request('4', '2026-10-05'));
    expect(d.requestPersonalExemption).toMatchObject({ status: 'PENDING', overlapsExemptionPeriod: true });
  });
});
