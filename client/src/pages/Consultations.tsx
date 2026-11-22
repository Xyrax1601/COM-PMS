import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Search, Plus, Filter, ArrowRight } from 'lucide-react';
import api from '../api/client';
import { Consultation } from '../types';
import { Badge } from '../components/common/Badge';

export const Consultations: React.FC = () => {
  const navigate = useNavigate();

  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const fetchConsultations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '25',
      });
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter !== 'All') params.append('status', statusFilter);

      const res = await api.get(`/consultations?${params.toString()}`);
      if (res.data.success) {
        setConsultations(res.data.consultations);
        setTotal(res.data.pagination.total);
      }
    } catch (err) {
      console.error('Failed to load consultations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsultations();
  }, [page, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchConsultations();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-mongo-lightBorder shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-sky-500" />
            <h1 className="text-xl font-bold text-slate-900 font-sans">Consultation Records</h1>
            <span className="bg-sky-50 text-sky-700 text-xs font-mono font-semibold px-2 py-0.5 rounded border border-sky-200">
              {total} Visits
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Physician evaluations, clinical remarks, diagnostic requests, and follow-up recommendations.
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-mongo-lightBorder shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search patient name, ID, or PhilHealth..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-mongo-forest focus:border-transparent transition"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span className="text-slate-400 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Completed">Completed Consultation</option>
            <option value="No Consultation">No Consultation (Did Not Proceed)</option>
            <option value="Pending">Pending</option>
            <option value="Scheduled">Scheduled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-mongo-lightBorder shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-mono border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Patient ID</th>
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-4">Attending Service</th>
                <th className="py-3 px-4">Clinical Remarks</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <span className="w-6 h-6 border-2 border-mongo-forest border-t-transparent rounded-full animate-spin inline-block mb-2"></span>
                    <p>Loading consultation records...</p>
                  </td>
                </tr>
              ) : consultations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Stethoscope className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No consultation records found</p>
                  </td>
                </tr>
              ) : (
                consultations.map((c: any) => (
                  <tr key={c._id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {c.consultation_date ? c.consultation_date.split('T')[0] : 'N/A'}
                    </td>
                    <td className="py-3 px-4 font-mono text-mongo-forest font-semibold whitespace-nowrap">
                      {c.patient_id?.patient_id || 'N/A'}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {c.patient_id?.complete_name || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                      {c.attending_physician || 'COM Clinic'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-sm truncate" title={c.clinical_remarks}>
                      {c.clinical_remarks || <span className="text-slate-400 italic">None recorded</span>}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Badge status={c.status} />
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {c.patient_id?._id && (
                        <button
                          onClick={() => navigate(`/patients/${c.patient_id._id}`)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-mongo-forest hover:text-white text-slate-700 text-xs font-semibold rounded transition inline-flex items-center gap-1 shadow-sm"
                        >
                          <span>Profile</span>
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

        {/* Pagination */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing <span className="font-semibold text-slate-800">{consultations.length}</span> of{' '}
            <span className="font-semibold text-slate-800">{total}</span> consultation records
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 bg-white border border-slate-200 rounded text-slate-700 disabled:opacity-50 hover:bg-slate-50 transition"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={consultations.length < 25}
              className="px-3 py-1 bg-white border border-slate-200 rounded text-slate-700 disabled:opacity-50 hover:bg-slate-50 transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
