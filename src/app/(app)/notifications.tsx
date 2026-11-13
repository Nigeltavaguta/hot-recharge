import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Card, EmptyState, Notice } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { useStore } from '@/state/createStore';
import { markNotificationsRead, refreshWallet, walletStore } from '@/state/walletStore';
import { radius, space } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';
import { relativeTime } from '@/utils/format';

export default function NotificationsScreen() {
  const theme = useTheme();
  const notifications = useStore(walletStore, (s) => s.notifications);
  const loading = useStore(walletStore, (s) => s.loading);
  const loaded = useStore(walletStore, (s) => s.loaded);
  const error = useStore(walletStore, s => s.error);

  // Remember which ones were unread on arrival, so they stay highlighted while the user reads them.
  const [unreadOnOpen] = useState(() => new Set(notifications.filter((n) => !n.read).map((n) => n.id)));

  useEffect(() => {
    markNotificationsRead();
  }, []);

  return (
    <Screen refreshing={loading && loaded} onRefresh={refreshWallet}>
      {!loaded && <ActivityIndicator color={theme.primary} />}
      {error && <Notice tone="danger" text={error} />}

      {notifications.map((n) => {
        const unread = unreadOnOpen.has(n.id);
        return (
          <Card key={n.id} style={styles.row}>
            <View style={[styles.icon, { backgroundColor: unread ? theme.primarySoft : theme.surfaceAlt }]}>
              <Icon name="bell" size={18} color={unread ? theme.primary : theme.textFaint} />
            </View>
            <View style={styles.body}>
              <View style={styles.titleRow}>
                <AppText variant={unread ? 'heading' : 'label'} style={styles.flex}>
                  {n.title}
                </AppText>
                <AppText variant="caption" tone="faint">
                  {relativeTime(n.date)}
                </AppText>
                {/* Unread is marked with a dot as well as bolder text, so it does not rely on colour. */}
                {unread && <View accessibilityLabel="Unread" style={[styles.dot, { backgroundColor: theme.primary }]} />}
              </View>
              <AppText tone="muted">{n.body}</AppText>
            </View>
          </Card>
        );
      })}

      {loaded && notifications.length === 0 && (
        <EmptyState icon="bell" title="No notifications" text="Updates about your purchases will appear here." />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: space.md, borderRadius: radius.xl, padding: space.lg },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: space.xs },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
