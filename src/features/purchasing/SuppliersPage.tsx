import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { uid } from '../../lib/ids';
import type { Supplier } from '../../types';
import Modal from '../../components/Modal';

export default function SuppliersPage() {
  const suppliers = useStore((s) => s.suppliers);
  const materials = useStore((s) => s.materials);
  const purchaseOrders = useStore((s) => s.purchaseOrders);
  const upsertSupplier = useStore((s) => s.upsertSupplier);
  const deleteSupplier = useStore((s) => s.deleteSupplier);
  const [editing, setEditing] = useState<Supplier | null>(null);

  const inUse = (id: string) =>
    materials.some((m) => m.supplierId === id) || purchaseOrders.some((p) => p.supplierId === id);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Leverantörer</h1>
          <p>Materialleverantörer med ledtider</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setEditing({ id: uid(), name: '', contact: '', email: '', leadTimeDays: 5 })}
        >
          + Ny leverantör
        </button>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Namn</th><th>Kontakt</th><th className="num">Ledtid</th><th className="num">Material</th><th></th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => (
              <tr key={s.id}>
                <td><strong>{s.name}</strong></td>
                <td>{s.contact}<div className="small muted">{s.email}</div></td>
                <td className="num">{s.leadTimeDays} dagar</td>
                <td className="num">{materials.filter((m) => m.supplierId === s.id).length}</td>
                <td>
                  <div className="flex">
                    <button className="btn btn-sm" onClick={() => setEditing(s)}>Redigera</button>
                    <button
                      className="btn btn-danger btn-sm"
                      disabled={inUse(s.id)}
                      title={inUse(s.id) ? 'Leverantören används' : ''}
                      onClick={() => confirm(`Ta bort ${s.name}?`) && deleteSupplier(s.id)}
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
          title={suppliers.some((s) => s.id === editing.id) ? 'Redigera leverantör' : 'Ny leverantör'}
          onClose={() => setEditing(null)}
        >
          <div className="form-grid mb">
            <div className="field">
              <label>Namn</label>
              <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div className="field">
              <label>Kontakt</label>
              <input value={editing.contact} onChange={(e) => setEditing({ ...editing, contact: e.target.value })} />
            </div>
            <div className="field">
              <label>E-post</label>
              <input value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
            </div>
            <div className="field">
              <label>Ledtid (dagar)</label>
              <input
                type="number" min={0} value={editing.leadTimeDays}
                onChange={(e) => setEditing({ ...editing, leadTimeDays: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="flex" style={{ justifyContent: 'flex-end' }}>
            <button className="btn" onClick={() => setEditing(null)}>Avbryt</button>
            <button
              className="btn btn-primary"
              disabled={!editing.name}
              onClick={() => { upsertSupplier(editing); setEditing(null); }}
            >
              Spara
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
