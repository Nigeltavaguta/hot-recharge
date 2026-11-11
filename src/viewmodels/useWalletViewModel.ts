import { useState } from 'react';

import type { Transaction, TxnStatus } from '@/models';
import { useStore } from '@/state/createStore';
import { sessionStore } from '@/state/sessionStore';
import { refreshWallet, walletStore } from '@/state/walletStore';

/** Balances and history, shared by the Home, Tokens, Activity and Balances screens. */
export function useWalletViewModel() {
  const user = useStore(sessionStore, (s) => s.user);
  const accounts = useStore(walletStore, (s) => s.accounts);
  const transactions = useStore(walletStore, (s) => s.transactions);
  const notifications = useStore(walletStore, (s) => s.notifications);
  const loading = useStore(walletStore, (s) => s.loading);
  const loaded = useStore(walletStore, (s) => s.loaded);
  const error = useStore(walletStore, (s) => s.error);

  const [balanceHidden, setBalanceHidden] = useState(false);

  const mainAccount = accounts[0] ?? null;
  const recent = transactions.slice(0, 4);
  /** Purchases that produced a token or PIN the customer needs to keep. */
  const tokens = transactions.filter((t) => t.status === 'success' && (t.token || t.pin));

  return {
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
  const [filter, setFilter] = useState<ActivityFilter>('all');

  const visible = filter === 'all' ? transactions : transactions.filter((t) => t.status === filter);

  return { visible, filter, setFilter, loading, loaded, refresh: refreshWallet };
}

export function useTransaction(id: string): Transaction | null {
  const transactions = useStore(walletStore, (s) => s.transactions);
  return transactions.find((t) => t.id === id) ?? null;
}
