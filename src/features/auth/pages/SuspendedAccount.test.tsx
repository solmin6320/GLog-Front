import { screen } from '@testing-library/react';
import { backend, backendError } from '@/test/backend';
import { renderRoute } from '@/test/render';

// 정지된 계정 — bridge + 가짜 백엔드. 서버는 정지 회원에게 me만 열고(status SUSPENDED) 회원 전용 질의는 ACCOUNT_SUSPENDED로 막는다
describe('정지된 계정', () => {
  beforeEach(() => {
    const suspended = () => {
      throw backendError('ACCOUNT_SUSPENDED');
    };
    backend.on('myTeams', suspended).on('receivedTeamInvitations', suspended);
  });

  it('정지된 회원이 들어오면 홈 대신 "이용이 정지된 계정이에요"가 보이고 로그아웃만 할 수 있다', async () => {
    const { router } = renderRoute('/', { as: 'suspended', bridge: true });

    expect(await screen.findByRole('heading', { name: '이용이 정지된 계정이에요' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/pending');
    expect(screen.getByText('동아리 운영진에게 문의해 주세요.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '로그아웃' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '승인됐는지 확인' })).not.toBeInTheDocument();
  });

  it('정지된 회원에게는 회원 전용 질의(팀 · 초대)를 보내지 않는다 — 세션은 me만 본다', async () => {
    renderRoute('/', { as: 'suspended', bridge: true });
    await screen.findByRole('heading', { name: '이용이 정지된 계정이에요' });
    expect(backend.calls('me').length).toBeGreaterThan(0);
    expect(backend.calls('myTeams')).toHaveLength(0);
  });
});
