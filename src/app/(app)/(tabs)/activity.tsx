import { router } from 'expo-router';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { EmptyState, Notice } from '@/components/Card';
import { FilterChips } from '@/components/FilterChips';
import { useTabBarSpace } from '@/components/TabBar';
import { TransactionRow } from '@/components/TransactionRow';
import type { Transaction } from '@/models';
import { space } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';
import { dayLabel } from '@/utils/format';
import { ACTIVITY_FILTERS, useActivityViewModel } from '@/viewmodels/useWalletViewModel';

type Row = { kind: 'day'; key: string; label: string } | { kind: 'tx'; key: string; tx: Transaction };

/** Inserts a "Today" / "Yesterday" / date heading before the first transaction of each day. */
function groupByDay(transactions: Transaction[]): Row[] {
  const rows: Row[] = [];
  let current = '';
  for (const tx of transactions) {
    const label = dayLabel(tx.date);
    if (label !== current) {
      current = label;
      rows.push({ kind: 'day', key: `day-${label}`, label });
    }
    rows.push({ kind: 'tx', key: tx.id, tx });
  }
  return rows;
}

export default function ActivityScreen() {
  const vm = useActivityViewModel();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarSpace = useTabBarSpace();
  const rows = groupByDay(vm.visible);

  return (
    <FlatList
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + space.md, paddingBottom: tabBarSpace }]}
      data={rows}
      keyExtractor={(row) => row.key}
      renderItem={({ item }) =>
        item.kind === 'day' ? (
          <AppText variant="label" tone="faint" accessibilityRole="header" style={styles.day}>
            {item.label}
          </AppText>
        ) : (
          <TransactionRow
            tx={item.tx}
            showTime
            onPress={() => router.push({ pathname: '/receipt/[id]', params: { id: item.tx.id } })}
          />
        )
      }
      refreshControl={
        <RefreshControl
          refreshing={vm.loading && vm.loaded}
          onRefresh={vm.refresh}
          tintColor={theme.primary}
          colors={[theme.primary]}
        />
      }
      ListHeaderComponent={
        <View style={styles.header}>
          <AppText variant="display">Activity</AppText>
          {vm.error && <Notice tone="danger" text={vm.error} />}
          <FilterChips options={ACTIVITY_FILTERS} value={vm.filter} onChange={vm.setFilter} />
        </View>
      }
      ListEmptyComponent={
        vm.loaded ? (
          <EmptyState
            icon="activity"
            title="No transactions"
            text={vm.filter === 'all' ? 'Your purchases will show up here.' : 'Nothing matches this filter yet.'}
          />
        ) : (
          <ActivityIndicator color={theme.primary} style={styles.loading} />
        )
      }
      ListFooterComponent={
        vm.nextCursor ? (
          <Button label="Load more" variant="outline" loading={vm.loadingMore} onPress={vm.loadMore} />
        ) : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.lg, gap: space.sm },
  header: { gap: space.md, marginBottom: space.xs },
  day: { marginTop: space.sm, marginLeft: space.xs },
  loading: { marginTop: space.xxl },
});
