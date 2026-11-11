import type { AppNotification, Bundle, Network, Order, StockAccount, Transaction, User } from '@/models';
import { ZESA_FEE } from '@/utils/order';

import { ApiError, type HotApi } from './hotApi';

/**
 * In-memory stand-in for the HOT v3 API. No network, no real money.
 * It keeps its own state so balances and history react to purchases.
 */

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

const NETWORK_NAMES: Record<Network, string> = {
  econet: 'Econet',
  netone: 'NetOne',
  telecel: 'Telecel',
};

const BUNDLES: Bundle[] = [
  { id: 'ec-d-180', network: 'econet', name: 'Daily Data', allowance: '180 MB', validity: '1 day', price: 1 },
  { id: 'ec-w-1g', network: 'econet', name: 'Weekly Data', allowance: '1 GB', validity: '7 days', price: 3 },
  { id: 'ec-m-5g', network: 'econet', name: 'Monthly Data', allowance: '5 GB', validity: '30 days', price: 12 },
  { id: 'ec-m-20g', network: 'econet', name: 'Monthly Data', allowance: '20 GB', validity: '30 days', price: 35 },
  { id: 'ec-soc', network: 'econet', name: 'WhatsApp Bundle', allowance: '400 MB', validity: '30 days', price: 2 },
  { id: 'no-d-100', network: 'netone', name: 'OneFusion Day', allowance: '100 MB', validity: '1 day', price: 0.4 },
  { id: 'no-w-2g', network: 'netone', name: 'OneFusion Week', allowance: '2 GB', validity: '7 days', price: 2.5 },
  { id: 'no-m-10g', network: 'netone', name: 'OneFusion Month', allowance: '10 GB', validity: '30 days', price: 10 },
  { id: 'tc-d-85', network: 'telecel', name: 'Daily Surf', allowance: '85 MB', validity: '1 day', price: 0.45 },
  { id: 'tc-w-1g', network: 'telecel', name: 'Weekly Surf', allowance: '1 GB', validity: '7 days', price: 2.8 },
  { id: 'tc-m-8g', network: 'telecel', name: 'Monthly Surf', allowance: '8 GB', validity: '30 days', price: 9 },
];

let accounts: StockAccount[] = [
  { id: 'usd', name: 'USD Wallet', balance: 128.45, currency: 'USD', updatedAt: minutesAgo(3) },
  { id: 'zwg', name: 'ZWG Wallet', balance: 950, currency: 'ZWG', updatedAt: minutesAgo(3) },
  { id: 'usd-zesa', name: 'ZESA Stock', balance: 40, currency: 'USD', updatedAt: minutesAgo(3) },
];

let transactions: Transaction[] = [
  {
    id: 't1', reference: 'HR-0042', type: 'zesa', title: 'ZESA token', recipient: 'Meter 45217893412',
    amount: 10, fee: ZESA_FEE, currency: 'USD', date: minutesAgo(95), status: 'success',
    token: '28415623903411782204', units: '14.2 kWh',
  },
  {
    id: 't2', reference: 'HR-0038', type: 'airtime', title: 'Econet airtime', recipient: '0772345678',
    amount: 2, fee: 0, currency: 'USD', date: minutesAgo(130), status: 'success', network: 'econet',
  },
  {
    id: 't3', reference: 'HR-0031', type: 'bundle', title: 'NetOne OneFusion Week 2 GB', recipient: '0719876543',
    amount: 2.5, fee: 0, currency: 'USD', date: minutesAgo(60 * 20), status: 'success', network: 'netone',
  },
  {
    id: 't4', reference: 'HR-0027', type: 'zesa', title: 'ZESA token', recipient: 'Meter 45217893488',
    amount: 20, fee: ZESA_FEE, currency: 'USD', date: minutesAgo(60 * 26), status: 'failed',
    message: 'ZESA did not respond in time. Your account was not charged.',
  },
  {
    id: 't5', reference: 'HR-0021', type: 'payment', title: 'TV subscription PIN', recipient: 'Smartcard 7023456781',
    amount: 25, fee: 0, currency: 'USD', date: minutesAgo(60 * 50), status: 'success', pin: '8821-4450-1190-2234',
  },
  {
    id: 't6', reference: 'HR-0019', type: 'zesa', title: 'ZESA token', recipient: 'Meter 45217893412',
    amount: 5, fee: ZESA_FEE, currency: 'USD', date: minutesAgo(60 * 75), status: 'pending',
    message: 'Sent to ZESA. Waiting for confirmation.',
  },
  {
    id: 't7', reference: 'HR-0012', type: 'airtime', title: 'Telecel airtime', recipient: '0735551212',
    amount: 1, fee: 0, currency: 'USD', date: minutesAgo(60 * 100), status: 'success', network: 'telecel',
  },
];

const NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1', title: 'ZESA token ready', body: 'Your USD 10.00 token for meter 45217893412 was delivered.',
    date: minutesAgo(95), read: false,
  },
  {
    id: 'n2', title: 'Purchase pending', body: 'A USD 5.00 ZESA purchase is waiting for confirmation.',
    date: minutesAgo(60 * 75), read: false,
  },
  {
    id: 'n3', title: 'Scheduled maintenance', body: 'ZESA purchases may be slow on Sunday between 02:00 and 02:30.',
    date: minutesAgo(60 * 30), read: true,
  },
  {
    id: 'n4', title: 'Welcome to HOT Recharge', body: 'Buy airtime, bundles and ZESA tokens in a few taps.',
    date: minutesAgo(60 * 24 * 6), read: true,
  },
];

let sequence = 43;

function randomDigits(length: number): string {
  let out = '';
  for (let i = 0; i < length; i++) out += Math.floor(Math.random() * 10);
  return out;
}

function debit(amount: number): void {
  const wallet = accounts[0];
  if (wallet.balance < amount) {
    throw new ApiError('Not enough balance in your USD Wallet for this purchase.');
  }
  accounts = accounts.map((a) =>
    a.id === wallet.id
      ? { ...a, balance: Math.round((a.balance - amount) * 100) / 100, updatedAt: new Date().toISOString() }
      : a,
  );
}

function describe(order: Order): Pick<Transaction, 'type' | 'title' | 'recipient' | 'amount' | 'fee' | 'network'> {
  switch (order.kind) {
    case 'airtime':
      return {
        type: 'airtime', title: `${NETWORK_NAMES[order.network]} airtime`, recipient: order.number,
        amount: order.amount, fee: 0, network: order.network,
      };
    case 'bundle':
      return {
        type: 'bundle',
        title: `${NETWORK_NAMES[order.bundle.network]} ${order.bundle.name} ${order.bundle.allowance}`,
        recipient: order.number, amount: order.bundle.price, fee: 0, network: order.bundle.network,
      };
    case 'zesa':
      return {
        type: 'zesa', title: 'ZESA token', recipient: `Meter ${order.meter}`,
        amount: order.amount, fee: ZESA_FEE,
      };
  }
}

export const mockHotApi: HotApi = {
  async login(input): Promise<User> {
    await delay(700);
    if (input.password === 'wrong') throw new ApiError('Incorrect mobile number or password.');
    return {
      accountId: '123456789',
      firstName: 'Demo',
      lastName: 'User',
      mobile: input.mobile,
      email: 'demo@example.com',
    };
  },

  async register() {
    await delay(900);
  },

  async getStockAccounts() {
    await delay(350);
    return accounts;
  },

  async getTransactions() {
    await delay(450);
    return transactions;
  },

  async getNotifications() {
    await delay(300);
    return NOTIFICATIONS;
  },

  async getBundles(network) {
    await delay(300);
    return BUNDLES.filter((b) => b.network === network);
  },

  async verifyMeter(meter) {
    await delay(700);
    if (meter.endsWith('0000')) throw new ApiError('Meter not found. Check the number and try again.');
    return { name: 'T. MOYO', address: '12 Samora Machel Ave, Harare' };
  },

  async purchase(order) {
    await delay(1200);
    const details = describe(order);
    debit(details.amount + details.fee);

    const tx: Transaction = {
      ...details,
      id: `t${Date.now()}`,
      reference: `HR-${String(sequence++).padStart(4, '0')}`,
      currency: 'USD',
      date: new Date().toISOString(),
      status: 'success',
    };
    if (order.kind === 'zesa') {
      tx.token = randomDigits(20);
      tx.units = `${(order.amount * 1.42).toFixed(1)} kWh`;
    }
    transactions = [tx, ...transactions];
    return tx;
  },
};
