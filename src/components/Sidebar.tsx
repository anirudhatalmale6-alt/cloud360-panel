'use client';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  filter: 'all' | 'running' | 'stopped';
  onFilterChange: (f: 'all' | 'running' | 'stopped') => void;
  runningCount: number;
  stoppedCount: number;
  totalCount: number;
}

export default function Sidebar({ collapsed, onToggle, filter, onFilterChange, runningCount, stoppedCount, totalCount }: SidebarProps) {
  const filters = [
    { key: 'all' as const, label: 'All VMs', count: totalCount, icon: '⊞' },
    { key: 'running' as const, label: 'Running', count: runningCount, icon: '●', color: 'text-[#3fb950]' },
    { key: 'stopped' as const, label: 'Stopped', count: stoppedCount, icon: '●', color: 'text-[#f85149]' },
  ];

  return (
    <aside className={`fixed top-0 left-0 h-screen bg-[#161b22] border-r border-[#30363d] transition-all duration-300 z-20 flex flex-col ${collapsed ? 'w-16' : 'w-64'}`}>
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-[#30363d]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#58a6ff] to-[#bc8cff] flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
            </svg>
          </div>
          {!collapsed && <span className="text-[#f0f6fc] font-bold text-lg truncate">Cloud360</span>}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        {!collapsed && <p className="text-[10px] uppercase tracking-wider text-[#484f58] px-3 mb-2">Filter</p>}
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => onFilterChange(f.key)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors text-left ${
              filter === f.key
                ? 'bg-[#21262d] text-[#f0f6fc]'
                : 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d]/50'
            }`}
          >
            <span className={`text-sm flex-shrink-0 ${f.color || ''}`}>{f.icon}</span>
            {!collapsed && (
              <>
                <span className="text-sm flex-1 truncate">{f.label}</span>
                <span className="text-xs bg-[#30363d] text-[#8b949e] px-2 py-0.5 rounded-full">{f.count}</span>
              </>
            )}
          </button>
        ))}

        {!collapsed && (
          <>
            <div className="h-px bg-[#21262d] my-4" />
            <p className="text-[10px] uppercase tracking-wider text-[#484f58] px-3 mb-2">Quick Stats</p>
            <div className="px-3 space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#8b949e]">Uptime</span>
                  <span className="text-[#3fb950]">{totalCount > 0 ? Math.round((runningCount / totalCount) * 100) : 0}%</span>
                </div>
                <div className="h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#238636] to-[#3fb950] rounded-full transition-all duration-500"
                    style={{ width: `${totalCount > 0 ? (runningCount / totalCount) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-[#30363d] p-3">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d]/50 transition-colors"
        >
          <svg className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
          {!collapsed && <span className="text-sm">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
