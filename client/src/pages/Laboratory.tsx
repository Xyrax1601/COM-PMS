import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlaskConical, Search, Plus, Filter, ArrowRight, Edit, CheckCircle2 } from 'lucide-react';
import api from '../api/client';
import { LaboratoryRecord } from '../types';
import { Badge } from '../components/common/Badge';
import { LabModal } from '../components/modals/LabModal';
import { useAuth } from '../context/AuthContext';

export const Laboratory: React.FC = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const [records, setRecords] = useState<LaboratoryRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [testFilter, setTestFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const [editingRecord, setEditingRecord] = useState<LaboratoryRecord | null>(null);

  const fetchLabRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '25',
      });
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter !== 'All') params.append('status', statusFilter);
      if (testFilter !== 'All') params.append('test_name', testFilter);

      const res = await api.get(`/laboratories?${params.toString()}`);
      if (res.data.success) {
        setRecords(res.data.records);
        setTotal(res.data.pagination.total);
      }
    } catch (err) {
      console.error('Failed to load lab records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabRecords();
  }, [page, statusFilter, testFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchLabRecords();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-mongo-lightBorder shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-amber-500" />
            <h1 className="text-xl font-bold text-slate-900 font-sans">Laboratory Management</h1>
            <span className="bg-amber-50 text-amber-700 text-xs font-mono font-semibold px-2 py-0.5 rounded border border-amber-200">
              {total} Tests Requested
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tracking laboratory diagnostics (FBS, CBC, Lipid Profile, Urinalysis, ECG, X-Ray) from consultation orders.
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-mongo-lightBorder shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by patient name, ID, or test name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-mongo-forest focus:border-transparent transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <span className="text-slate-400 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Sample Collected">Sample Collected</option>
            <option value="Processing">Processing</option>
            <option value="Completed">Completed</option>
          </select>

          <span className="text-slate-400 font-medium ml-2">Test:</span>
          <select
            value={testFilter}
            onChange={(e) => {
              setTestFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none"
          >
            <option value="All">All Tests</option>
            <option value="FBS">FBS</option>
            <option value="CBC">CBC</option>
            <option value="LIPID PROFILE">Lipid Profile</option>
            <option value="URINALYSIS">Urinalysis</option>
            <option value="ECG">ECG</option>
            <option value="XRAY">Chest X-Ray</option>
            <option value="CREA">Creatinine</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-mongo-lightBorder shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-mono border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Test Name</th>
                <th className="py-3 px-4">Patient ID</th>
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-4">Request Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Results / Summary</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <span className="w-6 h-6 border-2 border-mongo-forest border-t-transparent rounded-full animate-spin inline-block mb-2"></span>
                    <p>Loading laboratory records...</p>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FlaskConical className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No laboratory requests found</p>
                  </td>
                </tr>
              ) : (
                records.map((r: any) => (
                  <tr key={r._id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {r.test_name}
                    </td>
                    <td className="py-3 px-4 font-mono text-mongo-forest font-semibold whitespace-nowrap">
                      {r.patient_id?.patient_id || 'N/A'}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800 whitespace-nowrap">
                      {r.patient_id?.complete_name || 'N/A'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {r.request_date ? r.request_date.split('T')[0] : 'N/A'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Badge status={r.status} />
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {r.result_summary || <span className="text-slate-400 italic">Pending analysis</span>}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {hasRole('admin', 'medical') && (
                          <button
                            onClick={() => setEditingRecord(r)}
                            title="Update Result / Status"
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold flex items-center gap-1 transition"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Update</span>
                          </button>
                        )}

                        {r.patient_id?._id && (
                          <button
                            onClick={() => navigate(`/patients/${r.patient_id._id}`)}
                            title="View Patient Profile"
                            className="p-1.5 text-slate-500 hover:text-mongo-forest hover:bg-slate-100 rounded transition"
                          >
                            <ArrowRight className="w-4 h-4" />
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
            <span className="font-semibold text-slate-800">{total}</span> laboratory requests
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

      <LabModal
        isOpen={Boolean(editingRecord)}
        onClose={() => setEditingRecord(null)}
        onSuccess={fetchLabRecords}
        recordToEdit={editingRecord}
      />
    </div>
  );
};
