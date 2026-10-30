import { screen, waitFor, within } from '@testing-library/react';
import { seedPostId } from '@/mocks/db/seed';
import { db } from '@/mocks/db/store';
import { renderRoute } from '@/test/render';

const REDIS_TTL = 'Redis TTL이 적용되지 않던 문제';

function bodyRows(): HTMLElement[] {
  return within(screen.getByRole('table')).getAllByRole('row').slice(1);
}

describe('AD-01 ②-5 게시물 관리 탭', () => {
  it('ACC-ADM-12 진입: 최신순 `[종류] 제목 · 작성자 · 날짜` · 팀 열이 없다', async () => {
    renderRoute('/admin/posts');
    expect(await screen.findByRole('heading', { level: 2, name: '게시물 관리' })).toBeInTheDocument();
    await screen.findByRole('table');
    expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['종류', '제목', '작성자', '날짜', '처리']);

    const first = bodyRows()[0];
    if (!first) throw new Error('no rows');
    expect(within(first).getByText('댓글')).toBeInTheDocument();
    expect(within(first).getByRole('link', { name: '이 부분 저희 팀 코드에도 적용해 볼게요.' })).toBeInTheDocument();
    expect(within(first).getByText('정하늘')).toBeInTheDocument();
    expect(within(first).getByText('10/1 09:30')).toBeInTheDocument();
    // 전체 건수는 백엔드 adminPosts에 없어 보이지 않는다
    expect(screen.queryByText('113건')).not.toBeInTheDocument();
  });

  it('ACC-ADM-12 검색 "Redis" · 종류 "댓글만" · "글만": 바꿀 때마다 다시 조회하고 URL에 남는다', async () => {
    const { user, router } = renderRoute('/admin/posts');
    await screen.findByRole('table');

    await user.type(screen.getByRole('searchbox', { name: '게시물 검색' }), 'Redis{Enter}');
    await waitFor(() => expect(router.state.location.search).toBe('?q=Redis'));
    expect(await screen.findByRole('link', { name: REDIS_TTL })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '이 부분 저희 팀 코드에도 적용해 볼게요.' })).not.toBeInTheDocument();

    await user.selectOptions(screen.getByRole('combobox', { name: '종류' }), 'comment');
    await waitFor(() => expect(router.state.location.search).toBe('?kind=comment&q=Redis'));
    expect(await screen.findByText('검색 결과가 없어요. 다른 말로 찾아보세요.')).toBeInTheDocument();

    await user.selectOptions(screen.getByRole('combobox', { name: '종류' }), 'post');
    await waitFor(() => expect(router.state.location.search).toBe('?kind=post&q=Redis'));
    expect(await screen.findByRole('link', { name: REDIS_TTL })).toBeInTheDocument();
    for (const row of bodyRows()) expect(within(row).getByText('글')).toBeInTheDocument();
  });

  it('ACC-ADM-13 제목 클릭 → BD-03', async () => {
    const { user, router } = renderRoute('/admin/posts?kind=post&q=Redis');
    await user.click(await screen.findByRole('link', { name: REDIS_TTL }));
    await waitFor(() => expect(router.state.location.pathname).toBe(`/posts/${seedPostId('redisTtl')}`));
  });

  it('ACC-ADM-13 글 [삭제] → 단순 확인형 → 행이 사라지고 "삭제했어요."', async () => {
    const { user } = renderRoute('/admin/posts?kind=post&q=Redis');
    await user.click(await screen.findByRole('button', { name: `글 삭제: ${REDIS_TTL}` }));
    const dialog = await screen.findByRole('dialog', { name: '이 글을 삭제할까요?' });
    expect(within(dialog).getByText('삭제하면 되돌릴 수 없어요. 이미 확정된 판정은 바뀌지 않아요.')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: '삭제' }));

    expect(await screen.findByText('삭제했어요.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('link', { name: REDIS_TTL })).not.toBeInTheDocument());
    expect(db.posts.find((p) => p.id === seedPostId('redisTtl'))?.deletedAt).not.toBeNull();
  });

  it('ACC-ADM-13 댓글 [삭제]: 취소하면 그대로, 확인하면 사라진다', async () => {
    const { user } = renderRoute('/admin/posts?kind=comment');
    await screen.findByRole('table');
    const deletedBefore = db.comments.filter((c) => c.deletedAt).length;
    const firstDelete = () => within(bodyRows()[0] as HTMLElement).getByRole('button', { name: /^댓글 삭제: / });
    const firstName = firstDelete().getAttribute('aria-label');

    await user.click(firstDelete());
    await user.click(within(await screen.findByRole('dialog', { name: '이 댓글을 삭제할까요?' })).getByRole('button', { name: '취소' }));
    expect(firstDelete()).toHaveAttribute('aria-label', firstName);
    expect(db.comments.filter((c) => c.deletedAt)).toHaveLength(deletedBefore);

    await user.click(firstDelete());
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: '삭제' }));
    expect(await screen.findByText('삭제했어요.')).toBeInTheDocument();
    await waitFor(() => expect(firstDelete()).not.toHaveAttribute('aria-label', firstName));
    expect(db.comments.filter((c) => c.deletedAt)).toHaveLength(deletedBefore + 1);
  });

  it('ACC-ADM-14 게시물 0건: "관리할 게시물이 없어요."', async () => {
    for (const p of db.posts) p.deletedAt = p.deletedAt ?? '2026-09-01T00:00:00+09:00';
    renderRoute('/admin/posts');
    expect(await screen.findByText('관리할 게시물이 없어요.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
