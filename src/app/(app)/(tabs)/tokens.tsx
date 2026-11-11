import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { useTabBarSpace } from '@/components/TabBar';
import { TokenCard } from '@/components/TokenCard';
import { space } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';
import { useWalletViewModel } from '@/viewmodels/useWalletViewModel';

export default function TokensScreen() {
  const vm = useWalletViewModel();
  const theme = useTheme();
  const tabBarSpace = useTabBarSpace();

  return (
    <Screen padTop bottomSpace={tabBarSpace} refreshing={vm.loading && vm.loaded} onRefresh={vm.refresh}>
      <View style={styles.intro}>
        <AppText variant="title">Tokens & PINs</AppText>
        <AppText tone="muted">Every token and PIN you have bought, newest first.</AppText>
      </View>

      {!vm.loaded && <ActivityIndicator color={theme.primary} />}

      {vm.tokens.map((tx) => (
        <TokenCard
          key={tx.id}
          tx={tx}
          onPress={() => router.push({ pathname: '/receipt/[id]', params: { id: tx.id } })}
        />
      ))}

      {vm.loaded && vm.tokens.length === 0 && (
        <EmptyState
          icon="tokens"
          title="No tokens yet"
          text="When you buy a ZESA token or a PIN it is kept here so you never lose it."
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: space.xs },
});
