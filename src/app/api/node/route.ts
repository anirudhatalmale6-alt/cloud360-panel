import { NextResponse } from 'next/server';
import { proxmoxFetch, getNode, formatBytes, formatUptime, calcPercentage } from '@/lib/proxmox';

export async function GET() {
  try {
    const node = getNode();
    const res = await proxmoxFetch(`/api2/json/nodes/${node}/status`);

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `Failed to fetch node status: ${res.status} ${errText}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const info = data.data;

    const cpuUsage = info.cpu || 0;
    const memUsed = info.memory?.used || 0;
    const memTotal = info.memory?.total || 0;
    const diskUsed = info.rootfs?.used || 0;
    const diskTotal = info.rootfs?.total || 0;

    return NextResponse.json({
      cpu: {
        usage: Math.round(cpuUsage * 10000) / 100,
        model: info.cpuinfo?.model || 'Unknown',
        cores: info.cpuinfo?.cores || 0,
        sockets: info.cpuinfo?.sockets || 0,
        threads: info.cpuinfo?.cpus || 0,
      },
      memory: {
        used: memUsed,
        total: memTotal,
        usedFormatted: formatBytes(memUsed),
        totalFormatted: formatBytes(memTotal),
        percentage: calcPercentage(memUsed, memTotal),
      },
      disk: {
        used: diskUsed,
        total: diskTotal,
        usedFormatted: formatBytes(diskUsed),
        totalFormatted: formatBytes(diskTotal),
        percentage: calcPercentage(diskUsed, diskTotal),
      },
      uptime: {
        seconds: info.uptime || 0,
        formatted: formatUptime(info.uptime || 0),
      },
      kernel: info.kversion || 'Unknown',
      nodeName: node,
    });
  } catch (error) {
    console.error('Error fetching node status:', error);
    return NextResponse.json(
      { error: 'Failed to connect to Proxmox API' },
      { status: 500 }
    );
  }
}
