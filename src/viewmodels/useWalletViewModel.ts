import { useEffect, useState } from 'react';
import { api, errorMessage } from '@/services';

import type { Transaction, TxnStatus } from '@/models';
import { useStore } from '@/state/createStore';
import { sessionStore } from '@/state/sessionStore';
import { loadMoreWallet, recordTransaction, refreshWallet, walletStore } from '@/state/walletStore';

/** Balances and history, shared by the Home, Tokens, Activity and Balances screens. */
export function useWalletViewModel() {
  const user = useStore(sessionStore, (s) => s.user);
  const accounts = useStore(walletStore, (s) => s.accounts);
  const transactions = useStore(walletStore, (s) => s.transactions);
  const vault = useStore(walletStore, (s) => s.vault);
  const notifications = useStore(walletStore, (s) => s.notifications);
  const loading = useStore(walletStore, (s) => s.loading);
  const loaded = useStore(walletStore, (s) => s.loaded);
  const error = useStore(walletStore, (s) => s.error);
  const vaultCursor = useStore(walletStore, s => s.vaultCursor);
  const loadingMore = useStore(walletStore, s => s.loadingMore);

  const [balanceHidden, setBalanceHidden] = useState(false);

  const mainAccount = accounts[0] ?? null;
  const recent = transactions.slice(0, 4);
  /** Purchases that produced a token or PIN the customer needs to keep. */
  const tokens = vault.filter((t) => t.status === 'success' && (t.token || t.pin));

  return {
    vaultCursor, loadingMore, loadMoreVault: () => loadMoreWallet('vault'),
    user,
    accounts,
    mainAccount,
    transactions,
    recent,
    tokens,
    latestToken: tokens[0] ?? null,
    unreadCount: notifications.filter((n) => !n.read).length,
    loading,
    loaded,
    error,
    refresh: refreshWallet,
    balanceHidden,
    toggleBalanceHidden: () => setBalanceHidden((h) => !h),
  };
}

export type ActivityFilter = 'all' | TxnStatus;

export const ACTIVITY_FILTERS: { id: ActivityFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'success', label: 'Successful' },
  { id: 'pending', label: 'Pending' },
  { id: 'failed', label: 'Failed' },
];

export function useActivityViewModel() {
  const transactions = useStore(walletStore, (s) => s.transactions);
  const loading = useStore(walletStore, (s) => s.loading);
  const loaded = useStore(walletStore, (s) => s.loaded);
  const error = useStore(walletStore, s => s.error);
  const nextCursor = useStore(walletStore, s => s.transactionCursor);
  const loadingMore = useStore(walletStore, s => s.loadingMore);
  const [filter, setFilter] = useState<ActivityFilter>('all');

  const visible = filter === 'all' ? transactions : transactions.filter((t) => t.status === filter);

  return { visible, filter, setFilter, loading, loaded, error, nextCursor, loadingMore, loadMore: () => loadMoreWallet('transactions'), refresh: refreshWallet };
}

export function useTransaction(id: string): Transaction | null {
  const transactions = useStore(walletStore, (s) => s.transactions);
  return transactions.find((t) => t.id === id) ?? null;
}

export function useTransactionDetails(id: string) {
  const cached = useTransaction(id);
  const [tx, setTx] = useState<Transaction | null>(cached);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    // Receipt identity may change during navigation; explicitly track the new asynchronous request.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true); setError(null);
    api.getTransaction(id).then(found => { if (active) { setTx(found); recordTransaction(found); } })
      .catch(e => { if (active) setError(errorMessage(e)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, attempt]);
  async function verify() {
    const user = sessionStore.get().user;
    setLoading(true); setError(null);
    try { const found = await api.verifyTransaction(id); if (sessionStore.get().user === user) { setTx(found); recordTransaction(found); void refreshWallet(); } }
    catch (e) { setError(errorMessage(e)); }
    finally { setLoading(false); }
  }
  return { tx: tx?.id === id ? tx : null, loading, error, verify, retry: () => setAttempt(a => a + 1) };
}
