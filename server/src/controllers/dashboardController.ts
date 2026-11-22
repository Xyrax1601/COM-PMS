import { Request, Response } from 'express';
import { Patient } from '../models/Patient.js';
import { FpeRecord } from '../models/FpeRecord.js';
import { Consultation } from '../models/Consultation.js';
import { FollowUpRecord } from '../models/FollowUpRecord.js';
import { ActivityLog } from '../models/ActivityLog.js';

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { year, startDate, endDate } = req.query;

    const patientFilter: any = { is_archived: false };
    const dateFilter: any = {};

    if (startDate || endDate) {
      if (startDate) dateFilter.$gte = new Date(String(startDate));
      if (endDate) dateFilter.$lte = new Date(String(endDate));
      patientFilter.date_registered = dateFilter;
    } else if (year && year !== 'All') {
      const y = parseInt(String(year), 10);
      const startOfYear = new Date(y, 0, 1);
      const endOfYear = new Date(y, 11, 31, 23, 59, 59, 999);
      patientFilter.date_registered = { $gte: startOfYear, $lte: endOfYear };
    }

    const [
      totalPatients,
      totalRegisteredWithDate,
      totalFpeCompleted,
      totalConsultationsCompleted,
      registeredNoFpe,
      fpeNoConsultation,
      fpeNotRegistered,
      fpeConsultNotRegistered,
      upcomingFollowUps,
      overdueFollowUps,
      recentPatients,
      recentActivities,
    ] = await Promise.all([
      Patient.countDocuments(patientFilter),
      Patient.countDocuments({ ...patientFilter, date_registered: { $ne: null } }),
      FpeRecord.countDocuments({ status: 'Completed' }),
      Consultation.countDocuments({ status: 'Completed' }),
      Patient.countDocuments({ ...patientFilter, patient_status: 'Registered but No FPE' }),
      Patient.countDocuments({ ...patientFilter, patient_status: 'Completed FPE but No Consultation' }),
      Patient.countDocuments({ ...patientFilter, patient_status: 'Completed FPE but Not Registered' }),
      Patient.countDocuments({ ...patientFilter, patient_status: 'FPE and Consultation but not registered' }),
      FollowUpRecord.countDocuments({ status: 'Upcoming' }),
      FollowUpRecord.countDocuments({ status: 'Overdue' }),
      Patient.find(patientFilter).sort({ created_at: -1 }).limit(5),
      ActivityLog.find().sort({ created_at: -1 }).limit(8),
    ]);

    // Monthly patient registration & FPE aggregation for charts
    const monthlyRegistrations = await Patient.aggregate([
      { $match: { is_archived: false, date_registered: { $ne: null } } },
      {
        $group: {
          _id: {
            year: { $year: '$date_registered' },
            month: { $month: '$date_registered' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Monthly FPE aggregation
    const monthlyFpe = await FpeRecord.aggregate([
      { $match: { status: 'Completed' } },
      {
        $group: {
          _id: {
            year: { $year: '$fpe_date' },
            month: { $month: '$fpe_date' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Monthly Consultation aggregation
    const monthlyConsult = await Consultation.aggregate([
      { $match: { status: 'Completed' } },
      {
        $group: {
          _id: {
            year: { $year: '$consultation_date' },
            month: { $month: '$consultation_date' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Status distribution
    const statusDistribution = await Patient.aggregate([
      { $match: { is_archived: false } },
      { $group: { _id: '$patient_status', count: { $sum: 1 } } },
    ]);

    // Sex distribution
    const sexDistribution = await Patient.aggregate([
      { $match: { is_archived: false } },
      { $group: { _id: { $ifNull: ['$sex', 'Unspecified'] }, count: { $sum: 1 } } },
    ]);

    // Format monthly data for Recharts
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const targetYear = year && year !== 'All' ? parseInt(String(year), 10) : currentYear;

    const trendData = months.map((monthName, idx) => {
      const monthNum = idx + 1;
      const reg = monthlyRegistrations.find((m) => m._id.year === targetYear && m._id.month === monthNum)?.count || 0;
      const fpe = monthlyFpe.find((m) => m._id.year === targetYear && m._id.month === monthNum)?.count || 0;
      const consult = monthlyConsult.find((m) => m._id.year === targetYear && m._id.month === monthNum)?.count || 0;
      return {
        month: monthName,
        registrations: reg,
        fpe: fpe,
        consultations: consult,
      };
    });

    res.json({
      success: true,
      stats: {
        totalPatients,
        totalRegisteredWithDate,
        totalFpeCompleted,
        totalConsultationsCompleted,
        registeredNoFpe,
        fpeNoConsultation,
        fpeNotRegistered,
        fpeConsultNotRegistered,
        upcomingFollowUps,
        overdueFollowUps,
      },
      charts: {
        trendData,
        statusDistribution: statusDistribution.map((s) => ({ name: s._id || 'Unknown', value: s.count })),
        sexDistribution: sexDistribution.map((s) => ({ name: s._id === 'M' ? 'Male' : s._id === 'F' ? 'Female' : 'Other', value: s.count })),
      },
      recentPatients,
      recentActivities,
    });
  } catch (err: any) {
    console.error('getDashboardStats error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
