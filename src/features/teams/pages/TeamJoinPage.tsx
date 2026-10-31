import { useRef, useState, type FormEvent } from 'react';
import { useMutation } from '@apollo/client/react';
import { useNavigate } from 'react-router';
import { messageFor } from '@/domain/messages';
import { useDocumentTitle } from '@/layouts/useDocumentTitle';
import { useAction } from '@/shared/api';
import { paths } from '@/shared/lib/paths';
import { LIMITS, normalizeInviteCode, validateInviteCode } from '@/shared/lib/validators';
import { Button, Card, LinkButton, PageContainer, PageTitle, TextField, TextLink } from '@/shared/ui';
import { REFRESH_SESSION, TeamJoinMutation } from '../api';
import { TEAM_COPY } from '../lib';
import s from './TeamPages.module.css';

/** ③ 인라인으로 보여 줄 서버 오류 (E-10 · E-11 · E-12) */
const INLINE_CODES = new Set(['INVITE_CODE_NOT_FOUND', 'ALREADY_TEAM_MEMBER', 'TEAM_JOIN_BLOCKED', 'VALIDATION_FAILED']);

type InlineError = { text: string; alreadyMember: boolean };

/** TM-03 팀 참가 (화면설계서 5-1-14) */
export default function TeamJoinPage() {
  useDocumentTitle('팀 참가');
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState<InlineError | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [joinTeam] = useMutation(TeamJoinMutation);
  const join = useAction(
    (c: string) => joinTeam({ variables: { code: c }, refetchQueries: [REFRESH_SESSION], awaitRefetchQueries: true }),
    {
      success: TEAM_COPY.joined,
      onError: (e) => {
        if (!INLINE_CODES.has(e.code)) return false;
        // E-12는 차단 사유 · 남은 기간을 말하지 않는다 (문구 고정)
        setError({ text: messageFor(e), alreadyMember: e.code === 'ALREADY_TEAM_MEMBER' });
        inputRef.current?.focus();
        return true;
      },
    },
  );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (join.pending) return;
    const invalid = validateInviteCode(code);
    if (invalid) {
      setError({ text: invalid, alreadyMember: false });
      inputRef.current?.focus();
      return;
    }
    const res = await join.run(normalizeInviteCode(code));
    const team = res?.data?.joinTeamByInviteCode;
    if (team) navigate(paths.team(team.id));
  };

  return (
    <PageContainer width="md">
      <PageTitle title="팀 참가" sub="팀장에게 받은 초대코드로 참가해요." />
      <Card>
        <form onSubmit={(e) => void submit(e)} noValidate>
          <TextField
            ref={inputRef}
            label="초대코드"
            placeholder="초대코드를 입력하세요"
            value={code}
            maxLength={LIMITS.inviteCodeMax}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            error={error?.text}
            onChange={(e) => {
              setCode(e.target.value);
              if (error) setError(null);
            }}
          />
          {/* E-11: 이미 속한 팀 — 오류에 팀 id가 없어 내 팀 목록으로 보낸다 */}
          {error?.alreadyMember ? (
            <div className={s.inlineAction}>
              <LinkButton to={paths.teams()} variant="outline" size="sm">
                팀 보러 가기
              </LinkButton>
            </div>
          ) : null}
          <div className={s.formActions}>
            <LinkButton to={paths.teams()} variant="outline">
              취소
            </LinkButton>
            <Button type="submit" loading={join.pending}>
              {join.pending ? '확인 중...' : '팀 참가'}
            </Button>
          </div>
        </form>
      </Card>
      {/* ④ 받은 초대 안내 */}
      <p className={s.aside}>
        초대코드 대신 아이디로 초대받았다면 <TextLink to={paths.invitations()}>받은 초대 보기</TextLink>
      </p>
    </PageContainer>
  );
}
