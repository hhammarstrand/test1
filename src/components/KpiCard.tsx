interface Props {
  value: string | number;
  label: string;
  tone?: 'normal' | 'warn' | 'ok';
}

export default function KpiCard({ value, label, tone = 'normal' }: Props) {
  const cls = tone === 'warn' ? 'kpi-warn' : tone === 'ok' ? 'kpi-ok' : '';
  return (
    <div className={`card ${cls}`}>
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
    </div>
  );
}
