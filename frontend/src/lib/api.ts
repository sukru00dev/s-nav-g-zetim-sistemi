/**
 * Merkezi API İstemcisi
 * Tüm fetch çağrıları buradan yapılır. Base URL .env'den okunur.
 * Kullanım: api.get('/auth/me', token), api.post('/auth/login', {}, body)
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

async function request<T>(
  method: Method,
  path: string,
  token?: string | null,
  body?: unknown
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.message ?? `HTTP ${res.status}: ${path}`);
  }

  return data as T;
}

export const api = {
  get:    <T>(path: string, token?: string | null)                   => request<T>('GET',    path, token),
  post:   <T>(path: string, body: unknown, token?: string | null)    => request<T>('POST',   path, token, body),
  put:    <T>(path: string, body: unknown, token?: string | null)    => request<T>('PUT',    path, token, body),
  delete: <T>(path: string, token?: string | null)                   => request<T>('DELETE', path, token),
};
