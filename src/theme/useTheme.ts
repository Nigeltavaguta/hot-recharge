import { useColorScheme } from 'react-native';

import { darkTheme, lightTheme, type Theme } from './colors';

/** Follows the phone's light/dark setting. */
export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? darkTheme : lightTheme;
}
