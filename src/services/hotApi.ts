import type {
  AppNotification,
  Bundle,
  LoginInput,
  MeterCustomer,
  Network,
  Order,
  RegisterInput,
  StockAccount,
  Transaction,
  User,
} from '@/models';

/**
 * The only door between the app and the HOT Recharge backend.
 * View-models depend on this interface, never on a concrete implementation,
 * so the mock can be swapped for the real v3 client without touching any screen.
 */
export interface HotApi {
  login(input: LoginInput): Promise<User>;
  register(input: RegisterInput): Promise<void>;
  getStockAccounts(): Promise<StockAccount[]>;
  getTransactions(): Promise<Transaction[]>;
  getNotifications(): Promise<AppNotification[]>;
  getBundles(network: Network): Promise<Bundle[]>;
  verifyMeter(meter: string): Promise<MeterCustomer>;
  purchase(order: Order): Promise<Transaction>;
}

/** An error whose message is safe and clear enough to show to the user. */
export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'Something went wrong. Please try again.';
}
