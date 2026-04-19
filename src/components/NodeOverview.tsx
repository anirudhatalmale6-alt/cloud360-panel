'use client';

interface NodeData {
  cpu: { usage: number; model: string; cores: number; threads: number };
  memory: { used: number; total: number; usedFormatted: string; totalFormatted: string; percentage: number };
  disk: { used: number; total: number; usedFormatted: string; totalFormatted: string; percentage: number };
  uptime: { seconds: number; formatted: string };
  kernel: string;
  nodeName: string;
}

interface GaugeProps {
  value: number;
  label: string;
  detail: string;
  color: string;
}

function Gauge({ value, label, detail, color }: GaugeProps) {
  const radius = 36;
  const stroke = 6;
  const circumference = 2 * Math.PI * radius;
  const safeValue = isNaN(value) ? 0 : Math.min(value, 100);
  const offset = circumference - (safeValue / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 84 84">
          <circle cx="42" cy="42" r={radius} fill="none" stroke="#21262d" strokeWidth={stroke} />
          <circle
            cx="42" cy="42" r={radius} fill="none"
            stroke={color} strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-[#f0f6fc]">{Math.round(safeValue)}%</span>
        </div>
      </div>
      <span className="text-sm font-medium text-[#f0f6fc] mt-2">{label}</span>
      <span className="text-xs text-[#8b949e]">{detail}</span>
    </div>
  );
}

export default function NodeOverview({ node }: { node: NodeData }) {
  const cpuPercent = node.cpu.usage;
  const memPercent = node.memory.percentage;
  const diskPercent = node.disk.percentage;

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-[#f0f6fc]">Node: {node.nodeName}</h2>
          <p className="text-sm text-[#8b949e]">{node.cpu.model} &middot; {node.cpu.threads} threads &middot; Uptime: {node.uptime.formatted}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#3fb950] pulse-green" />
          <span className="text-sm text-[#3fb950] font-medium">Online</span>
        </div>
      </div>
      <div className="flex items-center justify-around">
        <Gauge
          value={cpuPercent}
          label="CPU"
          detail={`${node.cpu.threads} threads`}
          color={cpuPercent > 80 ? '#f85149' : cpuPercent > 60 ? '#d29922' : '#3fb950'}
        />
        <Gauge
          value={memPercent}
          label="Memory"
          detail={`${node.memory.usedFormatted} / ${node.memory.totalFormatted}`}
          color={memPercent > 85 ? '#f85149' : memPercent > 70 ? '#d29922' : '#58a6ff'}
        />
        <Gauge
          value={diskPercent}
          label="Storage"
          detail={`${node.disk.usedFormatted} / ${node.disk.totalFormatted}`}
          color={diskPercent > 85 ? '#f85149' : diskPercent > 70 ? '#d29922' : '#bc8cff'}
        />
      </div>
    </div>
  );
}
