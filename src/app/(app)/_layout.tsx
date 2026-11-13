import { Stack } from 'expo-router';
import { useEffect } from 'react';

import { PurchaseSheet } from '@/components/purchase/PurchaseSheet';
import { refreshWallet } from '@/state/walletStore';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

export default function AppLayout() {
  const theme = useTheme();

  // Load balances and history once, as soon as the user is signed in.
  useEffect(() => {
    void refreshWallet();
  }, []);

  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.bg },
          headerTintColor: theme.text,
          headerTitleStyle: { fontFamily: fonts.bold },
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: theme.bg },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="receipt/[id]" options={{ title: 'Receipt' }} />
        <Stack.Screen name="balances" options={{ title: 'Balances' }} />
        <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      </Stack>
      {/* The buy flow lives in a bottom sheet that can open over any signed-in screen. */}
      <PurchaseSheet />
    </>
  );
}
