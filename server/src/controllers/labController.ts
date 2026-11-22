import { Request, Response } from 'express';
import { LaboratoryRecord } from '../models/LaboratoryRecord.js';
import { Patient } from '../models/Patient.js';
import { logActivity } from '../middleware/auditLogger.js';

export const getLabRecords = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, test_name, search, page = '1', limit = '25' } = req.query;

    const query: any = {};
    if (status && status !== 'All') {
      query.status = status;
    }
    if (test_name && test_name !== 'All') {
      query.test_name = new RegExp(String(test_name).trim(), 'i');
    }

    const pageNum = Math.max(1, parseInt(String(page), 10));
    const limitNum = Math.max(1, Math.min(200, parseInt(String(limit), 10)));
    const skip = (pageNum - 1) * limitNum;

    if (search) {
      const regex = new RegExp(String(search).trim(), 'i');
      const matchedPatients = await Patient.find({
        $or: [{ complete_name: regex }, { patient_id: regex }],
      }).select('_id');
      query.patient_id = { $in: matchedPatients.map((p) => p._id) };
    }

    const [records, total] = await Promise.all([
      LaboratoryRecord.find(query)
        .populate('patient_id')
        .populate('consultation_id')
        .sort({ request_date: -1 })
        .skip(skip)
        .limit(limitNum),
      LaboratoryRecord.countDocuments(query),
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

export const createLabRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const { patient_id, consultation_id, test_name, request_date, status = 'Pending', remarks } = req.body;

    if (!patient_id || !test_name) {
      res.status(400).json({ success: false, message: 'Patient ID and test name are required.' });
      return;
    }

    const patient = await Patient.findById(patient_id);
    if (!patient) {
      res.status(404).json({ success: false, message: 'Patient not found.' });
      return;
    }

    const record = await LaboratoryRecord.create({
      patient_id: patient._id,
      consultation_id: consultation_id || undefined,
      test_name: String(test_name).toUpperCase().trim(),
      request_date: request_date ? new Date(request_date) : new Date(),
      status,
      remarks: remarks || '',
    });

    await logActivity(
      req.user,
      'CREATE_LAB_REQUEST',
      'Laboratory',
      record._id.toString(),
      { test_name: record.test_name, patient_name: patient.complete_name },
      req
    );

    res.status(201).json({ success: true, record });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateLabRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, result_summary, attachment_url, remarks } = req.body;

    const record = await LaboratoryRecord.findById(id);
    if (!record) {
      res.status(404).json({ success: false, message: 'Laboratory record not found.' });
      return;
    }

    if (status) record.status = status;
    if (result_summary !== undefined) record.result_summary = result_summary;
    if (attachment_url !== undefined) record.attachment_url = attachment_url;
    if (remarks !== undefined) record.remarks = remarks;

    await record.save();

    await logActivity(
      req.user,
      'UPDATE_LAB_RECORD',
      'Laboratory',
      record._id.toString(),
      { status: record.status },
      req
    );

    res.json({ success: true, record });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteLabRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const record = await LaboratoryRecord.findByIdAndDelete(id);
    if (!record) {
      res.status(404).json({ success: false, message: 'Laboratory record not found.' });
      return;
    }

    await logActivity(
      req.user,
      'DELETE_LAB_RECORD',
      'Laboratory',
      record._id.toString(),
      { test_name: record.test_name },
      req
    );

    res.json({ success: true, message: 'Laboratory record deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
