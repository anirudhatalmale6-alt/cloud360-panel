import { NextResponse } from 'next/server';
import { proxmoxFetch } from '@/lib/proxmox';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const timeframe = searchParams.get('timeframe') || 'hour';
  const vmid = searchParams.get('vmid');
  const vmtype = searchParams.get('type') || 'qemu';
  const node = process.env.PROXMOX_NODE || 'basecanada';

  try {
    let path: string;
    if (vmid) {
      path = `/api2/json/nodes/${node}/${vmtype}/${vmid}/rrddata?timeframe=${timeframe}`;
    } else {
      path = `/api2/json/nodes/${node}/rrddata?timeframe=${timeframe}`;
    }

    const res = await proxmoxFetch(path);
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch monitoring data' }, { status: res.status });
    }

    const json = await res.json();
    const data = json.data || [];

    // Filter out points with all-NaN values
    const cleaned = data.filter((point: Record<string, unknown>) => {
      return point.time && typeof point.time === 'number';
    });

    return NextResponse.json(cleaned);
  } catch (err) {
    console.error('Monitoring API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
