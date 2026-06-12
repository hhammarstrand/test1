import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { lateOrders } from '../../store/selectors';
import { fmtDate } from '../../lib/time';
import { ORDER_STATUS_LABELS, type OrderStatus } from '../../types';
import { OrderStatusBadge } from '../../components/StatusBadge';
import OrderForm from './OrderForm';

export default function OrdersPage() {
  const orders = useStore((s) => s.orders);
  const customers = useStore((s) => s.customers);
  const ops = useStore((s) => s.plannedOperations);
  const [filter, setFilter] = useState<OrderStatus | 'alla'>('alla');
  const [showNew, setShowNew] = useState(false);
  const navigate = useNavigate();

  const lateIds = new Set(lateOrders(orders, ops).map((o) => o.id));
  const customerName = (id: string) => customers.find((c) => c.id === id)?.name ?? '–';

  const filtered = orders
    .filter((o) => filter === 'alla' || o.status === filter)
    .sort((a, b) => b.orderNo.localeCompare(a.orderNo));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Ordrar</h1>
          <p>Kundordrar från offert till leverans</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}>+ Ny order</button>
      </div>

      <div className="toolbar">
        <select value={filter} onChange={(e) => setFilter(e.target.value as OrderStatus | 'alla')}>
          <option value="alla">Alla statusar</option>
          {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <span className="muted small">{filtered.length} ordrar</span>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">Inga ordrar matchar filtret.</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Ordernr</th><th>Kund</th><th>Status</th>
                <th className="num">Rader</th><th>Tidigaste leverans</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const earliestDue = o.lines.reduce(
                  (min, l) => (l.dueDate < min ? l.dueDate : min),
                  o.lines[0]?.dueDate ?? '',
                );
                return (
                  <tr key={o.id} className={lateIds.has(o.id) ? 'row-warn' : ''}>
                    <td><Link to={`/ordrar/${o.id}`}><strong>{o.orderNo}</strong></Link></td>
                    <td>{customerName(o.customerId)}</td>
                    <td><OrderStatusBadge status={o.status} /></td>
                    <td className="num">{o.lines.length}</td>
                    <td>
                      {fmtDate(earliestDue)}
                      {lateIds.has(o.id) && <span className="badge badge-amber" style={{ marginLeft: 6 }}>Sen</span>}
                    </td>
                    <td><Link to={`/ordrar/${o.id}`} className="btn btn-sm">Öppna</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showNew && (
        <OrderForm
          onClose={() => setShowNew(false)}
          onCreated={(id) => {
            setShowNew(false);
            navigate(`/ordrar/${id}`);
          }}
        />
      )}
    </div>
  );
}
