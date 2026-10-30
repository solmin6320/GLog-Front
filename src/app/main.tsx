import '@/shared/styles/global.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { setTransport } from '@/shared/api/client';
import { isBridgeMode } from '@/shared/config/env';
import { App } from './App';
import { printConsoleWarning } from './consoleWarning';
import { createAppRouter } from './router';

async function bootstrap() {
  // 배포본에서만: 콘솔에 코드 붙여 넣기 사기(셀프 XSS) 경고
  if (import.meta.env.PROD) printConsoleWarning();

  // bridge 모드: 연결된 연산은 백엔드로, 나머지는 NOT_AVAILABLE (서비스 워커 없음)
  if (isBridgeMode) {
    const { bridgeFetch } = await import('@/mocks/bridge/transport');
    setTransport(bridgeFetch);
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
