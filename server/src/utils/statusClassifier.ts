import { PatientStatus } from '../models/Patient.js';

export interface PatientLifecycleInfo {
  is_archived: boolean;
  has_philhealth: boolean;
  date_registered: Date | null;
  has_fpe: boolean;
  fpe_completed: boolean;
  has_consultation: boolean;
  consultation_completed: boolean;
  has_pending_follow_up: boolean;
}

export function classifyPatientStatus(info: PatientLifecycleInfo): PatientStatus {
  if (info.is_archived) {
    return 'Archived';
  }

  // FPE and Consultation but not registered: Completed both clinical encounters without PhilHealth
  if (!info.has_philhealth && info.fpe_completed && info.consultation_completed) {
    return 'FPE and Consultation but not registered';
  }

  // Completed FPE but Not Registered: Completed FPE or clinic encounter but lacking PhilHealth registration
  if (!info.has_philhealth) {
    return 'Completed FPE but Not Registered';
  }

  // If registered and completed both FPE and consultation
  if (info.fpe_completed && info.consultation_completed) {
    return 'Registered and Completed FPE and Consultation';
  }

  // Completed FPE but No Consultation
  if (info.fpe_completed && !info.consultation_completed) {
    return 'Completed FPE but No Consultation';
  }

  // Registered but No FPE
  return 'Registered but No FPE';
}
