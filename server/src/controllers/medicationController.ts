import { Request, Response } from 'express';
import { MedicationRecord } from '../models/MedicationRecord.js';
import { Patient } from '../models/Patient.js';
import { logActivity } from '../middleware/auditLogger.js';

export const getMedicationRecords = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, page = '1', limit = '25' } = req.query;

    const query: any = {};
    const pageNum = Math.max(1, parseInt(String(page), 10));
    const limitNum = Math.max(1, Math.min(200, parseInt(String(limit), 10)));
    const skip = (pageNum - 1) * limitNum;

    if (search) {
      const regex = new RegExp(String(search).trim(), 'i');
      const matchedPatients = await Patient.find({
        $or: [{ complete_name: regex }, { patient_id: regex }],
      }).select('_id');
      query.$or = [
        { medicine_name: regex },
        { remarks: regex },
        { patient_id: { $in: matchedPatients.map((p) => p._id) } },
      ];
    }

    const [records, total] = await Promise.all([
      MedicationRecord.find(query)
        .populate('patient_id')
        .populate('consultation_id')
        .sort({ date_recorded: -1 })
        .skip(skip)
        .limit(limitNum),
      MedicationRecord.countDocuments(query),
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

export const createMedicationRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const { patient_id, consultation_id, medicine_name, dosage, frequency, date_recorded, remarks } = req.body;

    if (!patient_id || !medicine_name) {
      res.status(400).json({ success: false, message: 'Patient ID and Medicine Name are required.' });
      return;
    }

    const patient = await Patient.findById(patient_id);
    if (!patient) {
      res.status(404).json({ success: false, message: 'Patient not found.' });
      return;
    }

    const record = await MedicationRecord.create({
      patient_id: patient._id,
      consultation_id: consultation_id || undefined,
      medicine_name: String(medicine_name).toUpperCase().trim(),
      dosage: dosage || '',
      frequency: frequency || '',
      date_recorded: date_recorded ? new Date(date_recorded) : new Date(),
      remarks: remarks || '',
    });

    await logActivity(
      req.user,
      'CREATE_MEDICATION_RECORD',
      'Medication',
      record._id.toString(),
      { medicine_name: record.medicine_name, patient_name: patient.complete_name },
      req
    );

    res.status(201).json({ success: true, record });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateMedicationRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { medicine_name, dosage, frequency, remarks } = req.body;

    const record = await MedicationRecord.findById(id);
    if (!record) {
      res.status(404).json({ success: false, message: 'Medication record not found.' });
      return;
    }

    if (medicine_name) record.medicine_name = String(medicine_name).toUpperCase().trim();
    if (dosage !== undefined) record.dosage = dosage;
    if (frequency !== undefined) record.frequency = frequency;
    if (remarks !== undefined) record.remarks = remarks;

    await record.save();

    await logActivity(
      req.user,
      'UPDATE_MEDICATION_RECORD',
      'Medication',
      record._id.toString(),
      { medicine_name: record.medicine_name },
      req
    );

    res.json({ success: true, record });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteMedicationRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const record = await MedicationRecord.findByIdAndDelete(id);
    if (!record) {
      res.status(404).json({ success: false, message: 'Medication record not found.' });
      return;
    }

    await logActivity(
      req.user,
      'DELETE_MEDICATION_RECORD',
      'Medication',
      record._id.toString(),
      { medicine_name: record.medicine_name },
      req
    );

    res.json({ success: true, message: 'Medication record deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
