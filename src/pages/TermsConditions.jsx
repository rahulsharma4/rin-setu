import React from 'react';
import { FileText, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TermsConditions() {
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
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-brand-text dark:text-white">Terms & Conditions</h1>
            <p className="text-[10px] text-brand-dim font-bold uppercase mt-0.5">Last Updated: August 27, 2026</p>
          </div>
        </div>

        <div className="space-y-4 text-xs leading-relaxed text-brand-dim">
          <p>
            These Terms & Conditions govern your access to and use of <strong>RinSetu</strong> micro-lending CRM SaaS application. By signing up or logging into the portal, you agree to comply with these terms.
          </p>

          <h3 className="text-sm font-bold text-brand-text dark:text-white pt-2">1. SaaS License & Accounts</h3>
          <p>
            We grant you a non-transferable, non-exclusive license to use the RinSetu portal to manage your private lending logbooks. You are solely responsible for protecting your account credentials and password.
          </p>

          <h3 className="text-sm font-bold text-brand-text dark:text-white pt-2">2. Local Lending Compliances</h3>
          <p>
            RinSetu is a record-keeping CRM software utilities provider. We do NOT act as a bank, NBFC, or direct lender. 
            Lenders (Admins/Tenants) are solely responsible for complying with local regulations, including interest caps, registration certificates, and the Reserve Bank of India (RBI) money-lending rules.
          </p>

          <h3 className="text-sm font-bold text-brand-text dark:text-white pt-2">3. Subscriptions & Fees</h3>
          <p>
            Use of our service requires active subscription payments. Fees are billed on a monthly or yearly cycle. Non-payment of dues may lead to account suspension or limited access to ledger reporting views.
          </p>

          <h3 className="text-sm font-bold text-brand-text dark:text-white pt-2">4. Limitation of Liability</h3>
          <p>
            In no event shall RinSetu, its developers, or parent company be held liable for database loss, recovery mismatches, calculations, or penalties incurred through transaction tracking error defaults. Lenders are advised to regularly backup cashbooks.
          </p>

          <h3 className="text-sm font-bold text-brand-text dark:text-white pt-2">5. Governing Law</h3>
          <p>
            These terms are governed by and construed in accordance with the laws of India. Any disputes arising out of usage shall be subject to the exclusive jurisdiction of the courts in Noida, Uttar Pradesh.
          </p>
        </div>
      </div>
    </div>
  );
}
