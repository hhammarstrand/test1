import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { fmtMinutes } from '../../lib/time';
import RoutingEditor from './RoutingEditor';
import BomEditor from './BomEditor';
import PartViewSection from './PartViewSection';

export default function ArticleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const article = useStore((s) => s.articles.find((a) => a.id === id));
  const orders = useStore((s) => s.orders);
  const upsertArticle = useStore((s) => s.upsertArticle);
  const deleteArticle = useStore((s) => s.deleteArticle);

  if (!article) {
    return <div className="empty-state">Artikeln hittades inte. <Link to="/artiklar">Till artikelregistret</Link></div>;
  }

  const usedInOrders = orders.some((o) => o.lines.some((l) => l.articleId === article.id));
  const timeFor10 = article.routing.reduce(
    (sum, step) => sum + step.setupTimeMin + step.cycleTimeMin * 10, 0,
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{article.number} · {article.name}</h1>
          <p>Total tid för 10 st: <strong>{fmtMinutes(timeFor10)}</strong> (ställ + 10 × stycktid per operation)</p>
        </div>
        <button
          className="btn btn-danger"
          disabled={usedInOrders}
          title={usedInOrders ? 'Artikeln används i ordrar' : ''}
          onClick={() => {
            if (confirm(`Ta bort ${article.number}?`)) {
              deleteArticle(article.id);
              navigate('/artiklar');
            }
          }}
        >
          Ta bort
        </button>
      </div>

      <div className="card mb">
        <div className="form-grid">
          <div className="field">
            <label>Artikelnr</label>
            <input value={article.number} onChange={(e) => upsertArticle({ ...article, number: e.target.value })} />
          </div>
          <div className="field">
            <label>Benämning</label>
            <input value={article.name} onChange={(e) => upsertArticle({ ...article, name: e.target.value })} />
          </div>
          <div className="field">
            <label>Beskrivning</label>
            <input value={article.description} onChange={(e) => upsertArticle({ ...article, description: e.target.value })} />
          </div>
          <div className="field">
            <label>Försäljningspris (SEK)</label>
            <input
              type="number" min={0} value={article.price}
              onChange={(e) => upsertArticle({ ...article, price: Number(e.target.value) })}
            />
          </div>
        </div>
      </div>

      <PartViewSection article={article} />
      <RoutingEditor article={article} />
      <BomEditor article={article} />
    </div>
  );
}
