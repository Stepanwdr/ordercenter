import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import type { User, UserRole } from '@shared/types';
import { api } from '@shared/api/base';

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
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

  const logout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem('order_center_access_token');
    localStorage.removeItem('order_center_refresh_token');
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, login, register, logout }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
