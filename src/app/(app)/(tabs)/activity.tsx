import { router } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/Card';
import { useTabBarSpace } from '@/components/TabBar';
import { TransactionRow } from '@/components/TransactionRow';
import { radius, space } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';
import { ACTIVITY_FILTERS, useActivityViewModel } from '@/viewmodels/useWalletViewModel';

export default function ActivityScreen() {
  const vm = useActivityViewModel();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarSpace = useTabBarSpace();

  return (
    <FlatList
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + space.md, paddingBottom: tabBarSpace }]}
      data={vm.visible}
      keyExtractor={(tx) => tx.id}
      renderItem={({ item }) => (
        <TransactionRow
          tx={item}
          onPress={() => router.push({ pathname: '/receipt/[id]', params: { id: item.id } })}
        />
      )}
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
          <AppText variant="title">Activity</AppText>
          <View accessibilityRole="tablist" style={styles.filters}>
            {ACTIVITY_FILTERS.map((f) => {
              const selected = vm.filter === f.id;
              return (
                <Pressable
                  key={f.id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  onPress={() => vm.setFilter(f.id)}
                  style={[
                    styles.filter,
                    {
                      backgroundColor: selected ? theme.text : theme.surface,
                      borderColor: selected ? theme.text : 'transparent',
                    },
                  ]}>
                  <AppText variant="label" style={{ color: selected ? theme.bg : theme.textMuted }}>
                    {f.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>
      }
      ListEmptyComponent={
        vm.loaded ? (
          <EmptyState icon="activity" title="No transactions" text="Nothing matches this filter yet." />
        ) : (
          <ActivityIndicator color={theme.primary} style={styles.loading} />
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxl, gap: space.sm },
  header: { gap: space.md, marginBottom: space.xs },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  filter: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: space.md,
    borderWidth: 1,
    borderRadius: radius.pill,
  },
  loading: { marginTop: space.xxl },
});
