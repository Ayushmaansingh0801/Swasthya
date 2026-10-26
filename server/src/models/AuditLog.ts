import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  actorId?: mongoose.Types.ObjectId;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  organizationId?: mongoose.Types.ObjectId;
  ipAddress?: string;
  details?: Record<string, any>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    actorEmail: {
      type: String,
      index: true,
    },
    actorRole: {
      type: String,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    targetType: String,
    targetId: String,
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    ipAddress: String,
    details: Schema.Types.Mixed,
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Immutable append-only
  }
);

AuditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
