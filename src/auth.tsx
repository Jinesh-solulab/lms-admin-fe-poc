import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ApiError, api, session, User } from './api';
import { useI18n } from './i18n';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { lang } = useI18n();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!!session.getToken());

  const logout = useCallback(() => {
    session.setToken(null);
    setUser(null);
  }, []);

  // Expired / revoked token anywhere in the app -> back to login.
  useEffect(() => session.onUnauthorized(logout), [logout]);

  // Restore the session on page load.
  useEffect(() => {
    if (!session.getToken()) return;
    api
      .me()
      .then((u) => {
        if (u.role !== 'admin') logout();
        else setUser(u);
      })
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, [logout]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await api.login(email, password);
      if (data.user.role !== 'admin') throw new ApiError(403, 'Not an admin account');
      session.setToken(data.token);
      setUser(data.user);
      // The UI language is the source of truth; keep the server copy in sync so API messages match it.
      if (data.user.language !== lang) api.setLanguage(lang).catch(() => undefined);
    },
    [lang],
  );

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
