import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api.js';
import { clearAuth, getStoredAuth, saveAuth } from '../utils/authStorage.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => getStoredAuth());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const storedAuth = getStoredAuth();

    if (!storedAuth?.token) {
      setIsLoading(false);
      return undefined;
    }

    api.get('/auth/me')
      .then(({ data }) => {
        if (!isMounted) return;
        const refreshedAuth = { token: storedAuth.token, user: data.data.user };
        saveAuth(refreshedAuth);
        setAuth(refreshedAuth);
      })
      .catch(() => {
        if (!isMounted) return;
        clearAuth();
        setAuth(null);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleAuthExpired = () => {
      clearAuth();
      setAuth(null);
    };

    window.addEventListener('aarogya-auth-expired', handleAuthExpired);
    return () => window.removeEventListener('aarogya-auth-expired', handleAuthExpired);
  }, []);

  const login = async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    const nextAuth = { token: data.data.token, user: data.data.user };
    saveAuth(nextAuth);
    setAuth(nextAuth);
    return nextAuth.user;
  };

  const logout = () => {
    clearAuth();
    setAuth(null);
  };

  const value = useMemo(() => ({
    user: auth?.user || null,
    role: auth?.user?.role || null,
    token: auth?.token || null,
    isLoading,
    isAuthenticated: Boolean(auth?.token && auth?.user),
    login,
    logout,
  }), [auth, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
