import { screen, waitFor, within } from '@testing-library/react';
import { beforeEach } from 'vitest';
import { backend } from '@/test/backend';
import { boardFixture, installBoard, POST_ID, type BoardFixture } from '@/test/fixtures/posts';
import { renderRoute, type RenderRouteOptions } from '@/test/render';

// BD-01 게시판 목록 · 헤더 검색 결과 (ACC-BD01-* · ACC-HS-07 · ACC-HS-08 · ACC-HS-13)

const searchbox = () => screen.getByRole('searchbox', { name: '게시판 검색' });
const tab = (name: RegExp) => screen.getByRole('tab', { name });
const list = (name = '트러블슈팅 글 목록') => screen.findByRole('list', { name });
const titles = (ul: HTMLElement) => within(ul).getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
const tagGroup = () => screen.getByRole('group', { name: '태그로 거르기' });
const search = (router: { state: { location: { search: string } } }) => Object.fromEntries(new URLSearchParams(router.state.location.search));

// 백엔드는 태그를 소문자로 정규화해 돌려준다(post.graphqls Post.tags) — 카드 · 태그 필터 링크도 소문자

let board: BoardFixture;
const open = (path: string, o: RenderRouteOptions = {}) => renderRoute(path, { ...o, bridge: true });

describe('BD-01 게시판 목록', () => {
  beforeEach(() => {
    board = installBoard(boardFixture());
  });

  it('ACC-BD01-01 /posts → 트러블슈팅 탭 · 최신순 20개 · W-11 카드(태그 · 공개 팀 · 작성자 · 날짜 · 댓글)', async () => {
    open('/posts');
    const ul = await list();
    expect(tab(/트러블슈팅/)).toHaveAttribute('aria-selected', 'true');
    expect(within(ul).getAllByRole('listitem')).toHaveLength(20);
    expect(titles(ul).slice(0, 4)).toEqual([
      'Redis TTL이 적용되지 않던 문제',
      'GraphQL N+1을 @BatchMapping으로 해결하기',
      'Expo 딥링크가 안드로이드에서만 열리지 않을 때',
      'Flyway 체크섬 불일치로 서버가 안 뜨는 문제',
    ]);
    const first = within(ul).getAllByRole('listitem')[0] as HTMLElement;
    expect(within(first).getByRole('link', { name: 'Redis TTL이 적용되지 않던 문제' })).toHaveAttribute('href', `/posts/${POST_ID.redisTtl}`);
    expect(within(first).getByRole('link', { name: '#redis' })).toHaveAttribute('href', '/posts?type=troubleshooting&tag=redis');
    expect(within(first).getByText('사이드 프로젝트 A팀')).toBeInTheDocument();
    expect(within(first).getByRole('link', { name: '한동관' })).toHaveAttribute('href', '/profile/me');
    expect(within(first).getByText('9/29')).toBeInTheDocument();
    expect(within(first).getByText('댓글 3')).toBeInTheDocument();
    // 많이 쓰인 태그 10개 (W-11 순서)
    await waitFor(() => expect(within(tagGroup()).getAllByRole('link')).toHaveLength(10));
    expect(within(tagGroup()).getAllByRole('link').map((a) => a.textContent)).toEqual(
      ['spring', 'redis', 'graphql', 'react', 'expo', 'mariadb', 'docker', '배포', 'flyway', 'mongodb'].map((t) => `#${t}`),
    );
    expect(screen.queryByText('필터 해제')).not.toBeInTheDocument();
    // 서버 요청: 첫 페이지는 종류만 (tag · q 없음)
    expect(backend.calls('posts')[0]?.args).toMatchObject({ type: 'TROUBLESHOOTING', tag: null, q: null, after: null });
  });

  it('ACC-BD01-05 isRecord=false 글만 "인증 미포함" 배지 + 툴팁', async () => {
    open('/posts');
    const ul = await list();
    const items = within(ul).getAllByRole('listitem');
    const n1 = items[1] as HTMLElement;
    const badge = within(n1).getByText('인증 미포함');
    expect(badge.closest('[title]')).toHaveAttribute('title', '필수 항목을 다 채우면 인증에 들어가요.');
    expect(within(items[0] as HTMLElement).queryByText('인증 미포함')).not.toBeInTheDocument();
  });

  it('ACC-BD01-06 비공개 팀 글: plain에게도 글은 보이고 팀 이름표만 없다', async () => {
    open('/posts?type=devlog', { as: 'plain' });
    const ul = await list('개발일지 글 목록');
    const seg = within(ul).getByRole('heading', { name: '세그먼트 트리 지연 전파 정리' }).closest('li') as HTMLElement;
    expect(within(seg).getByRole('link', { name: '#알고리즘' })).toBeInTheDocument();
    expect(screen.queryByText('알고리즘 스터디')).not.toBeInTheDocument();
    const schema = within(ul).getByRole('heading', { name: 'GraphQL 스키마 초안 정리' }).closest('li') as HTMLElement;
    expect(within(schema).getByText('사이드 프로젝트 A팀')).toBeInTheDocument();
  });

  it('ACC-BD01-07 [더 보기]로 이어 붙이고, 끝에서는 "여기까지예요."', async () => {
    const { user } = open('/posts');
    const ul = await list();
    expect(screen.queryByText('여기까지예요.')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '더 보기' }));
    await waitFor(() => expect(within(ul).getAllByRole('listitem')).toHaveLength(23));
    expect(backend.calls('posts').some((c) => c.args.after === '20')).toBe(true);
    expect(titles(ul)[0]).toBe('Redis TTL이 적용되지 않던 문제');
    expect(screen.getByText('여기까지예요.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '더 보기' })).not.toBeInTheDocument();
  });

  it('ACC-HS-07 · ACC-BD01-04 헤더 검색 Enter → q가 채워진 BD-01 · 탭별 건수 3 / 1 · 결과 요약 · <mark> 강조', async () => {
    const { user, router } = open('/posts');
    await list();
    await user.click(screen.getByRole('button', { name: /를 눌러 글 검색/ }));
    await user.type(screen.getByRole('combobox', { name: '글 검색' }), 'Redis{Enter}');
    await waitFor(() => expect(search(router)).toEqual({ type: 'troubleshooting', q: 'Redis' }));
    expect(router.state.location.pathname).toBe('/posts');
    await waitFor(() => expect(searchbox()).toHaveValue('Redis'));
    await waitFor(() => expect(tab(/트러블슈팅/)).toHaveTextContent('트러블슈팅3'));
    expect(tab(/개발일지/)).toHaveTextContent('개발일지1');
    const summary = await screen.findByText((_, el) => el?.tagName === 'P' && el.textContent === '‘Redis’ 검색 결과 3건 · 제목 · 내용 · 태그에서 찾았어요');
    expect(summary).toBeInTheDocument();
    const ul = await list();
    expect(titles(ul)).toEqual(['Redis TTL이 적용되지 않던 문제', 'Upstash Redis 명령 수가 갑자기 늘어난 이유', '헬스체크에서 캐시 서버를 뺀 이유']);
    expect(within(ul).getAllByText('Redis', { selector: 'mark' })).toHaveLength(2);
    expect(backend.calls('posts').some((c) => c.args.type === 'DEVLOG' && c.args.q === 'Redis')).toBe(true);
    expect(screen.getByRole('link', { name: '필터 해제' })).toHaveAttribute('href', '/posts?type=troubleshooting');
  });

  it('ACC-HS-08 헤더 검색 태그 줄 → ?tag=Redis 목록 · 걸린 태그는 ✕로 푼다', async () => {
    const { user, router } = open('/posts');
    await list();
    await user.click(screen.getByRole('button', { name: /를 눌러 글 검색/ }));
    await user.type(screen.getByRole('combobox', { name: '글 검색' }), 'Redis');
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    await waitFor(() => expect(search(router)).toEqual({ tag: 'Redis' }));
    const ul = await list();
    await waitFor(() => expect(titles(ul)).toEqual(['Redis TTL이 적용되지 않던 문제', 'Upstash Redis 명령 수가 갑자기 늘어난 이유', '헬스체크에서 캐시 서버를 뺀 이유']));
    await user.click(within(tagGroup()).getByRole('button', { name: '#redis 태그 지우기' }));
    await waitFor(() => expect(search(router)).toEqual({ type: 'troubleshooting' }));
  });

  it('ACC-HS-13 "C++ 에러" 검색어가 인코딩되고 BD-01 ③에 원문이 돌아온다', async () => {
    open(`/posts?type=troubleshooting&q=${encodeURIComponent('C++ 에러')}`);
    await screen.findByText('검색 결과가 없어요.');
    expect(searchbox()).toHaveValue('C++ 에러');
  });

  it('ACC-BD01-02 탭을 바꿔도 q · tag는 유지된다', async () => {
    const { user, router } = open('/posts?type=troubleshooting&q=Redis&tag=Spring');
    const ul = await list();
    expect(titles(ul)).toEqual(['Redis TTL이 적용되지 않던 문제']);
    await user.click(tab(/개발일지/));
    await waitFor(() => expect(search(router)).toEqual({ type: 'devlog', q: 'Redis', tag: 'Spring' }));
    expect(tab(/개발일지/)).toHaveAttribute('aria-selected', 'true');
    expect(searchbox()).toHaveValue('Redis');
    expect(within(tagGroup()).getByRole('button', { name: '#spring 태그 지우기' })).toBeInTheDocument();
  });

  it('태그 필터: 태그를 누르면 ?tag= · 검색어는 유지', async () => {
    const { user, router } = open('/posts?q=Redis');
    await list();
    await waitFor(() => expect(within(tagGroup()).getAllByRole('link').length).toBeGreaterThan(0));
    await user.click(within(tagGroup()).getByRole('link', { name: '#spring' }));
    await waitFor(() => expect(search(router)).toEqual({ type: 'troubleshooting', q: 'Redis', tag: 'spring' }));
    const ul = await list();
    await waitFor(() => expect(titles(ul)).toEqual(['Redis TTL이 적용되지 않던 문제']));
  });

  it('ACC-BD01-03 검색어 1자 → 실행하지 않고 "2자 이상 입력해 주세요."', async () => {
    const { user, router } = open('/posts');
    await list();
    await user.type(searchbox(), 'R{Enter}');
    expect(await screen.findByText('2자 이상 입력해 주세요.')).toBeInTheDocument();
    expect(router.state.location.search).toBe('');
    await user.type(searchbox(), 'edis{Enter}');
    await waitFor(() => expect(search(router)).toEqual({ type: 'troubleshooting', q: 'Redis' }));
    expect(screen.queryByText('2자 이상 입력해 주세요.')).not.toBeInTheDocument();
  });

  it('검색어를 지우면(✕) 검색이 풀린다', async () => {
    const { user, router } = open('/posts?q=Redis');
    await list();
    await user.click(screen.getByRole('button', { name: '검색어 지우기' }));
    await waitFor(() => expect(search(router)).toEqual({ type: 'troubleshooting' }));
    expect(searchbox()).toHaveValue('');
  });

  it('ACC-BD01-08 · ACC-BD01-09 검색 결과 0건 → 안내 + [필터 해제] · 다른 탭에 있으면 링크', async () => {
    open('/posts?tag=없는태그');
    expect(await screen.findByText('검색 결과가 없어요.')).toBeInTheDocument();
    expect(screen.getByText('다른 말로 찾아보세요.')).toBeInTheDocument();
    const resets = screen.getAllByRole('link', { name: '필터 해제' });
    expect(resets.every((a) => a.getAttribute('href') === '/posts?type=troubleshooting')).toBe(true);
  });

  it('검색 결과가 다른 탭에만 있으면 "개발일지에 n건 있어요" 링크', async () => {
    open(`/posts?q=${encodeURIComponent('스키마 초안')}`);
    await screen.findByText('검색 결과가 없어요.');
    expect(await screen.findByRole('link', { name: '개발일지에 1건 있어요' })).toHaveAttribute(
      'href',
      `/posts?type=devlog&q=${encodeURIComponent('스키마 초안').replace(/%20/g, '+')}`,
    );
  });

  it('ACC-BD01-08 글이 하나도 없으면 "아직 글이 없어요" — 글쓰기 버튼은 헤더 하나만(본문에 중복 없음)', async () => {
    board.posts.length = 0;
    open('/posts?type=devlog');
    expect(await screen.findByText('아직 글이 없어요.')).toBeInTheDocument();
    expect(screen.getByText('첫 글을 남겨보세요.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: '게시판' })).toBeInTheDocument();
    expect(within(screen.getByRole('main')).queryByRole('link', { name: /글쓰기/ })).not.toBeInTheDocument();
    // 헤더 글쓰기(데스크톱 · 모바일)는 지금 탭의 글 종류로 연다
    for (const a of screen.getAllByRole('link', { name: '새 글쓰기' })) expect(a).toHaveAttribute('href', '/posts/new?type=devlog');
  });

  it('ACC-BD01-10 개발일지 탭에서 헤더 [글쓰기] → /posts/new?type=devlog (작성 화면 기본 종류)', async () => {
    const { user, router } = open('/posts?type=devlog');
    await list('개발일지 글 목록');
    await user.click(screen.getAllByRole('link', { name: '새 글쓰기' })[0] as HTMLElement);
    await waitFor(() => expect(router.state.location.pathname).toBe('/posts/new'));
    expect(await screen.findByRole('tab', { name: '개발일지' })).toHaveAttribute('aria-selected', 'true');
  });

  it('ACC-BD01-11 카드 클릭 → BD-03 · 작성자 → PR-01', async () => {
    const { user, router } = open('/posts', { as: 'plain' });
    const ul = await list();
    const first = within(ul).getAllByRole('listitem')[0] as HTMLElement;
    expect(within(first).getByRole('link', { name: '한동관' })).toHaveAttribute('href', '/profile/1');
    await user.click(within(first).getByRole('link', { name: 'Redis TTL이 적용되지 않던 문제' }));
    await waitFor(() => expect(router.state.location.pathname).toBe(`/posts/${POST_ID.redisTtl}`));
  });
});
