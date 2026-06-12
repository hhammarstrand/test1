import { useStore } from '../../store/useStore';
import { uid } from '../../lib/ids';
import { MACHINE_TYPE_LABELS, type Article, type MachineType, type RoutingStep } from '../../types';

export default function RoutingEditor({ article }: { article: Article }) {
  const machines = useStore((s) => s.machines);
  const upsertArticle = useStore((s) => s.upsertArticle);

  const updateStep = (stepId: string, patch: Partial<RoutingStep>) => {
    upsertArticle({
      ...article,
      routing: article.routing.map((s) => (s.id === stepId ? { ...s, ...patch } : s)),
    });
  };

  const setMachineType = (step: RoutingStep, type: MachineType) => {
    const compatible = machines.filter((m) => m.type === type && m.active);
    updateStep(step.id, {
      machineType: type,
      defaultMachineId: compatible[0]?.id ?? step.defaultMachineId,
    });
  };

  const addStep = () => {
    const nextNo = article.routing.reduce((max, s) => Math.max(max, s.operationNo), 0) + 10;
    const firstMachine = machines.find((m) => m.active);
    upsertArticle({
      ...article,
      routing: [
        ...article.routing,
        {
          id: uid(),
          operationNo: nextNo,
          description: 'Ny operation',
          machineType: firstMachine?.type ?? 'svarv',
          defaultMachineId: firstMachine?.id ?? '',
          setupTimeMin: 15,
          cycleTimeMin: 5,
        },
      ],
    });
  };

  const sorted = [...article.routing].sort((a, b) => a.operationNo - b.operationNo);

  return (
    <>
      <h2>Beredning (operationer)</h2>
      {sorted.length === 0 ? (
        <div className="empty-state">
          Ingen beredning ännu — lägg till operationer för att kunna planera artikeln i maskiner.
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 70 }}>Op-nr</th><th>Beskrivning</th><th>Maskintyp</th>
                <th>Standardmaskin</th><th className="num">Ställtid (min)</th>
                <th className="num">Stycktid (min)</th><th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((step) => (
                <tr key={step.id}>
                  <td>
                    <input
                      type="number" style={{ width: 60 }} value={step.operationNo}
                      onChange={(e) => updateStep(step.id, { operationNo: Number(e.target.value) })}
                    />
                  </td>
                  <td>
                    <input
                      value={step.description} style={{ width: '100%' }}
                      onChange={(e) => updateStep(step.id, { description: e.target.value })}
                    />
                  </td>
                  <td>
                    <select value={step.machineType} onChange={(e) => setMachineType(step, e.target.value as MachineType)}>
                      {Object.entries(MACHINE_TYPE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      value={step.defaultMachineId}
                      onChange={(e) => updateStep(step.id, { defaultMachineId: e.target.value })}
                    >
                      {machines.filter((m) => m.type === step.machineType).map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="num">
                    <input
                      type="number" min={0} style={{ width: 70 }} value={step.setupTimeMin}
                      onChange={(e) => updateStep(step.id, { setupTimeMin: Number(e.target.value) })}
                    />
                  </td>
                  <td className="num">
                    <input
                      type="number" min={0} style={{ width: 70 }} value={step.cycleTimeMin}
                      onChange={(e) => updateStep(step.id, { cycleTimeMin: Number(e.target.value) })}
                    />
                  </td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() =>
                        upsertArticle({ ...article, routing: article.routing.filter((s) => s.id !== step.id) })
                      }
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <button className="btn btn-sm mt" onClick={addStep}>+ Lägg till operation</button>
    </>
  );
}
