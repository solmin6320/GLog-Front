import { screen, waitFor, within } from '@testing-library/react';
import { installHome } from '@/test/fixtures/home';
import { renderRoute } from '@/test/render';

// PR-02 프로필 수정 (화면설계서 5-1-20) — bridge + 가짜 백엔드.
// 서버에 사진 업로드 · 기본 이미지로 되돌리기 API가 아직 없다(B2, S3 보류). 그래서 실서버 연결 중에는 사진 버튼 대신 "준비 중" 안내만 보인다.
// 업로드 · 되돌리기 흐름 테스트(ACC-PR02-02 ~ 06)는 B2가 생겨 ProfileResetImage · 업로드가 연결될 때 다시 쓴다.

beforeEach(() => installHome());

function photoCard() {
  return screen.getByRole('region', { name: '프로필 사진' });
}

async function open() {
  const r = renderRoute('/profile/edit', { bridge: true });
  await screen.findByRole('heading', { level: 1, name: '프로필 수정' });
  return r;
}

describe('PR-02 프로필 수정 (실서버 연결)', () => {
  it('ACC-PR02-01: 원형 미리보기 · 이름 · 아이디 — 닉네임 · 아이디 입력칸은 없다, [저장]은 바꾼 것이 없어 비활성', async () => {
    await open();
    expect(within(photoCard()).getByText('한동관')).toBeInTheDocument();
    expect(within(photoCard()).getByText('@handong-gwan')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '저장' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '취소' })).toBeEnabled();
  });

  it('F11: 사진 바꾸기 · 기본 이미지로 되돌리기 버튼 대신 "준비 중" 안내', async () => {
    await open();
    expect(screen.queryByRole('button', { name: '사진 바꾸기' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '기본 이미지로 되돌리기' })).not.toBeInTheDocument();
    expect(screen.getByText('프로필 사진 바꾸기는 준비 중이에요. 지금은 GitHub 프로필 사진이 쓰여요.')).toBeInTheDocument();
  });

  it('ACC-PR02-07: 바꾼 것이 없으면 [취소] → 바로 /profile/me', async () => {
    const { user, router } = await open();
    await user.click(screen.getByRole('button', { name: '취소' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/profile/me'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
