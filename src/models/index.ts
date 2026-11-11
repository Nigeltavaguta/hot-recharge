/**
 * Models: plain data shapes shared by services, view-models and views.
 * These will be aligned with the HOT v3 API payloads when the real service is wired in.
 */

export type Network = 'econet' | 'netone' | 'telecel';

export type TxnStatus = 'success' | 'pending' | 'failed';

export type TxnType = 'airtime' | 'bundle' | 'zesa' | 'payment';

export interface User {
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
  id: string;
  network: Network;
  name: string;
  allowance: string;
  validity: string;
  price: number;
}

export interface Transaction {
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
  | { kind: 'airtime'; network: Network; number: string; amount: number }
  | { kind: 'bundle'; bundle: Bundle; number: string }
  | { kind: 'zesa'; meter: string; amount: number; customer: MeterCustomer };

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
