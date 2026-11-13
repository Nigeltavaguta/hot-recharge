import Constants from 'expo-constants';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { ListRow } from '@/components/ListRow';
import { Screen } from '@/components/Screen';
import { useTabBarSpace } from '@/components/TabBar';
import { api } from '@/services';
import { useStore } from '@/state/createStore';
import { closePurchase } from '@/state/purchaseSheet';
import { sessionStore, signOut } from '@/state/sessionStore';
import { resetWallet, walletStore } from '@/state/walletStore';
import { palette, radius, space } from '@/theme/colors';

export default function ProfileScreen() {
  const user = useStore(sessionStore, (s) => s.user);
  const notifications = useStore(walletStore, (s) => s.notifications);
  const accounts = useStore(walletStore, (s) => s.accounts);
  const tabBarSpace = useTabBarSpace();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  function handleSignOut() {
    closePurchase();
    resetWallet();
    signOut();
    void api.logout().catch(() => { /* Local credentials are cleared even if server is unreachable. */ });
  }

  if (!user) return null;

  const fullName = `${user.firstName} ${user.lastName}`.trim() || 'HOT account';
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase() || 'H';
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <Screen padTop bottomSpace={tabBarSpace}>
      <View style={styles.person}>
        <View style={styles.avatar}>
          <AppText variant="display" tone="onPrimary">
            {initials}
          </AppText>
        </View>
        <AppText variant="title" center>
          {fullName}
        </AppText>
        <AppText tone="muted" center>
          {user.mobile}
        </AppText>
      </View>

      <View style={styles.group}>
        <AppText variant="label" tone="faint" style={styles.groupTitle}>
          Wallet
        </AppText>
        <Card style={styles.list}>
          <ListRow
            icon="wallet"
            label="Balances"
            value={accounts.length > 0 ? `${accounts.length} accounts` : undefined}
            onPress={() => router.push('/balances')}
          />
          <ListRow
            icon="bell"
            label="Notifications"
            value={unread > 0 ? `${unread} new` : undefined}
            onPress={() => router.push('/notifications')}
            last
          />
        </Card>
      </View>

      <View style={styles.group}>
        <AppText variant="label" tone="faint" style={styles.groupTitle}>
          Account
        </AppText>
        <Card style={styles.list}>
          <ListRow icon="profile" label="Account ID" value={user.accountId} />
          <ListRow icon="airtime" label="Mobile" value={user.mobile} />
          <ListRow icon="mail" label="Email" value={user.email} last />
        </Card>
      </View>

      <Card style={styles.list}>
        <ListRow icon="logout" label="Sign out" danger onPress={handleSignOut} last />
      </Card>

      <AppText variant="caption" tone="faint" center>
        HOT-{user.accountId}-{version}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  person: { alignItems: 'center', gap: space.xs, paddingVertical: space.md },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.red,
    marginBottom: space.sm,
  },
  group: { gap: space.sm },
  groupTitle: { marginLeft: space.xs },
  // Rows bring their own spacing, so the card itself has none; overflow keeps the press highlight inside the corners.
  list: { padding: 0, borderRadius: radius.xl, overflow: 'hidden' },
});
