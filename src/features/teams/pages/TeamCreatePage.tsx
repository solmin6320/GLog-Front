import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useMutation } from '@apollo/client/react';
import type { CreateTeamInput } from '@/gql/graphql';
import { useDocumentTitle } from '@/layouts/useDocumentTitle';
import { useAction } from '@/shared/api';
import { paths } from '@/shared/lib/paths';
import { LIMITS, validateOptionalText, validateTeamName } from '@/shared/lib/validators';
import { Button, Card, LinkButton, PageContainer, PageTitle, RadioCard, SectionHeader, TextArea, TextField } from '@/shared/ui';
import { REFRESH_SESSION, TeamCreateMutation } from '../api';
import { InviteCodeBox } from '../components/InviteCodeBox';
import s from './TeamPages.module.css';

type Created = { teamId: string; name: string; inviteCode: string };

const validateDescription = validateOptionalText('팀 설명', LIMITS.teamDescription);

/** ①~④ 입력 */
function CreateForm({ onCreated }: { onCreated: (c: Created) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [nameError, setNameError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const [createTeam] = useMutation(TeamCreateMutation);
  const create = useAction(
    (input: CreateTeamInput) =>
      // 팀이 생기면 세션의 hasTeam이 바뀐다 (CM-01 분기)
      createTeam({ variables: { input }, refetchQueries: [REFRESH_SESSION], awaitRefetchQueries: true }),
    {
      onError: (e) => {
        if (e.code !== 'VALIDATION_FAILED') return false;
        if (e.field === 'description') setDescriptionError(validateDescription(description) ?? '팀 설명을 다시 확인해 주세요.');
        else setNameError(validateTeamName(name) ?? '팀 이름을 다시 확인해 주세요.');
        return true;
      },
    },
  );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (create.pending) return;
    const nErr = validateTeamName(name);
    const dErr = validateDescription(description);
    setNameError(nErr);
    setDescriptionError(dErr);
    if (nErr) {
      nameRef.current?.focus();
      return;
    }
    if (dErr) return;
    const res = await create.run({ name: name.trim(), description: description.trim() || null, isPublic });
    const payload = res?.data?.createTeam;
    if (payload) onCreated({ teamId: payload.team.id, name: payload.team.name, inviteCode: payload.inviteCode });
  };

  return (
    <>
      <PageTitle title="팀 만들기" />
      <Card>
        <form onSubmit={(e) => void submit(e)} noValidate>
          <TextField
            ref={nameRef}
            label="팀 이름"
            required
            value={name}
            maxLength={LIMITS.teamName}
            counter
            autoComplete="off"
            error={nameError}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError(null);
            }}
          />
          <TextArea
            label="팀 설명"
            optionalLabel="(선택)"
            value={description}
            maxLength={LIMITS.teamDescription}
            counter
            rows={3}
            error={descriptionError}
            onChange={(e) => {
              setDescription(e.target.value);
              if (descriptionError) setDescriptionError(null);
            }}
          />
          {/* ③ 5-2-4 차이를 한 줄로 */}
          <fieldset className={s.fieldset}>
            <legend className={s.legend}>공개 설정</legend>
            <div className={s.radioGroup}>
              <RadioCard
                name="team-visibility"
                value="public"
                checked={isPublic}
                onChange={() => setIsPublic(true)}
                title="공개"
                description="프로필과 게시글에 팀 이름이 보여요."
              />
              <RadioCard
                name="team-visibility"
                value="private"
                checked={!isPublic}
                onChange={() => setIsPublic(false)}
                title="비공개"
                description="팀 이름을 숨겨요. 글은 그대로 전체 공개예요."
              />
            </div>
          </fieldset>
          <div className={s.formActions}>
            <LinkButton to={paths.teams()} variant="outline">
              취소
            </LinkButton>
            <Button type="submit" loading={create.pending}>
              {create.pending ? '만드는 중...' : '팀 만들기'}
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}

/** ⑤ 초대코드 안내 + ⑥ 팀으로 이동 (Q-01 기본값: 여기서 보여 주고, 팀장은 TM-06에서 다시 볼 수 있다) */
function CreatedView({ created }: { created: Created }) {
  const headRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    headRef.current?.focus();
  }, []);
  return (
    <>
      <div ref={headRef} tabIndex={-1} className={s.focusTarget}>
        <PageTitle title="팀을 만들었어요" sub={created.name} />
      </div>
      <Card>
        <SectionHeader title="초대코드" />
        <InviteCodeBox code={created.inviteCode} note="이 코드는 다시 발급할 수 없어요. 꼭 저장해 주세요." />
        <div className={s.formActions}>
          <LinkButton to={paths.team(created.teamId)}>팀 보러 가기</LinkButton>
        </div>
      </Card>
    </>
  );
}

/** TM-02 팀 생성 (화면설계서 5-1-13) */
export default function TeamCreatePage() {
  useDocumentTitle('팀 만들기');
  const [created, setCreated] = useState<Created | null>(null);
  return <PageContainer width="md">{created ? <CreatedView created={created} /> : <CreateForm onCreated={setCreated} />}</PageContainer>;
}
