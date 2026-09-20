export function SummaryCard({ label, value, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-50 text-slate-900',
    amber: 'bg-amber-50 text-amber-800',
    emerald: 'bg-emerald-50 text-emerald-800',
    red: 'bg-red-50 text-red-800',
  };

  return <div className={`rounded-lg border border-slate-200 px-4 py-4 ${tones[tone]}`}><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p></div>;
}
