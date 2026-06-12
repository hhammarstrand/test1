import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { uid } from '../../lib/ids';
import { addDays, toISODate } from '../../lib/time';
import type { OrderLine } from '../../types';
import Modal from '../../components/Modal';

interface Props {
  onClose: () => void;
  onCreated: (orderId: string) => void;
}

export default function OrderForm({ onClose, onCreated }: Props) {
  const customers = useStore((s) => s.customers);
  const articles = useStore((s) => s.articles);
  const createOrder = useStore((s) => s.createOrder);

  const [customerId, setCustomerId] = useState(customers[0]?.id ?? '');
  const [lines, setLines] = useState<OrderLine[]>([
    { id: uid(), articleId: articles[0]?.id ?? '', qty: 10, dueDate: toISODate(addDays(new Date(), 14)) },
  ]);

  const updateLine = (id: string, patch: Partial<OrderLine>) =>
    setLines((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const valid = customerId && lines.length > 0 && lines.every((l) => l.articleId && l.qty > 0 && l.dueDate);

  return (
    <Modal title="Ny kundorder" onClose={onClose}>
      <div className="field mb">
        <label>Kund</label>
        <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <h3>Orderrader</h3>
      {lines.map((line) => (
        <div key={line.id} className="flex mb" style={{ alignItems: 'flex-end' }}>
          <div className="field" style={{ flex: 2 }}>
            <label>Artikel</label>
            <select value={line.articleId} onChange={(e) => updateLine(line.id, { articleId: e.target.value })}>
              {articles.map((a) => (
                <option key={a.id} value={a.id}>{a.number} · {a.name}</option>
              ))}
            </select>
          </div>
          <div className="field" style={{ width: 90 }}>
            <label>Antal</label>
            <input
              type="number"
              min={1}
              value={line.qty}
              onChange={(e) => updateLine(line.id, { qty: Number(e.target.value) })}
            />
          </div>
          <div className="field" style={{ width: 150 }}>
            <label>Leveransdatum</label>
            <input
              type="date"
              value={line.dueDate}
              onChange={(e) => updateLine(line.id, { dueDate: e.target.value })}
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
            { id: uid(), articleId: articles[0]?.id ?? '', qty: 10, dueDate: toISODate(addDays(new Date(), 14)) },
          ])
        }
      >
        + Lägg till rad
      </button>

      <div className="flex" style={{ justifyContent: 'flex-end' }}>
        <button className="btn" onClick={onClose}>Avbryt</button>
        <button
          className="btn btn-primary"
          disabled={!valid}
          onClick={() => {
            const order = createOrder(customerId, lines);
            onCreated(order.id);
          }}
        >
          Skapa order (Offert)
        </button>
      </div>
    </Modal>
  );
}
