import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth, UserRole } from '@/contexts/AuthContext';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  /**
   * Specific roles allowed to access this route.
   * Root users always have access.
   */
  allowedRoles?: UserRole[];
  /**
   * Minimum role level required (uses role hierarchy).
   * root > admin > leader > member
   */
  minimumRole?: UserRole;
  /**
   * If true, user must belong to a tenant to access.
   */
  requireTenant?: boolean;
  /**
   * Custom redirect path if access is denied.
   */
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles,
  minimumRole,
  requireTenant = false,
  redirectTo,
}) => {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading, profile, hasRole, hasMinimumRole, getTenantId } = useAuth();
  const location = useLocation();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Wait for profile to load
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Check role-based access
  if (allowedRoles && allowedRoles.length > 0) {
    if (!hasRole(allowedRoles)) {
      const fallback = redirectTo || (profile.role === 'root' ? '/tenants' : '/dashboard');
      return <Navigate to={fallback} replace />;
    }
  }

  // Check minimum role level
  if (minimumRole) {
    if (!hasMinimumRole(minimumRole)) {
      const fallback = redirectTo || (profile.role === 'root' ? '/tenants' : '/dashboard');
      return <Navigate to={fallback} replace />;
    }
  }

  // Check tenant requirement
  if (requireTenant) {
    const tenantId = getTenantId();
    
    if (!tenantId) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4 p-8">
            <h1 className="text-2xl font-bold text-foreground">
              {t('auth.noTenant', 'Sem Organização')}
            </h1>
            <p className="text-muted-foreground max-w-md">
              {t('auth.noTenantMessage', 'Você precisa pertencer a uma organização para acessar esta página.')}
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

/**
 * Route guard for root-only pages (e.g., /tenants management)
 */
export const RootOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={['root']} redirectTo="/dashboard">
    {children}
  </ProtectedRoute>
);

/**
 * Route guard for admin pages (root + admin)
 */
export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute minimumRole="admin" redirectTo="/dashboard">
    {children}
  </ProtectedRoute>
);

/**
 * Route guard for leader pages (root + admin + leader)
 */
export const LeaderRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute minimumRole="leader" redirectTo="/dashboard">
    {children}
  </ProtectedRoute>
);

/**
 * Route guard for authenticated users (all roles)
 */
export const AuthenticatedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute>
    {children}
  </ProtectedRoute>
);

export default ProtectedRoute;
