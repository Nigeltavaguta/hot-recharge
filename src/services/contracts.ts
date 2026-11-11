import type { Transaction, User } from '@/models';

export interface SessionResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  demonstration: boolean;
}
export interface Page<T> { items: T[]; nextCursor: string | null }
export type WireTransaction = Omit<Transaction, 'amount' | 'fee'> & { amount: string; fee: string };

export function displayMoney(value: string): number {
  if (!/^-?\d+(\.\d+)?$/.test(value)) throw new Error('Invalid money response');
  const number = Number(value);
  if (!Number.isFinite(number) || Math.abs(number) > 1e10) throw new Error('Money outside display range');
  return number;
}
export function transactionFromWire(value: WireTransaction): Transaction {
  if (!value || !value.id || !['success', 'pending', 'failed'].includes(value.status)) throw new Error('Invalid transaction response');
  if (value.status === 'success' && value.verificationState !== 'confirmed') throw new Error('Unconfirmed success response');
  return { ...value, amount: displayMoney(value.amount), fee: displayMoney(value.fee) };
}
