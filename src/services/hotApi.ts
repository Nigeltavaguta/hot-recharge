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
  TxnStatus,
  User,
  Product,
  PurchaseQuote,
  RegistrationResult,
} from '@/models';

/**
 * The only door between the app and the HOT Recharge backend.
 * View-models depend on this interface, never on a concrete implementation,
 * so the mock can be swapped for the real v3 client without touching any screen.
 */
export interface HotApi {
  login(input: LoginInput): Promise<User>;
  register(input: RegisterInput): Promise<RegistrationResult>;
  logout(): Promise<void>;
  restoreSession(): Promise<User | null>;
  getProducts(): Promise<Product[]>;
  getVault(): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction>;
  verifyTransaction(id: string): Promise<Transaction>;
  quote(order: Order): Promise<PurchaseQuote>;
  getStockAccounts(): Promise<StockAccount[]>;
  getTransactions(): Promise<Transaction[]>;
  getTransactionsPage?(cursor?: string, status?: TxnStatus): Promise<{ items: Transaction[]; nextCursor: string | null }>;
  getVaultPage?(cursor?: string): Promise<{ items: Transaction[]; nextCursor: string | null }>;
  getNotifications(): Promise<AppNotification[]>;
  getBundles(network: Network): Promise<Bundle[]>;
  verifyMeter(meter: string, productId?: string): Promise<MeterCustomer>;
  purchase(order: Order, quote?: PurchaseQuote): Promise<Transaction>;
}

/** An error whose message is safe and clear enough to show to the user. */
export class ApiError extends Error {
  constructor(message: string, public readonly code = 'API_ERROR', public readonly status = 0) {
    super(message);
    this.name = 'ApiError';
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'Something went wrong. Please try again.';
}
