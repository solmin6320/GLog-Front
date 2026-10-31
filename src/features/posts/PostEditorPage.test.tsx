import { act, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach } from 'vitest';
import { server } from '@/test/server';
import { backend } from '@/test/backend';
import { boardFixture, installBoard, POST_ID, serveBoardMutations, type BoardFixture } from '@/test/fixtures/posts';
import { renderRoute as renderRouteRaw, type RenderRouteOptions } from '@/test/render';

// BD-04 글 작성 · 수정 (ACC-BD04-*) — bridge + 가짜 백엔드 (post.graphqls)

let board: BoardFixture;
beforeEach(() => {
  board = installBoard(boardFixture());
  serveBoardMutations(board);
});
const renderRoute = (path: string, o: RenderRouteOptions = {}) => renderRouteRaw(path, { ...o, bridge: true });
const editPath = (key: string) => `/posts/${POST_ID[key as keyof typeof POST_ID] ?? 'missing'}/edit`;
const heading = (name: string) => screen.findByRole('heading', { level: 1, name });
const field = (name: string | RegExp) => screen.getByRole('textbox', { name });
const progress = () => screen.getByText(/필수 항목을 다 채/);
const postIdIn = (pathname: string) => /^\/posts\/([0-9a-f]{24})$/.exec(pathname)?.[1];

describe('BD-04 글쓰기', () => {
  it('ACC-BD04-01 트러블슈팅 = 문제 · 원인 · 해결 3칸, 개발일지로 바꾸면 한 일 · 배운 점 2칸 (카운터는 제목 포함 별표 칸 수)', async () => {
    const { user } = renderRoute('/posts/new');
    expect(await heading('글쓰기')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '트러블슈팅' })).toHaveAttribute('aria-selected', 'true');
    for (const name of ['문제', '원인', '해결']) expect(field(new RegExp(`^${name}`))).toBeInTheDocument();
    expect(progress()).toHaveTextContent('필수 항목을 다 채우면 인증에 들어가요 (0 / 4)');
    await user.click(screen.getByRole('tab', { name: '개발일지' }));
    expect(field(/^한 일/)).toBeInTheDocument();
    expect(field(/^배운 점/)).toHaveAttribute('placeholder', '배운 점을 적어 주세요');
    expect(screen.queryByRole('textbox', { name: /^문제/ })).not.toBeInTheDocument();
    expect(progress()).toHaveTextContent('(0 / 3)');
  });

  it('경로 표시: 홈 › 게시판 › 개발일지 › 글쓰기 — 글 종류 칸은 링크, 굵은 칸은 "글쓰기" 하나', async () => {
    renderRoute('/posts/new?type=devlog');
    await heading('글쓰기');
    const crumb = screen.getByRole('navigation', { name: '현재 위치' });
    expect(within(crumb).getByRole('link', { name: '개발일지' })).toHaveAttribute('href', '/posts?type=devlog');
    expect(within(crumb).getByText('글쓰기')).toHaveAttribute('aria-current', 'page');
    expect(crumb.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
  });

  it('[취소] · [등록]은 같은 크기 버튼', async () => {
    renderRoute('/posts/new');
    await heading('글쓰기');
    const sizeOf = (el: HTMLElement) => [...el.classList].filter((c) => /(^|_)(sm|md|lg)(_|$)/.test(c)).join();
    expect(sizeOf(screen.getByRole('button', { name: '취소' }))).toBe(sizeOf(screen.getByRole('button', { name: '등록' })));
  });

  it('ACC-BD04-02 · 03 · 04 ⑩ 실시간 안내: 공백만은 빈 칸, 다 채우면 곧바로 "다 채웠어요"', async () => {
    const { user } = renderRoute('/posts/new?type=devlog');
    await heading('글쓰기');
    await user.type(field(/^한 일/), '   ');
    expect(progress()).toHaveTextContent('필수 항목을 다 채우면 인증에 들어가요 (0 / 3)');
    await user.type(field(/^제목/), '오늘 한 일');
    expect(progress()).toHaveTextContent('필수 항목을 다 채우면 인증에 들어가요 (1 / 3)');
    await user.type(field(/^한 일/), '표를 만들었어요.');
    expect(progress()).toHaveTextContent('필수 항목을 다 채우면 인증에 들어가요 (2 / 3)');
    await user.type(field(/^배운 점/), '가로 스크롤이 편해요.');
    expect(progress()).toHaveTextContent('필수 항목을 다 채웠어요. 이 글은 인증에 들어가요');
  });

  it('ACC-BD04-05 제목이 비면 인라인 "제목을 입력해 주세요." · 저장 요청 없음', async () => {
    const { user, router } = renderRoute('/posts/new');
    await heading('글쓰기');
    await user.click(screen.getByRole('button', { name: '등록' }));
    expect(await screen.findByText('제목을 입력해 주세요.')).toBeInTheDocument();
    expect(field(/^제목/)).toHaveAttribute('aria-invalid', 'true');
    await waitFor(() => expect(field(/^제목/)).toHaveFocus());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/posts/new');
    expect(backend.calls('createPost')).toHaveLength(0);
  });

  it('ACC-BD04-06 · 07 필수 칸이 비면 ⑭ 확인 → [더 쓰기]는 첫 빈 칸으로 · [그대로 올리기]는 저장 → BD-03 "인증 미포함"', async () => {
    const { user, router } = renderRoute('/posts/new');
    await heading('글쓰기');
    await user.type(field(/^제목/), '반쯤 쓴 글');
    await user.type(field(/^문제/), '문제만 썼어요.');
    await user.click(screen.getByRole('button', { name: '등록' }));
    let dialog = await screen.findByRole('dialog', { name: '아직 다 안 채웠어요' });
    expect(within(dialog).getByText('이대로 올리면 인증에 포함되지 않아요.')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: '더 쓰기' }));
    await waitFor(() => expect(field(/^원인/)).toHaveFocus());
    expect(router.state.location.pathname).toBe('/posts/new');

    await user.click(screen.getByRole('button', { name: '등록' }));
    dialog = await screen.findByRole('dialog', { name: '아직 다 안 채웠어요' });
    await user.click(within(dialog).getByRole('button', { name: '그대로 올리기' }));
    await waitFor(() => expect(postIdIn(router.state.location.pathname)).toBeDefined());
    expect(await screen.findByText('등록했어요.')).toBeInTheDocument();
    expect(await heading('반쯤 쓴 글')).toBeInTheDocument();
    expect(screen.getByText('인증 미포함')).toBeInTheDocument();
    expect(screen.getAllByText('작성되지 않음')).toHaveLength(2);
    // 저장 뒤 이동은 replace — 뒤로 가도 작성 화면으로 돌아가지 않는다
    expect(router.state.historyAction).toBe('REPLACE');
  });

  it('ACC-BD04-08 다 채우고 [등록] → /posts/:id + "등록했어요." · 태그 · 커밋 · 팀(?team=)이 함께 저장된다', async () => {
    const { user, router } = renderRoute('/posts/new?type=devlog&team=1');
    await heading('글쓰기');
    expect(screen.getByRole('combobox', { name: '소속 팀' })).toHaveValue('1');
    await user.type(field(/^제목/), '캐시 정리 일지');
    await user.type(field(/^한 일/), '캐시 정책을 정리했어요.');
    await user.type(field(/^배운 점/), 'keyFields를 배웠어요.');
    await user.type(field(/^태그/), 'Apollo{Enter}#React,');
    expect(screen.getByRole('button', { name: '#apollo 태그 지우기' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '#react 태그 지우기' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '등록' }));
    await waitFor(() => expect(postIdIn(router.state.location.pathname)).toBeDefined());
    expect(await screen.findByText('등록했어요.')).toBeInTheDocument();
    expect(await heading('캐시 정리 일지')).toBeInTheDocument();
    expect(screen.queryByText('인증 미포함')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: '#apollo' })).toBeInTheDocument();
    expect(screen.getByText('사이드 프로젝트 A팀')).toBeInTheDocument();
    expect(backend.calls('createPost')[0]?.args.input).toMatchObject({ type: 'DEVLOG', teamId: '1', tags: ['apollo', 'react'] });
  });

  it('ACC-BD04-10 태그 5개면 입력칸이 막히고 "태그는 5개까지 달 수 있어요." · 21자는 입력이 막힌다', async () => {
    const { user } = renderRoute('/posts/new');
    await heading('글쓰기');
    const input = field(/^태그/);
    expect(input).toHaveAttribute('maxLength', '20');
    await user.type(input, 'a{Enter}b{Enter}c{Enter}d{Enter}e{Enter}');
    expect(input).toBeDisabled();
    expect(screen.getByText('태그는 5개까지 달 수 있어요.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '#e 태그 지우기' }));
    expect(input).toBeEnabled();
    await user.type(input, 'a{Enter}');
    expect(screen.getByText('이미 단 태그예요.')).toBeInTheDocument();
  });

  it('ACC-BD04-12 소속 팀: 팀 2개(하나는 비공개) → "연결 안 함"(기본) + 실제 이름 둘', async () => {
    renderRoute('/posts/new');
    await heading('글쓰기');
    const select = screen.getByRole('combobox', { name: '소속 팀' });
    expect(select).toHaveValue('');
    expect(within(select).getAllByRole('option').map((o) => o.textContent)).toEqual(['연결 안 함', '사이드 프로젝트 A팀', '알고리즘 스터디']);
  });

  it('ACC-BD04-12 소속 팀 0개 → ⑨ 영역이 없다', async () => {
    renderRoute('/posts/new', { as: 'noteam' });
    await heading('글쓰기');
    expect(screen.queryByRole('combobox', { name: '소속 팀' })).not.toBeInTheDocument();
  });

  it('ACC-BD04-13 필수 칸에 입력이 있으면 종류 전환 전에 확인한다', async () => {
    const { user } = renderRoute('/posts/new');
    await heading('글쓰기');
    await user.type(field(/^문제/), '문제를 적었어요.');
    await user.click(screen.getByRole('tab', { name: '개발일지' }));
    let dialog = await screen.findByRole('dialog', { name: '글 종류를 바꿀까요?' });
    await user.click(within(dialog).getByRole('button', { name: '그대로 두기' }));
    expect(screen.getByRole('tab', { name: '트러블슈팅' })).toHaveAttribute('aria-selected', 'true');
    expect(field(/^문제/)).toHaveValue('문제를 적었어요.');
    await user.click(screen.getByRole('tab', { name: '개발일지' }));
    dialog = await screen.findByRole('dialog', { name: '글 종류를 바꿀까요?' });
    await user.click(within(dialog).getByRole('button', { name: '바꾸기' }));
    expect(screen.getByRole('tab', { name: '개발일지' })).toHaveAttribute('aria-selected', 'true');
    expect(field(/^한 일/)).toHaveValue('');
  });

  it('ACC-BD04-14 쓰던 글이 있으면 이탈 확인 → [계속 쓰기]는 머문다 · [나가기]는 떠난다 · 초안은 저장하지 않는다', async () => {
    const { user, router } = renderRoute('/posts/new');
    await heading('글쓰기');
    // 입력이 없으면 바로 떠난다
    await user.type(field(/^제목/), '쓰다 만 글');
    await act(() => router.navigate('/notices'));
    let dialog = await screen.findByRole('dialog', { name: '쓰던 글이 사라져요. 나갈까요?' });
    await user.click(within(dialog).getByRole('button', { name: '계속 쓰기' }));
    expect(router.state.location.pathname).toBe('/posts/new');
    expect(field(/^제목/)).toHaveValue('쓰다 만 글');

    await user.click(screen.getByRole('button', { name: '취소' }));
    dialog = await screen.findByRole('dialog', { name: '쓰던 글이 사라져요. 나갈까요?' });
    await user.click(within(dialog).getByRole('button', { name: '나가기' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/posts'));
    expect(Object.keys(localStorage).filter((k) => k !== 'glog.token' && k !== 'glog.mock')).toEqual([]);
    expect(sessionStorage.length).toBe(0);
  });

  it('입력이 없으면 이탈 확인 없이 떠난다', async () => {
    const { router } = renderRoute('/posts/new');
    await heading('글쓰기');
    await act(() => router.navigate('/notices'));
    await waitFor(() => expect(router.state.location.pathname).toBe('/notices'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('ACC-BD04-15 E-27 일요일 23:31(KST)에는 배너, 23:29에는 없다', async () => {
    const late = renderRoute('/posts/new', { now: '2026-10-04T23:31:00+09:00' });
    await heading('글쓰기');
    expect(screen.getByText('이번 주는 곧 끝나요. 자정 전에 올려야 이번 주로 들어가요.')).toBeInTheDocument();
    late.unmount();
    renderRoute('/posts/new', { now: '2026-10-04T23:29:00+09:00' });
    await heading('글쓰기');
    expect(screen.queryByText('이번 주는 곧 끝나요. 자정 전에 올려야 이번 주로 들어가요.')).not.toBeInTheDocument();
  });

  it('ACC-BD04-19 저장 중 연결이 끊기면 입력이 남고 버튼이 돌아오며 "인터넷 연결을 확인해 주세요."', async () => {
    server.use(
      http.post('*/__backend/graphql', async ({ request }) => {
        const body = (await request.clone().json()) as { query: string };
        if (body.query.includes('createPost')) return HttpResponse.error();
        return undefined;
      }),
    );
    const { user, router } = renderRoute('/posts/new?type=devlog');
    await heading('글쓰기');
    await user.type(field(/^제목/), '끊겨도 남는 글');
    await user.type(field(/^한 일/), '한 일');
    await user.type(field(/^배운 점/), '배운 점');
    await user.click(screen.getByRole('button', { name: '등록' }));
    expect(await screen.findByText('인터넷 연결을 확인해 주세요.')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/posts/new');
    expect(field(/^제목/)).toHaveValue('끊겨도 남는 글');
    await waitFor(() => expect(screen.getByRole('button', { name: '등록' })).toBeEnabled());
  });
});

describe('BD-04 글 수정', () => {
  it('ACC-BD04-18 수정 모드: "글 수정" · 종류 탭 비활성 · 원래 값 · [수정] → "수정했어요." → BD-03 (수정됨)', async () => {
    const { user, router } = renderRoute(editPath('redisTtl'));
    expect(await heading('글 수정')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '트러블슈팅' })).toBeDisabled();
    expect(screen.getByRole('tab', { name: '개발일지' })).toBeDisabled();
    expect(field(/^제목/)).toHaveValue('Redis TTL이 적용되지 않던 문제');
    expect(screen.getByRole('combobox', { name: '소속 팀' })).toHaveValue('1');
    expect(screen.getByRole('button', { name: '#redis 태그 지우기' })).toBeInTheDocument();
    expect(progress()).toHaveTextContent('필수 항목을 다 채웠어요. 이 글은 인증에 들어가요');
    expect(screen.queryByText('이미 끝난 주의 인증 결과는 바뀌지 않아요.')).not.toBeInTheDocument();
    expect(screen.queryByText(/팀 글을 수정하고 있어요/)).not.toBeInTheDocument();

    await user.clear(field(/^제목/));
    await user.type(field(/^제목/), 'Redis TTL 문제 (정리본)');
    await user.click(screen.getByRole('button', { name: '수정' }));
    await waitFor(() => expect(router.state.location.pathname).toBe(`/posts/${POST_ID.redisTtl}`));
    expect(await screen.findByText('수정했어요.')).toBeInTheDocument();
    expect(await heading('Redis TTL 문제 (정리본)')).toBeInTheDocument();
    expect(screen.getByText('9/29 14:20 (수정됨)')).toBeInTheDocument();
  });

  it('E-28 끝난 주의 글을 고칠 때 "이미 끝난 주의 인증 결과는 바뀌지 않아요."', async () => {
    renderRoute(editPath('dockerCompose'));
    await heading('글 수정');
    expect(screen.getByText('이미 끝난 주의 인증 결과는 바뀌지 않아요.')).toBeInTheDocument();
  });

  it('ACC-BD04-16 팀장이 팀원 글을 고치면 ②⑨ 비활성 + 배너 · 삭제 버튼 없음', async () => {
    renderRoute(editPath('expoDeeplink'));
    await heading('글 수정');
    expect(screen.getByText('팀 글을 수정하고 있어요. 삭제는 관리자에게 문의해 주세요.')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '트러블슈팅' })).toBeDisabled();
    expect(screen.getByRole('combobox', { name: '소속 팀' })).toBeDisabled();
    expect(screen.getByRole('combobox', { name: '소속 팀' })).toHaveValue('1');
    expect(screen.queryByRole('button', { name: '삭제' })).not.toBeInTheDocument();
  });

  it('ACC-BD04-17 남의 글 /edit 직접 접근 → "이 페이지에 들어올 권한이 없어요." + [홈으로]', async () => {
    renderRoute(editPath('redisTtl'), { as: 'plain' });
    expect(await heading('이 페이지에 들어올 권한이 없어요.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '홈으로' })).toHaveAttribute('href', '/');
  });

  it('삭제된 글 · 없는 글의 /edit', async () => {
    const deleted = renderRoute(editPath('deletedMemo'));
    expect(await heading('삭제된 글이에요.')).toBeInTheDocument();
    deleted.unmount();
    renderRoute('/posts/000000000000000000000000/edit');
    expect(await heading('찾는 내용이 없어요. 삭제됐을 수 있어요.')).toBeInTheDocument();
  });

  it('EX-BD04-02 고치는 중에 글이 지워지면 "삭제된 글이에요." + [목록으로], 입력은 남는다', async () => {
    const { user } = renderRoute(editPath('redisTtl'));
    await heading('글 수정');
    board.deleted.add(POST_ID.redisTtl);
    await user.type(field(/^제목/), '!');
    await user.click(screen.getByRole('button', { name: '수정' }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('삭제된 글이에요.');
    expect(within(alert).getByRole('link', { name: '목록으로' })).toHaveAttribute('href', '/posts');
    expect(field(/^제목/)).toHaveValue('Redis TTL이 적용되지 않던 문제!');
  });
});
