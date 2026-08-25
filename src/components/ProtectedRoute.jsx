import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, admin } = useAuth();

  // Token verify ho raha hai — wait karo
  if (loading) {
    return <VerificationLoadingScreen />;
  }

  // Authenticated nahi hai — Login page par bhejo
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Block access to normal pages if lender subscription has expired
  const isSubscriptionPage = window.location.pathname === '/subscription';
  if (admin?.role !== 'super-admin' && admin?.subscriptionStatus === 'expired' && !isSubscriptionPage) {
    return <Navigate to="/subscription" replace />;
  }

  return children;
}

function VerificationLoadingScreen() {
  const [showWakeupMessage, setShowWakeupMessage] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowWakeupMessage(true);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center relative overflow-hidden font-sans select-none">
      {/* Dynamic glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-brand-accent/5 blur-[120px] pointer-events-none animate-pulse-soft" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-brand-emerald/5 blur-[120px] pointer-events-none animate-pulse-soft" />
      
      <div className="text-center space-y-7 z-10 px-4">
        {/* Animated RinSetu Logo Box */}
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-accent to-indigo-400 shadow-2xl shadow-brand-accent/20 animate-bounce-slow">
          {/* Inner ring overlay */}
          <div className="absolute inset-1.5 border border-white/20 rounded-[10px] pointer-events-none" />
          {/* Spin/pulse particle */}
          <div className="absolute inset-0 border border-brand-accent rounded-2xl animate-ping opacity-40 scale-110" style={{ animationDuration: '2s' }} />
          
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-white animate-spin-slow">
            <line x1="19" y1="5" x2="5" y2="19"></line>
            <circle cx="6.5" cy="6.5" r="2.5"></circle>
            <circle cx="17.5" cy="17.5" r="2.5"></circle>
          </svg>
        </div>

        {/* Text Area */}
        <div className="space-y-2.5 max-w-sm mx-auto">
          <h1 className="text-2xl font-black text-brand-text dark:text-white tracking-tight">
            Rin<span className="text-brand-accent">Setu</span>
          </h1>
          <p className="text-xs text-brand-dim font-medium tracking-wide animate-pulse-soft">
            Verifying your secure session...
          </p>
          
          {showWakeupMessage && (
            <p className="text-[10px] text-brand-amber font-semibold animate-fade-in mt-4 bg-brand-amber/10 border border-brand-amber/20 rounded-xl px-4 py-2.5 leading-relaxed">
              ☕ The server is waking up from sleep mode (Render free tier spin-up can take 30-40 seconds). Thank you for your patience!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
