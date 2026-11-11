import type { AppNotification, Order, StockAccount, Transaction } from '@/models';
import { api, errorMessage } from '@/services';

import { createStore } from './createStore';

interface WalletState {
  accounts: StockAccount[];
  transactions: Transaction[];
  vault: Transaction[];
  transactionCursor: string | null;
  vaultCursor: string | null;
  loadingMore: boolean;
  notifications: AppNotification[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
  /** The order being reviewed on the confirm step. */
  draftOrder: Order | null;
}

const initial: WalletState = {
  accounts: [],
  transactions: [],
  vault: [],
  transactionCursor: null,
  vaultCursor: null,
  loadingMore: false,
  notifications: [],
  loading: false,
  loaded: false,
  error: null,
  draftOrder: null,
};

export const walletStore = createStore<WalletState>(initial);
let generation = 0;

/** Loads balances, recent transactions and notifications. Safe to call repeatedly. */
export async function refreshWallet(): Promise<void> {
  if (walletStore.get().loading) return;
  const requestGeneration = generation;
  walletStore.set({ loading: true, error: null });
  try {
    const [accounts, transactions, notifications, vault] = await Promise.allSettled([
      api.getStockAccounts(),
      api.getTransactionsPage ? api.getTransactionsPage() : api.getTransactions().then(items => ({ items, nextCursor: null })),
      api.getNotifications(),
      api.getVaultPage ? api.getVaultPage() : api.getVault().then(items => ({ items, nextCursor: null })),
    ]);
    if (requestGeneration !== generation) return;
    const seen = new Set(walletStore.get().notifications.filter((n) => n.read).map((n) => n.id));
    walletStore.set({
      ...(accounts.status === 'fulfilled' ? { accounts: accounts.value } : {}),
      ...(transactions.status === 'fulfilled' ? { transactions: transactions.value.items, transactionCursor: transactions.value.nextCursor } : {}),
      ...(vault.status === 'fulfilled' ? { vault: vault.value.items, vaultCursor: vault.value.nextCursor } : {}),
      ...(notifications.status === 'fulfilled' ? { notifications: notifications.value.map((n) => (seen.has(n.id) ? { ...n, read: true } : n)) } : {}),
      error: [accounts, transactions, notifications, vault].some(r => r.status === 'rejected') ? 'Some account data could not be refreshed. Pull down to retry.' : null,
      loaded: true,
    });
  } catch (error) {
    if (requestGeneration === generation) walletStore.set({ error: errorMessage(error) });
  } finally {
    if (requestGeneration === generation) walletStore.set({ loading: false });
  }
}

export function setDraftOrder(order: Order | null): void {
  walletStore.set({ draftOrder: order });
}

export function recordTransaction(tx: Transaction): void {
  walletStore.set({ transactions: [tx, ...walletStore.get().transactions.filter(t => t.id !== tx.id)] });
}

export async function loadMoreWallet(kind: 'transactions' | 'vault'): Promise<void> {
  const current = walletStore.get();
  const cursor = kind === 'transactions' ? current.transactionCursor : current.vaultCursor;
  if (!cursor || current.loadingMore || current.loading) return;
  const requestGeneration = generation;
  walletStore.set({ loadingMore: true });
  try {
    const page = kind === 'transactions' ? await api.getTransactionsPage?.(cursor) : await api.getVaultPage?.(cursor);
    if (!page || generation !== requestGeneration) return;
    const previous = walletStore.get()[kind];
    const merged = [...new Map([...previous, ...page.items].map(t => [t.id, t])).values()];
    walletStore.set(kind === 'transactions' ? { transactions: merged, transactionCursor: page.nextCursor } : { vault: merged, vaultCursor: page.nextCursor });
  } catch (error) { if (generation === requestGeneration) walletStore.set({ error: errorMessage(error) }); }
  finally { if (generation === requestGeneration) walletStore.set({ loadingMore: false }); }
}

export function markNotificationsRead(): void {
  const { notifications } = walletStore.get();
  if (notifications.some((n) => !n.read)) {
    walletStore.set({ notifications: notifications.map((n) => ({ ...n, read: true })) });
  }
}

export function resetWallet(): void {
  generation++;
  walletStore.set(initial);
}
