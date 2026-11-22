import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  ArrowRight,
  Database,
  RefreshCw,
} from 'lucide-react';
import api from '../api/client';
import { Badge } from '../components/common/Badge';

export const ExcelManager: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [commitResult, setCommitResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setPreviewData(null);
      setCommitResult(null);
      setError('');
    }
  };

  const handleUploadPreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select an Excel file (.xlsx or .xls) to upload.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await api.post('/import-export/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setPreviewData(res.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to inspect Excel workbook.');
    } finally {
      setUploading(false);
    }
  };

  const handleCommitImport = async () => {
    if (!previewData || !previewData.rows) return;

    setCommitting(true);
    setError('');

    try {
      const res = await api.post('/import-export/commit', {
        rows: previewData.rows,
        skipDuplicates,
      });

      if (res.data.success) {
        setCommitResult(res.data);
        setPreviewData(null);
        setSelectedFile(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to commit import into database.');
    } finally {
      setCommitting(false);
    }
  };

  const handleDownloadFullDatabaseExcel = async () => {
    try {
      const response = await api.get('/import-export/export', {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `COM-PMS-DATABASE-EXPORT-${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to export workbook:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-mongo-lightBorder shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            <h1 className="text-xl font-bold text-slate-900 font-sans">
              Excel Data Integration Hub
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Import Excel workbooks with staging review and duplicate conflict prevention; export multi-sheet workbooks.
          </p>
        </div>

        <button
          onClick={handleDownloadFullDatabaseExcel}
          className="px-4 py-2 bg-mongo-forest hover:bg-mongo-forestDark text-white text-xs font-semibold rounded-lg shadow transition flex items-center gap-1.5"
        >
          <Download className="w-4 h-4" />
          <span>Export Full Database (.xlsx)</span>
        </button>
      </div>

      {/* Success Notification after commit */}
      {commitResult && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="font-bold text-sm">Import Completed Successfully</span>
          </div>
          <p>{commitResult.message}</p>
          <div className="flex gap-4 font-mono">
            <span>Inserted: {commitResult.insertedCount}</span>
            <span>Skipped/Duplicates: {commitResult.skippedCount}</span>
          </div>
        </div>
      )}

      {/* File Upload & Preview Section */}
      <div className="bg-white p-6 rounded-xl border border-mongo-lightBorder shadow-sm space-y-5">
        <h2 className="text-sm font-bold text-slate-900 font-sans">Upload Workbook for Inspection</h2>
        <p className="text-xs text-slate-500">
          Upload any version of <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">PROFILE DATA 2026.xlsx</code> or similar institutional spreadsheets.
          The system will parse all worksheets, detect duplicates, and generate a live staging preview.
        </p>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleUploadPreview} className="space-y-4">
          <div className="border-2 border-dashed border-slate-200 hover:border-mongo-green rounded-xl p-8 text-center transition bg-slate-50/50">
            <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-xs font-semibold text-slate-700 mb-1">
              Select or drop workbook file here
            </p>
            <p className="text-[11px] text-slate-400 mb-4">Supported formats: .xlsx, .xls (max 25MB)</p>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-white hover:file:bg-slate-700 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {selectedFile ? `Ready to inspect: ${selectedFile.name} (${Math.round(selectedFile.size / 1024)} KB)` : 'No file chosen'}
            </span>

            <button
              type="submit"
              disabled={!selectedFile || uploading}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {uploading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
              <FileCheck className="w-4 h-4" />
              <span>Inspect & Preview Data</span>
            </button>
          </div>
        </form>
      </div>

      {/* Staging Preview Table */}
      {previewData && (
        <div className="bg-white rounded-xl border border-mongo-lightBorder shadow-sm p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">Staging Review & Verification</h2>
                <span className="bg-mongo-green/20 text-mongo-forest font-mono text-xs font-bold px-2 py-0.5 rounded">
                  {previewData.totalUnifiedRows} Unified Rows Detected
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Review the parsed records below before writing them to the MongoDB collection.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={skipDuplicates}
                  onChange={(e) => setSkipDuplicates(e.target.checked)}
                  className="rounded text-mongo-forest focus:ring-mongo-forest"
                />
                <span>Skip existing database duplicates ({previewData.duplicateCount})</span>
              </label>

              <button
                onClick={handleCommitImport}
                disabled={committing}
                className="px-5 py-2 bg-mongo-forest hover:bg-mongo-forestDark text-white text-xs font-semibold rounded-lg shadow transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {committing && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                <Database className="w-4 h-4" />
                <span>Commit to Database</span>
              </button>
            </div>
          </div>

          {/* Sheets Detected Summary */}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="font-semibold text-slate-500 py-1">Worksheets Inspected:</span>
            {previewData.sheets?.map((s: any) => (
              <span
                key={s.name}
                className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200 font-mono text-[11px]"
              >
                {s.name} ({s.rowCount} rows)
              </span>
            ))}
          </div>

          {/* Preview Rows Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-mono border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Patient Name</th>
                  <th className="py-2.5 px-3">PhilHealth No.</th>
                  <th className="py-2.5 px-3">Age / Sex</th>
                  <th className="py-2.5 px-3">Date Registered</th>
                  <th className="py-2.5 px-3">FPE Date</th>
                  <th className="py-2.5 px-3">Consult Date</th>
                  <th className="py-2.5 px-3">Laboratory</th>
                  <th className="py-2.5 px-3">Medicines</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {previewData.rows.map((row: any, idx: number) => (
                  <tr
                    key={row.id || idx}
                    className={`hover:bg-slate-50 ${
                      row.is_duplicate ? 'bg-amber-50/50' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {row.is_duplicate ? (
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-semibold border border-amber-200">
                          Duplicate
                        </span>
                      ) : (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-semibold border border-emerald-200">
                          New
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                      {row.complete_name}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700 whitespace-nowrap">
                      {row.philhealth_number || <span className="text-slate-400 italic">None</span>}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {row.age ?? '-'} / {row.sex || '-'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                      {row.date_registered || '-'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                      {row.date_fpe || '-'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                      {row.date_consultation || row.consultation_status || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                      {row.laboratory_tests?.length > 0 ? row.laboratory_tests.join(', ') : 'None'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                      {row.medicines?.length > 0 ? row.medicines.join(', ') : 'None'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
