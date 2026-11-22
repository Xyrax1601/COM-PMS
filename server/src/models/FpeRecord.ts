import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IFpeRecord extends Document {
  patient_id: Types.ObjectId;
  fpe_date: Date;
  status: 'Completed' | 'Pending' | 'Not Started';
  conducted_by?: Types.ObjectId;
  vital_signs?: {
    blood_pressure?: string;
    heart_rate?: number;
    respiratory_rate?: number;
    temperature?: number;
    weight_kg?: number;
    height_cm?: number;
    bmi?: number;
  };
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

const FpeRecordSchema = new Schema<IFpeRecord>(
  {
    patient_id: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    fpe_date: { type: Date, required: true },
    status: {
      type: String,
      enum: ['Completed', 'Pending', 'Not Started'],
      default: 'Completed',
      index: true,
    },
    conducted_by: { type: Schema.Types.ObjectId, ref: 'User' },
    vital_signs: {
      blood_pressure: { type: String, default: '' },
      heart_rate: { type: Number, default: null },
      respiratory_rate: { type: Number, default: null },
      temperature: { type: Number, default: null },
      weight_kg: { type: Number, default: null },
      height_cm: { type: Number, default: null },
      bmi: { type: Number, default: null },
    },
    notes: { type: String, default: '' },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

export const FpeRecord = mongoose.model<IFpeRecord>('FpeRecord', FpeRecordSchema);
