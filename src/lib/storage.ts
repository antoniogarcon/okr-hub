/**
 * Secure storage utilities
 * Uses sessionStorage for sensitive data (cleared on tab close)
 * and localStorage for non-sensitive preferences
 */

const STORAGE_KEYS = {
  LANGUAGE: 'okrs_view_language',
  THEME: 'okrs_view_theme',
  SELECTED_TENANT: 'okrs_view_selected_tenant',
} as const;

// Language storage (non-sensitive, persists across sessions)
export const getStoredLanguage = (): string => {
  try {
    return localStorage.getItem(STORAGE_KEYS.LANGUAGE) || 'pt-BR';
  } catch {
    return 'pt-BR';
  }
};

export const setStoredLanguage = (lang: string): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
  } catch (error) {
    console.error('Failed to store language preference:', error);
  }
};

// Theme storage
export const getStoredTheme = (): 'light' | 'dark' | 'system' => {
  try {
    const theme = localStorage.getItem(STORAGE_KEYS.THEME);
    if (theme === 'light' || theme === 'dark' || theme === 'system') {
      return theme;
    }
    return 'system';
  } catch {
    return 'system';
  }
};

export const setStoredTheme = (theme: 'light' | 'dark' | 'system'): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch (error) {
    console.error('Failed to store theme preference:', error);
  }
};

// Selected tenant for root users (session-scoped for security)
export const getSelectedTenantId = (): string | null => {
  try {
    return sessionStorage.getItem(STORAGE_KEYS.SELECTED_TENANT);
  } catch {
    return null;
  }
};

export const setSelectedTenantId = (tenantId: string | null): void => {
  try {
    if (tenantId) {
      sessionStorage.setItem(STORAGE_KEYS.SELECTED_TENANT, tenantId);
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.SELECTED_TENANT);
    }
  } catch (error) {
    console.error('Failed to store selected tenant:', error);
  }
};

export const clearSelectedTenantId = (): void => {
  try {
    sessionStorage.removeItem(STORAGE_KEYS.SELECTED_TENANT);
  } catch (error) {
    console.error('Failed to clear selected tenant:', error);
  }
};

// Clear all session data on logout
export const clearSessionData = (): void => {
  try {
    sessionStorage.removeItem(STORAGE_KEYS.SELECTED_TENANT);
  } catch (error) {
    console.error('Failed to clear session data:', error);
  }
};

// Sanitize tenant ID to prevent injection
export const sanitizeTenantId = (tenantId: string | null | undefined): string | null => {
  if (!tenantId) return null;
  
  // UUID format validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  const sanitized = tenantId.trim();
  
  if (!uuidRegex.test(sanitized)) {
    console.warn('Invalid tenant ID format:', tenantId);
    return null;
  }
  
  return sanitized;
};
