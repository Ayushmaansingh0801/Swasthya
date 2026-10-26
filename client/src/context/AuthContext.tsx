import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, WorkspaceItem } from '../types';
import { api, ApiError } from '../services/api';

interface AuthContextType {
  user: User | null;
  workspaces: WorkspaceItem[];
  activeWorkspace: WorkspaceItem | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  switchWorkspace: (orgId: string | null) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  workspaces: [],
  activeWorkspace: null,
  token: null,
  isLoading: true,
  login: async () => { throw new Error('Not implemented'); },
  logout: () => {},
  switchWorkspace: async () => {},
  refreshUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('swasthya_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const activeWorkspace = workspaces.find((w) => w.organizationId === user?.activeWorkspaceId) || null;

  const refreshUser = async () => {
    const storedToken = localStorage.getItem('swasthya_token');
    if (!storedToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res: any = await api.get('/auth/me');
      if (res.success) {
        setUser(res.user);
        setWorkspaces(res.workspaces || []);
      }
    } catch (err) {
      console.warn('[Auth] Failed to refresh user session:', err);
      localStorage.removeItem('swasthya_token');
      localStorage.removeItem('swasthya_workspace_id');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res: any = await api.post('/auth/login', { email, password });
    if (res.success && res.accessToken) {
      localStorage.setItem('swasthya_token', res.accessToken);
      setToken(res.accessToken);
      setUser(res.user);
      setWorkspaces(res.workspaces || []);

      if (res.user.activeWorkspaceId) {
        localStorage.setItem('swasthya_workspace_id', res.user.activeWorkspaceId);
      } else {
        localStorage.removeItem('swasthya_workspace_id');
      }

      return res.user;
    }
    throw new Error('Authentication failed');
  };

  const logout = () => {
    localStorage.removeItem('swasthya_token');
    localStorage.removeItem('swasthya_workspace_id');
    setToken(null);
    setUser(null);
    setWorkspaces([]);
  };

  const switchWorkspace = async (orgId: string | null) => {
    const res: any = await api.post('/auth/switch-workspace', { organizationId: orgId });
    if (res.success && res.accessToken) {
      localStorage.setItem('swasthya_token', res.accessToken);
      setToken(res.accessToken);
      if (orgId) {
        localStorage.setItem('swasthya_workspace_id', orgId);
      } else {
        localStorage.removeItem('swasthya_workspace_id');
      }
      await refreshUser();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        workspaces,
        activeWorkspace,
        token,
        isLoading,
        login,
        logout,
        switchWorkspace,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
