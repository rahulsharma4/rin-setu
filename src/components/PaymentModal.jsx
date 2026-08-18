import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Receipt, ShieldAlert, QrCode, CheckCircle2, Loader2, Wifi, Clock } from 'lucide-react';
import { transactionAPI } from '../api';
import api from '../api';

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

  // ── UPI QR Code State ────────────────────────────────────────────────
  const [qrPhase, setQrPhase] = useState('idle'); // idle | generating | waiting | success | error
  const [qrData, setQrData] = useState(null); // { orderId, upiIntent, amount, keyId }
  const [qrSuccess, setQrSuccess] = useState(null);
  const pollingRef = useRef(null);
  const pollingCountRef = useRef(0);

  const isUpiMode = formData.paymentMode === 'upi';

  // Cleanup polling on unmount/close
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Reset QR when user changes amount or mode
    if (name === 'amount' || name === 'paymentMode') {
      setQrPhase('idle');
      setQrData(null);
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ── Manual Cash Submit ───────────────────────────────────────────────
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

  // ── UPI QR Generation ────────────────────────────────────────────────
  const handleGenerateQR = async () => {
    if (!formData.amount || parseFloat(formData.amount) < 1) {
      setError('Please enter a valid repayment amount first.');
      return;
    }
    setError('');
    setQrPhase('generating');

    try {
      const res = await api.post('transactions/generate-qr', {
        loanId,
        customerId,
        borrowerName: customerName,
        amount: parseFloat(formData.amount),
        paymentType: formData.paymentType,
        notes: formData.notes,
      });
      setQrData(res.data);
      setQrPhase('waiting');
      startPolling(res.data.qrCodeId);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to generate QR code.';
      const code = err.response?.data?.code;
      setError(msg);
      if (code === 'GATEWAY_NOT_CONFIGURED') {
        setQrPhase('not_configured');
      } else {
        setQrPhase('error');
      }
    }
  };

  // ── Poll for payment confirmation ─────────────────────────────────────
  const startPolling = (orderId) => {
    pollingCountRef.current = 0;
    pollingRef.current = setInterval(async () => {
      pollingCountRef.current += 1;
      // Stop after 5 minutes (60 polls × 5s)
      if (pollingCountRef.current > 180) {
        clearInterval(pollingRef.current);
        setQrPhase('timeout');
        return;
      }
      try {
        const res = await api.get(`transactions/check-status/${orderId}`);
        if (res.data.status === 'captured') {
          clearInterval(pollingRef.current);
          setQrSuccess({ amount: res.data.amount || formData.amount });
          setQrPhase('success');
          onRefresh();
        }
      } catch (_) {
        // Polling errors are non-critical, keep trying
      }
    }, 5000);
  };

  // ── UPI QR Renderer (SVG-based, no external lib) ─────────────────────
  // We render the UPI intent URL as a clickable link AND provide a simple
  // visual mock QR since we want to avoid relying on an external QR library
  // that may not be installed yet. After install, this can be swapped for
  // the actual QR component.
  const renderQRContent = () => {
    if (qrPhase === 'generating') {
      return (
        <div className="flex flex-col items-center justify-center py-10 space-y-3">
          <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
          <p className="text-xs text-brand-dim">Generating secure payment QR...</p>
        </div>
      );
    }

    if (qrPhase === 'waiting' && qrData) {
      return (
        <div className="flex flex-col items-center space-y-4">
          {/* QR Placeholder + UPI link */}
          <div className="w-52 h-52 bg-white rounded-2xl p-3 flex items-center justify-center shadow-lg shadow-black/20 border-2 border-brand-accent/30 relative">
            {/* Visual QR frame pattern */}
            <div className="w-full h-full border-4 border-gray-900 rounded-xl flex items-center justify-center relative overflow-hidden">
              <div className="hidden">
                {Array.from({ length: 64 }).map((_, i) => (
                  <div key={i} className={`${Math.random() > 0.5 ? 'bg-gray-900' : 'bg-transparent'}`} />
                ))}
              </div>
              <a
                href={qrData.qrImageUrl}
                className="z-10 flex flex-col items-center text-center"
                title="Click to open UPI app on this device"
              >
                <img src={qrData.qrImageUrl} alt="Razorpay UPI payment QR" className="w-36 h-36 object-contain" />
                <span className="text-[9px] font-bold text-gray-900 mt-1">Tap to Pay</span>
                <span className="text-[8px] text-gray-600">₹{parseFloat(formData.amount).toLocaleString('en-IN')}</span>
              </a>
            </div>
            {/* Animated pulse ring */}
            <div className="absolute inset-0 rounded-2xl border-2 border-brand-accent/50 animate-ping opacity-30" />
          </div>

          <div className="text-center space-y-1">
            <p className="text-xs font-bold text-brand-text dark:text-white">
              ₹{parseFloat(formData.amount).toLocaleString('en-IN')} — Scan with any UPI App
            </p>
            <p className="text-[10px] text-brand-dim">GPay • PhonePe • Paytm • Any UPI</p>
          </div>

          {/* Waiting indicator */}
          <div className="flex items-center space-x-2 px-4 py-2 bg-brand-amber/10 border border-brand-amber/30 rounded-xl">
            <Wifi className="w-4 h-4 text-brand-amber animate-pulse" />
            <span className="text-[10px] font-semibold text-brand-amber">Waiting for payment confirmation...</span>
          </div>

          <p className="text-[9px] text-brand-dim text-center">
            Entry will be recorded automatically once payment is received.
          </p>

          {/* Manual fallback */}
          <button
            type="button"
            onClick={() => { clearInterval(pollingRef.current); setQrPhase('idle'); }}
            className="text-[10px] text-brand-dim underline hover:text-white transition"
          >
            Cancel / Switch to manual entry
          </button>
        </div>
      );
    }

    if (qrPhase === 'success') {
      return (
        <div className="flex flex-col items-center py-8 space-y-4">
          <div className="w-20 h-20 rounded-full bg-brand-emerald/10 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-brand-emerald" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-base font-bold text-brand-emerald">Payment Confirmed! ✅</p>
            <p className="text-xs text-brand-dim">₹{parseFloat(qrSuccess?.amount || formData.amount).toLocaleString('en-IN')} received via UPI</p>
            <p className="text-[10px] text-brand-dim">Loan ledger updated automatically.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-brand-emerald hover:bg-emerald-600 text-xs font-bold text-white shadow-lg shadow-brand-emerald/20 transition"
          >
            Close
          </button>
        </div>
      );
    }

    if (qrPhase === 'timeout') {
      return (
        <div className="flex flex-col items-center py-8 space-y-3">
          <Clock className="w-8 h-8 text-brand-amber" />
          <p className="text-xs font-semibold text-brand-amber text-center">QR Code has expired (15 min limit).</p>
          <button type="button" onClick={() => setQrPhase('idle')} className="text-xs text-brand-accent underline">Generate new QR</button>
        </div>
      );
    }

    if (qrPhase === 'not_configured') {
      return (
        <div className="p-4 bg-brand-amber/10 border border-brand-amber/30 rounded-xl space-y-2">
          <p className="text-xs font-bold text-brand-amber">⚙️ Payment Gateway Not Set Up</p>
          <p className="text-[10px] text-brand-dim leading-relaxed">
            Please go to <strong className="text-brand-text dark:text-white">Settings → Payment Settings</strong> and enter your Razorpay API Key ID, API Key Secret, and Webhook Secret to enable UPI QR auto-payment.
          </p>
          <button type="button" onClick={() => setQrPhase('idle')} className="text-[10px] text-brand-accent underline">Switch to manual mode</button>
        </div>
      );
    }

    return null;
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="w-full max-w-lg bg-brand-card border border-brand-border rounded-2xl shadow-2xl animate-slide-up my-auto overflow-hidden">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-bg/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-emerald/10 flex items-center justify-center text-brand-emerald">
              <Receipt className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-brand-text dark:text-white">Record Repayment Receipt</h2>
          </div>
          <button type="button" onClick={onClose} className="text-brand-dim hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Borrower badge */}
          <div className="bg-brand-bg/50 border border-brand-border p-3.5 rounded-xl">
            <span className="text-[9px] uppercase font-bold text-brand-dim">Active Borrower File</span>
            <p className="text-sm font-semibold text-brand-text dark:text-white mt-0.5">{customerName}</p>
          </div>

          {error && (
            <div className="flex items-center space-x-2 p-3 bg-brand-rose/10 border border-brand-rose/20 rounded-xl text-brand-rose text-xs font-semibold">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ── UPI Active Phase: show QR content, hide form ── */}
          {isUpiMode && qrPhase !== 'idle' ? (
            <div className="min-h-[200px]">
              {renderQRContent()}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Amount */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wide">Repayment Amount (Rupiya) *</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="e.g. 5000"
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white placeholder-brand-dim/50 outline-none transition"
                  required
                  min="1"
                  step="0.01"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Payment Type */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wide">Allocate Payment To *</label>
                  <select name="paymentType" value={formData.paymentType} onChange={handleChange}
                    className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-3 py-2.5 text-xs text-brand-text dark:text-white outline-none transition" required>
                    <option value="both">Waterfall (Byaj + Asal)</option>
                    <option value="interest">Interest Only (Byaj)</option>
                    <option value="principal">Principal Only (Asal)</option>
                  </select>
                </div>

                {/* Payment Mode */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wide">Payment Mode *</label>
                  <select name="paymentMode" value={formData.paymentMode} onChange={handleChange}
                    className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-3 py-2.5 text-xs text-brand-text dark:text-white outline-none transition" required>
                    <option value="cash">Cash (Nokad)</option>
                    <option value="upi">📱 UPI Auto QR (Razorpay)</option>
                    <option value="online">Online / Manual UPI</option>
                    <option value="bank_transfer">Bank Account Transfer</option>
                  </select>
                </div>
              </div>

              {/* Payment Date (hidden for UPI auto mode) */}
              {!isUpiMode && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wide">Payment Date *</label>
                  <input type="date" name="paymentDate" value={formData.paymentDate} onChange={handleChange}
                    className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white outline-none transition" required />
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wide">Ledger Remarks</label>
                <input type="text" name="notes" value={formData.notes} onChange={handleChange}
                  placeholder="e.g. Received in office, reference ID noted."
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white placeholder-brand-dim/50 outline-none transition" />
              </div>

              {/* UPI info banner */}
              {isUpiMode && (
                <div className="flex items-start space-x-2.5 p-3.5 bg-brand-accent/10 border border-brand-accent/30 rounded-xl">
                  <QrCode className="w-4 h-4 text-brand-accent mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-brand-accent">UPI Auto-Pay Mode</p>
                    <p className="text-[10px] text-brand-dim leading-relaxed mt-0.5">
                      A QR code will be generated. When the borrower scans and pays, the entry is logged automatically. No manual input required.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-brand-border">
                <button type="button" onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-brand-border text-xs font-semibold text-brand-dim hover:text-white hover:bg-brand-border/30 transition">
                  Cancel
                </button>

                {isUpiMode ? (
                  <button type="button" onClick={handleGenerateQR}
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-brand-accent hover:bg-brand-accent/80 text-xs font-bold text-white shadow-lg shadow-brand-accent/20 transition">
                    <QrCode className="w-4 h-4" />
                    <span>Generate Payment QR</span>
                  </button>
                ) : (
                  <button type="submit" disabled={loading}
                    className="px-5 py-2.5 rounded-xl bg-brand-emerald hover:bg-emerald-600 disabled:bg-emerald-400 text-xs font-bold text-white shadow-lg shadow-brand-emerald/20 transition">
                    {loading ? 'Logging...' : 'Log Repayment'}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
