export default function WeatherCard({ label, value, unit, icon }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 flex flex-col gap-1 border border-white/20 shadow">
      <span className="text-xs text-blue-200 uppercase tracking-wide">{label}</span>
      <div className="flex items-end gap-1">
        {icon && <span className="text-2xl">{icon}</span>}
        <span className="text-2xl font-bold text-white">{value ?? '—'}</span>
        {unit && <span className="text-sm text-blue-200 mb-0.5">{unit}</span>}
      </div>
    </div>
  );
}
