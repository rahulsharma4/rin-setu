import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { 
  Loader2, 
  QrCode, 
  ArrowUpRight, 
  CheckCircle, 
  ShieldAlert, 
  Percent, 
  Lock
} from 'lucide-react';

// Create a standalone instance of axios or use raw requests because this is a public unauthenticated page
const API_BASE = `${window.API_BASE || 'http://localhost:5001'}/api/`;
const publicApi = axios.create({
  baseURL: API_BASE,
});

export default function PublicPaymentPage() {
  const { loanId } = useParams();
  const [searchParams] = useSearchParams();
  const requestedAmount = searchParams.get('am') || '';

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [amount, setAmount] = useState(requestedAmount);
  const [utrNumber, setUtrNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPublicDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await publicApi.get(`public/pay-details/${loanId}`);
      setDetails(res.data);
      if (!requestedAmount) {
        setAmount(res.data.nextDueAmount || res.data.totalOutstanding || '');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load payment details. Please check the URL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicDetails();
  }, [loanId]);

  const handleSubmitReference = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    if (!utrNumber || utrNumber.trim().length < 6) {
      alert('Please enter a valid Transaction UTR / Ref Number.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const res = await publicApi.post('public/submit-p2p-reference', {
        loanId,
        amount: Number(amount),
        referenceNumber: utrNumber.trim()
      });

      setSuccess(res.data.message || 'Reference number submitted successfully! Verification pending approval by lender.');
      setUtrNumber('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit payment reference.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center space-y-4 select-none font-sans">
        <Loader2 className="w-10 h-10 text-brand-accent animate-spin" />
        <p className="text-xs text-brand-dim font-bold uppercase tracking-wider animate-pulse-soft">Loading Payment Details...</p>
      </div>
    );
  }

  if (error && !details) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4 font-sans select-none">
        <div className="max-w-md w-full bg-brand-card border border-brand-border rounded-2xl p-6 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6 text-red-500" />
          </div>
          <h2 className="text-base font-bold text-brand-text dark:text-white uppercase tracking-wider">Invalid Payment Link</h2>
          <p className="text-xs text-brand-dim leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  // Generate UPI String
  const upiDisplayName = details?.upiName || details?.lenderBusinessName || 'RinSetu Repayment';
  const upiLink = details?.upiId ? `upi://pay?pa=${details.upiId}&pn=${encodeURIComponent(upiDisplayName)}&am=${amount || '0'}&cu=INR` : '';
  const qrImageUrl = upiLink ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiLink)}` : '';

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col justify-between p-4 relative overflow-hidden font-sans select-none">
      {/* Background ambient color wash */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-pink-500/5 blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-md w-full mx-auto my-auto space-y-5 relative z-10">
        
        {/* Brand header */}
        <div className="flex items-center justify-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl shadow-lg shadow-brand-accent/25 flex items-center justify-center overflow-hidden bg-transparent border border-brand-border/10">
            <img src="/Logo.png" alt="RinSetu Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-lg font-black text-brand-text dark:text-white tracking-tight">Rin<span className="text-brand-accent">Setu</span></span>
        </div>

        {/* Payment Card */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-2xl space-y-5">
          
          {/* Header */}
          <div className="text-center pb-4 border-b border-brand-border/40 space-y-2">
            <span className="text-[9px] uppercase font-bold text-brand-emerald tracking-widest block bg-brand-emerald/10 px-3 py-1 rounded-full w-fit mx-auto mb-1">Direct VPA UPI payment (0% Fee)</span>
            <div>
              <h3 className="text-base font-black text-brand-text dark:text-white">{details?.borrowerName}</h3>
              <p className="text-[10px] text-brand-dim">Agreement File: <strong className="text-brand-text dark:text-white font-extrabold">{details?.loanNumber}</strong></p>
            </div>
            
            {/* Live Dues display */}
            <div className="grid grid-cols-2 gap-2.5 pt-2 text-left">
              <div className="bg-brand-bg/50 border border-brand-border/60 rounded-xl p-2.5">
                <span className="text-[8px] font-bold text-brand-dim uppercase tracking-wider block">Total Remaining</span>
                <span className="text-xs font-extrabold text-brand-text dark:text-white">₹{details?.totalOutstanding?.toLocaleString('en-IN') || '0'}</span>
              </div>
              <div className="bg-brand-bg/50 border border-brand-border/60 rounded-xl p-2.5">
                <span className="text-[8px] font-bold text-brand-dim uppercase tracking-wider block">Next Installment Dues</span>
                <span className="text-xs font-extrabold text-brand-emerald">₹{details?.nextDueAmount?.toLocaleString('en-IN') || '0'}</span>
              </div>
            </div>
            {details?.nextDueDate && (
              <p className="text-[9px] text-brand-dim text-right font-semibold">
                Due Date: {new Date(details.nextDueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            )}
          </div>

          {/* Form / Success States */}
          {success ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-brand-emerald" />
              </div>
              <div className="space-y-1.5 px-2">
                <h3 className="text-sm font-black text-brand-text dark:text-white uppercase tracking-wider">UTR Submitted!</h3>
                <p className="text-xs text-brand-dim leading-relaxed">{success}</p>
              </div>
              <div className="text-[9px] text-brand-dim pt-2">
                Aap is page ko close kar sakte hain. Verification update hote hi notification send kiya jayega.
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitReference} className="space-y-4">
              
              {/* Error Alert */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold px-4 py-3 rounded-xl text-center">
                  {error}
                </div>
              )}

              {/* Amount Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider block">Repayment Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount to pay"
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white outline-none transition"
                />
              </div>

              {/* QR and Pay Link */}
              {amount && parseFloat(amount) > 0 && (
                <div className="space-y-4 py-2 text-center animate-fade-in">
                  <div className="bg-white p-3 rounded-2xl w-fit mx-auto shadow-md border border-slate-100">
                    <img src={qrImageUrl} alt="UPI Payment QR" className="w-40 h-40 mx-auto" />
                  </div>

                  {/* Direct payment link on Mobile devices */}
                  <div className="px-2">
                    <a
                      href={upiLink}
                      className="w-full py-2.5 bg-brand-emerald hover:bg-emerald-600 active:bg-emerald-700 text-xs font-bold text-white rounded-xl shadow-md shadow-brand-emerald/15 transition flex items-center justify-center space-x-1.5"
                    >
                      <ArrowUpRight className="w-4 h-4 text-white" />
                      <span>Pay via PhonePe / GPay / Paytm</span>
                    </a>
                  </div>

                  <div className="border-t border-brand-border/40 my-4" />

                  {/* UTR Input */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider block">Enter 12-Digit Transaction UTR Number *</label>
                    <input
                      type="text"
                      maxLength="12"
                      required
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 423456789012"
                      className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white placeholder-brand-dim/35 outline-none transition font-mono"
                    />
                    <p className="text-[9px] text-brand-dim leading-normal mt-1.5">
                      💡 QR code scan karke payment karne ke baad, screen par aane wale 12-digit UTR/Ref Number ko yahan submit karein.
                    </p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              {amount && parseFloat(amount) > 0 && (
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-brand-accent hover:bg-indigo-600 disabled:bg-indigo-400 text-xs font-bold text-white rounded-xl shadow-lg shadow-brand-accent/25 transition flex items-center justify-center space-x-1"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting Reference...</span>
                    </>
                  ) : (
                    <span>Submit Payment UTR</span>
                  )}
                </button>
              )}
            </form>
          )}

          {/* Secure disclaimer */}
          <div className="flex items-center justify-center space-x-2 text-[9px] text-brand-dim border-t border-brand-border/40 pt-4">
            <Lock className="w-3 h-3 text-brand-emerald" />
            <span>Direct P2P bank-to-bank ledger clearing. No processing charges.</span>
          </div>
        </div>

        {/* Lender name bottom tag */}
        <p className="text-center text-[10px] text-brand-dim">
          Requested by: <span className="text-brand-text dark:text-white font-bold">{details?.lenderBusinessName}</span>
        </p>
      </div>

      {/* Footer copyright */}
      <div className="text-center text-[9px] text-brand-dim py-4 select-none">
        &copy; {new Date().getFullYear()} RinSetu Secure Payment Services. All rights reserved.
      </div>
    </div>
  );
}
