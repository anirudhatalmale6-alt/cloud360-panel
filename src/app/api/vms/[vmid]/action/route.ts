import { NextRequest, NextResponse } from 'next/server';
import { proxmoxFetch, getNode } from '@/lib/proxmox';

const VALID_ACTIONS = ['start', 'stop', 'shutdown', 'reboot'] as const;
type Action = (typeof VALID_ACTIONS)[number];

interface ResourceEntry {
  type: string;
  vmid: number;
}

async function getVMType(vmid: number): Promise<'qemu' | 'lxc' | null> {
  const node = getNode();

  // Check cluster resources to determine if vmid is qemu or lxc
  const res = await proxmoxFetch(`/api2/json/cluster/resources?type=vm`);

  if (!res.ok) {
    // Fallback: try both endpoints
    const qemuRes = await proxmoxFetch(
      `/api2/json/nodes/${node}/qemu/${vmid}/status/current`
    );
    if (qemuRes.ok) return 'qemu';

    const lxcRes = await proxmoxFetch(
      `/api2/json/nodes/${node}/lxc/${vmid}/status/current`
    );
    if (lxcRes.ok) return 'lxc';

    return null;
  }

  const data = await res.json();
  const resource = (data.data || []).find(
    (r: ResourceEntry) => r.vmid === vmid
  );

  if (!resource) return null;
  return resource.type === 'lxc' ? 'lxc' : 'qemu';
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ vmid: string }> }
) {
  try {
    const { vmid: vmidStr } = await params;
    const vmid = parseInt(vmidStr, 10);

    if (isNaN(vmid)) {
      return NextResponse.json({ error: 'Invalid vmid' }, { status: 400 });
    }

    const body = await request.json();
    const action = body.action as Action;

    if (!action || !VALID_ACTIONS.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}` },
        { status: 400 }
      );
    }

    const vmType = await getVMType(vmid);
    if (!vmType) {
      return NextResponse.json(
        { error: `VM/Container ${vmid} not found` },
        { status: 404 }
      );
    }

    const node = getNode();
    const actionPath = `/api2/json/nodes/${node}/${vmType}/${vmid}/status/${action}`;

    const res = await proxmoxFetch(actionPath, 'POST');

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `Proxmox API error: ${res.status} ${errText}` },
        { status: 502 }
      );
    }

    const data = await res.json();

    return NextResponse.json({
      success: true,
      vmid,
      action,
      type: vmType,
      upid: data.data || null,
    });
  } catch (error) {
    console.error('Error performing VM action:', error);
    return NextResponse.json(
      { error: 'Failed to perform action' },
      { status: 500 }
    );
  }
}
