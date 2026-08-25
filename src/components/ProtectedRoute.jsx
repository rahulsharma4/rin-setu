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
    <div className="min-h-screen bg-brand-bg flex items-center justify-center relative overflow-hidden font-sans">
      {/* Premium background gradient glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-brand-accent/5 blur-[120px] pointer-events-none" />
      
      <div className="text-center space-y-6 z-10 animate-fade-in px-4">
        {/* Premium double ring spin loader */}
        <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 border-4 border-brand-accent/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-brand-accent border-t-transparent rounded-full animate-spin" style={{ animationDuration: '0.8s' }} />
          <div className="w-8 h-8 rounded-full bg-brand-accent/10 animate-ping" />
        </div>

        <div className="space-y-1.5 max-w-sm mx-auto">
          <h2 className="text-sm font-extrabold text-brand-text dark:text-white uppercase tracking-widest">RinSetu Systems</h2>
          <p className="text-xs text-brand-dim font-medium">Verifying your secure session...</p>
          
          {showWakeupMessage && (
            <p className="text-[10px] text-brand-amber font-semibold animate-pulse-soft mt-3 bg-brand-amber/10 border border-brand-amber/20 rounded-xl px-4 py-2.5 leading-relaxed">
              ☕ The server is waking up from sleep mode (Render free tier spin-up can take 30-40 seconds). Thank you for your patience!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
