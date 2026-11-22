import React, { useState, useEffect } from 'react';
import { History, Search, Filter, ShieldCheck, ChevronDown, ChevronRight } from 'lucide-react';
import api from '../api/client';
import { ActivityLog } from '../types';

export const ActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('All');
  const [entityFilter, setEntityFilter] = useState('All');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '50',
      });
      if (actionFilter !== 'All') params.append('action', actionFilter);
      if (entityFilter !== 'All') params.append('entity_type', entityFilter);

      const res = await api.get(`/activity-logs?${params.toString()}`);
      if (res.data.success) {
        setLogs(res.data.logs);
        setTotal(res.data.pagination.total);
      }
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, entityFilter]);

  const toggleExpand = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-mongo-lightBorder shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-700" />
            <h1 className="text-xl font-bold text-slate-900 font-sans">
              System Activity & Compliance Audit Trail
            </h1>
            <span className="bg-slate-100 text-slate-700 text-xs font-mono font-semibold px-2 py-0.5 rounded border border-slate-200">
              {total} Log Entries
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Immutable transaction records satisfying Philippine Data Privacy Act accountability compliance.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-mongo-lightBorder shadow-sm flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-600">Action:</span>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 focus:outline-none"
          >
            <option value="All">All Actions</option>
            <option value="USER_LOGIN">USER_LOGIN</option>
            <option value="CREATE_PATIENT">CREATE_PATIENT</option>
            <option value="UPDATE_PATIENT">UPDATE_PATIENT</option>
            <option value="ARCHIVE_PATIENT">ARCHIVE_PATIENT</option>
            <option value="RECORD_FPE">RECORD_FPE</option>
            <option value="CREATE_CONSULTATION">CREATE_CONSULTATION</option>
            <option value="CREATE_LAB_REQUEST">CREATE_LAB_REQUEST</option>
            <option value="EXCEL_IMPORT_COMMITTED">EXCEL_IMPORT_COMMITTED</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-600">Entity:</span>
          <select
            value={entityFilter}
            onChange={(e) => {
              setEntityFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 focus:outline-none"
          >
            <option value="All">All Entities</option>
            <option value="Patient">Patient</option>
            <option value="Consultation">Consultation</option>
            <option value="FpeRecord">FpeRecord</option>
            <option value="Laboratory">Laboratory</option>
            <option value="Medication">Medication</option>
            <option value="FollowUp">FollowUp</option>
            <option value="User">User</option>
            <option value="System">System</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-mongo-lightBorder shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-mono border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <span className="w-6 h-6 border-2 border-mongo-forest border-t-transparent rounded-full animate-spin inline-block mb-2"></span>
                    <p>Loading audit entries...</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No activity records found</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <React.Fragment key={log._id}>
                    <tr
                      onClick={() => toggleExpand(log._id)}
                      className="hover:bg-slate-50 transition cursor-pointer"
                    >
                      <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800 whitespace-nowrap">
                        {log.user_name}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono bg-slate-100 border border-slate-200 text-slate-800 px-2 py-0.5 rounded text-[11px] font-semibold">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-medium">
                        {log.entity_type} {log.entity_id ? `(${log.entity_id.slice(-6)})` : ''}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                        {log.ip_address || '127.0.0.1'}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button className="text-slate-400 hover:text-slate-700">
                          {expandedLogId === log._id ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                    {expandedLogId === log._id && (
                      <tr className="bg-slate-900 text-slate-200 font-mono text-[11px]">
                        <td colSpan={6} className="p-4">
                          <p className="text-slate-400 mb-1">
                            Document Payload & Metadata (BSON View):
                          </p>
                          <pre className="overflow-x-auto bg-slate-950 p-3 rounded-lg border border-slate-800 text-emerald-400">
                            {JSON.stringify(log.details || {}, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing <span className="font-semibold text-slate-800">{logs.length}</span> of{' '}
            <span className="font-semibold text-slate-800">{total}</span> audit entries
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
              disabled={logs.length < 50}
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
