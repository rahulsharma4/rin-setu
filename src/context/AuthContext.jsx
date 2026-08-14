import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_BASE = 'http://localhost:5001/api';

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
    setToken(null);
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{
      token,
      admin,
      loading,
      isAuthenticated: !!token,
      login,
      logout
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
