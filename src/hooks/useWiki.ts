import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface WikiCategory {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface WikiDocument {
  id: string;
  tenant_id: string;
  category_id: string | null;
  title: string;
  content: string;
  author_id: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface WikiVersion {
  id: string;
  document_id: string;
  title: string;
  content: string;
  author_id: string | null;
  version_number: number;
  created_at: string;
  author?: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
}

export interface CreateDocumentInput {
  title: string;
  content: string;
  category_id?: string | null;
}

export interface UpdateDocumentInput {
  id: string;
  title?: string;
  content?: string;
  category_id?: string | null;
}

export interface CreateCategoryInput {
  name: string;
  slug: string;
  description?: string;
  sort_order?: number;
}

// Hook to fetch wiki categories
export const useWikiCategories = () => {
  const { getTenantId } = useAuth();
  const tenantId = getTenantId();

  return useQuery({
    queryKey: ['wiki-categories', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const { data, error } = await supabase
        .from('wiki_categories')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as WikiCategory[];
    },
    enabled: !!tenantId,
  });
};

// Hook to fetch wiki documents
export const useWikiDocuments = (categoryId?: string | null, searchQuery?: string) => {
  const { getTenantId } = useAuth();
  const tenantId = getTenantId();

  return useQuery({
    queryKey: ['wiki-documents', tenantId, categoryId, searchQuery],
    queryFn: async () => {
      if (!tenantId) return [];

      let query = supabase
        .from('wiki_documents')
        .select(`
          *,
          author:profiles!wiki_documents_author_id_fkey(id, name, avatar_url),
          category:wiki_categories!wiki_documents_category_id_fkey(id, name, slug)
        `)
        .eq('tenant_id', tenantId)
        .eq('is_deleted', false)
        .order('updated_at', { ascending: false });

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      if (searchQuery && searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as WikiDocument[];
    },
    enabled: !!tenantId,
  });
};

// Hook to fetch a single document
export const useWikiDocument = (documentId: string | null) => {
  const { getTenantId } = useAuth();
  const tenantId = getTenantId();

  return useQuery({
    queryKey: ['wiki-document', documentId],
    queryFn: async () => {
      if (!documentId || !tenantId) return null;

      const { data, error } = await supabase
        .from('wiki_documents')
        .select(`
          *,
          author:profiles!wiki_documents_author_id_fkey(id, name, avatar_url),
          category:wiki_categories!wiki_documents_category_id_fkey(id, name, slug)
        `)
        .eq('id', documentId)
        .eq('is_deleted', false)
        .maybeSingle();

      if (error) throw error;
      return data as WikiDocument | null;
    },
    enabled: !!documentId && !!tenantId,
  });
};

// Hook to fetch document versions
export const useWikiVersions = (documentId: string | null) => {
  return useQuery({
    queryKey: ['wiki-versions', documentId],
    queryFn: async () => {
      if (!documentId) return [];

      const { data, error } = await supabase
        .from('wiki_versions')
        .select(`
          *,
          author:profiles!wiki_versions_author_id_fkey(id, name, avatar_url)
        `)
        .eq('document_id', documentId)
        .order('version_number', { ascending: false });

      if (error) throw error;
      return data as WikiVersion[];
    },
    enabled: !!documentId,
  });
};

// Hook for document mutations
export const useWikiMutations = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { getTenantId, profile } = useAuth();
  const tenantId = getTenantId();

  const createDocument = useMutation({
    mutationFn: async (input: CreateDocumentInput) => {
      if (!tenantId || !profile) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('wiki_documents')
        .insert({
          tenant_id: tenantId,
          title: input.title,
          content: input.content,
          category_id: input.category_id || null,
          author_id: profile.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wiki-documents'] });
      toast.success(t('wiki.createSuccess'));
    },
    onError: (error) => {
      console.error('Error creating document:', error);
      toast.error(t('wiki.createError'));
    },
  });

  const updateDocument = useMutation({
    mutationFn: async (input: UpdateDocumentInput) => {
      if (!profile) throw new Error('Not authenticated');

      const updates: Record<string, unknown> = { author_id: profile.id };
      if (input.title !== undefined) updates.title = input.title;
      if (input.content !== undefined) updates.content = input.content;
      if (input.category_id !== undefined) updates.category_id = input.category_id;

      const { data, error } = await supabase
        .from('wiki_documents')
        .update(updates)
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wiki-documents'] });
      queryClient.invalidateQueries({ queryKey: ['wiki-document'] });
      queryClient.invalidateQueries({ queryKey: ['wiki-versions'] });
      toast.success(t('wiki.updateSuccess'));
    },
    onError: (error) => {
      console.error('Error updating document:', error);
      toast.error(t('wiki.updateError'));
    },
  });

  const deleteDocument = useMutation({
    mutationFn: async (documentId: string) => {
      const { error } = await supabase
        .from('wiki_documents')
        .update({ is_deleted: true })
        .eq('id', documentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wiki-documents'] });
      toast.success(t('wiki.deleteSuccess'));
    },
    onError: (error) => {
      console.error('Error deleting document:', error);
      toast.error(t('wiki.deleteError'));
    },
  });

  const restoreVersion = useMutation({
    mutationFn: async ({ documentId, version }: { documentId: string; version: WikiVersion }) => {
      if (!profile) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('wiki_documents')
        .update({
          title: version.title,
          content: version.content,
          author_id: profile.id,
        })
        .eq('id', documentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wiki-documents'] });
      queryClient.invalidateQueries({ queryKey: ['wiki-document'] });
      queryClient.invalidateQueries({ queryKey: ['wiki-versions'] });
      toast.success(t('wiki.restoreSuccess'));
    },
    onError: (error) => {
      console.error('Error restoring version:', error);
      toast.error(t('wiki.restoreError'));
    },
  });

  const createCategory = useMutation({
    mutationFn: async (input: CreateCategoryInput) => {
      if (!tenantId) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('wiki_categories')
        .insert({
          tenant_id: tenantId,
          name: input.name,
          slug: input.slug,
          description: input.description || null,
          sort_order: input.sort_order || 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wiki-categories'] });
      toast.success(t('wiki.categoryCreated'));
    },
    onError: (error) => {
      console.error('Error creating category:', error);
      toast.error(t('wiki.categoryError'));
    },
  });

  return {
    createDocument,
    updateDocument,
    deleteDocument,
    restoreVersion,
    createCategory,
  };
};
