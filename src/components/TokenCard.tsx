import { Pressable, Share, StyleSheet, View } from 'react-native';

import type { Transaction } from '@/models';
import { palette, radius, space } from '@/theme/colors';
import { formatDateTime, formatMoney, formatToken } from '@/utils/format';

import { AppText } from './AppText';
import { Icon } from './Icon';

/** The code a customer needs from a purchase: a ZESA token or a voucher PIN. */
export function codeOf(tx: Transaction): { label: string; value: string } | null {
  if (tx.token) return { label: 'Electricity token', value: formatToken(tx.token) };
  if (tx.pin) return { label: 'PIN', value: tx.pin };
  return null;
}

export async function shareTransaction(tx: Transaction): Promise<void> {
  const code = codeOf(tx);
  const lines = [
    `${tx.demonstration ? 'DEMONSTRATION - ' : ''}HOT Recharge - ${tx.title}`,
    code ? `${code.label}: ${code.value}` : null,
    tx.units ? `Units: ${tx.units}` : null,
    `For: ${tx.recipient}`,
    `Amount: ${formatMoney(tx.amount, tx.currency)}`,
    `Ref: ${tx.reference}`,
    formatDateTime(tx.date),
  ].filter(Boolean);
  try {
    await Share.share({ message: lines.join('\n') });
  } catch {
    // The user closed the share sheet; nothing to do.
  }
}

interface TokenCardProps {
  tx: Transaction;
  /** Opens the full receipt. Omit on the receipt screen itself. */
  onPress?: () => void;
}

/** Large, high-contrast display of a token or PIN with a one-tap share. */
export function TokenCard({ tx, onPress }: TokenCardProps) {
  const code = codeOf(tx);
  if (!code) return null;

  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${code.label} for ${tx.recipient}: ${code.value}`}
      style={styles.card}>
      <View style={styles.top}>
        <View style={styles.flex}>
          <AppText variant="caption" style={styles.dim}>
            {tx.demonstration ? 'DEMO ' : ''}{code.label.toUpperCase()}
          </AppText>
          <AppText variant="label" tone="onPrimary" numberOfLines={1}>
            {tx.recipient}
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Share ${code.label}`}
          hitSlop={10}
          onPress={() => shareTransaction(tx)}
          style={styles.share}>
          <Icon name="share" size={16} color={palette.white} />
          <AppText variant="label" tone="onPrimary">
            Share
          </AppText>
        </Pressable>
      </View>

      <AppText selectable tone="onPrimary" style={styles.code}>
        {code.value}
      </AppText>

      <View style={styles.bottom}>
        <AppText variant="caption" style={styles.dim}>
          {[tx.units, formatMoney(tx.amount, tx.currency)].filter(Boolean).join(' · ')}
        </AppText>
        <AppText variant="caption" style={styles.dim}>
          {formatDateTime(tx.date)}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#26262B', borderRadius: radius.xl, padding: space.lg, gap: space.md },
  flex: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  share: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  code: { fontSize: 22, lineHeight: 30, fontWeight: '800', letterSpacing: 1, fontVariant: ['tabular-nums'] },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', gap: space.md },
  dim: { color: '#C4C4CB' },
});
