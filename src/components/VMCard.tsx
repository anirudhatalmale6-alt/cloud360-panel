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
  if (seconds === 0) return '-';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h`;
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

interface VMCardProps {
  vm: VM;
  onAction: (vmid: number, action: VMAction) => void;
  onSelect: () => void;
  actionLoading: boolean;
}

export default function VMCard({ vm, onAction, onSelect, actionLoading }: VMCardProps) {
  const isRunning = vm.status === 'running';
  const cpuPercent = vm.cpu * 100;
  const memPercent = vm.maxmem > 0 ? (vm.mem / vm.maxmem) * 100 : 0;

  return (
    <div
      className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 hover:border-[#484f58] transition-all cursor-pointer group fade-in"
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono bg-[#21262d] text-[#8b949e] px-1.5 py-0.5 rounded">
              {vm.type === 'lxc' ? 'CT' : 'VM'} {vm.vmid}
            </span>
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isRunning ? 'bg-[#3fb950] pulse-green' : 'bg-[#484f58]'}`} />
          </div>
          <h3 className="text-sm font-semibold text-[#f0f6fc] truncate" title={vm.name}>
            {vm.name}
          </h3>
        </div>
      </div>

      {/* Stats */}
      {isRunning ? (
        <div className="space-y-3 mb-4">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#8b949e]">CPU</span>
              <span className="text-[#c9d1d9]">{cpuPercent.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 bg-[#21262d] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.max(cpuPercent, 1)}%`,
                  background: cpuPercent > 80 ? '#f85149' : cpuPercent > 60 ? '#d29922' : '#3fb950',
                }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#8b949e]">Memory</span>
              <span className="text-[#c9d1d9]">{formatBytes(vm.mem)} / {formatBytes(vm.maxmem)}</span>
            </div>
            <div className="h-1.5 bg-[#21262d] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.max(memPercent, 1)}%`,
                  background: memPercent > 85 ? '#f85149' : memPercent > 70 ? '#d29922' : '#58a6ff',
                }}
              />
            </div>
          </div>
          <div className="flex justify-between text-xs text-[#8b949e]">
            <span>Uptime: {formatUptime(vm.uptime)}</span>
            <span>Net: {formatBytes(vm.netin + vm.netout)}</span>
          </div>
        </div>
      ) : (
        <div className="py-6 text-center text-[#484f58] text-sm mb-4">
          Stopped
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2" onClick={e => e.stopPropagation()}>
        {isRunning ? (
          <>
            <button
              onClick={() => onAction(vm.vmid, 'reboot')}
              disabled={actionLoading}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#21262d] text-[#d29922] hover:bg-[#30363d] text-xs font-medium transition-colors disabled:opacity-50"
            >
              {actionLoading ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full spin-slow" /> : '↻'}
              Reboot
            </button>
            <button
              onClick={() => onAction(vm.vmid, 'shutdown')}
              disabled={actionLoading}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#21262d] text-[#f85149] hover:bg-[#30363d] text-xs font-medium transition-colors disabled:opacity-50"
            >
              {actionLoading ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full spin-slow" /> : '⏻'}
              Shutdown
            </button>
          </>
        ) : (
          <button
            onClick={() => onAction(vm.vmid, 'start')}
            disabled={actionLoading}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#238636] text-white hover:bg-[#2ea043] text-xs font-medium transition-colors disabled:opacity-50"
          >
            {actionLoading ? <span className="w-3 h-3 border border-white border-t-transparent rounded-full spin-slow" /> : '▶'}
            Start
          </button>
        )}
      </div>
    </div>
  );
}
