'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { VM, VMAction } from '@/types';
import LoginPage from '@/components/LoginPage';
import Sidebar, { ViewType } from '@/components/Sidebar';
import NodeOverview from '@/components/NodeOverview';
import VMCard from '@/components/VMCard';
import VMDetailModal from '@/components/VMDetailModal';
import MonitoringView from '@/components/MonitoringView';
import BackupsView from '@/components/BackupsView';
import SecurityView from '@/components/SecurityView';
import FileManagerView from '@/components/FileManagerView';

const SSHTerminal = dynamic(() => import('@/components/SSHTerminal'), { ssr: false });

const viewTitles: Record<ViewType, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Real-time infrastructure overview' },
  monitoring: { title: 'Monitoring', subtitle: 'Historical resource usage' },
  backups: { title: 'Backups', subtitle: 'Backup status and history' },
  security: { title: 'Security', subtitle: 'Firewall and access overview' },
  files: { title: 'File Manager', subtitle: 'Browse VM file systems' },
};

export default function Dashboard() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [vms, setVMs] = useState<VM[]>([]);
  const [nodeStatus, setNodeStatus] = useState<{
    cpu: { usage: number; model: string; cores: number; threads: number };
    memory: { used: number; total: number; usedFormatted: string; totalFormatted: string; percentage: number };
    disk: { used: number; total: number; usedFormatted: string; totalFormatted: string; percentage: number };
    uptime: { seconds: number; formatted: string };
    kernel: string;
    nodeName: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'running' | 'stopped'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVM, setSelectedVM] = useState<VM | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sshVM, setSSHVM] = useState<VM | null>(null);
  const [activeView, setActiveView] = useState<ViewType>('dashboard');

  useEffect(() => {
    const session = document.cookie.includes('cloud360_session');
    if (session) setAuthenticated(true);
    setCheckingAuth(false);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [vmRes, nodeRes] = await Promise.all([
        fetch('/api/vms'),
        fetch('/api/node'),
      ]);
      if (vmRes.ok) setVMs(await vmRes.json());
      if (nodeRes.ok) setNodeStatus(await nodeRes.json());
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [authenticated, fetchData]);

  const handleVMAction = async (vmid: number, action: VMAction) => {
    setActionLoading(vmid);
    try {
      const res = await fetch(`/api/vms/${vmid}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setTimeout(fetchData, 2000);
        setTimeout(fetchData, 5000);
      }
    } catch (err) {
      console.error('Action failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#58a6ff] border-t-transparent rounded-full spin-slow" />
      </div>
    );
  }

  if (!authenticated) {
    return <LoginPage onLogin={() => setAuthenticated(true)} />;
  }

  const filteredVMs = vms
    .filter(vm => {
      if (filter === 'running') return vm.status === 'running';
      if (filter === 'stopped') return vm.status === 'stopped';
      return true;
    })
    .filter(vm => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return vm.name.toLowerCase().includes(q) || vm.vmid.toString().includes(q);
    });

  const runningCount = vms.filter(v => v.status === 'running').length;
  const stoppedCount = vms.filter(v => v.status === 'stopped').length;
  const { title, subtitle } = viewTitles[activeView];

  return (
    <div className="min-h-screen flex">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeView={activeView}
        onViewChange={setActiveView}
        filter={filter}
        onFilterChange={setFilter}
        runningCount={runningCount}
        stoppedCount={stoppedCount}
        totalCount={vms.length}
      />
      <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <header className="sticky top-0 z-10 bg-[#0d1117]/80 backdrop-blur-md border-b border-[#30363d] px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-[#f0f6fc]">{title}</h1>
              <p className="text-sm text-[#8b949e]">{subtitle}</p>
            </div>
            <div className="flex items-center gap-4">
              {activeView === 'dashboard' && (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search VMs..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="bg-[#161b22] border border-[#30363d] rounded-lg px-4 py-2 pl-10 text-sm text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff] w-64 transition-colors"
                  />
                  <svg className="absolute left-3 top-2.5 w-4 h-4 text-[#484f58]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-[#8b949e]">
                <div className="w-2 h-2 rounded-full bg-[#3fb950] pulse-green" />
                Live
              </div>
            </div>
          </div>
        </header>
        <div className="p-6">
          {activeView === 'dashboard' && (
            <>
              {nodeStatus && <NodeOverview node={nodeStatus} />}
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-10 h-10 border-2 border-[#58a6ff] border-t-transparent rounded-full spin-slow" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4 mt-6">
                    <h2 className="text-lg font-semibold text-[#f0f6fc]">
                      Virtual Machines
                      <span className="text-sm font-normal text-[#8b949e] ml-2">({filteredVMs.length})</span>
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredVMs.map(vm => (
                      <VMCard
                        key={vm.vmid}
                        vm={vm}
                        onAction={handleVMAction}
                        onSelect={() => setSelectedVM(vm)}
                        actionLoading={actionLoading === vm.vmid}
                      />
                    ))}
                  </div>
                  {filteredVMs.length === 0 && (
                    <div className="text-center py-16 text-[#8b949e]">
                      <p className="text-lg">No VMs found</p>
                      <p className="text-sm mt-1">Try changing the filter or search query</p>
                    </div>
                  )}
                </>
              )}
            </>
          )}
          {activeView === 'monitoring' && <MonitoringView vms={vms} />}
          {activeView === 'backups' && <BackupsView />}
          {activeView === 'security' && <SecurityView />}
          {activeView === 'files' && <FileManagerView vms={vms} />}
        </div>
      </main>
      {selectedVM && (
        <VMDetailModal
          vm={selectedVM}
          onClose={() => setSelectedVM(null)}
          onAction={handleVMAction}
          onSSH={(vm) => { setSSHVM(vm); setSelectedVM(null); }}
          actionLoading={actionLoading === selectedVM.vmid}
        />
      )}
      {sshVM && (
        <SSHTerminal vm={sshVM} onClose={() => setSSHVM(null)} />
      )}
    </div>
  );
}
