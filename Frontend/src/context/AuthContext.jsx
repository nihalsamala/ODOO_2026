import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import { getMockDb } from '../services/mockData';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('subscriptiq_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('subscriptiq_token') || null;
  });

  const [loading, setLoading] = useState(false);

  // Sync token and user in localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('subscriptiq_token', token);
    } else {
      localStorage.removeItem('subscriptiq_token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('subscriptiq_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('subscriptiq_user');
    }
  }, [user]);

  // Listen to unauthorized events from api interceptor
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('subscriptiq_unauthorized', handleUnauthorized);
    return () => window.removeEventListener('subscriptiq_unauthorized', handleUnauthorized);
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const data = await authService.login(credentials);
      // Backend contract returns { token, type, userId, email, fullName, role, customerId }
      const authToken = data.token || data.accessToken || 'mock-token';
      const authUser = data.user || {
        id: data.userId || data.id || 'usr_1',
        name: data.fullName || data.name || credentials.email.split('@')[0],
        fullName: data.fullName || data.name,
        email: data.email || credentials.email,
        role: data.role || 'STAFF',
        customerId: data.customerId || null,
      };

      setToken(authToken);
      setUser(authUser);
      return { success: true, user: authUser };
    } catch (err) {
      return {
        success: false,
        message: err.message || 'Login failed. Please check your credentials.',
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setToken(null);
    setUser(null);
  };

  /**
   * Quick role-switcher utility for hackathon presentations.
   * Allows judges and team to test Admin vs Staff vs Customer view instantly.
   */
  const switchDemoRole = (role) => {
    const db = getMockDb();
    const targetUser = db.users.find((u) => u.role === role) || {
      id: `usr_${role.toLowerCase()}`,
      name: `${role} Demo User`,
      email: `${role.toLowerCase()}@subscriptiq.io`,
      role: role,
      token: `demo-token-${role.toLowerCase()}`,
    };
    setUser(targetUser);
    setToken(targetUser.token);
  };

  const isAuthenticated = Boolean(user && token);
  const isAdmin = user?.role === 'ADMIN';
  const isStaff = user?.role === 'STAFF';
  const isCustomer = user?.role === 'CUSTOMER';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        switchDemoRole,
        isAuthenticated,
        isAdmin,
        isStaff,
        isCustomer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
