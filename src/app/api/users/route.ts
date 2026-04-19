import { NextResponse } from 'next/server';
import { proxmoxFetch } from '@/lib/proxmox';

export async function GET() {
  try {
    const [usersRes, aclRes, groupsRes, rolesRes] = await Promise.all([
      proxmoxFetch('/api2/json/access/users'),
      proxmoxFetch('/api2/json/access/acl'),
      proxmoxFetch('/api2/json/access/groups'),
      proxmoxFetch('/api2/json/access/roles'),
    ]);

    const usersJson = usersRes.ok ? await usersRes.json() : { data: [] };
    const aclJson = aclRes.ok ? await aclRes.json() : { data: [] };
    const groupsJson = groupsRes.ok ? await groupsRes.json() : { data: [] };
    const rolesJson = rolesRes.ok ? await rolesRes.json() : { data: [] };

    return NextResponse.json({
      users: usersJson.data || [],
      acl: aclJson.data || [],
      groups: groupsJson.data || [],
      roles: rolesJson.data || [],
    });
  } catch (err) {
    console.error('Users API error:', err);
    return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
  }
}
