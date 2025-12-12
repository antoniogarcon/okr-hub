import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { 
  clearSessionData, 
  getSelectedTenantId, 
  setSelectedTenantId, 
  sanitizeTenantId 
} from '@/lib/storage';

export type UserRole = 'root' | 'admin' | 'leader' | 'member';

// Role hierarchy for permission checks
const ROLE_HIERARCHY: Record<UserRole, number> = {
  root: 4,
  admin: 3,
  leader: 2,
  member: 1,
};

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
  // State
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  tenant: Tenant | null;
  selectedTenantId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Auth methods
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  signup: (email: string, password: string, name: string, tenantId?: string) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  
  // Role & permission helpers
  hasRole: (role: UserRole | UserRole[]) => boolean;
  hasMinimumRole: (minimumRole: UserRole) => boolean;
  isRoot: () => boolean;
  isAdmin: () => boolean;
  isLeader: () => boolean;
  
  // Tenant helpers
  getTenantId: () => string | null;
  setActiveTenant: (tenantId: string | null) => void;
  isTenantMember: (tenantId: string) => boolean;
  canAccessTenant: (tenantId: string) => boolean;
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
  const [selectedTenantId, setSelectedTenantIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile from auth-me edge function
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

        // For root users, restore selected tenant from storage
        if (data.role === 'root') {
          const storedTenantId = getSelectedTenantId();
          setSelectedTenantIdState(sanitizeTenantId(storedTenantId));
        } else {
          setSelectedTenantIdState(null);
        }
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log('Auth state changed:', event);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (event === 'SIGNED_OUT') {
          setProfile(null);
          setTenant(null);
          setSelectedTenantIdState(null);
          clearSessionData();
        } else if (newSession?.user) {
          // Defer profile fetch to avoid deadlock
          setTimeout(() => {
            fetchUserProfile(newSession.user.id);
          }, 0);
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

  // Login
  const login = useCallback(async (email: string, password: string) => {
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
  }, []);

  // Signup
  const signup = useCallback(async (email: string, password: string, name: string, tenantId?: string) => {
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
  }, []);

  // Logout
  const logout = useCallback(async () => {
    clearSessionData();
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setTenant(null);
    setSelectedTenantIdState(null);
  }, []);

  // Refresh session - Supabase handles this automatically, but we can force it
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Session refresh error:', error);
        return false;
      }

      if (data.session) {
        setSession(data.session);
        setUser(data.user);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Unexpected session refresh error:', error);
      return false;
    }
  }, []);

  // Refresh profile
  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchUserProfile(user.id);
    }
  }, [user, fetchUserProfile]);

  // Check if user has a specific role (root has all roles)
  const hasRole = useCallback((role: UserRole | UserRole[]): boolean => {
    if (!profile) return false;
    
    const roles = Array.isArray(role) ? role : [role];
    
    // Root has access to everything
    if (profile.role === 'root') return true;
    
    return roles.includes(profile.role);
  }, [profile]);

  // Check if user has minimum role level
  const hasMinimumRole = useCallback((minimumRole: UserRole): boolean => {
    if (!profile) return false;
    
    const userLevel = ROLE_HIERARCHY[profile.role];
    const requiredLevel = ROLE_HIERARCHY[minimumRole];
    
    return userLevel >= requiredLevel;
  }, [profile]);

  // Role shortcuts
  const isRoot = useCallback((): boolean => profile?.role === 'root', [profile]);
  const isAdmin = useCallback((): boolean => hasMinimumRole('admin'), [hasMinimumRole]);
  const isLeader = useCallback((): boolean => hasMinimumRole('leader'), [hasMinimumRole]);

  // Get effective tenant ID
  const getTenantId = useCallback((): string | null => {
    if (!profile) return null;
    
    // Root users can select a tenant
    if (profile.role === 'root' && selectedTenantId) {
      return sanitizeTenantId(selectedTenantId);
    }
    
    return sanitizeTenantId(profile.tenantId);
  }, [profile, selectedTenantId]);

  // Set active tenant (for root users)
  const setActiveTenant = useCallback((tenantId: string | null) => {
    if (profile?.role === 'root') {
      const sanitized = sanitizeTenantId(tenantId);
      setSelectedTenantIdState(sanitized);
      setSelectedTenantId(sanitized);
    }
  }, [profile]);

  // Check if user is member of a tenant
  const isTenantMember = useCallback((tenantId: string): boolean => {
    if (!profile) return false;
    
    if (profile.role === 'root') return true;
    
    return profile.tenantId === tenantId;
  }, [profile]);

  // Check if user can access a tenant's data
  const canAccessTenant = useCallback((tenantId: string): boolean => {
    if (!profile) return false;
    
    // Root can access any tenant
    if (profile.role === 'root') return true;
    
    // Others can only access their own tenant
    return profile.tenantId === tenantId;
  }, [profile]);

  // Memoized context value
  const value = useMemo<AuthContextType>(() => ({
    // State
    user,
    session,
    profile,
    tenant,
    selectedTenantId,
    isLoading,
    isAuthenticated: !!user && !!session,
    
    // Auth methods
    login,
    signup,
    logout,
    refreshSession,
    refreshProfile,
    
    // Role helpers
    hasRole,
    hasMinimumRole,
    isRoot,
    isAdmin,
    isLeader,
    
    // Tenant helpers
    getTenantId,
    setActiveTenant,
    isTenantMember,
    canAccessTenant,
  }), [
    user,
    session,
    profile,
    tenant,
    selectedTenantId,
    isLoading,
    login,
    signup,
    logout,
    refreshSession,
    refreshProfile,
    hasRole,
    hasMinimumRole,
    isRoot,
    isAdmin,
    isLeader,
    getTenantId,
    setActiveTenant,
    isTenantMember,
    canAccessTenant,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
