import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { PatientStatus } from '../../types';
import { CheckSquare, ShieldCheck, Stethoscope, HeartPulse, Info, Check } from 'lucide-react';

export interface ManualProcesses {
  has_philhealth: boolean;
  fpe_completed: boolean;
  consultation_completed: boolean;
}

interface ManualStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (processes: ManualProcesses, concludedStatus: PatientStatus) => void;
  initialProcesses?: ManualProcesses;
}

export function computeStatusFromProcesses(p: ManualProcesses): {
  status: PatientStatus;
  description: string;
} {
  if (!p.has_philhealth && p.fpe_completed && p.consultation_completed) {
    return {
      status: 'FPE and Consultation but not registered',
      description: 'Completed both FPE and consultation, but PhilHealth registration is unverified or missing.',
    };
  }

  if (!p.has_philhealth) {
    return {
      status: 'Completed FPE but Not Registered',
      description: 'Completed clinic intake/FPE, but patient lacks PhilHealth registration details.',
    };
  }

  if (p.fpe_completed && p.consultation_completed) {
    return {
      status: 'Registered and Completed FPE and Consultation',
      description: 'Full healthcare journey completed: Registered with PhilHealth, baseline FPE done, and physician consultation completed.',
    };
  }

  if (p.fpe_completed && !p.consultation_completed) {
    return {
      status: 'Completed FPE but No Consultation',
      description: 'Registered with PhilHealth and completed FPE intake, but has not proceeded to physician consultation.',
    };
  }

  return {
    status: 'Registered but No FPE',
    description: 'Registered with PhilHealth, but awaiting First Patient Encounter (FPE) baseline assessment.',
  };
}

export const ManualStatusModal: React.FC<ManualStatusModalProps> = ({
  isOpen,
  onClose,
  onApply,
  initialProcesses,
}) => {
  const [hasPhilHealth, setHasPhilHealth] = useState(false);
  const [fpeCompleted, setFpeCompleted] = useState(false);
  const [consultCompleted, setConsultCompleted] = useState(false);

  useEffect(() => {
    if (initialProcesses) {
      setHasPhilHealth(Boolean(initialProcesses.has_philhealth));
      setFpeCompleted(Boolean(initialProcesses.fpe_completed));
      setConsultCompleted(Boolean(initialProcesses.consultation_completed));
    } else {
      setHasPhilHealth(false);
      setFpeCompleted(false);
      setConsultCompleted(false);
    }
  }, [initialProcesses, isOpen]);

  const currentProcesses: ManualProcesses = {
    has_philhealth: hasPhilHealth,
    fpe_completed: fpeCompleted,
    consultation_completed: consultCompleted,
  };

  const { status: concludedStatus, description } = computeStatusFromProcesses(currentProcesses);

  const handleApply = () => {
    onApply(currentProcesses, concludedStatus);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manually Set Patient Status (Checklist)"
      maxWidth="md"
    >
      <div className="space-y-5">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-mongo-forest shrink-0 mt-0.5" />
          <p>
            Check the processes this patient has accomplished. The system will conclude the exact patient lifecycle status while automatically generating any needed baseline clinical encounter records.
          </p>
        </div>

        {/* Process Checklist */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
            Patient Completed Processes
          </h4>

          {/* 1. PhilHealth Registration */}
          <label
            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
              hasPhilHealth
                ? 'bg-emerald-50/60 border-emerald-300'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <input
              type="checkbox"
              checked={hasPhilHealth}
              onChange={(e) => setHasPhilHealth(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-mongo-forest focus:ring-mongo-forest"
            />
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className={`w-4 h-4 ${hasPhilHealth ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span className="text-sm font-semibold text-slate-900">
                  PhilHealth Registration Verified
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Patient has an active or recorded PhilHealth membership number.
              </p>
            </div>
          </label>

          {/* 2. First Patient Encounter */}
          <label
            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
              fpeCompleted
                ? 'bg-blue-50/60 border-blue-300'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <input
              type="checkbox"
              checked={fpeCompleted}
              onChange={(e) => setFpeCompleted(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-mongo-forest focus:ring-mongo-forest"
            />
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <HeartPulse className={`w-4 h-4 ${fpeCompleted ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className="text-sm font-semibold text-slate-900">
                  First Patient Encounter (FPE) Completed
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Initial baseline health assessment, vitals, and profile intake completed.
              </p>
            </div>
          </label>

          {/* 3. Clinical Consultation */}
          <label
            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
              consultCompleted
                ? 'bg-purple-50/60 border-purple-300'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <input
              type="checkbox"
              checked={consultCompleted}
              onChange={(e) => setConsultCompleted(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-mongo-forest focus:ring-mongo-forest"
            />
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <Stethoscope className={`w-4 h-4 ${consultCompleted ? 'text-purple-600' : 'text-slate-400'}`} />
                <span className="text-sm font-semibold text-slate-900">
                  Clinical Consultation Completed
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluated by clinic physician with clinical remarks or treatment notes.
              </p>
            </div>
          </label>
        </div>

        {/* Live Concluded Status Preview */}
        <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Live Concluded Status
            </span>
            <Badge status={concludedStatus} size="sm" />
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {description}
          </p>
          {(fpeCompleted || consultCompleted) && (
            <div className="pt-1.5 border-t border-slate-800 text-[11px] text-mongo-green font-mono flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>Will auto-generate baseline encounter document(s) on save</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-4 py-2 bg-mongo-forest hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition"
          >
            <CheckSquare className="w-4 h-4 text-mongo-green" />
            <span>Apply Concluded Status</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
