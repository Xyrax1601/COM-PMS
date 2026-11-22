import mongoose, { Schema, Document, Types } from 'mongoose';

export type LabStatus = 'Pending' | 'Sample Collected' | 'Processing' | 'Completed' | 'Cancelled';

export interface ILaboratoryRecord extends Document {
  patient_id: Types.ObjectId;
  consultation_id?: Types.ObjectId;
  test_name: string;
  request_date: Date;
  status: LabStatus;
  result_summary?: string;
  attachment_url?: string;
  remarks?: string;
  created_at: Date;
  updated_at: Date;
}

const LaboratoryRecordSchema = new Schema<ILaboratoryRecord>(
  {
    patient_id: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    consultation_id: { type: Schema.Types.ObjectId, ref: 'Consultation', index: true },
    test_name: { type: String, required: true, trim: true, index: true },
    request_date: { type: Date, required: true, default: Date.now },
    status: {
      type: String,
      enum: ['Pending', 'Sample Collected', 'Processing', 'Completed', 'Cancelled'],
      default: 'Pending',
      index: true,
    },
    result_summary: { type: String, default: '' },
    attachment_url: { type: String, default: '' },
    remarks: { type: String, default: '' },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

export const LaboratoryRecord = mongoose.model<ILaboratoryRecord>(
  'LaboratoryRecord',
  LaboratoryRecordSchema
);
