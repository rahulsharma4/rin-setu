import React from 'react';
import { RefreshCw, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function RefundPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-brand-accent/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-brand-emerald/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-3xl glass-panel rounded-3xl border border-brand-border bg-brand-card p-8 md:p-10 shadow-2xl relative z-10 space-y-6">
        <button 
          onClick={() => navigate('/login')}
          className="flex items-center space-x-2 text-xs font-bold text-brand-accent hover:underline uppercase tracking-wider outline-none"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Login</span>
        </button>

        <div className="flex items-center space-x-3 border-b border-brand-border/60 pb-5">
          <div className="w-10 h-10 rounded-xl bg-brand-accent/10 flex items-center justify-center text-brand-accent">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-brand-text dark:text-white">Cancellation & Refund Policy</h1>
            <p className="text-[10px] text-brand-dim font-bold uppercase mt-0.5">Last Updated: August 27, 2026</p>
          </div>
        </div>

        <div className="space-y-4 text-xs leading-relaxed text-brand-dim">
          <p>
            Thank you for choosing <strong>RinSetu</strong>. We want to ensure you have a transparent experience with our SaaS payment subscription plans. Please read our Cancellation and Refund terms below:
          </p>

          <h3 className="text-sm font-bold text-brand-text dark:text-white pt-2">1. Subscription Cancellations</h3>
          <p>
            Admins can cancel their RinSetu subscription renewals at any time directly through the Billing dashboard. 
            Upon cancellation, your license remains active with full dashboard access until the end of your current active billing cycle. No further automatic renewals will occur.
          </p>

          <h3 className="text-sm font-bold text-brand-text dark:text-white pt-2">2. 7-Day Refund Policy</h3>
          <p>
            If you are not satisfied with your subscription, you are eligible to request a full refund within **7 days** of your initial plan purchase. 
            Refund requests made after the 7-day window are not eligible for a refund.
          </p>

          <h3 className="text-sm font-bold text-brand-text dark:text-white pt-2">3. Refund Processing</h3>
          <p>
            To request a refund, please send an email to <strong className="text-brand-accent">rahulbhardwaz2k1@gmail.com</strong> containing your account credentials and payment invoice receipt. 
            Once approved, refunds are processed electronically and will be credited back to your original payment method (bank account/UPI/credit card) within **5 to 7 working days**.
          </p>
        </div>
      </div>
    </div>
  );
}
