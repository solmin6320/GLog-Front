import '@/shared/styles/global.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { isMockMode } from '@/shared/config/env';
import { App } from './App';
import { createAppRouter } from './router';

async function bootstrap() {
  // 목 모드: 첫 요청(세션 me)보다 MSW 워커가 먼저 떠 있어야 한다
  if (isMockMode) {
    const { startMockWorker } = await import('@/mocks/browser');
    await startMockWorker();
  }

  const container = document.getElementById('root');
  if (!container) throw new Error('#root 요소가 없어요.');

  createRoot(container).render(
    <StrictMode>
      <App router={createAppRouter()} />
    </StrictMode>,
  );
}

void bootstrap();
