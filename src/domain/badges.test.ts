import { type BadgeArgs, type BadgeSpec, toBadge } from './badges';

const cases: [string, BadgeArgs, BadgeSpec | null][] = [
  // judgment
  ['PASS', { kind: 'judgment', status: 'PASS', context: 'member' }, { tone: 'ok', icon: 'check', label: '통과' }],
  ['FAIL member', { kind: 'judgment', status: 'FAIL', context: 'member' }, { tone: 'bad', icon: 'x', label: '미달' }],
  ['FAIL admin', { kind: 'judgment', status: 'FAIL', context: 'admin' }, { tone: 'bad', icon: 'x', label: '미달' }],
  ['FAIL profile', { kind: 'judgment', status: 'FAIL', context: 'profile' }, { tone: 'bad', icon: 'x', label: '미달 (경고)' }],
  ['EXEMPT', { kind: 'judgment', status: 'EXEMPT', context: 'member' }, { tone: 'info', icon: 'half', label: '면제' }],
  ['EXCLUDED FIRST_WEEK', { kind: 'judgment', status: 'EXCLUDED', skipReason: 'FIRST_WEEK', context: 'member' }, { tone: 'mute', icon: 'minus', label: '첫 참가' }],
  ['EXCLUDED NO_TEAM', { kind: 'judgment', status: 'EXCLUDED', skipReason: 'NO_TEAM', context: 'profile' }, { tone: 'mute', icon: 'minus', label: '팀 없음' }],
  ['EXCLUDED other', { kind: 'judgment', status: 'EXCLUDED', skipReason: null, context: 'admin' }, { tone: 'mute', icon: 'minus', label: '제외' }],
  ['HOLD admin', { kind: 'judgment', status: 'HOLD', context: 'admin' }, { tone: 'warn', icon: 'clock', label: '보류' }],
  ['HOLD member', { kind: 'judgment', status: 'HOLD', context: 'member' }, { tone: 'mute', icon: 'clock', label: '확인 중' }],
  ['HOLD profile', { kind: 'judgment', status: 'HOLD', context: 'profile' }, { tone: 'mute', icon: 'clock', label: '확인 중' }],
  ['judgment label override', { kind: 'judgment', status: 'PASS', context: 'member', label: '1일' }, { tone: 'ok', icon: 'check', label: '1일' }],
  ['judgment unknown', { kind: 'judgment', status: 'WHAT', context: 'member' }, null],
  // live
  ['live CONDITION_MET', { kind: 'live', status: 'CONDITION_MET' }, { tone: 'ok', icon: 'check', label: '통과' }],
  ['live NOT_YET', { kind: 'live', status: 'NOT_YET' }, { tone: 'mute', icon: 'ring', label: '아직' }],
  ['live EXEMPT', { kind: 'live', status: 'EXEMPT' }, { tone: 'info', icon: 'half', label: '면제' }],
  ['live EXCLUDED FIRST_WEEK', { kind: 'live', status: 'EXCLUDED', skipReason: 'FIRST_WEEK' }, { tone: 'mute', icon: 'minus', label: '첫 참가' }],
  ['live EXCLUDED NO_TEAM', { kind: 'live', status: 'EXCLUDED', skipReason: 'NO_TEAM' }, { tone: 'mute', icon: 'minus', label: '팀 없음' }],
  ['live unknown', { kind: 'live', status: 'PASS' }, null],
  // others
  ['progress', { kind: 'progress' }, { tone: 'mute', icon: 'clock', label: '진행 중' }],
  ['warning ACTIVE', { kind: 'warning', standing: 'ACTIVE' }, { tone: 'warn', icon: 'alert', label: '유효' }],
  ['warning DEDUCTED', { kind: 'warning', standing: 'DEDUCTED' }, { tone: 'ok', icon: 'check', label: '차감됨' }],
  ['warning FULFILLED', { kind: 'warning', standing: 'FULFILLED' }, { tone: 'mute', icon: 'check', label: '이행 완료' }],
  ['warning unknown', { kind: 'warning', standing: 'X' }, null],
  ['penalty', { kind: 'penalty' }, { tone: 'solid', icon: 'alert', label: '벌칙 대상' }],
  ['member PENDING', { kind: 'memberStatus', status: 'PENDING' }, { tone: 'warn', icon: 'clock', label: '승인 대기' }],
  ['member ACTIVE', { kind: 'memberStatus', status: 'ACTIVE' }, { tone: 'ok', icon: 'check', label: '승인됨' }],
  ['member REJECTED', { kind: 'memberStatus', status: 'REJECTED' }, { tone: 'bad', icon: 'x', label: '거절됨' }],
  ['member unknown', { kind: 'memberStatus', status: 'BANNED' }, null],
  ['exemption PENDING', { kind: 'exemptionRequest', status: 'PENDING' }, { tone: 'mute', icon: 'clock', label: '대기' }],
  ['exemption APPROVED', { kind: 'exemptionRequest', status: 'APPROVED' }, { tone: 'ok', icon: 'check', label: '승인' }],
  ['exemption REJECTED', { kind: 'exemptionRequest', status: 'REJECTED' }, { tone: 'bad', icon: 'x', label: '반려' }],
  ['exemption unknown', { kind: 'exemptionRequest', status: '?' }, null],
  ['LEADER', { kind: 'teamRole', role: 'LEADER' }, { tone: 'dark', icon: null, label: '팀장' }],
  ['MEMBER', { kind: 'teamRole', role: 'MEMBER' }, null],
  ['public', { kind: 'visibility', isPublic: true }, { tone: 'line', icon: null, label: '공개' }],
  ['private', { kind: 'visibility', isPublic: false }, { tone: 'line', icon: 'lock', label: '비공개' }],
  ['record count', { kind: 'record', count: 2 }, { tone: 'mute', icon: 'file', label: '기록글 2개' }],
  ['record no count', { kind: 'record' }, { tone: 'mute', icon: 'file', label: '기록글' }],
  ['notRecord', { kind: 'notRecord' }, { tone: 'mute', icon: null, label: '인증 미포함' }],
  ['corrected', { kind: 'corrected' }, { tone: 'info', icon: 'shield', label: '정정됨' }],
];

describe('toBadge', () => {
  it.each(cases)('%s', (_name, args, expected) => {
    expect(toBadge(args)).toEqual(expected);
  });

  it('모르는 kind → null', () => {
    expect(toBadge({ kind: 'nope' } as unknown as BadgeArgs)).toBeNull();
  });
});
