import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { sanitizeTenantId } from '@/lib/storage';

/**
 * Hook that provides tenant context for queries
 * with automatic tenant filtering for multi-tenant queries
 */
export const useTenantQuery = () => {
  const { profile, getTenantId, isRoot } = useAuth();

  /**
   * Get the effective tenant ID for queries
   */
  const effectiveTenantId = useMemo(() => {
    return getTenantId();
  }, [getTenantId]);

  /**
   * Build tenant filter for RPC calls
   */
  const getTenantFilter = useMemo(() => {
    if (!effectiveTenantId) return null;
    return sanitizeTenantId(effectiveTenantId);
  }, [effectiveTenantId]);

  /**
   * Check if current user can query across all tenants
   */
  const canQueryAllTenants = useMemo(() => {
    return isRoot() && !effectiveTenantId;
  }, [isRoot, effectiveTenantId]);

  /**
   * Get tenant ID to use in queries
   * Returns null if root user hasn't selected a tenant (for cross-tenant queries)
   */
  const queryTenantId = useMemo(() => {
    if (canQueryAllTenants) return null;
    return effectiveTenantId;
  }, [canQueryAllTenants, effectiveTenantId]);

  return {
    effectiveTenantId,
    getTenantFilter,
    canQueryAllTenants,
    queryTenantId,
    profile,
    isRoot: isRoot(),
  };
};

export default useTenantQuery;
