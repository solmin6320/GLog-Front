/**
 * 잔디 색 단계 0~4. 백엔드는 기여 수만 주므로 GitHub처럼 그 기간 기여가 있는 날의 사분위로 나눈다.
 */
export function grassLevels(days: { date: string; count: number }[]): { date: string; count: number; level: number }[] {
  const counts = days.map((d) => d.count).filter((c) => c > 0).sort((a, b) => a - b);
  const at = (q: number) => counts[Math.min(counts.length - 1, Math.floor(q * counts.length))] ?? 0;
  const [q1, q2, q3] = [at(0.25), at(0.5), at(0.75)];
  return days.map((d) => ({
    ...d,
    level: d.count <= 0 ? 0 : d.count <= q1 ? 1 : d.count <= q2 ? 2 : d.count <= q3 ? 3 : 4,
  }));
}
