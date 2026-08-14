import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoginPage from './pages/LoginPage';

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

const PageLoader = () => (
  <div className="h-full flex items-center justify-center py-24">
    <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
  </div>
);

function CRMLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { admin, exitImpersonation } = useAuth();
  
  const isSuper = admin?.role === 'super-admin';

  return (
    <div className="flex bg-brand-bg min-h-screen relative overflow-hidden">
      {/* Background Glow Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-accent/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-brand-emerald/5 blur-[120px] pointer-events-none" />

      {/* Sidebar Nav */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8 overflow-y-auto max-h-screen relative z-10">
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
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Route - Login */}
          <Route path="/login" element={<LoginPage />} />

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
    </AuthProvider>
  );
}
