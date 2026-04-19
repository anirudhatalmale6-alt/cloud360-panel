import { NextResponse } from 'next/server';
import { proxmoxFetch } from '@/lib/proxmox';

export async function GET() {
  const node = process.env.PROXMOX_NODE || 'basecanada';

  try {
    // Get storage list to find backup-capable storages
    const storageRes = await proxmoxFetch(`/api2/json/nodes/${node}/storage`);
    const storageJson = await storageRes.json();
    const storages = (storageJson.data || []).filter(
      (s: { content: string }) => s.content && s.content.includes('backup')
    );

    // Fetch backup content from each storage
    const backupPromises = storages.map(async (s: { storage: string; used: number; total: number; avail: number }) => {
      const contentRes = await proxmoxFetch(
        `/api2/json/nodes/${node}/storage/${s.storage}/content?content=backup`
      );
      const contentJson = await contentRes.json();
      return {
        storage: s.storage,
        used: s.used || 0,
        total: s.total || 0,
        available: s.avail || 0,
        backups: contentJson.data || [],
      };
    });

    // Fetch recent backup tasks
    const tasksRes = await proxmoxFetch(
      `/api2/json/nodes/${node}/tasks?typefilter=vzdump&limit=20&start=0`
    );
    const tasksJson = await tasksRes.json();

    const storageData = await Promise.all(backupPromises);

    // Flatten all backups
    const allBackups = storageData.flatMap(s =>
      s.backups.map((b: Record<string, unknown>) => ({ ...b, storageName: s.storage }))
    );

    return NextResponse.json({
      storages: storageData.map(s => ({
        name: s.storage,
        used: s.used,
        total: s.total,
        available: s.available,
        backupCount: s.backups.length,
      })),
      backups: allBackups,
      tasks: tasksJson.data || [],
    });
  } catch (err) {
    console.error('Backups API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
