import { router, useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Card, EmptyState, Notice, SectionHeader } from '@/components/Card';
import { Icon, type IconName } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { useTabBarSpace } from '@/components/TabBar';
import { TokenCard } from '@/components/TokenCard';
import { TransactionRow } from '@/components/TransactionRow';
import { WalletHero } from '@/components/WalletHero';
import { openPurchase, type PurchaseKind } from '@/state/purchaseSheet';
import { radius, space } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';
import { useWalletViewModel } from '@/viewmodels/useWalletViewModel';

const SERVICES: { kind: PurchaseKind; label: string; icon: IconName }[] = [
  { kind: 'airtime', label: 'Airtime', icon: 'airtime' },
  { kind: 'bundle', label: 'Bundles', icon: 'bundle' },
  { kind: 'zesa', label: 'ZESA', icon: 'zesa' },
];

export default function HomeScreen() {
  const vm = useWalletViewModel();
  const theme = useTheme();
  const tabBarSpace = useTabBarSpace();
  const focused = useIsFocused();

  // Each product gets its own soft colour so the three are easy to tell apart at a glance.
  const tints: Record<PurchaseKind, { bg: string; fg: string }> = {
    airtime: { bg: theme.primarySoft, fg: theme.primary },
    bundle: { bg: theme.accentSoft, fg: theme.accent },
    zesa: { bg: theme.warningSoft, fg: theme.warning },
  };

  return (
    <Screen
      bottomSpace={tabBarSpace}
      refreshing={vm.loading && vm.loaded}
      onRefresh={vm.refresh}
      hero={
        <WalletHero
          user={vm.user}
          accounts={vm.accounts}
          hidden={vm.balanceHidden}
          refreshing={vm.loading}
          onToggleHidden={vm.toggleBalanceHidden}
          onRefresh={vm.refresh}
          onViewBalances={() => router.push('/balances')}
          unreadCount={vm.unreadCount}
          onOpenNotifications={() => router.push('/notifications')}
        />
      }>
      {/* Status bar icons that contrast with the top of the header: dark on pale, light on dark. */}
      {focused && <StatusBar style={theme.dark ? 'light' : 'dark'} />}

      {vm.error && <Notice tone="danger" text={vm.error} />}

      <View style={styles.section}>
        <SectionHeader title="Buy" />
        <Card style={styles.services}>
          {SERVICES.map((service) => (
            <Pressable
              key={service.kind}
              accessibilityRole="button"
              accessibilityLabel={`Buy ${service.label}`}
              onPress={() => openPurchase(service.kind)}
              style={({ pressed }) => [styles.service, pressed && styles.pressed]}>
              <View style={[styles.serviceIcon, { backgroundColor: tints[service.kind].bg }]}>
                <Icon name={service.icon} size={24} color={tints[service.kind].fg} />
              </View>
              <AppText variant="label">{service.label}</AppText>
            </Pressable>
          ))}
        </Card>
      </View>

      {vm.latestToken && (
        <View style={styles.section}>
          <SectionHeader title="Latest token" action="All tokens" onAction={() => router.push('/tokens')} />
          <TokenCard
            tx={vm.latestToken}
            onPress={() => router.push({ pathname: '/receipt/[id]', params: { id: vm.latestToken!.id } })}
          />
        </View>
      )}

      <View style={styles.section}>
        <SectionHeader title="Recent activity" action="View all" onAction={() => router.push('/activity')} />
        {vm.recent.map((tx) => (
          <TransactionRow
            key={tx.id}
            tx={tx}
            onPress={() => router.push({ pathname: '/receipt/[id]', params: { id: tx.id } })}
          />
        ))}
        {vm.loaded && vm.recent.length === 0 && (
          <EmptyState icon="activity" title="Nothing yet" text="Your purchases will show up here." />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.sm },
  services: { flexDirection: 'row', borderRadius: radius.xl },
  service: { flex: 1, alignItems: 'center', gap: space.sm, paddingVertical: space.xs },
  serviceIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.6 },
});
