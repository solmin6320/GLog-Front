/** 테스트용 목 서버 (test/setup.ts가 listen · resetHandlers · close) */
import { setupServer, type SetupServer } from 'msw/node';
import { handlers } from './handlers';

/** 계약서 5장은 SetupServerApi라고 적었지만 msw 2.15의 setupServer 반환 타입은 SetupServer(같은 API)다 */
export const server: SetupServer = setupServer(...handlers);
