import { StyleSheet, View } from 'react-native';

import type { Transaction, TxnStatus, TxnType } from '@/models';
import { radius, space, type Theme } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';
import { formatMoney, formatTime, relativeTime } from '@/utils/format';

import { AppText } from './AppText';
import { Card } from './Card';
import { Icon, type IconName } from './Icon';

const TYPE_ICON: Record<TxnType, IconName> = {
  airtime: 'airtime',
  bundle: 'bundle',
  zesa: 'zesa',
  payment: 'payment',
};

/** Each product has its own soft colour, the same one used on the Home buy buttons. */
export function typeTint(theme: Theme, type: TxnType): { bg: string; fg: string } {
  switch (type) {
    case 'airtime':
      return { bg: theme.primarySoft, fg: theme.primary };
    case 'bundle':
      return { bg: theme.accentSoft, fg: theme.accent };
    case 'zesa':
      return { bg: theme.warningSoft, fg: theme.warning };
    case 'payment':
      return { bg: theme.successSoft, fg: theme.success };
  }
}

export const STATUS_LABEL: Record<TxnStatus, string> = {
  success: 'Successful',
  pending: 'Pending',
  failed: 'Failed',
};

export const STATUS_ICON: Record<TxnStatus, IconName> = {
  success: 'success',
  pending: 'pending',
  failed: 'failed',
};

export function statusColors(theme: Theme, status: TxnStatus): { bg: string; fg: string; solid: string } {
  switch (status) {
    case 'success':
      return { bg: theme.successSoft, fg: theme.successText, solid: theme.success };
    case 'pending':
      return { bg: theme.warningSoft, fg: theme.warningText, solid: theme.warning };
    case 'failed':
      return { bg: theme.dangerSoft, fg: theme.dangerText, solid: theme.danger };
  }
}

/** Status shown with an icon and a word, never by colour alone. */
export function StatusPill({ status }: { status: TxnStatus }) {
  const theme = useTheme();
  const colors = statusColors(theme, status);
  return (
    <View style={[styles.pill, { backgroundColor: colors.bg }]}>
      <Icon name={STATUS_ICON[status]} size={12} color={colors.fg} />
      <AppText variant="caption" style={{ color: colors.fg }}>
        {STATUS_LABEL[status]}
      </AppText>
    </View>
  );
}

interface TransactionRowProps {
  tx: Transaction;
  onPress: () => void;
  /** Show the clock time instead of "2h ago". Use in lists already grouped by day. */
  showTime?: boolean;
}

export function TransactionRow({ tx, onPress, showTime }: TransactionRowProps) {
  const theme = useTheme();
  const tint = typeTint(theme, tx.type);
  const failed = tx.status === 'failed';

  return (
    <Card
      onPress={onPress}
      accessibilityLabel={`${tx.title}, ${formatMoney(tx.amount, tx.currency)}, ${STATUS_LABEL[tx.status]}`}
      style={styles.row}>
      <View style={[styles.icon, { backgroundColor: tint.bg }]}>
        <Icon name={TYPE_ICON[tx.type]} size={20} color={tint.fg} />
      </View>
      <View style={styles.middle}>
        <AppText variant="label" numberOfLines={1}>
          {tx.title}
        </AppText>
        <AppText variant="caption" tone="faint" numberOfLines={1}>
          {tx.recipient} · {showTime ? formatTime(tx.date) : relativeTime(tx.date)}
        </AppText>
      </View>
      <View style={styles.end}>
        {/* A failed purchase took no money, so its amount is shown muted and crossed out. */}
        <AppText variant="label" tone={failed ? 'faint' : 'default'} style={failed && styles.struck}>
          {formatMoney(tx.amount, tx.currency)}
        </AppText>
        <StatusPill status={tx.status} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.lg, paddingHorizontal: 14 },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  middle: { flex: 1, gap: 4 },
  end: { alignItems: 'flex-end', gap: 6 },
  struck: { textDecorationLine: 'line-through' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
});
