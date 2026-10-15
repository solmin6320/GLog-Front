/** 경로 파라미터 형식 (A1 5-5). 형식이 틀리면 API를 부르지 않고 404. */
export function isBigintId(v: string | null | undefined): v is string {
  return !!v && /^[1-9]\d{0,18}$/.test(v);
}

export function isObjectId(v: string | null | undefined): v is string {
  return !!v && /^[0-9a-f]{24}$/i.test(v);
}
