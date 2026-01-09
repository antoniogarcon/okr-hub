
-- Create wiki_categories table
CREATE TABLE public.wiki_categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, slug)
);

-- Create wiki_documents table
CREATE TABLE public.wiki_documents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.wiki_categories(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create wiki_versions table for version history
CREATE TABLE public.wiki_versions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES public.wiki_documents(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    version_number INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wiki_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wiki_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wiki_versions ENABLE ROW LEVEL SECURITY;

-- RLS policies for wiki_categories
CREATE POLICY "Users can view categories in their tenant" ON public.wiki_categories
    FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Admins and leaders can manage categories" ON public.wiki_categories
    FOR ALL USING (
        (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'leader'::app_role))
        AND tenant_id = get_user_tenant_id(auth.uid())
    );

CREATE POLICY "Root users can manage all categories" ON public.wiki_categories
    FOR ALL USING (is_root(auth.uid()));

-- RLS policies for wiki_documents
CREATE POLICY "Users can view documents in their tenant" ON public.wiki_documents
    FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()) AND is_deleted = false);

CREATE POLICY "Admins and leaders can manage documents" ON public.wiki_documents
    FOR ALL USING (
        (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'leader'::app_role))
        AND tenant_id = get_user_tenant_id(auth.uid())
    );

CREATE POLICY "Root users can manage all documents" ON public.wiki_documents
    FOR ALL USING (is_root(auth.uid()));

-- RLS policies for wiki_versions
CREATE POLICY "Users can view versions in their tenant" ON public.wiki_versions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.wiki_documents d
            WHERE d.id = wiki_versions.document_id
            AND d.tenant_id = get_user_tenant_id(auth.uid())
        )
    );

CREATE POLICY "Admins and leaders can insert versions" ON public.wiki_versions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.wiki_documents d
            WHERE d.id = wiki_versions.document_id
            AND d.tenant_id = get_user_tenant_id(auth.uid())
            AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'leader'::app_role))
        )
    );

CREATE POLICY "Root users can manage all versions" ON public.wiki_versions
    FOR ALL USING (is_root(auth.uid()));

-- Trigger function for wiki feed events
CREATE OR REPLACE FUNCTION public.create_wiki_feed_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_event_type TEXT;
    v_title TEXT;
    v_description TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_event_type := 'wiki_created';
        v_title := 'Documento da Wiki criado';
        v_description := format('Documento "%s" foi criado na Wiki', NEW.title);
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.is_deleted = false AND NEW.is_deleted = true THEN
            RETURN NEW;
        END IF;
        v_event_type := 'wiki_updated';
        v_title := 'Documento da Wiki atualizado';
        v_description := format('Documento "%s" foi atualizado', NEW.title);
    ELSE
        RETURN NEW;
    END IF;

    INSERT INTO public.feed_events (
        tenant_id,
        event_type,
        title,
        description,
        entity_type,
        entity_id,
        author_id
    ) VALUES (
        NEW.tenant_id,
        v_event_type,
        v_title,
        v_description,
        'wiki',
        NEW.id,
        NEW.author_id
    );

    RETURN NEW;
END;
$$;

-- Create trigger for wiki documents
CREATE TRIGGER wiki_feed_event_trigger
    AFTER INSERT OR UPDATE ON public.wiki_documents
    FOR EACH ROW
    EXECUTE FUNCTION public.create_wiki_feed_event();

-- Trigger to auto-create version on document update
CREATE OR REPLACE FUNCTION public.create_wiki_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_version_number INTEGER;
BEGIN
    SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_version_number
    FROM public.wiki_versions
    WHERE document_id = NEW.id;

    INSERT INTO public.wiki_versions (document_id, title, content, author_id, version_number)
    VALUES (NEW.id, NEW.title, NEW.content, NEW.author_id, v_version_number);

    RETURN NEW;
END;
$$;

CREATE TRIGGER wiki_version_trigger
    AFTER INSERT OR UPDATE OF title, content ON public.wiki_documents
    FOR EACH ROW
    EXECUTE FUNCTION public.create_wiki_version();

-- Update timestamps trigger
CREATE TRIGGER update_wiki_categories_updated_at
    BEFORE UPDATE ON public.wiki_categories
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wiki_documents_updated_at
    BEFORE UPDATE ON public.wiki_documents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
