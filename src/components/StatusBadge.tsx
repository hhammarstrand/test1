import type { OrderStatus, PurchaseOrderStatus } from '../types';
import { ORDER_STATUS_LABELS } from '../types';

const ORDER_COLORS: Record<OrderStatus, string> = {
  offert: 'badge-grey',
  bekräftad: 'badge-blue',
  i_produktion: 'badge-indigo',
  klar: 'badge-green',
  levererad: 'badge-grey',
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`badge ${ORDER_COLORS[status]}`}>{ORDER_STATUS_LABELS[status]}</span>;
}

export function PoStatusBadge({ status }: { status: PurchaseOrderStatus }) {
  return (
    <span className={`badge ${status === 'beställd' ? 'badge-blue' : 'badge-green'}`}>
      {status === 'beställd' ? 'Beställd' : 'Mottagen'}
    </span>
  );
}
