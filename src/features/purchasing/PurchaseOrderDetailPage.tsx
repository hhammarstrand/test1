import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { fmtDate, fmtNumber, fmtSEK } from '../../lib/time';
import { PoStatusBadge } from '../../components/StatusBadge';

export default function PurchaseOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const po = useStore((s) => s.purchaseOrders.find((p) => p.id === id));
  const suppliers = useStore((s) => s.suppliers);
  const materials = useStore((s) => s.materials);
  const receivePurchaseOrder = useStore((s) => s.receivePurchaseOrder);
  const deletePurchaseOrder = useStore((s) => s.deletePurchaseOrder);

  if (!po) {
    return <div className="empty-state">Inköpsordern hittades inte. <Link to="/inkop">Till inköpslistan</Link></div>;
  }

  const supplier = suppliers.find((s) => s.id === po.supplierId);
  const total = po.lines.reduce((sum, l) => {
    const mat = materials.find((m) => m.id === l.materialId);
    return sum + (mat?.price ?? 0) * l.qty;
  }, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{po.poNo}</h1>
          <p>
            {supplier?.name ?? '–'} · Beställd {fmtDate(po.orderDate)} · Förväntad {fmtDate(po.expectedDate)} ·
            Värde {fmtSEK(total)}
          </p>
        </div>
        <div className="flex">
          <PoStatusBadge status={po.status} />
          {po.status === 'beställd' && (
            <>
              <button className="btn btn-primary" onClick={() => receivePurchaseOrder(po.id)}>
                ✓ Markera som mottagen
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  if (confirm(`Ta bort ${po.poNo}?`)) {
                    deletePurchaseOrder(po.id);
                    navigate('/inkop');
                  }
                }}
              >
                Ta bort
              </button>
            </>
          )}
        </div>
      </div>

      {po.status === 'mottagen' && (
        <div className="alert alert-ok">✓ Mottagen — lagersaldot har räknats upp.</div>
      )}

      <h2>Rader</h2>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Material</th><th className="num">Antal</th><th className="num">À-pris</th><th className="num">Summa</th>
            </tr>
          </thead>
          <tbody>
            {po.lines.map((l) => {
              const mat = materials.find((m) => m.id === l.materialId);
              return (
                <tr key={l.id}>
                  <td>{mat ? `${mat.number} · ${mat.name}` : 'Okänt material'}</td>
                  <td className="num">{fmtNumber(l.qty)} {mat?.unit}</td>
                  <td className="num">{mat ? `${fmtSEK(mat.price)}/${mat.unit}` : '–'}</td>
                  <td className="num">{mat ? fmtSEK(mat.price * l.qty) : '–'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
