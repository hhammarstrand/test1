import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { materialRequirements } from '../../store/selectors';
import { fmtDate, fmtDateTime, fmtNumber, fmtSEK, addDays, toISODate } from '../../lib/time';
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABELS } from '../../types';
import { OrderStatusBadge } from '../../components/StatusBadge';
import { uid } from '../../lib/ids';

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const order = useStore((s) => s.orders.find((o) => o.id === id));
  const customers = useStore((s) => s.customers);
  const articles = useStore((s) => s.articles);
  const materials = useStore((s) => s.materials);
  const suppliers = useStore((s) => s.suppliers);
  const purchaseOrders = useStore((s) => s.purchaseOrders);
  const ops = useStore((s) => s.plannedOperations);
  const machines = useStore((s) => s.machines);
  const setOrderStatus = useStore((s) => s.setOrderStatus);
  const updateOrder = useStore((s) => s.updateOrder);
  const deleteOrder = useStore((s) => s.deleteOrder);
  const createPurchaseOrder = useStore((s) => s.createPurchaseOrder);

  if (!order) {
    return <div className="empty-state">Ordern hittades inte. <Link to="/ordrar">Till orderlistan</Link></div>;
  }

  const customer = customers.find((c) => c.id === order.customerId);
  const articleById = new Map(articles.map((a) => [a.id, a]));
  const statusIdx = ORDER_STATUS_FLOW.indexOf(order.status);
  const nextStatus = ORDER_STATUS_FLOW[statusIdx + 1];
  const editable = order.status === 'offert' || order.status === 'bekräftad';

  const reqs = order.status === 'bekräftad'
    ? materialRequirements(order, articles, materials, purchaseOrders)
    : [];
  const shortages = reqs.filter((r) => r.shortage > 0);
  const orderOps = ops
    .filter((op) => op.orderId === order.id)
    .sort((a, b) => a.start.localeCompare(b.start));
  const total = order.lines.reduce(
    (sum, l) => sum + (articleById.get(l.articleId)?.price ?? 0) * l.qty, 0,
  );

  const orderShortage = () => {
    // Grupper brister per leverantör och skapa en IO per leverantör
    const bySupplier = new Map<string, { materialId: string; qty: number }[]>();
    for (const r of shortages) {
      const mat = materials.find((m) => m.id === r.materialId);
      if (!mat) continue;
      const qty = Math.max(r.shortage, mat.reorderQty);
      const list = bySupplier.get(mat.supplierId) ?? [];
      list.push({ materialId: mat.id, qty });
      bySupplier.set(mat.supplierId, list);
    }
    for (const [supplierId, lines] of bySupplier) {
      const supplier = suppliers.find((s) => s.id === supplierId);
      createPurchaseOrder(
        supplierId,
        lines.map((l) => ({ id: uid(), materialId: l.materialId, qty: l.qty })),
        toISODate(addDays(new Date(), supplier?.leadTimeDays ?? 5)),
      );
    }
    navigate('/inkop');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{order.orderNo}</h1>
          <p>
            {customer?.name ?? '–'} · Skapad {fmtDate(order.createdDate)} · Ordervärde {fmtSEK(total)}
          </p>
        </div>
        <div className="flex">
          <OrderStatusBadge status={order.status} />
          {nextStatus && (
            <button
              className="btn btn-primary"
              onClick={() => {
                if (nextStatus === 'i_produktion') {
                  setOrderStatus(order.id, nextStatus);
                  navigate(`/planering?order=${order.id}`);
                } else {
                  setOrderStatus(order.id, nextStatus);
                }
              }}
            >
              {nextStatus === 'i_produktion' ? '▶ Frisläpp till produktion' : `→ ${ORDER_STATUS_LABELS[nextStatus]}`}
            </button>
          )}
          {order.status === 'offert' && (
            <button
              className="btn btn-danger"
              onClick={() => {
                if (confirm(`Ta bort ${order.orderNo}?`)) {
                  deleteOrder(order.id);
                  navigate('/ordrar');
                }
              }}
            >
              Ta bort
            </button>
          )}
        </div>
      </div>

      {order.status === 'bekräftad' && shortages.length > 0 && (
        <div className="alert alert-warn flex">
          <span style={{ flex: 1 }}>
            ⚠ Materialbrist för {shortages.length} material — beställ innan frisläpp för att undvika negativt saldo.
          </span>
          <button className="btn btn-sm" onClick={orderShortage}>Skapa inköpsorder för brist</button>
        </div>
      )}
      {order.status === 'bekräftad' && reqs.length > 0 && shortages.length === 0 && (
        <div className="alert alert-ok">✓ Allt material finns tillgängligt (saldo + inkommande).</div>
      )}

      <h2>Orderrader</h2>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Artikel</th><th className="num">Antal</th><th>Leveransdatum</th>
              <th className="num">À-pris</th><th className="num">Summa</th>{editable && <th></th>}
            </tr>
          </thead>
          <tbody>
            {order.lines.map((line) => {
              const article = articleById.get(line.articleId);
              return (
                <tr key={line.id}>
                  <td>
                    {article ? <Link to={`/artiklar/${article.id}`}>{article.number} · {article.name}</Link> : '–'}
                  </td>
                  <td className="num">
                    {editable ? (
                      <input
                        type="number" min={1} value={line.qty} style={{ width: 80 }}
                        onChange={(e) =>
                          updateOrder({
                            ...order,
                            lines: order.lines.map((l) =>
                              l.id === line.id ? { ...l, qty: Number(e.target.value) } : l,
                            ),
                          })
                        }
                      />
                    ) : fmtNumber(line.qty)}
                  </td>
                  <td>
                    {editable ? (
                      <input
                        type="date" value={line.dueDate}
                        onChange={(e) =>
                          updateOrder({
                            ...order,
                            lines: order.lines.map((l) =>
                              l.id === line.id ? { ...l, dueDate: e.target.value } : l,
                            ),
                          })
                        }
                      />
                    ) : fmtDate(line.dueDate)}
                  </td>
                  <td className="num">{article ? fmtSEK(article.price) : '–'}</td>
                  <td className="num">{article ? fmtSEK(article.price * line.qty) : '–'}</td>
                  {editable && (
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        disabled={order.lines.length === 1}
                        onClick={() =>
                          updateOrder({ ...order, lines: order.lines.filter((l) => l.id !== line.id) })
                        }
                      >
                        ✕
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {order.status === 'bekräftad' && reqs.length > 0 && (
        <>
          <h2>Materialbehov</h2>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Material</th><th className="num">Behov</th>
                  <th className="num">Tillgängligt (saldo + inkommande)</th><th className="num">Brist</th>
                </tr>
              </thead>
              <tbody>
                {reqs.map((r) => {
                  const mat = materials.find((m) => m.id === r.materialId);
                  return (
                    <tr key={r.materialId} className={r.shortage > 0 ? 'row-danger' : ''}>
                      <td>{mat ? `${mat.number} · ${mat.name}` : '–'}</td>
                      <td className="num">{fmtNumber(r.required)} {mat?.unit}</td>
                      <td className="num">{fmtNumber(r.available)} {mat?.unit}</td>
                      <td className="num">{r.shortage > 0 ? `${fmtNumber(r.shortage)} ${mat?.unit}` : '–'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {orderOps.length > 0 && (
        <>
          <h2>Planerade operationer</h2>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Op</th><th>Beskrivning</th><th>Maskin</th>
                  <th>Start</th><th>Slut</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orderOps.map((op) => (
                  <tr key={op.id}>
                    <td>{op.operationNo}</td>
                    <td>{op.description}</td>
                    <td>{machines.find((m) => m.id === op.machineId)?.name ?? '–'}</td>
                    <td>{fmtDateTime(op.start)}</td>
                    <td>{fmtDateTime(op.end)}</td>
                    <td>
                      <span className={`badge ${op.status === 'klar' ? 'badge-green' : op.status === 'pågår' ? 'badge-indigo' : 'badge-grey'}`}>
                        {op.status === 'klar' ? 'Klar' : op.status === 'pågår' ? 'Pågår' : 'Planerad'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="small mt">
            <Link to={`/planering?order=${order.id}`}>Visa i beläggningsvyn →</Link>
          </div>
        </>
      )}
    </div>
  );
}
