"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const mongoose_1 = __importDefault(require("mongoose"));
const db_js_1 = require("../config/db.js");
const Patient_js_1 = require("../models/Patient.js");
const FpeRecord_js_1 = require("../models/FpeRecord.js");
const Consultation_js_1 = require("../models/Consultation.js");
const LaboratoryRecord_js_1 = require("../models/LaboratoryRecord.js");
const MedicationRecord_js_1 = require("../models/MedicationRecord.js");
const FollowUpRecord_js_1 = require("../models/FollowUpRecord.js");
const User_js_1 = require("../models/User.js");
async function main() {
    try {
        console.log('[Verify] Connecting to DB...');
        await (0, db_js_1.connectDB)();
        const patientCount = await Patient_js_1.Patient.countDocuments();
        const fpeCount = await FpeRecord_js_1.FpeRecord.countDocuments();
        const consultCount = await Consultation_js_1.Consultation.countDocuments();
        const labCount = await LaboratoryRecord_js_1.LaboratoryRecord.countDocuments();
        const medCount = await MedicationRecord_js_1.MedicationRecord.countDocuments();
        const followUpCount = await FollowUpRecord_js_1.FollowUpRecord.countDocuments();
        const userCount = await User_js_1.User.countDocuments();
        console.log('============================================');
        console.log(`TOTAL PATIENTS:         ${patientCount}`);
        console.log(`TOTAL FPE RECORDS:      ${fpeCount}`);
        console.log(`TOTAL CONSULTATIONS:    ${consultCount}`);
        console.log(`TOTAL LAB RECORDS:      ${labCount}`);
        console.log(`TOTAL MEDICATION RECS:  ${medCount}`);
        console.log(`TOTAL FOLLOW-UP RECS:   ${followUpCount}`);
        console.log(`TOTAL SYSTEM USERS:     ${userCount}`);
        console.log('============================================');
        // Aggregate monitoring buckets
        const buckets = await Patient_js_1.Patient.aggregate([
            {
                $group: {
                    _id: '$patient_status',
                    count: { $sum: 1 },
                },
            },
        ]);
        console.log('PATIENT MONITORING BREAKDOWN:');
        let sum = 0;
        for (const b of buckets) {
            console.log(`  - ${b._id || 'Unknown'}: ${b.count}`);
            sum += b.count;
        }
        console.log(`  SUM OF BUCKETS: ${sum}`);
        console.log('============================================');
        // Sample first 3 and last 3 patients
        const sample = await Patient_js_1.Patient.find({}).sort({ patient_id: 1 }).limit(3);
        console.log('SAMPLE FIRST 3 PATIENTS:');
        for (const p of sample) {
            console.log(`  ${p.patient_id} | ${p.complete_name} | PH: ${p.philhealth_number || 'NONE'} | Status: ${p.patient_status}`);
        }
        const last = await Patient_js_1.Patient.find({}).sort({ patient_id: -1 }).limit(3);
        console.log('SAMPLE LAST 3 PATIENTS:');
        for (const p of last) {
            console.log(`  ${p.patient_id} | ${p.complete_name} | PH: ${p.philhealth_number || 'NONE'} | Status: ${p.patient_status}`);
        }
        await mongoose_1.default.disconnect();
        console.log('[Verify] Done! Disconnected.');
        process.exit(0);
    }
    catch (err) {
        console.error('Verify error:', err);
        process.exit(1);
    }
}
main();
