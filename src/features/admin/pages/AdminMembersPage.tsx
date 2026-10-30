import { MembersTab } from '../members/MembersTab';

/** AD-01 ②-2 가입 승인 (`/admin/members?status=&q=`). AdminLayout(폭 1120) 안에서 그려지므로 PageContainer를 두지 않는다. */
export default function AdminMembersPage() {
  return <MembersTab />;
}
