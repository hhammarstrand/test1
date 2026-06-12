import { useStore } from '../../store/useStore';
import type { Article } from '../../types';

export default function BomEditor({ article }: { article: Article }) {
  const materials = useStore((s) => s.materials);
  const upsertArticle = useStore((s) => s.upsertArticle);

  const unused = materials.filter((m) => !article.bom.some((b) => b.materialId === m.id));

  return (
    <>
      <h2>Material (BOM)</h2>
      {article.bom.length === 0 ? (
        <div className="empty-state">Inget material kopplat ännu.</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Material</th><th className="num">Åtgång per enhet</th><th>Enhet</th><th></th>
              </tr>
            </thead>
            <tbody>
              {article.bom.map((line) => {
                const mat = materials.find((m) => m.id === line.materialId);
                return (
                  <tr key={line.materialId}>
                    <td>{mat ? `${mat.number} · ${mat.name}` : 'Okänt material'}</td>
                    <td className="num">
                      <input
                        type="number" min={0} step={0.01} style={{ width: 90 }} value={line.qtyPerUnit}
                        onChange={(e) =>
                          upsertArticle({
                            ...article,
                            bom: article.bom.map((b) =>
                              b.materialId === line.materialId
                                ? { ...b, qtyPerUnit: Number(e.target.value) }
                                : b,
                            ),
                          })
                        }
                      />
                    </td>
                    <td>{mat?.unit ?? '–'}</td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() =>
                          upsertArticle({
                            ...article,
                            bom: article.bom.filter((b) => b.materialId !== line.materialId),
                          })
                        }
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {unused.length > 0 && (
        <div className="flex mt">
          <select
            id={`add-bom-${article.id}`}
            defaultValue=""
            onChange={(e) => {
              if (!e.target.value) return;
              upsertArticle({
                ...article,
                bom: [...article.bom, { materialId: e.target.value, qtyPerUnit: 1 }],
              });
              e.target.value = '';
            }}
          >
            <option value="">+ Lägg till material …</option>
            {unused.map((m) => (
              <option key={m.id} value={m.id}>{m.number} · {m.name}</option>
            ))}
          </select>
        </div>
      )}
    </>
  );
}
