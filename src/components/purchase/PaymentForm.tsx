import { AmountPicker } from '@/components/AmountPicker';
import { Notice } from '@/components/Card';
import { PurchaseFooter } from '@/components/PurchaseFooter';
import { TextField } from '@/components/TextField';
import { usePaymentViewModel } from '@/viewmodels/usePaymentViewModel';

import { ProductPicker } from './ProductPicker';
import { SheetBody } from './SheetBody';

export function PaymentForm() {
  const vm = usePaymentViewModel();
  const currency = vm.catalogue.selected?.currency;

  return (
    <SheetBody
      footer={<PurchaseFooter total={vm.total} currency={currency} buttonLabel="Continue" onPress={vm.submit} />}>
      <ProductPicker {...vm.catalogue} />

      <TextField label="Account number" icon="payment" value={vm.target} onChangeText={vm.setTarget} />

      {/* Some billers need extra details; the product says which. */}
      {vm.catalogue.selected?.requiredOptions.map((name) => (
        <TextField
          key={name}
          label={name}
          value={vm.options[name] ?? ''}
          onChangeText={(value) => vm.setOption(name, value)}
        />
      ))}

      <AmountPicker currency={currency} value={vm.amountText} onChange={vm.setAmountText} />

      {vm.error && <Notice tone="danger" text={vm.error} />}
    </SheetBody>
  );
}
