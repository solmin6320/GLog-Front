/**
 * REST 예외 1개 — 프로필 이미지 업로드 (A3 5장 · PR-02). 이 파일이 앱에서 유일하게 fetch를 부른다.
 * - Authorization: Bearer. Content-Type은 넣지 않는다(브라우저가 multipart boundary를 붙인다).
 * - 실패하면 AppError를 던진다:
 *   401 → UNAUTHENTICATED (+ 'expired' 사건) · 413 → VALIDATION_FAILED field 'file.size' · 415 → field 'file.type'
 *   5xx(502 업로드 실패 포함) · 모르는 응답 → INTERNAL · 연결 실패 → NETWORK
 *   PR-02는 INTERNAL 문구를 errorOverrides로 "사진을 올리지 못했어요. 다시 시도해 주세요."(E-55)로 덮는다.
 */
import { restUrl } from '@/shared/config/env';
import { appError, normalizeError } from './errors';
import { bearer } from './links';
import { sessionEvents } from './sessionEvents';
import { tokenStore } from './tokenStore';

export const PROFILE_IMAGE_PATH = '/api/members/me/profile-image';

export async function uploadProfileImage(file: File): Promise<{ profileImageUrl: string }> {
  const token = tokenStore.get();
  const body = new FormData();
  body.append('file', file);

  let res: Response;
  try {
    res = await fetch(restUrl(PROFILE_IMAGE_PATH), {
      method: 'POST',
      body,
      headers: token ? { Authorization: bearer(token) } : undefined,
    });
  } catch (err) {
    throw normalizeError(err);
  }

  if (res.ok) {
    const json: unknown = await res.json().catch(() => null);
    const url = typeof json === 'object' && json !== null ? (json as { profileImageUrl?: unknown }).profileImageUrl : undefined;
    if (typeof url === 'string') return { profileImageUrl: url };
    throw appError('INTERNAL');
  }

  // Nginx가 HTML로 413을 줄 수도 있어서 본문이 아니라 상태 코드로 나눈다 (A3 5장)
  if (res.status === 401) {
    if (token && tokenStore.get() === token) sessionEvents.emit('expired');
    throw appError('UNAUTHENTICATED');
  }
  if (res.status === 413) throw appError('VALIDATION_FAILED', 'file.size');
  if (res.status === 415) throw appError('VALIDATION_FAILED', 'file.type');
  if (res.status >= 500) throw appError('INTERNAL');

  const json: unknown = await res.json().catch(() => null);
  const code = typeof json === 'object' && json !== null ? (json as { code?: unknown }).code : undefined;
  throw normalizeError({ extensions: { code } });
}
