'use client';

import { useState, useEffect, useCallback } from 'react';
import { VM } from '@/types';

interface RRDPoint {
  time: number;
  cpu?: number;
  maxcpu?: number;
  memused?: number;
  memtotal?: number;
  netin?: number;
  netout?: number;
  iowait?: number;
  loadavg?: number;
}

interface SVGChartProps {
  data: { time: number; value: number }[];
  color: string;
  label: string;
  unit: string;
  formatValue: (v: number) => string;
  maxValue?: number;
}

function SVGChart({ data, color, label, unit, formatValue, maxValue }: SVGChartProps) {
  if (data.length < 2) {
    return (
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
        <h3 className="text-sm font-medium text-[#f0f6fc] mb-4">{label}</h3>
        <div className="flex items-center justify-center h-40 text-[#8b949e] text-sm">No data available</div>
      </div>
    );
  }

  const W = 600, H = 180, PAD_L = 50, PAD_R = 20, PAD_T = 10, PAD_B = 30;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const validData = data.filter(d => d.value !== null && !isNaN(d.value));
  const max = maxValue ?? Math.max(...validData.map(d => d.value), 1);
  const minTime = validData[0].time;
  const maxTime = validData[validData.length - 1].time;
  const timeRange = maxTime - minTime || 1;

  const points = validData.map(d => ({
    x: PAD_L + ((d.time - minTime) / timeRange) * chartW,
    y: PAD_T + chartH - (d.value / max) * chartH,
  }));

  const linePoints = points.map(p => `${p.x},${p.y}`).join(' ');
  const areaPoints = `${PAD_L},${PAD_T + chartH} ${linePoints} ${PAD_L + chartW},${PAD_T + chartH}`;

  // Grid lines
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  // Time labels (5 evenly spaced)
  const timeLabels = Array.from({ length: 5 }, (_, i) => {
    const t = minTime + (timeRange * i) / 4;
    const d = new Date(t * 1000);
    return { x: PAD_L + (i / 4) * chartW, label: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
  });

  const currentValue = validData.length > 0 ? validData[validData.length - 1].value : 0;

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-[#f0f6fc]">{label}</h3>
        <span className="text-lg font-bold" style={{ color }}>{formatValue(currentValue)} {unit}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
        {/* Grid */}
        {gridLines.map((g, i) => {
          const y = PAD_T + chartH - g * chartH;
          return (
            <g key={i}>
              <line x1={PAD_L} y1={y} x2={PAD_L + chartW} y2={y} stroke="#21262d" strokeWidth="1" />
              <text x={PAD_L - 5} y={y + 4} fill="#8b949e" fontSize="9" textAnchor="end">
                {formatValue(g * max)}
              </text>
            </g>
          );
        })}
        {/* Area fill */}
        <polygon points={areaPoints} fill={color} opacity="0.1" />
        {/* Line */}
        <polyline points={linePoints} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
        {/* Time labels */}
        {timeLabels.map((t, i) => (
          <text key={i} x={t.x} y={H - 5} fill="#8b949e" fontSize="9" textAnchor="middle">{t.label}</text>
        ))}
      </svg>
    </div>
  );
}

interface MonitoringViewProps {
  vms: VM[];
}

export default function MonitoringView({ vms }: MonitoringViewProps) {
  const [timeframe, setTimeframe] = useState<string>('hour');
  const [scope, setScope] = useState<string>('node');
  const [data, setData] = useState<RRDPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/monitoring?timeframe=${timeframe}`;
      if (scope !== 'node') {
        const vm = vms.find(v => v.vmid.toString() === scope);
        if (vm) {
          url += `&vmid=${scope}&type=${vm.type}`;
        }
      }
      const res = await fetch(url);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch monitoring data:', err);
    } finally {
      setLoading(false);
    }
  }, [timeframe, scope, vms]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const cpuData = data
    .filter(d => d.cpu !== undefined && d.cpu !== null && !isNaN(d.cpu))
    .map(d => ({ time: d.time, value: (d.cpu || 0) * 100 }));

  const memData = data
    .filter(d => d.memused !== undefined && d.memtotal !== undefined)
    .map(d => ({ time: d.time, value: ((d.memused || 0) / (d.memtotal || 1)) * 100 }));

  const netInData = data
    .filter(d => d.netin !== undefined && d.netin !== null && !isNaN(d.netin))
    .map(d => ({ time: d.time, value: (d.netin || 0) / 1024 / 1024 }));

  const netOutData = data
    .filter(d => d.netout !== undefined && d.netout !== null && !isNaN(d.netout))
    .map(d => ({ time: d.time, value: (d.netout || 0) / 1024 / 1024 }));

  const timeframes = [
    { key: 'hour', label: 'Hour' },
    { key: 'day', label: 'Day' },
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
  ];

  const runningVMs = vms.filter(v => v.status === 'running');

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1 bg-[#161b22] border border-[#30363d] rounded-lg p-1">
          {timeframes.map(t => (
            <button
              key={t.key}
              onClick={() => setTimeframe(t.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                timeframe === t.key
                  ? 'bg-[#21262d] text-[#f0f6fc]'
                  : 'text-[#8b949e] hover:text-[#c9d1d9]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <select
          value={scope}
          onChange={e => setScope(e.target.value)}
          className="bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff]"
        >
          <option value="node">Node: basecanada</option>
          <optgroup label="Running VMs">
            {runningVMs.map(vm => (
              <option key={vm.vmid} value={vm.vmid.toString()}>
                VM {vm.vmid} — {vm.name}
              </option>
            ))}
          </optgroup>
        </select>

        {loading && (
          <div className="w-5 h-5 border-2 border-[#58a6ff] border-t-transparent rounded-full spin-slow" />
        )}
      </div>

      {/* Charts */}
      <SVGChart
        data={cpuData}
        color="#3fb950"
        label="CPU Usage"
        unit="%"
        formatValue={v => v.toFixed(1)}
        maxValue={100}
      />

      <SVGChart
        data={memData}
        color="#58a6ff"
        label="Memory Usage"
        unit="%"
        formatValue={v => v.toFixed(1)}
        maxValue={100}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SVGChart
          data={netInData}
          color="#bc8cff"
          label="Network In"
          unit="MB/s"
          formatValue={v => v.toFixed(2)}
        />
        <SVGChart
          data={netOutData}
          color="#d29922"
          label="Network Out"
          unit="MB/s"
          formatValue={v => v.toFixed(2)}
        />
      </div>
    </div>
  );
}
