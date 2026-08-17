import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Settings as SettingsIcon, 
  MessageSquare, 
  ListOrdered, 
  CheckCircle2, 
  AlertCircle,
  FileCheck,
  Download,
  ShieldCheck,
  Terminal,
  RefreshCw,
  FolderSync,
  Wallet,
  Key,
  Copy,
  ExternalLink,
  Webhook,
  Eye,
  EyeOff
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { token, admin, updateAdmin } = useAuth();
  
  // Tab State: 'config' | 'audit' | 'backup' | 'profile' | 'payment'
  const [activeTab, setActiveTab] = useState('config');

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [cronLoading, setCronLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Profile Edit State
  const [profileData, setProfileData] = useState({
    businessName: admin?.businessName || '',
    name: admin?.name || '',
    username: admin?.username || '',
    password: ''
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // ── Gateway (Razorpay) Settings State ───────────────────────────────
  const [gatewayData, setGatewayData] = useState({
    gatewayKeyId: '',
    gatewayKeySecret: '',
    gatewayWebhookSecret: '',
  });
  const [gatewayInfo, setGatewayInfo] = useState(null); // { isConfigured, webhookUrl }
  const [gatewayLoading, setGatewayLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchGatewaySettings = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/auth/gateway-settings', { headers });
      setGatewayData(prev => ({ ...prev, gatewayKeyId: res.data.gatewayKeyId, gatewayWebhookSecret: res.data.gatewayWebhookSecret }));
      setGatewayInfo({ isConfigured: res.data.isConfigured, webhookUrl: res.data.webhookUrl });
    } catch (_) {}
  };

  const handleSaveGateway = async (e) => {
    e.preventDefault();
    setGatewayLoading(true);
    setSuccess('');
    setError('');
    try {
      await axios.put('http://localhost:5001/api/auth/gateway-settings', gatewayData, { headers });
      setSuccess('Payment gateway settings saved! Your Razorpay UPI QR integration is now active.');
      setTimeout(() => setSuccess(''), 4000);
      fetchGatewaySettings();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save gateway settings.');
    } finally {
      setGatewayLoading(false);
    }
  };

  const handleCopyWebhook = () => {
    if (gatewayInfo?.webhookUrl) {
      navigator.clipboard.writeText(gatewayInfo.webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    if (admin) {
      setProfileData({
        businessName: admin.businessName || '',
        name: admin.name || '',
        username: admin.username || '',
        password: ''
      });
    }
  }, [admin]);

  // Priority dragging/moving state
  const [priority, setPriority] = useState([]);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudits, setLoadingAudits] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setSuccess('');
    setError('');

    try {
      const res = await axios.put(
        'http://localhost:5001/api/auth/profile', 
        profileData, 
        { headers }
      );
      updateAdmin(res.data.token, res.data.admin);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update admin profile details.');
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5001/api/settings', { headers });
      setSettings(res.data);
      setPriority(res.data.waterfallPriority || []);
    } catch {
      setError('Failed to load settings from server.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setLoadingAudits(true);
    try {
      const res = await axios.get('http://localhost:5001/api/settings/audit-logs', { headers });
      setAuditLogs(res.data);
    } catch {
      setError('Failed to load audit trail logs.');
    } finally {
      setLoadingAudits(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs();
    }
    if (activeTab === 'payment') {
      fetchGatewaySettings();
    }
  }, [activeTab]);

  const handleTemplateChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      whatsappTemplates: {
        ...prev.whatsappTemplates,
        [key]: value
      }
    }));
  };

  const handleMoveUp = (idx) => {
    if (idx === 0) return;
    const next = [...priority];
    const temp = next[idx];
    next[idx] = next[idx - 1];
    next[idx - 1] = temp;
    setPriority(next);
  };

  const handleMoveDown = (idx) => {
    if (idx === priority.length - 1) return;
    const next = [...priority];
    const temp = next[idx];
    next[idx] = next[idx + 1];
    next[idx + 1] = temp;
    setPriority(next);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setSuccess('');
    setError('');

    try {
      const payload = {
        ...settings,
        waterfallPriority: priority
      };
      await axios.put('http://localhost:5001/api/settings', payload, { headers });
      setSuccess('Settings updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to update settings.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleTriggerCron = async () => {
    setCronLoading(true);
    setSuccess('');
    setError('');
    try {
      const res = await axios.post('http://localhost:5001/api/settings/trigger-cron', {}, { headers });
      setSuccess(res.data.message || 'Auto check & late fee calculations processed successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to trigger manual accruals.');
    } finally {
      setCronLoading(false);
    }
  };

  const handleDownloadBackup = () => {
    window.open(`http://localhost:5001/api/settings/backup?token=${token}`, '_blank');
  };

  const handleExportCSV = (type) => {
    window.open(`http://localhost:5001/api/settings/export/${type}?token=${token}`, '_blank');
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stepLabels = {
    dueCharges: 'Due Charges (Lending Fee / Process Fee)',
    lateCharges: 'Late Penalty Charges (Fines)',
    interest: 'Accrued Interest (Byaj Component)',
    principal: 'Accrued Principal (Asal Component)'
  };

  return (
    <div className="space-y-7 animate-fade-in max-w-4xl pb-10">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">System settings</h1>
          <p className="text-xs text-brand-dim mt-1.5 font-medium">Waterfall payment priority structures, message templates, and automated workflows.</p>
        </div>
      </div>

      {/* Tabs Selector Navigation */}
      <div className="flex border-b border-brand-border/60 pb-px space-x-6 text-xs font-bold">
        <button 
          onClick={() => setActiveTab('config')}
          className={`pb-3 relative transition outline-none ${
            activeTab === 'config' ? 'text-brand-accent' : 'text-brand-dim hover:text-white'
          }`}
        >
          <span>Repayment & WhatsApp Rules</span>
          {activeTab === 'config' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-accent animate-scale-x" />}
        </button>
        
        <button 
          onClick={() => setActiveTab('audit')}
          className={`pb-3 relative transition outline-none ${
            activeTab === 'audit' ? 'text-brand-accent' : 'text-brand-dim hover:text-white'
          }`}
        >
          <span>Security Audit Trail</span>
          {activeTab === 'audit' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-accent animate-scale-x" />}
        </button>

        <button 
          onClick={() => setActiveTab('backup')}
          className={`pb-3 relative transition outline-none ${
            activeTab === 'backup' ? 'text-brand-accent' : 'text-brand-dim hover:text-white'
          }`}
        >
          <span>Backup & Data Exports</span>
          {activeTab === 'backup' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-accent animate-scale-x" />}
        </button>

        <button 
          onClick={() => setActiveTab('profile')}
          className={`pb-3 relative transition outline-none ${
            activeTab === 'profile' ? 'text-brand-accent' : 'text-brand-dim hover:text-white'
          }`}
        >
          <span>Admin Profile Settings</span>
          {activeTab === 'profile' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-accent animate-scale-x" />}
        </button>

        <button 
          onClick={() => setActiveTab('payment')}
          className={`pb-3 relative transition outline-none ${
            activeTab === 'payment' ? 'text-brand-accent' : 'text-brand-dim hover:text-white'
          }`}
        >
          <span>💳 Payment Settings</span>
          {activeTab === 'payment' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-accent animate-scale-x" />}
        </button>
      </div>

      {success && (
        <div className="flex items-center space-x-2 p-3 bg-brand-emerald/10 border border-brand-emerald/20 rounded-xl text-brand-emerald text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center space-x-2 p-3 bg-brand-rose/10 border border-brand-rose/20 rounded-xl text-brand-rose text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Tab Config: Waterfall & WhatsApp templates */}
      {activeTab === 'config' && (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Waterfall Config */}
          <div className="glass-panel border border-brand-border rounded-2xl p-6 space-y-4">
            <div className="flex items-center space-x-2 border-b border-brand-border pb-3">
              <ListOrdered className="w-4 h-4 text-brand-accent" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Configurable Repayment Waterfall</h3>
            </div>
            <p className="text-[11px] text-brand-dim leading-relaxed">
              Drag/Move elements to decide the priority sequence when repayments are logged. Payments will clear components from top-to-bottom automatically.
            </p>

            <div className="space-y-2.5">
              {priority.map((step, idx) => (
                <div key={step} className="flex items-center justify-between bg-brand-bg/50 border border-brand-border px-4 py-3 rounded-xl">
                  <span className="text-xs text-white font-semibold">{idx + 1}. {stepLabels[step]}</span>
                  <div className="flex space-x-1">
                    <button
                      type="button"
                      onClick={() => handleMoveUp(idx)}
                      disabled={idx === 0}
                      className="px-2 py-1 bg-brand-border hover:bg-brand-border/80 disabled:opacity-30 rounded text-[10px] text-white font-bold transition"
                    >
                      ▲ Up
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveDown(idx)}
                      disabled={idx === priority.length - 1}
                      className="px-2 py-1 bg-brand-border hover:bg-brand-border/80 disabled:opacity-30 rounded text-[10px] text-white font-bold transition"
                    >
                      ▼ Down
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* WhatsApp Automation Toggles */}
          <div className="glass-panel border border-brand-border rounded-2xl p-6 space-y-4">
            <div className="flex items-center space-x-2 border-b border-brand-border pb-3">
              <MessageSquare className="w-4 h-4 text-brand-emerald" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">WhatsApp Rules Automation</h3>
            </div>

            <div className="flex items-center justify-between bg-brand-bg/50 border border-brand-border px-4 py-4 rounded-xl">
              <div>
                <p className="text-xs font-bold text-white">Toggle WhatsApp Automated Reminders</p>
                <span className="text-[10px] text-brand-dim block mt-0.5">Toggle automation draft webhooks or templated notifications.</span>
              </div>
              <button
                type="button"
                onClick={() => setSettings(prev => ({ ...prev, whatsappAutomation: !prev.whatsappAutomation }))}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  settings.whatsappAutomation ? 'bg-brand-emerald text-white' : 'bg-brand-border text-brand-dim'
                }`}
              >
                {settings.whatsappAutomation ? 'Automation ON' : 'Automation OFF'}
              </button>
            </div>

            {/* Templates Input fields */}
            <div className="space-y-4 pt-2">
              <h4 className="text-[10px] font-bold text-white uppercase tracking-wide">Automated Message Templates</h4>
              
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-brand-dim uppercase">Upcoming Dues Draft</label>
                <textarea
                  value={settings.whatsappTemplates?.upcomingDue}
                  onChange={(e) => handleTemplateChange('upcomingDue', e.target.value)}
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white outline-none transition h-16 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-brand-dim uppercase">Due Today Message</label>
                <textarea
                  value={settings.whatsappTemplates?.dueToday}
                  onChange={(e) => handleTemplateChange('dueToday', e.target.value)}
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white outline-none transition h-16 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-brand-dim uppercase">Payment Received Receipt</label>
                <textarea
                  value={settings.whatsappTemplates?.paymentReceived}
                  onChange={(e) => handleTemplateChange('paymentReceived', e.target.value)}
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white outline-none transition h-16 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-brand-dim uppercase">Overdue Warning Alert</label>
                <textarea
                  value={settings.whatsappTemplates?.overdueReminder}
                  onChange={(e) => handleTemplateChange('overdueReminder', e.target.value)}
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white outline-none transition h-16 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Manual Automation Job Trigger */}
          <div className="glass-panel border border-brand-border rounded-2xl p-6 space-y-4">
            <div className="flex items-center space-x-2 border-b border-brand-border pb-3">
              <RefreshCw className="w-4 h-4 text-brand-amber animate-spin" style={{ animationDuration: '4s' }} />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Manual System Automation Checks</h3>
            </div>
            <p className="text-[11px] text-brand-dim leading-relaxed">
              Force-run late fee calculations and overdue status checks immediately. This scans the database and applies pending charges without waiting for midnight.
            </p>
            <button
              type="button"
              onClick={handleTriggerCron}
              disabled={cronLoading}
              className="flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl bg-brand-amber/15 hover:bg-brand-amber/25 text-brand-amber border border-brand-amber/30 text-xs font-bold transition w-full"
            >
              <span>{cronLoading ? 'Processing Accruals...' : 'Trigger Late Fee & Overdue Accrual Now'}</span>
            </button>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saveLoading}
              className="flex items-center space-x-1.5 px-6 py-3.5 rounded-xl bg-brand-accent hover:bg-indigo-600 disabled:opacity-40 text-xs font-bold text-white shadow-lg shadow-brand-accent/25 transition-all duration-200"
            >
              <Save className="w-4 h-4" />
              <span>{saveLoading ? 'Saving Configurations...' : 'Save System Settings'}</span>
            </button>
          </div>
        </form>
      )}

      {/* 2. Tab Audit: Security logs trail list */}
      {activeTab === 'audit' && (
        <div className="glass-panel border border-brand-border rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-brand-border pb-3">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-brand-rose" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">System Audit Trail Ledger</h3>
            </div>
            <button 
              onClick={fetchAuditLogs}
              disabled={loadingAudits}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-brand-border text-[10px] font-bold text-brand-dim hover:text-white transition"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{loadingAudits ? 'Syncing...' : 'Reload Trail'}</span>
            </button>
          </div>

          {loadingAudits ? (
            <div className="h-48 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-brand-dim">
              No audit logs captured yet.
            </div>
          ) : (
            <div className="overflow-x-auto border border-brand-border rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-brand-border bg-brand-bg/50 text-[9px] uppercase font-bold text-brand-dim">
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">User</th>
                    <th className="p-3.5">Action</th>
                    <th className="p-3.5">Summary Details</th>
                    <th className="p-3.5">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/40 font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-brand-border/10 transition text-brand-dim hover:text-white">
                      <td className="p-3.5 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-3.5 font-bold text-white">{log.userId}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${
                          log.action?.includes('CREATED') ? 'bg-brand-emerald/10 text-brand-emerald border-brand-emerald/20' :
                          log.action?.includes('REVERSED') || log.action?.includes('DELETED') ? 'bg-brand-rose/10 text-brand-rose border-brand-rose/20' :
                          'bg-brand-accent/10 text-brand-accent border-brand-accent/20'
                        }`}>
                          {log.action?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3.5 font-sans font-medium">{log.details}</td>
                      <td className="p-3.5">{log.ipAddress || '127.0.0.1'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 3. Tab Backup: CSV & JSON Backup Exports */}
      {activeTab === 'backup' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* JSON Full Backup */}
          <div className="glass-panel border border-brand-border rounded-2xl p-6 space-y-4">
            <div className="flex items-center space-x-2 border-b border-brand-border pb-3">
              <FolderSync className="w-4 h-4 text-brand-accent" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">JSON Full DB Backup</h3>
            </div>
            
            <p className="text-[11px] text-brand-dim leading-relaxed">
              Downloads a complete snapshot of all collections (Borrowers directory, Loan schedule sheets, timelines, payment receipt items, and audit trails) in a structured JSON file.
            </p>

            <button
              onClick={handleDownloadBackup}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-brand-accent hover:bg-indigo-600 text-xs font-bold text-white shadow shadow-brand-accent/20 transition w-full justify-center"
            >
              <Download className="w-4 h-4" />
              <span>Download JSON Database Dump</span>
            </button>
          </div>

          {/* CSV Exporters Directory */}
          <div className="glass-panel border border-brand-border rounded-2xl p-6 space-y-4">
            <div className="flex items-center space-x-2 border-b border-brand-border pb-3">
              <FileCheck className="w-4 h-4 text-brand-emerald" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">CSV Data Portability</h3>
            </div>

            <p className="text-[11px] text-brand-dim leading-relaxed">
              Export specific sheets to edit inside Microsoft Excel or Google Sheets.
            </p>

            <div className="space-y-2 pt-1.5">
              <button
                onClick={() => handleExportCSV('customers')}
                className="flex items-center justify-between px-4 py-2.5 bg-brand-bg hover:bg-brand-border/40 border border-brand-border rounded-xl text-xs font-bold text-brand-text dark:text-white transition w-full"
              >
                <span>Export Borrowers Directory</span>
                <span className="text-[10px] text-brand-emerald uppercase">Download CSV</span>
              </button>
              <button
                onClick={() => handleExportCSV('loans')}
                className="flex items-center justify-between px-4 py-2.5 bg-brand-bg hover:bg-brand-border/40 border border-brand-border rounded-xl text-xs font-bold text-brand-text dark:text-white transition w-full"
              >
                <span>Export Loan Agreements Sheet</span>
                <span className="text-[10px] text-brand-emerald uppercase">Download CSV</span>
              </button>
              <button
                onClick={() => handleExportCSV('payments')}
                className="flex items-center justify-between px-4 py-2.5 bg-brand-bg hover:bg-brand-border/40 border border-brand-border rounded-xl text-xs font-bold text-brand-text dark:text-white transition w-full"
              >
                <span>Export Repayments Timeline Log</span>
                <span className="text-[10px] text-brand-emerald uppercase">Download CSV</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* 4. Tab Profile: Admin Profile settings */}
      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSave} className="space-y-6">
          <div className="glass-panel border border-brand-border rounded-2xl p-6 space-y-4">
            <div className="flex items-center space-x-2 border-b border-brand-border pb-3">
              <ShieldCheck className="w-4 h-4 text-brand-accent" />
              <h3 className="text-xs font-bold text-brand-text dark:text-white uppercase tracking-wider">Admin Profile & Login Credentials</h3>
            </div>
            
            <p className="text-[11px] text-brand-dim leading-relaxed">
              Edit your money lending business/company name, leader admin name, username, and secure password.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              
              {/* Business Name */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider">Lending Business / Company Name</label>
                <input
                  type="text"
                  value={profileData.businessName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, businessName: e.target.value }))}
                  placeholder="e.g. RinSetu Micro Finance"
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white outline-none transition"
                  required
                />
              </div>

              {/* Leader/Admin Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider">Leader / Admin Name</label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white outline-none transition"
                  required
                />
              </div>

              {/* Username */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider">Login Username</label>
                <input
                  type="text"
                  value={profileData.username}
                  onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="e.g. rahul_admin"
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white outline-none transition"
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider">Change Password (Leave blank to keep current password)</label>
                <input
                  type="password"
                  value={profileData.password}
                  onChange={(e) => setProfileData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter new secure password"
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white outline-none transition"
                />
              </div>

            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={profileLoading}
              className="flex items-center space-x-1.5 px-6 py-3.5 rounded-xl bg-brand-accent hover:bg-indigo-600 disabled:opacity-40 text-xs font-bold text-white shadow-lg shadow-brand-accent/25 transition-all duration-200"
            >
              <Save className="w-4 h-4" />
              <span>{profileLoading ? 'Updating Profile...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ── Tab: Payment Gateway Settings ─────────────────────────────── */}
      {activeTab === 'payment' && (
        <form onSubmit={handleSaveGateway} className="space-y-6">

          {/* Status Banner */}
          {gatewayInfo && (
            <div className={`flex items-center space-x-3 p-4 rounded-2xl border ${
              gatewayInfo.isConfigured
                ? 'bg-brand-emerald/10 border-brand-emerald/30 text-brand-emerald'
                : 'bg-brand-amber/10 border-brand-amber/30 text-brand-amber'
            }`}>
              <Wallet className="w-5 h-5 shrink-0" />
              <div>
                <p className="text-xs font-bold">
                  {gatewayInfo.isConfigured ? '✅ Razorpay UPI QR is Active & Ready' : '⚙️ Payment Gateway Not Configured'}
                </p>
                <p className="text-[10px] mt-0.5 opacity-80">
                  {gatewayInfo.isConfigured
                    ? 'Borrowers can now pay via UPI QR Code and entries will be logged automatically.'
                    : 'Fill in your Razorpay credentials below to enable automatic UPI payment recording.'}
                </p>
              </div>
            </div>
          )}

          {/* Main Credentials Card */}
          <div className="glass-panel border border-brand-border rounded-2xl p-6 space-y-5">
            <div className="flex items-center space-x-2 border-b border-brand-border pb-3">
              <Key className="w-4 h-4 text-brand-accent" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Razorpay API Credentials</h3>
            </div>

            {/* Setup Steps */}
            <div className="p-4 bg-brand-bg/60 border border-brand-border rounded-xl space-y-2 text-[10px] text-brand-dim leading-relaxed">
              <p className="font-bold text-brand-text dark:text-white text-[11px]">📋 How to get your Razorpay credentials:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Go to <strong className="text-brand-accent">razorpay.com</strong> → Create a business account (free) → Complete KYC</li>
                <li>Navigate to <strong>Dashboard → Settings → API Keys → Generate Key</strong></li>
                <li>Copy the <strong>Key ID</strong> (starts with <code>rzp_</code>) and <strong>Key Secret</strong> and paste below</li>
                <li>Go to <strong>Settings → Webhooks → Add New Webhook</strong></li>
                <li>Paste your unique Webhook URL (shown below) and select the <strong>payment.captured</strong> event</li>
                <li>Copy the <strong>Webhook Secret</strong> from Razorpay and paste it below</li>
              </ol>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Key ID */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider">Razorpay Key ID *</label>
                <input
                  type="text"
                  value={gatewayData.gatewayKeyId}
                  onChange={(e) => setGatewayData(prev => ({ ...prev, gatewayKeyId: e.target.value }))}
                  placeholder="rzp_live_xxxxxxxxxxxxxxxx"
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white placeholder-brand-dim/40 outline-none transition font-mono"
                />
              </div>

              {/* Key Secret */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider">Razorpay Key Secret *</label>
                <div className="relative">
                  <input
                    type={showSecret ? 'text' : 'password'}
                    value={gatewayData.gatewayKeySecret}
                    onChange={(e) => setGatewayData(prev => ({ ...prev, gatewayKeySecret: e.target.value }))}
                    placeholder="Enter new secret (leave blank to keep existing)"
                    className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl pl-4 pr-10 py-2.5 text-xs text-brand-text dark:text-white placeholder-brand-dim/40 outline-none transition font-mono"
                  />
                  <button type="button" onClick={() => setShowSecret(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-dim hover:text-white transition">
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Webhook Secret */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider">Razorpay Webhook Secret</label>
                <input
                  type="password"
                  value={gatewayData.gatewayWebhookSecret}
                  onChange={(e) => setGatewayData(prev => ({ ...prev, gatewayWebhookSecret: e.target.value }))}
                  placeholder="Paste Webhook Secret from Razorpay dashboard"
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white placeholder-brand-dim/40 outline-none transition font-mono"
                />
                <p className="text-[9px] text-brand-dim">This is used to verify that payment notifications truly come from Razorpay (prevents fraud).</p>
              </div>
            </div>
          </div>

          {/* Webhook URL Card */}
          {gatewayInfo?.webhookUrl && (
            <div className="glass-panel border border-brand-border rounded-2xl p-6 space-y-4">
              <div className="flex items-center space-x-2 border-b border-brand-border pb-3">
                <Webhook className="w-4 h-4 text-brand-accent" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Your Unique Webhook URL</h3>
              </div>
              <p className="text-[10px] text-brand-dim leading-relaxed">
                Copy this URL and add it to your <strong className="text-brand-text dark:text-white">Razorpay → Settings → Webhooks</strong> panel. 
                This is unique to your account — Razorpay will call it automatically whenever a borrower pays.
              </p>
              <div className="flex items-center space-x-2">
                <code className="flex-1 text-[10px] font-mono bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-brand-accent overflow-x-auto whitespace-nowrap">
                  {gatewayInfo.webhookUrl}
                </code>
                <button
                  type="button"
                  onClick={handleCopyWebhook}
                  className={`flex items-center space-x-1.5 px-4 py-3 rounded-xl border text-[10px] font-bold transition ${
                    copied
                      ? 'bg-brand-emerald/20 border-brand-emerald/40 text-brand-emerald'
                      : 'border-brand-border text-brand-dim hover:text-white hover:bg-brand-border/30'
                  }`}
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={gatewayLoading}
              className="flex items-center space-x-1.5 px-6 py-3.5 rounded-xl bg-brand-accent hover:bg-indigo-600 disabled:opacity-40 text-xs font-bold text-white shadow-lg shadow-brand-accent/25 transition-all duration-200"
            >
              <Save className="w-4 h-4" />
              <span>{gatewayLoading ? 'Saving...' : 'Save Payment Gateway Settings'}</span>
            </button>
          </div>

        </form>
      )}

    </div>
  );
}
