import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, Download, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function BulkImportModal({ isOpen, onClose, onRefresh }) {
  if (!isOpen) return null;

  const { token } = useAuth();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [error, setError] = useState('');
  
  const headers = { 
    Authorization: `Bearer ${token}`,
    'Content-Type': 'multipart/form-data'
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError('');
    setSuccessData(null);
  };

  const handleDownloadTemplate = () => {
    window.open(`${window.API_BASE}/api/customers/import-template?token=${token}`, '_blank');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an Excel file (.xlsx) to upload.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessData(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(
        `${window.API_BASE}/api/customers/bulk-import`,
        formData,
        { headers }
      );
      setSuccessData(res.data);
      onRefresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process Excel upload sheet.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 md:p-8 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="w-full max-w-xl bg-brand-card border border-brand-border rounded-2xl shadow-2xl overflow-hidden animate-slide-up my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-bg/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-accent/15 flex items-center justify-center text-brand-accent">
              <Upload className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">Excel Bulk Data Import</h2>
              <span className="text-[9px] text-brand-dim font-semibold block mt-0.5">Import thousands of borrowers and loans instantly</span>
            </div>
          </div>
          <button onClick={onClose} className="text-brand-dim hover:text-white transition outline-none">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-brand-rose/10 border border-brand-rose/20 rounded-xl text-brand-rose text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Download Template Panel */}
          <div className="bg-brand-bg/50 border border-brand-border/60 p-4 rounded-xl flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-white uppercase tracking-wide">Excel Template (एक्सेल टेम्पलेट)</span>
              <p className="text-[10px] text-brand-dim leading-relaxed">
                Download the formatted Excel sheet, fill in borrower details & loans, and upload it here.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="flex items-center space-x-1 px-3.5 py-2 rounded-xl bg-brand-accent/10 border border-brand-accent/20 hover:bg-brand-accent hover:text-white text-[10px] font-bold text-brand-accent transition shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Get Excel Template</span>
            </button>
          </div>

          {/* File Upload Selector Area */}
          <div className="border border-dashed border-brand-border/80 rounded-xl p-6 bg-brand-bg/25 hover:border-brand-accent/40 transition text-center space-y-3 flex flex-col items-center">
            <Upload className="w-8 h-8 text-brand-dim/50" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-white">
                {file ? file.name : 'Select borrower ledger Excel file'}
              </p>
              <span className="text-[10px] text-brand-dim block">Supports .xlsx or .xls files only</span>
            </div>
            <label className="cursor-pointer bg-brand-border hover:bg-brand-border/70 text-xs text-white font-bold px-4 py-2 rounded-xl transition">
              Browse Sheets
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Success summary results */}
          {successData && (
            <div className="p-4 bg-brand-emerald/10 border border-brand-emerald/20 rounded-xl space-y-3">
              <div className="flex items-center space-x-2 text-brand-emerald font-bold text-xs uppercase tracking-wide">
                <CheckCircle className="w-4.5 h-4.5" />
                <span>Import Summary Reports</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-[11px] text-brand-dim font-medium pt-1">
                <div className="bg-brand-bg/40 p-2.5 rounded-lg border border-brand-border/30">
                  <span className="text-[9px] uppercase font-bold text-brand-dim block">Borrowers Registered</span>
                  <p className="text-sm font-extrabold text-white mt-0.5">{successData.importedCustomers}</p>
                </div>
                <div className="bg-brand-bg/40 p-2.5 rounded-lg border border-brand-border/30">
                  <span className="text-[9px] uppercase font-bold text-brand-dim block">Agreements Disbursed</span>
                  <p className="text-sm font-extrabold text-white mt-0.5">{successData.importedLoans}</p>
                </div>
              </div>

              {/* Warnings / Row Errors */}
              {successData.errors?.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-brand-emerald/20">
                  <span className="text-[9px] font-extrabold text-brand-amber uppercase tracking-wider block">Import Warnings & Skips:</span>
                  <div className="max-h-24 overflow-y-auto border border-brand-border/40 bg-brand-bg/60 p-2 rounded-lg text-[9px] font-mono text-brand-dim space-y-1">
                    {successData.errors.map((err, idx) => (
                      <p key={idx} className="text-brand-amber">⚠️ {err}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-brand-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4.5 py-2.5 rounded-xl border border-brand-border text-xs font-semibold text-brand-dim hover:text-white hover:bg-brand-border/40 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !file}
              className="px-5 py-2.5 rounded-xl bg-brand-accent hover:bg-indigo-600 disabled:opacity-40 text-xs font-bold text-white shadow-lg shadow-brand-accent/20 transition"
            >
              {loading ? 'Processing Sheet...' : 'Process Import'}
            </button>
          </div>
        </form>

      </div>
    </div>,
    document.body
  );
}
