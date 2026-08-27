import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, CalendarClock, HandCoins, Menu } from 'lucide-react';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoginPage from './pages/LoginPage';
import ErrorBoundary from './components/ErrorBoundary';

import { useAuth } from './context/AuthContext';

// Lazy load pages for performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Customers = lazy(() => import('./pages/Customers'));
const CustomerDetails = lazy(() => import('./pages/CustomerDetails'));
const Loans = lazy(() => import('./pages/Loans'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Collection = lazy(() => import('./pages/Collection'));
const Reports = lazy(() => import('./pages/Reports'));
const CashBook = lazy(() => import('./pages/CashBook'));
const Settings = lazy(() => import('./pages/Settings'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard'));
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage'));
const BorrowerDashboard = lazy(() => import('./pages/BorrowerDashboard'));
const PublicPaymentPage = lazy(() => import('./pages/PublicPaymentPage'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsConditions = lazy(() => import('./pages/TermsConditions'));
const RefundPolicy = lazy(() => import('./pages/RefundPolicy'));
const ContactUs = lazy(() => import('./pages/ContactUs'));

const PageLoader = () => (
  <div className="h-full flex flex-col items-center justify-center py-24 space-y-4 animate-fade-in font-sans select-none">
    {/* Mini Animated RinSetu Logo Box */}
    <div className="relative w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 shadow-lg shadow-brand-accent/25 animate-logo-pulse">
      <div className="absolute inset-1 border border-white/20 rounded-[8px] pointer-events-none" />
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-white animate-percent-morph">
        <line x1="19" y1="5" x2="5" y2="19"></line>
        <circle cx="6.5" cy="6.5" r="2.5"></circle>
        <circle cx="17.5" cy="17.5" r="2.5"></circle>
      </svg>
    </div>
    <span className="text-[9px] text-brand-dim font-bold uppercase tracking-wider animate-pulse-soft">Loading panel data...</span>
  </div>
);

function CRMLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { admin, exitImpersonation } = useAuth();
  
  const isSuper = admin?.role === 'super-admin';
  const isBorrower = admin?.role === 'borrower';

  if (isBorrower) {
    return (
      <div className="flex bg-brand-bg min-h-screen w-full relative overflow-hidden">
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-h-screen relative z-10 w-full font-sans">
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<BorrowerDashboard />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    );
  }

  return (
    <div className="flex bg-brand-bg min-h-screen relative overflow-hidden">
      {/* Background Glow Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-accent/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-brand-emerald/5 blur-[120px] pointer-events-none" />

      {/* Sidebar Nav */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 pb-28 md:pb-8 overflow-y-auto max-h-screen relative z-10">
        {admin?.isImpersonating && (
          <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white text-xs font-extrabold py-3 px-6 rounded-2xl mb-6 shadow-xl border border-amber-500/20 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span>⚠️ Impersonation Mode: Accessing portal of <strong>{admin.businessName}</strong> ({admin.name})</span>
            </div>
            <button
              onClick={exitImpersonation}
              className="bg-white/10 hover:bg-white/20 active:bg-white/30 text-white border border-white/20 hover:border-white/40 transition duration-150 py-1.5 px-4 rounded-xl font-bold uppercase tracking-wider text-[10px] outline-none"
            >
              Exit & Return to Super Admin
            </button>
          </div>
        )}
        <div className="max-w-7xl mx-auto">
          {/* Global Search and Bell Alert Navbar Header */}
          <Header onMenuClick={() => setIsSidebarOpen(true)} />
          
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {isSuper ? (
                  <>
                    <Route path="/" element={<SuperAdminDashboard />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </>
                ) : (
                  <>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/customers" element={<Customers />} />
                    <Route path="/customers/:id" element={<CustomerDetails />} />
                    <Route path="/loans" element={<Loans />} />
                    <Route path="/transactions" element={<Transactions />} />
                    <Route path="/collection" element={<Collection />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/cashbook" element={<CashBook />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </>
                )}
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </div>
      </main>

      {/* Mobile Bottom Tab Bar */}
      {!isSuper && (
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-brand-card border-t border-brand-border flex items-center justify-around px-2 z-[90] md:hidden shadow-lg shadow-black/10">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1.5 transition-colors duration-150 ${
                isActive ? 'text-brand-accent' : 'text-brand-dim hover:text-brand-text'
              }`
            }
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[9px] font-bold mt-1">Home</span>
          </NavLink>
          <NavLink
            to="/customers"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1.5 transition-colors duration-150 ${
                isActive ? 'text-brand-accent' : 'text-brand-dim hover:text-brand-text'
              }`
            }
          >
            <Users className="w-5 h-5" />
            <span className="text-[9px] font-bold mt-1">Borrowers</span>
          </NavLink>
          <NavLink
            to="/loans"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1.5 transition-colors duration-150 ${
                isActive ? 'text-brand-accent' : 'text-brand-dim hover:text-brand-text'
              }`
            }
          >
            <HandCoins className="w-5 h-5" />
            <span className="text-[9px] font-bold mt-1">Loans</span>
          </NavLink>
          <NavLink
            to="/collection"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1.5 transition-colors duration-150 ${
                isActive ? 'text-brand-accent' : 'text-brand-dim hover:text-brand-text'
              }`
            }
          >
            <CalendarClock className="w-5 h-5" />
            <span className="text-[9px] font-bold mt-1">Collection</span>
          </NavLink>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="flex flex-col items-center justify-center flex-1 py-1.5 text-brand-dim hover:text-brand-text transition-colors duration-150 outline-none"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[9px] font-bold mt-1">More</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <Router>
          <Routes>
            {/* Public Route - Login */}
            <Route path="/login" element={<LoginPage />} />

            {/* Public Compliance Pages */}
            <Route path="/privacy-policy" element={<Suspense fallback={<PageLoader />}><PrivacyPolicy /></Suspense>} />
            <Route path="/terms-and-conditions" element={<Suspense fallback={<PageLoader />}><TermsConditions /></Suspense>} />
            <Route path="/refund-policy" element={<Suspense fallback={<PageLoader />}><RefundPolicy /></Suspense>} />
            <Route path="/contact-us" element={<Suspense fallback={<PageLoader />}><ContactUs /></Suspense>} />

            {/* Public Route - Direct VPA Repayment Page */}
            <Route path="/pay/loan/:loanId" element={<Suspense fallback={<PageLoader />}><PublicPaymentPage /></Suspense>} />

            {/* Subscription Page - Protected but outside standard sidebar layout */}
            <Route
              path="/subscription"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <SubscriptionPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />

            {/* Protected Routes */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <CRMLayout />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </ErrorBoundary>
    </AuthProvider>
  );
}
