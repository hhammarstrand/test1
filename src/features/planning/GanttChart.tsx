import type { Machine, Order, PlannedOperation } from '../../types';
import { machineUtilization } from '../../lib/scheduler';
import { addDays, isWeekend, startOfWeek } from '../../lib/time';

// Stabil färg per order så staplar går att para ihop visuellt
const PALETTE = ['#1f5fa8', '#0e8a7d', '#7d4ba0', '#b3641c', '#386641', '#8c2f5d', '#3f5e78', '#946b00'];

function orderColor(orderId: string, orderIndex: Map<string, number>): string {
  return PALETTE[(orderIndex.get(orderId) ?? 0) % PALETTE.length];
}

interface Props {
  machines: Machine[];
  ops: PlannedOperation[];
  orders: Order[];
  horizonStart: Date;
  horizonDays: number;
  conflicts: Set<string>;
  lateOps: Set<string>;
  selectedOpId: string | null;
  onSelectOp: (opId: string) => void;
}

const dayLabelFmt = new Intl.DateTimeFormat('sv-SE', { weekday: 'short', day: 'numeric', month: 'numeric' });

export default function GanttChart({
  machines, ops, orders, horizonStart, horizonDays, conflicts, lateOps, selectedOpId, onSelectOp,
}: Props) {
  const horizonEnd = addDays(horizonStart, horizonDays);
  const startMs = horizonStart.getTime();
  const totalMs = horizonEnd.getTime() - startMs;
  const pct = (d: Date) => ((d.getTime() - startMs) / totalMs) * 100;

  const days = Array.from({ length: horizonDays }, (_, i) => addDays(horizonStart, i));
  const orderById = new Map(orders.map((o) => [o.id, o]));
  const orderIndex = new Map(orders.map((o, i) => [o.id, i]));
  const now = new Date();
  const showNow = now >= horizonStart && now < horizonEnd;

  const weekStart = startOfWeek(now);
  const weekEnd = addDays(weekStart, 5);

  return (
    <div className="gantt">
      <div className="gantt-scroll">
        <div className="gantt-inner">
          <div className="gantt-header-row">
            <div className="gantt-machine-col"><strong className="small">Maskin</strong></div>
            <div className="gantt-timeline">
              <div className="gantt-days" style={{ position: 'relative' }}>
                {days.map((d) => (
                  <div key={d.toISOString()} className={`gantt-day${isWeekend(d) ? ' weekend' : ''}`}>
                    {dayLabelFmt.format(d)}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {machines.map((machine) => {
            const machineOps = ops.filter((op) => op.machineId === machine.id && op.start && op.end);
            const util = machineUtilization(machine, ops, weekStart, weekEnd);
            return (
              <div className="gantt-row" key={machine.id}>
                <div className="gantt-machine-col">
                  <div className="gantt-machine-name">{machine.name}</div>
                  <div className="gantt-machine-meta">
                    {machine.hoursPerDay} h/dag
                    <span className={`util-badge${util > 100 ? ' over' : util > 85 ? ' high' : ''}`}>
                      {util} %
                    </span>
                  </div>
                </div>
                <div className="gantt-timeline">
                  <div className="gantt-days">
                    {days.map((d) => (
                      <div key={d.toISOString()} className={`gantt-day${isWeekend(d) ? ' weekend' : ''}`} />
                    ))}
                  </div>
                  {showNow && <div className="gantt-now-line" style={{ left: `${pct(now)}%` }} />}
                  {machineOps.map((op) => {
                    const s = new Date(op.start);
                    const e = new Date(op.end);
                    if (e <= horizonStart || s >= horizonEnd) return null;
                    const left = Math.max(0, pct(s));
                    const right = Math.min(100, pct(e));
                    const order = orderById.get(op.orderId);
                    const cls = [
                      'gantt-bar',
                      op.locked ? 'locked' : '',
                      op.status === 'klar' ? 'done' : '',
                      lateOps.has(op.id) ? 'late' : '',
                      conflicts.has(op.id) ? 'conflict' : '',
                      selectedOpId === op.id ? 'selected' : '',
                    ].filter(Boolean).join(' ');
                    return (
                      <div
                        key={op.id}
                        className={cls}
                        style={{
                          left: `${left}%`,
                          width: `${Math.max(right - left, 0.4)}%`,
                          background: orderColor(op.orderId, orderIndex),
                        }}
                        title={`${order?.orderNo ?? ''} · Op ${op.operationNo} ${op.description}\n${s.toLocaleString('sv-SE')} – ${e.toLocaleString('sv-SE')}${op.locked ? '\n🔒 Låst (manuellt placerad)' : ''}`}
                        onClick={() => onSelectOp(op.id)}
                      >
                        {order?.orderNo} · Op {op.operationNo} {op.description}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="gantt-legend">
        <span><span className="legend-chip" style={{ background: '#1f5fa8' }} /> Operation (färg per order)</span>
        <span><span className="legend-chip" style={{ background: '#1f5fa8', border: '2px solid #16263a' }} /> Låst (manuellt flyttad)</span>
        <span><span className="legend-chip" style={{ background: '#1f5fa8', outline: '3px solid var(--amber)' }} /> Klar efter leveransdatum</span>
        <span><span className="legend-chip" style={{ background: '#1f5fa8', outline: '3px solid var(--red)' }} /> Konflikt (överlapp)</span>
        <span><span className="legend-chip" style={{ background: 'var(--red)', width: 3 }} /> Nu</span>
      </div>
    </div>
  );
}
