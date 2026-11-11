import { StyleSheet, View } from 'react-native';

import { AmountPicker } from '@/components/AmountPicker';
import { AppText } from '@/components/AppText';
import { NetworkSelector } from '@/components/NetworkSelector';
import { PurchaseFooter } from '@/components/PurchaseFooter';
import { TextField } from '@/components/TextField';
import { space } from '@/theme/colors';
import { useAirtimeViewModel } from '@/viewmodels/useAirtimeViewModel';

import { SheetBody } from './SheetBody';
import { ProductPicker } from './ProductPicker';

export function AirtimeForm({ prefill }: { prefill?: string }) {
  const vm = useAirtimeViewModel(prefill);

  return (
    <SheetBody footer={<PurchaseFooter total={vm.total} buttonLabel="Continue" onPress={vm.submit} />}>
      <TextField
        label="Mobile number"
        icon="airtime"
        placeholder="0772345678"
        keyboardType="phone-pad"
        value={vm.number}
        onChangeText={vm.setNumber}
        error={vm.errors.number}
        hint="The network is picked automatically from the number."
      />

      <View style={styles.group}>
        <AppText variant="label" tone="muted">
          Network
        </AppText>
        <NetworkSelector value={vm.network} onChange={vm.setNetwork} />
        {vm.errors.network && (
          <AppText variant="caption" tone="danger">
            {vm.errors.network}
          </AppText>
        )}
      </View>

      <ProductPicker {...vm.catalogue} />
      <AmountPicker currency={vm.catalogue.selected?.currency} value={vm.amountText} onChange={vm.setAmountText} error={vm.errors.amount} />
    </SheetBody>
  );
}

const styles = StyleSheet.create({
  group: { gap: space.sm },
});
