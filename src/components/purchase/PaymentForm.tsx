import { AmountPicker } from '@/components/AmountPicker';
import { Notice } from '@/components/Card';
import { PurchaseFooter } from '@/components/PurchaseFooter';
import { TextField } from '@/components/TextField';
import { usePaymentViewModel } from '@/viewmodels/usePaymentViewModel';
import { ProductPicker } from './ProductPicker';
import { SheetBody } from './SheetBody';

export function PaymentForm() {
  const vm = usePaymentViewModel();
  return <SheetBody footer={<PurchaseFooter total={vm.total} buttonLabel="Continue" onPress={vm.submit} />}>
    <ProductPicker {...vm.catalogue} />
    <TextField label="Payment account" value={vm.target} onChangeText={vm.setTarget} />
    {vm.catalogue.selected?.requiredOptions.map(name => <TextField key={name} label={name} value={vm.options[name] ?? ''} onChangeText={value => vm.setOption(name, value)} />)}
    <AmountPicker currency={vm.catalogue.selected?.currency} value={vm.amountText} onChange={vm.setAmountText} />
    {vm.error && <Notice tone="danger" text={vm.error} />}
  </SheetBody>;
}
