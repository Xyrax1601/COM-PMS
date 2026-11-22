import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Patient, LaboratoryRecord } from '../../types';
import api from '../../api/client';

interface LabModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  patient?: Patient | null;
  recordToEdit?: LaboratoryRecord | null;
}

export const LabModal: React.FC<LabModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  patient,
  recordToEdit,
}) => {
  const [testName, setTestName] = useState('');
  const [requestDate, setRequestDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<
    'Pending' | 'Sample Collected' | 'Processing' | 'Completed' | 'Cancelled'
  >('Pending');
  const [resultSummary, setResultSummary] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const commonTests = [
    'FBS',
    'CBC',
    'LIPID PROFILE',
    'URINALYSIS',
    'ECG',
    'CHEST XRAY',
    'CREA',
    'HBA1C',
    'FECALYSIS',
    'SGPT/ALT',
    'PAP SMEAR',
  ];

  useEffect(() => {
    if (recordToEdit) {
      setTestName(recordToEdit.test_name || '');
      setRequestDate(recordToEdit.request_date ? recordToEdit.request_date.split('T')[0] : '');
      setStatus(recordToEdit.status || 'Pending');
      setResultSummary(recordToEdit.result_summary || '');
      setAttachmentUrl(recordToEdit.attachment_url || '');
      setRemarks(recordToEdit.remarks || '');
    } else {
      setTestName('');
      setRequestDate(new Date().toISOString().split('T')[0]);
      setStatus('Pending');
      setResultSummary('');
      setAttachmentUrl('');
      setRemarks('');
    }
    setError('');
  }, [recordToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testName.trim()) {
      setError('Test name is required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (recordToEdit) {
        await api.put(`/laboratories/${recordToEdit._id}`, {
          status,
          result_summary: resultSummary,
          attachment_url: attachmentUrl,
          remarks,
        });
      } else {
        if (!patient) {
          setError('Patient reference is missing.');
          setLoading(false);
          return;
        }
        await api.post('/laboratories', {
          patient_id: patient._id,
          test_name: testName,
          request_date: requestDate,
          status,
          remarks,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save laboratory record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={recordToEdit ? 'Update Laboratory Result / Status' : 'Add Laboratory Request'}
      subtitle={patient ? `Patient: ${patient.complete_name} (${patient.patient_id})` : undefined}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 text-xs rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Laboratory Test Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            disabled={Boolean(recordToEdit)}
            placeholder="e.g. FBS, LIPID PROFILE, CBC"
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-mongo-forest focus:outline-none"
          />

          {!recordToEdit && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {commonTests.map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setTestName(t)}
                  className="px-2 py-0.5 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 transition"
                >
                  +{t}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Request Date</label>
            <input
              type="date"
              disabled={Boolean(recordToEdit)}
              value={requestDate}
              onChange={(e) => setRequestDate(e.target.value)}
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
              <option value="Pending">Pending</option>
              <option value="Sample Collected">Sample Collected</option>
              <option value="Processing">Processing</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Test Results & Clinical Finding Summary
          </label>
          <textarea
            rows={2}
            placeholder="Numerical results, normal reference values, impression..."
            value={resultSummary}
            onChange={(e) => setResultSummary(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-mongo-forest focus:outline-none"
          ></textarea>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Remarks & Instructions
          </label>
          <input
            type="text"
            placeholder="Special preparation instructions (e.g. 10 hours fasting)..."
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
            Save Laboratory Record
          </button>
        </div>
      </form>
    </Modal>
  );
};
