import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Card, EmptyState, Notice } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { radius, space } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';
import { formatMoney, relativeTime } from '@/utils/format';
import { useWalletViewModel } from '@/viewmodels/useWalletViewModel';

export default function BalancesScreen() {
  const vm = useWalletViewModel();
  const theme = useTheme();

  return (
    <Screen refreshing={vm.loading && vm.loaded} onRefresh={vm.refresh}>
      <AppText tone="muted">Pull down to refresh. Balances for every stock account are listed here.</AppText>

      {vm.error && <Notice tone="danger" text={vm.error} />}
      {!vm.loaded && <ActivityIndicator color={theme.primary} />}

      {vm.accounts.map((account) => (
        <Card key={account.id} style={styles.row}>
          <View style={[styles.icon, { backgroundColor: theme.accentSoft }]}>
            <Icon name="wallet" size={20} color={theme.accent} />
          </View>
          <View style={styles.flex}>
            <AppText variant="label">{account.name}</AppText>
            <AppText variant="caption" tone="faint">
              Updated {relativeTime(account.updatedAt).toLowerCase()}
            </AppText>
          </View>
          <AppText variant="heading">{formatMoney(account.balance, account.currency)}</AppText>
        </Card>
      ))}

      {vm.loaded && vm.accounts.length === 0 && (
        <EmptyState icon="wallet" title="No accounts" text="Your stock accounts will appear here." />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  icon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
