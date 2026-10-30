import { screen, waitFor, within } from '@testing-library/react';
import { seedPostId } from '@/mocks/db/seed';
import { findMember } from '@/mocks/db/store';
import { renderRoute } from '@/test/render';

// BD-03 글 상세 (ACC-BD03-*)

const postPath = (key: string) => `/posts/${seedPostId(key) ?? 'missing'}`;
const title = (name: string) => screen.findByRole('heading', { level: 1, name });
const commentList = () => screen.getByRole('list', { name: '댓글 목록' });
/** 한동관을 관리자가 아닌 팀장으로 (ⓑ 팀장 단독 조합) */
const demoteMemberToLeaderOnly = () => {
  const m = findMember('1');
  if (m) m.role = 'MEMBER';
};

describe('BD-03 글 상세', () => {
  it('W-12: 종류 배지 · 제목 · 작성자 · 날짜 · 태그 · 공개 팀 · 본문 3칸(serif) · 커밋 카드 · 댓글 3', async () => {
    renderRoute(postPath('redisTtl'));
    expect(await title('Redis TTL이 적용되지 않던 문제')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '트러블슈팅' })).toHaveAttribute('href', '/posts?type=troubleshooting');
    expect(screen.getAllByRole('link', { name: '한동관' })[0]).toHaveAttribute('href', '/profile/me');
    expect(screen.getByText('9/29 14:20')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '#Redis' })).toHaveAttribute('href', '/posts?type=troubleshooting&tag=Redis');
    expect(screen.getByText('사이드 프로젝트 A팀')).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['문제', '원인', '해결', '댓글 3']);
    expect(screen.queryByText('인증 미포함')).not.toBeInTheDocument();
    expect(within(commentList()).getAllByRole('listitem')).toHaveLength(3);
    expect(within(commentList()).getByText('저도 같은 문제 겪었어요. ex 옵션 몰랐는데 덕분에 알았어요.')).toBeInTheDocument();
  });

  it('ACC-BD03-10 관련 커밋: owner/repo · 7자리 sha, 새 탭 + rel="noopener noreferrer"', async () => {
    renderRoute(postPath('redisTtl'));
    await title('Redis TTL이 적용되지 않던 문제');
    const link = screen.getByRole('link', { name: /jandilog\/server · a1b2c3d/ });
    expect(link).toHaveAttribute('href', 'https://github.com/jandilog/server/commit/a1b2c3d4e5f60718293a4b5c6d7e8f9012345678');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  describe('ACC-BD03-01 · 02 ④ 글 버튼은 서버 플래그(viewerCan*)대로', () => {
    const actions = () => ({
      edit: screen.queryByRole('link', { name: '수정' }),
      del: screen.queryByRole('button', { name: '삭제' }),
    });

    it('ⓐ 작성자 → [수정][삭제]', async () => {
      renderRoute(postPath('redisTtl'));
      await title('Redis TTL이 적용되지 않던 문제');
      const a = actions();
      expect(a.edit).toHaveAttribute('href', `${postPath('redisTtl')}/edit`);
      expect(a.del).toBeInTheDocument();
    });

    it('ⓑ 그 글 팀의 팀장(비작성자 · 관리자 아님) → [수정]만', async () => {
      demoteMemberToLeaderOnly();
      renderRoute(postPath('expoDeeplink'));
      await title('Expo 딥링크가 안드로이드에서만 열리지 않을 때');
      expect(actions().edit).toBeInTheDocument();
      expect(actions().del).not.toBeInTheDocument();
    });

    it('ⓒ 관리자(비작성자 · 팀장 아님) → [삭제]만', async () => {
      renderRoute(postPath('flyway'));
      await title('Flyway 체크섬 불일치로 서버가 안 뜨는 문제');
      expect(actions().edit).not.toBeInTheDocument();
      expect(actions().del).toBeInTheDocument();
    });

    it('ⓓ 일반 회원 → 버튼 없음', async () => {
      renderRoute(postPath('redisTtl'), { as: 'plain' });
      await title('Redis TTL이 적용되지 않던 문제');
      expect(actions().edit).not.toBeInTheDocument();
      expect(actions().del).not.toBeInTheDocument();
    });

    it('ⓔ 팀 연결 없는 글 + 다른 팀 팀장 → 버튼 없음', async () => {
      demoteMemberToLeaderOnly();
      renderRoute(postPath('graphqlN1'));
      await title('GraphQL N+1을 @BatchMapping으로 해결하기');
      expect(actions().edit).not.toBeInTheDocument();
      expect(actions().del).not.toBeInTheDocument();
    });

    it('ACC-BD03-02 관리자이면서 그 팀 팀장(비작성자) → [수정][삭제] 둘 다', async () => {
      renderRoute(postPath('expoDeeplink'));
      await title('Expo 딥링크가 안드로이드에서만 열리지 않을 때');
      expect(actions().edit).toBeInTheDocument();
      expect(actions().del).toBeInTheDocument();
    });
  });

  it('ACC-BD03-03 · ACC-BD03-12 빈 필수 항목은 "작성되지 않음" + "인증 미포함" · 댓글 0건이면 "첫 댓글을 남겨보세요."', async () => {
    renderRoute(postPath('graphqlN1'), { as: 'plain' });
    await title('GraphQL N+1을 @BatchMapping으로 해결하기');
    expect(screen.getByText('작성되지 않음')).toBeInTheDocument();
    expect(screen.getByText('인증 미포함').closest('[title]')).toHaveAttribute('title', '필수 항목을 다 채우면 인증에 들어가요.');
    expect(screen.getByRole('heading', { level: 2, name: '댓글 0' })).toBeInTheDocument();
    expect(screen.getByText('첫 댓글을 남겨보세요.')).toBeInTheDocument();
  });

  it('ACC-BD03-05 삭제된 글 → "삭제된 글이에요." + [목록으로], 댓글 영역 없음 (404 아님)', async () => {
    renderRoute(postPath('deletedMemo'));
    expect(await title('삭제된 글이에요.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '목록으로' })).toHaveAttribute('href', '/posts');
    expect(screen.queryByText(/댓글/)).not.toBeInTheDocument();
  });

  it('ACC-BD03-06 없는 id · 형식이 틀린 id → "찾는 내용이 없어요. 삭제됐을 수 있어요." + [뒤로]', async () => {
    renderRoute('/posts/000000000000000000000000');
    expect(await title('찾는 내용이 없어요. 삭제됐을 수 있어요.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '뒤로' })).toBeInTheDocument();
  });

  it('ACC-BD03-06 형식이 틀린 postId는 부르지 않고 404', async () => {
    renderRoute('/posts/not-an-id');
    expect(await title('찾는 내용이 없어요. 삭제됐을 수 있어요.')).toBeInTheDocument();
  });

  it('ACC-BD03-04 끝난 주의 본인 글 [삭제] → 확인창에 E-28 문구 → /posts + "삭제했어요."', async () => {
    const { user, router } = renderRoute(postPath('dockerCompose'));
    await title('Docker Compose로 로컬 DB 통일');
    await user.click(screen.getByRole('button', { name: '삭제' }));
    const dialog = await screen.findByRole('dialog', { name: '이 글을 삭제할까요?' });
    expect(within(dialog).getByText('이미 끝난 주의 인증 결과는 바뀌지 않아요.')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: '삭제' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/posts'));
    expect(await screen.findByText('삭제했어요.')).toBeInTheDocument();
    expect(router.state.location.search).toBe('?type=devlog');
    // 목록에서도 빠져 있다
    await screen.findByRole('list', { name: '개발일지 글 목록' });
    expect(screen.queryByRole('heading', { name: 'Docker Compose로 로컬 DB 통일' })).not.toBeInTheDocument();
  });

  it('이번 주 글 삭제 확인창에는 E-28 문구가 없다 · [취소]하면 그대로', async () => {
    const { user, router } = renderRoute(postPath('redisTtl'));
    await title('Redis TTL이 적용되지 않던 문제');
    await user.click(screen.getByRole('button', { name: '삭제' }));
    const dialog = await screen.findByRole('dialog', { name: '이 글을 삭제할까요?' });
    expect(within(dialog).queryByText('이미 끝난 주의 인증 결과는 바뀌지 않아요.')).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: '취소' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(router.state.location.pathname).toBe(postPath('redisTtl'));
  });

  it('ACC-BD03-07 · 08 댓글: 비면 [등록] 비활성 · 등록하면 칸이 비고 맨 아래에 붙고 "댓글 4"', async () => {
    const { user, router } = renderRoute(postPath('redisTtl'), { as: 'plain' });
    await title('Redis TTL이 적용되지 않던 문제');
    const input = screen.getByRole('textbox', { name: '댓글' });
    const submit = screen.getByRole('button', { name: '등록' });
    expect(input).toHaveAttribute('placeholder', '댓글을 입력하세요');
    expect(input).toHaveAttribute('maxLength', '500');
    expect(submit).toBeDisabled();
    await user.type(input, '   ');
    expect(submit).toBeDisabled();
    await user.clear(input);
    await user.type(input, '좋은 글이에요');
    expect(submit).toBeEnabled();
    await user.click(submit);
    await waitFor(() => expect(screen.getByRole('heading', { level: 2, name: '댓글 4' })).toBeInTheDocument());
    expect(input).toHaveValue('');
    const items = within(commentList()).getAllByRole('listitem');
    expect(items).toHaveLength(4);
    expect(within(items[3] as HTMLElement).getByText('좋은 글이에요')).toBeInTheDocument();
    expect(within(items[3] as HTMLElement).getByRole('link', { name: '김철수' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(postPath('redisTtl'));
  });

  it('댓글 수정(본인): 인라인 편집 → 저장 → 내용 · "(수정됨)"', async () => {
    const { user } = renderRoute(postPath('redisTtl'));
    await title('Redis TTL이 적용되지 않던 문제');
    // ⑪ 한동관은 이 글(A팀) 팀장이라 남의 댓글도 [수정], 관리자라 [삭제] — 3개 모두
    expect(screen.getAllByRole('button', { name: /댓글 수정$/ })).toHaveLength(3);
    expect(screen.getAllByRole('button', { name: /댓글 삭제$/ })).toHaveLength(3);
    await user.click(screen.getByRole('button', { name: '한동관 댓글 수정' }));
    const box = screen.getByRole('textbox', { name: '댓글 수정' });
    expect(box).toHaveValue('저도 한참 헤맸어요. 커밋 링크 참고해 주세요!');
    await user.clear(box);
    await user.type(box, '커밋 링크를 고쳐 뒀어요.');
    await user.click(screen.getByRole('button', { name: '저장' }));
    expect(await screen.findByText('커밋 링크를 고쳐 뒀어요.')).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: '댓글 수정' })).not.toBeInTheDocument();
    expect(screen.getByText('9/29 15:30 (수정됨)')).toBeInTheDocument();
  });

  it('댓글 버튼: 일반 회원은 본인 댓글에만 [수정][삭제]', async () => {
    renderRoute(postPath('redisTtl'), { as: 'plain' });
    await title('Redis TTL이 적용되지 않던 문제');
    expect(screen.getAllByRole('button', { name: /댓글 (수정|삭제)$/ }).map((b) => b.getAttribute('aria-label'))).toEqual([
      '김철수 댓글 수정',
      '김철수 댓글 삭제',
    ]);
  });

  it('댓글 삭제: 확인 → 목록에서 빠지고 "댓글 2" · "삭제했어요."', async () => {
    const { user } = renderRoute(postPath('redisTtl'));
    await title('Redis TTL이 적용되지 않던 문제');
    await user.click(screen.getByRole('button', { name: '김철수 댓글 삭제' }));
    const dialog = await screen.findByRole('dialog', { name: '댓글을 삭제할까요?' });
    await user.click(within(dialog).getByRole('button', { name: '삭제' }));
    await waitFor(() => expect(screen.getByRole('heading', { level: 2, name: '댓글 2' })).toBeInTheDocument());
    expect(within(commentList()).getAllByRole('listitem')).toHaveLength(2);
    expect(screen.queryByText('저도 같은 문제 겪었어요. ex 옵션 몰랐는데 덕분에 알았어요.')).not.toBeInTheDocument();
    expect(await screen.findByText('삭제했어요.')).toBeInTheDocument();
  });

  it('ACC-BD03-11 본문의 HTML 문자열은 글자 그대로, 줄바꿈 유지', async () => {
    const { db } = await import('@/mocks/db/store');
    const post = db.posts.find((p) => p.id === seedPostId('graphqlN1'));
    if (post) post.sections.problem = '<script>alert(1)</script>\n둘째 줄';
    renderRoute(postPath('graphqlN1'));
    await title('GraphQL N+1을 @BatchMapping으로 해결하기');
    const body = screen.getByText((_, el) => el?.tagName === 'P' && el.textContent === '<script>alert(1)</script>\n둘째 줄');
    expect(body.querySelector('script')).toBeNull();
  });
});
