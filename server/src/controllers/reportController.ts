import { Request, Response } from 'express';
import * as XLSX from 'xlsx';
import { Patient } from '../models/Patient.js';
import { FpeRecord } from '../models/FpeRecord.js';
import { Consultation } from '../models/Consultation.js';
import { FollowUpRecord } from '../models/FollowUpRecord.js';

export const getReportData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { reportType = 'monthly_registration', startDate, endDate, year } = req.query;

    const dateQuery: any = {};
    if (startDate || endDate) {
      if (startDate) dateQuery.$gte = new Date(String(startDate));
      if (endDate) dateQuery.$lte = new Date(String(endDate));
    } else if (year && year !== 'All') {
      const y = parseInt(String(year), 10);
      dateQuery.$gte = new Date(y, 0, 1);
      dateQuery.$lte = new Date(y, 11, 31, 23, 59, 59, 999);
    }

    let reportTitle = '';
    let rows: any[] = [];
    let summary: Record<string, any> = {};

    switch (reportType) {
      case 'daily_registration': {
        reportTitle = 'Daily Patient Registration Report';
        const q: any = { is_archived: false };
        if (Object.keys(dateQuery).length > 0) q.date_registered = dateQuery;
        const patients = await Patient.find(q).sort({ date_registered: -1 });
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
        const q: any = {};
        if (Object.keys(dateQuery).length > 0) q.fpe_date = dateQuery;
        const fpeList = await FpeRecord.find(q).populate('patient_id').sort({ fpe_date: -1 });
        rows = fpeList.map((f: any) => ({
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
        const q: any = {};
        if (Object.keys(dateQuery).length > 0) q.consultation_date = dateQuery;
        const consults = await Consultation.find(q).populate('patient_id').sort({ consultation_date: -1 });
        rows = consults.map((c: any) => ({
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
        const patients = await Patient.find({
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
        const patients = await Patient.find({ is_archived: false }).sort({ complete_name: 1 });
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
        const followUps = await FollowUpRecord.find().populate('patient_id').sort({ scheduled_date: 1 });
        rows = followUps.map((f: any) => ({
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
          Patient.countDocuments({ is_archived: false }),
          FpeRecord.countDocuments({ status: 'Completed' }),
          Consultation.countDocuments({ status: 'Completed' }),
          Patient.countDocuments({ is_archived: false, patient_status: 'Registered but No FPE' }),
          Patient.countDocuments({ is_archived: false, patient_status: 'Completed FPE but No Consultation' }),
          Patient.countDocuments({ is_archived: false, patient_status: 'Completed FPE but Not Registered' }),
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
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const exportReportExcel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { reportType = 'monthly_registration' } = req.query;

    // Fetch report data
    const mockReq = { query: req.query } as Request;
    let reportPayload: any = null;
    const mockRes: any = {
      json: (data: any) => {
        reportPayload = data;
      },
      status: () => mockRes,
    };

    await getReportData(mockReq, mockRes);

    if (!reportPayload || !reportPayload.rows) {
      res.status(500).json({ success: false, message: 'Failed to generate report export.' });
      return;
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(reportPayload.rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Report Data');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="COM-PMS-${reportType}-${Date.now()}.xlsx"`
    );
    res.send(buffer);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
