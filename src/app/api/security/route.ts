import { NextResponse } from 'next/server';
import { proxmoxFetch } from '@/lib/proxmox';

export async function GET() {
  const node = process.env.PROXMOX_NODE || 'basecanada';

  try {
    // Fetch firewall data in parallel
    const [nodeFirewall, clusterFirewall, nodeRules, firewallLog] = await Promise.all([
      proxmoxFetch(`/api2/json/nodes/${node}/firewall/options`).then(r => r.json()).catch(() => ({ data: {} })),
      proxmoxFetch(`/api2/json/cluster/firewall/options`).then(r => r.json()).catch(() => ({ data: {} })),
      proxmoxFetch(`/api2/json/nodes/${node}/firewall/rules`).then(r => r.json()).catch(() => ({ data: [] })),
      proxmoxFetch(`/api2/json/nodes/${node}/firewall/log?limit=50`).then(r => r.json()).catch(() => ({ data: [] })),
    ]);

    // Try to get syslog for SSH attempts
    let sshAttempts: { timestamp: string; type: string; user: string; ip: string; message: string }[] = [];
    try {
      const syslogRes = await proxmoxFetch(`/api2/json/nodes/${node}/syslog?limit=200&service=sshd`);
      if (syslogRes.ok) {
        const syslogJson = await syslogRes.json();
        const lines = syslogJson.data || [];
        sshAttempts = lines
          .filter((l: { t: string }) => l.t && (l.t.includes('sshd') || l.t.includes('ssh')))
          .map((l: { t: string; n: number }) => {
            const text = l.t;
            let type = 'info';
            let user = '';
            let ip = '';

            if (text.includes('Failed password') || text.includes('authentication failure')) {
              type = 'failed';
              const userMatch = text.match(/for (?:invalid user )?(\S+)/);
              const ipMatch = text.match(/from (\S+)/);
              user = userMatch ? userMatch[1] : '';
              ip = ipMatch ? ipMatch[1] : '';
            } else if (text.includes('Accepted')) {
              type = 'accepted';
              const userMatch = text.match(/for (\S+)/);
              const ipMatch = text.match(/from (\S+)/);
              user = userMatch ? userMatch[1] : '';
              ip = ipMatch ? ipMatch[1] : '';
            } else if (text.includes('Disconnected')) {
              type = 'disconnect';
            }

            return { timestamp: text.substring(0, 15), type, user, ip, message: text };
          })
          .filter((a: { type: string }) => a.type !== 'info')
          .slice(0, 50);
      }
    } catch {
      // Syslog access may be restricted
    }

    return NextResponse.json({
      nodeFirewall: nodeFirewall.data || {},
      clusterFirewall: clusterFirewall.data || {},
      rules: nodeRules.data || [],
      firewallLog: (firewallLog.data || []).slice(0, 50),
      sshAttempts,
    });
  } catch (err) {
    console.error('Security API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
