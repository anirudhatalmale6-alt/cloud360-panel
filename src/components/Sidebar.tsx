'use client';

export type ViewType = 'dashboard' | 'monitoring' | 'backups' | 'security' | 'files' | 'users';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  filter: 'all' | 'running' | 'stopped';
  onFilterChange: (f: 'all' | 'running' | 'stopped') => void;
  runningCount: number;
  stoppedCount: number;
  totalCount: number;
}

const navItems: { key: ViewType; label: string; icon: JSX.Element }[] = [
  {
    key: 'dashboard', label: 'Dashboard',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  },
  {
    key: 'monitoring', label: 'Monitoring',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  },
  {
    key: 'backups', label: 'Backups',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>,
  },
  {
    key: 'security', label: 'Security',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  },
  {
    key: 'files', label: 'File Manager',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>,
  },
  {
    key: 'users', label: 'Users',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  },
];

export default function Sidebar({ collapsed, onToggle, activeView, onViewChange, filter, onFilterChange, runningCount, stoppedCount, totalCount }: SidebarProps) {
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
        {!collapsed && <p className="text-[10px] uppercase tracking-wider text-[#484f58] px-3 mb-2">Navigation</p>}
        {navItems.map(item => (
          <button
            key={item.key}
            onClick={() => onViewChange(item.key)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors text-left ${
              activeView === item.key
                ? 'bg-[#21262d] text-[#f0f6fc]'
                : 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d]/50'
            }`}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {!collapsed && <span className="text-sm flex-1 truncate">{item.label}</span>}
          </button>
        ))}

        {activeView === 'dashboard' && (
          <>
            <div className="h-px bg-[#21262d] my-4" />
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
          </>
        )}

        {!collapsed && activeView === 'dashboard' && (
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
