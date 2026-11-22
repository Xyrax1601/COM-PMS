import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  HeartPulse,
  Stethoscope,
  FlaskConical,
  Pill,
  CalendarClock,
  History,
  Edit,
  Plus,
  Archive,
  AlertTriangle,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  Shield,
  FileText,
} from 'lucide-react';
import api from '../api/client';
import {
  Patient,
  FpeRecord,
  Consultation,
  LaboratoryRecord,
  MedicationRecord,
  FollowUpRecord,
  ActivityLog,
} from '../types';
import { Badge } from '../components/common/Badge';
import { PatientModal } from '../components/modals/PatientModal';
import { FpeModal } from '../components/modals/FpeModal';
import { ConsultationModal } from '../components/modals/ConsultationModal';
import { LabModal } from '../components/modals/LabModal';
import { MedicationModal } from '../components/modals/MedicationModal';
import { FollowUpModal } from '../components/modals/FollowUpModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useAuth } from '../context/AuthContext';

export const PatientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [fpeRecords, setFpeRecords] = useState<FpeRecord[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [laboratories, setLaboratories] = useState<LaboratoryRecord[]>([]);
  const [medications, setMedications] = useState<MedicationRecord[]>([]);
  const [followUps, setFollowUps] = useState<FollowUpRecord[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'fpe' | 'consultations' | 'labs' | 'medications' | 'followups' | 'audit'
  >('overview');

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFpeModalOpen, setIsFpeModalOpen] = useState(false);
  const [isConsultModalOpen, setIsConsultModalOpen] = useState(false);
  const [isLabModalOpen, setIsLabModalOpen] = useState(false);
  const [isMedModalOpen, setIsMedModalOpen] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);

  const fetchPatientData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get(`/patients/${id}`);
      if (res.data.success) {
        setPatient(res.data.patient);
        setFpeRecords(res.data.records.fpeRecords || []);
        setConsultations(res.data.records.consultations || []);
        setLaboratories(res.data.records.laboratoryRecords || []);
        setMedications(res.data.records.medicationRecords || []);
        setFollowUps(res.data.records.followUpRecords || []);
        setActivityLogs(res.data.records.activityLogs || []);
      }
    } catch (err) {
      console.error('Failed to load patient profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData();
  }, [id]);

  const handleArchive = async () => {
    if (!patient) return;
    try {
      await api.patch(`/patients/${patient._id}/archive`, {
        reason: 'Archived from profile view',
      });
      setIsArchiveModalOpen(false);
      fetchPatientData();
    } catch (err) {
      console.error('Archive failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400">
        <span className="w-8 h-8 border-2 border-mongo-forest border-t-transparent rounded-full animate-spin inline-block mb-3"></span>
        <p className="text-sm font-medium">Loading patient document from collection...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Patient Document Not Found</h2>
        <p className="text-sm text-slate-500 mt-1">
          The requested patient record could not be located in the database.
        </p>
        <button
          onClick={() => navigate('/patients')}
          className="mt-4 px-4 py-2 bg-mongo-forest text-white text-xs font-semibold rounded-lg"
        >
          Return to Patient Directory
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Directory</span>
        </button>
      </div>

      {/* Top Patient Document Card (MongoDB Atlas Document Inspector Style) */}
      <div className="bg-white rounded-2xl border border-mongo-lightBorder shadow-sm overflow-hidden">
        {/* Top Header Strip */}
        <div className="bg-slate-900 text-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-mongo-forestDark text-mongo-green border border-mongo-green/40 flex items-center justify-center font-bold text-base shadow-inner">
              {patient.sex === 'F' ? 'F' : 'M'}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-bold text-white font-sans">{patient.complete_name}</h1>
                <span className="font-mono text-xs text-mongo-green bg-slate-800 border border-slate-700 px-2 py-0.5 rounded font-semibold">
                  {patient.patient_id}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                PhilHealth: {patient.philhealth_number || 'UNREGISTERED / NONE'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge status={patient.patient_status} size="md" />

            {hasRole('admin', 'medical', 'registration') && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition flex items-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            )}

            {hasRole('admin', 'medical') && !patient.is_archived && (
              <button
                onClick={() => setIsArchiveModalOpen(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-400 text-xs font-semibold rounded-lg border border-slate-700 transition flex items-center gap-1.5"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Archive</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Demographic Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 divide-x divide-y sm:divide-y-0 divide-slate-100 bg-slate-50/70 text-xs text-slate-600 border-b border-slate-200">
          <div className="p-3.5">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Age / Sex</span>
            <span className="text-slate-900 font-bold font-mono">
              {patient.age ?? 'N/A'} yrs / {patient.sex || 'N/A'}
            </span>
          </div>

          <div className="p-3.5">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Birthday</span>
            <span className="text-slate-900 font-mono">
              {patient.birthday ? patient.birthday.split('T')[0] : 'N/A'}
            </span>
          </div>

          <div className="p-3.5">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Date Registered</span>
            <span className="text-slate-900 font-mono">
              {patient.date_registered ? patient.date_registered.split('T')[0] : 'N/A'}
            </span>
          </div>

          <div className="p-3.5">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Contact</span>
            <span className="text-slate-900 font-mono">{patient.contact_number || 'N/A'}</span>
          </div>

          <div className="p-3.5 col-span-2">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Address</span>
            <span className="text-slate-900 truncate block" title={patient.address}>
              {patient.address || 'N/A'}
            </span>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="p-4 bg-white flex flex-wrap items-center gap-2 border-b border-slate-100">
          {hasRole('admin', 'medical') && (
            <>
              <button
                onClick={() => setIsFpeModalOpen(true)}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg border border-rose-200 transition flex items-center gap-1.5"
              >
                <HeartPulse className="w-3.5 h-3.5" />
                <span>Record FPE</span>
              </button>

              <button
                onClick={() => setIsConsultModalOpen(true)}
                className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold rounded-lg border border-sky-200 transition flex items-center gap-1.5"
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Add Consultation</span>
              </button>

              <button
                onClick={() => setIsLabModalOpen(true)}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold rounded-lg border border-amber-200 transition flex items-center gap-1.5"
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span>Request Lab</span>
              </button>

              <button
                onClick={() => setIsMedModalOpen(true)}
                className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold rounded-lg border border-purple-200 transition flex items-center gap-1.5"
              >
                <Pill className="w-3.5 h-3.5" />
                <span>Record Medicine</span>
              </button>

              <button
                onClick={() => setIsFollowUpModalOpen(true)}
                className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-semibold rounded-lg border border-teal-200 transition flex items-center gap-1.5"
              >
                <CalendarClock className="w-3.5 h-3.5" />
                <span>Schedule Follow-up</span>
              </button>
            </>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-6 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 font-semibold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-mongo-forest text-mongo-forest bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Document Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('fpe')}
            className={`py-3 px-4 font-semibold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'fpe'
                ? 'border-mongo-forest text-mongo-forest bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HeartPulse className="w-4 h-4 text-rose-500" />
            <span>FPE Encounters ({fpeRecords.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('consultations')}
            className={`py-3 px-4 font-semibold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'consultations'
                ? 'border-mongo-forest text-mongo-forest bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Stethoscope className="w-4 h-4 text-sky-500" />
            <span>Consultations ({consultations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('labs')}
            className={`py-3 px-4 font-semibold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'labs'
                ? 'border-mongo-forest text-mongo-forest bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FlaskConical className="w-4 h-4 text-amber-500" />
            <span>Laboratories ({laboratories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('medications')}
            className={`py-3 px-4 font-semibold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'medications'
                ? 'border-mongo-forest text-mongo-forest bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Pill className="w-4 h-4 text-purple-500" />
            <span>Medications ({medications.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('followups')}
            className={`py-3 px-4 font-semibold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'followups'
                ? 'border-mongo-forest text-mongo-forest bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CalendarClock className="w-4 h-4 text-teal-500" />
            <span>Follow-ups ({followUps.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-4 font-semibold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'audit'
                ? 'border-mongo-forest text-mongo-forest bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4 text-slate-500" />
            <span>Audit Trail ({activityLogs.length})</span>
          </button>
        </div>

        {/* Tab Content Panel */}
        <div className="p-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50/80 rounded-xl p-5 border border-slate-200 space-y-3">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                    Demographic Attributes
                  </h3>
                  <div className="space-y-2 text-xs divide-y divide-slate-100">
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Document ID:</span>
                      <span className="font-mono font-semibold text-slate-900">{patient._id}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Institution Code:</span>
                      <span className="font-mono font-semibold text-mongo-forest">{patient.patient_id}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">PhilHealth ID:</span>
                      <span className="font-mono font-semibold text-slate-900">
                        {patient.philhealth_number || 'Missing / Not Recorded'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Birthday:</span>
                      <span className="text-slate-900">
                        {patient.birthday ? new Date(patient.birthday).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Address:</span>
                      <span className="text-slate-900">{patient.address || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Contact Number:</span>
                      <span className="font-mono text-slate-900">{patient.contact_number || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50/80 rounded-xl p-5 border border-slate-200 space-y-3">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                    Lifecycle & Clinical Status
                  </h3>
                  <div className="space-y-2 text-xs divide-y divide-slate-100">
                    <div className="flex justify-between py-1.5 items-center">
                      <span className="text-slate-500">Current Status:</span>
                      <Badge status={patient.patient_status} />
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">FPE Completed:</span>
                      <span className="font-semibold text-slate-900">
                        {fpeRecords.length > 0 ? 'YES' : 'NO'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Consultations Recorded:</span>
                      <span className="font-semibold text-slate-900">{consultations.length}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Pending Lab Requests:</span>
                      <span className="font-semibold text-slate-900">
                        {laboratories.filter((l) => l.status === 'Pending').length}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Upcoming Follow-ups:</span>
                      <span className="font-semibold text-slate-900">
                        {followUps.filter((f) => f.status === 'Upcoming' || f.status === 'Overdue').length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {patient.historical_notes && (
                <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 space-y-1">
                  <span className="font-bold uppercase tracking-wider text-[11px] text-amber-800 font-mono">
                    Historical Remarks from Excel Source
                  </span>
                  <p>{patient.historical_notes}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FPE RECORDS */}
          {activeTab === 'fpe' && (
            <div className="space-y-4">
              {fpeRecords.length === 0 ? (
                <div className="py-10 text-center text-slate-400">
                  <HeartPulse className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">No FPE Record Available</p>
                  <p className="text-xs text-slate-400 mt-1">This patient has not yet undergone First Patient Encounter.</p>
                  {hasRole('admin', 'medical') && (
                    <button
                      onClick={() => setIsFpeModalOpen(true)}
                      className="mt-3 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg"
                    >
                      Record First Patient Encounter
                    </button>
                  )}
                </div>
              ) : (
                fpeRecords.map((fpe) => (
                  <div key={fpe._id} className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div className="flex items-center gap-2">
                        <HeartPulse className="w-4 h-4 text-rose-500" />
                        <span className="font-bold text-slate-900 text-xs">
                          First Patient Encounter on {new Date(fpe.fpe_date).toLocaleDateString()}
                        </span>
                      </div>
                      <Badge status={fpe.status} />
                    </div>

                    {fpe.vital_signs && Object.values(fpe.vital_signs).some((v) => v !== '' && v !== null) && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded-lg border border-slate-200 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase">Blood Pressure</span>
                          <span className="font-mono font-bold text-slate-800">
                            {fpe.vital_signs.blood_pressure || '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase">Heart Rate</span>
                          <span className="font-mono font-bold text-slate-800">
                            {fpe.vital_signs.heart_rate ? `${fpe.vital_signs.heart_rate} bpm` : '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase">Temp</span>
                          <span className="font-mono font-bold text-slate-800">
                            {fpe.vital_signs.temperature ? `${fpe.vital_signs.temperature} °C` : '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase">Resp. Rate</span>
                          <span className="font-mono font-bold text-slate-800">
                            {fpe.vital_signs.respiratory_rate ? `${fpe.vital_signs.respiratory_rate} cpm` : '-'}
                          </span>
                        </div>
                      </div>
                    )}

                    {fpe.notes && (
                      <div className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200">
                        <span className="font-semibold text-slate-700 block mb-1">Clinical Notes:</span>
                        <p>{fpe.notes}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: CONSULTATIONS */}
          {activeTab === 'consultations' && (
            <div className="space-y-4">
              {consultations.length === 0 ? (
                <div className="py-10 text-center text-slate-400">
                  <Stethoscope className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">No Consultations Recorded</p>
                  <p className="text-xs text-slate-400 mt-1">This patient has no recorded consultations.</p>
                  {hasRole('admin', 'medical') && (
                    <button
                      onClick={() => setIsConsultModalOpen(true)}
                      className="mt-3 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg"
                    >
                      Record Consultation
                    </button>
                  )}
                </div>
              ) : (
                consultations.map((c) => (
                  <div key={c._id} className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div>
                        <span className="font-bold text-slate-900 text-xs">
                          Consultation on {new Date(c.consultation_date).toLocaleDateString()}
                        </span>
                        <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                          Attending: {c.attending_physician || 'COM Clinic Physician'}
                        </p>
                      </div>
                      <Badge status={c.status} />
                    </div>

                    <div className="space-y-2 text-xs">
                      {c.clinical_remarks && (
                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                          <span className="font-semibold text-slate-800 block mb-0.5">Clinical Remarks:</span>
                          <p className="text-slate-600">{c.clinical_remarks}</p>
                        </div>
                      )}

                      {c.recommendations && (
                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                          <span className="font-semibold text-slate-800 block mb-0.5">Recommendations:</span>
                          <p className="text-slate-600">{c.recommendations}</p>
                        </div>
                      )}

                      {c.follow_up_date && (
                        <div className="flex items-center gap-2 text-teal-700 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200 font-mono text-[11px]">
                          <CalendarClock className="w-4 h-4 text-teal-600" />
                          <span>Recommended Follow-up: {c.follow_up_date.split('T')[0]}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: LABORATORIES */}
          {activeTab === 'labs' && (
            <div className="space-y-4">
              {laboratories.length === 0 ? (
                <div className="py-10 text-center text-slate-400">
                  <FlaskConical className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">No Laboratory Requests</p>
                  <p className="text-xs text-slate-400 mt-1">No laboratory tests recorded for this patient.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-mono border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Test Name</th>
                        <th className="py-2.5 px-3">Request Date</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Results / Summary</th>
                        <th className="py-2.5 px-3">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {laboratories.map((lab) => (
                        <tr key={lab._id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{lab.test_name}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">
                            {lab.request_date ? lab.request_date.split('T')[0] : 'N/A'}
                          </td>
                          <td className="py-2.5 px-3">
                            <Badge status={lab.status} />
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">
                            {lab.result_summary || <span className="text-slate-400 italic">Pending analysis</span>}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500">{lab.remarks || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: MEDICATIONS */}
          {activeTab === 'medications' && (
            <div className="space-y-4">
              {medications.length === 0 ? (
                <div className="py-10 text-center text-slate-400">
                  <Pill className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">No Medication Entries</p>
                  <p className="text-xs text-slate-400 mt-1">No medications recorded for this patient.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-mono border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Medicine Name</th>
                        <th className="py-2.5 px-3">Dosage</th>
                        <th className="py-2.5 px-3">Frequency</th>
                        <th className="py-2.5 px-3">Date Recorded</th>
                        <th className="py-2.5 px-3">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {medications.map((med) => (
                        <tr key={med._id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-semibold text-purple-900">{med.medicine_name}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-700">{med.dosage || '-'}</td>
                          <td className="py-2.5 px-3 text-slate-700">{med.frequency || '-'}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">
                            {med.date_recorded ? med.date_recorded.split('T')[0] : 'N/A'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500">{med.remarks || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: FOLLOW-UPS */}
          {activeTab === 'followups' && (
            <div className="space-y-4">
              {followUps.length === 0 ? (
                <div className="py-10 text-center text-slate-400">
                  <CalendarClock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">No Follow-up Scheduled</p>
                  <p className="text-xs text-slate-400 mt-1">Patient has no upcoming or previous follow-up visits.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {followUps.map((f) => (
                    <div
                      key={f._id}
                      className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-teal-600" />
                          <span className="font-bold text-slate-900 font-mono">
                            Scheduled: {new Date(f.scheduled_date).toLocaleDateString()}
                          </span>
                          <Badge status={f.status} />
                        </div>
                        <p className="text-slate-600 font-sans">Reason: {f.clinical_reason || 'Routine review'}</p>
                        {f.notes && <p className="text-[11px] text-slate-400">{f.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 7: AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div className="space-y-3 text-xs">
              {activityLogs.length === 0 ? (
                <p className="text-slate-400 py-6 text-center">No specific activity logs recorded for this document.</p>
              ) : (
                activityLogs.map((log) => (
                  <div key={log._id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between">
                    <div>
                      <span className="font-bold text-slate-900">{log.user_name}</span>{' '}
                      <span className="text-slate-600">executed</span>{' '}
                      <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-800">
                        {log.action}
                      </span>
                    </div>
                    <span className="font-mono text-slate-400 text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <PatientModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchPatientData}
        patientToEdit={patient}
      />

      <FpeModal
        isOpen={isFpeModalOpen}
        onClose={() => setIsFpeModalOpen(false)}
        onSuccess={fetchPatientData}
        patient={patient}
      />

      <ConsultationModal
        isOpen={isConsultModalOpen}
        onClose={() => setIsConsultModalOpen(false)}
        onSuccess={fetchPatientData}
        patient={patient}
      />

      <LabModal
        isOpen={isLabModalOpen}
        onClose={() => setIsLabModalOpen(false)}
        onSuccess={fetchPatientData}
        patient={patient}
      />

      <MedicationModal
        isOpen={isMedModalOpen}
        onClose={() => setIsMedModalOpen(false)}
        onSuccess={fetchPatientData}
        patient={patient}
      />

      <FollowUpModal
        isOpen={isFollowUpModalOpen}
        onClose={() => setIsFollowUpModalOpen(false)}
        onSuccess={fetchPatientData}
        patient={patient}
      />

      <ConfirmDialog
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        onConfirm={handleArchive}
        title="Archive Patient Profile"
        message={`Archive record for ${patient.complete_name}?`}
        confirmText="Confirm Archive"
        type="warning"
      />
    </div>
  );
};
