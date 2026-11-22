import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Filter,
  FileText,
  Building,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import api from '../api/client';

export const Reports: React.FC = () => {
  const [reportType, setReportType] = useState('monthly_registration');
  const [year, setYear] = useState('2026');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const reportTypes = [
    { id: 'monthly_registration', label: 'Monthly Patient Registration Report' },
    { id: 'daily_registration', label: 'Daily Patient Registration Log' },
    { id: 'fpe_accomplishment', label: 'FPE Accomplishment Report' },
    { id: 'consultation_accomplishment', label: 'Consultation Accomplishment Report' },
    { id: 'incomplete_processes', label: 'Patients With Incomplete Processes Report' },
    { id: 'philhealth_monitoring', label: 'PhilHealth Registration & Verification Report' },
    { id: 'follow_up_monitoring', label: 'Follow-up Monitoring & Compliance Report' },
    { id: 'annual_summary', label: 'Annual Patient Statistics & Summary' },
  ];

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ reportType });
      if (year && year !== 'All') params.append('year', year);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await api.get(`/reports/data?${params.toString()}`);
      if (res.data.success) {
        setReportData(res.data);
      }
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, year]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadExcel = async () => {
    try {
      const params = new URLSearchParams({ reportType });
      if (year && year !== 'All') params.append('year', year);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await api.get(`/reports/export-excel?${params.toString()}`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `COM-PMS-${reportType}-${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to download excel report:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration Header - Hidden during print */}
      <div className="print:hidden bg-white p-5 rounded-xl border border-mongo-lightBorder shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              <h1 className="text-xl font-bold text-slate-900 font-sans">
                Reports & Statistical Analytics
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Automated institutional reporting generated dynamically from verified database records.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow transition flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Report</span>
            </button>

            <button
              onClick={handleDownloadExcel}
              className="px-4 py-2 bg-mongo-forest hover:bg-mongo-forestDark text-white text-xs font-semibold rounded-lg shadow transition flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export to Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-mongo-forest"
            >
              {reportTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Academic Year</label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-mongo-forest"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="All">All Years</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Start Date (Optional)</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">End Date (Optional)</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
              />
              <button
                type="button"
                onClick={fetchReport}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div className="bg-white rounded-2xl border border-mongo-lightBorder shadow-sm p-8 print:p-0 print:border-none print:shadow-none space-y-6">
        {/* Official College of Medicine Letterhead */}
        <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-900 text-mongo-green flex items-center justify-center font-bold text-2xl font-mono border-2 border-mongo-green">
              COM
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide leading-tight">
                College of Medicine
              </h2>
              <p className="text-xs text-slate-600 font-serif">
                Centralized Patient Management System (COM-PMS)
              </p>
              <p className="text-[11px] text-slate-500 font-sans">
                Office of Clinical Health Services & Community Medicine
              </p>
            </div>
          </div>

          <div className="text-right text-xs text-slate-500 font-mono">
            <p className="font-semibold text-slate-800">OFFICIAL HEALTH REPORT</p>
            <p>Generated: {new Date().toLocaleDateString()}</p>
            <p className="text-[10px]">DocRef: COM-PMS-REP-{Date.now().toString().slice(-6)}</p>
          </div>
        </div>

        {/* Report Title & Scope */}
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900 font-sans tracking-tight">
            {reportData?.reportTitle || 'Institutional Patient Report'}
          </h2>
          <p className="text-xs text-slate-600">
            Reporting Period: Academic Year {year} {startDate ? `(${startDate} to ${endDate || 'present'})` : ''}
          </p>
        </div>

        {/* Dynamic Summary KPI Grid */}
        {reportData?.summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            {Object.entries(reportData.summary).map(([key, val]) => (
              <div key={key}>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
                </span>
                <span className="font-mono text-lg font-bold text-slate-900">{String(val)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Report Data Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-mono uppercase tracking-wider border-b border-slate-200">
              <tr>
                {reportData?.rows?.[0] &&
                  Object.keys(reportData.rows[0]).map((header) => (
                    <th key={header} className="py-2.5 px-3 font-semibold">
                      {header}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <span className="w-6 h-6 border-2 border-mongo-forest border-t-transparent rounded-full animate-spin inline-block mb-2"></span>
                    <p>Compiling database report...</p>
                  </td>
                </tr>
              ) : !reportData?.rows || reportData.rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-400">
                    No data entries matched the specified report parameters.
                  </td>
                </tr>
              ) : (
                reportData.rows.map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    {Object.values(row).map((val: any, colIdx) => (
                      <td key={colIdx} className="py-2.5 px-3 text-slate-800">
                        {val === null || val === undefined || val === '' ? '-' : String(val)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Signature & Audit Certification Block for Institutional Submission */}
        <div className="pt-10 grid grid-cols-2 gap-8 text-xs text-slate-600">
          <div>
            <p className="font-semibold text-slate-800 mb-10">Prepared By:</p>
            <div className="border-t border-slate-400 pt-1 w-60">
              <p className="font-bold text-slate-900">Health Records Officer</p>
              <p className="text-[11px] text-slate-500">COM-PMS Registration Registry</p>
            </div>
          </div>

          <div className="text-right">
            <p className="font-semibold text-slate-800 mb-10">Certified Correct:</p>
            <div className="border-t border-slate-400 pt-1 w-60 ml-auto text-left">
              <p className="font-bold text-slate-900">Dr. Maria Santos, MD</p>
              <p className="text-[11px] text-slate-500">College Clinic Medical Director</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
