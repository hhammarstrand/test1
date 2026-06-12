import { Link } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { fmtDateTime, fmtMinutes } from '../../lib/time';
import type { PlannedOperation } from '../../types';

interface Props {
  op: PlannedOperation;
  onClose: () => void;
}

export default function OperationPanel({ op, onClose }: Props) {
  const machines = useStore((s) => s.machines);
  const orders = useStore((s) => s.orders);
  const rescheduleOperation = useStore((s) => s.rescheduleOperation);
  const unlockOperation = useStore((s) => s.unlockOperation);
  const setOperationStatus = useStore((s) => s.setOperationStatus);

  const machine = machines.find((m) => m.id === op.machineId);
  const order = orders.find((o) => o.id === op.orderId);
  const line = order?.lines.find((l) => l.id === op.orderLineId);
  const compatible = machines.filter((m) => m.type === op.machineType && m.active && m.id !== op.machineId);

  return (
    <div className="card op-panel">
      <div className="flex" style={{ justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0 }}>
          {order ? <Link to={`/ordrar/${order.id}`}>{order.orderNo}</Link> : '–'} · Op {op.operationNo} {op.description}
          {op.locked && <span className="badge badge-grey" style={{ marginLeft: 8 }}>🔒 Låst</span>}
        </h3>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>✕ Stäng</button>
      </div>

      <dl>
        <dt>Maskin</dt><dd>{machine?.name ?? '–'}</dd>
        <dt>Tid</dt><dd>{fmtDateTime(op.start)} – {fmtDateTime(op.end)} ({fmtMinutes(op.durationMin)})</dd>
        <dt>Leveransdatum</dt><dd>{line?.dueDate ?? '–'}</dd>
        <dt>Status</dt>
        <dd>
          <select
            value={op.status}
            onChange={(e) => setOperationStatus(op.id, e.target.value as PlannedOperation['status'])}
          >
            <option value="planerad">Planerad</option>
            <option value="pågår">Pågår</option>
            <option value="klar">Klar</option>
          </select>
        </dd>
      </dl>

      <div className="flex">
        <span className="small muted">Flytta:</span>
        <button className="btn btn-sm" onClick={() => rescheduleOperation(op.id, { shiftMinutes: -24 * 60 })}>← 1 dag</button>
        <button className="btn btn-sm" onClick={() => rescheduleOperation(op.id, { shiftMinutes: -60 })}>← 1 h</button>
        <button className="btn btn-sm" onClick={() => rescheduleOperation(op.id, { shiftMinutes: 60 })}>1 h →</button>
        <button className="btn btn-sm" onClick={() => rescheduleOperation(op.id, { shiftMinutes: 24 * 60 })}>1 dag →</button>
        {compatible.length > 0 && (
          <>
            <span className="small muted" style={{ marginLeft: 8 }}>Byt maskin:</span>
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) rescheduleOperation(op.id, { newMachineId: e.target.value });
              }}
            >
              <option value="">Välj maskin …</option>
              {compatible.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </>
        )}
        {op.locked && (
          <button className="btn btn-sm" onClick={() => unlockOperation(op.id)}>🔓 Lås upp</button>
        )}
      </div>
      <p className="small muted" style={{ marginBottom: 0 }}>
        Manuell flytt låser operationen — övriga operationer schemaläggs om runt den.
        Flytt med klockslag hamnar alltid inom arbetstid (mån–fre).
      </p>
    </div>
  );
}
