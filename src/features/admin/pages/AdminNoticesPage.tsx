import { NoticesTab } from '../notices/NoticesTab';

/** AD-01 ②-4 공지 관리 (`/admin/notices?editor=`). AdminLayout(폭 1120) 안에서 그려지므로 PageContainer를 두지 않는다. */
export default function AdminNoticesPage() {
  return <NoticesTab />;
}
