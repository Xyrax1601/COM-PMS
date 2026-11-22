"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMedicationRecord = exports.updateMedicationRecord = exports.createMedicationRecord = exports.getMedicationRecords = void 0;
const MedicationRecord_js_1 = require("../models/MedicationRecord.js");
const Patient_js_1 = require("../models/Patient.js");
const auditLogger_js_1 = require("../middleware/auditLogger.js");
const getMedicationRecords = async (req, res) => {
    try {
        const { search, page = '1', limit = '25' } = req.query;
        const query = {};
        const pageNum = Math.max(1, parseInt(String(page), 10));
        const limitNum = Math.max(1, Math.min(200, parseInt(String(limit), 10)));
        const skip = (pageNum - 1) * limitNum;
        if (search) {
            const regex = new RegExp(String(search).trim(), 'i');
            const matchedPatients = await Patient_js_1.Patient.find({
                $or: [{ complete_name: regex }, { patient_id: regex }],
            }).select('_id');
            query.$or = [
                { medicine_name: regex },
                { remarks: regex },
                { patient_id: { $in: matchedPatients.map((p) => p._id) } },
            ];
        }
        const [records, total] = await Promise.all([
            MedicationRecord_js_1.MedicationRecord.find(query)
                .populate('patient_id')
                .populate('consultation_id')
                .sort({ date_recorded: -1 })
                .skip(skip)
                .limit(limitNum),
            MedicationRecord_js_1.MedicationRecord.countDocuments(query),
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
exports.getMedicationRecords = getMedicationRecords;
const createMedicationRecord = async (req, res) => {
    try {
        const { patient_id, consultation_id, medicine_name, dosage, frequency, date_recorded, remarks } = req.body;
        if (!patient_id || !medicine_name) {
            res.status(400).json({ success: false, message: 'Patient ID and Medicine Name are required.' });
            return;
        }
        const patient = await Patient_js_1.Patient.findById(patient_id);
        if (!patient) {
            res.status(404).json({ success: false, message: 'Patient not found.' });
            return;
        }
        const record = await MedicationRecord_js_1.MedicationRecord.create({
            patient_id: patient._id,
            consultation_id: consultation_id || undefined,
            medicine_name: String(medicine_name).toUpperCase().trim(),
            dosage: dosage || '',
            frequency: frequency || '',
            date_recorded: date_recorded ? new Date(date_recorded) : new Date(),
            remarks: remarks || '',
        });
        await (0, auditLogger_js_1.logActivity)(req.user, 'CREATE_MEDICATION_RECORD', 'Medication', record._id.toString(), { medicine_name: record.medicine_name, patient_name: patient.complete_name }, req);
        res.status(201).json({ success: true, record });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.createMedicationRecord = createMedicationRecord;
const updateMedicationRecord = async (req, res) => {
    try {
        const { id } = req.params;
        const { medicine_name, dosage, frequency, remarks } = req.body;
        const record = await MedicationRecord_js_1.MedicationRecord.findById(id);
        if (!record) {
            res.status(404).json({ success: false, message: 'Medication record not found.' });
            return;
        }
        if (medicine_name)
            record.medicine_name = String(medicine_name).toUpperCase().trim();
        if (dosage !== undefined)
            record.dosage = dosage;
        if (frequency !== undefined)
            record.frequency = frequency;
        if (remarks !== undefined)
            record.remarks = remarks;
        await record.save();
        await (0, auditLogger_js_1.logActivity)(req.user, 'UPDATE_MEDICATION_RECORD', 'Medication', record._id.toString(), { medicine_name: record.medicine_name }, req);
        res.json({ success: true, record });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.updateMedicationRecord = updateMedicationRecord;
const deleteMedicationRecord = async (req, res) => {
    try {
        const { id } = req.params;
        const record = await MedicationRecord_js_1.MedicationRecord.findByIdAndDelete(id);
        if (!record) {
            res.status(404).json({ success: false, message: 'Medication record not found.' });
            return;
        }
        await (0, auditLogger_js_1.logActivity)(req.user, 'DELETE_MEDICATION_RECORD', 'Medication', record._id.toString(), { medicine_name: record.medicine_name }, req);
        res.json({ success: true, message: 'Medication record deleted successfully.' });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.deleteMedicationRecord = deleteMedicationRecord;
