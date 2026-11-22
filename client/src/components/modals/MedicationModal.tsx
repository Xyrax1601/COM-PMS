import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Patient } from '../../types';
import api from '../../api/client';

interface MedicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  patient: Patient;
}

export const MedicationModal: React.FC<MedicationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  patient,
}) => {
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [dateRecorded, setDateRecorded] = useState(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const commonMeds = [
    'PARACETAMOL',
    'BETAHISTINE',
    'LORATADINE',
    'AMLODIPINE',
    'LOSARTAN',
    'METFORMIN',
    'ATORVASTATIN',
    'SALBUTAMOL',
    'OMEPRAZOLE',
    'AMOXICILLIN',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicineName.trim()) {
      setError('Medicine name is required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/medications', {
        patient_id: patient._id,
        medicine_name: medicineName,
        dosage,
        frequency,
        date_recorded: dateRecorded,
        remarks,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to record medication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Medication Record"
      subtitle={`Patient: ${patient.complete_name} (${patient.patient_id})`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 text-xs rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Medicine / Generic Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. PARACETAMOL, BETAHISTINE"
            value={medicineName}
            onChange={(e) => setMedicineName(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-mongo-forest focus:outline-none"
          />

          <div className="flex flex-wrap gap-1.5 mt-2">
            {commonMeds.map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => setMedicineName(m)}
                className="px-2 py-0.5 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 transition"
              >
                +{m}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Dosage</label>
            <input
              type="text"
              placeholder="e.g. 500mg, 10mg"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-mongo-forest focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Frequency</label>
            <input
              type="text"
              placeholder="e.g. Once daily, TID"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-mongo-forest focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Date Recorded</label>
          <input
            type="date"
            value={dateRecorded}
            onChange={(e) => setDateRecorded(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-mongo-forest focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks</label>
          <input
            type="text"
            placeholder="Duration, dispensing notes, instructions..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-mongo-forest focus:outline-none"
          />
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
            Save Medication
          </button>
        </div>
      </form>
    </Modal>
  );
};
