import React, { useState, useEffect } from 'react';
import api from '../api';
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
  Unlock,
  Settings,
  Calendar,
  CreditCard,
  Edit3,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SuperAdminDashboard() {
  const { token, impersonate } = useAuth();
  
  const [stats, setStats] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [activeTab, setActiveTab] = useState('tenants'); // 'tenants' | 'plans'

  // Onboard form state
  const [form, setForm] = useState({
    username: '',
    password: '',
    name: '',
    businessName: ''
  });
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  // Plan CRUD form state
  const [planForm, setPlanForm] = useState({
    id: '',
    name: '',
    price: '',
    durationDays: 30,
    maxBorrowers: -1,
    featuresText: '',
    isActive: true,
  });

  // Tenant Subscription Override Modal state
  const [subModalTenant, setSubModalTenant] = useState(null);
  const [subForm, setSubForm] = useState({
    subscriptionPlan: '',
    renewalDate: '',
    isFreeAccess: false,
    customPrice: '',
    subscriptionStatus: 'trial',
  });

  // Confirmation Modal
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleteBusinessName, setDeleteBusinessName] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, tenantsRes, plansRes] = await Promise.all([
        api.get('superadmin/stats'),
        api.get('superadmin/tenants'),
        api.get('superadmin/plans')
      ]);
      
      setStats(statsRes.data);
      setTenants(tenantsRes.data);
      setPlans(plansRes.data);
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
      
      const res = await api.post('superadmin/tenants', form);
      
      setFormSuccess(res.data.message);
      setForm({ username: '', password: '', name: '', businessName: '' });
      
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
      await api.delete(`superadmin/tenants/${deleteConfirmId}`);
      
      setDeleteConfirmId(null);
      setDeleteBusinessName('');
      
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
      await api.put(
        `superadmin/tenants/${tenantId}/status`, 
        { status: newStatus }
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
      const res = await api.post(`superadmin/impersonate/${tenantId}`, {});
      
      const { token: impersonatedToken, admin: impersonatedAdmin } = res.data;
      impersonate(impersonatedToken, impersonatedAdmin);
    } catch (err) {
      setError(err.response?.data?.message || 'Tenant impersonation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Plan CRUD Handlers
  const handlePlanFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPlanForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePlanSubmit = async (e) => {
    e.preventDefault();
    if (!planForm.name || planForm.price === '') {
      alert('Plan name aur price zaroori hain.');
      return;
    }
    const payload = {
      name: planForm.name,
      price: Number(planForm.price),
      durationDays: Number(planForm.durationDays),
      maxBorrowers: Number(planForm.maxBorrowers),
      features: planForm.featuresText.split('\n').map(f => f.trim()).filter(Boolean),
      isActive: planForm.isActive,
    };
    try {
      setActionLoading(true);
      if (planForm.id) {
        await api.put(`superadmin/plans/${planForm.id}`, payload);
      } else {
        await api.post('superadmin/plans', payload);
      }
      setPlanForm({ id: '', name: '', price: '', durationDays: 30, maxBorrowers: -1, featuresText: '', isActive: true });
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Plan save failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditPlan = (plan) => {
    setPlanForm({
      id: plan._id,
      name: plan.name,
      price: plan.price,
      durationDays: plan.durationDays,
      maxBorrowers: plan.maxBorrowers,
      featuresText: (plan.features || []).join('\n'),
      isActive: plan.isActive,
    });
  };

  const handleDeletePlan = async (id) => {
    if (!window.confirm('Kya aap pakka is subscription plan ko delete karna chahte hain?')) return;
    try {
      setActionLoading(true);
      await api.delete(`superadmin/plans/${id}`);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete plan.');
    } finally {
      setActionLoading(false);
    }
  };

  // Subscription Override Handlers
  const handleOpenSubModal = (tenant) => {
    setSubModalTenant(tenant);
    setSubForm({
      subscriptionPlan: tenant.subscriptionPlan?._id || tenant.subscriptionPlan || '',
      renewalDate: tenant.renewalDate ? new Date(tenant.renewalDate).toISOString().split('T')[0] : '',
      isFreeAccess: !!tenant.isFreeAccess,
      customPrice: tenant.customPrice !== undefined && tenant.customPrice !== null ? tenant.customPrice : '',
      subscriptionStatus: tenant.subscriptionStatus || 'trial',
    });
  };

  const handleSubFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSubForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await api.put(`superadmin/tenants/${subModalTenant._id}/subscription`, {
        subscriptionPlan: subForm.subscriptionPlan,
        renewalDate: subForm.renewalDate,
        isFreeAccess: subForm.isFreeAccess,
        customPrice: subForm.customPrice === '' ? '' : Number(subForm.customPrice),
        subscriptionStatus: subForm.subscriptionStatus,
      });
      setSubModalTenant(null);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Subscription override failed.');
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

      {/* Tabs */}
      <div className="flex border-b border-brand-border/40">
        <button
          onClick={() => setActiveTab('tenants')}
          className={`pb-3 px-6 text-sm font-bold border-b-2 transition ${
            activeTab === 'tenants' 
              ? 'border-brand-accent text-white font-extrabold' 
              : 'border-transparent text-brand-dim hover:text-white'
          }`}
        >
          Lender Tenants
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`pb-3 px-6 text-sm font-bold border-b-2 transition ${
            activeTab === 'plans' 
              ? 'border-brand-accent text-white font-extrabold' 
              : 'border-transparent text-brand-dim hover:text-white'
          }`}
        >
          Subscription Pricing Plans
        </button>
      </div>

      {activeTab === 'tenants' ? (
        /* TAB 1: Tenants List & Onboarding Form */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Tenant Directory Table */}
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
                    <th className="pb-3.5">Subscription Info</th>
                    <th className="pb-3.5 text-center">Status</th>
                    <th className="pb-3.5 text-center">Borrowers</th>
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
                          <div className="text-[9px] text-brand-dim font-mono mt-0.5">ID: {t.username}</div>
                        </td>
                        <td className="py-4 font-semibold">{t.name}</td>
                        <td className="py-4">
                          {t.isFreeAccess ? (
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20 flex items-center w-fit space-x-1">
                              <ShieldCheck className="w-3 h-3" />
                              <span>Free Unlimited Access</span>
                            </span>
                          ) : (
                            <div className="space-y-1">
                              <div className="flex items-center space-x-1.5">
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                                  t.subscriptionStatus === 'trial' ? 'bg-brand-amber/10 text-brand-amber' : 
                                  t.subscriptionStatus === 'active' ? 'bg-brand-emerald/10 text-brand-emerald' : 
                                  'bg-brand-rose/10 text-brand-rose'
                                }`}>
                                  {t.subscriptionStatus}
                                </span>
                                <span className="text-[10px] font-extrabold text-brand-text dark:text-slate-200">
                                  {t.subscriptionPlan?.name || 'Trial Plan'}
                                </span>
                              </div>
                              <div className="text-[9px] text-brand-dim font-medium">
                                Renewal: {t.renewalDate ? new Date(t.renewalDate).toLocaleDateString('en-IN') : 'None'}
                              </div>
                              {t.customPrice && (
                                <div className="text-[8px] font-bold text-brand-accent">
                                  Custom Rate: ₹{t.customPrice}/mo
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.status === 'Suspended' ? 'bg-brand-rose/10 text-brand-rose' : 'bg-brand-emerald/10 text-brand-emerald'
                          }`}>
                            {t.status || 'Active'}
                          </span>
                        </td>
                        <td className="py-4 text-center font-extrabold">{t.customerCount}</td>
                        <td className="py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenSubModal(t)}
                            className="p-1.5 rounded-lg border border-brand-border text-brand-accent hover:text-white hover:bg-brand-accent transition mr-2"
                            title="Manage Subscription Billing"
                            disabled={actionLoading}
                          >
                            <Settings className="w-3.5 h-3.5" />
                          </button>
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

          {/* Onboarding Form */}
          <div className="glass-panel border border-brand-border bg-brand-card rounded-2xl shadow-2xl p-6 h-fit space-y-6">
            <div>
              <h3 className="text-md font-bold text-brand-text dark:text-white">Onboard New Tenant</h3>
              <p className="text-[10px] text-brand-dim font-medium mt-0.5">Register a new money lending company account on this SaaS.</p>
            </div>

            <form onSubmit={handleOnboardSubmit} className="space-y-4">
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
      ) : (
        /* TAB 2: Pricing Plans Management */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Plans Directory List */}
          <div className="lg:col-span-2 glass-panel border border-brand-border bg-brand-card rounded-2xl shadow-2xl p-6 space-y-6">
            <div>
              <h3 className="text-md font-bold text-brand-text dark:text-white">Global Pricing Plans</h3>
              <p className="text-[10px] text-brand-dim font-medium mt-0.5">Manage the available monthly subscription plans shown to tenants.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plans.length === 0 ? (
                <p className="text-xs text-brand-dim py-4 text-center col-span-2">No plans configured yet. Create one on the right form.</p>
              ) : (
                plans.map(p => (
                  <div key={p._id} className="p-5 rounded-2xl border border-brand-border/60 bg-brand-bg/50 relative overflow-hidden flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-extrabold text-brand-text dark:text-white">{p.name}</h4>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${p.isActive ? 'bg-brand-emerald/10 text-brand-emerald' : 'bg-brand-rose/10 text-brand-rose'}`}>
                            {p.isActive ? 'Active Plan' : 'Draft'}
                          </span>
                        </div>
                        <p className="text-xl font-black text-brand-text dark:text-white">₹{p.price}</p>
                      </div>
                      <div className="text-[10px] text-brand-dim">
                        Duration: {p.durationDays} Days • Limit: {p.maxBorrowers === -1 ? 'Unlimited Borrowers' : `${p.maxBorrowers} Borrowers`}
                      </div>
                      <ul className="text-[10px] text-brand-dim space-y-1 pt-2 border-t border-brand-border/30">
                        {p.features?.map((f, i) => (
                          <li key={i} className="flex items-center space-x-1.5">
                            <span className="w-1 h-1 bg-brand-accent rounded-full shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-2 border-t border-brand-border/30">
                      <button
                        type="button"
                        onClick={() => handleEditPlan(p)}
                        className="p-1.5 rounded-lg border border-brand-border text-brand-accent hover:text-white hover:bg-brand-accent transition"
                        title="Edit Plan Settings"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePlan(p._id)}
                        className="p-1.5 rounded-lg border border-brand-border text-brand-rose hover:text-white hover:bg-brand-rose transition"
                        title="Delete Plan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Plan Form */}
          <div className="glass-panel border border-brand-border bg-brand-card rounded-2xl shadow-2xl p-6 h-fit space-y-6">
            <div>
              <h3 className="text-md font-bold text-brand-text dark:text-white">
                {planForm.id ? 'Modify Plan Settings' : 'Create Pricing Plan'}
              </h3>
              <p className="text-[10px] text-brand-dim font-medium mt-0.5">Define billing prices, borrower limits, and features.</p>
            </div>

            <form onSubmit={handlePlanSubmit} className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider block">Plan Name</label>
                <input
                  type="text"
                  name="name"
                  value={planForm.name}
                  onChange={handlePlanFormChange}
                  placeholder="e.g. Basic Starter Plan"
                  required
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white outline-none transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Price */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider block">Plan Price (₹)</label>
                  <input
                    type="number"
                    name="price"
                    value={planForm.price}
                    onChange={handlePlanFormChange}
                    placeholder="e.g. 499"
                    required
                    min="0"
                    className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white outline-none transition"
                  />
                </div>
                {/* Duration */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider block">Billing Days</label>
                  <input
                    type="number"
                    name="durationDays"
                    value={planForm.durationDays}
                    onChange={handlePlanFormChange}
                    required
                    min="1"
                    className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white outline-none transition"
                  />
                </div>
              </div>

              {/* Borrower limit */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider block">Max Active Borrowers</label>
                <input
                  type="number"
                  name="maxBorrowers"
                  value={planForm.maxBorrowers}
                  onChange={handlePlanFormChange}
                  required
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white outline-none transition"
                />
                <span className="text-[8px] text-brand-dim block font-semibold mt-1">Select -1 for unlimited borrower records.</span>
              </div>

              {/* Features list */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider block">Features List (1 per line)</label>
                <textarea
                  name="featuresText"
                  value={planForm.featuresText}
                  onChange={handlePlanFormChange}
                  placeholder="e.g.&#10;WhatsApp Receipts&#10;Automatic UPI QRs&#10;Waterfall Book ledger"
                  rows="3"
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white outline-none transition resize-none"
                />
              </div>

              {/* Is Active Toggle */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={planForm.isActive}
                  onChange={handlePlanFormChange}
                  className="w-4 h-4 rounded text-brand-accent bg-brand-bg border-brand-border focus:ring-0 focus:ring-offset-0"
                />
                <label htmlFor="isActive" className="text-[10px] font-bold text-brand-dim uppercase tracking-wider select-none cursor-pointer">
                  Activate plan for selection
                </label>
              </div>

              {/* Submit / Reset buttons */}
              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-brand-accent hover:bg-indigo-600 disabled:bg-indigo-400 text-xs font-extrabold text-white transition flex items-center justify-center space-x-1.5"
                >
                  {planForm.id ? 'Update Settings' : 'Create Pricing Plan'}
                </button>
                {planForm.id && (
                  <button
                    type="button"
                    onClick={() => setPlanForm({ id: '', name: '', price: '', durationDays: 30, maxBorrowers: -1, featuresText: '', isActive: true })}
                    className="px-4 py-2.5 rounded-xl border border-brand-border text-xs text-brand-dim hover:text-white transition"
                  >
                    Reset
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subscription Override Modal */}
      {subModalTenant && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-brand-card border border-brand-border rounded-2xl shadow-2xl overflow-hidden p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border/40">
              <h3 className="text-md font-bold text-brand-text dark:text-white uppercase tracking-wider flex items-center space-x-1.5">
                <Settings className="w-5 h-5 text-brand-accent" />
                <span>Override Subscription settings</span>
              </h3>
              <button
                onClick={() => setSubModalTenant(null)}
                className="text-brand-dim hover:text-white text-xs font-bold"
              >
                Close
              </button>
            </div>

            <div className="bg-brand-bg/50 border border-brand-border p-3.5 rounded-xl">
              <span className="text-[9px] uppercase font-bold text-brand-dim">Active Lender Tenant</span>
              <p className="text-sm font-semibold text-brand-text dark:text-white mt-0.5">{subModalTenant.businessName}</p>
            </div>

            <form onSubmit={handleSubSubmit} className="space-y-4">
              
              {/* Select Subscription Plan */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider block">Assigned Pricing Plan</label>
                <select
                  name="subscriptionPlan"
                  value={subForm.subscriptionPlan}
                  onChange={handleSubFormChange}
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent rounded-xl px-3 py-2.5 text-xs text-brand-text dark:text-white outline-none transition"
                >
                  <option value="">Default Trial / No Plan</option>
                  {plans.map(p => (
                    <option key={p._id} value={p._id}>{p.name} (₹{p.price}/mo)</option>
                  ))}
                </select>
              </div>

              {/* Renewal Date */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider block">Next Renewal Expiry Date</label>
                <input
                  type="date"
                  name="renewalDate"
                  value={subForm.renewalDate}
                  onChange={handleSubFormChange}
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white outline-none transition"
                />
              </div>

              {/* Custom price override */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider block">Custom Pricing Override (₹)</label>
                <input
                  type="number"
                  name="customPrice"
                  value={subForm.customPrice}
                  onChange={handleSubFormChange}
                  placeholder="Leave empty to use plan default price"
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white outline-none transition"
                />
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider block">Subscription Status</label>
                <select
                  name="subscriptionStatus"
                  value={subForm.subscriptionStatus}
                  onChange={handleSubFormChange}
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent rounded-xl px-3 py-2.5 text-xs text-brand-text dark:text-white outline-none transition"
                >
                  <option value="trial">trial</option>
                  <option value="active">active</option>
                  <option value="expired">expired</option>
                  <option value="suspended">suspended</option>
                </select>
              </div>

              {/* Free Access Override */}
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="isFreeAccess"
                  name="isFreeAccess"
                  checked={subForm.isFreeAccess}
                  onChange={handleSubFormChange}
                  className="w-4 h-4 rounded text-brand-accent bg-brand-bg border-brand-border focus:ring-0 focus:ring-offset-0"
                />
                <label htmlFor="isFreeAccess" className="text-[10px] font-bold text-brand-dim uppercase tracking-wider select-none cursor-pointer">
                  Grant Permanent Free Access (Bypass billing checks)
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-brand-border/40">
                <button
                  type="button"
                  onClick={() => setSubModalTenant(null)}
                  className="px-4 py-2 rounded-xl border border-brand-border text-xs font-semibold text-brand-dim hover:text-white hover:bg-brand-border/40 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-brand-accent hover:bg-indigo-600 text-xs font-bold text-white shadow-lg transition"
                >
                  {actionLoading ? 'Updating...' : 'Save Settings Override'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
