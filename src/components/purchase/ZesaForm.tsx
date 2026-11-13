import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AmountPicker } from '@/components/AmountPicker';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Notice } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { PurchaseFooter } from '@/components/PurchaseFooter';
import { TextField } from '@/components/TextField';
import { radius, space } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';
import { METER_LENGTH } from '@/utils/phone';
import { useZesaViewModel } from '@/viewmodels/useZesaViewModel';

import { SheetBody } from './SheetBody';
import { ProductPicker } from './ProductPicker';

export function ZesaForm({ prefill }: { prefill?: string }) {
  const vm = useZesaViewModel(prefill);
  const theme = useTheme();

  return (
    <SheetBody
      footer={
        <PurchaseFooter
          totalLabel="Total (incl. fee)"
          total={vm.total}
          currency={vm.catalogue.selected?.currency}
          buttonLabel="Continue"
          disabled={vm.verifying}
          onPress={vm.submit}
        />
      }>
      <ProductPicker {...vm.catalogue} />
      <TextField
        label="Meter number"
        icon="zesa"
        placeholder="45217893412"
        keyboardType="number-pad"
        maxLength={METER_LENGTH}
        value={vm.meter}
        onChangeText={vm.setMeter}
        error={vm.errors.meter}
        hint={`${vm.meter.length}/${METER_LENGTH} digits. We check the meter for you.`}
        right={vm.verifying ? <ActivityIndicator size="small" color={theme.primary} /> : undefined}
      />

      {vm.customer && (
        <View style={[styles.customer, { backgroundColor: theme.successSoft }]}>
          <Icon name="success" size={22} color={theme.successText} />
          <View style={styles.flex}>
            <AppText variant="caption" tone="success">
              METER VERIFIED
            </AppText>
            <AppText variant="heading">{vm.customer.name}</AppText>
            <AppText tone="muted">{vm.customer.address}</AppText>
          </View>
        </View>
      )}

      {vm.verifyError && (
        <>
          <Notice tone="danger" text={vm.verifyError} />
          <Button label="Check again" variant="outline" icon="refresh" onPress={vm.retryVerify} />
        </>
      )}

      <AmountPicker
        currency={vm.catalogue.selected?.currency}
        value={vm.amountText}
        onChange={vm.setAmountText}
        error={vm.errors.amount}
      />

      <TextField
        label="Mobile number to notify"
        icon="airtime"
        placeholder="0772345678"
        keyboardType="phone-pad"
        value={vm.notifyNumber}
        onChangeText={vm.setNotifyNumber}
        error={vm.errors.notifyNumber}
      />
    </SheetBody>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  customer: { flexDirection: 'row', gap: space.md, padding: space.lg, borderRadius: radius.lg },
});
