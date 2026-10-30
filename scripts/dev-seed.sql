-- 로컬 브리지 모드용 시드. 회원 1명(관리자) + 팀 1개. 여러 번 돌려도 같은 결과.
INSERT INTO member (id, github_id, github_login, nickname, status, role, first_team_joined_at, created_at, approved_at)
VALUES (1, 100001, 'handonggwan', '한동관', 'ACTIVE', 'ADMIN', '2026-09-01 10:00:00', '2026-09-01 09:00:00', '2026-09-01 09:30:00')
ON DUPLICATE KEY UPDATE nickname = VALUES(nickname);
INSERT INTO team (id, name, description, leader_id, invite_code, is_public, created_at)
VALUES (1, '사이드 프로젝트 A팀', '매주 잔디를 같이 심어요', 1, 'GLOGDEV1', 1, '2026-09-01 10:00:00')
ON DUPLICATE KEY UPDATE name = VALUES(name);
INSERT INTO team_member (id, team_id, member_id, joined_at, joined_by)
VALUES (1, 1, 1, '2026-09-01 10:00:00', 'INVITE_CODE')
ON DUPLICATE KEY UPDATE joined_at = VALUES(joined_at);
