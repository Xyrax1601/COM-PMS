import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { Patient } from '../models/Patient.js';
import { FpeRecord } from '../models/FpeRecord.js';
import { Consultation } from '../models/Consultation.js';
import { LaboratoryRecord } from '../models/LaboratoryRecord.js';
import { MedicationRecord } from '../models/MedicationRecord.js';
import { FollowUpRecord } from '../models/FollowUpRecord.js';
import { User } from '../models/User.js';

async function main() {
  try {
    console.log('[Verify] Connecting to DB...');
    await connectDB();

    const patientCount = await Patient.countDocuments();
    const fpeCount = await FpeRecord.countDocuments();
    const consultCount = await Consultation.countDocuments();
    const labCount = await LaboratoryRecord.countDocuments();
    const medCount = await MedicationRecord.countDocuments();
    const followUpCount = await FollowUpRecord.countDocuments();
    const userCount = await User.countDocuments();

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
    const buckets = await Patient.aggregate([
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
    const sample = await Patient.find({}).sort({ patient_id: 1 }).limit(3);
    console.log('SAMPLE FIRST 3 PATIENTS:');
    for (const p of sample) {
      console.log(`  ${p.patient_id} | ${p.complete_name} | PH: ${p.philhealth_number || 'NONE'} | Status: ${p.patient_status}`);
    }

    const last = await Patient.find({}).sort({ patient_id: -1 }).limit(3);
    console.log('SAMPLE LAST 3 PATIENTS:');
    for (const p of last) {
      console.log(`  ${p.patient_id} | ${p.complete_name} | PH: ${p.philhealth_number || 'NONE'} | Status: ${p.patient_status}`);
    }

    await mongoose.disconnect();
    console.log('[Verify] Done! Disconnected.');
    process.exit(0);
  } catch (err) {
    console.error('Verify error:', err);
    process.exit(1);
  }
}

main();
