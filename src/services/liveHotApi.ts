import * as Crypto from 'expo-crypto';
import type { AppNotification, Bundle, MeterCustomer, Order, Product, PurchaseQuote, RegistrationResult, StockAccount, Transaction, User } from '@/models';
import { deviceStorage } from './deviceStorage';
import { displayMoney, transactionFromWire, type Page, type SessionResponse, type WireTransaction } from './contracts';
import { ApiError, type HotApi } from './hotApi';
import { request } from './httpClient';

let session: SessionResponse | null = null;
let refreshFlight: Promise<void> | null = null;
let generation = 0;
let purchasing = false;
type Pending = { owner: string; key: string; quoteId: string; category: string };
const recoveryKey = (owner: string) => `hot-purchase-${owner.replace(/[^A-Za-z0-9_.-]/g, '_')}`;

async function acceptSession(next: SessionResponse, expectedGeneration: number) {
  if (generation !== expectedGeneration) throw new ApiError('Session changed. Sign in again.');
  if (!next.accessToken || !next.refreshToken || !next.user?.accountId) throw new ApiError('Invalid session response.');
  await deviceStorage.set('hot-refresh', next.refreshToken);
  if (generation !== expectedGeneration) { await deviceStorage.remove('hot-refresh'); throw new ApiError('Session changed.'); }
  session = next;
}
async function refresh() {
  if (!refreshFlight) refreshFlight = (async () => {
    const expected = generation;
    const token = await deviceStorage.get('hot-refresh');
    if (!token) throw new ApiError('Sign in to continue.', 'UNAUTHENTICATED', 401);
    await acceptSession(await request<SessionResponse>('/auth/refresh', { method: 'POST', body: { refreshToken: token } }), expected);
  })().finally(() => { refreshFlight = null; });
  return refreshFlight;
}
async function authenticated<T>(path: string, options: Parameters<typeof request>[1] = {}): Promise<T> {
  if (!session) throw new ApiError('Sign in to continue.', 'UNAUTHENTICATED', 401);
  if (Date.parse(session.expiresAt) < Date.now() + 30000) await refresh();
  const expected = generation;
  const result = await request<T>(path, { ...options, token: session?.accessToken });
  if (generation !== expected) throw new ApiError('Session changed.');
  return result;
}
async function collect<T>(path: string): Promise<T[]> {
  const first = await authenticated<Page<T>>(path);
  if (!Array.isArray(first.items)) throw new ApiError('Invalid list response.');
  // Bounded memory on low-RAM devices. Further paging belongs in the screen's load-more flow.
  return first.items;
}
async function products(): Promise<Product[]> { return authenticated<Product[]>('/products'); }
async function productFor(order: Order): Promise<Product> {
  const explicit = order.kind === 'bundle' ? order.bundle.productId : order.productId;
  const list = await products();
  const result = list.find(p => explicit ? p.id === explicit : p.category === order.kind &&
    (order.kind !== 'airtime' || p.network === order.network) && p.currency === 'USD');
  if (!result) throw new ApiError('This product is unavailable.');
  return result;
}
async function clearIfTerminal(tx: Transaction) {
  if (tx.status !== 'pending' && session) {
    const key = recoveryKey(session.user.accountId);
    const raw = await deviceStorage.get(key);
    if (raw) {
      const pending = JSON.parse(raw) as Pending;
      const found = await authenticated<{ transactionId: string }>(`/purchase-intents/${encodeURIComponent(pending.key)}`);
      if (found.transactionId === tx.id) await deviceStorage.remove(key);
    }
  }
}
export const liveHotApi: HotApi = {
  async login(input) {
    const expected = ++generation;
    await acceptSession(await request<SessionResponse>('/auth/login', { method: 'POST', body: input }), expected);
    const account = await authenticated<{ user: User; demonstration: boolean }>('/account');
    return { ...account.user, demonstration: account.demonstration };
  },
  async restoreSession(): Promise<User | null> {
    if (!(await deviceStorage.get('hot-refresh'))) return null;
    await refresh();
    if (!session) return null;
    const account = await authenticated<{ user: User; demonstration: boolean }>('/account');
    return { ...account.user, demonstration: account.demonstration };
  },
  async logout() {
    const token = session?.accessToken;
    generation++; session = null;
    await deviceStorage.remove('hot-refresh');
    // Keep owner-scoped unresolved purchase keys for recovery after reconnecting.
    if (token) await request('/auth/logout', { method: 'POST', token });
  },
  register: () => request<RegistrationResult>('/auth/register', { method: 'POST' }),
  getProducts: products,
  async getStockAccounts(): Promise<StockAccount[]> {
    const rows = await authenticated<(Omit<StockAccount, 'balance'> & { balance: string })[]>('/account/balances');
    return rows.map(a => ({ ...a, balance: displayMoney(a.balance) }));
  },
  async getTransactions() { return (await collect<WireTransaction>('/transactions?limit=100')).map(transactionFromWire); },
  async getTransactionsPage(cursor, status) {
    const query = new URLSearchParams({ limit: '25', ...(cursor ? { cursor } : {}), ...(status ? { status } : {}) });
    const page = await authenticated<Page<WireTransaction>>(`/transactions?${query}`);
    return { ...page, items: page.items.map(transactionFromWire) };
  },
  async getVaultPage(cursor) {
    const query = new URLSearchParams({ limit: '25', ...(cursor ? { cursor } : {}) });
    const page = await authenticated<Page<WireTransaction>>(`/vault/tokens?${query}`);
    return { ...page, items: page.items.map(transactionFromWire) };
  },
  async getVault() { return (await collect<WireTransaction>('/vault/tokens?limit=100')).map(transactionFromWire); },
  async getNotifications() { return collect<AppNotification>('/notifications'); },
  async getTransaction(id) { return transactionFromWire(await authenticated<WireTransaction>(`/transactions/${encodeURIComponent(id)}`)); },
  async verifyTransaction(id) {
    const tx = transactionFromWire(await authenticated<WireTransaction>(`/transactions/${encodeURIComponent(id)}/verify`, { method: 'POST' }));
    await clearIfTerminal(tx); return tx;
  },
  async getBundles(network): Promise<Bundle[]> {
    const list = (await products()).filter(p => p.category === 'bundle' && p.network === network);
    const stocks = await Promise.all(list.map(async p => {
      const rows = await authenticated<{ id: string; productCode: string; name: string; allowance: string; validity: string; price: string }[]>(`/products/${encodeURIComponent(p.id)}/stock`);
      return rows.map(s => ({ ...s, network, productId: p.id, currency: p.currency, stockAccountId: p.stockAccountId, price: displayMoney(s.price) }));
    }));
    return stocks.flat();
  },
  async verifyMeter(meter, productId): Promise<MeterCustomer> {
    const p = (await products()).find(x => productId ? x.id === productId : x.category === 'zesa' && x.currency === 'USD');
    if (!p) throw new ApiError('ZESA is unavailable.');
    const result = await authenticated<{ verified: boolean; customer: MeterCustomer }>('/zesa/validate', { method: 'POST', body: { productId: p.id, meter } });
    if (!result.verified) throw new ApiError('Meter could not be verified.');
    return result.customer;
  },
  async quote(order) {
    if (!session) throw new ApiError('Sign in to continue.');
    const pending = await deviceStorage.get(recoveryKey(session.user.accountId));
    if (pending) {
      const saved = JSON.parse(pending) as Pending;
      const result = await authenticated<{ transaction: WireTransaction }>(`/purchase-intents/${encodeURIComponent(saved.key)}`);
      const tx = transactionFromWire(result.transaction);
      if (tx.status === 'pending') throw new ApiError('An earlier purchase is unresolved. Check its status in Activity before buying again.');
      await deviceStorage.remove(recoveryKey(session.user.accountId));
    }
    const p = await productFor(order);
    const target = order.kind === 'zesa' ? order.meter : order.kind === 'payment' ? order.target : order.number;
    return authenticated<PurchaseQuote>('/quotes', { method: 'POST', body: {
      productId: p.id, target,
      amount: order.kind === 'bundle' ? undefined : order.amount.toFixed(2),
      productCode: order.kind === 'bundle' ? order.bundle.productCode : undefined,
      options: order.kind === 'zesa' ? { NotifyNumber: order.notifyNumber } : order.kind === 'payment' ? order.options : {},
    } });
  },
  async purchase(order, quote) {
    if (purchasing) throw new ApiError('A purchase is already being submitted. Wait for its status.');
    purchasing = true;
    try {
    if (!quote || !session) throw new ApiError('Review a valid quote before paying.');
    const storageKey = recoveryKey(session.user.accountId);
    const existing = await deviceStorage.get(storageKey);
    if (existing) {
      const pending = JSON.parse(existing) as Pending;
      const found = await authenticated<{ transaction: WireTransaction }>(`/purchase-intents/${encodeURIComponent(pending.key)}`);
      const tx = transactionFromWire(found.transaction); await clearIfTerminal(tx); return tx;
    }
    const key = Crypto.randomUUID();
    await deviceStorage.set(storageKey, JSON.stringify({ owner: session.user.accountId, key, quoteId: quote.id, category: order.kind } satisfies Pending));
    const path = order.kind === 'payment' ? '/payments' : `/recharge/${order.kind === 'bundle' ? 'data' : order.kind}`;
    try {
      const tx = transactionFromWire(await authenticated<WireTransaction>(path, { method: 'POST', body: { quoteId: quote.id }, key }));
      await clearIfTerminal(tx); return tx;
    } catch (error) {
      // Known local/server preflight failures did not submit. Ambiguous transport/5xx retains the key.
      if (error instanceof ApiError && ([400, 401, 403, 422].includes(error.status) || error.code === 'QUOTE_EXPIRED')) await deviceStorage.remove(storageKey);
      throw error;
    }
    } finally { purchasing = false; }
  },
};
