import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IConsultation extends Document {
  patient_id: Types.ObjectId;
  consultation_date: Date;
  attending_physician?: string;
  physician_user_id?: Types.ObjectId;
  status: 'Completed' | 'Pending' | 'No Consultation' | 'Scheduled';
  clinical_remarks?: string;
  recommendations?: string;
  follow_up_date?: Date;
  created_at: Date;
  updated_at: Date;
}

const ConsultationSchema = new Schema<IConsultation>(
  {
    patient_id: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    consultation_date: { type: Date, required: true },
    attending_physician: { type: String, default: 'COM Attending Physician' },
    physician_user_id: { type: Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['Completed', 'Pending', 'No Consultation', 'Scheduled'],
      default: 'Completed',
      index: true,
    },
    clinical_remarks: { type: String, default: '' },
    recommendations: { type: String, default: '' },
    follow_up_date: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

export const Consultation = mongoose.model<IConsultation>('Consultation', ConsultationSchema);
