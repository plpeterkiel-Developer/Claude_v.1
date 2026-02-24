import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import client from '../api/client';
import i18n from '../i18n';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await client.get('/auth/me');
      setUser(data);
      // Sync language preference from profile
      if (data.preferredLanguage && data.preferredLanguage !== i18n.language) {
        i18n.changeLanguage(data.preferredLanguage);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = async (email, password) => {
    const { data } = await client.post('/auth/login', { email, password });
    setUser(data.user);
    if (data.user.preferredLanguage) {
      i18n.changeLanguage(data.user.preferredLanguage);
    }
    return data.user;
  };

  const logout = async () => {
    await client.post('/auth/logout');
    setUser(null);
  };

  const updateUser = (updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, refetch: fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
