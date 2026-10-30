import { useEffect } from 'react';

export const APP_NAME = '잔디로그';

/** "{화면 이름} · 잔디로그". 이름이 없으면 서비스 이름만. */
export function formatDocumentTitle(title: string | null | undefined): string {
  const t = title?.trim();
  return t ? `${t} · ${APP_NAME}` : APP_NAME;
}

/** 화면마다 한 번 부른다. 데이터가 오기 전엔 null을 넘겨도 된다. */
export function useDocumentTitle(title: string | null | undefined): void {
  useEffect(() => {
    document.title = formatDocumentTitle(title);
  }, [title]);
}
