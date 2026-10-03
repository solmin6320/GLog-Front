import { describe, expect, it } from 'vitest';
import { pickHomeBanner, type HomeBannerInput } from './banner';

const base: HomeBannerInput = { isPenaltyTarget: false, grassStatus: 'OK', skipReason: null, liveStatus: 'NOT_YET', privateContributionSuspected: false };

describe('pickHomeBanner (CM-01 ⑥, ACC-HOME-05)', () => {
  it('아무 조건도 없으면 배너 없음', () => {
    expect(pickHomeBanner(base)).toBeNull();
  });

  it('모두 참이면 E-39 하나만 · E-39를 끄면 E-32', () => {
    const all: HomeBannerInput = {
      ...base,
      privateContributionSuspected: true,
      grassStatus: 'FAILED',
      skipReason: 'FIRST_WEEK',
      liveStatus: 'EXCLUDED',
    };
    expect(pickHomeBanner(all)).toEqual({ key: 'privateContribution', tone: 'warn', text: 'GitHub에서 비공개 기여 표시를 켜야 잔디가 반영돼요.' });
    expect(pickHomeBanner({ ...all, privateContributionSuspected: false })).toEqual({
      key: 'grassFailed',
      tone: 'warn',
      text: '잔디를 아직 못 불러왔어요. 곧 다시 확인할게요.',
    });
  });

  it('E-08 아이디 변경은 E-32 자리', () => {
    expect(pickHomeBanner({ ...base, grassStatus: 'IDENTITY_MISMATCH', skipReason: 'FIRST_WEEK' })).toEqual({
      key: 'grassIdentity',
      tone: 'warn',
      text: 'GitHub 아이디가 바뀌었어요. 다시 로그인하면 잔디가 연결돼요.',
    });
  });

  it('E-36 첫 참가 주가 E-46 면제보다 먼저', () => {
    expect(pickHomeBanner({ ...base, skipReason: 'FIRST_WEEK', liveStatus: 'EXEMPT' })?.key).toBe('firstWeek');
    expect(pickHomeBanner({ ...base, skipReason: 'FIRST_WEEK' })?.text).toBe('이번 주는 첫 주라 인증하지 않아도 괜찮아요.');
  });

  it('E-46 면제 주간: 전체 · 개인 면제 모두', () => {
    for (const skipReason of ['EXEMPTION_PERIOD', 'PERSONAL_EXEMPTION']) {
      expect(pickHomeBanner({ ...base, skipReason, liveStatus: 'EXEMPT' })).toEqual({ key: 'exempt', tone: 'blue', text: '이번 주는 면제 주간이에요.' });
    }
    expect(pickHomeBanner({ ...base, liveStatus: 'EXEMPT' })?.key).toBe('exempt');
  });

  it('팀 없음(NO_TEAM) · 벌칙 대상은 배너가 아니다 (E-40은 ④ 카드 몫)', () => {
    expect(pickHomeBanner({ ...base, skipReason: 'NO_TEAM', liveStatus: 'EXCLUDED' })).toBeNull();
    expect(pickHomeBanner({ ...base, isPenaltyTarget: true })).toBeNull();
  });
});
