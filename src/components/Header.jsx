import { Search, Bell, User, HandCoins, Receipt, AlertTriangle, HelpCircle, Sun, Moon, MessageSquareShare, Trash2, Send, MessageCircle, Menu } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Header({ onMenuClick }) {
  const navigate = useNavigate();
  const { token, admin } = useAuth();
  
  // Theme Switching State
  const [theme, setTheme] = useState(() => localStorage.getItem('byaj_theme') || 'dark');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [loadingSearch, setLoadingSearch] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [pendingMessages, setPendingMessages] = useState([]);
  const [activeBellTab, setActiveBellTab] = useState('alerts'); // 'alerts' | 'whatsapp'

  const searchRef = useRef(null);
  const bellRef = useRef(null);

  const headers = { Authorization: `Bearer ${token}` };

  // Sync theme changes with DOM root element
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('byaj_theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('byaj_theme', 'dark');
    }
  }, [theme]);

  // Fetch Bell Alerts Stats
  const fetchNotifications = async () => {
    try {
      const res = await api.get('settings/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to load notifications count:', err);
    }
  };

  const fetchPendingMessages = async () => {
    try {
      const res = await api.get('notifications/pending');
      setPendingMessages(res.data);
    } catch (err) {
      console.error('Failed to load pending WhatsApp queue:', err);
    }
  };

  useEffect(() => {
    if (!token || admin?.role === 'super-admin') return;

    fetchNotifications();
    fetchPendingMessages();
    
    // Poll notifications count every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications();
      fetchPendingMessages();
    }, 30000);
    return () => clearInterval(interval);
  }, [token, admin]);

  const handleSendWhatsApp = async (notif) => {
    const cleanPhone = notif.recipientPhone.replace(/[^0-9]/g, '');
    const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const url = `https://wa.me/${targetPhone}?text=${encodeURIComponent(notif.messageText)}`;
    window.open(url, '_blank');

    try {
      await api.post(`notifications/${notif._id}/send`, {});
      fetchPendingMessages();
    } catch (err) {
      console.error('Failed to mark message as sent:', err);
    }
  };

  const handleDiscardWhatsApp = async (id) => {
    try {
      await api.delete(`notifications/${id}`);
      fetchPendingMessages();
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  // Global search trigger
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoadingSearch(true);
      try {
        const res = await api.get(`settings/global-search?q=${searchQuery}`);
        setSearchResults(res.data);
      } catch (err) {
        console.error('Failed to run global search:', err);
      } finally {
        setLoadingSearch(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchQuery('');
        setSearchResults(null);
      }
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectCustomer = (id) => {
    setSearchQuery('');
    setSearchResults(null);
    navigate(`/customers/${id}`);
  };

  const totalNotifications = notifications 
    ? (notifications.overdue + notifications.dueToday + notifications.readyToClose + notifications.expiringDocs)
    : 0;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-brand-border/60 py-4 mb-7 bg-brand-bg shadow-sm">
      
      {/* Mobile Menu Toggle Button */}
      <button
        type="button"
        onClick={onMenuClick}
        className="md:hidden w-10 h-10 rounded-xl bg-brand-card border border-brand-border flex items-center justify-center text-brand-dim hover:text-brand-text dark:hover:text-white mr-3 shrink-0 transition outline-none"
        title="Open Navigation"
      >
        <Menu className="w-4.5 h-4.5" />
      </button>

      {/* 1. Global Search Input Area */}
      {admin?.role !== 'super-admin' ? (
        <div ref={searchRef} className="relative w-full max-w-sm sm:max-w-md flex-1 mr-4">
        <div className="flex items-center bg-brand-card border border-brand-border focus-within:border-brand-accent/50 rounded-xl px-3.5 py-2.5 transition">
          <Search className="w-4 h-4 text-brand-dim mr-2.5 shrink-0" />
          <input
            type="text"
            placeholder="Search customer name, mobile, or loan files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none text-xs text-brand-text placeholder-brand-dim/50 outline-none w-full focus:ring-0 focus:outline-none"
          />
          {loadingSearch && (
            <div className="w-3.5 h-3.5 border border-brand-accent border-t-transparent rounded-full animate-spin shrink-0" />
          )}
        </div>

        {/* Global Search Result Dropdown box */}
        {searchResults && (
          <div className="absolute top-full left-0 w-full mt-2 !bg-white dark:!bg-[#0b0e1b] border border-brand-border rounded-xl shadow-2xl overflow-hidden max-h-[360px] overflow-y-auto z-[120] opacity-100">
            
            {/* Customers category */}
            {searchResults.customers?.length > 0 && (
              <div className="p-3 border-b border-brand-border/40">
                <span className="text-[9px] font-bold text-brand-accent uppercase tracking-wider block mb-2">Borrowers Directory</span>
                <div className="space-y-1">
                  {searchResults.customers.map(c => (
                    <div 
                      key={c._id} 
                      onClick={() => handleSelectCustomer(c._id)}
                      className="flex items-center space-x-3 p-2 hover:bg-brand-border/30 rounded-lg cursor-pointer transition text-xs"
                    >
                      <User className="w-4 h-4 text-white shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white truncate">{c.name}</p>
                        <span className="text-[9px] text-brand-dim font-medium">{c.phone}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Loans category */}
            {searchResults.loans?.length > 0 && (
              <div className="p-3 border-b border-brand-border/40">
                <span className="text-[9px] font-bold text-brand-amber uppercase tracking-wider block mb-2">Loan Agreements</span>
                <div className="space-y-1">
                  {searchResults.loans.map(l => (
                    <div 
                      key={l._id} 
                      onClick={() => handleSelectCustomer(l.customerId?._id || '')}
                      className="flex items-center space-x-3 p-2 hover:bg-brand-border/30 rounded-lg cursor-pointer transition text-xs"
                    >
                      <HandCoins className="w-4 h-4 text-brand-amber shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white">₹{l.principalAmount.toLocaleString('en-IN')} ({l.status})</p>
                        <span className="text-[9px] text-brand-dim font-medium block truncate">Borrower: {l.customerId?.name || 'Unknown'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payments category */}
            {searchResults.transactions?.length > 0 && (
              <div className="p-3">
                <span className="text-[9px] font-bold text-brand-emerald uppercase tracking-wider block mb-2">Repayments Journal</span>
                <div className="space-y-1">
                  {searchResults.transactions.map(t => (
                    <div 
                      key={t._id} 
                      onClick={() => handleSelectCustomer(t.customerId?._id || '')}
                      className="flex items-center space-x-3 p-2 hover:bg-brand-border/30 rounded-lg cursor-pointer transition text-xs"
                    >
                      <Receipt className="w-4 h-4 text-brand-emerald shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white">₹{t.amount.toLocaleString('en-IN')} via {t.paymentMode}</p>
                        <span className="text-[9px] text-brand-dim font-medium block truncate">Notes: {t.notes || 'No description'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Zero Results case */}
            {searchResults.customers?.length === 0 && searchResults.loans?.length === 0 && searchResults.transactions?.length === 0 && (
              <div className="p-6 text-center text-xs text-brand-dim font-medium">
                No matching borrower files found.
              </div>
            )}

          </div>
        )}
      </div>
      ) : (
        <div className="flex-1" />
      )}

      {/* Toggler & Notifications */}
      <div className="flex items-center space-x-2 shrink-0">
        
        {/* 2. Theme Switcher Sun/Moon toggler */}
        <button 
          type="button"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-10 h-10 rounded-xl bg-brand-card border border-brand-border hover:bg-brand-border/30 flex items-center justify-center text-brand-dim hover:text-brand-text dark:hover:text-white transition outline-none"
          title="Switch color theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4.5 h-4.5 text-brand-amber animate-pulse-soft" />
          ) : (
            <Moon className="w-4.5 h-4.5 text-brand-accent" />
          )}
        </button>

        {/* 3. Notifications Bell dropdown */}
        {admin?.role !== 'super-admin' && (
          <div ref={bellRef} className="relative">
          <button 
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-10 h-10 rounded-xl bg-brand-card border border-brand-border hover:bg-brand-border/30 flex items-center justify-center text-brand-dim hover:text-brand-text dark:hover:text-white transition relative outline-none"
          >
            <Bell className="w-4.5 h-4.5" />
            {(totalNotifications > 0 || pendingMessages.length > 0) && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-brand-rose animate-pulse" />
            )}
          </button>

          {showNotifications && notifications && (
            <div className="absolute right-0 mt-2 w-80 bg-brand-card border border-brand-border rounded-xl shadow-2xl overflow-hidden z-[110]">
              
              {/* Tabs header */}
              <div className="flex border-b border-brand-border/60 bg-brand-bg/40 text-[9px] font-bold uppercase tracking-wider">
                <button
                  type="button"
                  onClick={() => setActiveBellTab('alerts')}
                  className={`flex-1 py-3 text-center border-b-2 transition ${
                    activeBellTab === 'alerts'
                      ? 'border-brand-accent text-brand-accent'
                      : 'border-transparent text-brand-dim hover:text-brand-text dark:hover:text-white'
                  }`}
                >
                  Alerts ({totalNotifications})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveBellTab('whatsapp')}
                  className={`flex-1 py-3 text-center border-b-2 transition ${
                    activeBellTab === 'whatsapp'
                      ? 'border-brand-accent text-brand-accent'
                      : 'border-transparent text-brand-dim hover:text-brand-text dark:hover:text-white'
                  }`}
                >
                  WhatsApp ({pendingMessages.length})
                </button>
              </div>

              {activeBellTab === 'alerts' ? (
                <div className="divide-y divide-brand-border/30 text-xs max-h-[300px] overflow-y-auto">
                  {notifications.overdue > 0 && (
                    <div className="p-3.5 flex items-start space-x-3 hover:bg-brand-border/10 transition cursor-pointer" onClick={() => { navigate('/collection'); setShowNotifications(false); }}>
                      <AlertTriangle className="w-4 h-4 text-brand-rose shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-white">{notifications.overdue} Accounts Overdue</p>
                        <span className="text-[9px] text-brand-dim mt-0.5 block">Payment schedule deadlines missed. Send WhatsApp now.</span>
                      </div>
                    </div>
                  )}

                  {notifications.dueToday > 0 && (
                    <div className="p-3.5 flex items-start space-x-3 hover:bg-brand-border/10 transition cursor-pointer" onClick={() => { navigate('/collection'); setShowNotifications(false); }}>
                      <Bell className="w-4 h-4 text-brand-amber shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-white">{notifications.dueToday} Installments Due Today</p>
                        <span className="text-[9px] text-brand-dim mt-0.5 block">EMIs expected today. Check expected Collections card.</span>
                      </div>
                    </div>
                  )}

                  {notifications.paymentsReceived > 0 && (
                    <div className="p-3.5 flex items-start space-x-3 hover:bg-brand-border/10 transition cursor-pointer" onClick={() => { navigate('/transactions'); setShowNotifications(false); }}>
                      <Receipt className="w-4 h-4 text-brand-emerald shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-white">{notifications.paymentsReceived} Payments Received Today</p>
                        <span className="text-[9px] text-brand-dim mt-0.5 block">Check transaction timeline ledgers.</span>
                      </div>
                    </div>
                  )}

                  {notifications.readyToClose > 0 && (
                    <div className="p-3.5 flex items-start space-x-3 hover:bg-brand-border/10 transition cursor-pointer" onClick={() => { navigate('/loans'); setShowNotifications(false); }}>
                      <HandCoins className="w-4 h-4 text-brand-accent shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-white">{notifications.readyToClose} Loans Ready to Close</p>
                        <span className="text-[9px] text-brand-dim mt-0.5 block">Dues cleared. Generate printable No Dues Certificate.</span>
                      </div>
                    </div>
                  )}

                  {notifications.expiringDocs > 0 && (
                    <div className="p-3.5 flex items-start space-x-3 hover:bg-brand-border/10 transition">
                      <AlertTriangle className="w-4 h-4 text-brand-dim shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-white">KYC Documents Warning</p>
                        <span className="text-[9px] text-brand-dim mt-0.5 block">Audit flagged 1 verification file expiring soon.</span>
                      </div>
                    </div>
                  )}

                  {totalNotifications === 0 && (
                    <div className="p-6 text-center text-brand-dim text-xs">
                      All systems operating stable.
                    </div>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-brand-border/30 text-xs max-h-[300px] overflow-y-auto">
                  {pendingMessages.length === 0 ? (
                    <div className="p-6 text-center text-brand-dim text-xs">
                      No pending automated messages.
                    </div>
                  ) : (
                    pendingMessages.map((notif) => (
                      <div key={notif._id} className="p-3.5 hover:bg-brand-border/10 transition flex flex-col space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-white">{notif.customerId?.name || 'Borrower'}</p>
                            <span className="text-[8px] uppercase font-bold text-brand-accent block mt-0.5">{notif.type?.replace('_', ' ')}</span>
                          </div>
                          <span className="text-[9px] font-mono text-brand-dim">{notif.recipientPhone}</span>
                        </div>
                        <p className="text-[10px] text-brand-dim/80 bg-brand-bg/50 p-2 rounded-lg border border-brand-border/40 font-medium leading-relaxed italic">
                          "{notif.messageText}"
                        </p>
                        <div className="flex items-center justify-end space-x-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleDiscardWhatsApp(notif._id)}
                            className="p-1.5 rounded-lg border border-brand-rose/25 text-brand-rose hover:bg-brand-rose hover:text-white transition"
                            title="Discard Message"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSendWhatsApp(notif)}
                            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-brand-emerald hover:bg-emerald-600 text-[10px] font-bold text-white shadow transition"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Send</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        )}

      </div>

    </header>
  );
}
