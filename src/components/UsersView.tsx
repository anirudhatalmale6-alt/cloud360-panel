'use client';

import { useState, useEffect } from 'react';

interface PVEUser {
  userid: string;
  enable?: number;
  expire?: number;
  firstname?: string;
  lastname?: string;
  email?: string;
  comment?: string;
  groups?: string;
  tokens?: { tokenid: string; comment?: string; expire?: number }[];
}

interface ACLEntry {
  path: string;
  ugid: string;
  roleid: string;
  type: 'user' | 'group' | 'token';
  propagate?: number;
}

interface PVEGroup {
  groupid: string;
  comment?: string;
  members?: string;
}

interface PVERole {
  roleid: string;
  privs?: string;
  special?: number;
}

interface UsersData {
  users: PVEUser[];
  acl: ACLEntry[];
  groups: PVEGroup[];
  roles: PVERole[];
}

export default function UsersView() {
  const [data, setData] = useState<UsersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'acl' | 'groups' | 'roles'>('users');

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error('Failed to fetch users:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
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
        <p className="text-[#f85149]">Failed to load user data</p>
      </div>
    );
  }

  const tabs = [
    { key: 'users' as const, label: 'Users', count: data.users.length },
    { key: 'acl' as const, label: 'Permissions', count: data.acl.length },
    { key: 'groups' as const, label: 'Groups', count: data.groups.length },
    { key: 'roles' as const, label: 'Roles', count: data.roles.length },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
          <p className="text-xs text-[#8b949e] mb-1">Total Users</p>
          <p className="text-2xl font-bold text-[#f0f6fc]">{data.users.length}</p>
          <p className="text-xs text-[#8b949e] mt-1">
            {data.users.filter(u => u.enable !== 0).length} active
          </p>
        </div>
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
          <p className="text-xs text-[#8b949e] mb-1">API Tokens</p>
          <p className="text-2xl font-bold text-[#58a6ff]">
            {data.users.reduce((sum, u) => sum + (u.tokens?.length || 0), 0)}
          </p>
        </div>
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
          <p className="text-xs text-[#8b949e] mb-1">Groups</p>
          <p className="text-2xl font-bold text-[#bc8cff]">{data.groups.length}</p>
        </div>
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
          <p className="text-xs text-[#8b949e] mb-1">ACL Rules</p>
          <p className="text-2xl font-bold text-[#d29922]">{data.acl.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#161b22] border border-[#30363d] rounded-xl p-1">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-[#21262d] text-[#f0f6fc]'
                : 'text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            {tab.label}
            <span className="ml-2 text-xs opacity-60">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
          <h3 className="text-sm font-medium text-[#f0f6fc] mb-4">Proxmox Users</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#8b949e] text-xs border-b border-[#21262d]">
                  <th className="text-left py-2 px-3 font-medium">User ID</th>
                  <th className="text-left py-2 px-3 font-medium">Name</th>
                  <th className="text-left py-2 px-3 font-medium">Email</th>
                  <th className="text-left py-2 px-3 font-medium">Groups</th>
                  <th className="text-left py-2 px-3 font-medium">Tokens</th>
                  <th className="text-left py-2 px-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((user, i) => {
                  const isEnabled = user.enable !== 0;
                  const name = [user.firstname, user.lastname].filter(Boolean).join(' ');
                  const userAcls = data.acl.filter(a => a.ugid === user.userid);
                  return (
                    <tr key={i} className={`border-b border-[#21262d] last:border-0 ${i % 2 === 0 ? 'bg-[#0d1117]' : ''}`}>
                      <td className="py-2.5 px-3">
                        <span className="text-[#58a6ff] font-mono text-xs">{user.userid}</span>
                        {userAcls.length > 0 && (
                          <span className="ml-2 text-[10px] text-[#8b949e] bg-[#21262d] px-1.5 py-0.5 rounded">
                            {userAcls.length} permission{userAcls.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-[#c9d1d9]">{name || '—'}</td>
                      <td className="py-2.5 px-3 text-[#8b949e] text-xs">{user.email || '—'}</td>
                      <td className="py-2.5 px-3 text-[#8b949e] text-xs">{user.groups || '—'}</td>
                      <td className="py-2.5 px-3">
                        {user.tokens && user.tokens.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {user.tokens.map((t, ti) => (
                              <span key={ti} className="text-[10px] bg-[#21262d] text-[#8b949e] px-1.5 py-0.5 rounded font-mono">
                                {t.tokenid}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[#484f58] text-xs">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          isEnabled ? 'bg-[#3fb95015] text-[#3fb950]' : 'bg-[#f8514915] text-[#f85149]'
                        }`}>
                          {isEnabled ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ACL/Permissions Tab */}
      {activeTab === 'acl' && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
          <h3 className="text-sm font-medium text-[#f0f6fc] mb-4">Access Control List</h3>
          {data.acl.length === 0 ? (
            <p className="text-sm text-[#8b949e]">No ACL entries configured</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[#8b949e] text-xs border-b border-[#21262d]">
                    <th className="text-left py-2 px-3 font-medium">Path</th>
                    <th className="text-left py-2 px-3 font-medium">Type</th>
                    <th className="text-left py-2 px-3 font-medium">User/Group</th>
                    <th className="text-left py-2 px-3 font-medium">Role</th>
                    <th className="text-left py-2 px-3 font-medium">Propagate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.acl.map((entry, i) => (
                    <tr key={i} className={`border-b border-[#21262d] last:border-0 ${i % 2 === 0 ? 'bg-[#0d1117]' : ''}`}>
                      <td className="py-2 px-3 text-[#c9d1d9] font-mono text-xs">{entry.path}</td>
                      <td className="py-2 px-3">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                          entry.type === 'user' ? 'bg-[#58a6ff15] text-[#58a6ff]' :
                          entry.type === 'group' ? 'bg-[#bc8cff15] text-[#bc8cff]' :
                          'bg-[#d2992215] text-[#d29922]'
                        }`}>
                          {entry.type}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-[#c9d1d9] font-mono text-xs">{entry.ugid}</td>
                      <td className="py-2 px-3">
                        <span className="text-xs bg-[#21262d] text-[#8b949e] px-2 py-0.5 rounded font-mono">
                          {entry.roleid}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-[#8b949e] text-xs">
                        {entry.propagate ? 'Yes' : 'No'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Groups Tab */}
      {activeTab === 'groups' && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
          <h3 className="text-sm font-medium text-[#f0f6fc] mb-4">Groups</h3>
          {data.groups.length === 0 ? (
            <p className="text-sm text-[#8b949e]">No groups configured</p>
          ) : (
            <div className="space-y-3">
              {data.groups.map((group, i) => {
                const members = group.members ? group.members.split(',') : [];
                const groupAcls = data.acl.filter(a => a.ugid === group.groupid && a.type === 'group');
                return (
                  <div key={i} className="border border-[#21262d] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-[#f0f6fc] font-medium">{group.groupid}</span>
                      <span className="text-xs text-[#8b949e]">{members.length} member{members.length !== 1 ? 's' : ''}</span>
                    </div>
                    {group.comment && (
                      <p className="text-xs text-[#8b949e] mb-2">{group.comment}</p>
                    )}
                    {members.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {members.map((m, mi) => (
                          <span key={mi} className="text-[10px] bg-[#21262d] text-[#58a6ff] px-2 py-0.5 rounded-full font-mono">
                            {m.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                    {groupAcls.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-[#21262d]">
                        <p className="text-[10px] text-[#484f58] uppercase mb-1">Permissions</p>
                        {groupAcls.map((acl, ai) => (
                          <div key={ai} className="text-xs text-[#8b949e] font-mono">
                            {acl.path} — {acl.roleid}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
          <h3 className="text-sm font-medium text-[#f0f6fc] mb-4">Roles</h3>
          <div className="space-y-3">
            {data.roles.map((role, i) => {
              const privs = role.privs ? role.privs.split(',') : [];
              return (
                <div key={i} className="border border-[#21262d] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#f0f6fc] font-medium">{role.roleid}</span>
                    <div className="flex items-center gap-2">
                      {role.special === 1 && (
                        <span className="text-[10px] bg-[#d2992215] text-[#d29922] px-2 py-0.5 rounded-full">Built-in</span>
                      )}
                      <span className="text-xs text-[#8b949e]">{privs.length} privilege{privs.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  {privs.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {privs.map((p, pi) => (
                        <span key={pi} className="text-[10px] bg-[#21262d] text-[#8b949e] px-1.5 py-0.5 rounded font-mono">
                          {p.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
