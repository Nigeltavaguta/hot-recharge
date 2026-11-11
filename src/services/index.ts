import type { HotApi } from './hotApi';
import { mockHotApi } from './mockHotApi';

/** Swap this one line for the real v3 client when the backend work starts. */
export const api: HotApi = mockHotApi;

export { ApiError, errorMessage } from './hotApi';
export type { HotApi } from './hotApi';
