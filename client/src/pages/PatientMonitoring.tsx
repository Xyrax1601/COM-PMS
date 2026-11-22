import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  Layers,
  CalendarClock,
  ClipboardCheck,
  Search,
  ArrowRight,
  ExternalLink,
  Users,
} from 'lucide-react';
import api from '../api/client';
import { Patient, FollowUpRecord } from '../types';
import { Badge } from '../components/common/Badge';

export const PatientMonitoring: React.FC = () => {
  const navigate = useNavigate();

  const [summary, setSummary] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState<string>('registered_and_completed');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [followUps, setFollowUps] = useState<FollowUpRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    try {
      const res = await api.get('/monitoring/summary');
      if (res.data.success) {
        setSummary(res.data.summary);
      }
    } catch (err) {
      console.error('Failed to load monitoring summary:', err);
    }
  };

  const fetchCategoryData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '25',
      });
      if (search.trim()) params.append('search', search.trim());

      const res = await api.get(`/monitoring/category/${activeCategory}?${params.toString()}`);
      if (res.data.success) {
        if (activeCategory === 'pending_follow_ups') {
          setFollowUps(res.data.records || []);
        } else {
          setPatients(res.data.patients || []);
        }
        setTotal(res.data.pagination.total || 0);
      }
    } catch (err) {
      console.error('Failed to load category data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    setPage(1);
    fetchCategoryData();
  }, [activeCategory]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCategoryData();
    }, 300);
    return () => clearTimeout(timer);
  }, [page, search]);

  const categories = [
    {
      id: 'registered_and_completed',
      title: 'Completed All Processes',
      description: 'Registered + Completed FPE + Completed Consultation',
      count: summary?.categories?.registered_and_completed ?? 0,
      icon: CheckCircle2,
      color: 'border-emerald-500 bg-emerald-500/10 text-emerald-700',
      activeColor: 'bg-emerald-600 text-white shadow-emerald-500/20',
    },
    {
      id: 'registered_no_fpe',
      title: 'Registered but No FPE',
      description: 'Registered with PhilHealth but pending First Patient Encounter',
      count: summary?.categories?.registered_no_fpe ?? 0,
      icon: AlertCircle,
      color: 'border-amber-500 bg-amber-500/10 text-amber-700',
      activeColor: 'bg-amber-600 text-white shadow-amber-500/20',
    },
    {
      id: 'fpe_no_consultation',
      title: 'FPE but No Consultation',
      description: 'Completed FPE encounter but has not proceeded to clinical consultation',
      count: summary?.categories?.fpe_no_consultation ?? 0,
      icon: Stethoscope,
      color: 'border-blue-500 bg-blue-500/10 text-blue-700',
      activeColor: 'bg-blue-600 text-white shadow-blue-500/20',
    },
    {
      id: 'fpe_not_registered',
      title: 'FPE but Not Registered',
      description: 'Completed FPE or clinic encounter but lacking PhilHealth registration',
      count: summary?.categories?.fpe_not_registered ?? 0,
      icon: Layers,
      color: 'border-purple-500 bg-purple-500/10 text-purple-700',
      activeColor: 'bg-purple-600 text-white shadow-purple-500/20',
    },
    {
      id: 'fpe_consultation_not_registered',
      title: 'FPE & Consult Not Registered',
      description: 'Completed FPE and Consultation but lacking PhilHealth registration',
      count: summary?.categories?.fpe_consultation_not_registered ?? 0,
      icon: ClipboardCheck,
      color: 'border-indigo-500 bg-indigo-500/10 text-indigo-700',
      activeColor: 'bg-indigo-600 text-white shadow-indigo-500/20',
    },
    {
      id: 'pending_follow_ups',
      title: 'Pending Follow-ups',
      description: 'Patients with scheduled upcoming or overdue clinic follow-up visits',
      count: summary?.categories?.pending_follow_ups ?? 0,
      icon: CalendarClock,
      color: 'border-teal-500 bg-teal-500/10 text-teal-700',
      activeColor: 'bg-teal-600 text-white shadow-teal-500/20',
    },
  ];

  const currentCat = categories.find((c) => c.id === activeCategory);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-mongo-lightBorder shadow-sm">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-mongo-green" />
          <h1 className="text-xl font-bold text-slate-900 font-sans">Patient Lifecycle Monitoring</h1>
          <span className="bg-mongo-green/20 text-mongo-forest font-mono text-xs font-bold px-2 py-0.5 rounded border border-mongo-green/30">
            Real-Time Engine
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl">
          Automated classification derived directly from patient clinical encounter documents and consultations.
          Select any monitoring category below to review documents and take action.
        </p>
      </div>

      {/* Monitoring Bucket Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                isActive
                  ? `${cat.activeColor} shadow-lg ring-2 ring-offset-2 ring-slate-800`
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-600'}`} />
                  <span
                    className={`font-mono text-xl font-bold ${
                      isActive ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {cat.count}
                  </span>
                </div>
                <h3 className={`text-xs font-bold font-sans ${isActive ? 'text-white' : 'text-slate-800'}`}>
                  {cat.title}
                </h3>
              </div>

              <p
                className={`text-[10px] mt-2 line-clamp-2 ${
                  isActive ? 'text-white/80' : 'text-slate-500'
                }`}
              >
                {cat.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Category Patient Table View */}
      <div className="bg-white rounded-xl border border-mongo-lightBorder shadow-sm space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">{currentCat?.title}</h2>
              <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded font-semibold text-slate-700">
                {total} Records
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{currentCat?.description}</p>
          </div>

          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search in this bucket..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-mongo-forest focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Dynamic Table based on whether it is follow_ups or patients */}
        {activeCategory === 'pending_follow_ups' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-mono border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Scheduled Date</th>
                  <th className="py-2.5 px-3">Patient ID</th>
                  <th className="py-2.5 px-3">Patient Name</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Clinical Reason</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <span className="w-6 h-6 border-2 border-mongo-forest border-t-transparent rounded-full animate-spin inline-block mb-2"></span>
                      <p>Loading follow-up schedules...</p>
                    </td>
                  </tr>
                ) : followUps.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <CalendarClock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No pending follow-ups found</p>
                    </td>
                  </tr>
                ) : (
                  followUps.map((f: any) => (
                    <tr key={f._id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-teal-800 whitespace-nowrap">
                        {f.scheduled_date ? f.scheduled_date.split('T')[0] : 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-mongo-forest">
                        {f.patient_id?.patient_id || 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {f.patient_id?.complete_name || 'N/A'}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge status={f.status} />
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{f.clinical_reason || '-'}</td>
                      <td className="py-2.5 px-3 text-right">
                        {f.patient_id?._id && (
                          <button
                            onClick={() => navigate(`/patients/${f.patient_id._id}`)}
                            className="text-mongo-forest hover:underline font-semibold flex items-center gap-1 justify-end ml-auto"
                          >
                            <span>Open Profile</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-mono border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Patient ID</th>
                  <th className="py-2.5 px-3">Complete Name</th>
                  <th className="py-2.5 px-3">PhilHealth No.</th>
                  <th className="py-2.5 px-3">Registration Date</th>
                  <th className="py-2.5 px-3">Age / Sex</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <span className="w-6 h-6 border-2 border-mongo-forest border-t-transparent rounded-full animate-spin inline-block mb-2"></span>
                      <p>Loading patient records...</p>
                    </td>
                  </tr>
                ) : patients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No patients in this category</p>
                    </td>
                  </tr>
                ) : (
                  patients.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 font-mono font-semibold text-mongo-forest whitespace-nowrap">
                        {p.patient_id}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                        {p.complete_name}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700 whitespace-nowrap">
                        {p.philhealth_number || (
                          <span className="text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded text-[10px] border border-rose-200">
                            Unregistered
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {p.date_registered ? p.date_registered.split('T')[0] : 'None'}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {p.age ?? 'N/A'} yrs / {p.sex || '-'}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <Badge status={p.patient_status} />
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => navigate(`/patients/${p._id}`)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-mongo-forest hover:text-white text-slate-700 text-xs font-semibold rounded transition inline-flex items-center gap-1 shadow-sm"
                        >
                          <span>Open Profile</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
