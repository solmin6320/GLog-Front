import { useId } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useDocumentTitle } from '@/layouts/useDocumentTitle';
import { paths, parseAdminNoticesSearch } from '@/shared/lib/paths';
import { Button } from '@/shared/ui';
import { NoticeEditor } from './NoticeEditor';
import { NoticeList } from './NoticeList';
import s from './Notices.module.css';

/**
 * AD-01 ②-4 공지 관리 (`/admin/notices?editor=new|<id>`). 공지 작성 · 수정 화면을 따로 두지 않는다 —
 * ⑤ [공지 작성] · [수정]을 누르면 ⑥ 목록 자리에 ⑦ 에디터를 연다. 어느 쪽인지는 URL(?editor)만 정한다.
 */
export function NoticesTab() {
  const titleId = useId();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { editor } = parseAdminNoticesSearch(searchParams);
  useDocumentTitle(editor ? (editor === 'new' ? '공지 작성' : '공지 수정') : '공지 관리');

  return (
    <section aria-labelledby={titleId}>
      <div className={s.head}>
        <h2 id={titleId} className={s.title}>
          공지 관리
        </h2>
        {editor ? null : (
          <span className={s.headAction}>
            <Button icon="plus" onClick={() => navigate(paths.adminNotices({ editor: 'new' }))}>
              공지 작성
            </Button>
          </span>
        )}
      </div>
      {editor ? <NoticeEditor key={editor} editor={editor} /> : <NoticeList />}
    </section>
  );
}
