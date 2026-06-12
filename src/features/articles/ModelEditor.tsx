// Redigerare för artikelns parametriska 3D-modell (driver även ritningen).

import { useStore } from '../../store/useStore';
import type { Article } from '../../types';
import { defaultModel, PART_KIND_LABELS, type PartModel } from '../../lib/partModel';

export default function ModelEditor({ article }: { article: Article }) {
  const upsertArticle = useStore((s) => s.upsertArticle);
  const model = article.model;

  const setModel = (m: PartModel | undefined) => upsertArticle({ ...article, model: m });

  return (
    <div className="card mt">
      <h3>Parametrisk modell</h3>
      <div className="flex mb">
        <div className="field">
          <label>Grundform</label>
          <select
            value={model?.kind ?? ''}
            onChange={(e) => {
              const kind = e.target.value as PartModel['kind'] | '';
              setModel(kind ? defaultModel(kind) : undefined);
            }}
          >
            <option value="">Ingen modell</option>
            {Object.entries(PART_KIND_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {model?.kind === 'shaft' && (
        <>
          <div className="small muted mb">Segment från vänster till höger (mm):</div>
          {model.segments.map((seg, i) => (
            <div key={i} className="flex mb" style={{ alignItems: 'flex-end' }}>
              <div className="field" style={{ width: 110 }}>
                <label>Ø diameter</label>
                <input
                  type="number" min={1} value={seg.diameter}
                  onChange={(e) =>
                    setModel({
                      ...model,
                      segments: model.segments.map((s, j) =>
                        j === i ? { ...s, diameter: Number(e.target.value) } : s,
                      ),
                    })
                  }
                />
              </div>
              <div className="field" style={{ width: 110 }}>
                <label>Längd</label>
                <input
                  type="number" min={1} value={seg.length}
                  onChange={(e) =>
                    setModel({
                      ...model,
                      segments: model.segments.map((s, j) =>
                        j === i ? { ...s, length: Number(e.target.value) } : s,
                      ),
                    })
                  }
                />
              </div>
              <button
                className="btn btn-danger btn-sm"
                disabled={model.segments.length === 1}
                onClick={() =>
                  setModel({ ...model, segments: model.segments.filter((_, j) => j !== i) })
                }
              >
                ✕
              </button>
            </div>
          ))}
          <div className="flex mb">
            <button
              className="btn btn-sm"
              onClick={() =>
                setModel({ ...model, segments: [...model.segments, { diameter: 30, length: 50 }] })
              }
            >
              + Segment
            </button>
            <label className="small flex" style={{ gap: 4 }}>
              <input
                type="checkbox"
                checked={!!model.keyway}
                onChange={(e) =>
                  setModel({
                    ...model,
                    keyway: e.target.checked
                      ? { segmentIndex: 0, width: 10, length: 50, offset: 20 }
                      : undefined,
                  })
                }
              />
              Kilspår
            </label>
          </div>
          {model.keyway && (
            <div className="flex mb" style={{ alignItems: 'flex-end' }}>
              {([
                ['segmentIndex', 'Segment (0…)'],
                ['width', 'Bredd'],
                ['length', 'Längd'],
                ['offset', 'Från segmentstart'],
              ] as const).map(([key, label]) => (
                <div className="field" key={key} style={{ width: 120 }}>
                  <label>{label}</label>
                  <input
                    type="number" min={0} value={model.keyway![key]}
                    onChange={(e) =>
                      setModel({
                        ...model,
                        keyway: { ...model.keyway!, [key]: Number(e.target.value) },
                      })
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {model?.kind === 'plate' && (
        <>
          <div className="flex mb" style={{ alignItems: 'flex-end' }}>
            {([['width', 'Bredd'], ['depth', 'Djup'], ['thickness', 'Tjocklek']] as const).map(
              ([key, label]) => (
                <div className="field" key={key} style={{ width: 110 }}>
                  <label>{label} (mm)</label>
                  <input
                    type="number" min={1} value={model[key]}
                    onChange={(e) => setModel({ ...model, [key]: Number(e.target.value) })}
                  />
                </div>
              ),
            )}
          </div>
          <div className="small muted mb">Hål (x/y från centrum):</div>
          {model.holes.map((hole, i) => (
            <div key={i} className="flex mb" style={{ alignItems: 'flex-end' }}>
              {([['x', 'X'], ['y', 'Y'], ['diameter', 'Ø']] as const).map(([key, label]) => (
                <div className="field" key={key} style={{ width: 90 }}>
                  <label>{label}</label>
                  <input
                    type="number" value={hole[key]}
                    onChange={(e) =>
                      setModel({
                        ...model,
                        holes: model.holes.map((h, j) =>
                          j === i ? { ...h, [key]: Number(e.target.value) } : h,
                        ),
                      })
                    }
                  />
                </div>
              ))}
              <button
                className="btn btn-danger btn-sm"
                onClick={() => setModel({ ...model, holes: model.holes.filter((_, j) => j !== i) })}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            className="btn btn-sm"
            onClick={() => setModel({ ...model, holes: [...model.holes, { x: 0, y: 0, diameter: 8 }] })}
          >
            + Hål
          </button>
        </>
      )}

      {model?.kind === 'tube' && (
        <div className="flex" style={{ alignItems: 'flex-end' }}>
          {([
            ['outerDiameter', 'Ytter-Ø'],
            ['innerDiameter', 'Inner-Ø'],
            ['length', 'Längd'],
          ] as const).map(([key, label]) => (
            <div className="field" key={key} style={{ width: 110 }}>
              <label>{label} (mm)</label>
              <input
                type="number" min={1} value={model[key]}
                onChange={(e) => setModel({ ...model, [key]: Number(e.target.value) })}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
