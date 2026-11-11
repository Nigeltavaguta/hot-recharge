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
import { space } from '@/theme/colors';
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
        {detail.loading && <ActivityIndicator />}
        {detail.error && <><Notice tone="danger" text={detail.error} /><Button label="Retry receipt" onPress={detail.retry} /></>}
        <EmptyState icon="info" title="Receipt not found" text="This transaction is no longer available." />
        <Button label="Back to home" onPress={() => router.dismissAll()} />
      </Screen>
    );
  }

  const colors = statusColors(theme, tx.status);
  const canRepeat = tx.type !== 'payment' && tx.status !== 'pending';

  return (
    <Screen>
      {tx.demonstration && <Notice tone="warning" text="DEMONSTRATION receipt — simulated transaction, token or PIN. No real money." />}
      {detail.error && <Notice tone="danger" text={detail.error} />}
      <View style={styles.status}>
        <Icon name={STATUS_ICON[tx.status]} size={64} color={colors.solid} />
        <AppText variant="title" center>
          {HEADLINE[tx.status]}
        </AppText>
        <AppText tone="muted" center>
          {tx.message ?? `${tx.title} for ${tx.recipient}`}
        </AppText>
      </View>

      {codeOf(tx) && <TokenCard tx={tx} />}

      <Card>
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
        {tx.status === 'pending' && <Button label="Check purchase status" loading={detail.loading} onPress={detail.verify} />}
        {tx.status === 'success' && (
          <Button label="Share receipt" variant="outline" icon="share" onPress={() => shareTransaction(tx)} />
        )}
        {canRepeat && (
          <Button
            label={tx.status === 'failed' ? 'Try again' : 'Buy again'}
            variant="outline"
            icon="repeat"
            onPress={() => buyAgain(tx)}
          />
        )}
        {fresh === '1' && <Button label="Done" onPress={() => router.dismissAll()} />}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  status: { alignItems: 'center', gap: space.sm, paddingTop: space.md },
  actions: { gap: space.md },
});
