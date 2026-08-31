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
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { token, admin, updateAdmin } = useAuth();
  
  // Tab State: 'config' | 'audit' | 'backup' | 'profile' | 'payment'
  const [activeTab, setActiveTab] = useState('config');

  // Keep the form renderable while tenant settings are being fetched.
  const [settings, setSettings] = useState({
    waterfallPriority: ['dueCharges', 'lateCharges', 'interest', 'principal'],
    whatsappAutomation: true,
    whatsappTemplates: {},
  });
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
    upiId: '',
    upiName: '',
  });
  const [gatewayInfo, setGatewayInfo] = useState(null); // { isConfigured, webhookUrl }
  const [gatewayLoading, setGatewayLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchGatewaySettings = async () => {
    try {
      const res = await api.get('auth/gateway-settings');
      setGatewayData(prev => ({
        ...prev,
        gatewayKeyId: res.data.gatewayKeyId,
        gatewayWebhookSecret: res.data.gatewayWebhookSecret,
        upiId: res.data.upiId || '',
        upiName: res.data.upiName || ''
      }));
      setGatewayInfo({ isConfigured: res.data.isConfigured, webhookUrl: res.data.webhookUrl });
    } catch (_) {}
  };

  const handleSaveGateway = async (e) => {
    e.preventDefault();
    setGatewayLoading(true);
    setSuccess('');
    setError('');
    try {
      await api.put('auth/gateway-settings', gatewayData);
      setSuccess('Payment & P2P settings saved successfully! ✅');
      setTimeout(() => setSuccess(''), 4000);
      fetchGatewaySettings();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings.');
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

  // ── WhatsApp settings State ───────────────────────────────
  const [whatsappData, setWhatsappData] = useState({
    whatsappAccessToken: '',
    whatsappPhoneNumberId: '',
    whatsappEnabled: false,
    whatsappMode: 'automated_qr', // 'manual' | 'automated_qr' | 'cloud'
    whatsappTemplates: {
      upcomingDue: 'upcoming_due',
      dueToday: 'due_today',
      paymentReceived: 'payment_received',
      overdueWarning: 'overdue_warning'
    }
  });
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [qrState, setQrState] = useState({ status: 'disconnected', phone: null, qr: null });
  const [testPhone, setTestPhone] = useState('');
  const [testMsg, setTestMsg] = useState('RinSetu secure gateway reminder message test!');
  const [testLoading, setTestLoading] = useState(false);

  const fetchWhatsappSettings = async () => {
    try {
      const res = await api.get('auth/whatsapp-settings');
      setWhatsappData({
        whatsappAccessToken: res.data.whatsappAccessToken || '',
        whatsappPhoneNumberId: res.data.whatsappPhoneNumberId || '',
        whatsappEnabled: !!res.data.whatsappEnabled,
        whatsappMode: 'automated_qr',
        whatsappTemplates: {
          upcomingDue: res.data.whatsappTemplates?.upcomingDue || '',
          dueToday: res.data.whatsappTemplates?.dueToday || '',
          paymentReceived: res.data.whatsappTemplates?.paymentReceived || '',
          overdueWarning: res.data.whatsappTemplates?.overdueWarning || ''
        }
      });
    } catch (_) {}
  };

  const fetchQRStatus = async () => {
    try {
      const res = await api.get('whatsapp/status');
      setQrState(res.data);
    } catch (_) {}
  };

  // Poll WhatsApp Web QR status when settings tab is active
  useEffect(() => {
    let timer;
    if (activeTab === 'whatsapp' && whatsappData.whatsappMode === 'automated_qr') {
      fetchQRStatus();
      timer = setInterval(fetchQRStatus, 5000);
    }
    return () => clearInterval(timer);
  }, [activeTab, whatsappData.whatsappMode]);

  const handleSaveWhatsapp = async (e) => {
    e.preventDefault();
    setWhatsappLoading(true);
    setSuccess('');
    setError('');
    try {
      await api.put('auth/whatsapp-settings', whatsappData);
      setSuccess('WhatsApp settings saved successfully!');
      fetchWhatsappSettings();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save WhatsApp settings.');
    } finally {
      setWhatsappLoading(false);
    }
  };

  const handleDisconnectWA = async () => {
    if (!window.confirm('Are you sure you want to disconnect and delete your active WhatsApp session?')) return;
    setWhatsappLoading(true);
    setSuccess('');
    setError('');
    try {
      const res = await api.post('whatsapp/logout');
      setSuccess(res.data.message || 'WhatsApp session cleared.');
      fetchQRStatus();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to disconnect WhatsApp.');
    } finally {
      setWhatsappLoading(false);
    }
  };

  const handleSendTestWA = async (e) => {
    e.preventDefault();
    if (!testPhone || !testMsg) return;
    setTestLoading(true);
    setSuccess('');
    setError('');
    try {
      const res = await api.post('whatsapp/send-test', { phone: testPhone, message: testMsg });
      setSuccess(res.data.message || 'Test message sent successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send test message.');
    } finally {
      setTestLoading(false);
    }
  };

  // ── Payout Settings State ───────────────────────────────
  const [payoutData, setPayoutData] = useState({
    payoutBankAccountNumber: '',
    payoutBankIfsc: '',
    payoutBankBeneficiaryName: '',
    paymentModePreference: 'byok', // 'byok' | 'central_split'
    payoutLinkedAccountId: '',
    payoutEnabled: false
  });
  const [payoutLoading, setPayoutLoading] = useState(false);

  const fetchPayoutSettings = async () => {
    try {
      const res = await api.get('auth/payout-settings');
      setPayoutData({
        payoutBankAccountNumber: res.data.payoutBankAccountNumber || '',
        payoutBankIfsc: res.data.payoutBankIfsc || '',
        payoutBankBeneficiaryName: res.data.payoutBankBeneficiaryName || '',
        paymentModePreference: res.data.paymentModePreference || 'byok',
        payoutLinkedAccountId: res.data.payoutLinkedAccountId || '',
        payoutEnabled: !!res.data.payoutEnabled
      });
    } catch (_) {}
  };

  const handleSavePayout = async (e) => {
    e.preventDefault();
    setPayoutLoading(true);
    setSuccess('');
    setError('');
    try {
      const res = await api.put('auth/payout-settings', payoutData);
      setSuccess(res.data.message || 'Payout settings saved successfully!');
      setTimeout(() => setSuccess(''), 4000);
      fetchPayoutSettings();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save payout settings.');
    } finally {
      setPayoutLoading(false);
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
      const res = await api.put('auth/profile', profileData);
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
      const res = await api.get('settings');
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
      const res = await api.get('settings/audit-logs');
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
      fetchPayoutSettings();
    }
    if (activeTab === 'whatsapp') {
      fetchWhatsappSettings();
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
      await api.put('settings', payload);
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
      const res = await api.post('settings/trigger-cron', {});
      setSuccess(res.data.message || 'Auto check & late fee calculations processed successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to trigger manual accruals.');
    } finally {
      setCronLoading(false);
    }
  };

  const handleDownloadBackup = () => {
    window.open(`${window.API_BASE}/api/settings/backup?token=${token}`, '_blank');
  };

  const handleExportCSV = (type) => {
    window.open(`${window.API_BASE}/api/settings/export/${type}?token=${token}`, '_blank');
  };

  if (loading || !settings) {
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

      {/* Tabs Selector Navigation (Mobile Responsive & Scrollable Pills) */}
      <div 
        className="flex items-center space-x-2.5 overflow-x-auto pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 border-b border-brand-border/40 text-xs font-bold scrollbar-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style dangerouslySetInnerHTML={{__html: `
          .scrollbar-none::-webkit-scrollbar {
            display: none;
          }
        `}} />
        {[
          { id: 'config', label: '⚙️ Rules & Automation' },
          { id: 'audit', label: '🛡️ Audit Trail' },
          { id: 'backup', label: '💾 Backups & Exports' },
          { id: 'profile', label: '👤 Profile Settings' },
          { id: 'payment', label: '💳 Payment Gateway' },
          { id: 'whatsapp', label: '💬 WhatsApp Gateway' }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl border shrink-0 transition-all duration-200 outline-none ${
                isActive 
                  ? 'bg-brand-accent/10 border-brand-accent/30 text-brand-accent shadow-sm shadow-brand-accent/5 scale-[1.02]' 
                  : 'bg-brand-card border-brand-border text-brand-dim hover:text-brand-text dark:hover:text-white hover:bg-brand-bg/50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
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
            
            {/* Simple Visual Helper Box */}
            <div className="p-4 bg-brand-bg/85 border border-brand-border/60 rounded-xl space-y-3.5">
              <span className="text-[10px] font-extrabold text-brand-accent uppercase tracking-wider block">
                ℹ️ Waterfall Payment Rule (भुगतान बांटने का नियम)
              </span>
              <p className="text-[11px] text-brand-dim leading-relaxed">
                RinSetu me jab bhi koi borrower payment karta hai, to system paise ko automatically neeche diye gaye order me distribute (allocate) karta hai. Aap inko aapas me **Up/Down** karke priority badal sakte hain.
              </p>
              
              {/* Visual Flow diagram */}
              <div className="grid grid-cols-4 gap-2 pt-1 text-center font-bold text-[9px] uppercase tracking-wide text-white">
                <div className="bg-brand-rose/20 border border-brand-rose/30 p-2.5 rounded-lg">
                  1. Penalty ➔
                </div>
                <div className="bg-brand-amber/20 border border-brand-amber/30 p-2.5 rounded-lg">
                  2. Fines ➔
                </div>
                <div className="bg-indigo-500/20 border border-indigo-500/30 p-2.5 rounded-lg">
                  3. Byaj ➔
                </div>
                <div className="bg-brand-emerald/20 border border-brand-emerald/30 p-2.5 rounded-lg">
                  4. Asal (End)
                </div>
              </div>
              <p className="text-[9.5px] text-brand-dim italic">
                * Example: Agar ₹1,000 payment aayi, to pehle penalty kategi, fir late fines, fir bacha hua byaj me jayega aur aakhir me bacha paisa asal (principal) me jama hoga.
              </p>
            </div>

            <div className="space-y-2.5">
              {priority.map((step, idx) => (
                <div key={step} className="flex items-center justify-between bg-brand-bg/50 border border-brand-border px-4 py-3 rounded-xl hover:border-brand-border/80 transition">
                  <span className="text-xs text-white font-semibold">{idx + 1}. {stepLabels[step]}</span>
                  <div className="flex space-x-1">
                    <button
                      type="button"
                      onClick={() => handleMoveUp(idx)}
                      disabled={idx === 0}
                      className="px-3 py-1 bg-brand-border hover:bg-brand-border/80 disabled:opacity-30 rounded text-[10px] text-white font-bold transition"
                    >
                      ▲ Up
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveDown(idx)}
                      disabled={idx === priority.length - 1}
                      className="px-3 py-1 bg-brand-border hover:bg-brand-border/80 disabled:opacity-30 rounded text-[10px] text-white font-bold transition"
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

      {activeTab === 'payment' && (
        <div className="space-y-6">
          
          {/* Payment Preference Selector Card */}
          <div className="glass-panel border border-brand-border rounded-2xl p-6 space-y-5">
            <div className="flex items-center space-x-2 border-b border-brand-border pb-3">
              <CheckCircle2 className="w-4 h-4 text-brand-accent" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-sans">Payment Integration Preference</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* P2P Selection card */}
              <div 
                onClick={async () => {
                  const updated = { ...payoutData, paymentModePreference: 'byok' };
                  setPayoutData(updated);
                  try {
                    await api.put('auth/payout-settings', updated);
                  } catch (_) {}
                }}
                className={`p-4 rounded-xl border cursor-pointer transition flex flex-col space-y-1.5 ${
                  payoutData.paymentModePreference === 'byok'
                    ? 'border-brand-accent/50 bg-brand-accent/5'
                    : 'border-brand-border hover:border-brand-border/80 bg-brand-bg/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Direct P2P UPI (0% Fee)</span>
                  <input 
                    type="radio" 
                    checked={payoutData.paymentModePreference === 'byok'} 
                    readOnly 
                    className="text-brand-accent focus:ring-0" 
                  />
                </div>
                <p className="text-[10px] text-brand-dim leading-relaxed">
                  Direct bank-to-bank transfer. 0% transaction fee. Borrower scans your QR code and submits UTR number. Requires admin manual approval.
                </p>
              </div>

              {/* Central Split Selection card */}
              <div 
                onClick={async () => {
                  const updated = { ...payoutData, paymentModePreference: 'central_split' };
                  setPayoutData(updated);
                  try {
                    await api.put('auth/payout-settings', updated);
                  } catch (_) {}
                }}
                className={`p-4 rounded-xl border cursor-pointer transition flex flex-col space-y-1.5 ${
                  payoutData.paymentModePreference === 'central_split'
                    ? 'border-brand-accent/50 bg-brand-accent/5'
                    : 'border-brand-border hover:border-brand-border/80 bg-brand-bg/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Central Split Payouts (Auto-Verify)</span>
                  <input 
                    type="radio" 
                    checked={payoutData.paymentModePreference === 'central_split'} 
                    readOnly 
                    className="text-brand-accent focus:ring-0" 
                  />
                </div>
                <p className="text-[10px] text-brand-dim leading-relaxed">
                  Automatic verification. Settle payments automatically to your bank account using platform's central gateway. No manual approval needed.
                </p>
              </div>
            </div>
          </div>

          {/* Conditional Layouts based on Mode Preference */}
          {payoutData.paymentModePreference === 'byok' ? (
            /* ================= DIRECT P2P UPI CONFIGURATION ================= */
            <form onSubmit={handleSaveGateway} className="space-y-6">
              {/* Direct P2P UPI VPA Section */}
              <div className="glass-panel border border-brand-border rounded-2xl p-6 space-y-5">
                <div className="flex items-center space-x-2 border-b border-brand-border pb-3">
                  <Wallet className="w-4 h-4 text-brand-emerald" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Direct VPA P2P UPI Settings (0% Commission)</h3>
                </div>

                <div className="p-4 bg-brand-bg/60 border border-brand-border rounded-xl space-y-2 text-[10px] text-brand-dim leading-relaxed">
                  <p className="font-bold text-brand-text dark:text-white text-[11px]">📋 How Direct P2P UPI works:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Configure your personal or business UPI VPA ID below (e.g., your UPI phone number or business VPA).</li>
                    <li>When a borrower clicks pay, a QR code pointing directly to your UPI ID is generated.</li>
                    <li>The borrower transfers funds directly bank-to-bank (0% fees, instant settlement).</li>
                    <li>Borrower submits the 12-digit UTR transaction number on the payment page.</li>
                    <li>You review the UTR in your Admin Dashboard under "Pending P2P Payments" and approve it manually to record it.</li>
                  </ul>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* UPI VPA ID */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider">Lender UPI VPA ID *</label>
                    <input
                      type="text"
                      required
                      value={gatewayData.upiId}
                      onChange={(e) => setGatewayData(prev => ({ ...prev, upiId: e.target.value }))}
                      placeholder="e.g. rahulsharma@oksbi or 9876543210@paytm"
                      className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white placeholder-brand-dim/40 outline-none transition"
                    />
                  </div>

                  {/* UPI Display Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider">Lender UPI Display Name (Business Name) *</label>
                    <input
                      type="text"
                      required
                      value={gatewayData.upiName}
                      onChange={(e) => setGatewayData(prev => ({ ...prev, upiName: e.target.value }))}
                      placeholder="e.g. RinSetu CRM or Advika Enterprises"
                      className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white placeholder-brand-dim/40 outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={gatewayLoading}
                  className="flex items-center space-x-1.5 px-6 py-3.5 rounded-xl bg-brand-accent hover:bg-indigo-600 disabled:opacity-40 text-xs font-bold text-white shadow-lg shadow-brand-accent/25 transition-all duration-200"
                >
                  <Save className="w-4 h-4" />
                  <span>{gatewayLoading ? 'Saving...' : 'Save UPI Settings'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* ================= CENTRAL SPLIT PAYOUTS FORM ================= */
            <form onSubmit={handleSavePayout} className="space-y-6">
              {/* Status Banner */}
              <div className={`flex items-center space-x-3 p-4 rounded-2xl border ${
                payoutData.payoutEnabled
                  ? 'bg-brand-emerald/10 border-brand-emerald/30 text-brand-emerald'
                  : 'bg-brand-amber/10 border-brand-amber/30 text-brand-amber'
              }`}>
                <Wallet className="w-5 h-5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-wider">
                    {payoutData.payoutEnabled ? '✅ Central Split Payout Mode is ACTIVE' : '⚙️ Central Split Mode is PENDING Linkage Activation'}
                  </p>
                  <p className="text-[10px] mt-0.5 text-slate-300">
                    {payoutData.payoutEnabled
                      ? `Payments will split automatically and route to Linked Bank Account.`
                      : 'Your bank details are saved. The platform administrator will activate your linked account shortly.'}
                  </p>
                </div>
              </div>

              {/* Bank Credentials Form Card */}
              <div className="glass-panel border border-brand-border rounded-2xl p-6 space-y-5">
                <div className="flex items-center space-x-2 border-b border-brand-border pb-3">
                  <Wallet className="w-4 h-4 text-brand-accent" />
                  <h3 className="text-xs font-bold text-brand-text dark:text-white uppercase tracking-wider">Bank Settlement Details</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Beneficiary Name */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider">Beneficiary Name (Bank Account Holder) *</label>
                    <input
                      type="text"
                      required
                      value={payoutData.payoutBankBeneficiaryName}
                      onChange={(e) => setPayoutData(prev => ({ ...prev, payoutBankBeneficiaryName: e.target.value }))}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white placeholder-brand-dim/40 outline-none transition"
                    />
                  </div>

                  {/* Account Number */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider">Bank Account Number *</label>
                    <input
                      type="text"
                      required
                      value={payoutData.payoutBankAccountNumber}
                      onChange={(e) => setPayoutData(prev => ({ ...prev, payoutBankAccountNumber: e.target.value }))}
                      placeholder="e.g. 501002345678"
                      className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white placeholder-brand-dim/40 outline-none transition font-mono"
                    />
                  </div>

                  {/* IFSC Code */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider">IFSC Code *</label>
                    <input
                      type="text"
                      required
                      value={payoutData.payoutBankIfsc}
                      onChange={(e) => setPayoutData(prev => ({ ...prev, payoutBankIfsc: e.target.value }))}
                      placeholder="e.g. HDFC0000123"
                      className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white placeholder-brand-dim/40 outline-none transition font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={payoutLoading}
                  className="flex items-center space-x-1.5 px-6 py-3.5 rounded-xl bg-brand-accent hover:bg-indigo-600 disabled:opacity-40 text-xs font-bold text-white shadow-lg shadow-brand-accent/25 transition-all duration-200"
                >
                  <Save className="w-4 h-4" />
                  <span>{payoutLoading ? 'Saving...' : 'Save Payout Settings'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ── Tab: WhatsApp Cloud API Settings ─────────────────────────────── */}
      {activeTab === 'whatsapp' && (
        <form onSubmit={handleSaveWhatsapp} className="space-y-6">

          {/* Master Toggle Card */}
          <div className="glass-panel border border-brand-border rounded-2xl p-6 space-y-4">
            <div className="flex items-center space-x-2 border-b border-brand-border pb-3">
              <MessageSquare className="w-4 h-4 text-brand-accent" />
              <h3 className="text-xs font-bold text-brand-text dark:text-white uppercase tracking-wider">WhatsApp Configuration</h3>
            </div>

            {/* Toggle Enable */}
            <div className="flex items-center justify-between p-3.5 bg-brand-bg/40 border border-brand-border rounded-xl">
              <div>
                <p className="text-xs font-bold text-brand-text dark:text-white">Master WhatsApp Trigger Switch</p>
                <p className="text-[10px] text-brand-dim mt-0.5">Toggle WhatsApp notifications ON/OFF completely</p>
              </div>
              <button
                type="button"
                onClick={() => setWhatsappData(prev => ({ ...prev, whatsappEnabled: !prev.whatsappEnabled }))}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold transition ${
                  whatsappData.whatsappEnabled ? 'bg-brand-emerald text-white' : 'bg-brand-border text-brand-dim'
                }`}
              >
                {whatsappData.whatsappEnabled ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>
          </div>

          {/* Local WhatsApp Gateway Console */}
          <div className="glass-panel border border-brand-border rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <span className="text-xs font-bold text-brand-text dark:text-white">🔗 Local WhatsApp Gateway Console</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                qrState.status === 'connected' ? 'bg-emerald-500/10 text-brand-emerald' : 'bg-amber-500/10 text-brand-amber'
              }`}>
                Status: {qrState.status.toUpperCase()}
              </span>
            </div>

            {qrState.status === 'connected' ? (
              <div className="space-y-4">
                <div className="p-4 bg-brand-emerald/10 border border-brand-emerald/20 text-brand-emerald rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold">✅ Connected Successfully!</p>
                    <p className="text-[10px] mt-0.5 opacity-90">Your CRM is linked with WhatsApp number: <strong>+{qrState.phone}</strong></p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDisconnectWA}
                    className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-[9px] font-bold transition"
                  >
                    Disconnect Device
                  </button>
                </div>

                {/* Send Test WhatsApp Box */}
                <div className="bg-brand-bg/50 border border-brand-border p-4 rounded-xl space-y-3">
                  <span className="text-[10px] font-bold text-brand-dim uppercase tracking-wider block">🧪 Send Test WhatsApp Message</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-brand-dim">Recipient Phone (with country code)</label>
                      <input
                        type="text"
                        value={testPhone}
                        onChange={(e) => setTestPhone(e.target.value)}
                        placeholder="e.g. 917891449044"
                        className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-brand-accent/50 text-brand-text dark:text-white"
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2 flex gap-2 items-end">
                      <div className="flex-1 space-y-1">
                        <label className="text-[9px] font-bold text-brand-dim">Message Content</label>
                        <input
                          type="text"
                          value={testMsg}
                          onChange={(e) => setTestMsg(e.target.value)}
                          className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-brand-accent/50 text-brand-text dark:text-white"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSendTestWA}
                        disabled={testLoading || !testPhone}
                        className={`px-5 py-2 rounded-xl text-xs font-extrabold transition-all duration-150 h-[38px] shrink-0 flex items-center justify-center border shadow-sm ${
                          (testLoading || !testPhone)
                            ? 'cursor-not-allowed shadow-none'
                            : 'hover:opacity-90 active:scale-[0.98] cursor-pointer'
                        }`}
                        style={{
                          backgroundColor: (testLoading || !testPhone) ? '#f1f5f9' : '#ffffff',
                          color: (testLoading || !testPhone) ? '#94a3b8' : '#9c27b0',
                          borderColor: (testLoading || !testPhone) ? '#e2e8f0' : '#9c27b0'
                        }}
                      >
                        {testLoading ? 'Sending...' : 'Send Test'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : qrState.status === 'qr_ready' && qrState.qr ? (
              <div className="flex flex-col md:flex-row items-center gap-6 p-4">
                <div className="bg-white p-3.5 rounded-xl shrink-0 shadow-lg border border-brand-border">
                  <img src={qrState.qr} alt="Scan WhatsApp QR" className="w-44 h-44" />
                </div>
                <div className="space-y-2.5">
                  <p className="text-xs font-bold text-brand-text dark:text-white">📲 Link your WhatsApp Account</p>
                  <ol className="list-decimal list-inside text-[10px] text-brand-dim space-y-1.5 leading-relaxed">
                    <li>Open <strong className="text-brand-text dark:text-white">WhatsApp</strong> on your mobile phone</li>
                    <li>Tap <strong className="text-brand-text dark:text-white">Menu</strong> (three dots) or <strong className="text-brand-text dark:text-white">Settings</strong></li>
                    <li>Select <strong className="text-brand-text dark:text-white">Linked Devices</strong></li>
                    <li>Tap <strong className="text-brand-accent">Link a Device</strong> and point your camera to this QR code</li>
                  </ol>
                  <p className="text-[9px] text-brand-emerald font-bold animate-pulse mt-2">🔄 Polling for connection... Scan to link instantly</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 space-y-2">
                <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-[10px] text-brand-dim">Initializing local WhatsApp container session...</p>
              </div>
            )}
          </div>

          {/* Templates Card */}
          <div className="glass-panel border border-brand-border rounded-2xl p-6 space-y-5">
            <div className="flex items-center space-x-2 border-b border-brand-border pb-3">
              <MessageSquare className="w-4 h-4 text-brand-accent" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Custom Message Templates (Hinglish/English)</h3>
            </div>
            
            <div className="bg-brand-bg/50 border border-brand-border p-4 rounded-xl space-y-2 text-[10px] text-brand-dim leading-relaxed">
              <p className="font-bold text-brand-text dark:text-white uppercase tracking-wider text-[9px] mb-1">💡 Supported Dynamic Placeholders:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 font-semibold">
                <div><code className="bg-brand-card px-1.5 py-0.5 rounded text-brand-accent">{"{{customerName}}"}</code>: Borrower Name</div>
                <div><code className="bg-brand-card px-1.5 py-0.5 rounded text-brand-accent">{"{{amount}}"}</code>: EMI Amount</div>
                <div><code className="bg-brand-card px-1.5 py-0.5 rounded text-brand-accent">{"{{dueDate}}"}</code>: Installment Date</div>
                <div><code className="bg-brand-card px-1.5 py-0.5 rounded text-brand-accent">{"{{paymentLink}}"}</code>: P2P Payment Link</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Upcoming Due Template */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider">Upcoming Due Reminder Message</label>
                <textarea
                  rows="3"
                  value={whatsappData.whatsappTemplates.upcomingDue}
                  onChange={(e) => setWhatsappData(prev => ({
                    ...prev,
                    whatsappTemplates: { ...prev.whatsappTemplates, upcomingDue: e.target.value }
                  }))}
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white outline-none transition resize-none"
                />
              </div>

              {/* Due Today Template */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider">Due Today Reminder Message</label>
                <textarea
                  rows="3"
                  value={whatsappData.whatsappTemplates.dueToday}
                  onChange={(e) => setWhatsappData(prev => ({
                    ...prev,
                    whatsappTemplates: { ...prev.whatsappTemplates, dueToday: e.target.value }
                  }))}
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white outline-none transition resize-none"
                />
              </div>

              {/* Payment Received Template */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider">Payment Confirmation Message</label>
                <textarea
                  rows="3"
                  value={whatsappData.whatsappTemplates.paymentReceived}
                  onChange={(e) => setWhatsappData(prev => ({
                    ...prev,
                    whatsappTemplates: { ...prev.whatsappTemplates, paymentReceived: e.target.value }
                  }))}
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white outline-none transition resize-none"
                />
              </div>

              {/* Overdue Warning Template */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider">Overdue Warning Message</label>
                <textarea
                  rows="3"
                  value={whatsappData.whatsappTemplates.overdueWarning}
                  onChange={(e) => setWhatsappData(prev => ({
                    ...prev,
                    whatsappTemplates: { ...prev.whatsappTemplates, overdueWarning: e.target.value }
                  }))}
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white outline-none transition resize-none"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={whatsappLoading}
              className="flex items-center space-x-1.5 px-6 py-3.5 rounded-xl bg-brand-accent hover:bg-indigo-600 disabled:opacity-40 text-xs font-bold text-white shadow-lg shadow-brand-accent/25 transition-all duration-200"
            >
              <Save className="w-4 h-4" />
              <span>{whatsappLoading ? 'Saving...' : 'Save WhatsApp Settings'}</span>
            </button>
          </div>

        </form>
      )}



    </div>
  );
}
