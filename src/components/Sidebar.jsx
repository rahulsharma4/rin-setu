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
  X
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
      ];

  return (
    <>
      {/* Backdrop overlay for mobile screens */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-[100] w-64 bg-brand-card border-r border-brand-border flex flex-col h-screen py-6 px-4 shrink-0 transition-transform duration-300 md:sticky md:top-0 md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between px-2 pb-4 border-b border-brand-border/30 shrink-0">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => { if(onClose) onClose(); navigate('/'); }}>
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-brand-accent/25 shrink-0"
              style={{ backgroundColor: 'var(--brand-accent)' }}
            >
              <Percent className="w-5 h-5" style={{ color: '#ffffff' }} />
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
        <nav className="flex-1 overflow-y-auto my-4 space-y-1 pr-1 scrollbar-thin">
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

        {/* Footer: Admin Info + Logout (Fixed Bottom) */}
        <div className="space-y-3 border-t border-brand-border pt-4 px-1 shrink-0">
        {/* Admin Badge */}
        <div className="flex items-center space-x-3 px-2 py-2 bg-brand-bg/50 rounded-xl border border-brand-border">
          <div className="w-8 h-8 rounded-lg bg-brand-accent/15 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-brand-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{admin?.username || 'Admin'}</p>
            <span className="text-[9px] text-brand-emerald font-semibold uppercase tracking-wider">
              {admin?.role === 'super-admin' ? 'Super Admin' : 'Administrator'}
            </span>
          </div>
        </div>

        {/* Connection Status */}
        <div className="flex items-center space-x-2 px-2">
          <div className="w-2 h-2 rounded-full bg-brand-emerald animate-pulse shrink-0" />
          <span className="text-[10px] font-semibold text-brand-dim tracking-wide">Connected to Atlas</span>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-brand-dim hover:text-brand-rose hover:bg-brand-rose/5 border border-transparent hover:border-brand-rose/20 transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
    </>
  );
}
