'use client';

import { VM, VMAction } from '@/types';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatUptime(seconds: number): string {
  if (seconds === 0) return 'Stopped';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
  if (mins > 0 && days === 0) parts.push(`${mins} min${mins > 1 ? 's' : ''}`);
  return parts.join(', ') || '< 1 min';
}

// VM name to IP mapping
const vmIpMap: Record<number, string> = {
  101: '10.10.10.18', 102: '10.10.10.230', 103: '10.10.10.17',
  106: '10.10.10.15', 107: '10.10.10.16', 108: '198.72.127.240',
  111: '10.10.10.19', 112: '10.10.10.23', 114: '10.10.10.31',
  115: '10.10.10.41', 116: '10.10.10.42', 117: '10.10.10.43',
  118: '10.10.10.44', 119: '10.10.10.51', 120: '10.10.10.32',
  121: '10.10.10.33', 122: '10.10.10.22', 124: '10.10.10.71',
  125: '10.10.10.35', 130: '10.10.10.51', 131: '10.10.10.53',
  200: '10.10.10.200', 201: '10.10.10.201',
};

interface VMDetailModalProps {
  vm: VM;
  onClose: () => void;
  onAction: (vmid: number, action: VMAction) => void;
  actionLoading: boolean;
}

export default function VMDetailModal({ vm, onClose, onAction, actionLoading }: VMDetailModalProps) {
  const isRunning = vm.status === 'running';
  const cpuPercent = vm.cpu * 100;
  const memPercent = vm.maxmem > 0 ? (vm.mem / vm.maxmem) * 100 : 0;
  const ip = vmIpMap[vm.vmid] || 'Unknown';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#21262d]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono bg-[#21262d] text-[#8b949e] px-2 py-0.5 rounded">
                {vm.type === 'lxc' ? 'CT' : 'VM'} {vm.vmid}
              </span>
              <div className={`flex items-center gap-1.5 text-xs font-medium ${isRunning ? 'text-[#3fb950]' : 'text-[#f85149]'}`}>
                <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-[#3fb950] pulse-green' : 'bg-[#f85149]'}`} />
                {isRunning ? 'Running' : 'Stopped'}
              </div>
            </div>
            <h2 className="text-xl font-bold text-[#f0f6fc]">{vm.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Details */}
        <div className="p-6 space-y-5">
          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0d1117] rounded-lg p-4 border border-[#21262d]">
              <p className="text-xs text-[#8b949e] mb-1">IP Address</p>
              <p className="text-sm font-mono text-[#58a6ff]">{ip}</p>
            </div>
            <div className="bg-[#0d1117] rounded-lg p-4 border border-[#21262d]">
              <p className="text-xs text-[#8b949e] mb-1">Uptime</p>
              <p className="text-sm text-[#f0f6fc]">{formatUptime(vm.uptime)}</p>
            </div>
            <div className="bg-[#0d1117] rounded-lg p-4 border border-[#21262d]">
              <p className="text-xs text-[#8b949e] mb-1">SSH Command</p>
              <p className="text-xs font-mono text-[#3fb950] break-all">ssh -p 20788 ubuntu24@{ip}</p>
            </div>
            <div className="bg-[#0d1117] rounded-lg p-4 border border-[#21262d]">
              <p className="text-xs text-[#8b949e] mb-1">Type</p>
              <p className="text-sm text-[#f0f6fc]">{vm.type === 'lxc' ? 'LXC Container' : 'Virtual Machine'}</p>
            </div>
          </div>

          {/* Resource Bars */}
          {isRunning && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#8b949e]">CPU Usage</span>
                  <span className="text-[#f0f6fc] font-medium">{cpuPercent.toFixed(1)}%</span>
                </div>
                <div className="h-2.5 bg-[#21262d] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.max(cpuPercent, 1)}%`,
                      background: cpuPercent > 80 ? '#f85149' : cpuPercent > 60 ? '#d29922' : '#3fb950',
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#8b949e]">Memory</span>
                  <span className="text-[#f0f6fc] font-medium">{formatBytes(vm.mem)} / {formatBytes(vm.maxmem)}</span>
                </div>
                <div className="h-2.5 bg-[#21262d] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.max(memPercent, 1)}%`,
                      background: memPercent > 85 ? '#f85149' : memPercent > 70 ? '#d29922' : '#58a6ff',
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-[#0d1117] rounded-lg p-3 border border-[#21262d]">
                  <p className="text-xs text-[#8b949e] mb-1">Network In</p>
                  <p className="text-sm text-[#f0f6fc]">{formatBytes(vm.netin)}</p>
                </div>
                <div className="bg-[#0d1117] rounded-lg p-3 border border-[#21262d]">
                  <p className="text-xs text-[#8b949e] mb-1">Network Out</p>
                  <p className="text-sm text-[#f0f6fc]">{formatBytes(vm.netout)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Disk */}
          <div className="bg-[#0d1117] rounded-lg p-4 border border-[#21262d]">
            <p className="text-xs text-[#8b949e] mb-1">Disk Allocation</p>
            <p className="text-sm text-[#f0f6fc]">{formatBytes(vm.maxdisk)}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-[#21262d] flex gap-3">
          {isRunning ? (
            <>
              <button
                onClick={() => onAction(vm.vmid, 'reboot')}
                disabled={actionLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#21262d] text-[#d29922] hover:bg-[#30363d] font-medium transition-colors disabled:opacity-50"
              >
                {actionLoading ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full spin-slow" /> : '↻'}
                Reboot
              </button>
              <button
                onClick={() => onAction(vm.vmid, 'shutdown')}
                disabled={actionLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#21262d] text-[#f85149] hover:bg-[#30363d] font-medium transition-colors disabled:opacity-50"
              >
                {actionLoading ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full spin-slow" /> : '⏻'}
                Shutdown
              </button>
              <button
                onClick={() => onAction(vm.vmid, 'stop')}
                disabled={actionLoading}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#f8514915] text-[#f85149] hover:bg-[#f8514930] font-medium transition-colors disabled:opacity-50"
                title="Force Stop"
              >
                ■
              </button>
            </>
          ) : (
            <button
              onClick={() => onAction(vm.vmid, 'start')}
              disabled={actionLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#238636] text-white hover:bg-[#2ea043] font-medium transition-colors disabled:opacity-50"
            >
              {actionLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full spin-slow" /> : '▶'}
              Start VM
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
