'use client';

import { useState, useEffect } from 'react';

interface BackupEntry {
  volid: string;
  vmid: number;
  ctime: number;
  size: number;
  format: string;
  storageName: string;
  notes?: string;
}

interface BackupTask {
  upid: string;
  type: string;
  status: string;
  starttime: number;
  endtime?: number;
  node: string;
}

interface StorageInfo {
  name: string;
  used: number;
  total: number;
  available: number;
  backupCount: number;
}

interface BackupsData {
  storages: StorageInfo[];
  backups: BackupEntry[];
  tasks: BackupTask[];
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(epoch: number): string {
  return new Date(epoch * 1000).toLocaleString();
}

function timeAgo(epoch: number): string {
  const diff = Math.floor(Date.now() / 1000 - epoch);
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function BackupsView() {
  const [data, setData] = useState<BackupsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchBackups() {
      try {
        const res = await fetch('/api/backups');
        if (res.ok) {
          setData(await res.json());
        } else {
          setError('Failed to fetch backup data');
        }
      } catch {
        setError('Failed to connect to backup API');
      } finally {
        setLoading(false);
      }
    }
    fetchBackups();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-2 border-[#58a6ff] border-t-transparent rounded-full spin-slow" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-[#161b22] border border-[#f85149]/30 rounded-xl p-6 text-center">
        <p className="text-[#f85149]">{error || 'No data'}</p>
      </div>
    );
  }

  const sortedBackups = [...data.backups].sort((a, b) => b.ctime - a.ctime);
  const latestBackup = sortedBackups.length > 0 ? sortedBackups[0] : null;
  const totalSize = data.backups.reduce((sum, b) => sum + (b.size || 0), 0);
  const recentTasks = [...data.tasks].sort((a, b) => b.starttime - a.starttime);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
          <p className="text-xs text-[#8b949e] mb-1">Total Backups</p>
          <p className="text-2xl font-bold text-[#f0f6fc]">{data.backups.length}</p>
          <p className="text-xs text-[#8b949e] mt-1">across {data.storages.length} storage{data.storages.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
          <p className="text-xs text-[#8b949e] mb-1">Latest Backup</p>
          <p className="text-2xl font-bold text-[#3fb950]">
            {latestBackup ? timeAgo(latestBackup.ctime) : 'None'}
          </p>
          <p className="text-xs text-[#8b949e] mt-1">
            {latestBackup ? `VM ${latestBackup.vmid} — ${formatDate(latestBackup.ctime)}` : ''}
          </p>
        </div>
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
          <p className="text-xs text-[#8b949e] mb-1">Total Backup Size</p>
          <p className="text-2xl font-bold text-[#58a6ff]">{formatBytes(totalSize)}</p>
        </div>
      </div>

      {/* Storage Overview */}
      {data.storages.length > 0 && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
          <h3 className="text-sm font-medium text-[#f0f6fc] mb-4">Storage</h3>
          <div className="space-y-3">
            {data.storages.map(s => {
              const usedPct = s.total > 0 ? (s.used / s.total) * 100 : 0;
              return (
                <div key={s.name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-[#c9d1d9] font-medium">{s.name}</span>
                    <span className="text-[#8b949e]">
                      {formatBytes(s.used)} / {formatBytes(s.total)} ({usedPct.toFixed(1)}%) — {s.backupCount} backup{s.backupCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="h-2 bg-[#21262d] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${usedPct}%`,
                        background: usedPct > 85 ? '#f85149' : usedPct > 70 ? '#d29922' : '#3fb950',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Backup Tasks */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
        <h3 className="text-sm font-medium text-[#f0f6fc] mb-4">Recent Backup Tasks</h3>
        {recentTasks.length === 0 ? (
          <p className="text-sm text-[#8b949e]">No recent backup tasks</p>
        ) : (
          <div className="space-y-2">
            {recentTasks.slice(0, 15).map((task, i) => {
              const isOk = task.status === 'OK';
              const isRunning = !task.endtime;
              const duration = task.endtime ? task.endtime - task.starttime : 0;
              return (
                <div key={i} className="flex items-center justify-between py-2 border-b border-[#21262d] last:border-0">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      isRunning ? 'bg-[#d29922] pulse-green' : isOk ? 'bg-[#3fb950]' : 'bg-[#f85149]'
                    }`} />
                    <div>
                      <span className="text-sm text-[#c9d1d9]">{task.type}</span>
                      <span className="text-xs text-[#8b949e] ml-2">{formatDate(task.starttime)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {duration > 0 && (
                      <span className="text-xs text-[#8b949e]">{Math.floor(duration / 60)}m {duration % 60}s</span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      isRunning ? 'bg-[#d2992215] text-[#d29922]' :
                      isOk ? 'bg-[#3fb95015] text-[#3fb950]' : 'bg-[#f8514915] text-[#f85149]'
                    }`}>
                      {isRunning ? 'Running' : task.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Backup List */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
        <h3 className="text-sm font-medium text-[#f0f6fc] mb-4">
          All Backups
          <span className="text-[#8b949e] font-normal ml-2">({sortedBackups.length})</span>
        </h3>
        {sortedBackups.length === 0 ? (
          <p className="text-sm text-[#8b949e]">No backups found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#8b949e] text-xs border-b border-[#21262d]">
                  <th className="text-left py-2 px-3 font-medium">VM ID</th>
                  <th className="text-left py-2 px-3 font-medium">Date</th>
                  <th className="text-left py-2 px-3 font-medium">Size</th>
                  <th className="text-left py-2 px-3 font-medium">Format</th>
                  <th className="text-left py-2 px-3 font-medium">Storage</th>
                </tr>
              </thead>
              <tbody>
                {sortedBackups.slice(0, 50).map((b, i) => (
                  <tr key={i} className={`border-b border-[#21262d] last:border-0 ${i % 2 === 0 ? 'bg-[#0d1117]' : ''}`}>
                    <td className="py-2 px-3 text-[#58a6ff] font-mono">VM {b.vmid}</td>
                    <td className="py-2 px-3 text-[#c9d1d9]">{formatDate(b.ctime)}</td>
                    <td className="py-2 px-3 text-[#c9d1d9]">{formatBytes(b.size)}</td>
                    <td className="py-2 px-3 text-[#8b949e]">{b.format}</td>
                    <td className="py-2 px-3 text-[#8b949e]">{b.storageName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
