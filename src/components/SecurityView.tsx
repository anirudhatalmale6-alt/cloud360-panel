'use client';

import { useState, useEffect } from 'react';

interface SecurityData {
  nodeFirewall: { enable?: number; policy_in?: string; policy_out?: string };
  clusterFirewall: { enable?: number; policy_in?: string; policy_out?: string };
  rules: { type: string; action: string; enable: number; pos: number; comment?: string; source?: string; dest?: string; dport?: string; proto?: string }[];
  firewallLog: { t?: string; n?: number; msg?: string }[];
  sshAttempts: { timestamp: string; type: string; user: string; ip: string; message: string }[];
}

export default function SecurityView() {
  const [data, setData] = useState<SecurityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSecurity() {
      try {
        const res = await fetch('/api/security');
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error('Failed to fetch security data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSecurity();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-2 border-[#58a6ff] border-t-transparent rounded-full spin-slow" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-[#161b22] border border-[#f85149]/30 rounded-xl p-6 text-center">
        <p className="text-[#f85149]">Failed to load security data</p>
      </div>
    );
  }

  const nodeEnabled = data.nodeFirewall.enable === 1;
  const clusterEnabled = data.clusterFirewall.enable === 1;

  return (
    <div className="space-y-6">
      {/* Firewall Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[#f0f6fc]">Node Firewall</h3>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              nodeEnabled ? 'bg-[#3fb95015] text-[#3fb950]' : 'bg-[#f8514915] text-[#f85149]'
            }`}>
              {nodeEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#8b949e]">Input Policy</span>
              <span className="text-[#c9d1d9] font-mono">{data.nodeFirewall.policy_in || 'DROP'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8b949e]">Output Policy</span>
              <span className="text-[#c9d1d9] font-mono">{data.nodeFirewall.policy_out || 'ACCEPT'}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[#f0f6fc]">Cluster Firewall</h3>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              clusterEnabled ? 'bg-[#3fb95015] text-[#3fb950]' : 'bg-[#f8514915] text-[#f85149]'
            }`}>
              {clusterEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#8b949e]">Input Policy</span>
              <span className="text-[#c9d1d9] font-mono">{data.clusterFirewall.policy_in || 'DROP'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8b949e]">Output Policy</span>
              <span className="text-[#c9d1d9] font-mono">{data.clusterFirewall.policy_out || 'ACCEPT'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Firewall Rules */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
        <h3 className="text-sm font-medium text-[#f0f6fc] mb-4">
          Firewall Rules
          <span className="text-[#8b949e] font-normal ml-2">({data.rules.length})</span>
        </h3>
        {data.rules.length === 0 ? (
          <p className="text-sm text-[#8b949e]">No firewall rules configured on this node</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#8b949e] text-xs border-b border-[#21262d]">
                  <th className="text-left py-2 px-3 font-medium">#</th>
                  <th className="text-left py-2 px-3 font-medium">Action</th>
                  <th className="text-left py-2 px-3 font-medium">Type</th>
                  <th className="text-left py-2 px-3 font-medium">Proto</th>
                  <th className="text-left py-2 px-3 font-medium">Source</th>
                  <th className="text-left py-2 px-3 font-medium">Dest</th>
                  <th className="text-left py-2 px-3 font-medium">Port</th>
                  <th className="text-left py-2 px-3 font-medium">Status</th>
                  <th className="text-left py-2 px-3 font-medium">Comment</th>
                </tr>
              </thead>
              <tbody>
                {data.rules.map((rule, i) => (
                  <tr key={i} className={`border-b border-[#21262d] last:border-0 ${i % 2 === 0 ? 'bg-[#0d1117]' : ''}`}>
                    <td className="py-2 px-3 text-[#8b949e]">{rule.pos}</td>
                    <td className="py-2 px-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        rule.action === 'ACCEPT' ? 'bg-[#3fb95015] text-[#3fb950]' :
                        rule.action === 'DROP' ? 'bg-[#f8514915] text-[#f85149]' :
                        'bg-[#d2992215] text-[#d29922]'
                      }`}>
                        {rule.action}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-[#c9d1d9]">{rule.type}</td>
                    <td className="py-2 px-3 text-[#8b949e] font-mono">{rule.proto || '-'}</td>
                    <td className="py-2 px-3 text-[#8b949e] font-mono text-xs">{rule.source || '-'}</td>
                    <td className="py-2 px-3 text-[#8b949e] font-mono text-xs">{rule.dest || '-'}</td>
                    <td className="py-2 px-3 text-[#8b949e] font-mono">{rule.dport || '-'}</td>
                    <td className="py-2 px-3">
                      <span className={`w-2 h-2 rounded-full inline-block ${rule.enable ? 'bg-[#3fb950]' : 'bg-[#8b949e]'}`} />
                    </td>
                    <td className="py-2 px-3 text-[#8b949e] text-xs truncate max-w-[200px]">{rule.comment || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SSH Login Attempts */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
        <h3 className="text-sm font-medium text-[#f0f6fc] mb-4">
          SSH Login Attempts
          <span className="text-[#8b949e] font-normal ml-2">({data.sshAttempts.length})</span>
        </h3>
        {data.sshAttempts.length === 0 ? (
          <p className="text-sm text-[#8b949e]">No SSH login data available (may require syslog access)</p>
        ) : (
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {data.sshAttempts.map((attempt, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 py-1.5 px-3 rounded text-xs font-mono ${
                  attempt.type === 'accepted' ? 'text-[#3fb950]' :
                  attempt.type === 'failed' ? 'text-[#f85149]' : 'text-[#8b949e]'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  attempt.type === 'accepted' ? 'bg-[#3fb950]' : 'bg-[#f85149]'
                }`} />
                <span className="text-[#8b949e] w-32 flex-shrink-0">{attempt.timestamp}</span>
                <span className={`w-16 flex-shrink-0 ${
                  attempt.type === 'accepted' ? 'text-[#3fb950]' : 'text-[#f85149]'
                }`}>
                  {attempt.type === 'accepted' ? 'OK' : 'FAIL'}
                </span>
                <span className="text-[#c9d1d9] w-24 flex-shrink-0">{attempt.user}</span>
                <span className="text-[#8b949e]">{attempt.ip}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Firewall Log */}
      {data.firewallLog.length > 0 && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
          <h3 className="text-sm font-medium text-[#f0f6fc] mb-4">Firewall Log</h3>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {data.firewallLog.map((entry, i) => (
              <div key={i} className="text-xs font-mono text-[#8b949e] py-0.5">
                {entry.t || entry.msg || JSON.stringify(entry)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
