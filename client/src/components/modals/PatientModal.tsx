import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { Patient, PatientStatus } from '../../types';
import { ManualStatusModal, ManualProcesses } from './ManualStatusModal';
import { SlidersHorizontal, CheckCircle2, RotateCcw } from 'lucide-react';
import api from '../../api/client';

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  patientToEdit?: Patient | null;
}

export const PatientModal: React.FC<PatientModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  patientToEdit,
}) => {
  const [completeName, setCompleteName] = useState('');
  const [philhealthNumber, setPhilhealthNumber] = useState('');
  const [dateRegistered, setDateRegistered] = useState('');
  const [birthday, setBirthday] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [sex, setSex] = useState<'M' | 'F' | 'Other' | ''>('');
  const [address, setAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [historicalNotes, setHistoricalNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Manual Status Checklist State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualProcesses, setManualProcesses] = useState<ManualProcesses | null>(null);
  const [appliedStatus, setAppliedStatus] = useState<PatientStatus | null>(null);

  useEffect(() => {
    if (patientToEdit) {
      setCompleteName(patientToEdit.complete_name || '');
      setPhilhealthNumber(patientToEdit.philhealth_number || '');
      setDateRegistered(patientToEdit.date_registered ? patientToEdit.date_registered.split('T')[0] : '');
      setBirthday(patientToEdit.birthday ? patientToEdit.birthday.split('T')[0] : '');
      setAge(patientToEdit.age ?? '');
      setSex(patientToEdit.sex || '');
      setAddress(patientToEdit.address || '');
      setContactNumber(patientToEdit.contact_number || '');
      setHistoricalNotes(patientToEdit.historical_notes || '');
      setAppliedStatus(patientToEdit.patient_status || null);
      setManualProcesses(null);
    } else {
      setCompleteName('');
      setPhilhealthNumber('');
      setDateRegistered(new Date().toISOString().split('T')[0]);
      setBirthday('');
      setAge('');
      setSex('');
      setAddress('');
      setContactNumber('');
      setHistoricalNotes('');
      setManualProcesses(null);
      setAppliedStatus(null);
    }
    setError('');
  }, [patientToEdit, isOpen]);

  // Auto calculate age when birthday changes
  const handleBirthdayChange = (val: string) => {
    setBirthday(val);
    if (val) {
      const bDate = new Date(val);
      const today = new Date();
      let calcAge = today.getFullYear() - bDate.getFullYear();
      const m = today.getMonth() - bDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < bDate.getDate())) {
        calcAge--;
      }
      if (calcAge >= 0) setAge(calcAge);
    }
  };

  const handleApplyManualStatus = (processes: ManualProcesses, status: PatientStatus) => {
    setManualProcesses(processes);
    setAppliedStatus(status);
  };

  const handleResetManualStatus = () => {
    setManualProcesses(null);
    setAppliedStatus(patientToEdit?.patient_status || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeName.trim()) {
      setError('Complete name is required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload: any = {
        complete_name: completeName,
        philhealth_number: philhealthNumber,
        date_registered: dateRegistered || null,
        birthday: birthday || null,
        age: age === '' ? null : Number(age),
        sex,
        address,
        contact_number: contactNumber,
        historical_notes: historicalNotes,
      };

      if (manualProcesses) {
        payload.manual_processes = manualProcesses;
      }

      if (patientToEdit) {
        await api.put(`/patients/${patientToEdit._id}`, payload);
      } else {
        await api.post('/patients', payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save patient profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={patientToEdit ? 'Edit Patient Document' : 'Register New Patient'}
        subtitle="College of Medicine Centralized Healthcare Registry"
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 text-xs rounded-lg">
              {error}
            </div>
          )}

          {/* Manually set Patient Status Control Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">Patient Lifecycle Status:</span>
                {appliedStatus ? (
                  <Badge status={appliedStatus} size="sm" />
                ) : (
                  <span className="text-xs text-slate-500 font-mono italic">
                    Automated (Derived from clinical documents)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {manualProcesses
                  ? 'Manual checklist override configured. Concluded status will take effect upon saving.'
                  : 'By default, the status is automatically concluded from linked clinical encounters.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {manualProcesses && (
                <button
                  type="button"
                  onClick={handleResetManualStatus}
                  title="Revert to automated status"
                  className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-medium flex items-center gap-1 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsManualModalOpen(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border shadow-sm transition ${
                  manualProcesses
                    ? 'bg-mongo-forest text-white border-transparent hover:bg-slate-800'
                    : 'bg-white border-slate-300 hover:border-mongo-forest text-slate-700 hover:text-mongo-forest'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-mongo-green" />
                <span>Manually set Patient Status</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Complete Name (LAST, FIRST MIDDLE) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. DELA CRUZ, JUAN PEDRO"
                value={completeName}
                onChange={(e) => setCompleteName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-mongo-forest focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                PhilHealth Number (12 digits)
              </label>
              <input
                type="text"
                placeholder="e.g. 15-025204404-5"
                value={philhealthNumber}
                onChange={(e) => setPhilhealthNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-mongo-forest focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date Registered
              </label>
              <input
                type="date"
                value={dateRegistered}
                onChange={(e) => setDateRegistered(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-mongo-forest focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Birthday
              </label>
              <input
                type="date"
                value={birthday}
                onChange={(e) => handleBirthdayChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-mongo-forest focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Age
                </label>
                <input
                  type="number"
                  min="0"
                  max="130"
                  value={age}
                  onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-mongo-forest focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sex
                </label>
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-mongo-forest focus:outline-none"
                >
                  <option value="">Select</option>
                  <option value="M">Male (M)</option>
                  <option value="F">Female (F)</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Number
              </label>
              <input
                type="text"
                placeholder="e.g. 09173168073"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-mongo-forest focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Address
              </label>
              <input
                type="text"
                placeholder="e.g. LAPASAN, CAGAYAN DE ORO CITY"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-mongo-forest focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Historical Notes / Clinical Remarks
              </label>
              <textarea
                rows={2}
                placeholder="Any clinical observations or notes..."
                value={historicalNotes}
                onChange={(e) => setHistoricalNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-mongo-forest focus:outline-none"
              ></textarea>
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
              {patientToEdit ? 'Save Changes' : 'Save Patient Record'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Manual Status Checklist Modal */}
      <ManualStatusModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onApply={handleApplyManualStatus}
        initialProcesses={
          manualProcesses || {
            has_philhealth: Boolean(philhealthNumber.trim()),
            fpe_completed: false,
            consultation_completed: false,
          }
        }
      />
    </>
  );
};
