"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = seedDatabase;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const User_js_1 = require("../models/User.js");
const Patient_js_1 = require("../models/Patient.js");
const FpeRecord_js_1 = require("../models/FpeRecord.js");
const Consultation_js_1 = require("../models/Consultation.js");
const LaboratoryRecord_js_1 = require("../models/LaboratoryRecord.js");
const MedicationRecord_js_1 = require("../models/MedicationRecord.js");
const FollowUpRecord_js_1 = require("../models/FollowUpRecord.js");
const ActivityLog_js_1 = require("../models/ActivityLog.js");
const excelParser_js_1 = require("./excelParser.js");
const statusClassifier_js_1 = require("./statusClassifier.js");
async function seedDatabase(forceClean = false) {
    console.log('[Seed] Checking database seeding state...');
    // 1. Seed standard role users
    const defaultUsers = [
        {
            name: 'System Administrator',
            email: 'admin@compms.edu',
            password: 'Admin@123',
            role: 'admin',
        },
        {
            name: 'Dr. Maria Santos, MD',
            email: 'medical@compms.edu',
            password: 'Medical@123',
            role: 'medical',
        },
        {
            name: 'John Reyes (Registration)',
            email: 'registration@compms.edu',
            password: 'Reg@123',
            role: 'registration',
        },
        {
            name: 'Elena Cruz (Auditor & Reports)',
            email: 'viewer@compms.edu',
            password: 'Viewer@123',
            role: 'viewer',
        },
    ];
    for (const u of defaultUsers) {
        const existing = await User_js_1.User.findOne({ email: u.email });
        if (!existing) {
            const hashedPassword = await bcryptjs_1.default.hash(u.password, 10);
            await User_js_1.User.create({
                name: u.name,
                email: u.email,
                password: hashedPassword,
                role: u.role,
                status: 'active',
            });
            console.log(`[Seed] Created default user: ${u.email} (${u.role})`);
        }
    }
    // Check if patients are already populated
    const existingPatientCount = await Patient_js_1.Patient.countDocuments();
    if (existingPatientCount === 91 && !forceClean) {
        console.log(`[Seed] Database already contains ${existingPatientCount} patients. Skipping re-seed.`);
        return;
    }
    if (existingPatientCount > 0 && existingPatientCount !== 91) {
        console.log(`[Seed] Database contains ${existingPatientCount} patients (expected 91: 90 from Sheet 1 + 1 unregistered). Triggering clean re-seed...`);
        forceClean = true;
    }
    if (forceClean) {
        console.log('[Seed] Force clean enabled: wiping collections for fresh seed...');
        await Patient_js_1.Patient.deleteMany({});
        await FpeRecord_js_1.FpeRecord.deleteMany({});
        await Consultation_js_1.Consultation.deleteMany({});
        await LaboratoryRecord_js_1.LaboratoryRecord.deleteMany({});
        await MedicationRecord_js_1.MedicationRecord.deleteMany({});
        await FollowUpRecord_js_1.FollowUpRecord.deleteMany({});
    }
    // 2. Parse Excel workbook
    const excelCandidates = [
        path_1.default.resolve(process.cwd(), 'PROFILE DATA 2026.xlsx'),
        path_1.default.resolve(process.cwd(), '../PROFILE DATA 2026.xlsx'),
        'c:\\Users\\jcmal\\Desktop\\ProjectCOM_PMS\\PROFILE DATA 2026.xlsx',
    ];
    let excelPath = '';
    for (const p of excelCandidates) {
        if (fs_1.default.existsSync(p)) {
            excelPath = p;
            break;
        }
    }
    if (!excelPath) {
        console.warn('[Seed] PROFILE DATA 2026.xlsx not found in working path. Skipping initial Excel hydration.');
        return;
    }
    console.log(`[Seed] Loading initial workbook from: ${excelPath}`);
    const fileBuffer = fs_1.default.readFileSync(excelPath);
    const { unifiedPatients } = (0, excelParser_js_1.parseExcelWorkbook)(fileBuffer, true); // Sheet1 only → exactly 90 patients
    console.log(`[Seed] Found ${unifiedPatients.length} unified patient records from workbook.`);
    let counter = 1;
    const adminUser = await User_js_1.User.findOne({ role: 'admin' });
    const adminId = adminUser?._id;
    for (const row of unifiedPatients) {
        const patientCode = `COM-2026-${String(counter).padStart(5, '0')}`;
        counter++;
        // Determine lifecycle info
        const hasPhilhealth = Boolean(row.philhealth_number && row.philhealth_number.trim() !== '');
        const hasFpe = Boolean(row.date_fpe);
        const fpeCompleted = hasFpe;
        const hasConsultation = Boolean(row.date_consultation || (row.consultation_status && row.consultation_status !== 'No Consultation'));
        const consultCompleted = Boolean(row.date_consultation && row.consultation_status === 'Completed');
        const calculatedStatus = (0, statusClassifier_js_1.classifyPatientStatus)({
            is_archived: false,
            has_philhealth: hasPhilhealth,
            date_registered: row.date_registered,
            has_fpe: hasFpe,
            fpe_completed: fpeCompleted,
            has_consultation: hasConsultation,
            consultation_completed: consultCompleted,
            has_pending_follow_up: Boolean(row.date_follow_up),
        });
        const patient = await Patient_js_1.Patient.create({
            patient_id: patientCode,
            complete_name: row.complete_name,
            philhealth_number: row.philhealth_number,
            date_registered: row.date_registered || (hasFpe ? row.date_fpe : null),
            birthday: row.birthday,
            age: row.age,
            sex: row.sex,
            address: row.address,
            contact_number: row.contact_number,
            patient_status: calculatedStatus,
            is_archived: false,
            historical_notes: row.remarks ? `Initial Import Note: ${row.remarks}` : '',
            created_by: adminId,
        });
        // 1. Create FpeRecord if FPE date exists
        if (row.date_fpe) {
            await FpeRecord_js_1.FpeRecord.create({
                patient_id: patient._id,
                fpe_date: row.date_fpe,
                status: 'Completed',
                notes: row.remarks || 'Initial FPE imported from workbook',
            });
        }
        // 2. Create Consultation if date or status exists
        let consultationDoc = null;
        if (row.date_consultation || row.consultation_status === 'No Consultation') {
            consultationDoc = await Consultation_js_1.Consultation.create({
                patient_id: patient._id,
                consultation_date: row.date_consultation || row.date_fpe || new Date('2026-04-30'),
                attending_physician: 'COM Health Service Clinic',
                status: row.consultation_status,
                clinical_remarks: row.remarks || '',
                recommendations: row.date_follow_up ? `Follow up on ${row.date_follow_up.toISOString().split('T')[0]}` : '',
                follow_up_date: row.date_follow_up,
            });
        }
        // 3. Create Laboratory records
        if (row.laboratory_tests && row.laboratory_tests.length > 0) {
            for (const testName of row.laboratory_tests) {
                await LaboratoryRecord_js_1.LaboratoryRecord.create({
                    patient_id: patient._id,
                    consultation_id: consultationDoc?._id,
                    test_name: testName,
                    request_date: row.date_consultation || row.date_fpe || new Date('2026-04-30'),
                    status: 'Pending',
                    remarks: 'Imported from initial patient consultation list',
                });
            }
        }
        // 4. Create Medication records
        if (row.medicines && row.medicines.length > 0) {
            for (const med of row.medicines) {
                await MedicationRecord_js_1.MedicationRecord.create({
                    patient_id: patient._id,
                    consultation_id: consultationDoc?._id,
                    medicine_name: med,
                    date_recorded: row.date_consultation || row.date_fpe || new Date('2026-04-30'),
                    remarks: 'Historical medication recorded during encounter',
                });
            }
        }
        // 5. Create Follow-up record
        if (row.date_follow_up) {
            const now = new Date();
            const isOverdue = row.date_follow_up < now;
            await FollowUpRecord_js_1.FollowUpRecord.create({
                patient_id: patient._id,
                consultation_id: consultationDoc?._id,
                scheduled_date: row.date_follow_up,
                status: isOverdue ? 'Overdue' : 'Upcoming',
                clinical_reason: row.remarks || 'Routine follow-up evaluation',
            });
        }
    }
    await ActivityLog_js_1.ActivityLog.create({
        user_name: 'System Seeder',
        action: 'INITIAL_HYDRATION',
        entity_type: 'System',
        details: {
            total_patients_seeded: unifiedPatients.length,
            file: 'PROFILE DATA 2026.xlsx',
        },
    });
    const totalPatients = await Patient_js_1.Patient.countDocuments();
    const totalFpe = await FpeRecord_js_1.FpeRecord.countDocuments();
    const totalConsultations = await Consultation_js_1.Consultation.countDocuments();
    const totalLabs = await LaboratoryRecord_js_1.LaboratoryRecord.countDocuments();
    const totalMeds = await MedicationRecord_js_1.MedicationRecord.countDocuments();
    const totalFollowUps = await FollowUpRecord_js_1.FollowUpRecord.countDocuments();
    console.log('----------------------------------------------------');
    console.log('[Seed] Database hydration completed successfully!');
    console.log(`- Total Patients:      ${totalPatients}`);
    console.log(`- Total FPE Records:   ${totalFpe}`);
    console.log(`- Total Consultations: ${totalConsultations}`);
    console.log(`- Total Lab Requests:  ${totalLabs}`);
    console.log(`- Total Medications:   ${totalMeds}`);
    console.log(`- Total Follow-Ups:    ${totalFollowUps}`);
    console.log('----------------------------------------------------');
}
