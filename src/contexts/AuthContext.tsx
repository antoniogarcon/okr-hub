import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'root' | 'admin' | 'leader' | 'member';

export interface UserProfile {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string | null;
  avatarUrl: string | null;
  isActive: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  tenant: Tenant | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  signup: (email: string, password: string, name: string, tenantId?: string) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  isTenantMember: (tenantId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      
      const { data, error } = await supabase.functions.invoke('auth-me');
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }

      if (data) {
        setProfile({
          id: data.profile?.id || '',
          userId: data.id,
          email: data.email,
          name: data.name,
          role: data.role as UserRole,
          tenantId: data.tenantId,
          avatarUrl: data.avatarUrl,
          isActive: data.profile?.is_active ?? true,
        });

        if (data.tenant) {
          setTenant({
            id: data.tenant.id,
            name: data.tenant.name,
            slug: data.tenant.slug,
            isActive: data.tenant.is_active,
          });
        }
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log('Auth state changed:', event);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user) {
          // Defer profile fetch to avoid deadlock
          setTimeout(() => {
            fetchUserProfile(newSession.user.id);
          }, 0);
        } else {
          setProfile(null);
          setTenant(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      
      if (existingSession?.user) {
        fetchUserProfile(existingSession.user.id);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchUserProfile]);

  const login = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        console.error('Login error:', error.message);
        return { error: new Error(error.message) };
      }

      return { error: null };
    } catch (error) {
      console.error('Unexpected login error:', error);
      return { error: error as Error };
    }
  };

  const signup = async (email: string, password: string, name: string, tenantId?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name,
            tenant_id: tenantId || null,
            role: 'member',
          },
        },
      });

      if (error) {
        console.error('Signup error:', error.message);
        
        if (error.message.includes('already registered')) {
          return { error: new Error('Este email já está cadastrado') };
        }
        
        return { error: new Error(error.message) };
      }

      return { error: null };
    } catch (error) {
      console.error('Unexpected signup error:', error);
      return { error: error as Error };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setTenant(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id);
    }
  };

  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!profile) return false;
    
    const roles = Array.isArray(role) ? role : [role];
    
    if (profile.role === 'root') return true;
    
    return roles.includes(profile.role);
  };

  const isTenantMember = (tenantId: string): boolean => {
    if (!profile) return false;
    
    if (profile.role === 'root') return true;
    
    return profile.tenantId === tenantId;
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    tenant,
    isLoading,
    isAuthenticated: !!user && !!session,
    login,
    signup,
    logout,
    refreshProfile,
    hasRole,
    isTenantMember,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
