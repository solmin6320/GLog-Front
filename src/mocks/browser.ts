/** 브라우저 목 워커 (app/main.tsx가 목 모드일 때만 동적 import) */
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

export async function startMockWorker(): Promise<void> {
  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: true,
    serviceWorker: { url: `${import.meta.env.BASE_URL ?? '/'}mockServiceWorker.js` },
  });
}
