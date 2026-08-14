import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Receipt, ShieldAlert } from 'lucide-react';
import { transactionAPI } from '../api';

export default function PaymentModal({ isOpen, onClose, onRefresh, loanId, customerId, customerName }) {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    amount: '',
    paymentType: 'both',
    paymentMode: 'cash',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.paymentDate) {
      setError('Please provide the payment amount and date.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await transactionAPI.create({
        loanId,
        customerId,
        amount: parseFloat(formData.amount),
        paymentType: formData.paymentType,
        paymentMode: formData.paymentMode,
        paymentDate: formData.paymentDate,
        notes: formData.notes,
      });
      onRefresh();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record the payment.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      
      {/* Modal Card */}
      <div className="w-full max-w-lg bg-brand-card border border-brand-border rounded-2xl shadow-2xl animate-slide-up my-auto overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-bg/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-emerald/10 flex items-center justify-center text-brand-emerald">
              <Receipt className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-white">Record Repayment Receipt</h2>
          </div>
          <button type="button" onClick={onClose} className="text-brand-dim hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-brand-bg/50 border border-brand-border p-3.5 rounded-xl">
            <span className="text-[9px] uppercase font-bold text-brand-dim">Active Borrower File</span>
            <p className="text-sm font-semibold text-white mt-0.5">{customerName}</p>
          </div>

          {error && (
            <div className="flex items-center space-x-2 p-3 bg-brand-rose/10 border border-brand-rose/20 rounded-xl text-brand-rose text-xs font-semibold">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Amount */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wide">Repayment Amount (Rupiya) *</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="e.g. 5000"
                className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-white placeholder-brand-dim/50 outline-none transition"
                required
                min="0.01"
                step="0.01"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Payment Type / Allocation */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wide">Allocate Payment To *</label>
                <select
                  name="paymentType"
                  value={formData.paymentType}
                  onChange={handleChange}
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-3 py-2.5 text-xs text-white outline-none transition"
                  required
                >
                  <option value="both">Waterfall (Byaj + Asal)</option>
                  <option value="interest">Interest Only (Byaj)</option>
                  <option value="principal">Principal Only (Asal)</option>
                </select>
              </div>

              {/* Payment Mode */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wide">Payment Mode *</label>
                <select
                  name="paymentMode"
                  value={formData.paymentMode}
                  onChange={handleChange}
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-3 py-2.5 text-xs text-white outline-none transition"
                  required
                >
                  <option value="cash">Cash (Nokad)</option>
                  <option value="online">UPI / QR Code</option>
                  <option value="bank_transfer">Bank Account Transfer</option>
                </select>
              </div>
            </div>

            {/* Payment Date */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wide">Payment Date *</label>
              <input
                type="date"
                name="paymentDate"
                value={formData.paymentDate}
                onChange={handleChange}
                className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-white outline-none transition"
                required
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wide">Ledger Remarks</label>
              <input
                type="text"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="e.g. Received via GPay, reference ID noted."
                className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-white placeholder-brand-dim/50 outline-none transition"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-brand-border">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-brand-border text-xs font-semibold text-brand-dim hover:text-white hover:bg-brand-border/30 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-brand-emerald hover:bg-emerald-600 disabled:bg-emerald-400 text-xs font-bold text-white shadow-lg shadow-brand-emerald/20 transition"
            >
              {loading ? 'Logging...' : 'Log Repayment'}
            </button>
          </div>
        </form>

      </div>
    </div>,
    document.body
  );
}
