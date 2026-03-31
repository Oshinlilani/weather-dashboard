import { useRef, useState } from 'react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

const COLORS = ['#60a5fa', '#34d399', '#f87171', '#fbbf24', '#a78bfa'];

/**
 * Props:
 *  - title: string
 *  - data: array of objects
 *  - keys: [{ key, name, color? }]
 *  - xKey: string (x-axis data key)
 *  - type: 'line' | 'bar'
 *  - unit: string (optional y-axis unit)
 */
export default function ChartComponent({ title, data = [], keys = [], xKey = 'time', type = 'line', unit = '' }) {
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef(null);

  const minWidth = Math.max(600, data.length * 30);
  const scaledWidth = minWidth * zoom;

  const ChartEl = type === 'bar' ? BarChart : LineChart;

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow mb-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="text-white font-semibold text-sm">{title}</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setZoom(z => Math.max(0.5, +(z - 0.25).toFixed(2)))}
            className="px-2 py-1 text-xs bg-white/20 hover:bg-white/30 text-white rounded-lg"
          >− Zoom</button>
          <button
            onClick={() => setZoom(z => Math.min(5, +(z + 0.25).toFixed(2)))}
            className="px-2 py-1 text-xs bg-white/20 hover:bg-white/30 text-white rounded-lg"
          >+ Zoom</button>
          <button
            onClick={() => setZoom(1)}
            className="px-2 py-1 text-xs bg-white/20 hover:bg-white/30 text-white rounded-lg"
          >Reset</button>
        </div>
      </div>
      <div ref={containerRef} className="overflow-x-auto">
        <div style={{ width: scaledWidth, minWidth: '100%' }}>
          <ChartEl data={data} height={220} width={scaledWidth}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey={xKey}
              tick={{ fill: '#93c5fd', fontSize: 10 }}
              interval={zoom < 1 ? 'preserveStartEnd' : Math.floor(data.length / 12)}
            />
            <YAxis tick={{ fill: '#93c5fd', fontSize: 10 }} unit={unit} width={45} />
            <Tooltip
              contentStyle={{ background: '#1e3a5f', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12 }}
              labelStyle={{ color: '#93c5fd' }}
            />
            <Legend wrapperStyle={{ color: '#93c5fd', fontSize: 11 }} />
            {keys.map((k, i) =>
              type === 'bar'
                ? <Bar key={k.key} dataKey={k.key} name={k.name} fill={k.color || COLORS[i % COLORS.length]} radius={[3,3,0,0]} />
                : <Line key={k.key} type="monotone" dataKey={k.key} name={k.name} stroke={k.color || COLORS[i % COLORS.length]} dot={false} strokeWidth={2} />
            )}
          </ChartEl>
        </div>
      </div>
    </div>
  );
}
