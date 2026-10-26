import { AuditLog } from '../models/AuditLog';
import mongoose from 'mongoose';

export interface AuditParams {
  actorId?: mongoose.Types.ObjectId | string;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  organizationId?: mongoose.Types.ObjectId | string;
  ipAddress?: string;
  details?: Record<string, any>;
}

export async function logAuditEvent(params: AuditParams): Promise<void> {
  try {
    await AuditLog.create({
      actorId: params.actorId ? new mongoose.Types.ObjectId(params.actorId) : undefined,
      actorEmail: params.actorEmail,
      actorRole: params.actorRole,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      organizationId: params.organizationId ? new mongoose.Types.ObjectId(params.organizationId) : undefined,
      ipAddress: params.ipAddress,
      details: params.details,
    });
  } catch (err: any) {
    console.error('[AuditLog] Failed to persist audit log:', err.message);
  }
}
