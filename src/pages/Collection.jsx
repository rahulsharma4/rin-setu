import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Phone, AlertTriangle, Clock, CalendarCheck, RefreshCw, MessageSquareShare } from 'lucide-react';
import { collectionAPI } from '../api';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function Collection() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('today');
  const [todayData, setTodayData] = useState([]);
  const [upcomingData, setUpcomingData] = useState([]);
  const [overdueData, setOverdueData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reminderModal, setReminderModal] = useState({ open: false, text: '', phone: '', name: '' });
  const [reminderLoading, setReminderLoading] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [today, upcoming, overdue] = await Promise.all([
        collectionAPI.getToday(),
        collectionAPI.getUpcoming(),
        collectionAPI.getOverdue(),
      ]);
      setTodayData(today);
      setUpcomingData(upcoming);
      setOverdueData(overdue);
    } catch (err) {
      console.error('Collection data load error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleDraftReminder = async (item) => {
    setReminderModal({ open: true, text: '', phone: item.customer?.phone, name: item.customer?.name });
    setReminderLoading(true);
    try {
      const res = await api.post(
        'ai/draft-reminder',
        {
          customerId: item.customer?._id,
          loanId: item.loan?._id,
          installmentId: item._id,
          type: activeTab
        }
      );
      setReminderModal(prev => ({ ...prev, text: res.data.message }));
    } catch {
      setReminderModal(prev => ({ ...prev, text: `Namaste ${item.customer?.name} ji,\n\nAapka loan ka ek installment abhi overdue chal raha hai. Kripya jald payment karein.\n\nDhanyawad.` }));
    } finally {
      setReminderLoading(false);
    }
  };

  const handleWhatsApp = (phone, text) => {
    const clean = phone?.replace(/\D/g, '');
    const target = clean?.length === 10 ? `91${clean}` : clean;
    window.open(`https://wa.me/${target}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const tabs = [
    { key: 'today', label: 'Aaj Due', icon: CalendarCheck, data: todayData, color: 'text-brand-amber' },
    { key: 'upcoming', label: 'Upcoming (7 Din)', icon: Clock, data: upcomingData, color: 'text-brand-accent' },
    { key: 'overdue', label: 'Overdue', icon: AlertTriangle, data: overdueData, color: 'text-brand-rose' },
  ];

  const activeTabData = tabs.find(t => t.key === activeTab);
  const currentData = activeTabData?.data || [];

  const statusColor = {
    unpaid: 'bg-brand-border text-brand-dim',
    partially_paid: 'bg-brand-accent/10 text-brand-accent border-brand-accent/20',
    overdue: 'bg-brand-rose/10 text-brand-rose border-brand-rose/20',
    paid: 'bg-brand-emerald/10 text-brand-emerald border-brand-emerald/20',
  };

  return (
    <div className="space-y-7 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Collection Center</h1>
          <p className="text-xs text-brand-dim mt-1.5 font-medium">Aaj ki, upcoming aur overdue installments ka real-time view.</p>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border border-brand-border text-xs font-semibold text-brand-dim hover:text-white hover:bg-brand-border/40 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-3 gap-4">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const totalAmount = tab.data.reduce((acc, i) => acc + (i.remaining || 0), 0);
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`glass-panel border rounded-xl p-4 text-left transition-all ${
                activeTab === tab.key ? 'border-brand-accent/50 shadow-lg shadow-brand-accent/10' : 'border-brand-border hover:border-brand-border/80'
              }`}
            >
              <div className="flex items-center space-x-2 mb-2">
                <Icon className={`w-4 h-4 ${tab.color}`} />
                <span className={`text-[10px] font-bold uppercase tracking-wider ${tab.color}`}>{tab.label}</span>
              </div>
              <p className="text-xl font-extrabold text-white">{tab.data.length}</p>
              <p className="text-[10px] text-brand-dim mt-0.5">₹{Math.round(totalAmount).toLocaleString('en-IN')} pending</p>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="glass-panel border border-brand-border rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wide">{activeTabData?.label} — {currentData.length} records</h3>

        {loading ? (
          <div className="h-48 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : currentData.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center space-y-2 text-center">
            <CalendarCheck className="w-10 h-10 text-brand-dim/20" />
            <p className="text-xs text-brand-dim">Is category mein koi record nahi hai. Bahut acha!</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-brand-border rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-brand-border bg-brand-bg/50 text-[10px] uppercase font-bold text-brand-dim">
                  <th className="p-4">Borrower</th>
                  <th className="p-4">EMI #</th>
                  <th className="p-4">Due Date</th>
                  <th className="p-4">Total EMI</th>
                  <th className="p-4">Remaining</th>
                  {activeTab === 'overdue' && <th className="p-4">Overdue Days</th>}
                  {activeTab === 'upcoming' && <th className="p-4">Days Left</th>}
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/40">
                {currentData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-brand-border/10 transition">
                    <td className="p-4">
                      <p className="font-bold text-white">{item.customer?.name || '—'}</p>
                      <span className="text-[10px] text-brand-dim">{item.customer?.phone}</span>
                    </td>
                    <td className="p-4 text-brand-dim font-medium">#{item.installmentNumber}</td>
                    <td className="p-4 text-brand-dim">
                      {new Date(item.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-4 font-semibold text-white">₹{item.totalAmount?.toLocaleString('en-IN')}</td>
                    <td className="p-4 font-bold text-brand-rose">₹{Math.round(item.remaining)?.toLocaleString('en-IN')}</td>
                    {activeTab === 'overdue' && (
                      <td className="p-4">
                        <span className="bg-brand-rose/10 text-brand-rose border border-brand-rose/20 px-2 py-0.5 rounded-full text-[9px] font-bold">
                          {item.overdueDays} din
                        </span>
                      </td>
                    )}
                    {activeTab === 'upcoming' && (
                      <td className="p-4">
                        <span className="bg-brand-accent/10 text-brand-accent border border-brand-accent/20 px-2 py-0.5 rounded-full text-[9px] font-bold">
                          {item.daysLeft} din
                        </span>
                      </td>
                    )}
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${statusColor[item.status] || 'text-brand-dim'}`}>
                        {item.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end space-x-2">
                        <a
                          href={`tel:${item.customer?.phone}`}
                          className="p-2 rounded-lg bg-brand-emerald/10 text-brand-emerald hover:bg-brand-emerald hover:text-white transition"
                          title="Call Borrower"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => handleDraftReminder(item)}
                          className="p-2 rounded-lg bg-brand-accent/10 text-brand-accent hover:bg-brand-accent hover:text-white transition"
                          title="Draft WhatsApp Reminder"
                        >
                          <MessageSquareShare className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reminder Modal */}
      {reminderModal.open && createPortal(
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md bg-brand-card border border-brand-border rounded-2xl shadow-2xl p-6 space-y-5 my-auto overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between border-b border-brand-border/40 pb-3">
              <h3 className="text-sm font-bold text-white">AI WhatsApp Reminder</h3>
              <button type="button" onClick={() => setReminderModal({ open: false, text: '', phone: '', name: '' })} className="text-brand-dim hover:text-white">✕</button>
            </div>

            {reminderLoading ? (
              <div className="h-24 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="bg-brand-bg border border-brand-border rounded-xl p-4 text-xs text-white whitespace-pre-wrap font-mono leading-relaxed">
                {reminderModal.text}
              </div>
            )}

            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => navigator.clipboard.writeText(reminderModal.text)}
                className="flex-1 py-2.5 rounded-xl border border-brand-border text-xs font-semibold text-brand-dim hover:text-white transition"
              >
                Copy Text
              </button>
              <button
                onClick={() => handleWhatsApp(reminderModal.phone, reminderModal.text)}
                disabled={!reminderModal.text}
                className="flex-1 py-2.5 rounded-xl bg-brand-emerald hover:bg-emerald-600 text-xs font-bold text-white disabled:opacity-40 transition"
              >
                Send on WhatsApp
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
