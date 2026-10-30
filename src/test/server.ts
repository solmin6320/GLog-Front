/** 테스트용 msw 서버 — 가짜 백엔드(/__backend/graphql)만 받는다. 정의 안 된 요청은 setup.ts가 실패시킨다 */
import { setupServer, type SetupServer } from 'msw/node';
import { backendHandler } from './backend';

export const server: SetupServer = setupServer(backendHandler);
