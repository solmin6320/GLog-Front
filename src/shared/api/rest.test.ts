import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { uploadProfileImage } from './rest';
import { sessionEvents } from './sessionEvents';
import { tokenStore } from './tokenStore';

const file = () => new File([new Uint8Array([1, 2, 3])], 'me.png', { type: 'image/png' });

describe('uploadProfileImage (REST 1개)', () => {
  const fetchMock = vi.fn<typeof fetch>();
  const expired = vi.fn();
  let off: () => void = () => {};

  beforeEach(() => {
    fetchMock.mockReset();
    expired.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    off = sessionEvents.on('expired', expired);
    tokenStore.set('t1');
  });
  afterEach(() => {
    off();
    vi.unstubAllGlobals();
    tokenStore.clear();
  });

  it('multipart로 보내고 Bearer를 붙인다 · Content-Type은 넣지 않는다', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ profileImageUrl: 'https://cdn/p.webp' }), { status: 200 }));
    await expect(uploadProfileImage(file())).resolves.toEqual({ profileImageUrl: 'https://cdn/p.webp' });
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toMatch(/\/api\/members\/me\/profile-image$/);
    expect(init?.method).toBe('POST');
    expect(init?.body).toBeInstanceOf(FormData);
    expect((init?.body as FormData).get('file')).toBeInstanceOf(File);
    expect(init?.headers).toEqual({ Authorization: 'Bearer t1' });
  });

  it.each([
    [401, { code: 'UNAUTHENTICATED', category: 'auth' }],
    [413, { code: 'VALIDATION_FAILED', category: 'validation', field: 'file.size' }],
    [415, { code: 'VALIDATION_FAILED', category: 'validation', field: 'file.type' }],
    [502, { code: 'INTERNAL', category: 'server' }],
  ])('HTTP %i → AppError', async (status, expected) => {
    fetchMock.mockResolvedValue(new Response('<html>nginx</html>', { status }));
    await expect(uploadProfileImage(file())).rejects.toEqual(expected);
    expect(expired).toHaveBeenCalledTimes(status === 401 ? 1 : 0);
  });

  it('연결 실패 → NETWORK', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(uploadProfileImage(file())).rejects.toEqual({ code: 'NETWORK', category: 'network' });
  });

  it('200인데 주소가 없으면 INTERNAL', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 200 }));
    await expect(uploadProfileImage(file())).rejects.toEqual({ code: 'INTERNAL', category: 'server' });
  });
});
