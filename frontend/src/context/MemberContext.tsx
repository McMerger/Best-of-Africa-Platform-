import React, { createContext, useContext, useState, useEffect } from 'react';
import { request } from '../services/api';

interface MemberData {
  tier: string;
  name: string;
  expires_in_days: number | null;
}

interface MemberContextType {
  isMember: boolean;
  memberData: MemberData | null;
  token: string | null;
  login: (token: string, data: MemberData) => void;
  logout: () => void;
  isLoading: boolean;
}

const MemberContext = createContext<MemberContextType | undefined>(undefined);

export const MemberProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('boa_auth_token'));
  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync token to localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('boa_auth_token', token);
    } else {
      localStorage.removeItem('boa_auth_token');
      setMemberData(null);
    }
  }, [token]);

  // Validate token with server on mount or token change
  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    request<{ member: boolean; tier?: string; name?: string; expires_in_days?: number | null; reason?: string }>(
      '/members/me',
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then(res => {
        if (!isMounted) return;
        if (res.member && res.tier && res.name) {
          setMemberData({ tier: res.tier, name: res.name, expires_in_days: res.expires_in_days ?? null });
        } else {
          // Token is invalid or expired
          setToken(null);
        }
      })
      .catch(() => {
        if (isMounted) {
          // On network error or 401, clear token
          setToken(null);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, [token]);

  // Listen for global 401 events from the API layer
  useEffect(() => {
    const handler = () => {
      setToken(null);
    };
    window.addEventListener('boa:auth:unauthorized', handler);
    return () => window.removeEventListener('boa:auth:unauthorized', handler);
  }, []);

  const login = (newToken: string, data: MemberData) => {
    setMemberData(data);
    setToken(newToken);
  };

  const logout = () => {
    setToken(null);
  };

  return (
    <MemberContext.Provider value={{ isMember: !!token && !!memberData, memberData, token, login, logout, isLoading }}>
      {children}
    </MemberContext.Provider>
  );
};

export const useMember = () => {
  const context = useContext(MemberContext);
  if (context === undefined) {
    throw new Error('useMember must be used within a MemberProvider');
  }
  return context;
};
