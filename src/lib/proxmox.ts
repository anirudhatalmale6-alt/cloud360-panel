// Disable SSL verification for self-signed Proxmox certificate
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const PROXMOX_HOST = process.env.PROXMOX_HOST || 'https://198.72.127.233:8006';
const PROXMOX_TOKEN_ID = process.env.PROXMOX_TOKEN_ID || '';
const PROXMOX_TOKEN_SECRET = process.env.PROXMOX_TOKEN_SECRET || '';
const PROXMOX_NODE = process.env.PROXMOX_NODE || 'basecanada';

/**
 * Makes an authenticated request to the Proxmox VE API.
 */
export async function proxmoxFetch(
  path: string,
  method: string = 'GET',
  body?: Record<string, unknown>
): Promise<Response> {
  const url = `${PROXMOX_HOST}${path}`;

  const headers: Record<string, string> = {
    Authorization: `PVEAPIToken=${PROXMOX_TOKEN_ID}=${PROXMOX_TOKEN_SECRET}`,
  };

  const options: RequestInit = {
    method,
    headers,
    cache: 'no-store',
  };

  if (body && method !== 'GET') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  return fetch(url, options);
}

/**
 * Returns the configured Proxmox node name.
 */
export function getNode(): string {
  return PROXMOX_NODE;
}

/**
 * Formats bytes into a human-readable string (KB, MB, GB, TB).
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(2)} ${units[i]}`;
}

/**
 * Formats uptime in seconds into a human-readable string.
 */
export function formatUptime(seconds: number): string {
  if (!seconds || seconds <= 0) return 'N/A';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  return parts.join(' ') || '< 1m';
}

/**
 * Calculates percentage (0-100) from used/total values.
 */
export function calcPercentage(used: number, total: number): number {
  if (!total || total === 0) return 0;
  return Math.round((used / total) * 10000) / 100;
}
