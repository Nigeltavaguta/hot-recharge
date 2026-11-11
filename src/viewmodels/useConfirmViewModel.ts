import { useEffect, useRef, useState } from 'react';

import type { Order, PurchaseQuote, Transaction } from '@/models';
import { api, errorMessage } from '@/services';
import { useStore } from '@/state/createStore';
import { sessionStore } from '@/state/sessionStore';
import { recordTransaction, refreshWallet, walletStore } from '@/state/walletStore';
import { summarizeOrder } from '@/utils/order';

export function useConfirmViewModel() {
  const order = useStore(walletStore, (s) => s.draftOrder);
  const [quoted, setQuoted] = useState<{ order: Order; value: PurchaseQuote } | null>(null);
  const quote = quoted?.order === order ? quoted.value : null;
  const [quoting, setQuoting] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Blocks a second tap from sending the same purchase twice. */
  const inFlight = useRef(false);

  useEffect(() => {
    let active = true;
    // A changed draft invalidates the previous quote immediately; paying with stale totals is unsafe.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuoted(null); setError(null);
    if (!order) { setQuoting(false); return; }
    setQuoting(true);
    api.quote(order).then(result => { if (active) setQuoted({ order, value: result }); })
      .catch(e => { if (active) setError(errorMessage(e)); })
      .finally(() => { if (active) setQuoting(false); });
    return () => { active = false; };
  }, [order, attempt]);
  const summary = quote ? { title: quote.title, rows: quote.rows, amount: Number(quote.amount), fee: Number(quote.fee), total: Number(quote.total) } : order ? summarizeOrder(order) : null;
  const balance = quote ? { name: quote.stockAccountName, currency: quote.currency, balance: Number(quote.availableBalance) } : null;
  const insufficient = !!quote && Number(quote.total) > Number(quote.availableBalance);

  /** Sends the purchase. Returns the transaction, or null if it could not be made. */
  async function confirm(): Promise<Transaction | null> {
    if (!order || !quote || inFlight.current) return null;
    if (Date.parse(quote.expiresAt) <= Date.now()) { setError('Quote expired. Refresh the quote before paying.'); setQuoted(null); return null; }
    const owner = sessionStore.get().user;
    inFlight.current = true;
    setProcessing(true);
    setError(null);
    try {
      const tx = await api.purchase(order, quote);
      if (sessionStore.get().user !== owner) return null;
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

  return { order, summary, balance, currency: quote?.currency ?? 'USD', quote, quoting, insufficient, processing, error, confirm, requote: () => setAttempt(a => a + 1) };
}
