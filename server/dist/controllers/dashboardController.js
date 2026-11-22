"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = void 0;
const Patient_js_1 = require("../models/Patient.js");
const FpeRecord_js_1 = require("../models/FpeRecord.js");
const Consultation_js_1 = require("../models/Consultation.js");
const FollowUpRecord_js_1 = require("../models/FollowUpRecord.js");
const ActivityLog_js_1 = require("../models/ActivityLog.js");
const getDashboardStats = async (req, res) => {
    try {
        const { year, startDate, endDate } = req.query;
        const patientFilter = { is_archived: false };
        const dateFilter = {};
        if (startDate || endDate) {
            if (startDate)
                dateFilter.$gte = new Date(String(startDate));
            if (endDate)
                dateFilter.$lte = new Date(String(endDate));
            patientFilter.date_registered = dateFilter;
        }
        else if (year && year !== 'All') {
            const y = parseInt(String(year), 10);
            const startOfYear = new Date(y, 0, 1);
            const endOfYear = new Date(y, 11, 31, 23, 59, 59, 999);
            patientFilter.date_registered = { $gte: startOfYear, $lte: endOfYear };
        }
        const [totalPatients, totalRegisteredWithDate, totalFpeCompleted, totalConsultationsCompleted, registeredNoFpe, fpeNoConsultation, fpeNotRegistered, fpeConsultNotRegistered, upcomingFollowUps, overdueFollowUps, recentPatients, recentActivities,] = await Promise.all([
            Patient_js_1.Patient.countDocuments(patientFilter),
            Patient_js_1.Patient.countDocuments({ ...patientFilter, date_registered: { $ne: null } }),
            FpeRecord_js_1.FpeRecord.countDocuments({ status: 'Completed' }),
            Consultation_js_1.Consultation.countDocuments({ status: 'Completed' }),
            Patient_js_1.Patient.countDocuments({ ...patientFilter, patient_status: 'Registered but No FPE' }),
            Patient_js_1.Patient.countDocuments({ ...patientFilter, patient_status: 'Completed FPE but No Consultation' }),
            Patient_js_1.Patient.countDocuments({ ...patientFilter, patient_status: 'Completed FPE but Not Registered' }),
            Patient_js_1.Patient.countDocuments({ ...patientFilter, patient_status: 'FPE and Consultation but not registered' }),
            FollowUpRecord_js_1.FollowUpRecord.countDocuments({ status: 'Upcoming' }),
            FollowUpRecord_js_1.FollowUpRecord.countDocuments({ status: 'Overdue' }),
            Patient_js_1.Patient.find(patientFilter).sort({ created_at: -1 }).limit(5),
            ActivityLog_js_1.ActivityLog.find().sort({ created_at: -1 }).limit(8),
        ]);
        // Monthly patient registration & FPE aggregation for charts
        const monthlyRegistrations = await Patient_js_1.Patient.aggregate([
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
        const monthlyFpe = await FpeRecord_js_1.FpeRecord.aggregate([
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
        const monthlyConsult = await Consultation_js_1.Consultation.aggregate([
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
        const statusDistribution = await Patient_js_1.Patient.aggregate([
            { $match: { is_archived: false } },
            { $group: { _id: '$patient_status', count: { $sum: 1 } } },
        ]);
        // Sex distribution
        const sexDistribution = await Patient_js_1.Patient.aggregate([
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
    }
    catch (err) {
        console.error('getDashboardStats error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.getDashboardStats = getDashboardStats;
