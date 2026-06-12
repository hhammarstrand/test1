import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { addDays, fmtDate, toISODate } from '../../lib/time';
import { uid } from '../../lib/ids';
import type { PurchaseOrderLine } from '../../types';
import { PoStatusBadge } from '../../components/StatusBadge';
import Modal from '../../components/Modal';

export default function PurchaseOrdersPage() {
  const purchaseOrders = useStore((s) => s.purchaseOrders);
  const suppliers = useStore((s) => s.suppliers);
  const materials = useStore((s) => s.materials);
  const createPurchaseOrder = useStore((s) => s.createPurchaseOrder);
  const receivePurchaseOrder = useStore((s) => s.receivePurchaseOrder);
  const navigate = useNavigate();

  const [showNew, setShowNew] = useState(false);
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? '');
  const [lines, setLines] = useState<PurchaseOrderLine[]>([
    { id: uid(), materialId: materials[0]?.id ?? '', qty: 10 },
  ]);

  const supplierName = (id: string) => suppliers.find((s) => s.id === id)?.name ?? '–';
  const sorted = [...purchaseOrders].sort((a, b) => b.poNo.localeCompare(a.poNo));
  const supplierMaterials = materials.filter((m) => m.supplierId === supplierId);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Inköp</h1>
          <p>Inköpsordrar till leverantörer</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            const sid = suppliers[0]?.id ?? '';
            setSupplierId(sid);
            const first = materials.find((m) => m.supplierId === sid) ?? materials[0];
            setLines([{ id: uid(), materialId: first?.id ?? '', qty: first?.reorderQty || 10 }]);
            setShowNew(true);
          }}
        >
          + Ny inköpsorder
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="empty-state">Inga inköpsordrar ännu.</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Inköpsnr</th><th>Leverantör</th><th>Status</th>
                <th>Beställd</th><th>Förväntad leverans</th><th className="num">Rader</th><th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((po) => (
                <tr key={po.id}>
                  <td><Link to={`/inkop/${po.id}`}><strong>{po.poNo}</strong></Link></td>
                  <td>{supplierName(po.supplierId)}</td>
                  <td><PoStatusBadge status={po.status} /></td>
                  <td>{fmtDate(po.orderDate)}</td>
                  <td>{fmtDate(po.expectedDate)}</td>
                  <td className="num">{po.lines.length}</td>
                  <td>
                    <div className="flex">
                      <Link to={`/inkop/${po.id}`} className="btn btn-sm">Öppna</Link>
                      {po.status === 'beställd' && (
                        <button className="btn btn-primary btn-sm" onClick={() => receivePurchaseOrder(po.id)}>
                          Mottag
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showNew && (
        <Modal title="Ny inköpsorder" onClose={() => setShowNew(false)}>
          <div className="field mb">
            <label>Leverantör</label>
            <select
              value={supplierId}
              onChange={(e) => {
                setSupplierId(e.target.value);
                const first = materials.find((m) => m.supplierId === e.target.value);
                if (first) setLines([{ id: uid(), materialId: first.id, qty: first.reorderQty || 10 }]);
              }}
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <h3>Rader</h3>
          {lines.map((line) => (
            <div key={line.id} className="flex mb" style={{ alignItems: 'flex-end' }}>
              <div className="field" style={{ flex: 2 }}>
                <label>Material</label>
                <select
                  value={line.materialId}
                  onChange={(e) =>
                    setLines((ls) => ls.map((l) => (l.id === line.id ? { ...l, materialId: e.target.value } : l)))
                  }
                >
                  {(supplierMaterials.length > 0 ? supplierMaterials : materials).map((m) => (
                    <option key={m.id} value={m.id}>{m.number} · {m.name}</option>
                  ))}
                </select>
              </div>
              <div className="field" style={{ width: 100 }}>
                <label>Antal</label>
                <input
                  type="number" min={1} value={line.qty}
                  onChange={(e) =>
                    setLines((ls) => ls.map((l) => (l.id === line.id ? { ...l, qty: Number(e.target.value) } : l)))
                  }
                />
              </div>
              <button
                className="btn btn-danger btn-sm"
                disabled={lines.length === 1}
                onClick={() => setLines((ls) => ls.filter((l) => l.id !== line.id))}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            className="btn btn-sm mb"
            onClick={() =>
              setLines((ls) => [
                ...ls,
                { id: uid(), materialId: (supplierMaterials[0] ?? materials[0])?.id ?? '', qty: 10 },
              ])
            }
          >
            + Lägg till rad
          </button>

          <div className="flex" style={{ justifyContent: 'flex-end' }}>
            <button className="btn" onClick={() => setShowNew(false)}>Avbryt</button>
            <button
              className="btn btn-primary"
              disabled={!supplierId || lines.some((l) => !l.materialId || l.qty <= 0)}
              onClick={() => {
                const supplier = suppliers.find((s) => s.id === supplierId);
                const po = createPurchaseOrder(
                  supplierId,
                  lines,
                  toISODate(addDays(new Date(), supplier?.leadTimeDays ?? 5)),
                );
                setShowNew(false);
                navigate(`/inkop/${po.id}`);
              }}
            >
              Skapa inköpsorder
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
