import { Request, Response } from 'express';
import { Patient } from '../models/Patient.js';
import { FollowUpRecord } from '../models/FollowUpRecord.js';

export const getMonitoringSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalPatients,
      regAndCompleted,
      regNoFpe,
      fpeNoConsult,
      fpeNotReg,
      fpeConsultNotReg,
      pendingFollowUpsCount,
      overdueFollowUpsCount,
    ] = await Promise.all([
      Patient.countDocuments({ is_archived: false }),
      Patient.countDocuments({
        is_archived: false,
        patient_status: 'Registered and Completed FPE and Consultation',
      }),
      Patient.countDocuments({
        is_archived: false,
        patient_status: 'Registered but No FPE',
      }),
      Patient.countDocuments({
        is_archived: false,
        patient_status: 'Completed FPE but No Consultation',
      }),
      Patient.countDocuments({
        is_archived: false,
        patient_status: 'Completed FPE but Not Registered',
      }),
      Patient.countDocuments({
        is_archived: false,
        patient_status: 'FPE and Consultation but not registered',
      }),
      FollowUpRecord.countDocuments({ status: 'Upcoming' }),
      FollowUpRecord.countDocuments({ status: 'Overdue' }),
    ]);

    res.json({
      success: true,
      summary: {
        totalPatients,
        categories: {
          registered_and_completed: regAndCompleted,
          registered_no_fpe: regNoFpe,
          fpe_no_consultation: fpeNoConsult,
          fpe_not_registered: fpeNotReg,
          fpe_consultation_not_registered: fpeConsultNotReg,
          pending_follow_ups: pendingFollowUpsCount + overdueFollowUpsCount,
          upcoming_follow_ups: pendingFollowUpsCount,
          overdue_follow_ups: overdueFollowUpsCount,
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getMonitoringCategoryPatients = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category } = req.params;
    const { search, page = '1', limit = '25' } = req.query;

    const pageNum = Math.max(1, parseInt(String(page), 10));
    const limitNum = Math.max(1, Math.min(200, parseInt(String(limit), 10)));
    const skip = (pageNum - 1) * limitNum;

    if (category === 'pending_follow_ups') {
      const followUpQuery: any = { status: { $in: ['Upcoming', 'Overdue'] } };
      const [followUps, total] = await Promise.all([
        FollowUpRecord.find(followUpQuery)
          .populate('patient_id')
          .sort({ scheduled_date: 1 })
          .skip(skip)
          .limit(limitNum),
        FollowUpRecord.countDocuments(followUpQuery),
      ]);

      res.json({
        success: true,
        category,
        records: followUps,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
      return;
    }

    // Map URL slug to exact DB status
    let statusFilter = '';
    switch (category) {
      case 'registered_and_completed':
        statusFilter = 'Registered and Completed FPE and Consultation';
        break;
      case 'registered_no_fpe':
        statusFilter = 'Registered but No FPE';
        break;
      case 'fpe_no_consultation':
        statusFilter = 'Completed FPE but No Consultation';
        break;
      case 'fpe_not_registered':
        statusFilter = 'Completed FPE but Not Registered';
        break;
      case 'fpe_consultation_not_registered':
        statusFilter = 'FPE and Consultation but not registered';
        break;
      default:
        res.status(400).json({ success: false, message: 'Invalid monitoring category specified.' });
        return;
    }

    const query: any = { is_archived: false, patient_status: statusFilter };

    if (search) {
      const regex = new RegExp(String(search).trim(), 'i');
      query.$or = [
        { complete_name: regex },
        { patient_id: regex },
        { philhealth_number: regex },
        { address: regex },
      ];
    }

    const [patients, total] = await Promise.all([
      Patient.find(query).sort({ date_registered: -1, created_at: -1 }).skip(skip).limit(limitNum),
      Patient.countDocuments(query),
    ]);

    res.json({
      success: true,
      category,
      patients,
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
