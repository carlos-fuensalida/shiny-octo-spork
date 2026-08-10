const PUBLIC_DATA_API = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
const INTERNAL_DATA_API = process.env.INTERNAL_API_BASE_URL ?? PUBLIC_DATA_API;
const CHAT_API = process.env.NEXT_PUBLIC_CHAT_API_BASE_URL ?? '';

type ApiTarget = 'data' | 'chat';

async function request<T>(
  target: ApiTarget,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const base =
    target === 'chat'
      ? CHAT_API
      : typeof window === 'undefined'
        ? INTERNAL_DATA_API
        : PUBLIC_DATA_API;
  const url = `${base}/api/v1${path}`;

  const res = await fetch(url, {
    credentials: target === 'data' ? 'include' : 'same-origin',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new HttpError(
      res.status,
      body?.error?.message ?? res.statusText,
      body,
    );
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export function buildQuery(params: Record<string, unknown>): string {
  const qs = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val === undefined || val === null) continue;
    if (Array.isArray(val)) {
      val.forEach((v) => qs.append(key, String(v)));
    } else {
      qs.set(key, String(val));
    }
  }
  const str = qs.toString();
  return str ? `?${str}` : '';
}

export const dataApi = {
  get: <T>(path: string) => request<T>('data', path),
  post: <T>(path: string, body: unknown) =>
    request<T>('data', path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>('data', path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>('data', path, { method: 'DELETE' }),
};

export const chatApi = {
  post: <T>(path: string, body: unknown) =>
    request<T>('chat', path, { method: 'POST', body: JSON.stringify(body) }),
};
