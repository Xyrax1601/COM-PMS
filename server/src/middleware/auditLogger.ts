import { Request } from 'express';
import { ActivityLog } from '../models/ActivityLog.js';

export async function logActivity(
  user: { userId?: string; name?: string } | undefined,
  action: string,
  entityType: string,
  entityId: string = '',
  details: Record<string, any> = {},
  req?: Request
): Promise<void> {
  try {
    const ip = req?.ip || req?.socket?.remoteAddress || '';
    await ActivityLog.create({
      user_id: user?.userId || undefined,
      user_name: user?.name || 'System',
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
      ip_address: String(ip),
    });
  } catch (err) {
    console.error('[AuditLogger] Failed to write activity log:', err);
  }
}
