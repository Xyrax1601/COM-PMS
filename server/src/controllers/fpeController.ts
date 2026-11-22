import { Request, Response } from 'express';
import { FpeRecord } from '../models/FpeRecord.js';
import { Patient } from '../models/Patient.js';
import { Consultation } from '../models/Consultation.js';
import { classifyPatientStatus } from '../utils/statusClassifier.js';
import { logActivity } from '../middleware/auditLogger.js';

export const getFpeRecords = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search, page = '1', limit = '25' } = req.query;

    const query: any = {};
    if (status && status !== 'All') {
      query.status = status;
    }

    const pageNum = Math.max(1, parseInt(String(page), 10));
    const limitNum = Math.max(1, Math.min(200, parseInt(String(limit), 10)));
    const skip = (pageNum - 1) * limitNum;

    let patientIds: any[] | null = null;
    if (search) {
      const regex = new RegExp(String(search).trim(), 'i');
      const matchedPatients = await Patient.find({
        $or: [{ complete_name: regex }, { patient_id: regex }, { philhealth_number: regex }],
      }).select('_id');
      patientIds = matchedPatients.map((p) => p._id);
      query.patient_id = { $in: patientIds };
    }

    const [records, total] = await Promise.all([
      FpeRecord.find(query).populate('patient_id').sort({ fpe_date: -1 }).skip(skip).limit(limitNum),
      FpeRecord.countDocuments(query),
    ]);

    res.json({
      success: true,
      records,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const recordFpe = async (req: Request, res: Response): Promise<void> => {
  try {
    const { patient_id, fpe_date, status = 'Completed', vital_signs, notes } = req.body;

    if (!patient_id || !fpe_date) {
      res.status(400).json({ success: false, message: 'Patient ID and FPE date are required.' });
      return;
    }

    const patient = await Patient.findById(patient_id);
    if (!patient) {
      res.status(404).json({ success: false, message: 'Patient not found.' });
      return;
    }

    const fpe = await FpeRecord.create({
      patient_id: patient._id,
      fpe_date: new Date(fpe_date),
      status,
      conducted_by: req.user?.userId as any,
      vital_signs: vital_signs || {},
      notes: notes || '',
    });

    // Re-evaluate patient status
    const consultCount = await Consultation.countDocuments({
      patient_id: patient._id,
      status: 'Completed',
    });

    patient.patient_status = classifyPatientStatus({
      is_archived: patient.is_archived,
      has_philhealth: Boolean(patient.philhealth_number),
      date_registered: patient.date_registered || null,
      has_fpe: true,
      fpe_completed: status === 'Completed',
      has_consultation: consultCount > 0,
      consultation_completed: consultCount > 0,
      has_pending_follow_up: false,
    });
    await patient.save();

    await logActivity(
      req.user,
      'RECORD_FPE',
      'FpeRecord',
      fpe._id.toString(),
      { patient_id: patient.patient_id, name: patient.complete_name, date: fpe_date },
      req
    );

    res.status(201).json({ success: true, record: fpe, patient });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateFpeRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { fpe_date, status, vital_signs, notes } = req.body;

    const record = await FpeRecord.findById(id);
    if (!record) {
      res.status(404).json({ success: false, message: 'FPE record not found.' });
      return;
    }

    if (fpe_date) record.fpe_date = new Date(fpe_date);
    if (status) record.status = status;
    if (vital_signs) record.vital_signs = { ...record.vital_signs, ...vital_signs };
    if (notes !== undefined) record.notes = notes;

    await record.save();

    // Re-evaluate patient status
    const patient = await Patient.findById(record.patient_id);
    if (patient) {
      const consultCount = await Consultation.countDocuments({
        patient_id: patient._id,
        status: 'Completed',
      });
      patient.patient_status = classifyPatientStatus({
        is_archived: patient.is_archived,
        has_philhealth: Boolean(patient.philhealth_number),
        date_registered: patient.date_registered || null,
        has_fpe: true,
        fpe_completed: record.status === 'Completed',
        has_consultation: consultCount > 0,
        consultation_completed: consultCount > 0,
        has_pending_follow_up: false,
      });
      await patient.save();
    }

    await logActivity(
      req.user,
      'UPDATE_FPE',
      'FpeRecord',
      record._id.toString(),
      { status: record.status },
      req
    );

    res.json({ success: true, record });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
