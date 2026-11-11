import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { useStore } from '@/state/createStore';
import { sessionStore } from '@/state/sessionStore';
import { useTheme } from '@/theme/useTheme';

export default function RootLayout() {
  const theme = useTheme();
  const signedIn = useStore(sessionStore, (s) => s.user !== null);

  const base = theme.dark ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: theme.primary,
      background: theme.bg,
      card: theme.surface,
      text: theme.text,
      border: theme.border,
    },
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        {/* Always available: decides where to send the user. Guarded screens fall back here. */}
        <Stack.Screen name="index" />
        {/* Signed-out users can only reach (auth); signed-in users only (app). */}
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}
