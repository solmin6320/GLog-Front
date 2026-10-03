import { useEffect, useState } from 'react';
import { useDocumentTitle } from '@/layouts/useDocumentTitle';
import { useSession } from '@/session';
import { isMockMode } from '@/shared/config/env';
import { Button, Select, WeekStrip, type StripDay } from '@/shared/ui';
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

type PersonaOption = { value: string; label: string };

/** 목 모드에서만 체험 계정 목록을 불러온다. 화면 코드는 목을 정적으로 import하지 않는다. */
function useMockPersonas(): PersonaOption[] | null {
  const [options, setOptions] = useState<PersonaOption[] | null>(null);
  useEffect(() => {
    if (!isMockMode) return;
    let alive = true;
    void import('@/mocks/control').then((m) => {
      if (alive) setOptions(m.MOCK_PERSONAS.map((p) => ({ value: p.key, label: p.label })));
    });
    return () => {
      alive = false;
    };
  }, []);
  return options;
}

/** AU-01 로그인 (화면설계서 5-1-1, 목업 W-01) */
export default function LoginPage() {
  useDocumentTitle('로그인');
  const session = useSession();
  const personas = useMockPersonas();
  const [persona, setPersona] = useState('member');
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
    window.location.assign(session.loginUrl(isMockMode ? persona : undefined));
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

        {personas && (
          <div className={s.persona}>
            <Select
              label="체험할 계정 (목 모드)"
              options={personas}
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              disabled={redirecting}
            />
          </div>
        )}

        <p className={s.hint}>첫 로그인 후에는 관리자 승인이 필요해요</p>

        <button type="button" className={s.rulesLink} onClick={() => setRulesOpen(true)}>
          잔디 인정 규칙 보기
        </button>
      </div>

      <GrassRulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </div>
  );
}
