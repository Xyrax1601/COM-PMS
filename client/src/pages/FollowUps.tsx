import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarClock, Search, Plus, Filter, ArrowRight, CheckCircle2, AlertTriangle, Calendar } from 'lucide-react';
import api from '../api/client';
import { FollowUpRecord } from '../types';
import { Badge } from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';

export const FollowUps: React.FC = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const [records, setRecords] = useState<FollowUpRecord[]>([]);
  const [statusCounts, setStatusCounts] = useState({ Upcoming: 0, Overdue: 0, Completed: 0, Cancelled: 0 });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const fetchFollowUps = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '25',
      });
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter !== 'All') params.append('status', statusFilter);

      const res = await api.get(`/follow-ups?${params.toString()}`);
      if (res.data.success) {
        setRecords(res.data.records);
        setTotal(res.data.pagination.total);
        if (res.data.statusCounts) {
          setStatusCounts(res.data.statusCounts);
        }
      }
    } catch (err) {
      console.error('Failed to load follow-up records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, [page, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchFollowUps();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleMarkCompleted = async (id: string) => {
    try {
      await api.put(`/follow-ups/${id}`, {
        status: 'Completed',
        completed_date: new Date().toISOString(),
      });
      fetchFollowUps();
    } catch (err) {
      console.error('Failed to mark completed:', err);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-mongo-lightBorder shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-teal-600" />
            <h1 className="text-xl font-bold text-slate-900 font-sans">Follow-up Monitoring System</h1>
            <span className="bg-teal-50 text-teal-700 text-xs font-mono font-semibold px-2 py-0.5 rounded border border-teal-200">
              {total} Schedules
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tracking patient return visits, post-consultation evaluations, and compliance monitoring.
          </p>
        </div>
      </div>

      {/* Quick Summary Pill Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setStatusFilter('Upcoming')}
          className={`p-3 rounded-xl border text-left transition ${
            statusFilter === 'Upcoming'
              ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-200'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-semibold text-slate-500 uppercase block">Upcoming</span>
          <span className="text-xl font-bold font-mono text-sky-700">{statusCounts.Upcoming}</span>
        </button>

        <button
          onClick={() => setStatusFilter('Overdue')}
          className={`p-3 rounded-xl border text-left transition ${
            statusFilter === 'Overdue'
              ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-200'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-semibold text-slate-500 uppercase block">Overdue</span>
          <span className="text-xl font-bold font-mono text-rose-700">{statusCounts.Overdue}</span>
        </button>

        <button
          onClick={() => setStatusFilter('Completed')}
          className={`p-3 rounded-xl border text-left transition ${
            statusFilter === 'Completed'
              ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-200'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-semibold text-slate-500 uppercase block">Completed</span>
          <span className="text-xl font-bold font-mono text-emerald-700">{statusCounts.Completed}</span>
        </button>

        <button
          onClick={() => setStatusFilter('All')}
          className={`p-3 rounded-xl border text-left transition ${
            statusFilter === 'All'
              ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-200'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-semibold text-slate-500 uppercase block">All Schedules</span>
          <span className="text-xl font-bold font-mono text-slate-800">
            {statusCounts.Upcoming + statusCounts.Overdue + statusCounts.Completed + statusCounts.Cancelled}
          </span>
        </button>
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
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-mongo-lightBorder shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-mono border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Scheduled Date</th>
                <th className="py-3 px-4">Patient ID</th>
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Clinical Objective / Reason</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <span className="w-6 h-6 border-2 border-mongo-forest border-t-transparent rounded-full animate-spin inline-block mb-2"></span>
                    <p>Loading follow-up schedules...</p>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <CalendarClock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No follow-up records found</p>
                  </td>
                </tr>
              ) : (
                records.map((f: any) => (
                  <tr key={f._id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {f.scheduled_date ? f.scheduled_date.split('T')[0] : 'N/A'}
                    </td>
                    <td className="py-3 px-4 font-mono text-mongo-forest font-semibold whitespace-nowrap">
                      {f.patient_id?.patient_id || 'N/A'}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800 whitespace-nowrap">
                      {f.patient_id?.complete_name || 'N/A'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {f.patient_id?.contact_number || '-'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Badge status={f.status} />
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{f.clinical_reason || '-'}</td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {hasRole('admin', 'medical') && f.status !== 'Completed' && (
                          <button
                            onClick={() => handleMarkCompleted(f._id)}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-xs font-semibold flex items-center gap-1 border border-emerald-200 transition"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Completed</span>
                          </button>
                        )}

                        {f.patient_id?._id && (
                          <button
                            onClick={() => navigate(`/patients/${f.patient_id._id}`)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-mongo-forest hover:text-white text-slate-700 text-xs font-semibold rounded transition inline-flex items-center gap-1 shadow-sm"
                          >
                            <span>Profile</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
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
            Showing <span className="font-semibold text-slate-800">{records.length}</span> of{' '}
            <span className="font-semibold text-slate-800">{total}</span> schedules
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
              disabled={records.length < 25}
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
