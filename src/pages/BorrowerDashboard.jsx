import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
  Loader2, 
  Coins, 
  Calendar, 
  History, 
  CreditCard, 
  User, 
  Lock, 
  LogOut, 
  ArrowUpRight, 
  CheckCircle, 
  QrCode, 
  ShieldAlert, 
  Phone,
  Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function BorrowerDashboard() {
  const { logout, admin } = useAuth();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Active section/tab state: 'loans' | 'history' | 'profile'
  const [activeSection, setActiveSection] = useState('loans');

  // Profile Form States
  const [profileForm, setProfileForm] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Repayment QR Modal State
  const [qrModal, setQrModal] = useState({
    isOpen: false,
    loanId: null,
    amount: '',
    qrCodeId: '',
    qrImageUrl: '',
    polling: false
  });
  const [qrError, setQrError] = useState('');
  const [qrLoading, setQrLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('borrower/dashboard');
      setData(res.data);
      setProfileForm({
        email: res.data.borrower.email || '',
        password: '',
        confirmPassword: ''
      });
      setError('');
    } catch (err) {
      console.error(err);
      setError('Dashboard data load karne me error. Kripya check karein.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Poll for QR payment status
  useEffect(() => {
    let intervalId;
    if (qrModal.isOpen && qrModal.qrCodeId && qrModal.polling) {
      intervalId = setInterval(async () => {
        try {
          const res = await api.get(`borrower/check-status/${qrModal.qrCodeId}`);
          if (res.data.status === 'captured') {
            setQrModal(prev => ({ ...prev, polling: false }));
            setSuccess('Payment successfully completed and verified! 🎉');
            setTimeout(() => {
              setQrModal({ isOpen: false, loanId: null, amount: '', qrCodeId: '', qrImageUrl: '', polling: false });
              setSuccess('');
              fetchDashboardData();
            }, 2500);
          }
        } catch (err) {
          console.error('Error polling payment status:', err);
        }
      }, 3000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [qrModal.isOpen, qrModal.qrCodeId, qrModal.polling]);

  const handleProfileChange = (e) => {
    setProfileForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (profileForm.password && profileForm.password !== profileForm.confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    try {
      setProfileLoading(true);
      setError('');
      setSuccess('');

      await api.put('borrower/profile', {
        email: profileForm.email,
        password: profileForm.password
      });

      setSuccess('Profile updated successfully! ✅');
      setProfileForm(prev => ({ ...prev, password: '', confirmPassword: '' }));
      fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || 'Profile update failed.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleOpenPayModal = (loanId, suggestedAmount = '') => {
    setQrError('');
    setQrModal({
      isOpen: true,
      loanId,
      amount: suggestedAmount,
      qrCodeId: '',
      qrImageUrl: '',
      polling: false
    });
  };

  const handleGenerateQR = async () => {
    if (!qrModal.amount || parseFloat(qrModal.amount) <= 0) {
      setQrError('Please enter a valid amount.');
      return;
    }

    try {
      setQrLoading(true);
      setQrError('');
      const res = await api.post('borrower/generate-qr', {
        loanId: qrModal.loanId,
        amount: Number(qrModal.amount)
      });

      setQrModal(prev => ({
        ...prev,
        qrCodeId: res.data.qrCodeId,
        qrImageUrl: res.data.qrImageUrl,
        polling: true
      }));
    } catch (err) {
      setQrError(err.response?.data?.message || 'Failed to generate repayment QR.');
    } finally {
      setQrLoading(false);
    }
  };

  // Math helper for total remaining dues
  const getOutstandingTotal = () => {
    if (!data?.loans) return 0;
    return data.loans.reduce((acc, l) => {
      const remaining = l.calculations?.totalOutstanding || 0;
      return acc + remaining;
    }, 0);
  };

  const getUpcomingInstallment = () => {
    if (!data?.installments) return null;
    const unpaid = data.installments.find(i => i.status === 'unpaid');
    return unpaid || null;
  };

  if (loading) {
    return (
      <div className="h-screen bg-brand-bg flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-brand-accent animate-spin" />
        <p className="text-sm text-brand-dim font-medium">Loading Borrower Portal...</p>
      </div>
    );
  }

  const getTotalPaid = () => {
    if (!data?.transactions) return 0;
    return data.transactions.reduce((acc, t) => acc + (t.amount || 0), 0);
  };

  const upcomingInst = getUpcomingInstallment();

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8">
      
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-accent/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-brand-emerald/5 blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto w-full space-y-8 relative z-10">
        
        {/* Header Dashboard Nav */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-brand-border/40 gap-4">
          <div>
            <span className="text-[9px] uppercase font-bold text-brand-emerald tracking-widest block">Client Repayment Hub</span>
            <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Welcome, {data?.borrower?.name}
            </h1>
            <p className="text-[11px] text-brand-dim mt-0.5 font-semibold">
              Lender: <span className="text-brand-accent font-extrabold">{data?.lender?.businessName || 'Jaipur Finance'}</span>
            </p>
          </div>
          <button
            onClick={logout}
            className="flex items-center space-x-1.5 px-4 py-2 border border-brand-border bg-brand-card rounded-xl hover:bg-brand-rose/15 hover:border-brand-rose/30 text-brand-dim hover:text-brand-rose text-xs font-semibold transition self-start sm:self-auto"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>

        {/* Global Messages */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-semibold px-6 py-4 rounded-2xl flex items-center space-x-3">
            <ShieldAlert className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-brand-emerald text-sm font-semibold px-6 py-4 rounded-2xl flex items-center space-x-3">
            <CheckCircle className="w-5 h-5" />
            <span>{success}</span>
          </div>
        )}

        {/* KPI Cards Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Outstanding Total */}
          <div className="glass-panel p-6 border border-brand-border bg-brand-card rounded-2xl shadow-xl flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-brand-dim uppercase tracking-wider block">Outstanding Balance</span>
              <h2 className="text-2xl font-black text-brand-text dark:text-white leading-none">
                ₹{getOutstandingTotal().toLocaleString('en-IN')}
              </h2>
              <span className="text-[9px] text-brand-dim font-medium block">Total pending amount</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-brand-accent/10 text-brand-accent flex items-center justify-center shrink-0">
              <Coins className="w-5 h-5" />
            </div>
          </div>

          {/* Next Installment */}
          <div className="glass-panel p-6 border border-brand-border bg-brand-card rounded-2xl shadow-xl flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-brand-dim uppercase tracking-wider block">Next Repayment Due</span>
              <h2 className="text-2xl font-black text-brand-emerald leading-none">
                {upcomingInst ? `₹${upcomingInst.totalAmount.toLocaleString('en-IN')}` : 'No Dues'}
              </h2>
              <span className="text-[9px] text-brand-dim font-medium block">
                {upcomingInst ? `Due on: ${new Date(upcomingInst.dueDate).toLocaleDateString('en-IN')}` : 'All loans settled'}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 text-brand-emerald flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
          </div>

          {/* Total Paid */}
          <div className="glass-panel p-6 border border-brand-border bg-brand-card rounded-2xl shadow-xl flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-brand-dim uppercase tracking-wider block">Total Paid So Far</span>
              <h2 className="text-2xl font-black text-brand-accent leading-none">
                ₹{getTotalPaid().toLocaleString('en-IN')}
              </h2>
              <span className="text-[9px] text-brand-dim font-medium block">Cumulative paid principal & interest</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>

          {/* Phone Helpline */}
          <div className="glass-panel p-6 border border-brand-border bg-brand-card rounded-2xl shadow-xl flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-brand-dim uppercase tracking-wider block">Lender Helpline</span>
              <h2 className="text-lg font-bold text-brand-text dark:text-white leading-none truncate max-w-[140px]">
                {data?.lender?.name}
              </h2>
              <span className="text-[10px] text-brand-accent font-semibold block flex items-center space-x-1 mt-1">
                <Phone className="w-3.5 h-3.5 shrink-0" />
                <span>{data?.lender?.phone}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-brand-border/40">
          <button
            onClick={() => setActiveSection('loans')}
            className={`pb-3 px-6 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
              activeSection === 'loans' 
                ? 'border-brand-accent text-white font-extrabold' 
                : 'border-transparent text-brand-dim hover:text-white'
            }`}
          >
            My Loan Accounts ({data?.loans?.length || 0})
          </button>
          <button
            onClick={() => setActiveSection('history')}
            className={`pb-3 px-6 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
              activeSection === 'history' 
                ? 'border-brand-accent text-white font-extrabold' 
                : 'border-transparent text-brand-dim hover:text-white'
            }`}
          >
            Repayment Ledger
          </button>
          <button
            onClick={() => setActiveSection('profile')}
            className={`pb-3 px-6 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
              activeSection === 'profile' 
                ? 'border-brand-accent text-white font-extrabold' 
                : 'border-transparent text-brand-dim hover:text-white'
            }`}
          >
            Account Credentials Settings
          </button>
        </div>

        {/* Dynamic section rendering */}
        {activeSection === 'loans' ? (
          /* SECTION 1: Active Loans List */
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {!data?.loans || data.loans.length === 0 ? (
                <div className="md:col-span-2 glass-panel p-8 text-center text-brand-dim">
                  Aapke account par koi loan chal raha nahi hai.
                </div>
              ) : (
                data.loans.map(loan => {
                  const remaining = loan.calculations?.totalOutstanding || 0;
                  const loanInsts = data?.installments?.filter(i => i.loanId === loan._id) || [];
                  const instAmount = loanInsts[0]?.totalAmount || 0;
                  
                  return (
                    <div key={loan._id} className="p-6 border border-brand-border bg-brand-card rounded-2xl shadow-2xl relative flex flex-col justify-between space-y-5">
                      
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[9px] uppercase font-bold bg-indigo-500/10 text-indigo-400 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                              {loan.interestType === 'simple' ? 'Simple Interest' : 'Compound Interest'}
                            </span>
                            <h3 className="text-md font-extrabold text-brand-text dark:text-white mt-2">Principal: ₹{loan.principalAmount.toLocaleString('en-IN')}</h3>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            loan.status === 'settled' ? 'bg-brand-emerald/10 text-brand-emerald' : 
                            loan.status === 'overdue' ? 'bg-brand-rose/10 text-brand-rose animate-pulse' : 
                            'bg-brand-accent/10 text-brand-accent'
                          }`}>
                            {loan.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs text-brand-dim font-medium pt-2 border-t border-brand-border/30">
                          <div>
                            <span className="text-[9px] block">Rate of Interest</span>
                            <span className="text-brand-text dark:text-white font-bold">{loan.interestRate}% ({loan.rateType})</span>
                          </div>
                          <div>
                            <span className="text-[9px] block">Remaining Balance</span>
                            <span className="text-brand-text dark:text-white font-bold text-brand-emerald">₹{remaining > 0 ? remaining.toLocaleString('en-IN') : 0}</span>
                          </div>
                          <div>
                            <span className="text-[9px] block">Installment Due</span>
                            <span className="text-brand-text dark:text-white font-bold">₹{instAmount.toLocaleString('en-IN')} / {loan.paymentFrequency}</span>
                          </div>
                          <div>
                            <span className="text-[9px] block">Start Date</span>
                            <span className="text-brand-text dark:text-white font-bold">{new Date(loan.startDate).toLocaleDateString('en-IN')}</span>
                          </div>
                        </div>

                        {loan.remarks && (
                          <div className="text-[10px] italic text-brand-dim/80 bg-brand-bg/50 px-3 py-2 rounded-xl border border-brand-border/30">
                            Notes: {loan.remarks}
                          </div>
                        )}
                      </div>

                      {loan.status !== 'settled' && (
                        <button
                          type="button"
                          onClick={() => handleOpenPayModal(loan._id, instAmount)}
                          className="w-full py-2 bg-brand-accent hover:bg-indigo-600 text-xs font-bold text-white shadow-lg shadow-brand-accent/25 rounded-xl transition flex items-center justify-center space-x-1"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Pay Installment Online</span>
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            
            {/* Installment Breakdown Grid */}
            {data.installments && data.installments.length > 0 && (
              <div className="glass-panel border border-brand-border bg-brand-card rounded-2xl p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-extrabold text-brand-text dark:text-white">Upcoming Repayment Schedule</h3>
                  <p className="text-[10px] text-brand-dim mt-0.5">Details of outstanding and upcoming monthly installment calculations.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-brand-border/60 text-[9px] text-brand-dim uppercase font-bold">
                        <th className="pb-3">Due Date</th>
                        <th className="pb-3 text-right">Installment Amount</th>
                        <th className="pb-3 text-right">Interest Portion</th>
                        <th className="pb-3 text-right">Principal Portion</th>
                        <th className="pb-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border/30 text-brand-text dark:text-slate-300 font-medium">
                      {data.installments.slice(0, 10).map((inst, index) => (
                        <tr key={inst._id} className="hover:bg-brand-bg/30">
                          <td className="py-3 font-mono">{new Date(inst.dueDate).toLocaleDateString('en-IN')}</td>
                          <td className="py-3 text-right text-brand-text dark:text-white">₹{inst.totalAmount.toLocaleString('en-IN')}</td>
                          <td className="py-3 text-right">₹{inst.interestComponent?.toLocaleString('en-IN') || 0}</td>
                          <td className="py-3 text-right">₹{inst.principalComponent?.toLocaleString('en-IN') || 0}</td>
                          <td className="py-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                              inst.status === 'paid' ? 'bg-brand-emerald/10 text-brand-emerald' : 'bg-brand-amber/10 text-brand-amber'
                            }`}>
                              {inst.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : activeSection === 'history' ? (
          /* SECTION 2: Completed Payments List */
          <div className="glass-panel border border-brand-border bg-brand-card rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-sm font-extrabold text-brand-text dark:text-white">Repayment Transaction Ledger</h3>
              <p className="text-[10px] text-brand-dim mt-0.5">Repayment statements received and approved by lender admin.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-brand-border/60 text-[9px] text-brand-dim uppercase font-bold">
                    <th className="pb-3">Payment Date</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3 text-right">Amount</th>
                    <th className="pb-3">Reference / Receipt</th>
                    <th className="pb-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/30 text-brand-text dark:text-slate-300 font-medium">
                  {!data?.transactions || data.transactions.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-6 text-center text-brand-dim">
                        No transactions registered yet.
                      </td>
                    </tr>
                  ) : (
                    data.transactions.map((tx) => (
                      <tr key={tx._id} className="hover:bg-brand-bg/30">
                        <td className="py-3.5 font-mono">{new Date(tx.paymentDate).toLocaleDateString('en-IN')}</td>
                        <td className="py-3.5">
                          <span className="px-1.5 py-0.5 rounded bg-brand-accent/10 text-[9px] font-bold text-brand-accent uppercase">
                            {tx.paymentType}
                          </span>
                        </td>
                        <td className="py-3.5 text-right font-black text-brand-emerald">₹{tx.amount.toLocaleString('en-IN')}</td>
                        <td className="py-3.5 font-mono text-[10px] text-brand-dim truncate max-w-[150px]" title={tx.razorpayPaymentId || 'Cash'}>
                          {tx.razorpayPaymentId ? `Razorpay: ${tx.razorpayPaymentId}` : 'Recorded as Cash'}
                        </td>
                        <td className="py-3.5 text-[10px] text-brand-dim">{tx.notes || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* SECTION 3: Profile settings Form */
          <div className="glass-panel border border-brand-border bg-brand-card rounded-2xl p-6 max-w-xl mx-auto space-y-6">
            <div>
              <h3 className="text-sm font-extrabold text-brand-text dark:text-white flex items-center gap-1.5">
                <Settings className="w-5 h-5 text-brand-accent" />
                <span>Account Access Settings</span>
              </h3>
              <p className="text-[10px] text-brand-dim mt-0.5">Change your portal login email address or update your credentials.</p>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider block">Login Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={profileForm.email}
                  onChange={handleProfileChange}
                  required
                  placeholder="ramesh@test.com"
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white outline-none transition"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider block">New Password (optional)</label>
                <input
                  type="password"
                  name="password"
                  value={profileForm.password}
                  onChange={handleProfileChange}
                  placeholder="Enter at least 6 characters"
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white outline-none transition"
                />
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider block">Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={profileForm.confirmPassword}
                  onChange={handleProfileChange}
                  placeholder="Confirm your password"
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white outline-none transition"
                />
              </div>

              <button
                type="submit"
                disabled={profileLoading}
                className="w-full py-2.5 bg-brand-accent hover:bg-indigo-600 disabled:bg-indigo-400 text-xs font-bold text-white shadow-lg rounded-xl transition"
              >
                {profileLoading ? 'Updating credentials...' : 'Save Settings Override'}
              </button>
            </form>
          </div>
        )}

      </div>

      {/* Dynamic Payment UPI QR code Modal */}
      {qrModal.isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-brand-card border border-brand-border rounded-2xl shadow-2xl p-6 space-y-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border/40">
              <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                <QrCode className="w-5 h-5 text-brand-accent" />
                <span>UPI Repayment QR</span>
              </h3>
              {!qrModal.polling && (
                <button
                  onClick={() => setQrModal({ isOpen: false, loanId: null, amount: '', qrCodeId: '', qrImageUrl: '', polling: false })}
                  className="text-brand-dim hover:text-white text-xs font-bold"
                >
                  Close
                </button>
              )}
            </div>

            {qrError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold px-4 py-3 rounded-xl text-center">
                {qrError}
              </div>
            )}

            {!qrModal.qrImageUrl ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider block">Enter Repayment Amount (₹)</label>
                  <input
                    type="number"
                    value={qrModal.amount}
                    onChange={(e) => setQrModal(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="e.g. 5000"
                    className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white outline-none transition"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleGenerateQR}
                  disabled={qrLoading}
                  className="w-full py-2.5 bg-brand-accent hover:bg-indigo-600 disabled:bg-indigo-400 text-xs font-bold text-white rounded-xl transition flex items-center justify-center space-x-1"
                >
                  {qrLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating QR...</span>
                    </>
                  ) : (
                    <span>Generate Repayment UPI QR</span>
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="bg-white p-3.5 rounded-2xl w-fit mx-auto shadow-xl">
                  {qrModal.qrImageUrl === 'simulated_qr_url' ? (
                    <div className="w-48 h-48 bg-slate-900 flex flex-col items-center justify-center space-y-2.5 rounded-xl border border-dashed border-slate-700">
                      <QrCode className="w-12 h-12 text-indigo-400 animate-pulse" />
                      <p className="text-[9px] text-slate-400 font-semibold px-4 text-center">Simulated QR Code (Dev Mode)</p>
                    </div>
                  ) : (
                    <img src={qrModal.qrImageUrl} alt="Repayment UPI QR" className="w-48 h-48 mx-auto" />
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-black text-white">Amount: ₹{qrModal.amount}</p>
                  <p className="text-[9px] text-brand-dim font-semibold uppercase tracking-wider animate-pulse flex items-center justify-center gap-1.5">
                    <Loader2 className="w-3 h-3 animate-spin text-brand-accent" />
                    <span>Waiting for scan & payment verification...</span>
                  </p>
                </div>
                <div className="bg-brand-bg/50 border border-brand-border p-3 rounded-xl text-[9px] text-brand-dim leading-relaxed">
                  💡 QR code scan karke payment karein. Hamara webhook payment detect karte hi portal ko automatic update kar dega.
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={async () => {
                      // Trigger Simulated Webhook for testing!
                      try {
                        await api.post('webhooks/razorpay/test-webhook-simulate', {
                          qrCodeId: qrModal.qrCodeId,
                          amount: Number(qrModal.amount),
                          loanId: qrModal.loanId,
                          customerId: admin.tenantId ? admin.id : undefined // borrower id
                        });
                        alert('Simulated payment captured webhook sent! Webhook processing in background...');
                      } catch {
                        alert('Simulation endpoint only works in local development environments.');
                      }
                    }}
                    className="flex-1 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[10px] font-bold rounded-lg border border-indigo-500/25 transition"
                  >
                    Simulate Payment Capture
                  </button>
                  <button
                    type="button"
                    onClick={() => setQrModal({ isOpen: false, loanId: null, amount: '', qrCodeId: '', qrImageUrl: '', polling: false })}
                    className="py-2 px-3 border border-brand-border text-brand-dim hover:text-white rounded-lg text-[10px] transition font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="max-w-5xl mx-auto w-full text-center text-[10px] text-brand-dim pt-8 border-t border-brand-border/20 mt-12">
        &copy; {new Date().getFullYear()} RinSetu Client Portal. Secure money lending systems and reports.
      </div>
    </div>
  );
}
