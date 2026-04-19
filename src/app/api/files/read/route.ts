import { NextResponse } from 'next/server';
import { proxmoxFetch } from '@/lib/proxmox';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const vmid = searchParams.get('vmid');
  const path = searchParams.get('path');
  const node = process.env.PROXMOX_NODE || 'basecanada';

  if (!vmid || !path) {
    return NextResponse.json({ error: 'vmid and path required' }, { status: 400 });
  }

  try {
    const res = await proxmoxFetch(
      `/api2/json/nodes/${node}/qemu/${vmid}/agent/exec`,
      'POST',
      {
        command: '/bin/bash',
        'input-data': `cat "${path}" 2>/dev/null | head -c 524288`,
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to read file' }, { status: res.status });
    }

    const json = await res.json();
    const pid = json.data?.pid;

    if (!pid) {
      return NextResponse.json({ error: 'Failed to execute command' }, { status: 500 });
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    const statusRes = await proxmoxFetch(
      `/api2/json/nodes/${node}/qemu/${vmid}/agent/exec-status?pid=${pid}`
    );
    const statusJson = await statusRes.json();
    const content = statusJson.data?.['out-data'] || '';
    const exitcode = statusJson.data?.exitcode;

    if (exitcode !== 0 && exitcode !== undefined) {
      const errData = statusJson.data?.['err-data'] || 'File not readable';
      return NextResponse.json({ error: errData }, { status: 400 });
    }

    return NextResponse.json({ content });
  } catch (err) {
    console.error('File read error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
