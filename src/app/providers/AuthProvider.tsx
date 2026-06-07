import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import type { User, UserRole } from '@shared/types';
import { api } from '@shared/api/base';

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const AUTH_STORAGE_KEY = 'order_center_user';
const REGISTERED_USERS_STORAGE_KEY = 'order_center_registered_users';

type RegisteredUser = User & {
  password: string;
};

const loadRegisteredUsers = (): RegisteredUser[] => {
  const stored = localStorage.getItem(REGISTERED_USERS_STORAGE_KEY);
  if (!stored) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem(REGISTERED_USERS_STORAGE_KEY);
    return [];
  }
};

const saveRegisteredUsers = (users: RegisteredUser[]) => {
  localStorage.setItem(REGISTERED_USERS_STORAGE_KEY, JSON.stringify(users));
};

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<User | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
  }, []);

  // The axios interceptor dispatches this when a request gets 401 (invalid/expired token).
  useEffect(() => {
    const handler = () => {
      setUser(null);
      setSessionExpired(true);
    };
    window.addEventListener('auth:session-expired', handler);
    return () => window.removeEventListener('auth:session-expired', handler);
  }, []);

  const login = async (email: string, password: string) => {
    // Call backend login API via axios base api
    const response = await api.post('/auth/login', { email, password });
    const data = response?.data?.data;
    if (!data?.user || !data?.accessToken) {
      throw new Error('Invalid login response');
    }
    const nextUser = {
      email: data.user.email,
      name: data.user.name,
      role: data.user.role,
    } as User;
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
    localStorage.setItem('order_center_access_token', data.accessToken);
    localStorage.setItem('order_center_refresh_token', data.refreshToken);
    setUser(nextUser);
  };

  const register = async (name: string, email: string, password: string, role: UserRole) => {
    // Call backend registration API via axios base api
    const response = await api.post('/auth/register', {
      name,
      email,
      password,
      role,
    });
    const data = response?.data?.data;
    if (!data?.user || !data?.accessToken) {
      throw new Error('Invalid registration response');
    }
    const nextUser = {
      email: data.user.email,
      name: data.user.name,
      role: data.user.role,
    } as User;
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
    localStorage.setItem('order_center_access_token', data.accessToken);
    localStorage.setItem('order_center_refresh_token', data.refreshToken);
    setUser(nextUser);
  };

  const updateProfile = (updates: Partial<User>) => {
    setUser((prev) => {
      const next = { ...(prev as User), ...updates };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const logout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem('order_center_access_token');
    localStorage.removeItem('order_center_refresh_token');
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, login, register, logout, updateProfile }),
    [user]
  );

  const handleRelogin = () => {
    setSessionExpired(false);
    logout();
    window.location.assign('/login');
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {sessionExpired && <SessionExpiredModal onRelogin={handleRelogin} />}
    </AuthContext.Provider>
  );
};

const SessionExpiredModal = ({ onRelogin }: { onRelogin: () => void }) => (
  <div
    role="dialog"
    aria-modal="true"
    style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      display: 'grid',
      placeItems: 'center',
      background: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(2px)',
      padding: 16,
    }}
  >
    <div
      style={{
        width: '100%',
        maxWidth: 360,
        background: '#141824',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        padding: '28px 24px',
        textAlign: 'center',
        color: '#fff',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Նստաշրջանն ավարտվել է</div>
      <div style={{ fontSize: 14, opacity: 0.65, lineHeight: 1.5, marginBottom: 22 }}>
        Ձեր մուտքի ժամկետը լրացել է։ Շարունակելու համար մուտք գործեք կրկին։
      </div>
      <button
        onClick={onRelogin}
        style={{
          width: '100%',
          padding: 14,
          border: 'none',
          borderRadius: 12,
          background: '#4f8fff',
          color: '#fff',
          fontSize: 15,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Մուտք գործել
      </button>
    </div>
  </div>
);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
