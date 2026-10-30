/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { execFile } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { defineConfig, type Plugin } from 'vite';

/**
 * 로컬 브리지 모드 전용 로그인. GitHub OAuth 키 없이 개발용 회원으로 들어간다.
 * 백엔드가 발급하는 것과 같은 일회용 코드(43자, Redis authcode:{code}, TTL 60초)를 직접 만들어 콜백으로 보낸다.
 * 개발 서버(serve)에서만 붙는다 — 빌드 결과에는 없다.
 */
function devLogin(): Plugin {
  return {
    name: 'glog-dev-login',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__dev-login', (req, res) => {
        const memberId = /^\d+$/.test(new URL(req.url ?? '', 'http://x').searchParams.get('member') ?? '') ? new URL(req.url ?? '', 'http://x').searchParams.get('member')! : '1';
        const code = randomBytes(32).toString('base64url');
        execFile('docker', ['exec', 'jandilog-redis', 'redis-cli', 'SET', `authcode:${code}`, memberId, 'EX', '60'], (err) => {
          if (err) {
            res.statusCode = 502;
            res.end('dev-login: Redis 컨테이너(jandilog-redis)에 코드를 넣지 못했어요. docker compose up -d 를 확인하세요.');
            return;
          }
          res.statusCode = 302;
          res.setHeader('Location', `/auth/callback?code=${code}`);
          res.end();
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), devLogin()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    // bridge 모드: 백엔드 GraphQL을 같은 출처로 받는다 (VITE_BRIDGE_ORIGIN, 기본 http://localhost:8080)
    proxy: {
      '/__backend': {
        target: process.env.VITE_BRIDGE_ORIGIN || 'http://localhost:8080',
        changeOrigin: true,
        // 백엔드 CORS는 WEB_BASE_URL(기본 5173) 한 곳만 허용한다 — 개발 서버 포트가 달라도 통과하게 맞춘다
        headers: { origin: process.env.VITE_BRIDGE_WEB_ORIGIN || 'http://localhost:5180' },
        rewrite: (path) => path.replace(/^\/__backend/, ''),
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
    env: {
      VITE_API_MODE: 'bridge',
      VITE_API_ORIGIN: 'http://localhost',
    },
    restoreMocks: true,
  },
});
