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
exports.exportWorkbookExcel = exports.commitImport = exports.previewExcel = void 0;
const XLSX = __importStar(require("xlsx"));
const excelParser_js_1 = require("../utils/excelParser.js");
const Patient_js_1 = require("../models/Patient.js");
const FpeRecord_js_1 = require("../models/FpeRecord.js");
const Consultation_js_1 = require("../models/Consultation.js");
const LaboratoryRecord_js_1 = require("../models/LaboratoryRecord.js");
const MedicationRecord_js_1 = require("../models/MedicationRecord.js");
const FollowUpRecord_js_1 = require("../models/FollowUpRecord.js");
const statusClassifier_js_1 = require("../utils/statusClassifier.js");
const auditLogger_js_1 = require("../middleware/auditLogger.js");
const previewExcel = async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ success: false, message: 'No Excel file was uploaded.' });
            return;
        }
        const { sheetsParsed, unifiedPatients, summaryStats } = (0, excelParser_js_1.parseExcelWorkbook)(req.file.buffer);
        // Cross-check potential duplicates against DB
        const existingPatients = await Patient_js_1.Patient.find({ is_archived: false }).select('complete_name philhealth_number patient_id');
        const previewRows = unifiedPatients.map((row, index) => {
            const match = existingPatients.find((p) => (p.philhealth_number && row.philhealth_number && p.philhealth_number === row.philhealth_number) ||
                p.complete_name.replace(/[^A-Z]/g, '') === row.complete_name.replace(/[^A-Z]/g, ''));
            return {
                id: `temp-${index + 1}`,
                complete_name: row.complete_name,
                philhealth_number: row.philhealth_number,
                date_registered: row.date_registered ? row.date_registered.toISOString().split('T')[0] : '',
                birthday: row.birthday ? row.birthday.toISOString().split('T')[0] : '',
                age: row.age,
                sex: row.sex,
                address: row.address,
                contact_number: row.contact_number,
                date_fpe: row.date_fpe ? row.date_fpe.toISOString().split('T')[0] : '',
                date_consultation: row.date_consultation ? row.date_consultation.toISOString().split('T')[0] : '',
                consultation_status: row.consultation_status,
                laboratory_tests: row.laboratory_tests,
                medicines: row.medicines,
                remarks: row.remarks,
                date_follow_up: row.date_follow_up ? row.date_follow_up.toISOString().split('T')[0] : '',
                is_duplicate: Boolean(match),
                duplicate_with: match ? `${match.patient_id} - ${match.complete_name}` : null,
            };
        });
        const sheetsSummary = Object.entries(sheetsParsed).map(([name, rows]) => ({
            name,
            rowCount: rows.length,
        }));
        res.json({
            success: true,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            sheets: sheetsSummary,
            totalUnifiedRows: previewRows.length,
            duplicateCount: previewRows.filter((r) => r.is_duplicate).length,
            rows: previewRows,
        });
    }
    catch (err) {
        console.error('previewExcel error:', err);
        res.status(500).json({ success: false, message: 'Failed to process Excel file: ' + err.message });
    }
};
exports.previewExcel = previewExcel;
const commitImport = async (req, res) => {
    try {
        const { rows, skipDuplicates = true } = req.body;
        if (!Array.isArray(rows) || rows.length === 0) {
            res.status(400).json({ success: false, message: 'No records provided for import.' });
            return;
        }
        const year = new Date().getFullYear();
        let currentCount = await Patient_js_1.Patient.countDocuments();
        let insertedCount = 0;
        let skippedCount = 0;
        for (const item of rows) {
            const cleanName = (0, excelParser_js_1.normalizeName)(item.complete_name);
            const cleanPh = (0, excelParser_js_1.normalizePhilHealthNumber)(item.philhealth_number);
            if (!cleanName && !cleanPh) {
                skippedCount++;
                continue;
            }
            // Check if duplicate exists
            if (skipDuplicates) {
                const existing = await Patient_js_1.Patient.findOne({
                    $or: [
                        ...(cleanPh ? [{ philhealth_number: cleanPh }] : []),
                        { complete_name: cleanName },
                    ],
                });
                if (existing) {
                    skippedCount++;
                    continue;
                }
            }
            currentCount++;
            const patient_id = `COM-${year}-${String(currentCount).padStart(5, '0')}`;
            const regDate = item.date_registered ? new Date(item.date_registered) : null;
            const bday = item.birthday ? new Date(item.birthday) : null;
            let age = item.age !== undefined && item.age !== '' ? Number(item.age) : null;
            if (age === null && bday) {
                age = (0, excelParser_js_1.calculateAgeFromBirthday)(bday);
            }
            const fpeDate = item.date_fpe ? new Date(item.date_fpe) : null;
            const consultDate = item.date_consultation ? new Date(item.date_consultation) : null;
            const followUpDate = item.date_follow_up ? new Date(item.date_follow_up) : null;
            const hasPhilhealth = Boolean(cleanPh);
            const hasFpe = Boolean(fpeDate);
            const hasConsult = Boolean(consultDate || (item.consultation_status && item.consultation_status !== 'No Consultation'));
            const consultCompleted = Boolean(consultDate && item.consultation_status === 'Completed');
            const status = (0, statusClassifier_js_1.classifyPatientStatus)({
                is_archived: false,
                has_philhealth: hasPhilhealth,
                date_registered: regDate,
                has_fpe: hasFpe,
                fpe_completed: hasFpe,
                has_consultation: hasConsult,
                consultation_completed: consultCompleted,
                has_pending_follow_up: Boolean(followUpDate),
            });
            const patient = await Patient_js_1.Patient.create({
                patient_id,
                complete_name: cleanName,
                philhealth_number: cleanPh,
                date_registered: regDate || (hasFpe ? fpeDate : new Date()),
                birthday: bday,
                age,
                sex: item.sex || '',
                address: item.address || '',
                contact_number: (0, excelParser_js_1.normalizeContactNumber)(item.contact_number),
                patient_status: status,
                is_archived: false,
                historical_notes: item.remarks ? `Import Note: ${item.remarks}` : '',
                created_by: req.user?.userId,
            });
            // Insert FPE record if exists
            if (fpeDate) {
                await FpeRecord_js_1.FpeRecord.create({
                    patient_id: patient._id,
                    fpe_date: fpeDate,
                    status: 'Completed',
                    notes: item.remarks || '',
                });
            }
            // Insert Consultation if exists
            let consultDoc = null;
            if (consultDate || item.consultation_status) {
                consultDoc = await Consultation_js_1.Consultation.create({
                    patient_id: patient._id,
                    consultation_date: consultDate || fpeDate || new Date(),
                    attending_physician: 'COM Health Service Clinic',
                    status: item.consultation_status || 'Completed',
                    clinical_remarks: item.remarks || '',
                    recommendations: followUpDate ? `Follow-up scheduled on ${followUpDate.toISOString().split('T')[0]}` : '',
                    follow_up_date: followUpDate,
                });
            }
            // Insert Labs
            if (Array.isArray(item.laboratory_tests)) {
                for (const test of item.laboratory_tests) {
                    if (!test)
                        continue;
                    await LaboratoryRecord_js_1.LaboratoryRecord.create({
                        patient_id: patient._id,
                        consultation_id: consultDoc?._id,
                        test_name: String(test).toUpperCase().trim(),
                        request_date: consultDate || fpeDate || new Date(),
                        status: 'Pending',
                    });
                }
            }
            // Insert Medications
            if (Array.isArray(item.medicines)) {
                for (const med of item.medicines) {
                    if (!med)
                        continue;
                    await MedicationRecord_js_1.MedicationRecord.create({
                        patient_id: patient._id,
                        consultation_id: consultDoc?._id,
                        medicine_name: String(med).toUpperCase().trim(),
                        date_recorded: consultDate || fpeDate || new Date(),
                        remarks: 'Recorded from batch Excel import',
                    });
                }
            }
            // Insert Follow-up
            if (followUpDate) {
                await FollowUpRecord_js_1.FollowUpRecord.create({
                    patient_id: patient._id,
                    consultation_id: consultDoc?._id,
                    scheduled_date: followUpDate,
                    status: followUpDate < new Date() ? 'Overdue' : 'Upcoming',
                    clinical_reason: item.remarks || 'Follow-up check',
                });
            }
            insertedCount++;
        }
        await (0, auditLogger_js_1.logActivity)(req.user, 'EXCEL_IMPORT_COMMITTED', 'System', '', { insertedCount, skippedCount, totalProcessed: rows.length }, req);
        res.json({
            success: true,
            message: `Successfully imported ${insertedCount} patient records. ${skippedCount} duplicate/empty records were skipped.`,
            insertedCount,
            skippedCount,
        });
    }
    catch (err) {
        console.error('commitImport error:', err);
        res.status(500).json({ success: false, message: 'Import commit failed: ' + err.message });
    }
};
exports.commitImport = commitImport;
const exportWorkbookExcel = async (req, res) => {
    try {
        const [allPatients, fpeList, consultList] = await Promise.all([
            Patient_js_1.Patient.find({ is_archived: false }).sort({ patient_id: 1 }),
            FpeRecord_js_1.FpeRecord.find().populate('patient_id'),
            Consultation_js_1.Consultation.find().populate('patient_id'),
        ]);
        const wb = XLSX.utils.book_new();
        // Sheet 1: Master Patients
        const masterData = allPatients.map((p) => ({
            'PATIENT ID': p.patient_id,
            'DATE REGISTERED': p.date_registered ? p.date_registered.toISOString().split('T')[0] : '',
            'PHILHEALTH NUMBER': p.philhealth_number || '',
            'COMPLETE NAME': p.complete_name,
            'AGE': p.age || '',
            'SEX': p.sex || '',
            'ADDRESS': p.address || '',
            'BIRTHDAY': p.birthday ? p.birthday.toISOString().split('T')[0] : '',
            'CONTACT NUMBER': p.contact_number || '',
            'STATUS': p.patient_status,
        }));
        const wsMaster = XLSX.utils.json_to_sheet(masterData);
        XLSX.utils.book_append_sheet(wb, wsMaster, 'All Patients');
        // Sheet 2: FPE and Consultation
        const completedFpeAndConsult = allPatients
            .filter((p) => p.patient_status === 'Registered and Completed FPE and Consultation')
            .map((p) => ({
            'DATE REGISTERED': p.date_registered ? p.date_registered.toISOString().split('T')[0] : '',
            'PHILHEALTH NUMBER': p.philhealth_number || '',
            'COMPLETE NAME': p.complete_name,
            'AGE': p.age || '',
            'SEX': p.sex || '',
            'ADDRESS': p.address || '',
            'BIRTHDAY': p.birthday ? p.birthday.toISOString().split('T')[0] : '',
            'CONTACT NUMBER': p.contact_number || '',
        }));
        const wsFpeConsult = XLSX.utils.json_to_sheet(completedFpeAndConsult);
        XLSX.utils.book_append_sheet(wb, wsFpeConsult, 'FPE and Consultation');
        // Sheet 3: Registered but NO FPE & Consult
        const regNoFpe = allPatients
            .filter((p) => p.patient_status === 'Registered but No FPE')
            .map((p) => ({
            'DATE REGISTERED': p.date_registered ? p.date_registered.toISOString().split('T')[0] : '',
            'PHILHEALTH NUMBER': p.philhealth_number || '',
            'COMPLETE NAME': p.complete_name,
            'AGE': p.age || '',
            'SEX': p.sex || '',
            'ADDRESS': p.address || '',
            'BIRTHDAY': p.birthday ? p.birthday.toISOString().split('T')[0] : '',
            'CONTACT NUMBER': p.contact_number || '',
        }));
        const wsRegNoFpe = XLSX.utils.json_to_sheet(regNoFpe);
        XLSX.utils.book_append_sheet(wb, wsRegNoFpe, 'Registered but NO FPE');
        // Sheet 4: FPE but no Consultation
        const fpeNoConsult = allPatients
            .filter((p) => p.patient_status === 'Completed FPE but No Consultation')
            .map((p) => ({
            'DATE REGISTERED': p.date_registered ? p.date_registered.toISOString().split('T')[0] : '',
            'PHILHEALTH NUMBER': p.philhealth_number || '',
            'COMPLETE NAME': p.complete_name,
            'AGE': p.age || '',
            'SEX': p.sex || '',
            'ADDRESS': p.address || '',
            'BIRTHDAY': p.birthday ? p.birthday.toISOString().split('T')[0] : '',
            'CONTACT NUMBER': p.contact_number || '',
        }));
        const wsFpeNoConsult = XLSX.utils.json_to_sheet(fpeNoConsult);
        XLSX.utils.book_append_sheet(wb, wsFpeNoConsult, 'FPE but no Consultation');
        // Sheet 5: FPE BUT NOT REGISTERED
        const fpeNotReg = allPatients
            .filter((p) => p.patient_status === 'Completed FPE but Not Registered')
            .map((p) => ({
            'DATE REGISTERED': p.date_registered ? p.date_registered.toISOString().split('T')[0] : '',
            'PHILHEALTH NUMBER': p.philhealth_number || '',
            'COMPLETE NAME': p.complete_name,
            'AGE': p.age || '',
            'SEX': p.sex || '',
            'ADDRESS': p.address || '',
            'BIRTHDAY': p.birthday ? p.birthday.toISOString().split('T')[0] : '',
            'CONTACT NUMBER': p.contact_number || '',
        }));
        const wsFpeNotReg = XLSX.utils.json_to_sheet(fpeNotReg);
        XLSX.utils.book_append_sheet(wb, wsFpeNotReg, 'FPE BUT NOT REGISTERED');
        // Sheet 6: FPE and Consultation but not registered
        const fpeConsultNotReg = allPatients
            .filter((p) => p.patient_status === 'FPE and Consultation but not registered')
            .map((p) => ({
            'DATE REGISTERED': p.date_registered ? p.date_registered.toISOString().split('T')[0] : '',
            'PHILHEALTH NUMBER': p.philhealth_number || '',
            'COMPLETE NAME': p.complete_name,
            'AGE': p.age || '',
            'SEX': p.sex || '',
            'ADDRESS': p.address || '',
            'BIRTHDAY': p.birthday ? p.birthday.toISOString().split('T')[0] : '',
            'CONTACT NUMBER': p.contact_number || '',
        }));
        if (fpeConsultNotReg.length > 0) {
            const wsFpeConsultNotReg = XLSX.utils.json_to_sheet(fpeConsultNotReg);
            XLSX.utils.book_append_sheet(wb, wsFpeConsultNotReg, 'FPE & Consult Not Registered');
        }
        // Sheet 7: Dynamic SUMMARY
        const summaryData = [
            {
                Category: 'Total Registered Patients',
                Count: allPatients.filter((p) => p.date_registered !== null).length,
            },
            {
                Category: 'Total Completed FPE',
                Count: fpeList.filter((f) => f.status === 'Completed').length,
            },
            {
                Category: 'Total Completed Consultations',
                Count: consultList.filter((c) => c.status === 'Completed').length,
            },
            {
                Category: 'Registered but No FPE',
                Count: regNoFpe.length,
            },
            {
                Category: 'FPE but Not Proceed in Consultation',
                Count: fpeNoConsult.length,
            },
            {
                Category: 'Not Registered but Proceed FPE',
                Count: fpeNotReg.length,
            },
            {
                Category: 'FPE & Consultation but Not Registered',
                Count: fpeConsultNotReg.length,
            },
        ];
        const wsSummary = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, wsSummary, 'SUMMARY');
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="COM-PMS-DATABASE-EXPORT-${Date.now()}.xlsx"`);
        res.send(buffer);
    }
    catch (err) {
        console.error('exportWorkbookExcel error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.exportWorkbookExcel = exportWorkbookExcel;
