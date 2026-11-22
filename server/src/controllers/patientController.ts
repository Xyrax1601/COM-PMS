import { Request, Response } from 'express';
import { Patient } from '../models/Patient.js';
import { FpeRecord } from '../models/FpeRecord.js';
import { Consultation } from '../models/Consultation.js';
import { LaboratoryRecord } from '../models/LaboratoryRecord.js';
import { MedicationRecord } from '../models/MedicationRecord.js';
import { FollowUpRecord } from '../models/FollowUpRecord.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { logActivity } from '../middleware/auditLogger.js';
import { normalizePhilHealthNumber, normalizeContactNumber, normalizeName, calculateAgeFromBirthday } from '../utils/excelParser.js';
import { classifyPatientStatus } from '../utils/statusClassifier.js';

export const getPatients = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      search,
      status,
      sex,
      archived = 'false',
      page = '1',
      limit = '25',
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = req.query;

    const query: any = {};

    // Archive filter
    if (archived === 'true') {
      query.is_archived = true;
    } else if (archived === 'all') {
      // include both
    } else {
      query.is_archived = false;
    }

    // Status filter
    if (status && status !== 'All') {
      query.patient_status = status;
    }

    // Sex filter
    if (sex && sex !== 'All') {
      query.sex = sex;
    }

    // Search filter across complete_name, philhealth_number, patient_id, address
    if (search) {
      const term = String(search).trim();
      const regex = new RegExp(term, 'i');
      query.$or = [
        { complete_name: regex },
        { philhealth_number: regex },
        { patient_id: regex },
        { address: regex },
        { contact_number: regex },
      ];
    }

    const pageNum = Math.max(1, parseInt(String(page), 10));
    const limitNum = Math.max(1, Math.min(200, parseInt(String(limit), 10)));
    const skip = (pageNum - 1) * limitNum;

    const sortDir = sortOrder === 'asc' ? 1 : -1;
    const sortObj: any = { [String(sortBy)]: sortDir };

    const [patients, total] = await Promise.all([
      Patient.find(query).sort(sortObj).skip(skip).limit(limitNum),
      Patient.countDocuments(query),
    ]);

    res.json({
      success: true,
      patients,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err: any) {
    console.error('getPatients error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getPatientById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const patient = await Patient.findById(id);
    if (!patient) {
      res.status(404).json({ success: false, message: 'Patient not found.' });
      return;
    }

    const [fpeRecords, consultations, laboratoryRecords, medicationRecords, followUpRecords, activityLogs] =
      await Promise.all([
        FpeRecord.find({ patient_id: patient._id }).sort({ fpe_date: -1 }),
        Consultation.find({ patient_id: patient._id }).sort({ consultation_date: -1 }),
        LaboratoryRecord.find({ patient_id: patient._id }).sort({ request_date: -1 }),
        MedicationRecord.find({ patient_id: patient._id }).sort({ date_recorded: -1 }),
        FollowUpRecord.find({ patient_id: patient._id }).sort({ scheduled_date: 1 }),
        ActivityLog.find({ entity_id: patient._id.toString() }).sort({ created_at: -1 }).limit(20),
      ]);

    res.json({
      success: true,
      patient,
      records: {
        fpeRecords,
        consultations,
        laboratoryRecords,
        medicationRecords,
        followUpRecords,
        activityLogs,
      },
    });
  } catch (err: any) {
    console.error('getPatientById error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createPatient = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      complete_name,
      philhealth_number,
      date_registered,
      birthday,
      age,
      sex,
      address,
      contact_number,
      historical_notes,
      manual_processes,
    } = req.body;

    if (!complete_name || !complete_name.trim()) {
      res.status(400).json({ success: false, message: 'Patient complete name is required.' });
      return;
    }

    // Auto-generate Patient ID: COM-YYYY-XXXXX
    const year = new Date().getFullYear();
    const count = await Patient.countDocuments();
    let nextNum = count + 1;
    let patient_id = `COM-${year}-${String(nextNum).padStart(5, '0')}`;

    // Ensure uniqueness
    while (await Patient.findOne({ patient_id })) {
      nextNum++;
      patient_id = `COM-${year}-${String(nextNum).padStart(5, '0')}`;
    }

    const cleanName = normalizeName(complete_name);
    const cleanPh = normalizePhilHealthNumber(philhealth_number);
    const cleanContact = normalizeContactNumber(contact_number);
    const bday = birthday ? new Date(birthday) : null;
    let computedAge = age !== undefined && age !== '' ? Number(age) : null;
    if (computedAge === null && bday) {
      computedAge = calculateAgeFromBirthday(bday);
    }

    const regDate = date_registered ? new Date(date_registered) : new Date();

    let hasPh = Boolean(cleanPh);
    let fpeCompleted = false;
    let consultCompleted = false;

    if (manual_processes) {
      if (typeof manual_processes.has_philhealth === 'boolean') {
        hasPh = manual_processes.has_philhealth;
      }
      fpeCompleted = Boolean(manual_processes.fpe_completed);
      consultCompleted = Boolean(manual_processes.consultation_completed);
    }

    const status = classifyPatientStatus({
      is_archived: false,
      has_philhealth: hasPh,
      date_registered: regDate,
      has_fpe: fpeCompleted,
      fpe_completed: fpeCompleted,
      has_consultation: consultCompleted,
      consultation_completed: consultCompleted,
      has_pending_follow_up: false,
    });

    const patient = await Patient.create({
      patient_id,
      complete_name: cleanName,
      philhealth_number: cleanPh,
      date_registered: regDate,
      birthday: bday,
      age: computedAge,
      sex: sex || '',
      address: address || '',
      contact_number: cleanContact,
      patient_status: status,
      is_archived: false,
      historical_notes: historical_notes || '',
      created_by: req.user?.userId as any,
    });

    // Auto-create baseline encounter records if specified in manual_processes
    if (fpeCompleted) {
      await FpeRecord.create({
        patient_id: patient._id,
        fpe_date: regDate,
        status: 'Completed',
        conducted_by: req.user?.userId as any,
        notes: 'Recorded via Registration Process Checklist',
      });
    }

    if (consultCompleted) {
      await Consultation.create({
        patient_id: patient._id,
        consultation_date: regDate,
        attending_physician: 'COM Clinic Physician',
        physician_user_id: req.user?.userId as any,
        status: 'Completed',
        clinical_remarks: 'Baseline consultation recorded via Registration Process Checklist',
      });
    }

    await logActivity(
      req.user,
      'CREATE_PATIENT',
      'Patient',
      patient._id.toString(),
      { patient_id: patient.patient_id, name: patient.complete_name },
      req
    );

    res.status(201).json({ success: true, patient });
  } catch (err: any) {
    console.error('createPatient error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updatePatient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const patient = await Patient.findById(id);
    if (!patient) {
      res.status(404).json({ success: false, message: 'Patient not found.' });
      return;
    }

    const {
      complete_name,
      philhealth_number,
      date_registered,
      birthday,
      age,
      sex,
      address,
      contact_number,
      historical_notes,
      patient_status,
      manual_processes,
    } = req.body;

    if (complete_name) patient.complete_name = normalizeName(complete_name);
    if (philhealth_number !== undefined) patient.philhealth_number = normalizePhilHealthNumber(philhealth_number);
    if (date_registered !== undefined) patient.date_registered = date_registered ? new Date(date_registered) : null as any;
    if (birthday !== undefined) {
      patient.birthday = birthday ? new Date(birthday) : null as any;
      if (age === undefined && patient.birthday) {
        patient.age = calculateAgeFromBirthday(patient.birthday) as any;
      }
    }
    if (age !== undefined) patient.age = Number(age);
    if (sex !== undefined) patient.sex = sex;
    if (address !== undefined) patient.address = address;
    if (contact_number !== undefined) patient.contact_number = normalizeContactNumber(contact_number);
    if (historical_notes !== undefined) patient.historical_notes = historical_notes;

    if (manual_processes) {
      const hasPh = typeof manual_processes.has_philhealth === 'boolean'
        ? manual_processes.has_philhealth
        : Boolean(patient.philhealth_number);
      const fpeCompleted = Boolean(manual_processes.fpe_completed);
      const consultCompleted = Boolean(manual_processes.consultation_completed);

      if (fpeCompleted) {
        const existingFpe = await FpeRecord.findOne({ patient_id: patient._id });
        if (!existingFpe) {
          await FpeRecord.create({
            patient_id: patient._id,
            fpe_date: patient.date_registered || new Date(),
            status: 'Completed',
            conducted_by: req.user?.userId as any,
            notes: 'Recorded via Patient Status Checklist',
          });
        } else if (existingFpe.status !== 'Completed') {
          existingFpe.status = 'Completed';
          await existingFpe.save();
        }
      }

      if (consultCompleted) {
        const existingConsult = await Consultation.findOne({ patient_id: patient._id });
        if (!existingConsult) {
          await Consultation.create({
            patient_id: patient._id,
            consultation_date: patient.date_registered || new Date(),
            attending_physician: 'COM Clinic Physician',
            physician_user_id: req.user?.userId as any,
            status: 'Completed',
            clinical_remarks: 'Baseline consultation recorded via Patient Status Checklist',
          });
        } else if (existingConsult.status !== 'Completed') {
          existingConsult.status = 'Completed';
          await existingConsult.save();
        }
      }

      patient.patient_status = classifyPatientStatus({
        is_archived: patient.is_archived,
        has_philhealth: hasPh,
        date_registered: patient.date_registered || null,
        has_fpe: fpeCompleted,
        fpe_completed: fpeCompleted,
        has_consultation: consultCompleted,
        consultation_completed: consultCompleted,
        has_pending_follow_up: false,
      });
    } else if (patient_status) {
      patient.patient_status = patient_status;
    }

    patient.updated_by = req.user?.userId as any;
    await patient.save();

    await logActivity(
      req.user,
      'UPDATE_PATIENT',
      'Patient',
      patient._id.toString(),
      { patient_id: patient.patient_id, name: patient.complete_name },
      req
    );

    res.json({ success: true, patient });
  } catch (err: any) {
    console.error('updatePatient error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const archivePatient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason = 'Archived by staff' } = req.body;

    const patient = await Patient.findById(id);
    if (!patient) {
      res.status(404).json({ success: false, message: 'Patient not found.' });
      return;
    }

    patient.is_archived = true;
    patient.archive_reason = reason;
    patient.patient_status = 'Archived';
    await patient.save();

    await logActivity(
      req.user,
      'ARCHIVE_PATIENT',
      'Patient',
      patient._id.toString(),
      { reason, name: patient.complete_name },
      req
    );

    res.json({ success: true, message: 'Patient record archived successfully.', patient });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const unarchivePatient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const patient = await Patient.findById(id);
    if (!patient) {
      res.status(404).json({ success: false, message: 'Patient not found.' });
      return;
    }

    patient.is_archived = false;
    patient.archive_reason = '';

    // Re-evaluate status
    const [fpeCount, consultCount] = await Promise.all([
      FpeRecord.countDocuments({ patient_id: patient._id, status: 'Completed' }),
      Consultation.countDocuments({ patient_id: patient._id, status: 'Completed' }),
    ]);

    patient.patient_status = classifyPatientStatus({
      is_archived: false,
      has_philhealth: Boolean(patient.philhealth_number),
      date_registered: patient.date_registered || null,
      has_fpe: fpeCount > 0,
      fpe_completed: fpeCount > 0,
      has_consultation: consultCount > 0,
      consultation_completed: consultCount > 0,
      has_pending_follow_up: false,
    });

    await patient.save();

    await logActivity(
      req.user,
      'UNARCHIVE_PATIENT',
      'Patient',
      patient._id.toString(),
      { name: patient.complete_name },
      req
    );

    res.json({ success: true, message: 'Patient restored successfully.', patient });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deletePatient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const patient = await Patient.findById(id);
    if (!patient) {
      res.status(404).json({ success: false, message: 'Patient not found.' });
      return;
    }

    // Cascade delete related records
    await Promise.all([
      FpeRecord.deleteMany({ patient_id: patient._id }),
      Consultation.deleteMany({ patient_id: patient._id }),
      LaboratoryRecord.deleteMany({ patient_id: patient._id }),
      MedicationRecord.deleteMany({ patient_id: patient._id }),
      FollowUpRecord.deleteMany({ patient_id: patient._id }),
      patient.deleteOne(),
    ]);

    await logActivity(
      req.user,
      'DELETE_PATIENT',
      'Patient',
      patient._id.toString(),
      { patient_id: patient.patient_id, name: patient.complete_name },
      req
    );

    res.json({ success: true, message: 'Patient and all associated clinical records permanently deleted.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
