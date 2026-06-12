import { NavLink, Outlet } from 'react-router-dom';
import { useStore } from './store/useStore';

const NAV = [
  { to: '/', label: 'Översikt', icon: '◧' },
  { to: '/ordrar', label: 'Ordrar', icon: '▤' },
  { to: '/planering', label: 'Beläggning', icon: '▦' },
  { to: '/artiklar', label: 'Artiklar', icon: '⬡' },
  { to: '/lager', label: 'Lager', icon: '▣' },
  { to: '/inkop', label: 'Inköp', icon: '⇲' },
  { to: '/maskiner', label: 'Maskiner', icon: '⚙' },
  { to: '/kunder', label: 'Kunder', icon: '◉' },
  { to: '/leverantorer', label: 'Leverantörer', icon: '◎' },
];

export default function App() {
  const resetDemoData = useStore((s) => s.resetDemoData);

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">⚒</span>
          <div>
            <strong>VerkstadsPilot</strong>
            <div className="brand-sub">Verkstadssystem · POC</div>
          </div>
        </div>
        <nav>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              if (confirm('Återställ all data till demodata? Dina ändringar försvinner.')) {
                resetDemoData();
              }
            }}
          >
            ↺ Återställ demodata
          </button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
