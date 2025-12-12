import { useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeTenantId, getSelectedTenantId } from '@/lib/storage';

interface ApiClientOptions {
  includeAuth?: boolean;
  includeTenant?: boolean;
}

interface InvokeOptions {
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
}

/**
 * Custom hook for making API calls with automatic tenant and auth headers
 */
export const useApiClient = () => {
  const { session, profile } = useAuth();

  // Get the effective tenant ID (for root users, check selected tenant)
  const getEffectiveTenantId = useCallback((): string | null => {
    if (!profile) return null;

    // Root users can select a tenant
    if (profile.role === 'root') {
      const selectedTenant = getSelectedTenantId();
      return sanitizeTenantId(selectedTenant) || sanitizeTenantId(profile.tenantId);
    }

    // Other users use their assigned tenant
    return sanitizeTenantId(profile.tenantId);
  }, [profile]);

  // Build headers for API calls
  const buildHeaders = useCallback((options: ApiClientOptions = {}): Record<string, string> => {
    const headers: Record<string, string> = {};

    // Add tenant header if needed
    if (options.includeTenant !== false) {
      const tenantId = getEffectiveTenantId();
      if (tenantId) {
        headers['X-Tenant-ID'] = tenantId;
      }
    }

    return headers;
  }, [getEffectiveTenantId]);

  // Invoke edge function with automatic headers
  const invokeFunction = useCallback(async <T = unknown>(
    functionName: string,
    options: InvokeOptions = {}
  ): Promise<{ data: T | null; error: Error | null }> => {
    try {
      const headers = {
        ...buildHeaders({ includeTenant: true }),
        ...options.headers,
      };

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: options.body,
        headers,
      });

      if (error) {
        // Handle 401 - Supabase client automatically handles token refresh
        console.error(`Error invoking ${functionName}:`, error);
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as T, error: null };
    } catch (error) {
      console.error(`Unexpected error invoking ${functionName}:`, error);
      return { data: null, error: error as Error };
    }
  }, [buildHeaders]);

  // Check if user is authenticated with valid session
  const isAuthenticated = useCallback((): boolean => {
    if (!session?.access_token) return false;
    
    // Check if token is expired
    const expiresAt = session.expires_at;
    if (expiresAt && Date.now() / 1000 > expiresAt) {
      return false;
    }

    return true;
  }, [session]);

  // Get current tenant ID
  const getTenantId = useCallback((): string | null => {
    return getEffectiveTenantId();
  }, [getEffectiveTenantId]);

  return useMemo(() => ({
    invokeFunction,
    buildHeaders,
    isAuthenticated,
    getTenantId,
    getEffectiveTenantId,
  }), [invokeFunction, buildHeaders, isAuthenticated, getTenantId, getEffectiveTenantId]);
};

export default useApiClient;
