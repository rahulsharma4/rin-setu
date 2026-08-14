import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  // Token verify ho raha hai — wait karo
  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-brand-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-brand-dim font-medium">Session verify ho raha hai...</p>
        </div>
      </div>
    );
  }

  // Authenticated nahi hai — Login page par bhejo
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
