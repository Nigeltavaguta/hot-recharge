import Constants from 'expo-constants';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card, DetailRow } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { useTabBarSpace } from '@/components/TabBar';
import { useStore } from '@/state/createStore';
import { sessionStore, signOut } from '@/state/sessionStore';
import { resetWallet } from '@/state/walletStore';
import { space } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';

export default function ProfileScreen() {
  const user = useStore(sessionStore, (s) => s.user);
  const theme = useTheme();
  const tabBarSpace = useTabBarSpace();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  function handleSignOut() {
    resetWallet();
    signOut();
  }

  if (!user) return null;

  return (
    <Screen padTop bottomSpace={tabBarSpace}>
      <AppText variant="title">Profile</AppText>

      <Card style={styles.person}>
        <View style={[styles.avatar, { backgroundColor: theme.primarySoft }]}>
          <AppText variant="title" tone="link">
            {user.firstName.charAt(0)}
            {user.lastName.charAt(0)}
          </AppText>
        </View>
        <View style={styles.flex}>
          <AppText variant="heading">
            {user.firstName} {user.lastName}
          </AppText>
          <AppText tone="muted">{user.mobile}</AppText>
        </View>
      </Card>

      <Card>
        <DetailRow label="Account ID" value={user.accountId} />
        <DetailRow label="Email" value={user.email} />
        <DetailRow label="Mobile" value={user.mobile} />
      </Card>

      <Card onPress={() => router.push('/balances')} accessibilityLabel="View all balances" style={styles.link}>
        <Icon name="wallet" size={22} color={theme.accent} />
        <AppText variant="label" style={styles.flex}>
          All balances
        </AppText>
        <Icon name="chevronRight" size={16} color={theme.textFaint} />
      </Card>

      <Button label="Sign out" variant="outline" icon="logout" onPress={handleSignOut} />

      <AppText variant="caption" tone="faint" center>
        HOT-{user.accountId}-{version}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  person: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  link: { flexDirection: 'row', alignItems: 'center', gap: space.md },
});
