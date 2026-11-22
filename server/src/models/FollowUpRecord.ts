import mongoose, { Schema, Document, Types } from 'mongoose';

export type FollowUpStatus = 'Upcoming' | 'Completed' | 'Overdue' | 'Cancelled';

export interface IFollowUpRecord extends Document {
  patient_id: Types.ObjectId;
  consultation_id?: Types.ObjectId;
  scheduled_date: Date;
  status: FollowUpStatus;
  clinical_reason?: string;
  notes?: string;
  completed_date?: Date;
  created_at: Date;
  updated_at: Date;
}

const FollowUpRecordSchema = new Schema<IFollowUpRecord>(
  {
    patient_id: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    consultation_id: { type: Schema.Types.ObjectId, ref: 'Consultation', index: true },
    scheduled_date: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['Upcoming', 'Completed', 'Overdue', 'Cancelled'],
      default: 'Upcoming',
      index: true,
    },
    clinical_reason: { type: String, default: '' },
    notes: { type: String, default: '' },
    completed_date: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

export const FollowUpRecord = mongoose.model<IFollowUpRecord>(
  'FollowUpRecord',
  FollowUpRecordSchema
);
