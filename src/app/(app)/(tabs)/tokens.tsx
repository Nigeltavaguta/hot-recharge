import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { EmptyState, Notice } from '@/components/Card';
import { FilterChips } from '@/components/FilterChips';
import { Screen } from '@/components/Screen';
import { useTabBarSpace } from '@/components/TabBar';
import { TokenCard } from '@/components/TokenCard';
import { space } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';
import { useWalletViewModel } from '@/viewmodels/useWalletViewModel';

type Kind = 'all' | 'token' | 'pin';

export default function TokensScreen() {
  const vm = useWalletViewModel();
  const theme = useTheme();
  const tabBarSpace = useTabBarSpace();
  const [kind, setKind] = useState<Kind>('all');

  const electricity = vm.tokens.filter((t) => t.token);
  const pins = vm.tokens.filter((t) => !t.token);
  const visible = kind === 'token' ? electricity : kind === 'pin' ? pins : vm.tokens;
  // The filter is only worth showing when there is more than one kind to choose between.
  const showFilter = electricity.length > 0 && pins.length > 0;

  return (
    <Screen padTop bottomSpace={tabBarSpace} refreshing={vm.loading && vm.loaded} onRefresh={vm.refresh}>
      <View style={styles.intro}>
        <AppText variant="display">Tokens & PINs</AppText>
        <AppText tone="muted">
          {vm.loaded && vm.tokens.length > 0
            ? `${vm.tokens.length} saved, newest first. Tap one to see its receipt.`
            : 'Every token and PIN you buy is kept here.'}
        </AppText>
      </View>

      {showFilter && (
        <FilterChips
          value={kind}
          onChange={setKind}
          options={[
            { id: 'all', label: 'All', count: vm.tokens.length },
            { id: 'token', label: 'Electricity', count: electricity.length },
            { id: 'pin', label: 'PINs', count: pins.length },
          ]}
        />
      )}

      {!vm.loaded && <ActivityIndicator color={theme.primary} />}
      {vm.error && <Notice tone="danger" text={vm.error} />}

      {visible.map((tx) => (
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
      {vm.vaultCursor && (
        <Button label="Load more" variant="outline" loading={vm.loadingMore} onPress={vm.loadMoreVault} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: space.xs },
});
