/**
 * Models: plain data shapes shared by services, view-models and views.
 * These will be aligned with the HOT v3 API payloads when the real service is wired in.
 */

export type Network = 'econet' | 'netone' | 'telecel';

export type TxnStatus = 'success' | 'pending' | 'failed';

export type TxnType = 'airtime' | 'bundle' | 'zesa' | 'payment';

export interface User {
  demonstration?: boolean;
  accountId: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
}

export interface StockAccount {
  id: string;
  name: string;
  balance: number;
  currency: string;
  updatedAt: string;
}

export interface Bundle {
  productId?: string;
  productCode?: string;
  currency?: string;
  stockAccountId?: string;
  id: string;
  network: Network;
  name: string;
  allowance: string;
  validity: string;
  price: number;
}

export interface Transaction {
  demonstration?: boolean;
  verificationState?: 'confirmed' | 'pending' | 'unknown';
  id: string;
  reference: string;
  type: TxnType;
  title: string;
  recipient: string;
  amount: number;
  fee: number;
  currency: string;
  date: string;
  status: TxnStatus;
  network?: Network;
  /** ZESA electricity token (20 digits). */
  token?: string;
  units?: string;
  /** Voucher / recharge PIN. */
  pin?: string;
  /** Human-readable reason for pending and failed transactions. */
  message?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  date: string;
  read: boolean;
}

export interface MeterCustomer {
  name: string;
  address: string;
}

/** What the user is about to buy. Built by a form screen, reviewed on the confirm screen. */
export type Order =
  | { kind: 'airtime'; network: Network; number: string; amount: number; productId?: string }
  | { kind: 'bundle'; bundle: Bundle; number: string }
  | { kind: 'zesa'; meter: string; amount: number; customer: MeterCustomer; notifyNumber: string; productId?: string }
  | { kind: 'payment'; productId: string; target: string; amount: number; options: Record<string, string> };

export interface Product {
  id: string;
  category: 'airtime' | 'bundle' | 'zesa' | 'payment';
  network: Network | null;
  name: string;
  currency: string;
  stockAccountId: string;
  minAmount: string;
  maxAmount: string;
  increment: string;
  requiredOptions: string[];
  customerLookupSupported: boolean;
}

export interface PurchaseQuote {
  id: string;
  expiresAt: string;
  category: string;
  title: string;
  rows: { label: string; value: string }[];
  amount: string;
  fee: string;
  total: string;
  currency: string;
  stockAccountId: string;
  stockAccountName: string;
  availableBalance: string;
  target: string;
  demonstration: boolean;
}

export interface RegistrationResult {
  status: 'externalOnboardingRequired';
  url: string;
  message: string;
}

export interface LoginInput {
  mobile: string;
  password: string;
}

export interface RegisterInput {
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  password: string;
}
