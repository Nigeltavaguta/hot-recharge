const mode = process.env.EXPO_PUBLIC_API_MODE ?? 'mock';
if (mode !== 'mock' && mode !== 'live') throw new Error('EXPO_PUBLIC_API_MODE must be mock or live');
export const apiMode: 'mock' | 'live' = mode;
export const apiBaseUrl = (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').replace(/\/$/, '');
if (mode === 'live' && !/^https:\/\/[^\s]+$/.test(apiBaseUrl)) {
  throw new Error('Live backend mode requires an HTTPS EXPO_PUBLIC_API_BASE_URL');
}
