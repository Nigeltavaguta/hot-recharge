import * as Clipboard from 'expo-clipboard';
import { useEffect, useState } from 'react';
import { Pressable, Share, StyleSheet, View } from 'react-native';

import type { Transaction } from '@/models';
import { radius, space } from '@/theme/colors';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';
import { formatDateTime, formatMoney, formatToken, relativeTime } from '@/utils/format';

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

/** A token or PIN: who it is for, the code in large digits, and a one-tap share. */
export function TokenCard({ tx, onPress }: TokenCardProps) {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);
  const code = codeOf(tx);

  // Switch the button back from "Copied" after a moment.
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  if (!code) return null;

  async function copy() {
    // Tokens are copied as plain digits (no spaces) so they paste cleanly anywhere.
    await Clipboard.setStringAsync(tx.token ?? tx.pin ?? '');
    setCopied(true);
  }

  const isToken = !!tx.token;
  const tint = isToken ? { bg: theme.warningSoft, fg: theme.warning } : { bg: theme.accentSoft, fg: theme.accent };
  const facts = [tx.units, formatMoney(tx.amount, tx.currency)].filter(Boolean).join(' · ');

  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${code.label} for ${tx.recipient}: ${code.value}`}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: pressed && onPress ? theme.surfaceAlt : theme.surface },
      ]}>
      <View style={styles.top}>
        <View style={[styles.icon, { backgroundColor: tint.bg }]}>
          <Icon name={isToken ? 'zesa' : 'tokens'} size={20} color={tint.fg} />
        </View>
        <View style={styles.flex}>
          <AppText variant="label" numberOfLines={1}>
            {tx.recipient}
          </AppText>
          <AppText variant="caption" tone="faint" numberOfLines={1}>
            {tx.demonstration ? 'Demo ' : ''}
            {code.label} · {relativeTime(tx.date)}
          </AppText>
        </View>
        {onPress && <Icon name="chevronRight" size={16} color={theme.textFaint} />}
      </View>

      {/* The code sits in its own box, sized to stay on one line so it is easy to read out. */}
      <View style={[styles.codeBox, { backgroundColor: theme.surfaceAlt }]}>
        <AppText selectable numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} style={styles.code}>
          {code.value}
        </AppText>
      </View>

      <View style={styles.bottom}>
        <AppText variant="label" tone="muted" numberOfLines={1} style={styles.flex}>
          {facts}
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copied ? `${code.label} copied` : `Copy ${code.label}`}
          hitSlop={10}
          onPress={copy}
          style={({ pressed }) => [
            styles.share,
            { backgroundColor: copied ? theme.successSoft : theme.surfaceAlt },
            pressed && styles.pressed,
          ]}>
          <Icon name={copied ? 'check' : 'copy'} size={16} color={copied ? theme.successText : theme.text} />
          <AppText variant="label" tone={copied ? 'success' : 'default'}>
            {copied ? 'Copied' : 'Copy'}
          </AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Share ${code.label}`}
          hitSlop={10}
          onPress={() => shareTransaction(tx)}
          style={({ pressed }) => [styles.share, { backgroundColor: theme.primarySoft }, pressed && styles.pressed]}>
          <Icon name="share" size={16} color={theme.link} />
          <AppText variant="label" tone="link">
            Share
          </AppText>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.xl, padding: 14, gap: space.md },
  flex: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  codeBox: {
    minHeight: 56,
    borderRadius: radius.lg,
    paddingHorizontal: space.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  code: {
    fontSize: 22,
    lineHeight: 30,
    fontFamily: fonts.extrabold,
    letterSpacing: 1,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  bottom: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  share: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
  },
  pressed: { opacity: 0.6 },
});
