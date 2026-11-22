"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportReportExcel = exports.getReportData = void 0;
const XLSX = __importStar(require("xlsx"));
const Patient_js_1 = require("../models/Patient.js");
const FpeRecord_js_1 = require("../models/FpeRecord.js");
const Consultation_js_1 = require("../models/Consultation.js");
const FollowUpRecord_js_1 = require("../models/FollowUpRecord.js");
const getReportData = async (req, res) => {
    try {
        const { reportType = 'monthly_registration', startDate, endDate, year } = req.query;
        const dateQuery = {};
        if (startDate || endDate) {
            if (startDate)
                dateQuery.$gte = new Date(String(startDate));
            if (endDate)
                dateQuery.$lte = new Date(String(endDate));
        }
        else if (year && year !== 'All') {
            const y = parseInt(String(year), 10);
            dateQuery.$gte = new Date(y, 0, 1);
            dateQuery.$lte = new Date(y, 11, 31, 23, 59, 59, 999);
        }
        let reportTitle = '';
        let rows = [];
        let summary = {};
        switch (reportType) {
            case 'daily_registration': {
                reportTitle = 'Daily Patient Registration Report';
                const q = { is_archived: false };
                if (Object.keys(dateQuery).length > 0)
                    q.date_registered = dateQuery;
                const patients = await Patient_js_1.Patient.find(q).sort({ date_registered: -1 });
                rows = patients.map((p) => ({
                    'Patient ID': p.patient_id,
                    'Complete Name': p.complete_name,
                    'Date Registered': p.date_registered ? p.date_registered.toISOString().split('T')[0] : 'N/A',
                    'PhilHealth Number': p.philhealth_number || 'N/A',
                    Sex: p.sex || 'N/A',
                    Age: p.age || 'N/A',
                    Status: p.patient_status,
                }));
                summary = { totalPatients: patients.length };
                break;
            }
            case 'fpe_accomplishment': {
                reportTitle = 'First Patient Encounter (FPE) Accomplishment Report';
                const q = {};
                if (Object.keys(dateQuery).length > 0)
                    q.fpe_date = dateQuery;
                const fpeList = await FpeRecord_js_1.FpeRecord.find(q).populate('patient_id').sort({ fpe_date: -1 });
                rows = fpeList.map((f) => ({
                    'FPE Date': f.fpe_date ? f.fpe_date.toISOString().split('T')[0] : 'N/A',
                    'Patient ID': f.patient_id?.patient_id || 'N/A',
                    'Patient Name': f.patient_id?.complete_name || 'N/A',
                    'PhilHealth Number': f.patient_id?.philhealth_number || 'N/A',
                    'Status': f.status,
                    'Blood Pressure': f.vital_signs?.blood_pressure || 'N/A',
                    'Heart Rate': f.vital_signs?.heart_rate || 'N/A',
                    Notes: f.notes || '',
                }));
                summary = { totalFPEs: fpeList.length };
                break;
            }
            case 'consultation_accomplishment': {
                reportTitle = 'Consultation Accomplishment Report';
                const q = {};
                if (Object.keys(dateQuery).length > 0)
                    q.consultation_date = dateQuery;
                const consults = await Consultation_js_1.Consultation.find(q).populate('patient_id').sort({ consultation_date: -1 });
                rows = consults.map((c) => ({
                    'Consultation Date': c.consultation_date ? c.consultation_date.toISOString().split('T')[0] : 'N/A',
                    'Patient ID': c.patient_id?.patient_id || 'N/A',
                    'Patient Name': c.patient_id?.complete_name || 'N/A',
                    'Attending Physician': c.attending_physician || 'N/A',
                    'Status': c.status,
                    'Clinical Remarks': c.clinical_remarks || '',
                    'Follow-up Date': c.follow_up_date ? c.follow_up_date.toISOString().split('T')[0] : 'None',
                }));
                summary = { totalConsultations: consults.length };
                break;
            }
            case 'incomplete_processes': {
                reportTitle = 'Patients With Incomplete Processes Report';
                const patients = await Patient_js_1.Patient.find({
                    is_archived: false,
                    patient_status: {
                        $in: [
                            'Registered but No FPE',
                            'Completed FPE but No Consultation',
                            'Completed FPE but Not Registered',
                            'FPE and Consultation but not registered',
                        ],
                    },
                }).sort({ complete_name: 1 });
                rows = patients.map((p) => ({
                    'Patient ID': p.patient_id,
                    'Complete Name': p.complete_name,
                    'PhilHealth Number': p.philhealth_number || 'Missing',
                    'Registration Date': p.date_registered ? p.date_registered.toISOString().split('T')[0] : 'Missing',
                    'Contact Number': p.contact_number || 'N/A',
                    'Incomplete Reason / Status': p.patient_status,
                }));
                summary = {
                    totalIncomplete: patients.length,
                    noFpe: patients.filter((p) => p.patient_status === 'Registered but No FPE').length,
                    noConsult: patients.filter((p) => p.patient_status === 'Completed FPE but No Consultation').length,
                    notRegistered: patients.filter((p) => p.patient_status === 'Completed FPE but Not Registered').length,
                    fpeConsultNotReg: patients.filter((p) => p.patient_status === 'FPE and Consultation but not registered').length,
                };
                break;
            }
            case 'philhealth_monitoring': {
                reportTitle = 'PhilHealth Registration & Verification Report';
                const patients = await Patient_js_1.Patient.find({ is_archived: false }).sort({ complete_name: 1 });
                const withPhilHealth = patients.filter((p) => Boolean(p.philhealth_number && p.philhealth_number.trim()));
                const withoutPhilHealth = patients.filter((p) => !p.philhealth_number || !p.philhealth_number.trim());
                rows = patients.map((p) => ({
                    'Patient ID': p.patient_id,
                    'Complete Name': p.complete_name,
                    'PhilHealth Number': p.philhealth_number || 'UNREGISTERED',
                    'Has PhilHealth': p.philhealth_number ? 'YES' : 'NO',
                    'Contact Number': p.contact_number || 'N/A',
                    'Patient Status': p.patient_status,
                }));
                summary = {
                    total: patients.length,
                    withPhilHealth: withPhilHealth.length,
                    withoutPhilHealth: withoutPhilHealth.length,
                    coveragePercent: Math.round((withPhilHealth.length / (patients.length || 1)) * 100),
                };
                break;
            }
            case 'follow_up_monitoring': {
                reportTitle = 'Follow-up Monitoring & Compliance Report';
                const followUps = await FollowUpRecord_js_1.FollowUpRecord.find().populate('patient_id').sort({ scheduled_date: 1 });
                rows = followUps.map((f) => ({
                    'Scheduled Date': f.scheduled_date ? f.scheduled_date.toISOString().split('T')[0] : 'N/A',
                    'Patient ID': f.patient_id?.patient_id || 'N/A',
                    'Patient Name': f.patient_id?.complete_name || 'N/A',
                    'Contact Number': f.patient_id?.contact_number || 'N/A',
                    'Status': f.status,
                    'Clinical Reason': f.clinical_reason || '',
                    'Completed Date': f.completed_date ? f.completed_date.toISOString().split('T')[0] : 'N/A',
                }));
                summary = {
                    total: followUps.length,
                    upcoming: followUps.filter((f) => f.status === 'Upcoming').length,
                    overdue: followUps.filter((f) => f.status === 'Overdue').length,
                    completed: followUps.filter((f) => f.status === 'Completed').length,
                };
                break;
            }
            default: {
                // Annual & Monthly summary statistics
                reportTitle = 'Annual & Monthly Patient Lifecycle Summary';
                const [registered, fpe, consult, noFpe, noConsult, notReg] = await Promise.all([
                    Patient_js_1.Patient.countDocuments({ is_archived: false }),
                    FpeRecord_js_1.FpeRecord.countDocuments({ status: 'Completed' }),
                    Consultation_js_1.Consultation.countDocuments({ status: 'Completed' }),
                    Patient_js_1.Patient.countDocuments({ is_archived: false, patient_status: 'Registered but No FPE' }),
                    Patient_js_1.Patient.countDocuments({ is_archived: false, patient_status: 'Completed FPE but No Consultation' }),
                    Patient_js_1.Patient.countDocuments({ is_archived: false, patient_status: 'Completed FPE but Not Registered' }),
                ]);
                summary = {
                    registered,
                    fpe,
                    consult,
                    noFpe,
                    noConsult,
                    notReg,
                };
                rows = [
                    { Category: 'Registered Patients', Count: registered },
                    { Category: 'Completed First Patient Encounters (FPE)', Count: fpe },
                    { Category: 'Completed Consultations', Count: consult },
                    { Category: 'Registered but No FPE', Count: noFpe },
                    { Category: 'FPE but Not Proceed to Consultation', Count: noConsult },
                    { Category: 'FPE but Not Registered', Count: notReg },
                ];
                break;
            }
        }
        res.json({
            success: true,
            reportTitle,
            reportType,
            generatedAt: new Date().toISOString(),
            summary,
            rows,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.getReportData = getReportData;
const exportReportExcel = async (req, res) => {
    try {
        const { reportType = 'monthly_registration' } = req.query;
        // Fetch report data
        const mockReq = { query: req.query };
        let reportPayload = null;
        const mockRes = {
            json: (data) => {
                reportPayload = data;
            },
            status: () => mockRes,
        };
        await (0, exports.getReportData)(mockReq, mockRes);
        if (!reportPayload || !reportPayload.rows) {
            res.status(500).json({ success: false, message: 'Failed to generate report export.' });
            return;
        }
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(reportPayload.rows);
        XLSX.utils.book_append_sheet(wb, ws, 'Report Data');
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="COM-PMS-${reportType}-${Date.now()}.xlsx"`);
        res.send(buffer);
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.exportReportExcel = exportReportExcel;
