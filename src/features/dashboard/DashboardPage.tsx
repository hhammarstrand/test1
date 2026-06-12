import { Link } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { lateOrders, lowStockMaterials, openOrders, inboundByMaterial } from '../../store/selectors';
import { machineUtilization } from '../../lib/scheduler';
import { addDays, fmtDate, fmtNumber, startOfWeek } from '../../lib/time';
import KpiCard from '../../components/KpiCard';
import { OrderStatusBadge } from '../../components/StatusBadge';

export default function DashboardPage() {
  const orders = useStore((s) => s.orders);
  const resetDemoData = useStore((s) => s.resetDemoData);
  const ops = useStore((s) => s.plannedOperations);
  const machines = useStore((s) => s.machines);
  const materials = useStore((s) => s.materials);
  const purchaseOrders = useStore((s) => s.purchaseOrders);
  const customers = useStore((s) => s.customers);

  const open = openOrders(orders);
  const late = lateOrders(orders, ops);
  const lowStock = lowStockMaterials(materials, purchaseOrders);
  const pendingPos = purchaseOrders.filter((p) => p.status === 'beställd');
  const inbound = inboundByMaterial(purchaseOrders);

  const weekStart = startOfWeek(new Date());
  const weekEnd = addDays(weekStart, 5);
  const activeMachines = machines.filter((m) => m.active);
  const utils = activeMachines.map((m) => ({
    machine: m,
    util: machineUtilization(m, ops, weekStart, weekEnd),
  }));
  const avgUtil =
    utils.length > 0 ? Math.round(utils.reduce((acc, u) => acc + u.util, 0) / utils.length) : 0;

  const customerName = (id: string) => customers.find((c) => c.id === id)?.name ?? '–';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Översikt</h1>
          <p>Läget i verkstaden just nu</p>
        </div>
        <button
          className="btn btn-sm"
          onClick={() => {
            if (confirm('Återställ all data till demodata? Dina ändringar försvinner.')) {
              resetDemoData();
            }
          }}
        >
          ↺ Återställ demodata
        </button>
      </div>

      <div className="kpi-grid">
        <KpiCard value={open.length} label="Öppna ordrar" />
        <KpiCard value={late.length} label="Försenade / riskordrar" tone={late.length > 0 ? 'warn' : 'ok'} />
        <KpiCard value={`${avgUtil} %`} label="Beläggning denna vecka" />
        <KpiCard value={pendingPos.length} label="Väntande inköpsordrar" />
        <KpiCard value={lowStock.length} label="Material under beställningspunkt" tone={lowStock.length > 0 ? 'warn' : 'ok'} />
      </div>

      <div className="card mb">
        <h3>Beläggning per maskin (denna vecka)</h3>
        {utils.map(({ machine, util }) => (
          <div key={machine.id} className="flex" style={{ marginBottom: '0.5rem' }}>
            <div style={{ width: 220 }} className="small">{machine.name}</div>
            <div className="util-bar" style={{ flex: 1 }}>
              <div
                className={`util-bar-fill${util > 100 ? ' over' : util > 85 ? ' high' : ''}`}
                style={{ width: `${Math.min(util, 100)}%` }}
              />
            </div>
            <div style={{ width: 48, textAlign: 'right' }} className="small">{util} %</div>
          </div>
        ))}
        <div className="small muted mt">
          <Link to="/planering">Öppna beläggningsvyn →</Link>
        </div>
      </div>

      <h2>Försenade / riskordrar</h2>
      {late.length === 0 ? (
        <div className="alert alert-ok">Inga försenade ordrar — bra läge! ✓</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Order</th><th>Kund</th><th>Status</th><th>Tidigaste leverans</th><th></th>
              </tr>
            </thead>
            <tbody>
              {late.map((o) => (
                <tr key={o.id} className="row-warn">
                  <td><Link to={`/ordrar/${o.id}`}>{o.orderNo}</Link></td>
                  <td>{customerName(o.customerId)}</td>
                  <td><OrderStatusBadge status={o.status} /></td>
                  <td>{fmtDate(o.lines.reduce((min, l) => (l.dueDate < min ? l.dueDate : min), o.lines[0]?.dueDate ?? ''))}</td>
                  <td><Link to={`/ordrar/${o.id}`} className="btn btn-sm">Visa</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2>Lågt lagersaldo</h2>
      {lowStock.length === 0 ? (
        <div className="alert alert-ok">Allt material över beställningspunkt. ✓</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Material</th><th className="num">Saldo</th><th className="num">Inkommande</th>
                <th className="num">Beställningspunkt</th><th></th>
              </tr>
            </thead>
            <tbody>
              {lowStock.map((m) => (
                <tr key={m.id} className="row-danger">
                  <td>{m.number} · {m.name}</td>
                  <td className="num">{fmtNumber(m.stockQty)} {m.unit}</td>
                  <td className="num">{fmtNumber(inbound.get(m.id) ?? 0)} {m.unit}</td>
                  <td className="num">{fmtNumber(m.reorderPoint)} {m.unit}</td>
                  <td><Link to="/lager" className="btn btn-sm">Beställ</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
