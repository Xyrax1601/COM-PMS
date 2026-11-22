import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Patient } from '../../types';
import api from '../../api/client';

interface FpeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  patient: Patient;
}

export const FpeModal: React.FC<FpeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  patient,
}) => {
  const [fpeDate, setFpeDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'Completed' | 'Pending'>('Completed');
  const [bp, setBp] = useState('');
  const [hr, setHr] = useState('');
  const [rr, setRr] = useState('');
  const [temp, setTemp] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fpeDate) {
      setError('FPE date is required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/fpe', {
        patient_id: patient._id,
        fpe_date: fpeDate,
        status,
        vital_signs: {
          blood_pressure: bp,
          heart_rate: hr ? Number(hr) : null,
          respiratory_rate: rr ? Number(rr) : null,
          temperature: temp ? Number(temp) : null,
          weight_kg: weight ? Number(weight) : null,
          height_cm: height ? Number(height) : null,
        },
        notes,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to record First Patient Encounter.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record First Patient Encounter (FPE)"
      subtitle={`Patient: ${patient.complete_name} (${patient.patient_id})`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 text-xs rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              FPE Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={fpeDate}
              onChange={(e) => setFpeDate(e.target.value)}
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
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>

        {/* Vital Signs */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
            Vital Signs Assessment
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">BP (mmHg)</label>
              <input
                type="text"
                placeholder="120/80"
                value={bp}
                onChange={(e) => setBp(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Heart Rate (bpm)</label>
              <input
                type="number"
                placeholder="72"
                value={hr}
                onChange={(e) => setHr(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Temp (°C)</label>
              <input
                type="number"
                step="0.1"
                placeholder="36.5"
                value={temp}
                onChange={(e) => setTemp(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs font-mono"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Notes</label>
          <textarea
            rows={2}
            placeholder="Clinical notes, intake observations, complaints..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-mongo-forest focus:outline-none"
          ></textarea>
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
            Save FPE Record
          </button>
        </div>
      </form>
    </Modal>
  );
};
