import { useEffect, useState } from 'react';
import { useDocumentTitle } from '@/layouts/useDocumentTitle';
import { useSession } from '@/session';
import { Button, WeekStrip, type StripDay } from '@/shared/ui';
import { GrassRulesModal } from '../components/GrassRulesModal';
import s from './LoginPage.module.css';

/** W-01 장식 스트립 — 실제 데이터가 아니다 (스크린리더에서 숨김). */
const DEMO_WEEK: StripDay[] = [
  { date: '2026-09-28', grassLevel: 2, hasRecord: false, verified: true, isToday: false, isFuture: false },
  { date: '2026-09-29', grassLevel: 0, hasRecord: true, verified: true, isToday: false, isFuture: false },
  { date: '2026-09-30', grassLevel: 3, hasRecord: false, verified: true, isToday: false, isFuture: false },
  { date: '2026-10-01', grassLevel: 1, hasRecord: false, verified: true, isToday: false, isFuture: false },
  { date: '2026-10-02', grassLevel: 0, hasRecord: false, verified: false, isToday: false, isFuture: false },
  { date: '2026-10-03', grassLevel: 4, hasRecord: true, verified: true, isToday: false, isFuture: false },
  { date: '2026-10-04', grassLevel: 0, hasRecord: false, verified: false, isToday: false, isFuture: false },
];

/** AU-01 로그인 (화면설계서 5-1-1, 목업 W-01) */
export default function LoginPage() {
  useDocumentTitle('로그인');
  const session = useSession();
  const [redirecting, setRedirecting] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);

  // 뒤로 가기로 이 화면이 캐시에서 되살아나면 ③을 기본 상태로 돌린다
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setRedirecting(false);
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  const login = () => {
    setRedirecting(true);
    window.location.assign(session.loginUrl());
  };

  return (
    <div className={s.page}>
      <div className={s.strip} aria-hidden="true">
        <WeekStrip days={DEMO_WEEK} size={32} showLabels />
      </div>

      <h1 className={s.title}>잔디로그</h1>
      <p className={s.sub}>꾸준함과 기록을 남기는 곳</p>

      <div className={s.cta}>
        <Button variant="dark" size="lg" icon="github" fullWidth disabled={redirecting} onClick={login}>
          {redirecting ? '이동 중...' : 'GitHub으로 로그인'}
        </Button>


        <p className={s.hint}>GitHub 계정으로 로그인하면 바로 시작할 수 있어요</p>

        <button type="button" className={s.rulesLink} onClick={() => setRulesOpen(true)}>
          잔디 인정 규칙 보기
        </button>
      </div>

      <GrassRulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </div>
  );
}
