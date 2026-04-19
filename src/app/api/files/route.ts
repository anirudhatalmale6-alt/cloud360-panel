import { NextResponse } from 'next/server';
import { proxmoxFetch } from '@/lib/proxmox';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const vmid = searchParams.get('vmid');
  const path = searchParams.get('path') || '/';
  const node = process.env.PROXMOX_NODE || 'basecanada';

  if (!vmid) {
    return NextResponse.json({ error: 'vmid required' }, { status: 400 });
  }

  try {
    // Use QEMU guest agent to list files
    const res = await proxmoxFetch(
      `/api2/json/nodes/${node}/qemu/${vmid}/agent/exec`,
      'POST',
      {
        command: '/bin/bash',
        'input-data': `ls -la --time-style=long-iso "${path}" 2>/dev/null | tail -n +2`,
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      if (errText.includes('guest-exec') && errText.includes('disabled')) {
        return NextResponse.json({ error: 'Guest agent commands disabled on this VM' }, { status: 403 });
      }
      return NextResponse.json({ error: 'Failed to list files' }, { status: res.status });
    }

    const json = await res.json();
    const pid = json.data?.pid;

    if (!pid) {
      return NextResponse.json({ error: 'Failed to execute command' }, { status: 500 });
    }

    // Wait for command to complete
    await new Promise(resolve => setTimeout(resolve, 2000));

    const statusRes = await proxmoxFetch(
      `/api2/json/nodes/${node}/qemu/${vmid}/agent/exec-status?pid=${pid}`
    );
    const statusJson = await statusRes.json();
    const output = statusJson.data?.['out-data'] || '';

    // Parse ls -la output
    const files = output
      .split('\n')
      .filter((line: string) => line.trim())
      .map((line: string) => {
        const parts = line.split(/\s+/);
        if (parts.length < 8) return null;

        const perms = parts[0];
        const size = parseInt(parts[4]) || 0;
        const date = `${parts[5]} ${parts[6]}`;
        const name = parts.slice(7).join(' ');
        const isDir = perms.startsWith('d');
        const isLink = perms.startsWith('l');

        if (name === '.' || name === '..') return null;

        return {
          name: isLink ? name.split(' -> ')[0] : name,
          isDir,
          isLink,
          size,
          permissions: perms,
          modified: date,
          path: path === '/' ? `/${name}` : `${path}/${name}`,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ path, files });
  } catch (err) {
    console.error('File listing error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
