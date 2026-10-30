import { screen, waitFor, within } from '@testing-library/react';
import { beforeEach } from 'vitest';
import { installNotices, type BackendNotice } from '@/test/fixtures/admin';
import { renderRoute as renderRouteRaw, type RenderRouteOptions } from '@/test/render';

// NT-01 공지 목록 · NT-02 공지 상세 (ACC-NT01-* · ACC-NT02-*) — bridge + 가짜 백엔드 (notice.graphqls)

let notices: BackendNotice[];
beforeEach(() => {
  notices = installNotices();
  const rule = notices.find((n) => n.id === '2');
  if (rule) rule.content = '매주 월요일 오전에 지난 한 주(월~일)를 개인 단위로 판정해요.\n\n통과 조건\n인증일 3일 이상, 기록글 1개 이상';
});
const renderRoute = (path: string, o: RenderRouteOptions = {}) => renderRouteRaw(path, { ...o, bridge: true });

const notice = (id: string, title: string, at: string, isPinned = false): BackendNotice => ({
  id,
  title,
  content: `${title} 본문`,
  isPinned,
  isSystem: false,
  createdAt: at,
  updatedAt: null,
});

const rows = async () => within(await screen.findByRole('list', { name: '공지 목록' })).getAllByRole('listitem');

describe('NT-01 공지 목록', () => {
  it('시드: 고정 공지가 📌와 함께 맨 위, 나머지는 최신순 · 날짜 M/D · 행 전체가 NT-02 링크', async () => {
    renderRoute('/notices');
    expect(await screen.findByRole('heading', { level: 1, name: '공지사항' })).toBeInTheDocument();
    const items = await rows();
    expect(items.map((li) => li.textContent)).toEqual([
      '고정 공지잔디 인정 규칙 안내9/1',
      '10월 정기 모임은 10/8(목) 저녁 7시예요9/29',
      '2학기 스터디 팀 모집9/22',
      '추석 연휴에도 판정은 그대로 진행돼요9/18',
      'GitHub 비공개 기여 설정 확인해 주세요9/10',
      '잔디로그 정식 오픈8/20',
    ]);
    expect(within(items[0] as HTMLElement).getByRole('link')).toHaveAttribute('href', '/notices/2');
    expect(screen.queryByRole('button', { name: '더 보기' })).not.toBeInTheDocument();
  });

  it('ACC-NT01-01 25건(고정 1) → 처음 20건, [더 보기]로 이어 붙이고 끝이면 "여기까지예요."', async () => {
    for (let i = 7; i <= 25; i += 1) {
      notices.push(notice(String(i), `추가 공지 ${i}`, `2026-08-${String(i - 5).padStart(2, '0')}T09:00:00+09:00`));
    }
    const { user } = renderRoute('/notices');
    expect(await rows()).toHaveLength(20);
    expect((await rows())[0]).toHaveTextContent('잔디 인정 규칙 안내');
    await user.click(screen.getByRole('button', { name: '더 보기' }));
    await waitFor(async () => expect(await rows()).toHaveLength(25));
    expect(screen.getByText('여기까지예요.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '더 보기' })).not.toBeInTheDocument();
  });

  it('ACC-NT01-02 고정 공지 2건 → 둘 다 일반 공지보다 위, 둘 사이는 최신순', async () => {
    const regular = notices.find((n) => n.id === '5');
    if (regular) regular.isPinned = true;
    renderRoute('/notices');
    const items = await rows();
    expect(items.slice(0, 3).map((li) => li.textContent)).toEqual([
      '고정 공지2학기 스터디 팀 모집9/22',
      '고정 공지잔디 인정 규칙 안내9/1',
      '10월 정기 모임은 10/8(목) 저녁 7시예요9/29',
    ]);
  });

  it('ACC-NT01-03 공지 0건 → "등록된 공지가 없어요."', async () => {
    notices.length = 0;
    renderRoute('/notices');
    expect(await screen.findByText('등록된 공지가 없어요.')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: '공지 목록' })).not.toBeInTheDocument();
  });
});

describe('NT-02 공지 상세', () => {
  it('ACC-NT02-01 고정 공지: 📌 고정 배지 · 제목 · KST 작성일 · 줄바꿈 유지 · 작성자 · 댓글 없음', async () => {
    renderRoute('/notices/2');
    expect(await screen.findByRole('heading', { level: 1, name: '잔디 인정 규칙 안내' })).toBeInTheDocument();
    expect(screen.getByText('고정')).toBeInTheDocument();
    expect(screen.getByText('9/1 09:00')).toBeInTheDocument();
    const body = screen.getByText((_, el) => el?.tagName === 'DIV' && (el.textContent ?? '').startsWith('매주 월요일 오전에'));
    expect(body.textContent).toContain('\n\n통과 조건\n');
    expect(screen.queryByText(/댓글/)).not.toBeInTheDocument();
    expect(screen.queryByText('한동관', { selector: 'main *' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: '공지 목록으로' })).toHaveAttribute('href', '/notices');
  });

  it('일반 공지에는 고정 배지가 없다 · HTML 문자열은 글자 그대로', async () => {
    const n = notices.find((x) => x.id === '6');
    if (n) n.content = '<b>굵게</b>\n둘째 줄';
    renderRoute('/notices/6');
    expect(await screen.findByRole('heading', { level: 1, name: '10월 정기 모임은 10/8(목) 저녁 7시예요' })).toBeInTheDocument();
    expect(screen.queryByText('고정')).not.toBeInTheDocument();
    const body = screen.getByText((_, el) => el?.tagName === 'DIV' && el.textContent === '<b>굵게</b>\n둘째 줄');
    expect(body.querySelector('b')).toBeNull();
  });

  it('ACC-NT02-03 없는 noticeId · 형식이 틀린 id → "찾는 내용이 없어요. 삭제됐을 수 있어요." + [뒤로]', async () => {
    const missing = renderRoute('/notices/999999');
    expect(await screen.findByRole('heading', { level: 1, name: '찾는 내용이 없어요. 삭제됐을 수 있어요.' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '뒤로' })).toBeInTheDocument();
    missing.unmount();
    renderRoute('/notices/abc');
    expect(await screen.findByRole('heading', { level: 1, name: '찾는 내용이 없어요. 삭제됐을 수 있어요.' })).toBeInTheDocument();
  });
});
