import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { findConflicts, findLateOps } from '../../lib/conflicts';
import { addDays, fmtDateTime, startOfWeek } from '../../lib/time';
import GanttChart from './GanttChart';
import OperationPanel from './OperationPanel';

export default function PlanningPage() {
  const machines = useStore((s) => s.machines);
  const ops = useStore((s) => s.plannedOperations);
  const orders = useStore((s) => s.orders);
  const autoScheduleAll = useStore((s) => s.autoScheduleAll);

  const [searchParams, setSearchParams] = useSearchParams();
  const orderFilter = searchParams.get('order') ?? '';
  const [weekOffset, setWeekOffset] = useState(0);
  const [horizonWeeks, setHorizonWeeks] = useState(2);
  const [selectedOpId, setSelectedOpId] = useState<string | null>(null);

  const horizonStart = addDays(startOfWeek(new Date()), weekOffset * 7);
  const horizonDays = horizonWeeks * 7;

  const activeMachines = machines.filter((m) => m.active);
  const visibleOps = orderFilter ? ops.filter((op) => op.orderId === orderFilter) : ops;

  const conflicts = useMemo(() => findConflicts(ops), [ops]);
  const lateOps = useMemo(() => findLateOps(ops, orders), [ops, orders]);

  const selectedOp = ops.find((op) => op.id === selectedOpId) ?? null;
  const ordersInProduction = orders.filter((o) =>
    ops.some((op) => op.orderId === o.id),
  );
  const problems = ops
    .filter((op) => conflicts.has(op.id) || lateOps.has(op.id))
    .sort((a, b) => a.start.localeCompare(b.start));
  const orderNo = (id: string) => orders.find((o) => o.id === id)?.orderNo ?? '–';
  const machineName = (id: string) => machines.find((m) => m.id === id)?.name ?? '–';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Beläggning</h1>
          <p>Planerade operationer per maskin — klicka på en stapel för att flytta eller byta maskin</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => autoScheduleAll()}
          title="Schemalägger om alla olåsta operationer (EDD-prioritet, framåt från nu)"
        >
          ⟳ Schemalägg om allt
        </button>
      </div>

      <div className="toolbar">
        <button className="btn btn-sm" onClick={() => setWeekOffset((w) => w - 1)}>← Föregående vecka</button>
        <button className="btn btn-sm" onClick={() => setWeekOffset(0)} disabled={weekOffset === 0}>Denna vecka</button>
        <button className="btn btn-sm" onClick={() => setWeekOffset((w) => w + 1)}>Nästa vecka →</button>
        <select value={horizonWeeks} onChange={(e) => setHorizonWeeks(Number(e.target.value))}>
          <option value={1}>1 vecka</option>
          <option value={2}>2 veckor</option>
          <option value={4}>4 veckor</option>
        </select>
        <span className="spacer" />
        <select
          value={orderFilter}
          onChange={(e) => {
            if (e.target.value) setSearchParams({ order: e.target.value });
            else setSearchParams({});
          }}
        >
          <option value="">Alla ordrar</option>
          {ordersInProduction.map((o) => (
            <option key={o.id} value={o.id}>{o.orderNo}</option>
          ))}
        </select>
      </div>

      {ops.length === 0 ? (
        <div className="empty-state">
          Inga planerade operationer ännu. Frisläpp en <Link to="/ordrar">bekräftad order</Link> till
          produktion så schemaläggs operationerna här.
        </div>
      ) : (
        <GanttChart
          machines={activeMachines}
          ops={visibleOps}
          orders={orders}
          horizonStart={horizonStart}
          horizonDays={horizonDays}
          conflicts={conflicts}
          lateOps={lateOps}
          selectedOpId={selectedOpId}
          onSelectOp={(id) => setSelectedOpId(id === selectedOpId ? null : id)}
        />
      )}

      {selectedOp && <OperationPanel op={selectedOp} onClose={() => setSelectedOpId(null)} />}

      {problems.length > 0 && (
        <>
          <h2>Avvikelser</h2>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Typ</th><th>Order</th><th>Operation</th><th>Maskin</th><th>Slut</th>
                </tr>
              </thead>
              <tbody>
                {problems.map((op) => (
                  <tr key={op.id} className={conflicts.has(op.id) ? 'row-danger' : 'row-warn'}>
                    <td>
                      {conflicts.has(op.id) && <span className="badge badge-red">Konflikt</span>}{' '}
                      {lateOps.has(op.id) && <span className="badge badge-amber">Efter leveransdatum</span>}
                    </td>
                    <td>{orderNo(op.orderId)}</td>
                    <td>Op {op.operationNo} {op.description}</td>
                    <td>{machineName(op.machineId)}</td>
                    <td>{fmtDateTime(op.end)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
