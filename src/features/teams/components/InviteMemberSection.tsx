import { useRef, useState, type FormEvent } from 'react';
import { useMutation } from '@apollo/client/react';
import type { TeamManageQueryQuery } from '@/gql/graphql';
import { messageFor } from '@/domain/messages';
import { useAction } from '@/shared/api';
import { normalizeGithubLogin, VALIDATION_MSG, validateGithubLogin } from '@/shared/lib/validators';
import { Button, RowItem, RowList, SectionHeader, TextField } from '@/shared/ui';
import { TeamCancelInvitationMutation, TeamInviteMemberMutation } from '../api';
import { TEAM_COPY } from '../lib';
import m from './Manage.module.css';

type PendingInvitation = NonNullable<TeamManageQueryQuery['team']>['pendingInvitations'][number];

/** 아이디 초대에서 인라인으로 보여 줄 서버 오류 (E-15 · E-16) */
const INLINE_CODES = new Set(['INVITEE_NOT_FOUND', 'ALREADY_TEAM_MEMBER', 'INVITATION_DUPLICATE', 'VALIDATION_FAILED']);

/** TM-06 ② 아이디로 초대 + ③ 보낸 초대 목록 */
export function InviteMemberSection({ teamId, pending }: { teamId: string; pending: PendingInvitation[] }) {
  const [login, setLogin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [inviteMember] = useMutation(TeamInviteMemberMutation);
  const [cancelInvitation] = useMutation(TeamCancelInvitationMutation);

  const invite = useAction(
    (githubLogin: string) =>
      inviteMember({ variables: { teamId, githubLogin }, refetchQueries: ['TeamManageQuery'], awaitRefetchQueries: true }),
    {
      success: TEAM_COPY.invited,
      onError: (e) => {
        if (!INLINE_CODES.has(e.code)) return false;
        setError(
          e.code === 'VALIDATION_FAILED' ? VALIDATION_MSG.githubLogin : messageFor(e, { ALREADY_TEAM_MEMBER: TEAM_COPY.alreadyInTeam }),
        );
        inputRef.current?.focus();
        return true;
      },
    },
  );
  const cancel = useAction(
    (invitationId: string) =>
      cancelInvitation({ variables: { invitationId }, refetchQueries: ['TeamManageQuery'], awaitRefetchQueries: true }),
    { success: TEAM_COPY.inviteCanceled },
  );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (invite.pending) return;
    const invalid = validateGithubLogin(login);
    if (invalid) {
      setError(invalid);
      inputRef.current?.focus();
      return;
    }
    const res = await invite.run(normalizeGithubLogin(login));
    if (res !== undefined) setLogin('');
  };

  return (
    <section className={m.section} aria-labelledby="manage-invite-heading">
      <SectionHeader id="manage-invite-heading" title="아이디로 초대" />
      <form className={m.inviteForm} onSubmit={(e) => void submit(e)} noValidate>
        <TextField
          ref={inputRef}
          className={m.inviteField}
          label=""
          aria-label="GitHub 아이디"
          placeholder="GitHub 아이디"
          icon="search"
          value={login}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          hint="가입한 회원만 초대할 수 있어요."
          error={error}
          onChange={(e) => {
            setLogin(e.target.value);
            if (error) setError(null);
          }}
        />
        <div className={m.inviteButton}>
          <Button type="submit" loading={invite.pending}>
            초대
          </Button>
        </div>
      </form>

      {pending.length > 0 ? (
        <RowList ariaLabel="보낸 초대">
          {pending.map((inv) => (
            <RowItem
              key={inv.id}
              right={
                <Button
                  variant="text"
                  size="sm"
                  disabled={cancel.pending}
                  aria-label={`취소: @${inv.invitee.githubLogin} 초대`}
                  onClick={() => void cancel.run(inv.id)}
                >
                  취소
                </Button>
              }
            >
              <b className={m.login}>@{inv.invitee.githubLogin}</b>
              <span className={m.mutedXs}>대기 중</span>
            </RowItem>
          ))}
        </RowList>
      ) : null}
    </section>
  );
}
