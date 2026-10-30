import { ExemptionsTab } from '../exemptions/ExemptionsTab';

/** AD-01 ②-3 면제 관리 (`/admin/exemptions`). AdminLayout(폭 1120) 안에서 그려지므로 PageContainer를 두지 않는다. */
export default function AdminExemptionsPage() {
  return <ExemptionsTab />;
}
