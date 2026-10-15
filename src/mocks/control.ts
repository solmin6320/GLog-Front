/**
 * 목 제어판 (설계서 8-2 · 8-3). 값은 localStorage 'glog.mock'에 둔다 — DevToolbar와 핸들러가 같이 읽는다.
 * localStorage를 못 쓰는 환경(사생활 모드 · 순수 node)에서는 모듈 메모리에 둔다.
 */
import { env } from '@/shared/config/env';
import { PERSONA_MEMBER_IDS } from './db/seed';
import { resetDb } from './db/store';

export type PersonaKey = 'member' | 'plain' | 'noteam' | 'penalty' | 'pending' | 'rejected';

export const MOCK_PERSONAS: { key: PersonaKey; label: string; memberId: string }[] = [
  { key: 'member', label: '한동관 · 팀장 · 관리자', memberId: PERSONA_MEMBER_IDS.member },
  { key: 'plain', label: '김철수 · 팀원', memberId: PERSONA_MEMBER_IDS.plain },
  { key: 'noteam', label: '서연 · 팀 없음', memberId: PERSONA_MEMBER_IDS.noteam },
  { key: 'penalty', label: '박지훈 · 벌칙 대상', memberId: PERSONA_MEMBER_IDS.penalty },
  { key: 'pending', label: '정다은 · 승인 대기', memberId: PERSONA_MEMBER_IDS.pending },
  { key: 'rejected', label: '최민재 · 거절', memberId: PERSONA_MEMBER_IDS.rejected },
];

export function isPersonaKey(v: unknown): v is PersonaKey {
  return typeof v === 'string' && MOCK_PERSONAS.some((p) => p.key === v);
}

/** 'mock.<memberId>' — 서버가 발급하는 척만 하는 토큰 */
export function mockTokenFor(p: PersonaKey): string {
  const persona = MOCK_PERSONAS.find((x) => x.key === p) ?? MOCK_PERSONAS[0];
  return `mock.${persona?.memberId ?? '1'}`;
}

export type MockFailure = 'none' | 'network' | 'server' | 'slow';
export type MockGrass = 'auto' | 'ok' | 'failed' | 'identity';

export type MockControl = {
  failure: MockFailure;
  /** 다음 한 번만 이 operationName을 실패시킨다 (서버 오류) */
  failOnce: string | null;
  /** 목 기준 시각 ISO */
  now: string;
  /** 잔디 조회 상태 강제 — 조회자 본인에게만 적용 (auto = 시드 값) */
  grass: MockGrass;
  /** 응답 지연 ms */
  latency: number;
};

const STORAGE_KEY = 'glog.mock';
const FAILURES: MockFailure[] = ['none', 'network', 'server', 'slow'];
const GRASS: MockGrass[] = ['auto', 'ok', 'failed', 'identity'];

let memory: Partial<MockControl> = {};

function defaults(): MockControl {
  return { failure: 'none', failOnce: null, now: env.mockNow, grass: 'auto', latency: env.mockLatency };
}

function readStored(): Partial<MockControl> {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (raw == null) return globalThis.localStorage ? {} : memory;
    const v: unknown = JSON.parse(raw);
    return v && typeof v === 'object' ? (v as Partial<MockControl>) : {};
  } catch {
    return memory;
  }
}

function sanitize(p: Partial<MockControl>): MockControl {
  const d = defaults();
  return {
    failure: FAILURES.includes(p.failure as MockFailure) ? (p.failure as MockFailure) : d.failure,
    failOnce: typeof p.failOnce === 'string' && p.failOnce.trim() ? p.failOnce.trim() : null,
    now: typeof p.now === 'string' && !Number.isNaN(Date.parse(p.now)) ? p.now : d.now,
    grass: GRASS.includes(p.grass as MockGrass) ? (p.grass as MockGrass) : d.grass,
    latency: typeof p.latency === 'number' && Number.isFinite(p.latency) && p.latency >= 0 ? p.latency : d.latency,
  };
}

export function getMockControl(): MockControl {
  return sanitize(readStored());
}

export function setMockControl(p: Partial<MockControl>): void {
  const next = sanitize({ ...readStored(), ...p });
  memory = next;
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* 메모리에만 둔다 */
  }
}

/** 제어판을 기본값으로 (DevToolbar · 테스트) */
export function clearMockControl(): void {
  memory = {};
  try {
    globalThis.localStorage?.removeItem(STORAGE_KEY);
  } catch {
    /* 무시 */
  }
}

/** 목 DB를 시드로 되돌린다 (테스트 beforeEach · DevToolbar [데이터 초기화]) */
export function resetMockDb(): void {
  resetDb();
}
