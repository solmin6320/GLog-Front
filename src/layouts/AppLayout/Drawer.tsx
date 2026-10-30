import { useEffect, useRef, type KeyboardEvent } from 'react';
import { useQuery } from '@apollo/client/react';
import { Link, useLocation } from 'react-router';
import { useIsAdmin, useViewer } from '@/session';
import { Icon, IconButton, Logo } from '@/shared/ui';
import { AdminLayoutCountsQuery } from '../api';
import { DRAWER_GROUPS, drawerActive, leafLabel, type DrawerBadgeKey } from './drawerNav';
import s from './Drawer.module.css';

export const DRAWER_ID = 'app-drawer';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

type Props = { open: boolean; onClose: () => void };

/** 전체 메뉴 (W-03 + 관리자 그룹, M-09). 왼쪽 오버레이 · 모든 폭에서 같은 동작. */
export function Drawer({ open, onClose }: Props) {
  if (!open) return null;
  return <DrawerPanel onClose={onClose} />;
}

function DrawerPanel({ onClose }: { onClose: () => void }) {
  const viewer = useViewer();
  const isAdmin = useIsAdmin();
  const { pathname, search } = useLocation();
  const panelRef = useRef<HTMLDivElement>(null);

  const { data } = useQuery(AdminLayoutCountsQuery, { skip: !isAdmin });
  const summary = data?.adminDashboardSummary;
  const counts: Record<DrawerBadgeKey, number> = {
    invitations: viewer.pendingInvitationCount,
    penaltyTargets: summary?.penaltyTargetCount ?? 0,
    pendingMembers: summary?.pendingMemberCount ?? 0,
    pendingExemptions: summary?.pendingExemptionRequestCount ?? 0,
  };

  const active = drawerActive(pathname, search);
  const groups = DRAWER_GROUPS.filter((g) => !g.adminOnly || isAdmin);
  const activeGroup = groups.find((g) => g.key === active?.group);
  const here = activeGroup
    ? {
        group: activeGroup.label,
        // 글쓰기 · 글 수정 · 프로필 수정은 소메뉴 대신 화면 이름
        item: leafLabel(pathname) ?? activeGroup.items.find((i) => i.key === active?.item)?.label ?? null,
      }
    : null;

  // 열릴 때: 본문 스크롤 잠금 · 닫기 버튼에 포커스. 닫힐 때: 잠금 해제 · 열기 전 포커스(☰)로 복귀.
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.classList.add('scroll-locked');
    const panel = panelRef.current;
    (panel?.querySelector<HTMLElement>('[data-autofocus]') ?? panel?.querySelector<HTMLElement>(FOCUSABLE))?.focus();
    return () => {
      document.body.classList.remove('scroll-locked');
      previous?.focus();
    };
  }, []);

  // Esc로 닫기
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape' && !e.isComposing) {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // 포커스 트랩
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab' || !panelRef.current) return;
    const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    const first = items[0];
    const last = items[items.length - 1];
    if (!first || !last) return;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <>
      <div className={s.scrim} aria-hidden="true" onClick={onClose} />
      <div
        ref={panelRef}
        id={DRAWER_ID}
        className={s.panel}
        role="dialog"
        aria-modal="true"
        aria-label="전체 메뉴"
        onKeyDown={onKeyDown}
      >
        <div className={s.head}>
          <Link to="/" className={s.logoLink} onClick={onClose} aria-label="잔디로그 홈">
            <Logo />
          </Link>
          <IconButton label="메뉴 닫기" icon="x" onClick={onClose} data-autofocus="" />
        </div>

        <nav className={s.body} aria-label="전체 메뉴">
          {here ? (
            <p className={s.here} aria-hidden="true">
              <span className={s.hereLabel}>지금 위치</span>
              <span className={s.herePath}>
                {here.group}
                {here.item ? (
                  <>
                    <Icon name="chevR" size={14} />
                    <strong>{here.item}</strong>
                  </>
                ) : null}
              </span>
            </p>
          ) : null}
          <ul className={s.nav}>
            {groups.map((g) => {
              const groupOn = active?.group === g.key;
              const topClass = `${s.top} ${groupOn ? s.on : ''}`;
              return (
                <li key={g.key} className={`${s.group} ${groupOn ? s.groupOn : active ? s.groupOff : ''}`}>
                  {g.to ? (
                    <Link
                      to={g.to}
                      className={topClass}
                      onClick={onClose}
                      aria-current={groupOn && active?.item === null ? 'page' : undefined}
                    >
                      <Icon name={g.icon} size={20} />
                      <span>{g.label}</span>
                    </Link>
                  ) : (
                    <div className={topClass} id={`drawer-g-${g.key}`}>
                      <Icon name={g.icon} size={20} />
                      <span>{g.label}</span>
                    </div>
                  )}
                  {g.items.length > 0 && (
                    <ul className={s.sub} aria-labelledby={`drawer-g-${g.key}`}>
                      {g.items.map((item) => {
                        const on = groupOn && active?.item === item.key;
                        const count = item.badge ? counts[item.badge] : 0;
                        return (
                          <li key={item.key}>
                            <Link
                              to={item.to}
                              className={`${s.subLink} ${on ? s.subOn : ''}`}
                              onClick={onClose}
                              aria-current={on ? 'page' : undefined}
                              aria-label={count > 0 ? `${item.label} ${count}건` : undefined}
                            >
                              <span>{item.label}</span>
                              {count > 0 && (
                                <span className={s.cnt} aria-hidden="true">
                                  {count}
                                </span>
                              )}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

      </div>
    </>
  );
}
