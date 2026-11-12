import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Card, EmptyState, Notice } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { radius, space } from '@/theme/colors';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';
import { formatMoney, relativeTime } from '@/utils/format';
import { useWalletViewModel } from '@/viewmodels/useWalletViewModel';

export default function BalancesScreen() {
  const vm = useWalletViewModel();
  const theme = useTheme();

  // The first account is the main wallet; give it a little more presence than the rest.
  const tints = [
    { bg: theme.primarySoft, fg: theme.link },
    { bg: theme.accentSoft, fg: theme.accent },
    { bg: theme.warningSoft, fg: theme.warningText },
    { bg: theme.successSoft, fg: theme.successText },
  ];

  return (
    <Screen refreshing={vm.loading && vm.loaded} onRefresh={vm.refresh}>
      <AppText tone="muted">
        {vm.accounts.length > 0
          ? `${vm.accounts.length} stock accounts. Pull down to refresh.`
          : 'Pull down to refresh.'}
      </AppText>

      {vm.error && <Notice tone="danger" text={vm.error} />}
      {!vm.loaded && <ActivityIndicator color={theme.primary} />}

      {vm.accounts.map((account, index) => {
        const tint = tints[index % tints.length];
        return (
          <Card key={account.id} style={styles.card}>
            <View style={styles.top}>
              {/* The currency code doubles as the icon, so accounts are easy to tell apart. */}
              <View style={[styles.badge, { backgroundColor: tint.bg }]}>
                <AppText variant="caption" style={{ color: tint.fg, fontFamily: fonts.extrabold }}>
                  {account.currency}
                </AppText>
              </View>
              <View style={styles.flex}>
                <AppText variant="label" numberOfLines={1}>
                  {account.name}
                </AppText>
                <AppText variant="caption" tone="faint">
                  Updated {relativeTime(account.updatedAt).toLowerCase()}
                </AppText>
              </View>
            </View>
            <AppText style={styles.amount} numberOfLines={1} adjustsFontSizeToFit>
              {formatMoney(account.balance, account.currency)}
            </AppText>
          </Card>
        );
      })}

      {vm.loaded && vm.accounts.length === 0 && (
        <EmptyState icon="wallet" title="No accounts" text="Your stock accounts will appear here." />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { borderRadius: radius.xl, padding: space.lg, gap: space.md },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  badge: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  amount: { fontSize: 26, lineHeight: 32, fontFamily: fonts.extrabold },
});
