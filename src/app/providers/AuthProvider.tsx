import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import type { User } from '@shared/types';

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => void;
  register: (name: string, email: string, password: string) => void;
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

  const login = (email: string, password: string) => {
    const registeredUser = loadRegisteredUsers().find(
      (registered) => registered.email.toLowerCase() === email.toLowerCase()
    );

    if (registeredUser && registeredUser.password !== password) {
      throw new Error('Incorrect password');
    }

    const nextUser = {
      email,
      name: registeredUser?.name,
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const register = (name: string, email: string, password: string) => {
    const users = loadRegisteredUsers();
    const normalizedEmail = email.toLowerCase();
    const hasUser = users.some((registered) => registered.email.toLowerCase() === normalizedEmail);

    if (hasUser) {
      throw new Error('An account with this email already exists');
    }

    const nextUser = {
      name,
      email,
    };

    saveRegisteredUsers([
      ...users,
      {
        ...nextUser,
        password,
      },
    ]);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const logout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
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
