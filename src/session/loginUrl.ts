import { env, isBridgeMode } from '@/shared/config/env';

/**
 * 로그인 시작 주소 (설계서 4장 · 요구사항 4-3).
 * 백엔드 OAuth 시작 경로로 브라우저 이동. persona는 예전 목 모드 흔적이라 쓰지 않는다(호출부 호환용).
 */
export function loginUrl(_persona?: string): string {
  if (isBridgeMode) {
    // 개발 로그인(GitHub 없이 시드 회원)은 VITE_DEV_LOGIN=1 일 때만 (vite.config.ts의 /__dev-login)
    if (import.meta.env.VITE_DEV_LOGIN === '1') return '/__dev-login';
    // 기본: 진짜 GitHub 로그인. 백엔드가 GitHub로 보내고 돌아오면 {WEB_BASE_URL}/auth/callback?code=…
    return `${env.bridgeOrigin}/oauth2/authorization/github`;
  }
  return `${env.apiOrigin}/oauth2/authorization/github`;
}
