import { StyleSheet, View } from 'react-native';

import type { Transaction, TxnStatus, TxnType } from '@/models';
import { radius, space, type Theme } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';
import { formatMoney, relativeTime } from '@/utils/format';

import { AppText } from './AppText';
import { Card } from './Card';
import { Icon, type IconName } from './Icon';

const TYPE_ICON: Record<TxnType, IconName> = {
  airtime: 'airtime',
  bundle: 'bundle',
  zesa: 'zesa',
  payment: 'payment',
};

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

export function TransactionRow({ tx, onPress }: { tx: Transaction; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Card
      onPress={onPress}
      accessibilityLabel={`${tx.title}, ${formatMoney(tx.amount, tx.currency)}, ${STATUS_LABEL[tx.status]}`}
      style={styles.row}>
      <View style={[styles.icon, { backgroundColor: theme.accentSoft }]}>
        <Icon name={TYPE_ICON[tx.type]} size={20} color={theme.accent} />
      </View>
      <View style={styles.middle}>
        <AppText variant="label" numberOfLines={1}>
          {tx.title}
        </AppText>
        <AppText variant="caption" tone="faint" numberOfLines={1}>
          {tx.recipient} · {relativeTime(tx.date)}
        </AppText>
      </View>
      <View style={styles.end}>
        <AppText variant="label">{formatMoney(tx.amount, tx.currency)}</AppText>
        <StatusPill status={tx.status} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.lg, paddingHorizontal: 14 },
  icon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  middle: { flex: 1, gap: 4 },
  end: { alignItems: 'flex-end', gap: 6 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
});
