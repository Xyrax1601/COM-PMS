import { Request, Response } from 'express';
import { FollowUpRecord } from '../models/FollowUpRecord.js';
import { Patient } from '../models/Patient.js';
import { logActivity } from '../middleware/auditLogger.js';

export const getFollowUps = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search, page = '1', limit = '25' } = req.query;

    const now = new Date();

    // Auto-update any Upcoming records that have passed today's date into Overdue
    await FollowUpRecord.updateMany(
      { status: 'Upcoming', scheduled_date: { $lt: now } },
      { $set: { status: 'Overdue' } }
    );

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

    const [records, total, counts] = await Promise.all([
      FollowUpRecord.find(query)
        .populate('patient_id')
        .populate('consultation_id')
        .sort({ scheduled_date: 1 })
        .skip(skip)
        .limit(limitNum),
      FollowUpRecord.countDocuments(query),
      FollowUpRecord.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const statusCounts = {
      Upcoming: 0,
      Overdue: 0,
      Completed: 0,
      Cancelled: 0,
    };
    counts.forEach((c) => {
      if (c._id in statusCounts) {
        (statusCounts as any)[c._id] = c.count;
      }
    });

    res.json({
      success: true,
      records,
      statusCounts,
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

export const createFollowUp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { patient_id, consultation_id, scheduled_date, clinical_reason, notes } = req.body;

    if (!patient_id || !scheduled_date) {
      res.status(400).json({ success: false, message: 'Patient ID and scheduled follow-up date are required.' });
      return;
    }

    const patient = await Patient.findById(patient_id);
    if (!patient) {
      res.status(404).json({ success: false, message: 'Patient not found.' });
      return;
    }

    const sDate = new Date(scheduled_date);
    const status = sDate < new Date() ? 'Overdue' : 'Upcoming';

    const record = await FollowUpRecord.create({
      patient_id: patient._id,
      consultation_id: consultation_id || undefined,
      scheduled_date: sDate,
      status,
      clinical_reason: clinical_reason || 'Follow-up evaluation',
      notes: notes || '',
    });

    await logActivity(
      req.user,
      'CREATE_FOLLOW_UP',
      'FollowUp',
      record._id.toString(),
      { patient_name: patient.complete_name, scheduled_date: sDate },
      req
    );

    res.status(201).json({ success: true, record });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateFollowUp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { scheduled_date, status, clinical_reason, notes, completed_date } = req.body;

    const record = await FollowUpRecord.findById(id);
    if (!record) {
      res.status(404).json({ success: false, message: 'Follow-up record not found.' });
      return;
    }

    if (scheduled_date) record.scheduled_date = new Date(scheduled_date);
    if (status) {
      record.status = status;
      if (status === 'Completed' && !record.completed_date) {
        record.completed_date = completed_date ? new Date(completed_date) : new Date();
      }
    }
    if (clinical_reason !== undefined) record.clinical_reason = clinical_reason;
    if (notes !== undefined) record.notes = notes;

    await record.save();

    await logActivity(
      req.user,
      'UPDATE_FOLLOW_UP',
      'FollowUp',
      record._id.toString(),
      { status: record.status },
      req
    );

    res.json({ success: true, record });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteFollowUp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const record = await FollowUpRecord.findByIdAndDelete(id);
    if (!record) {
      res.status(404).json({ success: false, message: 'Follow-up record not found.' });
      return;
    }

    await logActivity(
      req.user,
      'DELETE_FOLLOW_UP',
      'FollowUp',
      record._id.toString(),
      {},
      req
    );

    res.json({ success: true, message: 'Follow-up record deleted.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
