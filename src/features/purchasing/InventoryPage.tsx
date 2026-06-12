import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { inboundByMaterial } from '../../store/selectors';
import { addDays, fmtNumber, fmtSEK, toISODate } from '../../lib/time';
import { uid } from '../../lib/ids';
import type { Material, MaterialUnit } from '../../types';
import Modal from '../../components/Modal';

export default function InventoryPage() {
  const materials = useStore((s) => s.materials);
  const suppliers = useStore((s) => s.suppliers);
  const purchaseOrders = useStore((s) => s.purchaseOrders);
  const upsertMaterial = useStore((s) => s.upsertMaterial);
  const createPurchaseOrder = useStore((s) => s.createPurchaseOrder);
  const navigate = useNavigate();
  const [editing, setEditing] = useState<Material | null>(null);

  const inbound = inboundByMaterial(purchaseOrders);

  const orderMaterial = (m: Material) => {
    const supplier = suppliers.find((s) => s.id === m.supplierId);
    const po = createPurchaseOrder(
      m.supplierId,
      [{ id: uid(), materialId: m.id, qty: m.reorderQty }],
      toISODate(addDays(new Date(), supplier?.leadTimeDays ?? 5)),
    );
    navigate(`/inkop/${po.id}`);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Lager</h1>
          <p>Materialsaldon och beställningspunkter</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() =>
            setEditing({
              id: uid(), number: '', name: '', unit: 'st', stockQty: 0,
              reorderPoint: 0, reorderQty: 0, supplierId: suppliers[0]?.id ?? '', price: 0,
            })
          }
        >
          + Nytt material
        </button>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Material</th><th className="num">Saldo</th><th className="num">Inkommande</th>
              <th className="num">Beställningspunkt</th><th>Leverantör</th>
              <th className="num">Pris</th><th></th>
            </tr>
          </thead>
          <tbody>
            {materials.map((m) => {
              const inboundQty = inbound.get(m.id) ?? 0;
              const low = m.stockQty + inboundQty < m.reorderPoint;
              const negative = m.stockQty < 0;
              return (
                <tr key={m.id} className={negative || low ? 'row-danger' : ''}>
                  <td><strong>{m.number}</strong> · {m.name}</td>
                  <td className="num">
                    {fmtNumber(m.stockQty)} {m.unit}
                    {negative && <span className="badge badge-red" style={{ marginLeft: 6 }}>Negativt!</span>}
                  </td>
                  <td className="num">{inboundQty > 0 ? `${fmtNumber(inboundQty)} ${m.unit}` : '–'}</td>
                  <td className="num">{fmtNumber(m.reorderPoint)} {m.unit}</td>
                  <td>{suppliers.find((s) => s.id === m.supplierId)?.name ?? '–'}</td>
                  <td className="num">{fmtSEK(m.price)}/{m.unit}</td>
                  <td>
                    <div className="flex">
                      {low && (
                        <button className="btn btn-primary btn-sm" onClick={() => orderMaterial(m)}>
                          Beställ {fmtNumber(m.reorderQty)} {m.unit}
                        </button>
                      )}
                      <button className="btn btn-sm" onClick={() => setEditing(m)}>Redigera</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal
          title={materials.some((m) => m.id === editing.id) ? 'Redigera material' : 'Nytt material'}
          onClose={() => setEditing(null)}
        >
          <div className="form-grid mb">
            <div className="field">
              <label>Materialnr</label>
              <input value={editing.number} onChange={(e) => setEditing({ ...editing, number: e.target.value })} />
            </div>
            <div className="field">
              <label>Benämning</label>
              <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div className="field">
              <label>Enhet</label>
              <select value={editing.unit} onChange={(e) => setEditing({ ...editing, unit: e.target.value as MaterialUnit })}>
                <option value="st">st</option>
                <option value="kg">kg</option>
                <option value="m">m</option>
              </select>
            </div>
            <div className="field">
              <label>Saldo</label>
              <input type="number" value={editing.stockQty} onChange={(e) => setEditing({ ...editing, stockQty: Number(e.target.value) })} />
            </div>
            <div className="field">
              <label>Beställningspunkt</label>
              <input type="number" min={0} value={editing.reorderPoint} onChange={(e) => setEditing({ ...editing, reorderPoint: Number(e.target.value) })} />
            </div>
            <div className="field">
              <label>Beställningskvantitet</label>
              <input type="number" min={0} value={editing.reorderQty} onChange={(e) => setEditing({ ...editing, reorderQty: Number(e.target.value) })} />
            </div>
            <div className="field">
              <label>Leverantör</label>
              <select value={editing.supplierId} onChange={(e) => setEditing({ ...editing, supplierId: e.target.value })}>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Pris (SEK/enhet)</label>
              <input type="number" min={0} value={editing.price} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} />
            </div>
          </div>
          <div className="flex" style={{ justifyContent: 'flex-end' }}>
            <button className="btn" onClick={() => setEditing(null)}>Avbryt</button>
            <button
              className="btn btn-primary"
              disabled={!editing.number || !editing.name}
              onClick={() => { upsertMaterial(editing); setEditing(null); }}
            >
              Spara
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
