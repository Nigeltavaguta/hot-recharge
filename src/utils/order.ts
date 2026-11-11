import type { Order } from '@/models';

import { networkName } from './phone';

/** Placeholder fee until the real one comes from the v3 API. */
export const ZESA_FEE = 0.3;

export interface OrderSummary {
  title: string;
  rows: { label: string; value: string }[];
  amount: number;
  fee: number;
  total: number;
}

/** Everything the confirm screen needs to show, worked out from the order. */
export function summarizeOrder(order: Order): OrderSummary {
  switch (order.kind) {
    case 'payment':
      return { title: 'Payment', rows: [{ label: 'Account', value: order.target }], amount: order.amount, fee: 0, total: order.amount };
    case 'airtime':
      return {
        title: `${networkName(order.network)} airtime`,
        rows: [
          { label: 'Network', value: networkName(order.network) },
          { label: 'Send to', value: order.number },
        ],
        amount: order.amount,
        fee: 0,
        total: order.amount,
      };
    case 'bundle':
      return {
        title: `${order.bundle.name} ${order.bundle.allowance}`,
        rows: [
          { label: 'Network', value: networkName(order.bundle.network) },
          { label: 'Valid for', value: order.bundle.validity },
          { label: 'Send to', value: order.number },
        ],
        amount: order.bundle.price,
        fee: 0,
        total: order.bundle.price,
      };
    case 'zesa':
      return {
        title: 'ZESA electricity token',
        rows: [
          { label: 'Meter', value: order.meter },
          { label: 'Customer', value: order.customer.name },
          { label: 'Address', value: order.customer.address },
        ],
        amount: order.amount,
        fee: ZESA_FEE,
        total: Math.round((order.amount + ZESA_FEE) * 100) / 100,
      };
  }
}
