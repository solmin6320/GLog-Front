import { useEffect, useId, useRef, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { useBlocker, useNavigate } from 'react-router';
import { MSG } from '@/domain/messages';
import { useAction } from '@/shared/api';
import { paths } from '@/shared/lib/paths';
import { validateRequiredText } from '@/shared/lib/validators';
import { Button, Card, CardSkeleton, InfoBox, Modal, QueryBoundary, Switch, TextArea, TextField } from '@/shared/ui';
import { AdminNoticesCreate, AdminNoticesEditorQuery, AdminNoticesQuery, AdminNoticesUpdate } from './api';
import s from './Notices.module.css';

/** notice.title VARCHAR(200) (DB 1-15) */
const TITLE_MAX = 200;
/** notice.content TEXT — 화면 제한은 제안 */
const CONTENT_MAX = 5000;

const validateTitle = validateRequiredText('제목', TITLE_MAX);
const validateContent = validateRequiredText('본문', CONTENT_MAX);

type Values = { title: string; content: string; isPinned: boolean };

const EMPTY: Values = { title: '', content: '', isPinned: false };

/** ⑦ 공지 에디터 (`?editor=new` 작성 · `?editor=<id>` 수정). 목록 자리에 그린다 */
export function NoticeEditor({ editor }: { editor: string }) {
  if (editor === 'new') return <NoticeForm initial={EMPTY} />;
  return <ExistingNotice id={editor} />;
}

function ExistingNotice({ id }: { id: string }) {
  const q = useQuery(AdminNoticesEditorQuery, { variables: { id } });
  return (
    <QueryBoundary
      loading={q.loading}
      error={q.error}
      data={q.data ? q.data.notice : undefined}
      skeleton={<CardSkeleton height={420} />}
      onRetry={() => void q.refetch()}
    >
      {(n) => <NoticeForm key={n.id} id={n.id} isSystem={n.isSystem} initial={{ title: n.title, content: n.content, isPinned: n.isPinned }} />}
    </QueryBoundary>
  );
}

function NoticeForm({ id, isSystem = false, initial }: { id?: string; isSystem?: boolean; initial: Values }) {
  const navigate = useNavigate();
  const headingId = useId();
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<{ title?: string | null; content?: string | null }>({});
  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const dirty = values.title !== initial.title || values.content !== initial.content || values.isPinned !== initial.isPinned;

  // 바뀐 내용이 있으면 에디터를 떠나기 전에 묻는다 (?editor 제거 · 다른 탭 · 다른 화면). 저장 뒤 이동은 state.saved로 통과
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if ((nextLocation.state as { saved?: boolean } | null)?.saved) return false;
    return dirty && (currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search);
  });
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  const [createNotice] = useMutation(AdminNoticesCreate);
  const [updateNotice] = useMutation(AdminNoticesUpdate);
  // 목록이 에디터 뒤에서 내려가 있으므로 문서 + 변수로 직접 다시 받아 둔다 → 돌아가면 바로 새 목록
  const refetchList = { refetchQueries: [{ query: AdminNoticesQuery, variables: {} }], awaitRefetchQueries: true };
  const save = useAction(
    async (input: Values) => {
      if (id) await updateNotice({ variables: { id, input }, ...refetchList });
      else await createNotice({ variables: { input }, ...refetchList });
      return true;
    },
    {
      success: MSG.saved,
      onError: (e) => {
        if (e.code !== 'VALIDATION_FAILED' || (e.field !== 'title' && e.field !== 'content')) return false;
        setErrors({ [e.field]: e.field === 'title' ? validateTitle('') : validateContent('') });
        return true;
      },
    },
  );

  const set = <K extends keyof Values>(key: K, v: Values[K]) => {
    setValues((prev) => ({ ...prev, [key]: v }));
    if (key === 'title' || key === 'content') setErrors((prev) => ({ ...prev, [key]: null }));
  };

  const submit = async () => {
    const next = { title: validateTitle(values.title), content: validateContent(values.content) };
    setErrors(next);
    if (next.title) return titleRef.current?.focus();
    if (next.content) return contentRef.current?.focus();
    const ok = await save.run({ title: values.title.trim(), content: values.content, isPinned: values.isPinned });
    if (ok) navigate(paths.adminNotices(), { replace: true, state: { saved: true } });
  };

  return (
    <Card as="section" aria-labelledby={headingId}>
      <h3 id={headingId} className={s.editorTitle}>
        {id ? '공지 수정' : '공지 작성'}
      </h3>
      {isSystem ? (
        <InfoBox tone="blue" icon="shield">
          잔디 인정 규칙 공지예요. 고친 내용이 회원 화면에 바로 보여요.
        </InfoBox>
      ) : null}
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <TextField
          ref={titleRef}
          label="제목"
          required
          value={values.title}
          maxLength={TITLE_MAX}
          counter
          error={errors.title}
          onChange={(e) => set('title', e.target.value)}
        />
        <TextArea
          ref={contentRef}
          label="본문"
          required
          serif
          rows={12}
          value={values.content}
          maxLength={CONTENT_MAX}
          hint="줄바꿈은 그대로 보여요."
          error={errors.content}
          onChange={(e) => set('content', e.target.value)}
        />
        <div className={s.switchRow}>
          <Switch
            checked={values.isPinned}
            onChange={(v) => set('isPinned', v)}
            label="상단 고정"
            description="고정하면 공지 목록 맨 위에 보여요."
          />
        </div>
        <div className={s.formFooter}>
          <Button variant="outline" onClick={() => navigate(paths.adminNotices())}>
            취소
          </Button>
          <Button type="submit" loading={save.pending}>
            저장
          </Button>
        </div>
      </form>

      <Modal
        open={blocker.state === 'blocked'}
        onClose={() => blocker.reset?.()}
        title="쓰던 공지가 사라져요. 나갈까요?"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => blocker.reset?.()}>
              계속 쓰기
            </Button>
            <Button variant="danger" onClick={() => blocker.proceed?.()}>
              나가기
            </Button>
          </>
        }
      >
        저장하지 않은 내용은 남지 않아요.
      </Modal>
    </Card>
  );
}
