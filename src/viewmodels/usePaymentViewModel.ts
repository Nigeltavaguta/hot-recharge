import { useState } from 'react';
import { setDraftOrder } from '@/state/walletStore';
import { parseAmount } from '@/utils/format';
import { useProducts } from './useProducts';

export function usePaymentViewModel() {
  const catalogue = useProducts('payment');
  const [target, setTarget] = useState('');
  const [amountText, setAmountText] = useState('');
  const [options, setOptions] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const amount = parseAmount(amountText);
  function submit() {
    if (!catalogue.selected || !target.trim() || !amount || catalogue.selected.requiredOptions.some(o => !options[o]?.trim())) {
      setError('Choose a service and complete its account, amount and required details.'); return false;
    }
    const allowed = Object.fromEntries(catalogue.selected.requiredOptions.map(o => [o, options[o].trim()]));
    setDraftOrder({ kind: 'payment', productId: catalogue.selected.id, target: target.trim(), amount, options: allowed }); return true;
  }
  return { catalogue, target, setTarget, amountText, setAmountText, options, setOption: (key: string, value: string) => setOptions(o => ({ ...o, [key]: value })), error, total: amount ?? 0, submit };
}
