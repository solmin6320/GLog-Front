import { env, isMockMode } from '@/shared/config/env';
import { paths } from '@/shared/lib/paths';

/**
 * 로그인 시작 주소 (설계서 4장 · 요구사항 4-3).
 * real: 백엔드 OAuth 시작 경로로 브라우저 이동. mock: OAuth 없이 바로 콜백(`mock-<persona>` 코드).
 */
export function loginUrl(persona?: string): string {
  if (isMockMode) return `${paths.authCallback()}?code=${encodeURIComponent(`mock-${persona ?? 'member'}`)}`;
  return `${env.apiOrigin}/oauth2/authorization/github`;
}
