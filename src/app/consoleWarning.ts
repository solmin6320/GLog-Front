/**
 * 배포본 콘솔 경고 (셀프 XSS 방지). 남이 알려 준 코드를 콘솔에 붙여 넣으면 로그인 토큰이 빠져나갈 수 있다고 알린다.
 * 콘솔 입력 자체는 막을 수 없다 — 서버 공격은 백엔드의 인증 · 권한 · 쿼리 한도가 막는다. 여기서는 사용자를 속이는 공격만 줄인다.
 */
export function printConsoleWarning(): void {
  const title = 'color:#B42318;font-size:28px;font-weight:800';
  const body = 'font-size:14px;line-height:1.6';
  console.log('%c잠깐!', title);
  console.log(
    '%c이 창은 개발자용이에요. 누군가 여기에 코드를 붙여 넣으라고 했다면 사기일 가능성이 커요.\n붙여 넣은 코드는 내 로그인 정보로 글을 쓰거나 지우고, 로그인 토큰을 빼 갈 수 있어요.',
    body,
  );
}
