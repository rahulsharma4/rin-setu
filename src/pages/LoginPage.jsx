import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, User, Percent, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      setError('Username aur password dono zaroori hain.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(form.username, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Backend credentials check karein.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center relative overflow-hidden p-4">
      {/* Background Glow Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-brand-accent/8 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-brand-emerald/5 blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] rounded-full bg-indigo-900/20 blur-[100px] pointer-events-none" />

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(99,102,241,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
      />

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Logo Card */}
        <div className="text-center mb-8 space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-accent to-indigo-400 shadow-2xl shadow-brand-accent/30 mx-auto">
            <Percent className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-brand-text dark:text-white tracking-tight">
              Rin<span className="text-brand-accent">Setu</span>
            </h1>
            <p className="text-sm text-brand-dim mt-1.5 font-medium">Private Lending & Collection Management</p>
          </div>
        </div>

        {/* Login Card */}
        <div className="glass-panel rounded-2xl border border-brand-border bg-brand-card p-8 shadow-2xl shadow-black/40">
          {/* Card Header */}
          <div className="flex items-center space-x-2.5 mb-7">
            <div className="w-8 h-8 rounded-lg bg-brand-accent/10 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-brand-accent" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-brand-text dark:text-white leading-none">Security Portal</h2>
              <span className="text-[10px] text-brand-dim font-medium leading-none block mt-1">Authorized Access Only</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold px-4 py-3 rounded-lg text-center">
                {error}
              </div>
            )}

            {/* Username Input */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-brand-text dark:text-white uppercase tracking-wider block">Username</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-brand-dim" />
                <input
                  type="text"
                  name="username"
                  required
                  placeholder="admin username"
                  value={form.username}
                  onChange={handleChange}
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent rounded-xl pl-10 pr-4 py-2.5 text-sm text-brand-text dark:text-white placeholder-brand-dim/40 outline-none transition"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-brand-text dark:text-white uppercase tracking-wider block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-brand-dim" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent rounded-xl pl-10 pr-12 py-2.5 text-sm text-brand-text dark:text-white placeholder-brand-dim/40 outline-none transition"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-brand-dim hover:text-brand-accent transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-brand-accent hover:bg-indigo-600 disabled:bg-indigo-400 text-sm font-bold text-white shadow-lg shadow-brand-accent/20 transition flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Access Terminal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Note */}
        <p className="text-center text-[10px] text-brand-dim/60 mt-6 leading-relaxed">
          Sirf authorized admin hi is portal ka upyog kar sakta hai.
          <br />Credentials ke liye system administrator se sampark karein.
        </p>

        {/* Bottom tag & Compliance Links */}
        <div className="text-center mt-6 space-y-3">
          <p className="text-[10px] text-brand-dim/40 font-medium">
            RinSetu v1.0 — Secure Admin Portal
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 text-[10px] font-bold uppercase tracking-wider text-brand-dim/60">
            <button onClick={() => navigate('/privacy-policy')} className="hover:text-brand-accent transition outline-none">Privacy Policy</button>
            <span className="text-brand-border/40">•</span>
            <button onClick={() => navigate('/terms-and-conditions')} className="hover:text-brand-accent transition outline-none">Terms & Conditions</button>
            <span className="text-brand-border/40">•</span>
            <button onClick={() => navigate('/refund-policy')} className="hover:text-brand-accent transition outline-none">Refund Policy</button>
            <span className="text-brand-border/40">•</span>
            <button onClick={() => navigate('/contact-us')} className="hover:text-brand-accent transition outline-none">Contact Us</button>
          </div>
        </div>
      </div>
    </div>
  );
}
