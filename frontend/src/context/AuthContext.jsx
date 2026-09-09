import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchBusiness = async () => {
    try {
      const res = await api.get('/business/primary');
      setBusiness(res.data);
    } catch (err) {
      console.error('Failed to load primary business:', err);
    }
  };

  useEffect(() => {
    if (token) {
      api.get('/auth/me')
        .then((res) => {
          setUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
          fetchBusiness();
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { access_token, user: userData } = res.data;
    setToken(access_token);
    setUser(userData);
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(userData));
    await fetchBusiness();
    return userData;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setBusiness(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // Demo Switcher: Judge can switch roles in 1 click
  const switchRole = async (targetRole) => {
    const credentials = {
      ENTREPRENEUR: { email: 'demo@example.com', password: 'Demo123!' },
      OFFICER: { email: 'officer@example.com', password: 'Demo123!' },
      ADMIN: { email: 'admin@example.com', password: 'Demo123!' }
    };
    const cred = credentials[targetRole] || credentials.ENTREPRENEUR;
    return await login(cred.email, cred.password);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'GUEST',
        token,
        business,
        loading,
        login,
        logout,
        switchRole,
        refreshBusiness: fetchBusiness
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
