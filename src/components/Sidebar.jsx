import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  HandCoins, 
  History,
  Percent,
  CalendarClock,
  BarChart3,
  LogOut,
  ShieldCheck,
  BookOpen,
  Settings,
  X,
  CreditCard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const links = admin?.role === 'super-admin'
    ? [
        { to: '/', name: 'SaaS Command', icon: LayoutDashboard },
      ]
    : [
        { to: '/', name: 'Dashboard', icon: LayoutDashboard },
        { to: '/customers', name: 'Borrowers', icon: Users },
        { to: '/loans', name: 'Loans (Byaj)', icon: HandCoins },
        { to: '/collection', name: 'Collection', icon: CalendarClock },
        { to: '/transactions', name: 'Payment Ledger', icon: History },
        { to: '/cashbook', name: 'Cash Book', icon: BookOpen },
        { to: '/reports', name: 'Reports', icon: BarChart3 },
        { to: '/settings', name: 'Settings', icon: Settings },
        { to: '/subscription', name: 'Billing & Subscription', icon: CreditCard },
      ];

  return (
    <>
      {/* Backdrop overlay for mobile screens */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/70 z-[95] md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-[100] w-72 max-w-[85vw] bg-white dark:bg-[#0b0e1b] border-r border-brand-border flex flex-col h-[100dvh] md:h-screen pt-5 pb-20 md:pb-5 px-4 shrink-0 transition-transform duration-300 shadow-2xl overflow-y-auto md:overflow-y-visible md:sticky md:top-0 md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Header: Business Logo & Title */}
        <div className="flex items-center justify-between px-2 pb-3.5 border-b border-brand-border/40 shrink-0">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => { if(onClose) onClose(); navigate('/'); }}>
            <div className="w-9 h-9 flex items-center justify-center shrink-0 bg-transparent">
              <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-brand-accent drop-shadow-[0_2px_6px_rgba(156,39,176,0.35)]">
                <defs>
                  <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--brand-accent)" />
                    <stop offset="100%" stopColor="#db2777" />
                  </linearGradient>
                </defs>
                <line x1="19" y1="5" x2="5" y2="19" stroke="url(#logo-grad)" strokeWidth="3.2" strokeLinecap="round" />
                <circle cx="6.5" cy="6.5" r="2.2" stroke="url(#logo-grad)" strokeWidth="3.2" />
                <circle cx="17.5" cy="17.5" r="2.2" stroke="url(#logo-grad)" strokeWidth="3.2" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-brand-text dark:text-white tracking-wide leading-none max-w-[150px] truncate">
                {admin?.businessName || 'RinSetu'}
              </h1>
              <span className="text-[10px] text-brand-emerald font-semibold uppercase tracking-widest mt-1 block">Live Ledger</span>
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg border border-brand-border text-brand-dim hover:text-brand-text hover:bg-brand-bg dark:hover:text-white dark:hover:bg-brand-border/40 transition shrink-0"
            title="Close Navigation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Center Area for Navigation Links */}
        <nav className="flex-1 overflow-y-auto min-h-0 my-3 space-y-1 pr-1 scrollbar-thin">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                onClick={() => { if(onClose) onClose(); }} // Auto-closes sidebar drawer on click in mobile
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20'
                      : 'text-brand-dim hover:text-brand-text hover:bg-brand-bg dark:hover:text-white dark:hover:bg-brand-border/40'
                  }`
                }
              >
                <Icon className="w-4.5 h-4.5" />
                <span>{link.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer: Admin Info + Logout (Always Visible & Pinned Above Bottom Bar) */}
        <div className="space-y-2.5 border-t border-brand-border pt-3.5 px-1 shrink-0 mt-auto">
          {/* Admin Badge */}
          <div className="flex items-center space-x-3 px-2 py-2 bg-brand-bg/50 rounded-xl border border-brand-border">
            <div className="w-8 h-8 rounded-lg bg-brand-accent/15 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-brand-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-brand-text dark:text-white truncate">{admin?.username || 'Admin'}</p>
              <span className="text-[9px] text-brand-emerald font-semibold uppercase tracking-wider">
                {admin?.role === 'super-admin' ? 'Super Admin' : 'Administrator'}
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-brand-rose hover:text-white bg-brand-rose/10 hover:bg-brand-rose border border-brand-rose/20 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
