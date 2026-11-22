"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePatient = exports.unarchivePatient = exports.archivePatient = exports.updatePatient = exports.createPatient = exports.getPatientById = exports.getPatients = void 0;
const Patient_js_1 = require("../models/Patient.js");
const FpeRecord_js_1 = require("../models/FpeRecord.js");
const Consultation_js_1 = require("../models/Consultation.js");
const LaboratoryRecord_js_1 = require("../models/LaboratoryRecord.js");
const MedicationRecord_js_1 = require("../models/MedicationRecord.js");
const FollowUpRecord_js_1 = require("../models/FollowUpRecord.js");
const ActivityLog_js_1 = require("../models/ActivityLog.js");
const auditLogger_js_1 = require("../middleware/auditLogger.js");
const excelParser_js_1 = require("../utils/excelParser.js");
const statusClassifier_js_1 = require("../utils/statusClassifier.js");
const getPatients = async (req, res) => {
    try {
        const { search, status, sex, archived = 'false', page = '1', limit = '25', sortBy = 'created_at', sortOrder = 'desc', } = req.query;
        const query = {};
        // Archive filter
        if (archived === 'true') {
            query.is_archived = true;
        }
        else if (archived === 'all') {
            // include both
        }
        else {
            query.is_archived = false;
        }
        // Status filter
        if (status && status !== 'All') {
            query.patient_status = status;
        }
        // Sex filter
        if (sex && sex !== 'All') {
            query.sex = sex;
        }
        // Search filter across complete_name, philhealth_number, patient_id, address
        if (search) {
            const term = String(search).trim();
            const regex = new RegExp(term, 'i');
            query.$or = [
                { complete_name: regex },
                { philhealth_number: regex },
                { patient_id: regex },
                { address: regex },
                { contact_number: regex },
            ];
        }
        const pageNum = Math.max(1, parseInt(String(page), 10));
        const limitNum = Math.max(1, Math.min(200, parseInt(String(limit), 10)));
        const skip = (pageNum - 1) * limitNum;
        const sortDir = sortOrder === 'asc' ? 1 : -1;
        const sortObj = { [String(sortBy)]: sortDir };
        const [patients, total] = await Promise.all([
            Patient_js_1.Patient.find(query).sort(sortObj).skip(skip).limit(limitNum),
            Patient_js_1.Patient.countDocuments(query),
        ]);
        res.json({
            success: true,
            patients,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    }
    catch (err) {
        console.error('getPatients error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.getPatients = getPatients;
const getPatientById = async (req, res) => {
    try {
        const { id } = req.params;
        const patient = await Patient_js_1.Patient.findById(id);
        if (!patient) {
            res.status(404).json({ success: false, message: 'Patient not found.' });
            return;
        }
        const [fpeRecords, consultations, laboratoryRecords, medicationRecords, followUpRecords, activityLogs] = await Promise.all([
            FpeRecord_js_1.FpeRecord.find({ patient_id: patient._id }).sort({ fpe_date: -1 }),
            Consultation_js_1.Consultation.find({ patient_id: patient._id }).sort({ consultation_date: -1 }),
            LaboratoryRecord_js_1.LaboratoryRecord.find({ patient_id: patient._id }).sort({ request_date: -1 }),
            MedicationRecord_js_1.MedicationRecord.find({ patient_id: patient._id }).sort({ date_recorded: -1 }),
            FollowUpRecord_js_1.FollowUpRecord.find({ patient_id: patient._id }).sort({ scheduled_date: 1 }),
            ActivityLog_js_1.ActivityLog.find({ entity_id: patient._id.toString() }).sort({ created_at: -1 }).limit(20),
        ]);
        res.json({
            success: true,
            patient,
            records: {
                fpeRecords,
                consultations,
                laboratoryRecords,
                medicationRecords,
                followUpRecords,
                activityLogs,
            },
        });
    }
    catch (err) {
        console.error('getPatientById error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.getPatientById = getPatientById;
const createPatient = async (req, res) => {
    try {
        const { complete_name, philhealth_number, date_registered, birthday, age, sex, address, contact_number, historical_notes, manual_processes, } = req.body;
        if (!complete_name || !complete_name.trim()) {
            res.status(400).json({ success: false, message: 'Patient complete name is required.' });
            return;
        }
        // Auto-generate Patient ID: COM-YYYY-XXXXX
        const year = new Date().getFullYear();
        const count = await Patient_js_1.Patient.countDocuments();
        let nextNum = count + 1;
        let patient_id = `COM-${year}-${String(nextNum).padStart(5, '0')}`;
        // Ensure uniqueness
        while (await Patient_js_1.Patient.findOne({ patient_id })) {
            nextNum++;
            patient_id = `COM-${year}-${String(nextNum).padStart(5, '0')}`;
        }
        const cleanName = (0, excelParser_js_1.normalizeName)(complete_name);
        const cleanPh = (0, excelParser_js_1.normalizePhilHealthNumber)(philhealth_number);
        const cleanContact = (0, excelParser_js_1.normalizeContactNumber)(contact_number);
        const bday = birthday ? new Date(birthday) : null;
        let computedAge = age !== undefined && age !== '' ? Number(age) : null;
        if (computedAge === null && bday) {
            computedAge = (0, excelParser_js_1.calculateAgeFromBirthday)(bday);
        }
        const regDate = date_registered ? new Date(date_registered) : new Date();
        let hasPh = Boolean(cleanPh);
        let fpeCompleted = false;
        let consultCompleted = false;
        if (manual_processes) {
            if (typeof manual_processes.has_philhealth === 'boolean') {
                hasPh = manual_processes.has_philhealth;
            }
            fpeCompleted = Boolean(manual_processes.fpe_completed);
            consultCompleted = Boolean(manual_processes.consultation_completed);
        }
        const status = (0, statusClassifier_js_1.classifyPatientStatus)({
            is_archived: false,
            has_philhealth: hasPh,
            date_registered: regDate,
            has_fpe: fpeCompleted,
            fpe_completed: fpeCompleted,
            has_consultation: consultCompleted,
            consultation_completed: consultCompleted,
            has_pending_follow_up: false,
        });
        const patient = await Patient_js_1.Patient.create({
            patient_id,
            complete_name: cleanName,
            philhealth_number: cleanPh,
            date_registered: regDate,
            birthday: bday,
            age: computedAge,
            sex: sex || '',
            address: address || '',
            contact_number: cleanContact,
            patient_status: status,
            is_archived: false,
            historical_notes: historical_notes || '',
            created_by: req.user?.userId,
        });
        // Auto-create baseline encounter records if specified in manual_processes
        if (fpeCompleted) {
            await FpeRecord_js_1.FpeRecord.create({
                patient_id: patient._id,
                fpe_date: regDate,
                status: 'Completed',
                conducted_by: req.user?.userId,
                notes: 'Recorded via Registration Process Checklist',
            });
        }
        if (consultCompleted) {
            await Consultation_js_1.Consultation.create({
                patient_id: patient._id,
                consultation_date: regDate,
                attending_physician: 'COM Clinic Physician',
                physician_user_id: req.user?.userId,
                status: 'Completed',
                clinical_remarks: 'Baseline consultation recorded via Registration Process Checklist',
            });
        }
        await (0, auditLogger_js_1.logActivity)(req.user, 'CREATE_PATIENT', 'Patient', patient._id.toString(), { patient_id: patient.patient_id, name: patient.complete_name }, req);
        res.status(201).json({ success: true, patient });
    }
    catch (err) {
        console.error('createPatient error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.createPatient = createPatient;
const updatePatient = async (req, res) => {
    try {
        const { id } = req.params;
        const patient = await Patient_js_1.Patient.findById(id);
        if (!patient) {
            res.status(404).json({ success: false, message: 'Patient not found.' });
            return;
        }
        const { complete_name, philhealth_number, date_registered, birthday, age, sex, address, contact_number, historical_notes, patient_status, manual_processes, } = req.body;
        if (complete_name)
            patient.complete_name = (0, excelParser_js_1.normalizeName)(complete_name);
        if (philhealth_number !== undefined)
            patient.philhealth_number = (0, excelParser_js_1.normalizePhilHealthNumber)(philhealth_number);
        if (date_registered !== undefined)
            patient.date_registered = date_registered ? new Date(date_registered) : null;
        if (birthday !== undefined) {
            patient.birthday = birthday ? new Date(birthday) : null;
            if (age === undefined && patient.birthday) {
                patient.age = (0, excelParser_js_1.calculateAgeFromBirthday)(patient.birthday);
            }
        }
        if (age !== undefined)
            patient.age = Number(age);
        if (sex !== undefined)
            patient.sex = sex;
        if (address !== undefined)
            patient.address = address;
        if (contact_number !== undefined)
            patient.contact_number = (0, excelParser_js_1.normalizeContactNumber)(contact_number);
        if (historical_notes !== undefined)
            patient.historical_notes = historical_notes;
        if (manual_processes) {
            const hasPh = typeof manual_processes.has_philhealth === 'boolean'
                ? manual_processes.has_philhealth
                : Boolean(patient.philhealth_number);
            const fpeCompleted = Boolean(manual_processes.fpe_completed);
            const consultCompleted = Boolean(manual_processes.consultation_completed);
            if (fpeCompleted) {
                const existingFpe = await FpeRecord_js_1.FpeRecord.findOne({ patient_id: patient._id });
                if (!existingFpe) {
                    await FpeRecord_js_1.FpeRecord.create({
                        patient_id: patient._id,
                        fpe_date: patient.date_registered || new Date(),
                        status: 'Completed',
                        conducted_by: req.user?.userId,
                        notes: 'Recorded via Patient Status Checklist',
                    });
                }
                else if (existingFpe.status !== 'Completed') {
                    existingFpe.status = 'Completed';
                    await existingFpe.save();
                }
            }
            if (consultCompleted) {
                const existingConsult = await Consultation_js_1.Consultation.findOne({ patient_id: patient._id });
                if (!existingConsult) {
                    await Consultation_js_1.Consultation.create({
                        patient_id: patient._id,
                        consultation_date: patient.date_registered || new Date(),
                        attending_physician: 'COM Clinic Physician',
                        physician_user_id: req.user?.userId,
                        status: 'Completed',
                        clinical_remarks: 'Baseline consultation recorded via Patient Status Checklist',
                    });
                }
                else if (existingConsult.status !== 'Completed') {
                    existingConsult.status = 'Completed';
                    await existingConsult.save();
                }
            }
            patient.patient_status = (0, statusClassifier_js_1.classifyPatientStatus)({
                is_archived: patient.is_archived,
                has_philhealth: hasPh,
                date_registered: patient.date_registered || null,
                has_fpe: fpeCompleted,
                fpe_completed: fpeCompleted,
                has_consultation: consultCompleted,
                consultation_completed: consultCompleted,
                has_pending_follow_up: false,
            });
        }
        else if (patient_status) {
            patient.patient_status = patient_status;
        }
        patient.updated_by = req.user?.userId;
        await patient.save();
        await (0, auditLogger_js_1.logActivity)(req.user, 'UPDATE_PATIENT', 'Patient', patient._id.toString(), { patient_id: patient.patient_id, name: patient.complete_name }, req);
        res.json({ success: true, patient });
    }
    catch (err) {
        console.error('updatePatient error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.updatePatient = updatePatient;
const archivePatient = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason = 'Archived by staff' } = req.body;
        const patient = await Patient_js_1.Patient.findById(id);
        if (!patient) {
            res.status(404).json({ success: false, message: 'Patient not found.' });
            return;
        }
        patient.is_archived = true;
        patient.archive_reason = reason;
        patient.patient_status = 'Archived';
        await patient.save();
        await (0, auditLogger_js_1.logActivity)(req.user, 'ARCHIVE_PATIENT', 'Patient', patient._id.toString(), { reason, name: patient.complete_name }, req);
        res.json({ success: true, message: 'Patient record archived successfully.', patient });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.archivePatient = archivePatient;
const unarchivePatient = async (req, res) => {
    try {
        const { id } = req.params;
        const patient = await Patient_js_1.Patient.findById(id);
        if (!patient) {
            res.status(404).json({ success: false, message: 'Patient not found.' });
            return;
        }
        patient.is_archived = false;
        patient.archive_reason = '';
        // Re-evaluate status
        const [fpeCount, consultCount] = await Promise.all([
            FpeRecord_js_1.FpeRecord.countDocuments({ patient_id: patient._id, status: 'Completed' }),
            Consultation_js_1.Consultation.countDocuments({ patient_id: patient._id, status: 'Completed' }),
        ]);
        patient.patient_status = (0, statusClassifier_js_1.classifyPatientStatus)({
            is_archived: false,
            has_philhealth: Boolean(patient.philhealth_number),
            date_registered: patient.date_registered || null,
            has_fpe: fpeCount > 0,
            fpe_completed: fpeCount > 0,
            has_consultation: consultCount > 0,
            consultation_completed: consultCount > 0,
            has_pending_follow_up: false,
        });
        await patient.save();
        await (0, auditLogger_js_1.logActivity)(req.user, 'UNARCHIVE_PATIENT', 'Patient', patient._id.toString(), { name: patient.complete_name }, req);
        res.json({ success: true, message: 'Patient restored successfully.', patient });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.unarchivePatient = unarchivePatient;
const deletePatient = async (req, res) => {
    try {
        const { id } = req.params;
        const patient = await Patient_js_1.Patient.findById(id);
        if (!patient) {
            res.status(404).json({ success: false, message: 'Patient not found.' });
            return;
        }
        // Cascade delete related records
        await Promise.all([
            FpeRecord_js_1.FpeRecord.deleteMany({ patient_id: patient._id }),
            Consultation_js_1.Consultation.deleteMany({ patient_id: patient._id }),
            LaboratoryRecord_js_1.LaboratoryRecord.deleteMany({ patient_id: patient._id }),
            MedicationRecord_js_1.MedicationRecord.deleteMany({ patient_id: patient._id }),
            FollowUpRecord_js_1.FollowUpRecord.deleteMany({ patient_id: patient._id }),
            patient.deleteOne(),
        ]);
        await (0, auditLogger_js_1.logActivity)(req.user, 'DELETE_PATIENT', 'Patient', patient._id.toString(), { patient_id: patient.patient_id, name: patient.complete_name }, req);
        res.json({ success: true, message: 'Patient and all associated clinical records permanently deleted.' });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.deletePatient = deletePatient;
