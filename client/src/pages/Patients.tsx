import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  Filter,
  Download,
  Eye,
  Edit,
  Archive,
  RefreshCw,
  ArchiveRestore,
  MoreVertical,
  Calendar,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../api/client';
import { Patient, PatientStatus } from '../types';
import { Badge } from '../components/common/Badge';
import { PatientModal } from '../components/modals/PatientModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useAuth } from '../context/AuthContext';

export const Patients: React.FC = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sexFilter, setSexFilter] = useState('All');
  const [archivedFilter, setArchivedFilter] = useState('false');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Patient | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<Patient | null>(null);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        archived: archivedFilter,
      });

      if (search.trim()) params.append('search', search.trim());
      if (statusFilter !== 'All') params.append('status', statusFilter);
      if (sexFilter !== 'All') params.append('sex', sexFilter);

      const res = await api.get(`/patients?${params.toString()}`);
      if (res.data.success) {
        setPatients(res.data.patients);
        setTotal(res.data.pagination.total);
      }
    } catch (err) {
      console.error('Failed to load patients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [page, limit, statusFilter, sexFilter, archivedFilter]);

  // Handle Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchPatients();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleArchive = async () => {
    if (!archiveTarget) return;
    try {
      await api.patch(`/patients/${archiveTarget._id}/archive`, {
        reason: 'Archived via Patient Directory',
      });
      setArchiveTarget(null);
      fetchPatients();
    } catch (err) {
      console.error('Archive failed:', err);
    }
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    try {
      await api.patch(`/patients/${restoreTarget._id}/unarchive`);
      setRestoreTarget(null);
      fetchPatients();
    } catch (err) {
      console.error('Restore failed:', err);
    }
  };

  const exportCurrentTableToExcel = () => {
    const exportData = patients.map((p) => ({
      'Patient ID': p.patient_id,
      'Complete Name': p.complete_name,
      'PhilHealth Number': p.philhealth_number || '',
      'Date Registered': p.date_registered ? p.date_registered.split('T')[0] : '',
      Age: p.age || '',
      Sex: p.sex || '',
      Birthday: p.birthday ? p.birthday.split('T')[0] : '',
      Address: p.address || '',
      'Contact Number': p.contact_number || '',
      Status: p.patient_status,
      Archived: p.is_archived ? 'Yes' : 'No',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Patient Directory');
    XLSX.writeFile(wb, `COM-PMS-Patients-${Date.now()}.xlsx`);
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-mongo-lightBorder shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 font-sans">Patient Directory</h1>
            <span className="bg-slate-100 text-slate-700 text-xs font-mono font-semibold px-2 py-0.5 rounded border border-slate-200">
              {total} Documents
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Collection view of all registered patients, clinical status classifications, and demographics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportCurrentTableToExcel}
            className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Table</span>
          </button>

          {hasRole('admin', 'medical', 'registration') && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-mongo-forest hover:bg-mongo-forestDark text-white text-xs font-semibold rounded-lg shadow transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Register Patient</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-mongo-lightBorder shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, PhilHealth number, Patient ID, address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-mongo-forest focus:border-transparent transition"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
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
              <option value="Registered and Completed FPE and Consultation">Completed FPE & Consult</option>
              <option value="Registered but No FPE">Registered but No FPE</option>
              <option value="Completed FPE but No Consultation">FPE but No Consultation</option>
              <option value="Completed FPE but Not Registered">FPE but Not Registered</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="text-slate-400 font-medium">Sex:</span>
            <select
              value={sexFilter}
              onChange={(e) => {
                setSexFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none"
            >
              <option value="All">All</option>
              <option value="M">Male (M)</option>
              <option value="F">Female (F)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="text-slate-400 font-medium">Records:</span>
            <select
              value={archivedFilter}
              onChange={(e) => {
                setArchivedFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none"
            >
              <option value="false">Active Only</option>
              <option value="true">Archived Only</option>
              <option value="all">Active + Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Collection Data Table */}
      <div className="bg-white rounded-xl border border-mongo-lightBorder shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-mono border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Patient ID</th>
                <th className="py-3 px-4">Complete Name</th>
                <th className="py-3 px-4">PhilHealth No.</th>
                <th className="py-3 px-3">Age / Sex</th>
                <th className="py-3 px-4">Address</th>
                <th className="py-3 px-3">Contact</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <span className="w-6 h-6 border-2 border-mongo-forest border-t-transparent rounded-full animate-spin inline-block mb-2"></span>
                    <p>Loading patient records from MongoDB collection...</p>
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-600">No patient documents found</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search keywords.</p>
                  </td>
                </tr>
              ) : (
                patients.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50 transition group">
                    <td className="py-3 px-4 font-mono font-semibold text-mongo-forest whitespace-nowrap">
                      {p.patient_id}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <button
                        onClick={() => navigate(`/patients/${p._id}`)}
                        className="font-bold text-slate-900 group-hover:text-mongo-forest hover:underline text-left"
                      >
                        {p.complete_name}
                      </button>
                      <p className="text-[11px] text-slate-400">
                        Reg: {p.date_registered ? p.date_registered.split('T')[0] : 'None'}
                      </p>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                      {p.philhealth_number ? (
                        p.philhealth_number
                      ) : (
                        <span className="text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded text-[10px] border border-rose-200">
                          Unregistered
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-slate-700">
                      {p.age ?? 'N/A'} yrs / <span className="font-semibold">{p.sex || '-'}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={p.address}>
                      {p.address || <span className="text-slate-400 italic">None</span>}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
                      {p.contact_number || <span className="text-slate-400 italic">-</span>}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Badge status={p.patient_status} />
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => navigate(`/patients/${p._id}`)}
                          title="View Complete Profile"
                          className="p-1.5 text-slate-500 hover:text-mongo-forest hover:bg-slate-100 rounded transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {hasRole('admin', 'medical', 'registration') && (
                          <button
                            onClick={() => setEditingPatient(p)}
                            title="Edit Demographics"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}

                        {hasRole('admin', 'medical') && (
                          p.is_archived ? (
                            <button
                              onClick={() => setRestoreTarget(p)}
                              title="Restore Record"
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition"
                            >
                              <ArchiveRestore className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setArchiveTarget(p)}
                              title="Archive Record"
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing <span className="font-semibold text-slate-800">{patients.length}</span> of{' '}
            <span className="font-semibold text-slate-800">{total}</span> patient records
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 bg-white border border-slate-200 rounded text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition font-medium"
            >
              Previous
            </button>
            <span className="font-mono text-slate-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 bg-white border border-slate-200 rounded text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition font-medium"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Patient Modal */}
      <PatientModal
        isOpen={isAddModalOpen || Boolean(editingPatient)}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingPatient(null);
        }}
        onSuccess={fetchPatients}
        patientToEdit={editingPatient}
      />

      {/* Archive Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(archiveTarget)}
        onClose={() => setArchiveTarget(null)}
        onConfirm={handleArchive}
        title="Archive Patient Record"
        message={`Are you sure you want to archive ${archiveTarget?.complete_name} (${archiveTarget?.patient_id})? The record will be hidden from standard operations but preserved for historical audits.`}
        confirmText="Archive Record"
        type="warning"
      />

      {/* Restore Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(restoreTarget)}
        onClose={() => setRestoreTarget(null)}
        onConfirm={handleRestore}
        title="Restore Patient Record"
        message={`Restore ${restoreTarget?.complete_name} (${restoreTarget?.patient_id}) to active status?`}
        confirmText="Restore Record"
        type="info"
      />
    </div>
  );
};
