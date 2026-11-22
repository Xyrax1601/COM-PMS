export type UserRole = 'admin' | 'medical' | 'registration' | 'viewer';

export interface User {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive';
  last_login?: string;
  created_at?: string;
}

export type PatientStatus =
  | 'Registered and Completed FPE and Consultation'
  | 'Registered but No FPE'
  | 'Completed FPE but No Consultation'
  | 'Completed FPE but Not Registered'
  | 'FPE and Consultation but not registered'
  | 'Pending Follow-up'
  | 'Archived';

export interface Patient {
  _id: string;
  patient_id: string;
  complete_name: string;
  philhealth_number?: string;
  date_registered?: string;
  birthday?: string;
  age?: number;
  sex?: 'M' | 'F' | 'Other' | '';
  address?: string;
  contact_number?: string;
  patient_status: PatientStatus;
  is_archived: boolean;
  archive_reason?: string;
  historical_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface FpeRecord {
  _id: string;
  patient_id: string | Patient;
  fpe_date: string;
  status: 'Completed' | 'Pending' | 'Not Started';
  conducted_by?: string | User;
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
  created_at: string;
  updated_at: string;
}

export interface Consultation {
  _id: string;
  patient_id: string | Patient;
  consultation_date: string;
  attending_physician?: string;
  physician_user_id?: string | User;
  status: 'Completed' | 'Pending' | 'No Consultation' | 'Scheduled';
  clinical_remarks?: string;
  recommendations?: string;
  follow_up_date?: string;
  created_at: string;
  updated_at: string;
}

export interface LaboratoryRecord {
  _id: string;
  patient_id: string | Patient;
  consultation_id?: string | Consultation;
  test_name: string;
  request_date: string;
  status: 'Pending' | 'Sample Collected' | 'Processing' | 'Completed' | 'Cancelled';
  result_summary?: string;
  attachment_url?: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
}

export interface MedicationRecord {
  _id: string;
  patient_id: string | Patient;
  consultation_id?: string | Consultation;
  medicine_name: string;
  dosage?: string;
  frequency?: string;
  date_recorded: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
}

export interface FollowUpRecord {
  _id: string;
  patient_id: string | Patient;
  consultation_id?: string | Consultation;
  scheduled_date: string;
  status: 'Upcoming' | 'Completed' | 'Overdue' | 'Cancelled';
  clinical_reason?: string;
  notes?: string;
  completed_date?: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  _id: string;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export interface DashboardStats {
  totalPatients: number;
  totalRegisteredWithDate: number;
  totalFpeCompleted: number;
  totalConsultationsCompleted: number;
  registeredNoFpe: number;
  fpeNoConsultation: number;
  fpeNotRegistered: number;
  fpeConsultNotRegistered?: number;
  upcomingFollowUps: number;
  overdueFollowUps: number;
}
