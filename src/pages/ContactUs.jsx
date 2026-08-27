import React from 'react';
import { Mail, Phone, MapPin, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ContactUs() {
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
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-brand-text dark:text-white">Contact Us</h1>
            <p className="text-[10px] text-brand-dim font-bold uppercase mt-0.5">Customer Support Details</p>
          </div>
        </div>

        <div className="space-y-6 text-xs text-brand-dim">
          <p className="leading-relaxed">
            If you have any questions, feedback, technical issues, or cancellation inquiries, please feel free to reach out to our customer support team. We will get back to you within 24 to 48 hours.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Email card */}
            <div className="glass-panel p-5 rounded-2xl border border-brand-border space-y-2.5 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-xl bg-brand-accent/10 flex items-center justify-center text-brand-accent">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-brand-text dark:text-white uppercase text-[10px]">Email Us</h4>
                <p className="mt-1 text-brand-accent font-semibold">rahulbhardwaz2k1@gmail.com</p>
              </div>
            </div>

            {/* Phone card */}
            <div className="glass-panel p-5 rounded-2xl border border-brand-border space-y-2.5 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 flex items-center justify-center text-brand-emerald">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-brand-text dark:text-white uppercase text-[10px]">Call Us</h4>
                <p className="mt-1 text-brand-emerald font-semibold">+91 78914 49044</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
