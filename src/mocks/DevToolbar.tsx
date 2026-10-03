/**
 * 목 모드 전용 떠 있는 패널 (설계서 8-3). app/main.tsx가 목 모드일 때만 lazy import한다.
 * 왼쪽 아래 알약 → 펼치면 페르소나 · 장애 · 시각 · 잔디 · 데이터 초기화.
 * 시각 · 잔디 · 페르소나 · 데이터를 바꾸면 화면이 새 값으로 다시 불러오도록 페이지를 새로고침한다.
 */
import { useState, type CSSProperties, type ReactNode } from 'react';
import { clockPresets } from './clock';
import {
  clearMockControl,
  getMockControl,
  MOCK_PERSONAS,
  mockTokenFor,
  resetMockDb,
  setMockControl,
  type MockControl,
  type MockFailure,
  type MockGrass,
  type PersonaKey,
} from './control';

const TOKEN_KEY = 'glog.token';

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* 무시 */
  }
}

const reload = () => window.location.reload();

const FAILURE_OPTIONS: { value: MockFailure; label: string }[] = [
  { value: 'none', label: '정상' },
  { value: 'slow', label: '느림 (3초)' },
  { value: 'server', label: '서버 오류' },
  { value: 'network', label: '네트워크 끊김' },
];

const GRASS_OPTIONS: { value: MockGrass; label: string }[] = [
  { value: 'auto', label: '시드 그대로' },
  { value: 'ok', label: '정상 (OK)' },
  { value: 'failed', label: '못 불러옴 (E-32)' },
  { value: 'identity', label: '아이디 바뀜 (E-08)' },
];

/* ---------------- 스타일 (토큰 변수 + 대체값) ---------------- */

const S: Record<string, CSSProperties> = {
  root: { position: 'fixed', right: 12, bottom: 12, zIndex: 2147483000, fontFamily: 'var(--sans, system-ui, sans-serif)', fontSize: 12 },
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    height: 28,
    padding: '0 12px',
    borderRadius: 14,
    border: 'none',
    background: 'var(--dark, #1b1f23)',
    color: 'var(--surface, #fff)',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,.18)',
  },
  dot: { width: 8, height: 8, borderRadius: 4, background: 'var(--h2, #7fc49b)' },
  panel: {
    width: 288,
    maxHeight: 'calc(100vh - 72px)',
    overflowY: 'auto',
    marginBottom: 8,
    padding: 14,
    borderRadius: 12,
    background: 'var(--surface, #fff)',
    color: 'var(--ink, #17201b)',
    border: '1px solid var(--line, #dce2de)',
    boxShadow: '0 8px 28px rgba(0,0,0,.18)',
  },
  head: { display: 'flex', alignItems: 'center', marginBottom: 10, fontSize: 13, fontWeight: 800 },
  label: { display: 'block', margin: '10px 0 4px', fontWeight: 700, color: 'var(--ink-2, #3f4a44)' },
  control: {
    width: '100%',
    height: 30,
    padding: '0 8px',
    border: '1px solid var(--line-input, #87928b)',
    borderRadius: 6,
    background: 'var(--surface, #fff)',
    color: 'var(--ink, #17201b)',
    fontSize: 12,
    boxSizing: 'border-box',
  },
  row: { display: 'flex', gap: 6 },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  btn: {
    height: 28,
    padding: '0 10px',
    border: '1px solid var(--line-input, #87928b)',
    borderRadius: 6,
    background: 'var(--surface, #fff)',
    color: 'var(--ink, #17201b)',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  on: { background: 'var(--dark, #1b1f23)', color: 'var(--surface, #fff)', borderColor: 'var(--dark, #1b1f23)' },
  danger: { color: 'var(--red, #b42318)', borderColor: 'var(--red-line, #f2c6c1)' },
  hint: { marginTop: 4, color: 'var(--ink-3, #66716b)', lineHeight: 1.5 },
  close: { marginLeft: 'auto', border: 'none', background: 'transparent', fontSize: 16, lineHeight: 1, cursor: 'pointer', color: 'var(--ink-2, #3f4a44)' },
};

function Field({ id, label, children, hint }: { id: string; label: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} style={S.label}>
        {label}
      </label>
      {children}
      {hint ? <p style={S.hint}>{hint}</p> : null}
    </div>
  );
}

export default function DevToolbar() {
  const [open, setOpen] = useState(false);
  const [control, setControl] = useState<MockControl>(() => getMockControl());
  const [failOnce, setFailOnce] = useState(control.failOnce ?? '');

  const token = readToken();
  const persona = MOCK_PERSONAS.find((p) => mockTokenFor(p.key) === token);
  const presets = clockPresets();

  const update = (p: Partial<MockControl>, thenReload = false) => {
    setMockControl(p);
    setControl(getMockControl());
    if (thenReload) reload();
  };

  const switchPersona = (key: PersonaKey | '') => {
    writeToken(key ? mockTokenFor(key) : null);
    reload();
  };

  return (
    <div style={S.root} data-mock-toolbar="">
      {open ? (
        <section style={S.panel} aria-label="목 모드 설정">
          <div style={S.head}>
            목 모드
            <button type="button" style={S.close} onClick={() => setOpen(false)} aria-label="목 모드 설정 닫기">
              ×
            </button>
          </div>

          <Field id="mock-persona" label="로그인 사람">
            <select id="mock-persona" style={S.control} value={persona?.key ?? ''} onChange={(e) => switchPersona(e.target.value as PersonaKey | '')}>
              <option value="">로그아웃 상태</option>
              {MOCK_PERSONAS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </Field>

          <Field id="mock-failure" label="응답">
            <select id="mock-failure" style={S.control} value={control.failure} onChange={(e) => update({ failure: e.target.value as MockFailure })}>
              {FAILURE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>

          <Field id="mock-fail-once" label="한 번만 실패시킬 연산" hint={control.failOnce ? `대기 중: ${control.failOnce}` : '예: TeamBoardQuery'}>
            <div style={S.row}>
              <input
                id="mock-fail-once"
                style={S.control}
                value={failOnce}
                placeholder="연산 이름"
                onChange={(e) => setFailOnce(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') update({ failOnce: failOnce.trim() || null });
                }}
              />
              <button type="button" style={S.btn} onClick={() => update({ failOnce: failOnce.trim() || null })}>
                적용
              </button>
            </div>
          </Field>

          <div>
            <span style={S.label}>기준 시각</span>
            <div style={S.chips} role="group" aria-label="기준 시각">
              {presets.map((p) => {
                const active = Date.parse(p.now) === Date.parse(control.now);
                return (
                  <button
                    key={p.key}
                    type="button"
                    aria-pressed={active}
                    style={{ ...S.btn, ...(active ? S.on : null) }}
                    onClick={() => update({ now: p.now }, true)}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
            <p style={S.hint}>지금: {control.now}</p>
          </div>

          <Field id="mock-grass" label="내 잔디 조회 상태">
            <select id="mock-grass" style={S.control} value={control.grass} onChange={(e) => update({ grass: e.target.value as MockGrass }, true)}>
              {GRASS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>

          <div style={{ ...S.row, marginTop: 14 }}>
            <button
              type="button"
              style={{ ...S.btn, ...S.danger }}
              onClick={() => {
                resetMockDb();
                reload();
              }}
            >
              데이터 초기화
            </button>
            <button
              type="button"
              style={S.btn}
              onClick={() => {
                clearMockControl();
                reload();
              }}
            >
              설정 초기화
            </button>
          </div>
        </section>
      ) : null}
      <button type="button" style={S.pill} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span style={S.dot} aria-hidden="true" />
        목 모드{persona ? ` · ${persona.label.split(' · ')[0] ?? ''}` : ''}
      </button>
    </div>
  );
}
