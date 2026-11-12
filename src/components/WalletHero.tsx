import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { StockAccount, User } from '@/models';
import { palette, radius, space } from '@/theme/colors';
import { fonts } from '@/theme/fonts';
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
  light: { tint: '#FFF4F2', text: '#1B1B1F', muted: '#4A2320', button: '#FFFFFF', icon: '#1B1B1F' },
  dark: { tint: '#16161A', text: '#FFFFFF', muted: '#E0C9C6', button: '#2C2C33', icon: '#FFFFFF' },
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
  onOpenProfile: () => void;
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
  onOpenProfile,
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
        {/* The whole greeting, not only the circle, opens the profile. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open your profile"
          onPress={onOpenProfile}
          style={({ pressed }) => [styles.person, pressed && styles.pressed]}>
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
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
          hitSlop={8}
          onPress={onOpenNotifications}
          style={({ pressed }) => [styles.roundButton, { backgroundColor: top.button }, pressed && styles.pressed]}>
          <Icon name="bell" size={22} color={top.icon} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <AppText style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</AppText>
            </View>
          )}
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
  },
  person: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.md },
  pressed: { opacity: 0.6 },
  // Same size as the avatar and fully solid, so the two ends of the row balance.
  roundButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#1B1B1F',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  // Unread count, sitting on the rim of the button and overhanging it slightly.
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.red,
    borderWidth: 2,
    borderColor: palette.white,
  },
  badgeText: { fontSize: 11, lineHeight: 14, fontFamily: fonts.bold, color: palette.white },
  balance: { alignItems: 'center', gap: space.xs },
  inlineButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  amount: { fontSize: 38, lineHeight: 46, fontFamily: fonts.extrabold },
  refreshPill: { minHeight: 28, paddingHorizontal: space.md, borderRadius: radius.pill, backgroundColor: GLASS },
  spinner: { transform: [{ scale: 0.7 }] },
  tiles: { flexDirection: 'row', gap: space.sm },
  tile: { flex: 1, gap: 2, padding: space.md, borderRadius: radius.xl, backgroundColor: GLASS },
  dim: { color: DIM },
});
