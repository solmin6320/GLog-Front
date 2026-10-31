import { skipToken, useQuery } from '@apollo/client/react';
import { Link, useLocation } from 'react-router';
import { TeamScopeQuery } from '@/guards/api';
import { isBigintId } from '@/shared/lib/ids';
import { paths } from '@/shared/lib/paths';
import { Icon } from '@/shared/ui';
import { DRAWER_GROUPS, drawerActive } from './drawerNav';
import { useLeafLabel } from './useLeafLabel';
import s from './Breadcrumb.module.css';

/**
 * 현재 위치 표시 줄: 홈 › 팀 › 내 팀 목록. 드로어의 계층 구조(대메뉴 › 소메뉴)와 같은 이름을 쓴다.
 * 홈에서는 그리지 않는다. 소메뉴를 모르는 화면(글 상세 · 타인 프로필)은 대메뉴까지만 보인다.
 */
/** 팀 목록 쪽 고정 경로 (팀 id가 아님) */
const TEAM_STATIC = new Set(['new', 'join', 'invitations']);

/** 팀 하위 화면 이름 (현황판은 팀 이름만) */
const TEAM_SUB: Record<string, string> = { manage: '팀원 관리', exemption: '개인 면제 요청' };

export function Breadcrumb() {
  const { pathname, search } = useLocation();
  const active = drawerActive(pathname, search);
  // /teams/:id/** 는 "팀 › {팀 이름} › {하위 화면}". 팀 이름은 TeamScope가 이미 받아 둔 캐시에서만 읽는다
  const teamMatch = /^\/teams\/([^/]+)(?:\/([^/]+))?\/?$/.exec(pathname);
  const teamId = teamMatch && isBigintId(teamMatch[1]) ? teamMatch[1] : null;
  const scope = useQuery(TeamScopeQuery, teamId ? { variables: { id: teamId }, fetchPolicy: 'cache-only' } : skipToken);
  // 소메뉴 아래 화면(글쓰기 · 글 수정 · 프로필 수정 · 공지 상세)은 마지막 칸에 화면 이름을 덧붙인다
  const leaf = useLeafLabel(pathname);
  if (!active || active.group === 'home') return null;
  const group = DRAWER_GROUPS.find((g) => g.key === active.group);
  if (!group) return null;
  const item = group.items.find((i) => i.key === active.item);
  if (teamId || (teamMatch && !TEAM_STATIC.has(teamMatch[1] ?? ''))) {
    const team = scope.data?.team;
    const sub = teamMatch?.[2] ? TEAM_SUB[teamMatch[2]] : undefined;
    return (
      <nav className={s.bar} aria-label="현재 위치">
        <ol className={s.list}>
          <li>
            <Link to="/" className={s.link}>
              <Icon name="home" size={14} />
              홈
            </Link>
          </li>
          <li className={s.sep} aria-hidden="true">
            <Icon name="chevR" size={14} />
          </li>
          <li>
            <Link to={paths.teams()} className={s.link}>
              {group.label}
            </Link>
          </li>
          {team ? (
            <>
              <li className={s.sep} aria-hidden="true">
                <Icon name="chevR" size={14} />
              </li>
              <li>
                {sub ? (
                  <Link to={paths.team(team.id)} className={s.link}>
                    {team.name}
                  </Link>
                ) : (
                  <span className={s.here} aria-current="page">
                    {team.name}
                  </span>
                )}
              </li>
              {sub ? (
                <>
                  <li className={s.sep} aria-hidden="true">
                    <Icon name="chevR" size={14} />
                  </li>
                  <li>
                    <span className={s.here} aria-current="page">
                      {sub}
                    </span>
                  </li>
                </>
              ) : null}
            </>
          ) : null}
        </ol>
      </nav>
    );
  }
  const first = group.items[0];
  const groupTo = group.to ?? first?.to;
  return (
    <nav className={s.bar} aria-label="현재 위치">
      <ol className={s.list}>
        <li>
          <Link to="/" className={s.link}>
            <Icon name="home" size={14} />
            홈
          </Link>
        </li>
        <li className={s.sep} aria-hidden="true">
          <Icon name="chevR" size={14} />
        </li>
        <li>
          {item && groupTo ? (
            <Link to={groupTo} className={s.link}>
              {group.label}
            </Link>
          ) : (
            <span className={s.here} aria-current="page">
              {group.label}
            </span>
          )}
        </li>
        {item ? (
          <>
            <li className={s.sep} aria-hidden="true">
              <Icon name="chevR" size={14} />
            </li>
            <li>
              {/* 아래 화면이 있으면 소메뉴는 링크 — "지금 있는 곳"(굵게)은 마지막 칸 하나뿐 */}
              {leaf === null ? (
                <span className={s.here} aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link to={item.to} className={s.link}>
                  {item.label}
                </Link>
              )}
            </li>
          </>
        ) : null}
        {leaf ? (
          <>
            <li className={s.sep} aria-hidden="true">
              <Icon name="chevR" size={14} />
            </li>
            <li>
              <span className={s.here} aria-current="page">
                {leaf}
              </span>
            </li>
          </>
        ) : null}
      </ol>
    </nav>
  );
}
