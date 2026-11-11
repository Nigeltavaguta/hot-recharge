import { useState } from 'react';

import type { Network } from '@/models';
import { setDraftOrder } from '@/state/walletStore';
import { parseAmount } from '@/utils/format';
import { detectNetwork, isValidMobile, normalizeMobile } from '@/utils/phone';
import { useProducts } from './useProducts';

export function useAirtimeViewModel(initialNumber = '') {
  const [number, setNumberText] = useState(initialNumber);
  /** Only set when the user overrides the network we detected from the number. */
  const [chosenNetwork, setChosenNetwork] = useState<Network | null>(null);
  const [amountText, setAmountText] = useState('');
  const [showErrors, setShowErrors] = useState(false);

  const network = chosenNetwork ?? detectNetwork(number);
  const catalogue = useProducts('airtime', network);
  const amount = parseAmount(amountText);

  const numberError = isValidMobile(number) ? undefined : 'Enter a valid mobile number, e.g. 0772345678';
  const networkError = network ? undefined : 'Choose a network';
  const amountError = amount ? undefined : 'Enter an amount';

  function setNumber(text: string) {
    setNumberText(text);
    // A new number may belong to a different network, so drop any manual choice.
    setChosenNetwork(null);
  }

  /** Saves the order for the confirm screen. Returns false when the form is not valid yet. */
  function submit(): boolean {
    if (numberError || !network || !amount || !catalogue.selected) {
      setShowErrors(true);
      return false;
    }
    setDraftOrder({ kind: 'airtime', network, number: normalizeMobile(number), amount, productId: catalogue.selected.id });
    return true;
  }

  return {
    catalogue,
    number,
    setNumber,
    network,
    setNetwork: setChosenNetwork,
    amountText,
    setAmountText,
    total: amount ?? 0,
    errors: showErrors ? { number: numberError, network: networkError, amount: amountError } : {},
    submit,
  };
}
