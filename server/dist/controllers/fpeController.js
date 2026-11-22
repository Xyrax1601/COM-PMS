"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFpeRecord = exports.recordFpe = exports.getFpeRecords = void 0;
const FpeRecord_js_1 = require("../models/FpeRecord.js");
const Patient_js_1 = require("../models/Patient.js");
const Consultation_js_1 = require("../models/Consultation.js");
const statusClassifier_js_1 = require("../utils/statusClassifier.js");
const auditLogger_js_1 = require("../middleware/auditLogger.js");
const getFpeRecords = async (req, res) => {
    try {
        const { status, search, page = '1', limit = '25' } = req.query;
        const query = {};
        if (status && status !== 'All') {
            query.status = status;
        }
        const pageNum = Math.max(1, parseInt(String(page), 10));
        const limitNum = Math.max(1, Math.min(200, parseInt(String(limit), 10)));
        const skip = (pageNum - 1) * limitNum;
        let patientIds = null;
        if (search) {
            const regex = new RegExp(String(search).trim(), 'i');
            const matchedPatients = await Patient_js_1.Patient.find({
                $or: [{ complete_name: regex }, { patient_id: regex }, { philhealth_number: regex }],
            }).select('_id');
            patientIds = matchedPatients.map((p) => p._id);
            query.patient_id = { $in: patientIds };
        }
        const [records, total] = await Promise.all([
            FpeRecord_js_1.FpeRecord.find(query).populate('patient_id').sort({ fpe_date: -1 }).skip(skip).limit(limitNum),
            FpeRecord_js_1.FpeRecord.countDocuments(query),
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
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.getFpeRecords = getFpeRecords;
const recordFpe = async (req, res) => {
    try {
        const { patient_id, fpe_date, status = 'Completed', vital_signs, notes } = req.body;
        if (!patient_id || !fpe_date) {
            res.status(400).json({ success: false, message: 'Patient ID and FPE date are required.' });
            return;
        }
        const patient = await Patient_js_1.Patient.findById(patient_id);
        if (!patient) {
            res.status(404).json({ success: false, message: 'Patient not found.' });
            return;
        }
        const fpe = await FpeRecord_js_1.FpeRecord.create({
            patient_id: patient._id,
            fpe_date: new Date(fpe_date),
            status,
            conducted_by: req.user?.userId,
            vital_signs: vital_signs || {},
            notes: notes || '',
        });
        // Re-evaluate patient status
        const consultCount = await Consultation_js_1.Consultation.countDocuments({
            patient_id: patient._id,
            status: 'Completed',
        });
        patient.patient_status = (0, statusClassifier_js_1.classifyPatientStatus)({
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
        await (0, auditLogger_js_1.logActivity)(req.user, 'RECORD_FPE', 'FpeRecord', fpe._id.toString(), { patient_id: patient.patient_id, name: patient.complete_name, date: fpe_date }, req);
        res.status(201).json({ success: true, record: fpe, patient });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.recordFpe = recordFpe;
const updateFpeRecord = async (req, res) => {
    try {
        const { id } = req.params;
        const { fpe_date, status, vital_signs, notes } = req.body;
        const record = await FpeRecord_js_1.FpeRecord.findById(id);
        if (!record) {
            res.status(404).json({ success: false, message: 'FPE record not found.' });
            return;
        }
        if (fpe_date)
            record.fpe_date = new Date(fpe_date);
        if (status)
            record.status = status;
        if (vital_signs)
            record.vital_signs = { ...record.vital_signs, ...vital_signs };
        if (notes !== undefined)
            record.notes = notes;
        await record.save();
        // Re-evaluate patient status
        const patient = await Patient_js_1.Patient.findById(record.patient_id);
        if (patient) {
            const consultCount = await Consultation_js_1.Consultation.countDocuments({
                patient_id: patient._id,
                status: 'Completed',
            });
            patient.patient_status = (0, statusClassifier_js_1.classifyPatientStatus)({
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
        await (0, auditLogger_js_1.logActivity)(req.user, 'UPDATE_FPE', 'FpeRecord', record._id.toString(), { status: record.status }, req);
        res.json({ success: true, record });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.updateFpeRecord = updateFpeRecord;
