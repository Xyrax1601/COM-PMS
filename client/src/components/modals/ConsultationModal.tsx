import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Patient } from '../../types';
import api from '../../api/client';

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  patient: Patient;
}

export const ConsultationModal: React.FC<ConsultationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  patient,
}) => {
  const [consultationDate, setConsultationDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendingPhysician, setAttendingPhysician] = useState('COM Attending Physician');
  const [status, setStatus] = useState<'Completed' | 'Pending' | 'No Consultation' | 'Scheduled'>('Completed');
  const [clinicalRemarks, setClinicalRemarks] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultationDate) {
      setError('Consultation date is required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/consultations', {
        patient_id: patient._id,
        consultation_date: consultationDate,
        attending_physician: attendingPhysician,
        status,
        clinical_remarks: clinicalRemarks,
        recommendations,
        follow_up_date: followUpDate || null,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to record consultation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Patient Consultation"
      subtitle={`Patient: ${patient.complete_name} (${patient.patient_id})`}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 text-xs rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Consultation Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={consultationDate}
              onChange={(e) => setConsultationDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-mongo-forest focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-mongo-forest focus:outline-none"
            >
              <option value="Completed">Completed Consultation</option>
              <option value="No Consultation">No Consultation (Did Not Proceed)</option>
              <option value="Pending">Pending Evaluation</option>
              <option value="Scheduled">Scheduled Visit</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Attending Physician / Clinic Service
            </label>
            <input
              type="text"
              placeholder="e.g. Dr. Maria Santos, MD / COM Internal Medicine"
              value={attendingPhysician}
              onChange={(e) => setAttendingPhysician(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-mongo-forest focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Clinical Remarks & Diagnosis Notes
            </label>
            <textarea
              rows={3}
              placeholder="Recorded clinical findings, remarks (e.g. FOR IM CONSULT, FOR FF.UP CARDIOLOGIST)..."
              value={clinicalRemarks}
              onChange={(e) => setClinicalRemarks(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-mongo-forest focus:outline-none"
            ></textarea>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Medical Recommendations & Treatment Plan
            </label>
            <textarea
              rows={2}
              placeholder="Care management advice, diet, physical activity, referral advice..."
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-mongo-forest focus:outline-none"
            ></textarea>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Recommended Follow-up Date (Optional)
            </label>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-mongo-forest focus:outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Automatically creates a tracked appointment in the Follow-up Monitoring module.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-mongo-forest hover:bg-mongo-forestDark text-white text-xs font-semibold rounded-lg shadow transition flex items-center gap-1.5"
          >
            {loading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
            Save Consultation Record
          </button>
        </div>
      </form>
    </Modal>
  );
};
