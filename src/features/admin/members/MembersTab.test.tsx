import { screen, waitFor, within } from '@testing-library/react';
import { beforeEach } from 'vitest';
import { adminBaseline, installAdminMembers, type AdminMember } from '@/test/fixtures/admin';
import { renderRoute as renderRouteRaw, type RenderRouteOptions } from '@/test/render';

// 회원 탭 — bridge + 가짜 백엔드 (member-approval.graphqls · 관리자 승격 · 정지)
let members: AdminMember[];
beforeEach(() => {
  adminBaseline();
  members = installAdminMembers();
});
const renderRoute = (path: string, o: RenderRouteOptions = {}) => renderRouteRaw(path, { ...o, bridge: true });
const byName = (nickname: string) => members.find((m) => m.nickname === nickname);
const statusOf = (nickname: string) => byName(nickname)?.status;

/** 표의 행(회원 이름으로 찾기) */
function rowOf(name: string): HTMLElement {
  // 한동관처럼 헤더에도 같은 이름이 있으니 표 안에서만 찾는다
  const cell = within(screen.getByRole('table')).getByText(name, { selector: 'span' });
  const row = cell.closest('tr');
  if (!row) throw new Error(`no row for ${name}`);
  return row;
}

describe('AD-01 ②-2 회원 · 관리자 권한 탭', () => {
  it('ACC-ADM-02 진입: 승인 대기 3명 · 신청 오래된 순 · @아이디는 새 탭 GitHub 링크 · 팀 열 없음', async () => {
    renderRoute('/admin/members?status=pending');
    expect(await screen.findByRole('heading', { level: 2, name: '회원 · 관리자 권한' })).toBeInTheDocument();
    await screen.findByText('정다은', { selector: 'span' });

    const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1);
    expect(rows.map((r) => within(r).getAllByRole('cell')[0]?.textContent)).toEqual([
      expect.stringContaining('윤서준'),
      expect.stringContaining('정다은'),
      expect.stringContaining('강지민'),
    ]);
    expect(within(rowOf('정다은')).getByText('9/30 21:15')).toBeInTheDocument();
    expect(within(rowOf('정다은')).getByText('승인 대기')).toBeInTheDocument();
    const gh = within(rowOf('정다은')).getByRole('link', { name: /@daeun-jung/ });
    expect(gh).toHaveAttribute('href', 'https://github.com/daeun-jung');
    expect(gh).toHaveAttribute('target', '_blank');
    expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['회원', '가입', '권한', '처리']);
    expect(screen.getByText('3명')).toBeInTheDocument();
    expect(await screen.findByText('정리할 승인 대기 3명')).toBeInTheDocument();
  });

  it('ACC-ADM-02 [승인]: 행이 바로 사라지고 탭 배지가 3 → 2 · "승인했어요."', async () => {
    const { user } = renderRoute('/admin/members?status=pending');
    expect(await screen.findByRole('link', { name: '회원 · 관리자 권한 3건' })).toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: '정다은 승인' }));

    await waitFor(() => expect(screen.queryByText('정다은', { selector: 'span' })).not.toBeInTheDocument());
    expect(await screen.findByText('승인했어요.')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: '회원 · 관리자 권한 2건' })).toBeInTheDocument();
    expect(await screen.findByText('정리할 승인 대기 2명')).toBeInTheDocument();
    expect(statusOf('정다은')).toBe('ACTIVE');
  });

  it('ACC-ADM-02 [거절] → 확인 다이얼로그 · 취소하면 그대로 · 확인하면 거절 상태', async () => {
    const { user } = renderRoute('/admin/members?status=pending');
    await user.click(await screen.findByRole('button', { name: '윤서준 거절' }));
    const dialog = await screen.findByRole('dialog', { name: '윤서준 님의 가입을 거절할까요?' });
    await user.click(within(dialog).getByRole('button', { name: '취소' }));
    expect(statusOf('윤서준')).toBe('PENDING');
    expect(screen.getByText('윤서준', { selector: 'span' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '윤서준 거절' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: '거절' }));
    await waitFor(() => expect(screen.queryByText('윤서준', { selector: 'span' })).not.toBeInTheDocument());
    expect(await screen.findByText('거절했어요.')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: '회원 · 관리자 권한 2건' })).toBeInTheDocument();
    expect(statusOf('윤서준')).toBe('REJECTED');
  });

  it('ACC-ADM-02 필터 "거절"에서 [승인 대기로]: 즉시 승인 대기로 돌아가고 배지 +1 · URL에 필터가 남는다', async () => {
    const { user, router } = renderRoute('/admin/members?status=pending');
    await screen.findByText('정다은', { selector: 'span' });
    await user.selectOptions(screen.getByRole('combobox', { name: '상태' }), 'rejected');
    await waitFor(() => expect(router.state.location.search).toBe('?status=rejected'));

    expect(await screen.findByText('최민재', { selector: 'span' })).toBeInTheDocument();
    expect(screen.queryByText('정다은', { selector: 'span' })).not.toBeInTheDocument();
    expect(within(rowOf('최민재')).getByText('거절됨')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '최민재 승인 대기로' }));
    await waitFor(() => expect(screen.queryByText('최민재', { selector: 'span' })).not.toBeInTheDocument());
    expect(await screen.findByText('승인 대기로 되돌렸어요.')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: '회원 · 관리자 권한 4건' })).toBeInTheDocument();
    expect(await screen.findByText('거절한 회원이 없어요.')).toBeInTheDocument();
    expect(statusOf('최민재')).toBe('PENDING');
  });

  it('전체 필터: 거절하면 행이 남고 상태 배지만 바뀐다', async () => {
    const { user } = renderRoute('/admin/members?status=all');
    await user.click(await screen.findByRole('button', { name: '강지민 거절' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: '거절' }));
    await waitFor(() => expect(within(rowOf('강지민')).getByText('거절됨')).toBeInTheDocument());
    expect(within(rowOf('강지민')).getByRole('button', { name: '강지민 승인 대기로' })).toBeInTheDocument();
    expect(screen.getByText('4명')).toBeInTheDocument();
  });

  it('검색(?q=): 닉네임 · GitHub 아이디로 거르고, 결과가 없으면 안내 + [검색 지우기]', async () => {
    const { user, router } = renderRoute('/admin/members?status=pending&q=jimin');
    expect(await screen.findByText('강지민', { selector: 'span' })).toBeInTheDocument();
    expect(screen.queryByText('정다은', { selector: 'span' })).not.toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: '회원 검색' })).toHaveValue('jimin');

    const box = screen.getByRole('searchbox', { name: '회원 검색' });
    await user.clear(box);
    await user.type(box, '없는사람{Enter}');
    expect(await screen.findByText('검색 결과가 없어요. 다른 말로 찾아보세요.')).toBeInTheDocument();
    expect(router.state.location.search).toBe(`?status=pending&q=${encodeURIComponent('없는사람')}`);

    await user.click(screen.getByRole('button', { name: '검색 지우기' }));
    expect(await screen.findByText('정다은', { selector: 'span' })).toBeInTheDocument();
    expect(router.state.location.search).toBe('?status=pending');
    expect(screen.getByRole('searchbox', { name: '회원 검색' })).toHaveValue('');
  });

  it('EX-AD01-01 빈 목록: "승인 대기 중인 회원이 없어요."', async () => {
    for (const m of members) if (m.status === 'PENDING') m.status = 'ACTIVE';
    renderRoute('/admin/members?status=pending');
    expect(await screen.findByText('승인 대기 중인 회원이 없어요.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('활성 회원 명단: 일반 회원은 [관리자로 승격] · 관리자는 "관리자" 표시 · 확인 뒤 승격 · 취소하면 그대로', async () => {
    const { user } = renderRoute('/admin/members');
    await screen.findByText('김철수', { selector: 'span' });
    expect(within(rowOf('김철수')).getByText('일반 회원')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '김철수 관리자로 승격' }));
    const dialog = await screen.findByRole('dialog', { name: '김철수 님을 관리자로 승격할까요?' });
    await user.click(within(dialog).getByRole('button', { name: '취소' }));
    expect(byName('김철수')?.role).toBe('MEMBER');

    await user.click(screen.getByRole('button', { name: '김철수 관리자로 승격' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: '관리자로 승격' }));
    expect(await screen.findByText('관리자로 승격했어요.')).toBeInTheDocument();
    await waitFor(() => expect(within(rowOf('김철수')).getByText('관리자')).toBeInTheDocument());
    expect(byName('김철수')?.role).toBe('ADMIN');
    // 이미 관리자인 행에는 승격 버튼이 없다
    expect(within(rowOf('김철수')).queryByRole('button')).not.toBeInTheDocument();
  });

  it('정지: 확인 뒤 정지 → 전체 회원에서 빠지고 "정지" 필터에 나온다 · 취소하면 그대로 · [정지 해제]로 되돌린다', async () => {
    const { user, router } = renderRoute('/admin/members');
    await screen.findByText('김철수', { selector: 'span' });
    expect(within(rowOf('김철수')).getByRole('button', { name: '김철수 이용 정지' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '김철수 이용 정지' }));
    const dialog = await screen.findByRole('dialog', { name: '김철수 님의 이용을 정지할까요?' });
    await user.click(within(dialog).getByRole('button', { name: '취소' }));
    expect(statusOf('김철수')).toBe('ACTIVE');

    await user.click(screen.getByRole('button', { name: '김철수 이용 정지' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: '이용 정지' }));
    expect(await screen.findByText('이용을 정지했어요.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('김철수', { selector: 'span' })).not.toBeInTheDocument());
    expect(statusOf('김철수')).toBe('SUSPENDED');

    await user.selectOptions(screen.getByRole('combobox', { name: '상태' }), 'suspended');
    await waitFor(() => expect(router.state.location.search).toBe('?status=suspended'));
    expect(within(rowOf('김철수')).getByText('정지됨')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '김철수 정지 해제' }));
    expect(await screen.findByText('정지를 풀었어요.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('김철수', { selector: 'span' })).not.toBeInTheDocument());
    expect(statusOf('김철수')).toBe('ACTIVE');
    expect(await screen.findByText('정지한 회원이 없어요.')).toBeInTheDocument();
  });

  it('관리자 행에는 정지 · 승격 버튼이 없다', async () => {
    renderRoute('/admin/members?q=handong');
    await screen.findByRole('table');
    const row = rowOf('한동관');
    expect(within(row).queryByRole('button')).not.toBeInTheDocument();
  });

  it('ACC-FIX-01 · E-09: 관리자가 아니면 권한 없음', async () => {
    renderRoute('/admin/members', { as: 'plain' });
    expect(await screen.findByText('이 페이지에 들어올 권한이 없어요.')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '회원 · 관리자 권한' })).not.toBeInTheDocument();
  });
});
