const environment = process.env.EXPO_PUBLIC_APP_ENV ?? 'development';
if (environment !== 'development' && environment !== 'production') throw new Error('EXPO_PUBLIC_APP_ENV must be development or production');
export const isProduction = environment === 'production';
const mode = process.env.EXPO_PUBLIC_API_MODE ?? (isProduction ? 'live' : 'mock');
if (mode !== 'mock' && mode !== 'live') throw new Error('EXPO_PUBLIC_API_MODE must be mock or live');
if (isProduction && mode !== 'live') throw new Error('Production requires live API mode');
export const apiMode: 'mock' | 'live' = mode;
export const apiBaseUrl = (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').replace(/\/$/, '');
if (mode === 'live' && !/^https:\/\/[^\s]+$/.test(apiBaseUrl)) {
  throw new Error('Live backend mode requires an HTTPS EXPO_PUBLIC_API_BASE_URL');
}
