import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { db } from '@/mocks/db/store';
import { appError } from '@/shared/api/errors';
import { uploadProfileImage } from '@/shared/api/rest';
import type * as RestApi from '@/shared/api/rest';
import { renderRoute } from '@/test/render';

// PR-02 프로필 수정 (화면설계서 5-1-20). jsdom의 FormData는 MSW로 파일을 보내지 못해서 업로드 함수만 바꿔 끼운다.
vi.mock('@/shared/api/rest', async (importOriginal) => {
  const actual = await importOriginal<typeof RestApi>();
  return { ...actual, uploadProfileImage: vi.fn() };
});
const upload = vi.mocked(uploadProfileImage);

const MB = 1024 * 1024;
const fileOf = (name: string, type: string, size = 2 * MB) => {
  const f = new File([new Uint8Array(4)], name, { type });
  Object.defineProperty(f, 'size', { value: size });
  return f;
};

function photoCard() {
  return screen.getByRole('region', { name: '프로필 사진' });
}
function fileInput(): HTMLInputElement {
  return screen.getByLabelText('사진 바꾸기', { selector: 'input' });
}
const cardImage = () => photoCard().querySelector('img');

beforeEach(() => {
  upload.mockReset();
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, writable: true, value: vi.fn(() => 'blob:preview') });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, writable: true, value: vi.fn() });
});

async function open(path = '/profile/edit') {
  const r = renderRoute(path);
  await screen.findByRole('heading', { level: 1, name: '프로필 수정' });
  return r;
}

describe('PR-02 프로필 수정', () => {
  it('ACC-PR02-01: 원형 미리보기 · [사진 바꾸기] · [저장] · [취소] — 닉네임 · 아이디 입력칸은 없다', async () => {
    await open();
    expect(within(photoCard()).getByText('한동관')).toBeInTheDocument();
    expect(within(photoCard()).getByText('@handong-gwan')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '사진 바꾸기' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '저장' })).toBeDisabled(); // 바꾼 것이 없으면
    expect(screen.getByRole('button', { name: '취소' })).toBeEnabled();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    // 올린 사진이 없으면 ③도 없다 (ACC-PR02-06)
    expect(screen.queryByRole('button', { name: '기본 이미지로 되돌리기' })).not.toBeInTheDocument();
    expect(cardImage()).toBeNull();
  });

  it('ACC-PR02-02: 6MB jpg · gif는 고르는 즉시 막는다 — 미리보기 그대로 · 업로드 0건', async () => {
    const { user } = await open();
    await user.upload(fileInput(), fileOf('big.jpg', 'image/jpeg', 6 * MB));
    expect(await screen.findByText('5MB 이하 이미지만 올릴 수 있어요.')).toBeInTheDocument();
    expect(cardImage()).toBeNull();
    fireEvent.change(fileInput(), { target: { files: [fileOf('anim.gif', 'image/gif', 1 * MB)] } });
    expect(await screen.findByText('jpg, png, webp만 올릴 수 있어요.')).toBeInTheDocument();
    expect(cardImage()).toBeNull();
    expect(screen.getByRole('button', { name: '저장' })).toBeDisabled();
    expect(upload).not.toHaveBeenCalled();
  });

  it('ACC-PR02-03 · 04: 2MB png → 미리보기만 바뀌고, [저장] 때 업로드 1회 → "저장 중..." → /profile/me + "저장했어요."', async () => {
    let finish!: (v: { profileImageUrl: string }) => void;
    upload.mockImplementation(() => new Promise((r) => (finish = r)));
    const { user, router } = await open();
    const png = fileOf('me.png', 'image/png');
    await user.upload(fileInput(), png);
    expect(cardImage()).toHaveAttribute('src', 'blob:preview');
    expect(upload).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: '저장' }));
    const saving = await screen.findByRole('button', { name: '저장 중...' });
    expect(saving).toBeDisabled();
    expect(upload).toHaveBeenCalledTimes(1);
    expect(upload).toHaveBeenCalledWith(png);

    finish({ profileImageUrl: 'https://img.test/me.png' });
    await waitFor(() => expect(router.state.location.pathname).toBe('/profile/me'));
    expect(await screen.findByText('저장했어요.')).toBeInTheDocument();
  });

  it('ACC-PR02-05: 업로드 실패 → E-55 · 화면에 남고 버튼이 되살아난다', async () => {
    upload.mockRejectedValue(appError('INTERNAL'));
    const { user, router } = await open();
    await user.upload(fileInput(), fileOf('me.webp', 'image/webp'));
    await user.click(screen.getByRole('button', { name: '저장' }));
    expect(await screen.findByText('사진을 올리지 못했어요. 다시 시도해 주세요.')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/profile/edit');
    expect(screen.getByRole('button', { name: '저장' })).toBeEnabled();
    expect(cardImage()).toHaveAttribute('src', 'blob:preview');
  });

  it('ACC-PR02-06: 올린 사진이 있으면 [기본 이미지로 되돌리기] → 미리보기만 바뀌고 [저장] 때 반영(헤더 사진도)', async () => {
    const me = db.members.find((m) => m.id === '1');
    if (!me) throw new Error('seed member missing');
    me.profileImageUrl = 'https://img.test/old.png';
    const { user, router } = await open();
    expect(cardImage()).toHaveAttribute('src', 'https://img.test/old.png');

    await user.click(screen.getByRole('button', { name: '기본 이미지로 되돌리기' }));
    expect(cardImage()).toBeNull();
    expect(me.profileImageUrl).toBe('https://img.test/old.png'); // 아직 저장 전

    await user.click(screen.getByRole('button', { name: '저장' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/profile/me'));
    expect(await screen.findByText('저장했어요.')).toBeInTheDocument();
    expect(me.profileImageUrl).toBeNull();
    expect(upload).not.toHaveBeenCalled();
    // 세션을 다시 불러 헤더 사진도 기본 이미지로
    const headerLink = screen.getByRole('link', { name: '한동관 내 프로필' });
    await waitFor(() => expect(headerLink.querySelector('img')).toBeNull());
  });

  it('ACC-PR02-07: 바꾼 것이 없으면 [취소] → 바로 /profile/me', async () => {
    const { user, router } = await open();
    await user.click(screen.getByRole('button', { name: '취소' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/profile/me'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('ACC-PR02-07: 사진을 바꿨으면 확인 다이얼로그 — [계속 고치기]는 남고 [나가기]는 /profile/me', async () => {
    const { user, router } = await open();
    await user.upload(fileInput(), fileOf('me.png', 'image/png'));
    await user.click(screen.getByRole('button', { name: '취소' }));
    const dialog = await screen.findByRole('dialog', { name: '저장하지 않고 나갈까요?' });
    await user.click(within(dialog).getByRole('button', { name: '계속 고치기' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(router.state.location.pathname).toBe('/profile/edit');

    await user.click(screen.getByRole('button', { name: '취소' }));
    const again = await screen.findByRole('dialog', { name: '저장하지 않고 나갈까요?' });
    await user.click(within(again).getByRole('button', { name: '나가기' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/profile/me'));
    expect(upload).not.toHaveBeenCalled();
  });
});
