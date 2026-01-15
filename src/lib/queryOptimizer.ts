/**
 * Query optimization utilities to prevent N+1 queries and improve performance
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Batch fetch profiles by IDs to avoid N+1 queries
 */
export async function batchFetchProfiles(userIds: string[]): Promise<Map<string, { id: string; name: string; avatar_url: string | null }>> {
  if (userIds.length === 0) {
    return new Map();
  }

  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  
  const { data } = await supabase
    .from('profiles')
    .select('id, name, avatar_url')
    .in('id', uniqueIds);

  const profileMap = new Map<string, { id: string; name: string; avatar_url: string | null }>();
  
  if (data) {
    for (const profile of data) {
      profileMap.set(profile.id, profile);
    }
  }

  return profileMap;
}

/**
 * Batch fetch teams by IDs to avoid N+1 queries
 */
export async function batchFetchTeams(teamIds: string[]): Promise<Map<string, { id: string; name: string; color: string | null }>> {
  if (teamIds.length === 0) {
    return new Map();
  }

  const uniqueIds = [...new Set(teamIds.filter(Boolean))];
  
  const { data } = await supabase
    .from('teams')
    .select('id, name, color')
    .in('id', uniqueIds);

  const teamMap = new Map<string, { id: string; name: string; color: string | null }>();
  
  if (data) {
    for (const team of data) {
      teamMap.set(team.id, team);
    }
  }

  return teamMap;
}

/**
 * Batch fetch key results count by OKR IDs
 */
export async function batchFetchKeyResultCounts(okrIds: string[]): Promise<Map<string, number>> {
  if (okrIds.length === 0) {
    return new Map();
  }

  const uniqueIds = [...new Set(okrIds.filter(Boolean))];
  
  const { data } = await supabase
    .from('key_results')
    .select('okr_id')
    .in('okr_id', uniqueIds);

  const countMap = new Map<string, number>();
  
  // Initialize all with 0
  for (const id of uniqueIds) {
    countMap.set(id, 0);
  }
  
  if (data) {
    for (const kr of data) {
      const current = countMap.get(kr.okr_id) || 0;
      countMap.set(kr.okr_id, current + 1);
    }
  }

  return countMap;
}

/**
 * Batch fetch completed key results count by OKR IDs
 */
export async function batchFetchCompletedKeyResultCounts(okrIds: string[]): Promise<Map<string, number>> {
  if (okrIds.length === 0) {
    return new Map();
  }

  const uniqueIds = [...new Set(okrIds.filter(Boolean))];
  
  const { data } = await supabase
    .from('key_results')
    .select('okr_id, progress')
    .in('okr_id', uniqueIds)
    .gte('progress', 100);

  const countMap = new Map<string, number>();
  
  // Initialize all with 0
  for (const id of uniqueIds) {
    countMap.set(id, 0);
  }
  
  if (data) {
    for (const kr of data) {
      const current = countMap.get(kr.okr_id) || 0;
      countMap.set(kr.okr_id, current + 1);
    }
  }

  return countMap;
}

/**
 * Batch fetch team member counts
 */
export async function batchFetchTeamMemberCounts(teamIds: string[]): Promise<Map<string, number>> {
  if (teamIds.length === 0) {
    return new Map();
  }

  const uniqueIds = [...new Set(teamIds.filter(Boolean))];
  
  const { data } = await supabase
    .from('team_members')
    .select('team_id')
    .in('team_id', uniqueIds);

  const countMap = new Map<string, number>();
  
  // Initialize all with 0
  for (const id of uniqueIds) {
    countMap.set(id, 0);
  }
  
  if (data) {
    for (const member of data) {
      const current = countMap.get(member.team_id) || 0;
      countMap.set(member.team_id, current + 1);
    }
  }

  return countMap;
}

/**
 * Create a deferred batch loader for profile fetching
 * Useful for lazy loading in components
 */
export function createProfileBatchLoader() {
  let pendingIds: string[] = [];
  let batchPromise: Promise<Map<string, { id: string; name: string; avatar_url: string | null }>> | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return {
    load: (userId: string): Promise<{ id: string; name: string; avatar_url: string | null } | undefined> => {
      pendingIds.push(userId);

      if (!batchPromise) {
        batchPromise = new Promise((resolve) => {
          timeoutId = setTimeout(async () => {
            const idsToFetch = [...pendingIds];
            pendingIds = [];
            batchPromise = null;
            timeoutId = null;

            const result = await batchFetchProfiles(idsToFetch);
            resolve(result);
          }, 10); // 10ms debounce
        });
      }

      return batchPromise.then((map) => map.get(userId));
    },
    clear: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      pendingIds = [];
      batchPromise = null;
    },
  };
}

/**
 * Optimized pagination helper
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
  hasMore: boolean;
  currentPage: number;
  totalPages: number;
}

export function calculatePaginationRange(params: PaginationParams): { from: number; to: number } {
  const from = (params.page - 1) * params.pageSize;
  const to = from + params.pageSize - 1;
  return { from, to };
}

export function createPaginatedResult<T>(
  data: T[],
  totalCount: number,
  params: PaginationParams
): PaginatedResult<T> {
  const totalPages = Math.ceil(totalCount / params.pageSize);
  return {
    data,
    totalCount,
    hasMore: params.page < totalPages,
    currentPage: params.page,
    totalPages,
  };
}

/**
 * Query cache key generator for consistent caching
 */
export function generateQueryKey(
  entity: string,
  filters: Record<string, unknown> = {},
  pagination?: PaginationParams
): string[] {
  const filterKeys = Object.entries(filters)
    .filter(([, value]) => value !== undefined && value !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${JSON.stringify(value)}`);

  const key = [entity, ...filterKeys];
  
  if (pagination) {
    key.push(`page:${pagination.page}`, `size:${pagination.pageSize}`);
  }

  return key;
}
