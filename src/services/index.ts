import type { HotApi } from './hotApi';
import { mockHotApi } from './mockHotApi';
import { liveHotApi } from './liveHotApi';
import { apiMode } from '@/config/api';

/** Swap this one line for the real v3 client when the backend work starts. */
export const api: HotApi = apiMode === 'mock' ? mockHotApi : liveHotApi;

export { ApiError, errorMessage } from './hotApi';
export type { HotApi } from './hotApi';
