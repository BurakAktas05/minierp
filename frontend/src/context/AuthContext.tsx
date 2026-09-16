import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Tenant } from '../types';
import { authApi } from '../api/authApi';
import { TOKEN_KEY, TENANT_KEY, USER_KEY, DEMO_MODE_KEY } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  activeTenant: string;
  tenants: Tenant[];
  isLoading: boolean;
  isDemoMode: boolean;
  login: (tenantId: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  switchTenant: (tenantId: string) => void;
  createTenant: (tenantId: string, name: string) => Promise<void>;
  toggleDemoMode: () => void;
  isAdmin: boolean;
  isManager: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(USER_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [activeTenant, setActiveTenant] = useState<string>(() => localStorage.getItem(TENANT_KEY) || 'tenant_tekstil');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => localStorage.getItem(DEMO_MODE_KEY) === 'true');

  const fetchTenants = async () => {
    try {
      const list = await authApi.getTenants();
      setTenants(list);
    } catch (err) {
      console.error('Error fetching tenants:', err);
    }
  };

  useEffect(() => {
    fetchTenants();
    // Default demo user if not logged in
    if (!user) {
      const defaultUser: User = {
        username: 'admin',
        role: 'ROLE_ADMIN',
        tenantId: activeTenant,
        fullName: 'Sistem Yöneticisi',
      };
      setUser(defaultUser);
      localStorage.setItem(USER_KEY, JSON.stringify(defaultUser));
      localStorage.setItem(TENANT_KEY, activeTenant);
    }
  }, []);

  const login = async (tenantId: string, username: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(tenantId, username, password);
      const loggedUser: User = {
        username: res.username,
        role: res.role,
        tenantId: res.tenantId,
        fullName: res.username === 'admin' ? 'Sistem Yöneticisi' : res.username,
      };
      setUser(loggedUser);
      setToken(res.token);
      setActiveTenant(res.tenantId);

      localStorage.setItem(TOKEN_KEY, res.token);
      localStorage.setItem(TENANT_KEY, res.tenantId);
      localStorage.setItem(USER_KEY, JSON.stringify(loggedUser));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const switchTenant = (tenantId: string) => {
    setActiveTenant(tenantId);
    localStorage.setItem(TENANT_KEY, tenantId);
    if (user) {
      const updated = { ...user, tenantId };
      setUser(updated);
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
    }
    // Reload window to re-fetch all schema data
    window.location.reload();
  };

  const createTenant = async (tenantId: string, name: string) => {
    await authApi.createTenant({ tenantId, name });
    await fetchTenants();
  };

  const toggleDemoMode = () => {
    const next = !isDemoMode;
    setIsDemoMode(next);
    localStorage.setItem(DEMO_MODE_KEY, String(next));
  };

  const isAdmin = user?.role === 'ROLE_ADMIN';
  const isManager = user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_MANAGER';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        activeTenant,
        tenants,
        isLoading,
        isDemoMode,
        login,
        logout,
        switchTenant,
        createTenant,
        toggleDemoMode,
        isAdmin,
        isManager,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
