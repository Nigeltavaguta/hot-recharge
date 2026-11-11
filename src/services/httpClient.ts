import { apiBaseUrl } from '@/config/api';
import { ApiError } from './hotApi';

export async function request<T>(path: string, options: { method?: 'GET' | 'POST'; body?: unknown; token?: string; key?: string } = {}): Promise<T> {
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), 30000);
  try {
    const response = await fetch(`${apiBaseUrl}/api${path}`, {
      method: options.method ?? 'GET', signal: abort.signal,
      headers: { Accept: 'application/json', ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}), ...(options.key ? { 'Idempotency-Key': options.key } : {}) },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
    if (response.status === 204) return undefined as T;
    const body = await response.json();
    if (!response.ok) throw new ApiError(typeof body.message === 'string' ? body.message : 'Backend request failed.', body.code, response.status);
    return body as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Connection interrupted. Check transaction status before making another purchase.', 'CONNECTION_UNKNOWN');
  } finally { clearTimeout(timer); }
}
