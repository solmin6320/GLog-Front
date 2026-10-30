import { DeletedWarningsSection } from '@/features/admin/warnings/DeletedWarningsSection';
import { PenaltyTargetsSection } from '@/features/admin/warnings/PenaltyTargetsSection';
import s from '@/features/admin/warnings/Warnings.module.css';
import { useDocumentTitle } from '@/layouts/useDocumentTitle';

/**
 * AD-01 ②-1 경고 복구 · 벌칙 탭 (`/admin/warnings`, 목업 W-16).
 * 벌칙 대상(⑤ 이행 완료 ⑥)과 삭제된 경고(⑦ 복구 ⑧)를 한 화면에 둔다. 관리자 화면 중 팀 실명이 나오는 곳은 여기뿐이다.
 * AdminLayout(폭 1120) 안이라 PageContainer를 두지 않는다.
 */
export default function AdminWarningsPage() {
  useDocumentTitle('경고 복구 · 벌칙');
  return (
    <>
      <h2 className={s.pageTitle}>경고 복구 · 벌칙</h2>
      <PenaltyTargetsSection />
      <DeletedWarningsSection />
    </>
  );
}
