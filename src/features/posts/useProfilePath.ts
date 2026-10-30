import { useViewer } from '@/session';
import { paths } from '@/shared/lib/paths';

/** 작성자 → PR-01 (본인이면 /profile/me) */
export function useProfilePath(): (memberId: string) => string {
  const viewer = useViewer();
  return (memberId) => (memberId === viewer.id ? paths.profileMe() : paths.profile(memberId));
}
