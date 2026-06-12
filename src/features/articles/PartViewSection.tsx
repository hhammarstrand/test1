// "Ritning & 3D"-sektionen på artikelsidan: flikar för 3D-modell (med
// STL-uppladdning), genererad ritning och uppladdade ritningsfiler.

import { useState } from 'react';
import { useStore } from '../../store/useStore';
import type { Article } from '../../types';
import { uid } from '../../lib/ids';
import Viewer3D from '../../components/Viewer3D';
import DrawingSvg from '../../components/DrawingSvg';
import ModelEditor from './ModelEditor';

const MAX_FILE_BYTES = 2.5 * 1024 * 1024; // localStorage-budget i POC:en

export default function PartViewSection({ article }: { article: Article }) {
  const materials = useStore((s) => s.materials);
  const upsertArticle = useStore((s) => s.upsertArticle);
  const [tab, setTab] = useState<'3d' | 'ritning'>('3d');

  const materialName = article.bom[0]
    ? materials.find((m) => m.id === article.bom[0].materialId)?.name
    : undefined;
  const drawingFiles = article.drawingFiles ?? [];

  const readFile = (file: File, onDone: (dataUrl: string) => void) => {
    if (file.size > MAX_FILE_BYTES) {
      alert('Filen är för stor för POC:ens localStorage-lagring (max 2,5 MB).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onDone(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <>
      <h2>Ritning & 3D</h2>
      <div className="tabs">
        <button className={`tab${tab === '3d' ? ' active' : ''}`} onClick={() => setTab('3d')}>
          3D-modell
        </button>
        <button className={`tab${tab === 'ritning' ? ' active' : ''}`} onClick={() => setTab('ritning')}>
          Ritning
        </button>
      </div>

      {tab === '3d' && (
        <div className="card">
          <Viewer3D model={article.model} stlData={article.stlData} materialName={materialName} />
          <div className="flex mt" style={{ alignItems: 'center' }}>
            <span className="small muted">Dra för att rotera, scrolla för att zooma.</span>
            <span className="spacer" />
            <label className="btn btn-sm">
              ⬆ Ladda upp STL
              <input
                type="file" accept=".stl" hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) readFile(file, (dataUrl) => upsertArticle({ ...article, stlData: dataUrl }));
                  e.target.value = '';
                }}
              />
            </label>
            {article.stlData && (
              <button
                className="btn btn-danger btn-sm"
                onClick={() => upsertArticle({ ...article, stlData: undefined })}
              >
                ✕ Ta bort STL (visa parametrisk)
              </button>
            )}
          </div>
          {!article.stlData && <ModelEditor article={article} />}
        </div>
      )}

      {tab === 'ritning' && (
        <div className="card">
          <DrawingSvg article={article} materialName={materialName} />

          <div className="flex mt" style={{ alignItems: 'center' }}>
            <span className="small muted">
              Ritningen genereras automatiskt från den parametriska modellen.
            </span>
            <span className="spacer" />
            <label className="btn btn-sm">
              ⬆ Ladda upp ritningsbild
              <input
                type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    readFile(file, (dataUrl) =>
                      upsertArticle({
                        ...article,
                        drawingFiles: [...drawingFiles, { id: uid(), name: file.name, dataUrl }],
                      }),
                    );
                  }
                  e.target.value = '';
                }}
              />
            </label>
          </div>

          {drawingFiles.length > 0 && (
            <>
              <h3 className="mt">Uppladdade ritningar</h3>
              <div className="drawing-files">
                {drawingFiles.map((f) => (
                  <figure key={f.id} className="drawing-file">
                    <img src={f.dataUrl} alt={f.name} />
                    <figcaption className="flex">
                      <span className="small" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {f.name}
                      </span>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() =>
                          upsertArticle({
                            ...article,
                            drawingFiles: drawingFiles.filter((x) => x.id !== f.id),
                          })
                        }
                      >
                        ✕
                      </button>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
