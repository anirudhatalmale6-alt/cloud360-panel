export interface VM {
  vmid: number;
  name: string;
  status: 'running' | 'stopped' | 'paused';
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

export interface NodeStatus {
  cpu: number;
  memUsed: number;
  memTotal: number;
  diskUsed: number;
  diskTotal: number;
  uptime: number;
  kernelVersion: string;
  cpuModel: string;
  cpuCount: number;
}

export type VMAction = 'start' | 'stop' | 'shutdown' | 'reboot';
