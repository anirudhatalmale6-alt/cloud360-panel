import { NextResponse } from 'next/server';
import { proxmoxFetch, getNode } from '@/lib/proxmox';

interface ProxmoxVM {
  vmid: number;
  name: string;
  status: string;
  cpu: number;
  mem: number;
  maxmem: number;
  disk: number;
  maxdisk: number;
  uptime: number;
  netin: number;
  netout: number;
}

interface VMResponse {
  vmid: number;
  name: string;
  status: string;
  cpu: number;
  mem: number;
  maxmem: number;
  disk: number;
  maxdisk: number;
  uptime: number;
  type: 'qemu' | 'lxc';
  netin: number;
  netout: number;
}

export async function GET() {
  try {
    const node = getNode();

    // Fetch QEMU VMs and LXC containers in parallel
    const [qemuRes, lxcRes] = await Promise.all([
      proxmoxFetch(`/api2/json/nodes/${node}/qemu`),
      proxmoxFetch(`/api2/json/nodes/${node}/lxc`),
    ]);

    if (!qemuRes.ok) {
      const errText = await qemuRes.text();
      return NextResponse.json(
        { error: `Failed to fetch QEMU VMs: ${qemuRes.status} ${errText}` },
        { status: 502 }
      );
    }

    if (!lxcRes.ok) {
      const errText = await lxcRes.text();
      return NextResponse.json(
        { error: `Failed to fetch LXC containers: ${lxcRes.status} ${errText}` },
        { status: 502 }
      );
    }

    const qemuData = await qemuRes.json();
    const lxcData = await lxcRes.json();

    const qemuVMs: VMResponse[] = (qemuData.data || []).map((vm: ProxmoxVM) => ({
      vmid: vm.vmid,
      name: vm.name || `VM ${vm.vmid}`,
      status: vm.status,
      cpu: vm.cpu || 0,
      mem: vm.mem || 0,
      maxmem: vm.maxmem || 0,
      disk: vm.disk || 0,
      maxdisk: vm.maxdisk || 0,
      uptime: vm.uptime || 0,
      type: 'qemu' as const,
      netin: vm.netin || 0,
      netout: vm.netout || 0,
    }));

    const lxcVMs: VMResponse[] = (lxcData.data || []).map((ct: ProxmoxVM) => ({
      vmid: ct.vmid,
      name: ct.name || `CT ${ct.vmid}`,
      status: ct.status,
      cpu: ct.cpu || 0,
      mem: ct.mem || 0,
      maxmem: ct.maxmem || 0,
      disk: ct.disk || 0,
      maxdisk: ct.maxdisk || 0,
      uptime: ct.uptime || 0,
      type: 'lxc' as const,
      netin: ct.netin || 0,
      netout: ct.netout || 0,
    }));

    const allVMs = [...qemuVMs, ...lxcVMs].sort((a, b) => a.vmid - b.vmid);

    return NextResponse.json(allVMs);
  } catch (error) {
    console.error('Error fetching VMs:', error);
    return NextResponse.json(
      { error: 'Failed to connect to Proxmox API' },
      { status: 500 }
    );
  }
}
