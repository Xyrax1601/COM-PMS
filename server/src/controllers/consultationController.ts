import { Request, Response } from 'express';
import { Consultation } from '../models/Consultation.js';
import { Patient } from '../models/Patient.js';
import { FpeRecord } from '../models/FpeRecord.js';
import { FollowUpRecord } from '../models/FollowUpRecord.js';
import { classifyPatientStatus } from '../utils/statusClassifier.js';
import { logActivity } from '../middleware/auditLogger.js';

export const getConsultations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search, page = '1', limit = '25' } = req.query;

    const query: any = {};
    if (status && status !== 'All') {
      query.status = status;
    }

    const pageNum = Math.max(1, parseInt(String(page), 10));
    const limitNum = Math.max(1, Math.min(200, parseInt(String(limit), 10)));
    const skip = (pageNum - 1) * limitNum;

    if (search) {
      const regex = new RegExp(String(search).trim(), 'i');
      const matchedPatients = await Patient.find({
        $or: [{ complete_name: regex }, { patient_id: regex }, { philhealth_number: regex }],
      }).select('_id');
      query.patient_id = { $in: matchedPatients.map((p) => p._id) };
    }

    const [consultations, total] = await Promise.all([
      Consultation.find(query).populate('patient_id').sort({ consultation_date: -1 }).skip(skip).limit(limitNum),
      Consultation.countDocuments(query),
    ]);

    res.json({
      success: true,
      consultations,
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

export const createConsultation = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      patient_id,
      consultation_date,
      attending_physician = 'COM Attending Physician',
      status = 'Completed',
      clinical_remarks,
      recommendations,
      follow_up_date,
    } = req.body;

    if (!patient_id || !consultation_date) {
      res.status(400).json({ success: false, message: 'Patient ID and Consultation Date are required.' });
      return;
    }

    const patient = await Patient.findById(patient_id);
    if (!patient) {
      res.status(404).json({ success: false, message: 'Patient not found.' });
      return;
    }

    const consult = await Consultation.create({
      patient_id: patient._id,
      consultation_date: new Date(consultation_date),
      attending_physician,
      physician_user_id: req.user?.userId as any,
      status,
      clinical_remarks: clinical_remarks || '',
      recommendations: recommendations || '',
      follow_up_date: follow_up_date ? new Date(follow_up_date) : null,
    });

    // If follow-up date is provided, auto-create follow-up record
    if (follow_up_date) {
      const fDate = new Date(follow_up_date);
      await FollowUpRecord.create({
        patient_id: patient._id,
        consultation_id: consult._id,
        scheduled_date: fDate,
        status: fDate < new Date() ? 'Overdue' : 'Upcoming',
        clinical_reason: recommendations || clinical_remarks || 'Consultation follow-up',
      });
    }

    // Re-evaluate patient status
    const fpeRecord = await FpeRecord.findOne({ patient_id: patient._id, status: 'Completed' });
    patient.patient_status = classifyPatientStatus({
      is_archived: patient.is_archived,
      has_philhealth: Boolean(patient.philhealth_number),
      date_registered: patient.date_registered || null,
      has_fpe: Boolean(fpeRecord),
      fpe_completed: Boolean(fpeRecord),
      has_consultation: true,
      consultation_completed: status === 'Completed',
      has_pending_follow_up: Boolean(follow_up_date),
    });
    await patient.save();

    await logActivity(
      req.user,
      'CREATE_CONSULTATION',
      'Consultation',
      consult._id.toString(),
      { patient_id: patient.patient_id, name: patient.complete_name, status },
      req
    );

    res.status(201).json({ success: true, consultation: consult, patient });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateConsultation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { consultation_date, attending_physician, status, clinical_remarks, recommendations, follow_up_date } =
      req.body;

    const consult = await Consultation.findById(id);
    if (!consult) {
      res.status(404).json({ success: false, message: 'Consultation record not found.' });
      return;
    }

    if (consultation_date) consult.consultation_date = new Date(consultation_date);
    if (attending_physician) consult.attending_physician = attending_physician;
    if (status) consult.status = status;
    if (clinical_remarks !== undefined) consult.clinical_remarks = clinical_remarks;
    if (recommendations !== undefined) consult.recommendations = recommendations;
    if (follow_up_date !== undefined) consult.follow_up_date = follow_up_date ? new Date(follow_up_date) : null as any;

    await consult.save();

    // Re-evaluate patient status
    const patient = await Patient.findById(consult.patient_id);
    if (patient) {
      const fpeRecord = await FpeRecord.findOne({ patient_id: patient._id, status: 'Completed' });
      patient.patient_status = classifyPatientStatus({
        is_archived: patient.is_archived,
        has_philhealth: Boolean(patient.philhealth_number),
        date_registered: patient.date_registered || null,
        has_fpe: Boolean(fpeRecord),
        fpe_completed: Boolean(fpeRecord),
        has_consultation: true,
        consultation_completed: consult.status === 'Completed',
        has_pending_follow_up: Boolean(consult.follow_up_date),
      });
      await patient.save();
    }

    await logActivity(
      req.user,
      'UPDATE_CONSULTATION',
      'Consultation',
      consult._id.toString(),
      { status: consult.status },
      req
    );

    res.json({ success: true, consultation: consult });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
