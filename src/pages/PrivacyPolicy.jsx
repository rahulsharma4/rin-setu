import React from 'react';
import { Shield, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
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
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Privacy Policy</h1>
            <p className="text-[10px] text-brand-dim font-bold uppercase mt-0.5">Last Updated: August 27, 2026</p>
          </div>
        </div>

        <div className="space-y-4 text-xs leading-relaxed text-brand-dim">
          <p>
            Welcome to <strong>RinSetu</strong>. We value your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you use our micro-lending CRM SaaS application.
          </p>

          <h3 className="text-sm font-bold text-white pt-2">1. Information We Collect</h3>
          <p>
            We collect information that you provide directly to us when registering a tenant account or using the portal, including:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Admin Information:</strong> Name, business name, phone number, email address, username, and encrypted password credentials.</li>
            <li><strong>Borrower Information:</strong> Name, contact details, loan amounts, transaction ledger, and collateral descriptions provided to manage customer agreements.</li>
            <li><strong>Integration Parameters:</strong> Merchant API configuration keys (e.g. Razorpay Key ID, UPI ID) used strictly to verify P2P collections.</li>
          </ul>

          <h3 className="text-sm font-bold text-white pt-2">2. How We Use Your Information</h3>
          <p>
            Your information is used solely to run database operations, manage loan repayment schedules, record audit trails, send transactional collection messages (WhatsApp alerts), and complete payment verification flows. We do NOT sell, trade, or rent user data to third parties.
          </p>

          <h3 className="text-sm font-bold text-white pt-2">3. Data Security</h3>
          <p>
            We use industry-standard SSL encryption and secure cloud servers to host and protect ledger transactions. However, please remember that no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
          </p>

          <h3 className="text-sm font-bold text-white pt-2">4. Your Rights</h3>
          <p>
            Lenders and tenant administrators can access, edit, or delete their profile information and customer data directly from the system settings panel at any time.
          </p>

          <h3 className="text-sm font-bold text-white pt-2">5. Contact Support</h3>
          <p>
            If you have questions about this policy, please reach out to us at <strong className="text-brand-accent">support@rinsetu.com</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
