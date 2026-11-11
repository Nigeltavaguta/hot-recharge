import { createStore } from './createStore';
import { setDraftOrder } from './walletStore';

export type PurchaseKind = 'airtime' | 'bundle' | 'zesa' | 'payment';

interface PurchaseSheetState {
  /** What the bottom sheet is showing, or null when it is closed. */
  request: { kind: PurchaseKind; prefill?: string } | null;
}

export const purchaseSheetStore = createStore<PurchaseSheetState>({ request: null });

/** Opens the buy sheet from anywhere. `prefill` is a mobile or meter number to start with. */
export function openPurchase(kind: PurchaseKind, prefill?: string): void {
  setDraftOrder(null);
  purchaseSheetStore.set({ request: { kind, prefill } });
}

export function closePurchase(): void {
  purchaseSheetStore.set({ request: null });
  setDraftOrder(null);
}
