import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { uid } from '../../lib/ids';
import type { Customer } from '../../types';
import Modal from '../../components/Modal';

const EMPTY: Omit<Customer, 'id'> = { name: '', orgNr: '', contact: '', email: '', phone: '', city: '' };

export default function CustomersPage() {
  const customers = useStore((s) => s.customers);
  const orders = useStore((s) => s.orders);
  const upsertCustomer = useStore((s) => s.upsertCustomer);
  const deleteCustomer = useStore((s) => s.deleteCustomer);
  const [editing, setEditing] = useState<Customer | null>(null);

  const orderCount = (id: string) => orders.filter((o) => o.customerId === id).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Kunder</h1>
          <p>Kundregister</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing({ id: uid(), ...EMPTY })}>
          + Ny kund
        </button>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Namn</th><th>Org.nr</th><th>Kontakt</th><th>Ort</th><th className="num">Ordrar</th><th></th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <td><strong>{c.name}</strong></td>
                <td>{c.orgNr}</td>
                <td>{c.contact}<div className="small muted">{c.email}</div></td>
                <td>{c.city}</td>
                <td className="num">{orderCount(c.id)}</td>
                <td>
                  <div className="flex">
                    <button className="btn btn-sm" onClick={() => setEditing(c)}>Redigera</button>
                    <button
                      className="btn btn-danger btn-sm"
                      disabled={orderCount(c.id) > 0}
                      title={orderCount(c.id) > 0 ? 'Kunden har ordrar' : ''}
                      onClick={() => confirm(`Ta bort ${c.name}?`) && deleteCustomer(c.id)}
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
        <Modal title={customers.some((c) => c.id === editing.id) ? 'Redigera kund' : 'Ny kund'} onClose={() => setEditing(null)}>
          <div className="form-grid mb">
            {([
              ['name', 'Namn'], ['orgNr', 'Org.nr'], ['contact', 'Kontaktperson'],
              ['email', 'E-post'], ['phone', 'Telefon'], ['city', 'Ort'],
            ] as const).map(([key, label]) => (
              <div className="field" key={key}>
                <label>{label}</label>
                <input value={editing[key]} onChange={(e) => setEditing({ ...editing, [key]: e.target.value })} />
              </div>
            ))}
          </div>
          <div className="flex" style={{ justifyContent: 'flex-end' }}>
            <button className="btn" onClick={() => setEditing(null)}>Avbryt</button>
            <button
              className="btn btn-primary"
              disabled={!editing.name}
              onClick={() => { upsertCustomer(editing); setEditing(null); }}
            >
              Spara
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
