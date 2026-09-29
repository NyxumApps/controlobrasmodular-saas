import { getAccessToken } from '@/lib/supabase';

export type ApiErrorKind = 'offline' | 'timeout' | 'session' | 'permission' | 'validation' | 'conflict' | 'not_found' | 'rate_limit' | 'server';

export class ApiError extends Error {
  readonly status: number;
  readonly kind: ApiErrorKind;
  readonly title: string;
  readonly requestId?: string;
  /** True once the person has already seen this error in a notification. */
  notified = false;

  constructor(input: { status: number; kind: ApiErrorKind; title: string; message: string; requestId?: string }) {
    super(input.message);
    this.name = 'ApiError';
    this.status = input.status;
    this.kind = input.kind;
    this.title = input.title;
    this.requestId = input.requestId;
  }
}

const REQUEST_TIMEOUT_MS = 20_000;
// The API answers authorization failures with these technical words.
const TECHNICAL_MESSAGES = new Set(['Unauthorized', 'Forbidden', 'Invalid request host']);

function kindFromStatus(status: number): ApiErrorKind {
  if (status === 401) return 'session';
  if (status === 403) return 'permission';
  if (status === 404 || status === 410) return 'not_found';
  if (status === 409) return 'conflict';
  if (status === 429) return 'rate_limit';
  if (status >= 500) return 'server';
  return 'validation';
}

/**
 * Turns a failure into words a person on a construction site can act on.
 * `serverMessage` is the Spanish explanation the API already wrote for the
 * specific case; when present it is more precise than anything generic.
 *
 * Tune the tone of the product here: every error the app shows passes
 * through this function.
 */
export function describeError(kind: ApiErrorKind, serverMessage?: string): { title: string; message: string } {
  const specific = serverMessage && !TECHNICAL_MESSAGES.has(serverMessage) ? serverMessage : undefined;
  switch (kind) {
    case 'offline':
      return { title: 'Sin conexión', message: 'No pudimos comunicarnos con ObraControl. Revisa tu conexión a internet; lo que escribiste sigue aquí.' };
    case 'timeout':
      return { title: 'Está tardando más de lo normal', message: 'La conexión está lenta. Intenta de nuevo en un momento.' };
    case 'session':
      return { title: 'Tu sesión terminó', message: 'Por seguridad, vuelve a iniciar sesión para continuar.' };
    case 'permission':
      return { title: 'No tienes permiso para esta acción', message: specific ?? 'Tu rol no permite realizar este cambio. Pídele al dueño de la empresa que lo haga o que ajuste tu rol.' };
    case 'not_found':
      return { title: 'No lo encontramos', message: specific ?? 'Es posible que alguien de tu equipo lo haya cambiado. Actualiza la página e intenta de nuevo.' };
    case 'conflict':
      return { title: 'No se pudo completar', message: specific ?? 'La información cambió mientras trabajabas. Actualiza la página e intenta de nuevo.' };
    case 'rate_limit':
      return { title: 'Demasiados intentos', message: specific ?? 'Espera unos minutos antes de volver a intentarlo.' };
    case 'validation':
      return { title: 'Revisa los datos', message: specific ?? 'Hay información incompleta o con un formato que no reconocemos.' };
    case 'server':
      return { title: 'Tuvimos un problema', message: specific ?? 'Algo falló de nuestro lado. Tu información está segura; intenta de nuevo en unos minutos.' };
  }
}

function buildError(status: number, kind: ApiErrorKind, serverMessage?: string, requestId?: string): ApiError {
  return new ApiError({ status, kind, requestId, ...describeError(kind, serverMessage) });
}

/** Normalizes anything thrown (ApiError, network failure, unknown) into an ApiError. */
export function toApiError(cause: unknown): ApiError {
  if (cause instanceof ApiError) return cause;
  if (cause instanceof DOMException && (cause.name === 'AbortError' || cause.name === 'TimeoutError')) return buildError(0, 'timeout');
  if (cause instanceof TypeError || (typeof navigator !== 'undefined' && navigator.onLine === false)) return buildError(0, 'offline');
  return buildError(0, 'server');
}

/** fetch for our own API: adds the session token, a timeout and readable errors. */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = await getAccessToken().catch(() => null);
  if (token && !headers.has('authorization')) headers.set('Authorization', `Bearer ${token}`);
  let response: Response;
  try {
    response = await fetch(path, { ...init, headers, signal: init.signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch (cause) {
    throw toApiError(cause);
  }
  if (response.ok) return response;
  const body = await response.json().catch(() => null) as { error?: unknown; requestId?: unknown } | null;
  throw buildError(
    response.status,
    kindFromStatus(response.status),
    typeof body?.error === 'string' ? body.error : undefined,
    typeof body?.requestId === 'string' && body.requestId ? body.requestId : undefined,
  );
}

export async function apiJson<T = unknown>(path: string, method = 'GET', data?: unknown): Promise<T> {
  const response = await apiFetch(path, {
    method,
    headers: data === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  return (response.status === 204 ? undefined : await response.json()) as T;
}
