/** ObjectId 모양 id (posts · comments). seed · store가 같이 쓴다 (순환 import를 피하려고 따로 둔다). */
export const POST_OID_PREFIX = '66f1a2b3c4d5';
export const COMMENT_OID_PREFIX = '66f1c0de0000';

export function objectId(prefix: string, n: number): string {
  return prefix + n.toString(16).padStart(24 - prefix.length, '0');
}
