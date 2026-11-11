import { useEffect, useRef, useState } from 'react';

import type { MeterCustomer } from '@/models';
import { api, errorMessage } from '@/services';
import { setDraftOrder } from '@/state/walletStore';
import { parseAmount } from '@/utils/format';
import { ZESA_FEE } from '@/utils/order';
import { isValidMobile, METER_LENGTH, normalizeMobile } from '@/utils/phone';
import { useProducts } from './useProducts';

export function useZesaViewModel(initialMeter = '') {
  const catalogue = useProducts('zesa');
  const [notifyNumber, setNotifyNumber] = useState('');
  const [meter, setMeterText] = useState(initialMeter);
  const [customer, setCustomer] = useState<MeterCustomer | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [amountText, setAmountText] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  /** Ignores answers for a meter number the user has since changed. */
  const latestRequest = useRef(0);

  const amount = parseAmount(amountText);

  async function verify(value: string) {
    const request = ++latestRequest.current;
    setVerifying(true);
    setVerifyError(null);
    try {
      const found = await api.verifyMeter(value, catalogue.selected?.id);
      if (request === latestRequest.current) setCustomer(found);
    } catch (error) {
      if (request === latestRequest.current) setVerifyError(errorMessage(error));
    } finally {
      if (request === latestRequest.current) setVerifying(false);
    }
  }

  function setMeter(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, METER_LENGTH);
    setMeterText(digits);
    setCustomer(null);
    setVerifyError(null);
    latestRequest.current++;
    setVerifying(false);
    // Check the meter as soon as the full number is in, so there is no extra button to press.
    if (digits.length === METER_LENGTH) void verify(digits);
  }

  // Arriving with a meter already filled in ("Buy again"): verify it straight away.
  useEffect(() => {
    // Prefill is an external navigation input; this starts its asynchronous customer check once.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (initialMeter.length === METER_LENGTH) void verify(initialMeter);
    // Runs once for the starting value only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const meterError =
    meter.length !== METER_LENGTH
      ? `Enter the ${METER_LENGTH}-digit meter number`
      : !customer && !verifying
        ? (verifyError ?? 'Meter not verified yet')
        : undefined;

  function submit(): boolean {
    if (!customer || !amount || !catalogue.selected || !isValidMobile(notifyNumber)) {
      setShowErrors(true);
      return false;
    }
    setDraftOrder({ kind: 'zesa', meter, amount, customer, productId: catalogue.selected.id, notifyNumber: normalizeMobile(notifyNumber) });
    return true;
  }

  return {
    catalogue, notifyNumber, setNotifyNumber,
    meter,
    setMeter,
    customer,
    verifying,
    verifyError,
    retryVerify: () => verify(meter),
    amountText,
    setAmountText,
    total: amount ? Math.round((amount + ZESA_FEE) * 100) / 100 : 0,
    errors: showErrors ? { meter: meterError, amount: amount ? undefined : 'Enter an amount', notifyNumber: isValidMobile(notifyNumber) ? undefined : 'Enter a notification mobile number' } : {},
    submit,
  };
}
