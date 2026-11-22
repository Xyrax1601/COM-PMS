import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IActivityLog extends Document {
  user_id?: Types.ObjectId;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  created_at: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User' },
    user_name: { type: String, default: 'System' },
    action: { type: String, required: true, index: true },
    entity_type: { type: String, required: true, index: true },
    entity_id: { type: String, default: '' },
    details: { type: Schema.Types.Mixed, default: {} },
    ip_address: { type: String, default: '' },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

ActivityLogSchema.index({ created_at: -1 });

export const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
