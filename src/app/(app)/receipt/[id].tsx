import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card, DetailRow, EmptyState, Notice } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { TokenCard, codeOf, shareTransaction } from '@/components/TokenCard';
import { STATUS_ICON, STATUS_LABEL, statusColors } from '@/components/TransactionRow';
import type { Transaction } from '@/models';
import { openPurchase } from '@/state/purchaseSheet';
import { radius, space } from '@/theme/colors';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';
import { formatDateTime, formatMoney } from '@/utils/format';
import { useTransactionDetails } from '@/viewmodels/useWalletViewModel';

const HEADLINE: Record<Transaction['status'], string> = {
  success: 'Purchase successful',
  pending: 'Purchase pending',
  failed: 'Purchase failed',
};

function buyAgain(tx: Transaction) {
  const digits = tx.recipient.replace(/\D/g, '');
  openPurchase(tx.type === 'zesa' ? 'zesa' : tx.type === 'bundle' ? 'bundle' : 'airtime', digits);
}

export default function ReceiptScreen() {
  const { id, fresh } = useLocalSearchParams<{ id: string; fresh?: string }>();
  const detail = useTransactionDetails(id);
  const tx = detail.tx;
  const theme = useTheme();

  if (!tx) {
    return (
      <Screen>
        {detail.loading && <ActivityIndicator color={theme.primary} />}
        {detail.error && (
          <>
            <Notice tone="danger" text={detail.error} />
            <Button label="Retry receipt" onPress={detail.retry} />
          </>
        )}
        {!detail.loading && (
          <EmptyState icon="info" title="Receipt not found" text="This transaction is no longer available." />
        )}
        <Button label="Back to home" variant="outline" onPress={() => router.dismissAll()} />
      </Screen>
    );
  }

  const colors = statusColors(theme, tx.status);
  const canRepeat = tx.type !== 'payment' && tx.status !== 'pending';
  const canShare = tx.status === 'success';
  const total = tx.amount + tx.fee;

  return (
    <Screen>
      {tx.demonstration && (
        <Notice tone="warning" text="DEMONSTRATION receipt — simulated transaction, token or PIN. No real money." />
      )}
      {detail.error && <Notice tone="danger" text={detail.error} />}

      {/* Outcome first: status, then how much, then what it was for. */}
      <View style={styles.summary}>
        <View style={[styles.statusIcon, { backgroundColor: colors.bg }]}>
          <Icon name={STATUS_ICON[tx.status]} size={40} color={colors.solid} />
        </View>
        <AppText variant="label" style={{ color: colors.fg }}>
          {HEADLINE[tx.status]}
        </AppText>
        <AppText style={[styles.amount, tx.status === 'failed' && { color: theme.textFaint }]}>
          {formatMoney(total, tx.currency)}
        </AppText>
        <AppText tone="muted" center>
          {tx.message ?? `${tx.title} for ${tx.recipient}`}
        </AppText>
      </View>

      {codeOf(tx) && <TokenCard tx={tx} />}

      <Card style={styles.details}>
        <DetailRow label="Item" value={tx.title} />
        <DetailRow label="For" value={tx.recipient} />
        <DetailRow label="Amount" value={formatMoney(tx.amount, tx.currency)} />
        {tx.fee > 0 && <DetailRow label="Fee" value={formatMoney(tx.fee, tx.currency)} />}
        {tx.units && <DetailRow label="Units" value={tx.units} />}
        <DetailRow label="Status" value={STATUS_LABEL[tx.status]} />
        <DetailRow label="Reference" value={tx.reference} />
        <DetailRow label="Date" value={formatDateTime(tx.date)} />
      </Card>

      <View style={styles.actions}>
        {tx.status === 'pending' && (
          <Button label="Check purchase status" icon="refresh" loading={detail.loading} onPress={detail.verify} />
        )}
        {(canShare || canRepeat) && (
          <View style={styles.actionRow}>
            {canShare && (
              <Button
                label="Share"
                variant="outline"
                icon="share"
                onPress={() => shareTransaction(tx)}
                style={styles.flex}
              />
            )}
            {canRepeat && (
              <Button
                label={tx.status === 'failed' ? 'Try again' : 'Buy again'}
                variant="outline"
                icon="repeat"
                onPress={() => buyAgain(tx)}
                style={styles.flex}
              />
            )}
          </View>
        )}
        {fresh === '1' && <Button label="Done" onPress={() => router.dismissAll()} />}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  summary: { alignItems: 'center', gap: space.xs, paddingTop: space.sm },
  statusIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
  },
  amount: { fontSize: 34, lineHeight: 42, fontFamily: fonts.extrabold },
  details: { borderRadius: radius.xl },
  actions: { gap: space.md },
  actionRow: { flexDirection: 'row', gap: space.md },
});
