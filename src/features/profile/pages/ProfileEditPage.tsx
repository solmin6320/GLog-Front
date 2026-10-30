import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useMutation } from '@apollo/client/react';
import { useBlocker, useNavigate, type BlockerFunction } from 'react-router';
import { MSG, messageFor } from '@/domain/messages';
import { useDocumentTitle } from '@/layouts/useDocumentTitle';
import { useSession, useViewer } from '@/session';
import { uploadProfileImage, useAction } from '@/shared/api';
import { isBridgeMode } from '@/shared/config/env';
import { paths } from '@/shared/lib/paths';
import { PROFILE_IMAGE, validateProfileImage } from '@/shared/lib/validators';
import { Avatar, Button, Card, Hint, PageContainer, PageTitle, useConfirm } from '@/shared/ui';
import { ProfileResetImage } from '../api';
import { PROFILE_EDIT_COPY as C } from '../copy';
import s from '../profile.module.css';

/** 저장 전 바꾼 내용 — 고른 사진 · 기본 이미지로 되돌리기 */
type Change = { kind: 'none' } | { kind: 'file'; file: File; previewUrl: string | null } | { kind: 'reset' };

const NONE: Change = { kind: 'none' };
const ACCEPT = PROFILE_IMAGE.types.join(',');

/** 고른 파일 미리보기 주소 (요청 없음). 브라우저가 못 만들면 기본 이미지 */
function createPreview(file: File): string | null {
  try {
    return typeof URL.createObjectURL === 'function' ? URL.createObjectURL(file) : null;
  } catch {
    return null;
  }
}

function revokePreview(url: string): void {
  try {
    URL.revokeObjectURL(url);
  } catch {
    /* 이미 해제됨 */
  }
}

/**
 * PR-02 프로필 수정 (화면설계서 5-1-20) — 본인 사진만. 닉네임 · GitHub 아이디는 고칠 수 없다.
 * 사진은 고르는 즉시 형식 · 크기를 먼저 보고(E-56, 요청 0건) 미리보기만 바꾼다. [저장] 때
 * REST 업로드(uploadProfileImage) 또는 resetProfileImage → 세션 재조회(헤더 사진) → PR-01 + "저장했어요."
 * 저장 안 한 변경이 있을 때만 이탈 확인(useBlocker).
 */
export default function ProfileEditPage() {
  useDocumentTitle(C.title);
  const viewer = useViewer();
  const { refresh } = useSession();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [resetImage] = useMutation(ProfileResetImage);

  const [change, setChange] = useState<Change>(NONE);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dirty = change.kind !== 'none';

  // 미리보기 주소는 바뀌거나 화면을 떠날 때 해제한다
  useEffect(() => {
    if (change.kind !== 'file' || !change.previewUrl) return;
    const url = change.previewUrl;
    return () => revokePreview(url);
  }, [change]);

  /* ---------- 이탈 확인 (저장 안 한 변경이 있을 때만) ---------- */
  const dirtyRef = useRef(false);
  const leavingRef = useRef(false);
  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);
  const shouldBlock = useCallback<BlockerFunction>(
    ({ currentLocation, nextLocation }) =>
      dirtyRef.current && !leavingRef.current && currentLocation.pathname !== nextLocation.pathname,
    [],
  );
  const blocker = useBlocker(shouldBlock);
  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    let active = true;
    void confirm({ title: C.leaveTitle, body: C.leaveBody, confirmLabel: C.leaveConfirm, cancelLabel: C.leaveCancel, tone: 'danger' }).then(
      (ok) => {
        if (!active) return;
        if (ok) blocker.proceed();
        else blocker.reset();
      },
    );
    return () => {
      active = false;
    };
  }, [blocker, confirm]);

  /* ---------- 저장 ---------- */
  const save = useAction(
    async (c: Change): Promise<true> => {
      if (c.kind === 'file') await uploadProfileImage(c.file);
      else if (c.kind === 'reset') await resetImage();
      // 헤더 사진은 세션(me)을 본다 — 실패해도 저장은 끝났다
      await refresh().catch(() => undefined);
      return true;
    },
    {
      success: MSG.saved,
      errorOverrides: change.kind === 'file' ? { INTERNAL: C.uploadFailed } : undefined, // E-55
      onError: (e) => {
        // 서버가 형식 · 크기로 거절(413 · 415) → 입력 아래에 쓰고 사진을 다시 고르게 한다
        if (e.code === 'VALIDATION_FAILED' && change.kind === 'file') {
          setFileError(messageFor(e));
          setChange(NONE);
          return true;
        }
        return false;
      },
    },
  );

  const onSave = async () => {
    setFileError(null);
    const ok = await save.run(change);
    if (!ok) return;
    leavingRef.current = true;
    void navigate(paths.profileMe());
  };

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // 같은 파일을 다시 골라도 바뀌게
    if (!file) return;
    const error = validateProfileImage(file);
    if (error) {
      setFileError(error); // 미리보기는 그대로 · 요청 0건 (E-56)
      return;
    }
    setFileError(null);
    setChange({ kind: 'file', file, previewUrl: createPreview(file) });
  };

  const onReset = () => {
    setFileError(null);
    // 올려 둔 사진이 있으면 [저장] 때 지운다. 고르기만 했으면 고른 것을 취소한다
    setChange(viewer.profileImageUrl ? { kind: 'reset' } : NONE);
  };

  const shownUrl = change.kind === 'file' ? change.previewUrl : change.kind === 'reset' ? null : viewer.profileImageUrl;
  const canReset = change.kind === 'file' || (change.kind === 'none' && !!viewer.profileImageUrl);

  return (
    <PageContainer width="md">
      <PageTitle title={C.title} sub={C.sub} />
      <Card as="section" aria-label="프로필 사진">
        <div className={s.editCard}>
          <Avatar name={viewer.nickname} imageUrl={shownUrl} size={88} />
          <div className={s.identity}>
            <p className={s.identityName}>{viewer.nickname}</p>
            <p className={s.identityLogin}>{`@${viewer.githubLogin}`}</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            className={s.fileInput}
            tabIndex={-1}
            aria-label={C.pick}
            onChange={onPick}
          />
          {/* 서버에 사진 업로드가 아직 없다(S3 보류) — 실서버 연결 중에는 버튼 대신 안내만 */}
          <div className={s.photoActions} hidden={isBridgeMode}>
            <Button
              variant="outline"
              size="sm"
              disabled={save.pending}
              aria-describedby="profile-photo-hint"
              onClick={() => fileRef.current?.click()}
            >
              {C.pick}
            </Button>
            {canReset ? (
              <Button variant="text" size="sm" disabled={save.pending} onClick={onReset}>
                {C.reset}
              </Button>
            ) : null}
          </div>
          {fileError ? (
            <div role="alert">
              <Hint tone="error" id="profile-photo-hint">
                {fileError}
              </Hint>
            </div>
          ) : (
            <Hint id="profile-photo-hint">{isBridgeMode ? '프로필 사진 바꾸기는 준비 중이에요. 지금은 GitHub 프로필 사진이 쓰여요.' : C.pickHint}</Hint>
          )}
        </div>
      </Card>
      <div className={s.formActions}>
        <Button variant="outline" disabled={save.pending} onClick={() => void navigate(paths.profileMe())}>
          {C.cancel}
        </Button>
        <Button disabled={!dirty} loading={save.pending} onClick={() => void onSave()}>
          {save.pending ? C.saving : C.save}
        </Button>
      </div>
    </PageContainer>
  );
}
