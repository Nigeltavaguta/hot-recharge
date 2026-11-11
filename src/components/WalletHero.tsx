import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { StockAccount, User } from '@/models';
import { palette, radius, space } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';
import { formatMoney, greeting, relativeTime } from '@/utils/format';

import { AppText } from './AppText';
import { Icon } from './Icon';

const GLASS = 'rgba(255,255,255,0.16)';
const DIM = '#FFD9D5';

/**
 * Colours for the very top of the hero, where the greeting row sits.
 * Light mode fades down from near-white (so that row uses dark text);
 * dark mode fades down from the dark page colour (so it uses light text).
 */
const TOP = {
  light: { tint: '#FFF4F2', text: '#1B1B1F', muted: '#4A2320', button: 'rgba(255,255,255,0.7)', icon: palette.redDark },
  dark: { tint: '#16161A', text: '#FFFFFF', muted: '#E0C9C6', button: GLASS, icon: palette.white },
} as const;

interface WalletHeroProps {
  user: User | null;
  /** The first account is shown large; the next two as tiles. */
  accounts: StockAccount[];
  hidden: boolean;
  refreshing: boolean;
  onToggleHidden: () => void;
  onRefresh: () => void;
  onViewBalances: () => void;
  unreadCount: number;
  onOpenNotifications: () => void;
}

/** The top of the home screen: greeting, main balance and other balances. */
export function WalletHero({
  user,
  accounts,
  hidden,
  refreshing,
  onToggleHidden,
  onRefresh,
  onViewBalances,
  unreadCount,
  onOpenNotifications,
}: WalletHeroProps) {
  const insets = useSafeAreaInsets();
  const top = useTheme().dark ? TOP.dark : TOP.light;
  const main = accounts[0] ?? null;
  const others = accounts.slice(1, 3);

  // Split "USD 128.45" so the cents can be shown dimmer than the whole amount.
  const [whole, cents] = main ? formatMoney(main.balance, main.currency).split('.') : ['—', ''];

  return (
    <View
      style={[
        styles.hero,
        {
          paddingTop: insets.top + space.md,
          backgroundColor: palette.red,
          // Pale (or dark, in dark mode) at the very top, turning red by the time the balance starts.
          backgroundImage: `linear-gradient(180deg, ${top.tint} 0%, ${palette.red} 34%, ${palette.red} 100%)`,
        },
      ]}>
      <View style={styles.topRow}>
        <View style={styles.avatar}>
          <AppText variant="heading" tone="onPrimary">
            {user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` : ''}
          </AppText>
        </View>
        <View style={styles.flex}>
          <AppText variant="caption" style={{ color: top.muted }}>
            {greeting()}
          </AppText>
          <AppText variant="heading" style={{ color: top.text }} numberOfLines={1}>
            {user?.firstName || 'HOT account'}
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
          hitSlop={8}
          onPress={onOpenNotifications}
          style={[styles.roundButton, { backgroundColor: top.button }]}>
          <Icon name="bell" size={20} color={top.icon} />
          {unreadCount > 0 && <View style={styles.badge} />}
        </Pressable>
      </View>

      <View style={styles.balance}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={hidden ? 'Show balance' : 'Hide balance'}
          hitSlop={12}
          onPress={onToggleHidden}
          style={styles.inlineButton}>
          <AppText variant="caption" style={styles.dim}>
            {main?.name ?? 'Balance'}
          </AppText>
          <Icon name={hidden ? 'eye' : 'eyeOff'} size={16} color={DIM} />
        </Pressable>

        {hidden || !main ? (
          <AppText tone="onPrimary" style={styles.amount}>
            {main ? `${main.currency} ••••••` : '—'}
          </AppText>
        ) : (
          <AppText
            tone="onPrimary"
            style={styles.amount}
            numberOfLines={1}
            adjustsFontSizeToFit
            accessibilityLabel={formatMoney(main.balance, main.currency)}>
            {whole}
            <AppText style={[styles.amount, styles.dim]}>.{cents}</AppText>
          </AppText>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Refresh balance"
          hitSlop={12}
          disabled={refreshing}
          onPress={onRefresh}
          style={[styles.inlineButton, styles.refreshPill]}>
          <AppText variant="caption" tone="onPrimary">
            {main ? `Updated ${relativeTime(main.updatedAt).toLowerCase()}` : 'Loading balance…'}
          </AppText>
          {refreshing ? (
            <ActivityIndicator size="small" color={palette.white} style={styles.spinner} />
          ) : (
            <Icon name="refresh" size={14} color={palette.white} />
          )}
        </Pressable>
      </View>

      {others.length > 0 && (
        <View style={styles.tiles}>
          {others.map((account) => (
            <Pressable
              key={account.id}
              accessibilityRole="button"
              accessibilityLabel={`${account.name}. View all balances`}
              onPress={onViewBalances}
              style={styles.tile}>
              <AppText variant="caption" style={styles.dim} numberOfLines={1}>
                {account.name}
              </AppText>
              <AppText variant="heading" tone="onPrimary" numberOfLines={1} adjustsFontSizeToFit>
                {hidden ? `${account.currency} ••••` : formatMoney(account.balance, account.currency)}
              </AppText>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingHorizontal: space.lg,
    paddingBottom: space.lg,
    gap: space.xl,
    overflow: 'hidden',
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.red,
    marginRight: space.xs,
  },
  roundButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: palette.flame,
    borderWidth: 1.5,
    borderColor: palette.white,
  },
  balance: { alignItems: 'center', gap: space.xs },
  inlineButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  amount: { fontSize: 38, lineHeight: 46, fontWeight: '800' },
  refreshPill: { minHeight: 28, paddingHorizontal: space.md, borderRadius: radius.pill, backgroundColor: GLASS },
  spinner: { transform: [{ scale: 0.7 }] },
  tiles: { flexDirection: 'row', gap: space.sm },
  tile: { flex: 1, gap: 2, padding: space.md, borderRadius: radius.xl, backgroundColor: GLASS },
  dim: { color: DIM },
});
