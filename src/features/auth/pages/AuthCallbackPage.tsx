import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router';
import { messageFor } from '@/domain/messages';
import { useDocumentTitle } from '@/layouts/useDocumentTitle';
import { useSession } from '@/session';
import { normalizeError } from '@/shared/api/errors';
import { paths } from '@/shared/lib/paths';
import { LinkButton, Spinner } from '@/shared/ui';
import s from './AuthPages.module.css';

const FAILED = '로그인에 실패했어요. 다시 시도해 주세요.';
const CANCELLED = '로그인이 취소됐어요.';

/** 코드 교환 실패 문구: 재사용 · 만료(E-05 · E-06) · 네트워크(E-51)는 표준 문구, 그 밖은 AU-02 ② */
function failureMessage(err: unknown): string {
  const e = normalizeError(err);
  if (e.code === 'LOGIN_CODE_INVALID' || e.category === 'network') return messageFor(e);
  return FAILED;
}

/**
 * AU-02 로그인 처리중 (화면설계서 5-1-11). 이 화면만 스피너를 쓴다(E-54 예외).
 * 일회용 code → completeLogin(같은 code는 세션이 1회만 교환 — StrictMode 이중 실행 대비)
 * → ACTIVE `/` · PENDING/REJECTED `/pending` (replace — 주소에서 code를 지운다). 목적지는 항상 `/` (요구사항 4-3).
 */
export default function AuthCallbackPage() {
  useDocumentTitle('로그인 처리 중');
  const [sp] = useSearchParams();
  const code = sp.get('code');
  const oauthError = sp.get('error');
  const { status, completeLogin } = useSession();
  const navigate = useNavigate();
  const [exchangeError, setExchangeError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    completeLogin(code).then(
      (next) => {
        if (cancelled) return;
        if (next === 'ACTIVE') navigate(paths.home(), { replace: true });
        else if (next === 'PENDING' || next === 'REJECTED') navigate(paths.pending(), { replace: true });
        else setExchangeError(FAILED);
      },
      (err: unknown) => {
        if (!cancelled) setExchangeError(failureMessage(err));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [code, completeLogin, navigate]);

  // 이미 로그인한 상태로 code 없이 들어오면 홈으로
  if (!code && status === 'ACTIVE') return <Navigate to={paths.home()} replace />;

  // code가 없으면 교환하지 않는다. OAuth 화면에서 취소하고 돌아온 경우(E-04)는 취소 문구
  const failure = code ? exchangeError : oauthError === 'access_denied' ? CANCELLED : FAILED;

  if (failure) {
    return (
      <div className={s.center} role="alert">
        <p className={s.message}>{failure}</p>
        <div className={s.actions}>
          <LinkButton to={paths.login()} variant="primary" size="lg">
            로그인으로
          </LinkButton>
        </div>
      </div>
    );
  }

  return (
    <div className={s.center}>
      <Spinner label="로그인하는 중이에요" />
    </div>
  );
}
