import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { uid } from '../../lib/ids';
import { MACHINE_TYPE_LABELS, type Machine, type MachineType } from '../../types';
import Modal from '../../components/Modal';

export default function MachinesPage() {
  const machines = useStore((s) => s.machines);
  const ops = useStore((s) => s.plannedOperations);
  const upsertMachine = useStore((s) => s.upsertMachine);
  const deleteMachine = useStore((s) => s.deleteMachine);
  const [editing, setEditing] = useState<Machine | null>(null);

  const hasOps = (id: string) => ops.some((op) => op.machineId === id);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Maskiner</h1>
          <p>Arbetsställen med kapacitet (arbetstid mån–fre)</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() =>
            setEditing({ id: uid(), name: '', type: 'svarv', hoursPerDay: 8, workdayStartHour: 7, active: true })
          }
        >
          + Ny maskin
        </button>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Namn</th><th>Typ</th><th>Arbetstid</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {machines.map((m) => (
              <tr key={m.id}>
                <td><strong>{m.name}</strong></td>
                <td>{MACHINE_TYPE_LABELS[m.type]}</td>
                <td>
                  {String(m.workdayStartHour).padStart(2, '0')}:00–
                  {String(m.workdayStartHour + m.hoursPerDay).padStart(2, '0')}:00 ({m.hoursPerDay} h/dag)
                </td>
                <td>
                  <span className={`badge ${m.active ? 'badge-green' : 'badge-grey'}`}>
                    {m.active ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </td>
                <td>
                  <div className="flex">
                    <button className="btn btn-sm" onClick={() => setEditing(m)}>Redigera</button>
                    <button
                      className="btn btn-danger btn-sm"
                      disabled={hasOps(m.id)}
                      title={hasOps(m.id) ? 'Maskinen har planerade operationer' : ''}
                      onClick={() => confirm(`Ta bort ${m.name}?`) && deleteMachine(m.id)}
                    >
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal
          title={machines.some((m) => m.id === editing.id) ? 'Redigera maskin' : 'Ny maskin'}
          onClose={() => setEditing(null)}
        >
          <div className="form-grid mb">
            <div className="field">
              <label>Namn</label>
              <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div className="field">
              <label>Typ</label>
              <select
                value={editing.type}
                onChange={(e) => setEditing({ ...editing, type: e.target.value as MachineType })}
              >
                {Object.entries(MACHINE_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Arbetsdag börjar (timme)</label>
              <input
                type="number" min={0} max={23} value={editing.workdayStartHour}
                onChange={(e) => setEditing({ ...editing, workdayStartHour: Number(e.target.value) })}
              />
            </div>
            <div className="field">
              <label>Timmar per dag</label>
              <input
                type="number" min={1} max={24} value={editing.hoursPerDay}
                onChange={(e) => setEditing({ ...editing, hoursPerDay: Number(e.target.value) })}
              />
            </div>
            <div className="field">
              <label>Status</label>
              <select
                value={editing.active ? 'aktiv' : 'inaktiv'}
                onChange={(e) => setEditing({ ...editing, active: e.target.value === 'aktiv' })}
              >
                <option value="aktiv">Aktiv</option>
                <option value="inaktiv">Inaktiv</option>
              </select>
            </div>
          </div>
          <div className="flex" style={{ justifyContent: 'flex-end' }}>
            <button className="btn" onClick={() => setEditing(null)}>Avbryt</button>
            <button
              className="btn btn-primary"
              disabled={!editing.name}
              onClick={() => { upsertMachine(editing); setEditing(null); }}
            >
              Spara
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
