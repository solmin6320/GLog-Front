import { gqlError } from '../errors';

/**
 * 웨이브 2가 채울 뮤테이션 자리. 부르면 INTERNAL 오류가 난다.
 * 구현할 때 이 함수를 지우고 실제 리졸버로 바꾼다 (README '뮤테이션 추가하기').
 */
export function notImplemented(): never {
  throw gqlError('INTERNAL', { message: 'mock: not implemented yet' });
}
