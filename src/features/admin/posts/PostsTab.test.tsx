import { screen, waitFor, within } from '@testing-library/react';
import { backend } from '@/test/backend';
import { adminBaseline, commentItem, installAdminPosts, PEOPLE, postItem, type AdminPostItem } from '@/test/fixtures/admin';
import { renderRoute } from '@/test/render';

const REDIS_TTL = 'Redis TTL이 적용되지 않던 문제';
const COMMENT = '이 부분 저희 팀 코드에도 적용해 볼게요.';

function bodyRows(): HTMLElement[] {
  return within(screen.getByRole('table')).getAllByRole('row').slice(1);
}

const SEED: AdminPostItem[] = [
  commentItem('31', '12', 'JPA N+1 문제 해결기', COMMENT, PEOPLE.haneul, '2026-10-01T09:30:00+09:00'),
  postItem('12', 'JPA N+1 문제 해결기', PEOPLE.plain, '2026-09-30T20:00:00+09:00'),
  commentItem('30', '12', 'JPA N+1 문제 해결기', 'fetch join으로 풀었어요.', PEOPLE.minsu, '2026-09-30T21:00:00+09:00'),
  postItem('7', REDIS_TTL, PEOPLE.member, '2026-09-29T14:00:00+09:00'),
  postItem('5', '배포 일지 9월 4주차', PEOPLE.younghee, '2026-09-28T18:00:00+09:00'),
];

describe('AD-01 ②-5 게시물 관리 탭', () => {
  beforeEach(() => {
    adminBaseline();
    installAdminPosts(SEED);
  });

  it('ACC-ADM-12 진입: 최신순 `[종류] 제목 · 작성자 · 날짜` · 팀 열이 없다', async () => {
    renderRoute('/admin/posts', { bridge: true });
    expect(await screen.findByRole('heading', { level: 2, name: '게시물 관리' })).toBeInTheDocument();
    await screen.findByRole('table');
    expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['종류', '제목', '작성자', '날짜', '처리']);

    const first = bodyRows()[0];
    if (!first) throw new Error('no rows');
    expect(within(first).getByText('댓글')).toBeInTheDocument();
    // 댓글 행 제목은 댓글 내용(bridge: kind=COMMENT면 content), 링크는 그 글
    expect(within(first).getByRole('link', { name: COMMENT })).toHaveAttribute('href', '/posts/12');
    expect(within(first).getByText('정하늘')).toBeInTheDocument();
    expect(within(first).getByText('10/1 09:30')).toBeInTheDocument();
    // bridge: 서버에 전체 건수가 없어 받은 행 수가 건수다
    expect(screen.getByText('5건')).toBeInTheDocument();
    expect(backend.calls('adminPosts')[0]?.args).toEqual({ filter: 'ALL', keyword: null, after: null });
  });

  it('ACC-ADM-12 검색 "Redis" · 종류 "댓글만" · "글만": 바꿀 때마다 다시 조회하고 URL에 남는다', async () => {
    const { user, router } = renderRoute('/admin/posts', { bridge: true });
    await screen.findByRole('table');

    await user.type(screen.getByRole('searchbox', { name: '게시물 검색' }), 'Redis{Enter}');
    await waitFor(() => expect(router.state.location.search).toBe('?q=Redis'));
    expect(await screen.findByRole('link', { name: REDIS_TTL })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: COMMENT })).not.toBeInTheDocument();

    await user.selectOptions(screen.getByRole('combobox', { name: '종류' }), 'comment');
    await waitFor(() => expect(router.state.location.search).toBe('?kind=comment&q=Redis'));
    expect(await screen.findByText('검색 결과가 없어요. 다른 말로 찾아보세요.')).toBeInTheDocument();

    await user.selectOptions(screen.getByRole('combobox', { name: '종류' }), 'post');
    await waitFor(() => expect(router.state.location.search).toBe('?kind=post&q=Redis'));
    expect(await screen.findByRole('link', { name: REDIS_TTL })).toBeInTheDocument();
    for (const row of bodyRows()) expect(within(row).getByText('글')).toBeInTheDocument();

    const args = backend.calls('adminPosts').map((c) => c.args);
    expect(args).toContainEqual({ filter: 'ALL', keyword: 'Redis', after: null });
    expect(args).toContainEqual({ filter: 'COMMENTS', keyword: 'Redis', after: null });
    expect(args).toContainEqual({ filter: 'POSTS', keyword: 'Redis', after: null });
  });

  it('ACC-ADM-13 제목 클릭 → BD-03', async () => {
    const { user, router } = renderRoute('/admin/posts?kind=post&q=Redis', { bridge: true });
    await user.click(await screen.findByRole('link', { name: REDIS_TTL }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/posts/7'));
  });

  it('ACC-ADM-13 글 [삭제] → 단순 확인형 → 행이 사라지고 "삭제했어요."', async () => {
    const { user } = renderRoute('/admin/posts?kind=post&q=Redis', { bridge: true });
    await user.click(await screen.findByRole('button', { name: `글 삭제: ${REDIS_TTL}` }));
    const dialog = await screen.findByRole('dialog', { name: '이 글을 삭제할까요?' });
    expect(within(dialog).getByText('삭제하면 되돌릴 수 없어요. 이미 확정된 판정은 바뀌지 않아요.')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: '삭제' }));

    expect(await screen.findByText('삭제했어요.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('link', { name: REDIS_TTL })).not.toBeInTheDocument());
    // bridge는 deletePost를 먼저 부르고, FORBIDDEN(남의 글)이면 관리자 삭제로 한 번 더
    expect(backend.calls('deletePost')[0]?.args).toEqual({ id: '7' });
    expect(backend.calls('adminDeletePost').map((c) => c.args)).toEqual([{ postId: '7' }]);
  });

  it('ACC-ADM-13 댓글 [삭제]: 취소하면 그대로, 확인하면 사라진다', async () => {
    const { user } = renderRoute('/admin/posts?kind=comment', { bridge: true });
    await screen.findByRole('table');
    const firstDelete = () => within(bodyRows()[0] as HTMLElement).getByRole('button', { name: /^댓글 삭제: / });
    const firstName = firstDelete().getAttribute('aria-label');
    const panel = screen.getByRole('region', { name: '게시물 관리' });
    expect(within(panel).getByText('2건')).toBeInTheDocument();

    await user.click(firstDelete());
    await user.click(within(await screen.findByRole('dialog', { name: '이 댓글을 삭제할까요?' })).getByRole('button', { name: '취소' }));
    expect(firstDelete()).toHaveAttribute('aria-label', firstName);
    expect(backend.calls('adminDeleteComment')).toHaveLength(0);

    await user.click(firstDelete());
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: '삭제' }));
    expect(await within(panel).findByText('1건')).toBeInTheDocument();
    expect(backend.calls('adminDeleteComment').map((c) => c.args)).toEqual([{ commentId: '31' }]);
  });

  it('ACC-ADM-14 게시물 0건: "관리할 게시물이 없어요."', async () => {
    installAdminPosts([]);
    renderRoute('/admin/posts', { bridge: true });
    expect(await screen.findByText('관리할 게시물이 없어요.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
