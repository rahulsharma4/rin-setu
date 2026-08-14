import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Building2, 
  Users, 
  Coins, 
  PiggyBank, 
  UserPlus, 
  Trash2, 
  FileText, 
  Plus, 
  TrendingUp, 
  ShieldAlert,
  Loader2,
  ExternalLink,
  Lock,
  Unlock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SuperAdminDashboard() {
  const { token, impersonate } = useAuth();
  
  const [stats, setStats] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Onboard form state
  const [form, setForm] = useState({
    username: '',
    password: '',
    name: '',
    businessName: ''
  });
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  // Confirmation Modal
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleteBusinessName, setDeleteBusinessName] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      
      const [statsRes, tenantsRes] = await Promise.all([
        axios.get('http://localhost:5001/api/superadmin/stats', { headers }),
        axios.get('http://localhost:5001/api/superadmin/tenants', { headers })
      ]);
      
      setStats(statsRes.data);
      setTenants(tenantsRes.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Data load karne me prashna hua. backend connection check karein.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const handleFormChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setFormError('');
    setFormSuccess('');
  };

  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password || !form.name || !form.businessName) {
      setFormError('Sabhi fields zaroori hain.');
      return;
    }

    try {
      setActionLoading(true);
      setFormError('');
      setFormSuccess('');
      
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post('http://localhost:5001/api/superadmin/tenants', form, { headers });
      
      setFormSuccess(res.data.message);
      setForm({ username: '', password: '', name: '', businessName: '' });
      
      // Refresh list
      fetchDashboardData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Onboarding failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTenant = async () => {
    if (!deleteConfirmId) return;

    try {
      setActionLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`http://localhost:5001/api/superadmin/tenants/${deleteConfirmId}`, { headers });
      
      setDeleteConfirmId(null);
      setDeleteBusinessName('');
      
      // Refresh list
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to offboard tenant.');
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleToggleStatus = async (tenantId, currentStatus) => {
    const newStatus = currentStatus === 'Suspended' ? 'Active' : 'Suspended';
    const confirmMsg = `Are you sure you want to update this tenant status to ${newStatus}?` + 
      (newStatus === 'Suspended' ? '\nThis will block the lender and all their staff from logging into the portal!' : '');
    
    if (!window.confirm(confirmMsg)) return;

    try {
      setActionLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(
        `http://localhost:5001/api/superadmin/tenants/${tenantId}/status`, 
        { status: newStatus }, 
        { headers }
      );
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update tenant status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleImpersonateTenant = async (tenantId) => {
    try {
      setActionLoading(true);
      setError('');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(`http://localhost:5001/api/superadmin/impersonate/${tenantId}`, {}, { headers });
      
      const { token: impersonatedToken, admin: impersonatedAdmin } = res.data;
      impersonate(impersonatedToken, impersonatedAdmin);
    } catch (err) {
      setError(err.response?.data?.message || 'Tenant impersonation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-brand-accent animate-spin" />
        <p className="text-sm text-brand-dim font-medium">Loading RinSetu SaaS Portfolio...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-text dark:text-white tracking-tight">RinSetu SaaS Command</h1>
          <p className="text-xs text-brand-dim mt-1.5 font-medium">Global platform analytics and money lending tenant management.</p>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-semibold px-6 py-4 rounded-2xl flex items-center space-x-3">
          <ShieldAlert className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Tenants */}
        <div className="glass-panel p-6 border border-brand-border bg-brand-card rounded-2xl shadow-xl flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-brand-dim uppercase tracking-wider block">Total Active Tenants</span>
            <h2 className="text-3xl font-extrabold text-brand-text dark:text-white leading-none">{stats?.totalTenants || 0}</h2>
            <span className="text-[9px] text-brand-dim font-semibold block">Registered money lending firms</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-accent/10 text-brand-accent flex items-center justify-center shadow-lg shadow-brand-accent/5">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* Total Borrowers */}
        <div className="glass-panel p-6 border border-brand-border bg-brand-card rounded-2xl shadow-xl flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-brand-dim uppercase tracking-wider block">Total Borrowers</span>
            <h2 className="text-3xl font-extrabold text-brand-text dark:text-white leading-none">{stats?.totalCustomers || 0}</h2>
            <span className="text-[9px] text-brand-dim font-semibold block">Accounts across all tenants</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shadow-lg">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Global Disbursed */}
        <div className="glass-panel p-6 border border-brand-border bg-brand-card rounded-2xl shadow-xl flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-brand-dim uppercase tracking-wider block">Capital Disbursed</span>
            <h2 className="text-3xl font-extrabold text-brand-text dark:text-white leading-none">
              ₹{(stats?.totalCapitalDisbursed || 0).toLocaleString('en-IN')}
            </h2>
            <span className="text-[9px] text-brand-emerald font-semibold flex items-center space-x-1">
              <TrendingUp className="w-3 h-3" />
              <span>Total principal lent</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-emerald/10 text-brand-emerald flex items-center justify-center shadow-lg">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        {/* Total Collected */}
        <div className="glass-panel p-6 border border-brand-border bg-brand-card rounded-2xl shadow-xl flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-brand-dim uppercase tracking-wider block">Total Collected</span>
            <h2 className="text-3xl font-extrabold text-brand-text dark:text-white leading-none">
              ₹{(stats?.totalRepaymentsReceived || 0).toLocaleString('en-IN')}
            </h2>
            <span className="text-[9px] text-brand-dim font-semibold block">Total recoveries platform-wide</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shadow-lg">
            <PiggyBank className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Main Split Content Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Tenant Directory Table */}
        <div className="lg:col-span-2 glass-panel border border-brand-border bg-brand-card rounded-2xl shadow-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-md font-bold text-brand-text dark:text-white">Active Tenants Directory</h3>
              <p className="text-[10px] text-brand-dim font-medium mt-0.5">Directory list of active money lending companies using RinSetu.</p>
            </div>
            <span className="bg-brand-accent/15 text-brand-accent text-[10px] font-bold px-3 py-1.5 rounded-lg border border-brand-accent/20">
              {tenants.length} Active Firms
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-border/60 text-[10px] text-brand-dim font-bold uppercase tracking-wider">
                  <th className="pb-3.5">Firm / Business</th>
                  <th className="pb-3.5">Lender Name</th>
                  <th className="pb-3.5">Username</th>
                  <th className="pb-3.5 text-center">Status</th>
                  <th className="pb-3.5 text-center">Borrowers</th>
                  <th className="pb-3.5 text-center">Active Loans</th>
                  <th className="pb-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/30 text-xs text-brand-text dark:text-slate-300">
                {tenants.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-brand-dim font-medium">
                      No active money lending tenants onboarded yet. Use the right form to create one.
                    </td>
                  </tr>
                ) : (
                  tenants.map((t) => (
                    <tr key={t._id} className="hover:bg-brand-bg/40 transition-colors">
                      <td className="py-4">
                        <div className="font-extrabold text-brand-text dark:text-white">{t.businessName}</div>
                        <div className="text-[9px] text-brand-dim font-medium mt-0.5">Joined: {new Date(t.createdAt).toLocaleDateString('en-IN')}</div>
                      </td>
                      <td className="py-4 font-semibold">{t.name}</td>
                      <td className="py-4 font-mono font-bold text-brand-dim">{t.username}</td>
                      <td className="py-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.status === 'Suspended' ? 'bg-brand-rose/10 text-brand-rose' : 'bg-brand-emerald/10 text-brand-emerald'
                        }`}>
                          {t.status || 'Active'}
                        </span>
                      </td>
                      <td className="py-4 text-center font-bold">{t.customerCount}</td>
                      <td className="py-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${t.activeLoans > 0 ? 'bg-indigo-500/10 text-indigo-400' : 'bg-brand-border/40 text-brand-dim'}`}>
                          {t.activeLoans} Active
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(t._id, t.status)}
                          className={`p-1.5 rounded-lg border border-brand-border transition mr-2 ${
                            t.status === 'Suspended' 
                              ? 'text-brand-emerald hover:bg-brand-emerald/90 hover:text-white border-brand-emerald/20' 
                              : 'text-brand-rose hover:bg-brand-rose/90 hover:text-white border-brand-rose/20'
                          }`}
                          title={t.status === 'Suspended' ? 'Activate Tenant' : 'Suspend Tenant'}
                          disabled={actionLoading}
                        >
                          {t.status === 'Suspended' ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleImpersonateTenant(t._id)}
                          className="p-1.5 rounded-lg border border-brand-border text-brand-emerald hover:text-white hover:bg-brand-emerald/90 transition mr-2"
                          title="Access Portal"
                          disabled={actionLoading}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteConfirmId(t._id);
                            setDeleteBusinessName(t.businessName);
                          }}
                          className="p-1.5 rounded-lg border border-brand-border text-brand-rose hover:text-white hover:bg-brand-rose/90 transition"
                          title="Offboard Tenant"
                          disabled={actionLoading}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Onboarding Form */}
        <div className="glass-panel border border-brand-border bg-brand-card rounded-2xl shadow-2xl p-6 h-fit space-y-6">
          <div>
            <h3 className="text-md font-bold text-brand-text dark:text-white">Onboard New Tenant</h3>
            <p className="text-[10px] text-brand-dim font-medium mt-0.5">Register a new money lending company account on this SaaS.</p>
          </div>

          <form onSubmit={handleOnboardSubmit} className="space-y-4">
            
            {/* Form Success/Error Alert */}
            {formSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-brand-emerald text-xs font-semibold px-4 py-3 rounded-xl text-center">
                {formSuccess}
              </div>
            )}
            {formError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold px-4 py-3 rounded-xl text-center">
                {formError}
              </div>
            )}

            {/* Firm name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider block">Firm / Company Name</label>
              <input
                type="text"
                name="businessName"
                value={form.businessName}
                onChange={handleFormChange}
                placeholder="e.g. Jaipur Finance Group"
                required
                className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white outline-none transition"
              />
            </div>

            {/* Admin Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider block">Lender Admin Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleFormChange}
                placeholder="e.g. Ramesh Kumar Sharma"
                required
                className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white outline-none transition"
              />
            </div>

            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider block">System Username</label>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleFormChange}
                placeholder="e.g. jaipur_finance"
                required
                className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white font-mono outline-none transition"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider block">Portal Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleFormChange}
                placeholder="••••••••"
                required
                className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white outline-none transition"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={actionLoading}
              className="w-full py-2.5 rounded-xl bg-brand-accent hover:bg-indigo-600 disabled:bg-indigo-400/50 text-xs font-extrabold text-white shadow-lg shadow-brand-accent/25 transition flex items-center justify-center space-x-1.5"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Onboarding...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Onboard Money Lender</span>
                </>
              )}
            </button>

          </form>
        </div>

      </div>

      {/* Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-brand-card border border-brand-border rounded-2xl shadow-2xl overflow-hidden p-6 space-y-6">
            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-lg bg-brand-rose/10 text-brand-rose flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-brand-text dark:text-white uppercase tracking-wider">Offboard Tenant Account?</h3>
                <p className="text-xs text-brand-dim leading-relaxed">
                  Kya aap pakka **{deleteBusinessName}** ko offboard karna chahte hain?
                </p>
              </div>
            </div>

            <div className="bg-brand-rose/5 border border-brand-rose/20 text-brand-rose text-xs leading-relaxed p-4 rounded-xl">
              ⚠️ **WARNING:** Tenant offboard karne se uske **saare borrowers, active loans, collection statements, cash books, aur setting configuration** database se permanent delete ho jayenge. Yeh action undo nahi kiya ja sakta!
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmId(null);
                  setDeleteBusinessName('');
                }}
                className="px-4 py-2 rounded-xl border border-brand-border text-xs font-semibold text-brand-dim hover:text-white hover:bg-brand-border/40 transition"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTenant}
                className="px-4 py-2 rounded-xl bg-brand-rose hover:bg-red-600 text-xs font-bold text-white shadow-lg transition flex items-center space-x-1.5"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Permanent Wipe & Offboard</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
