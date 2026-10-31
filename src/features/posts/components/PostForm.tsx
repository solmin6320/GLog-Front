import { useEffect, useId, useState, type FormEvent } from 'react';
import { useMutation } from '@apollo/client/react';
import { useBlocker, useNavigate } from 'react-router';
import type { PostSectionKey, PostType } from '@/gql/graphql';
import { useClock } from '@/session';
import { useAction } from '@/shared/api';
import { paths, postTypeFromEnum, postTypeToEnum, type PostTypeParam } from '@/shared/lib/paths';
import { LIMITS, VALIDATION_MSG, validateTitle } from '@/shared/lib/validators';
import {
  Button,
  Divider,
  InfoBox,
  LinkButton,
  Modal,
  PageTitle,
  Segmented,
  Select,
  TextArea,
  TextField,
  useConfirm,
} from '@/shared/ui';
import { dropPostLists, PostCreate, PostUpdate } from '../api';
import { isFilled, POST_TYPE_LABEL, REQUIRED_SECTIONS, SECTION_LABEL, SECTION_PLACEHOLDER } from '../postText';
import { isSundayLate, useServerNow } from '../useServerNow';
import { TagInput } from './TagInput';
import s from './PostForm.module.css';

export type PostFormValues = {
  type: PostType;
  title: string;
  sections: Partial<Record<PostSectionKey, string>>;
  tags: string[];
  teamId: string;
};

type Errors = { title: string | null; tags: string | null };
const NO_ERRORS: Errors = { title: null, tags: null };

const TYPE_ITEMS: { value: PostTypeParam; label: string }[] = [
  { value: 'troubleshooting', label: POST_TYPE_LABEL.TROUBLESHOOTING },
  { value: 'devlog', label: POST_TYPE_LABEL.DEVLOG },
];

/** 이탈 확인 대상인가: 종류만 바꾼 것은 입력으로 치지 않는다 */
function sameContent(a: PostFormValues, b: PostFormValues): boolean {
  const keys = REQUIRED_SECTIONS[a.type];
  return (
    a.title === b.title &&
    a.teamId === b.teamId &&
    a.tags.join('\n') === b.tags.join('\n') &&
    keys.every((k) => (a.sections[k] ?? '') === (b.sections[k] ?? ''))
  );
}

/**
 * BD-04 글 작성 · 수정 폼 (화면설계서 5-1-7 · W-13). 임시저장은 없다(E-26) — 이탈 확인만 한다.
 * 제목만 진짜 필수. 필수 항목(문제 · 원인 · 해결 / 한 일 · 배운 점)은 기록글 인정용이라 비어도 ⑭ 확인 뒤 저장한다(E-24).
 */
export function PostForm({
  mode,
  postId,
  initial,
  teams,
  lockTeam = false,
  finalizedWeek = false,
}: {
  mode: 'new' | 'edit';
  postId?: string;
  initial: PostFormValues;
  teams: { value: string; label: string }[];
  /** 팀장이 남의 글을 고칠 때: ②⑨ 잠금 + 배너 */
  lockTeam?: boolean;
  /** E-28 — 판정이 끝난 주의 글 */
  finalizedWeek?: boolean;
}) {
  const uid = useId();
  const fieldId = (name: string) => `${uid}-${name}`;
  const navigate = useNavigate();
  const confirm = useConfirm();
  const clock = useClock();
  const serverNow = useServerNow(clock.now);

  const [start] = useState(initial);
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Errors>(NO_ERRORS);
  const [postGone, setPostGone] = useState(false);
  const set = <K extends keyof PostFormValues>(key: K, v: PostFormValues[K]) => setValues((x) => ({ ...x, [key]: v }));

  const required = REQUIRED_SECTIONS[values.type];
  const filled = required.filter((k) => isFilled(values.sections[k])).length;
  const dirty = !sameContent(values, start);

  /* ---------- 이탈 확인 (E-26) ---------- */
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if ((nextLocation.state as { saved?: boolean } | null)?.saved) return false;
    return dirty && currentLocation.pathname !== nextLocation.pathname;
  });
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  /* ---------- 저장 ---------- */
  const [createPost] = useMutation(PostCreate);
  const [updatePost] = useMutation(PostUpdate);
  const save = useAction(
    async (v: PostFormValues): Promise<string | undefined> => {
      const keys = REQUIRED_SECTIONS[v.type];
      const common = {
        title: v.title.trim(),
        sections: keys.map((key) => ({ key, body: isFilled(v.sections[key]) ? (v.sections[key] ?? '').trim() : null })),
        tags: v.tags,
        teamId: v.teamId || null,
      };
      if (mode === 'new') {
        const r = await createPost({ variables: { input: { type: v.type, ...common } }, update: dropPostLists });
        return r.data?.createPost.id;
      }
      const r = await updatePost({ variables: { id: postId ?? '', input: common }, update: dropPostLists });
      return r.data?.updatePost.id;
    },
    {
      success: mode === 'new' ? '등록했어요.' : '수정했어요.',
      onError: (e) => {
        if (e.code === 'POST_DELETED') {
          setPostGone(true); // EX-BD04-02
          return true;
        }
        if (e.code === 'VALIDATION_FAILED' && e.field === 'title') {
          setErrors((x) => ({ ...x, title: VALIDATION_MSG.tooLong('제목', LIMITS.title) }));
          return true;
        }
        if (e.code === 'VALIDATION_FAILED' && e.field === 'tags') {
          setErrors((x) => ({ ...x, tags: '태그를 다시 확인해 주세요.' }));
          return true;
        }
        return false;
      },
    },
  );

  const focus = (id: string) => window.setTimeout(() => document.getElementById(id)?.focus(), 0);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (save.pending) return;
    const titleError = validateTitle(values.title);
    setErrors((x) => ({ ...x, title: titleError }));
    if (titleError) return focus(fieldId('title'));
    if (errors.tags) return focus(fieldId('tags'));

    const missing = required.find((k) => !isFilled(values.sections[k]));
    if (missing) {
      const go = await confirm({
        title: '아직 다 안 채웠어요',
        body: '이대로 올리면 인증에 포함되지 않아요.',
        confirmLabel: '그대로 올리기',
        cancelLabel: '더 쓰기',
        tone: 'primary',
      });
      if (!go) return focus(fieldId(`section-${missing}`));
    }
    const id = await save.run(values);
    if (id) void navigate(paths.post(id), { replace: true, state: { saved: true } });
  };

  /* ---------- 종류 전환 (작성 모드만) ---------- */
  const changeType = async (next: PostTypeParam) => {
    const nextType = postTypeToEnum(next);
    if (nextType === values.type) return;
    const hasText = REQUIRED_SECTIONS[values.type].some((k) => isFilled(values.sections[k]));
    if (hasText) {
      const ok = await confirm({
        title: '글 종류를 바꿀까요?',
        body: '지금 쓴 항목 내용은 지워져요.',
        confirmLabel: '바꾸기',
        cancelLabel: '그대로 두기',
      });
      if (!ok) return;
    }
    setValues((x) => ({ ...x, type: nextType, sections: {} }));
  };

  const cancel = () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) void navigate(-1);
    else void navigate(postId ? paths.post(postId) : paths.posts({ type: postTypeFromEnum(values.type) }));
  };

  const typeTabs = (
    <fieldset className={s.typeSet} disabled={mode === 'edit'}>
      <legend className="visually-hidden">글 종류</legend>
      <Segmented
        items={TYPE_ITEMS}
        value={postTypeFromEnum(values.type)}
        onChange={(t) => void changeType(t)}
        ariaLabel="글 종류"
      />
      {mode === 'edit' ? <p className={s.typeLocked}>등록한 글은 종류를 바꿀 수 없어요.</p> : null}
    </fieldset>
  );

  return (
    <>
      <PageTitle title={mode === 'new' ? '글쓰기' : '글 수정'} actions={typeTabs} />

      <div className={s.banners}>
        {mode === 'new' && isSundayLate(serverNow) ? (
          <InfoBox tone="warn" icon="clock" role="status">
            이번 주는 곧 끝나요. 자정 전에 올려야 이번 주로 들어가요.
          </InfoBox>
        ) : null}
        {lockTeam ? (
          <InfoBox tone="blue" icon="users">
            팀 글을 수정하고 있어요. 삭제는 관리자에게 문의해 주세요.
          </InfoBox>
        ) : null}
        {mode === 'edit' && finalizedWeek ? (
          <InfoBox tone="mute" icon="info">
            이미 끝난 주의 인증 결과는 바뀌지 않아요.
          </InfoBox>
        ) : null}
        {postGone ? (
          <InfoBox
            tone="red"
            icon="alert"
            role="alert"
            action={
              <LinkButton to={paths.posts()} variant="outline" size="sm">
                목록으로
              </LinkButton>
            }
          >
            삭제된 글이에요.
          </InfoBox>
        ) : null}
      </div>

      <form className={s.form} onSubmit={(e) => void submit(e)} noValidate aria-label={mode === 'new' ? '글쓰기' : '글 수정'}>
        <TextField
          id={fieldId('title')}
          label="제목"
          required
          maxLength={LIMITS.title}
          value={values.title}
          error={errors.title}
          onChange={(e) => {
            set('title', e.target.value);
            if (errors.title) setErrors((x) => ({ ...x, title: null }));
          }}
          className={s.title}
        />

        {required.map((key) => (
          <TextArea
            key={key}
            id={fieldId(`section-${key}`)}
            label={SECTION_LABEL[key]}
            required
            serif
            rows={5}
            placeholder={SECTION_PLACEHOLDER[key]}
            value={values.sections[key] ?? ''}
            onChange={(e) => set('sections', { ...values.sections, [key]: e.target.value })}
          />
        ))}

        {filled === required.length ? (
          <InfoBox tone="ok" icon="check" role="status">
            필수 항목을 다 채웠어요. 이 글은 인증에 들어가요
          </InfoBox>
        ) : (
          <InfoBox tone="mute" icon="info" role="status">
            필수 항목을 다 채우면 인증에 들어가요 ({filled} / {required.length})
          </InfoBox>
        )}

        <Divider />

        <TagInput
          id={fieldId('tags')}
          tags={values.tags}
          onChange={(tags) => set('tags', tags)}
          error={errors.tags}
          onError={(message) => setErrors((x) => ({ ...x, tags: message }))}
        />

        {teams.length > 1 ? (
          <Select
            id={fieldId('team')}
            label="소속 팀"
            options={teams}
            value={values.teamId}
            disabled={lockTeam}
            onChange={(e) => set('teamId', e.target.value)}
          />
        ) : null}

        <div className={s.buttons}>
          <Button variant="text" onClick={cancel}>
            취소
          </Button>
          <Button type="submit" size="lg" loading={save.pending}>
            {save.pending ? '저장 중...' : mode === 'new' ? '등록' : '수정'}
          </Button>
        </div>
      </form>

      <Modal
        open={blocker.state === 'blocked'}
        onClose={() => blocker.reset?.()}
        title="쓰던 글이 사라져요. 나갈까요?"
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
        {null}
      </Modal>
    </>
  );
}
