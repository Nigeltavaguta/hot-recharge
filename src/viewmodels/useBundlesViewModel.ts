import { useEffect, useState } from 'react';

import type { Bundle, Network } from '@/models';
import { api, errorMessage } from '@/services';
import { setDraftOrder } from '@/state/walletStore';
import { detectNetwork, isValidMobile, normalizeMobile } from '@/utils/phone';

export function useBundlesViewModel(initialNumber = '') {
  const [number, setNumberText] = useState(initialNumber);
  const [chosenNetwork, setChosenNetwork] = useState<Network | null>(null);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const network = chosenNetwork ?? detectNetwork(number);
  const selected = bundles.find((b) => b.id === selectedId) ?? null;

  // Load the bundle list whenever the network changes (or the user taps retry).
  useEffect(() => {
    if (!network) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setBundles([]);
    setSelectedId(null);
    api
      .getBundles(network)
      .then((list) => {
        if (!cancelled) setBundles(list);
      })
      .catch((error) => {
        if (!cancelled) setLoadError(errorMessage(error));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [network, attempt]);

  const numberError = isValidMobile(number) ? undefined : 'Enter a valid mobile number, e.g. 0772345678';

  function setNumber(text: string) {
    setNumberText(text);
    setChosenNetwork(null);
  }

  function submit(): boolean {
    if (numberError || !selected) {
      setShowErrors(true);
      return false;
    }
    setDraftOrder({ kind: 'bundle', bundle: selected, number: normalizeMobile(number) });
    return true;
  }

  return {
    number,
    setNumber,
    network,
    setNetwork: setChosenNetwork,
    bundles,
    loading,
    loadError,
    retry: () => setAttempt((a) => a + 1),
    selected,
    select: setSelectedId,
    total: selected?.price ?? 0,
    errors: showErrors
      ? { number: numberError, bundle: selected ? undefined : 'Choose a bundle' }
      : {},
    submit,
  };
}
