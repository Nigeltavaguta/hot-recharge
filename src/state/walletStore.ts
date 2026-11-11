import type { AppNotification, Order, StockAccount, Transaction } from '@/models';
import { api, errorMessage } from '@/services';

import { createStore } from './createStore';

interface WalletState {
  accounts: StockAccount[];
  transactions: Transaction[];
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
  notifications: [],
  loading: false,
  loaded: false,
  error: null,
  draftOrder: null,
};

export const walletStore = createStore<WalletState>(initial);

/** Loads balances, recent transactions and notifications. Safe to call repeatedly. */
export async function refreshWallet(): Promise<void> {
  if (walletStore.get().loading) return;
  walletStore.set({ loading: true, error: null });
  try {
    const [accounts, transactions, notifications] = await Promise.all([
      api.getStockAccounts(),
      api.getTransactions(),
      api.getNotifications(),
    ]);
    // Keep anything the user has already opened marked as read on this device.
    const seen = new Set(walletStore.get().notifications.filter((n) => n.read).map((n) => n.id));
    walletStore.set({
      accounts,
      transactions,
      notifications: notifications.map((n) => (seen.has(n.id) ? { ...n, read: true } : n)),
      loaded: true,
    });
  } catch (error) {
    walletStore.set({ error: errorMessage(error) });
  } finally {
    walletStore.set({ loading: false });
  }
}

export function setDraftOrder(order: Order | null): void {
  walletStore.set({ draftOrder: order });
}

export function recordTransaction(tx: Transaction): void {
  walletStore.set({ transactions: [tx, ...walletStore.get().transactions] });
}

export function markNotificationsRead(): void {
  const { notifications } = walletStore.get();
  if (notifications.some((n) => !n.read)) {
    walletStore.set({ notifications: notifications.map((n) => ({ ...n, read: true })) });
  }
}

export function resetWallet(): void {
  walletStore.set(initial);
}
