import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { fmtSEK } from '../../lib/time';
import { uid } from '../../lib/ids';

export default function ArticlesPage() {
  const articles = useStore((s) => s.articles);
  const upsertArticle = useStore((s) => s.upsertArticle);
  const navigate = useNavigate();

  const newArticle = () => {
    const id = uid();
    const maxNo = articles.reduce((max, a) => {
      const n = parseInt(a.number.replace(/\D/g, ''), 10);
      return Number.isFinite(n) && n > max ? n : max;
    }, 1000);
    upsertArticle({
      id,
      number: `A-${maxNo + 1}`,
      name: 'Ny artikel',
      description: '',
      price: 0,
      routing: [],
      bom: [],
    });
    navigate(`/artiklar/${id}`);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Artiklar</h1>
          <p>Artikelregister med beredning (operationer) och material</p>
        </div>
        <button className="btn btn-primary" onClick={newArticle}>+ Ny artikel</button>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Artikelnr</th><th>Benämning</th><th className="num">Pris</th>
              <th className="num">Operationer</th><th className="num">Material</th><th></th>
            </tr>
          </thead>
          <tbody>
            {articles.map((a) => (
              <tr key={a.id}>
                <td><Link to={`/artiklar/${a.id}`}><strong>{a.number}</strong></Link></td>
                <td>{a.name}<div className="small muted">{a.description}</div></td>
                <td className="num">{fmtSEK(a.price)}</td>
                <td className="num">{a.routing.length}</td>
                <td className="num">{a.bom.length}</td>
                <td><Link to={`/artiklar/${a.id}`} className="btn btn-sm">Öppna</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
