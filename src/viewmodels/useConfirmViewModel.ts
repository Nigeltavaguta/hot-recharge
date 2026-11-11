import { useRef, useState } from 'react';

import type { Transaction } from '@/models';
import { api, errorMessage } from '@/services';
import { useStore } from '@/state/createStore';
import { recordTransaction, refreshWallet, walletStore } from '@/state/walletStore';
import { summarizeOrder } from '@/utils/order';

export function useConfirmViewModel() {
  const order = useStore(walletStore, (s) => s.draftOrder);
  const balance = useStore(walletStore, (s) => s.accounts[0] ?? null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Blocks a second tap from sending the same purchase twice. */
  const inFlight = useRef(false);

  const summary = order ? summarizeOrder(order) : null;
  const insufficient = !!summary && !!balance && summary.total > balance.balance;

  /** Sends the purchase. Returns the transaction, or null if it could not be made. */
  async function confirm(): Promise<Transaction | null> {
    if (!order || inFlight.current) return null;
    inFlight.current = true;
    setProcessing(true);
    setError(null);
    try {
      const tx = await api.purchase(order);
      recordTransaction(tx);
      void refreshWallet();
      return tx;
    } catch (e) {
      setError(errorMessage(e));
      return null;
    } finally {
      inFlight.current = false;
      setProcessing(false);
    }
  }

  return { order, summary, balance, insufficient, processing, error, confirm };
}
