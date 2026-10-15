/**
 * MSW 핸들러 (설계서 8-1 · 8-3).
 * - GraphQL: 모든 연산을 목 스키마로 실행 → HTTP 200 + { data, errors }
 * - 장애 주입: failOnce(연산 이름) → 지연(slow 3초 · latency) → network(HttpResponse.error) · server(INTERNAL)
 * - REST: POST /api/members/me/profile-image (multipart 'file', 5MB · jpg/png/webp)
 */
import { delay, graphql, http, HttpResponse, type RequestHandler } from 'msw';
import { Kind, parse, type OperationDefinitionNode } from 'graphql';
import { createContext } from './context';
import { getMockControl, setMockControl } from './control';
import { touch } from './db/store';
import { classificationOf } from './errors';
import { executeMock } from './schema';

const SLOW_MS = 3000;

/** 장애 주입 server: 첫 번째 루트 필드에 INTERNAL */
function injectedServerError(query: string, operationName: string | null | undefined) {
  let firstField: string | undefined;
  try {
    const doc = parse(query);
    const op = doc.definitions.find(
      (d): d is OperationDefinitionNode => d.kind === Kind.OPERATION_DEFINITION && (!operationName || d.name?.value === operationName),
    );
    const sel = op?.selectionSet.selections.find((s) => s.kind === Kind.FIELD);
    if (sel && sel.kind === Kind.FIELD) firstField = sel.alias?.value ?? sel.name.value;
  } catch {
    /* 파싱 실패면 path 없이 */
  }
  return {
    data: null,
    errors: [
      {
        message: 'mock: injected server failure',
        ...(firstField ? { path: [firstField] } : {}),
        extensions: { code: 'INTERNAL', classification: classificationOf('INTERNAL') },
      },
    ],
  };
}

const graphqlHandler = graphql.operation(async ({ query, variables, operationName, request }) => {
  const control = getMockControl();

  if (control.failOnce && operationName && control.failOnce === operationName) {
    setMockControl({ failOnce: null });
    if (control.latency > 0) await delay(control.latency);
    return HttpResponse.json(injectedServerError(query, operationName));
  }

  const wait = control.failure === 'slow' ? SLOW_MS : control.latency;
  if (wait > 0) await delay(wait);

  if (control.failure === 'network') return HttpResponse.error();
  if (control.failure === 'server') return HttpResponse.json(injectedServerError(query, operationName));

  const result = await executeMock({
    query,
    variables,
    operationName,
    authorization: request.headers.get('authorization'),
  });
  return HttpResponse.json(JSON.parse(JSON.stringify(result)) as Record<string, unknown>);
});

/* ------------------------------------------------------------------ */
/* REST: 프로필 이미지 업로드 (기능명세서 8장, PR-02)                     */
/* ------------------------------------------------------------------ */

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

type FileLike = { size: number; type: string; name?: string; arrayBuffer(): Promise<ArrayBuffer> };
const isFileLike = (v: unknown): v is FileLike =>
  typeof v === 'object' && v !== null && 'size' in v && 'type' in v && typeof (v as FileLike).arrayBuffer === 'function';

/** multipart 본문에서 name="file" 파트 하나를 꺼낸다 (formData()를 못 쓸 때만) */
function parseMultipartFile(buf: Uint8Array, contentType: string): FileLike | null {
  const m = /boundary=(?:"([^"]+)"|([^;\s]+))/i.exec(contentType);
  const boundary = m?.[1] ?? m?.[2];
  if (!boundary) return null;
  let bin = '';
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  for (const part of bin.split(`--${boundary}`)) {
    const sep = part.indexOf('\r\n\r\n');
    if (sep < 0) continue;
    const headers = part.slice(0, sep);
    if (!/name="file"/i.test(headers)) continue;
    let content = part.slice(sep + 4);
    if (content.endsWith('\r\n')) content = content.slice(0, -2);
    const bytes = Uint8Array.from(content, (c) => c.charCodeAt(0));
    const type = /content-type:\s*([^\r\n]+)/i.exec(headers)?.[1]?.trim() ?? 'application/octet-stream';
    return { size: bytes.length, type, arrayBuffer: () => Promise.resolve(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)) };
  }
  return null;
}

async function toImageUrl(file: FileLike): Promise<string> {
  try {
    if (typeof URL.createObjectURL === 'function' && typeof Blob !== 'undefined' && file instanceof Blob) {
      return URL.createObjectURL(file);
    }
  } catch {
    /* data URL로 */
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return `data:${file.type};base64,${btoa(bin)}`;
}

const uploadHandler = http.post('*/api/members/me/profile-image', async ({ request }) => {
  const control = getMockControl();
  const wait = control.failure === 'slow' ? SLOW_MS : control.latency;
  if (wait > 0) await delay(wait);
  if (control.failure === 'network') return HttpResponse.error();
  if (control.failure === 'server') return HttpResponse.json({ code: 'INTERNAL' }, { status: 500 });

  const ctx = createContext(request.headers.get('authorization'));
  if (!ctx.viewer) return HttpResponse.json({ code: 'UNAUTHENTICATED' }, { status: 401 });
  if (ctx.viewer.status === 'PENDING') return HttpResponse.json({ code: 'ACCOUNT_PENDING' }, { status: 403 });
  if (ctx.viewer.status === 'REJECTED') return HttpResponse.json({ code: 'ACCOUNT_REJECTED' }, { status: 403 });

  let file: unknown;
  try {
    file = (await request.clone().formData()).get('file');
  } catch {
    // Vitest + jsdom: undici의 formData()가 jsdom File을 못 받아 실패한다 → 본문을 직접 나눈다
    file = parseMultipartFile(new Uint8Array(await request.arrayBuffer()), request.headers.get('content-type') ?? '');
  }
  if (!isFileLike(file)) return HttpResponse.json({ code: 'VALIDATION_FAILED', field: 'file', reason: 'missing' }, { status: 400 });
  if (file.size > MAX_IMAGE_BYTES) return HttpResponse.json({ code: 'VALIDATION_FAILED', field: 'file', reason: 'size' }, { status: 400 });
  if (!IMAGE_TYPES.includes(file.type)) return HttpResponse.json({ code: 'VALIDATION_FAILED', field: 'file', reason: 'type' }, { status: 400 });

  const profileImageUrl = await toImageUrl(file);
  ctx.viewer.profileImageUrl = profileImageUrl;
  touch();
  return HttpResponse.json({ profileImageUrl });
});

export const handlers: RequestHandler[] = [graphqlHandler, uploadHandler];
