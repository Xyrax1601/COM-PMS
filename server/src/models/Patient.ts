import mongoose, { Schema, Document, Types } from 'mongoose';

export type PatientStatus =
  | 'Registered and Completed FPE and Consultation'
  | 'Registered but No FPE'
  | 'Completed FPE but No Consultation'
  | 'Completed FPE but Not Registered'
  | 'FPE and Consultation but not registered'
  | 'Pending Follow-up'
  | 'Archived';

export interface IPatient extends Document {
  patient_id: string;
  complete_name: string;
  philhealth_number?: string;
  date_registered?: Date;
  birthday?: Date;
  age?: number;
  sex?: 'M' | 'F' | 'Other';
  address?: string;
  contact_number?: string;
  patient_status: PatientStatus;
  is_archived: boolean;
  archive_reason?: string;
  historical_notes?: string;
  created_by?: Types.ObjectId;
  updated_by?: Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const PatientSchema = new Schema<IPatient>(
  {
    patient_id: { type: String, required: true, unique: true, index: true },
    complete_name: { type: String, required: true, trim: true, index: true },
    philhealth_number: { type: String, trim: true, default: '', index: true },
    date_registered: { type: Date, default: null },
    birthday: { type: Date, default: null },
    age: { type: Number, default: null },
    sex: { type: String, enum: ['M', 'F', 'Other', ''], default: '' },
    address: { type: String, trim: true, default: '' },
    contact_number: { type: String, trim: true, default: '' },
    patient_status: {
      type: String,
      enum: [
        'Registered and Completed FPE and Consultation',
        'Registered but No FPE',
        'Completed FPE but No Consultation',
        'Completed FPE but Not Registered',
        'FPE and Consultation but not registered',
        'Pending Follow-up',
        'Archived',
      ],
      default: 'Registered but No FPE',
      index: true,
    },
    is_archived: { type: Boolean, default: false, index: true },
    archive_reason: { type: String, default: '' },
    historical_notes: { type: String, default: '' },
    created_by: { type: Schema.Types.ObjectId, ref: 'User' },
    updated_by: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

PatientSchema.index({ complete_name: 'text', philhealth_number: 'text', address: 'text' });

export const Patient = mongoose.model<IPatient>('Patient', PatientSchema);
