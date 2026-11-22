import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMedicationRecord extends Document {
  patient_id: Types.ObjectId;
  consultation_id?: Types.ObjectId;
  medicine_name: string;
  dosage?: string;
  frequency?: string;
  date_recorded: Date;
  remarks?: string;
  created_at: Date;
  updated_at: Date;
}

const MedicationRecordSchema = new Schema<IMedicationRecord>(
  {
    patient_id: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    consultation_id: { type: Schema.Types.ObjectId, ref: 'Consultation', index: true },
    medicine_name: { type: String, required: true, trim: true, index: true },
    dosage: { type: String, default: '' },
    frequency: { type: String, default: '' },
    date_recorded: { type: Date, required: true, default: Date.now },
    remarks: { type: String, default: '' },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

export const MedicationRecord = mongoose.model<IMedicationRecord>(
  'MedicationRecord',
  MedicationRecordSchema
);
