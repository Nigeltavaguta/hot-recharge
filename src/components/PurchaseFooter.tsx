import { StyleSheet, View } from 'react-native';

import { formatMoney } from '@/utils/format';

import { AppText } from './AppText';
import { Button } from './Button';

interface PurchaseFooterProps {
  totalLabel?: string;
  total: number;
  buttonLabel: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

/** Pinned bar that always shows what the purchase will cost next to the action button. */
export function PurchaseFooter({ totalLabel = 'Total', total, buttonLabel, onPress, loading, disabled }: PurchaseFooterProps) {
  return (
    <>
      <View style={styles.row}>
        <AppText tone="muted">{totalLabel}</AppText>
        <AppText variant="heading">{formatMoney(total)}</AppText>
      </View>
      <Button label={buttonLabel} onPress={onPress} loading={loading} disabled={disabled} />
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
