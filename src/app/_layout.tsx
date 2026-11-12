import { useFonts } from '@expo-google-fonts/manrope';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { api, errorMessage } from '@/services';

import { useStore } from '@/state/createStore';
import { sessionStore, signIn } from '@/state/sessionStore';
import { fontAssets } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  // On a font load error, fall back to system fonts rather than blocking the app.
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const fontsDone = fontsLoaded || fontError !== null;
  useEffect(() => {
    if (fontsDone) SplashScreen.hideAsync();
  }, [fontsDone]);
  useEffect(() => {
    let active = true;
    api.restoreSession().then(user => { if (active && user) signIn(user); })
      .catch(error => { if (active) sessionStore.set({ restoreError: errorMessage(error) }); })
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);
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

  if (!fontsDone) return null;
  if (!ready) return <View style={{ flex: 1, justifyContent: 'center', backgroundColor: theme.bg }}><ActivityIndicator /></View>;
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
