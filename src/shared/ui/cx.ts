/** 클래스 이름 합치기 (내부용). CSS Modules 키는 noUncheckedIndexedAccess라 undefined일 수 있다. */
export function cx(...names: (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(' ');
}
