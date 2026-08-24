import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const getBaseUrl = () => {
  if (import.meta.env && import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }
  if (window.API_BASE) {
    return window.API_BASE.replace(/\/$/, '');
  }
  return (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5001'
    : 'https://api-rinsetu.onrender.com';
};

const API_BASE = `${getBaseUrl()}/api`;

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('byaj_admin_token'));
  const [admin, setAdmin] = useState(() => {
    const stored = localStorage.getItem('byaj_admin_info');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  // App load hone par token verify karo
  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem('byaj_admin_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.post(`${API_BASE}/auth/verify`, {}, {
          headers: { Authorization: `Bearer ${storedToken}` }
        });
        if (res.data.valid) {
          setToken(storedToken);
          setAdmin(res.data.admin);
        } else {
          logout();
        }
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  const login = async (username, password) => {
    const res = await axios.post(`${API_BASE}/auth/login`, { username, password });
    const { token: newToken, admin: adminInfo } = res.data;

    localStorage.setItem('byaj_admin_token', newToken);
    localStorage.setItem('byaj_admin_info', JSON.stringify(adminInfo));

    setToken(newToken);
    setAdmin(adminInfo);
    return adminInfo;
  };

  const logout = () => {
    localStorage.removeItem('byaj_admin_token');
    localStorage.removeItem('byaj_admin_info');
    localStorage.removeItem('byaj_super_token');
    localStorage.removeItem('byaj_super_info');
    setToken(null);
    setAdmin(null);
  };

  const impersonate = (newToken, newAdminInfo) => {
    localStorage.setItem('byaj_super_token', token);
    localStorage.setItem('byaj_super_info', JSON.stringify(admin));

    localStorage.setItem('byaj_admin_token', newToken);
    localStorage.setItem('byaj_admin_info', JSON.stringify(newAdminInfo));

    setToken(newToken);
    setAdmin(newAdminInfo);
  };

  const exitImpersonation = () => {
    const superToken = localStorage.getItem('byaj_super_token');
    const superInfo = localStorage.getItem('byaj_super_info');

    if (superToken && superInfo) {
      localStorage.setItem('byaj_admin_token', superToken);
      localStorage.setItem('byaj_admin_info', superInfo);
      
      localStorage.removeItem('byaj_super_token');
      localStorage.removeItem('byaj_super_info');

      setToken(superToken);
      setAdmin(JSON.parse(superInfo));
    } else {
      logout();
    }
  };

  const updateAdmin = (newToken, newAdminInfo) => {
    localStorage.setItem('byaj_admin_token', newToken);
    localStorage.setItem('byaj_admin_info', JSON.stringify(newAdminInfo));
    setToken(newToken);
    setAdmin(newAdminInfo);
  };

  return (
    <AuthContext.Provider value={{
      token,
      admin,
      loading,
      isAuthenticated: !!token,
      login,
      logout,
      impersonate,
      exitImpersonation,
      updateAdmin
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
