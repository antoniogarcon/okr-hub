-- Create notifications table
CREATE TABLE public.notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    -- Metadata for future email preferences
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_tenant_id ON public.notifications(tenant_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_is_read ON public.notifications(user_id, is_read);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (user_id = auth.uid() AND tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can update their own notifications (mark as read)"
ON public.notifications FOR UPDATE
USING (user_id = auth.uid() AND tenant_id = get_user_tenant_id(auth.uid()))
WITH CHECK (user_id = auth.uid() AND tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (tenant_id IS NOT NULL);

CREATE POLICY "Root users can view notifications in selected tenant"
ON public.notifications FOR SELECT
USING (is_root(auth.uid()));

-- No delete policy - notifications are read-only (cannot be deleted)

-- Create notification preferences table (for future use)
CREATE TABLE public.notification_preferences (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    -- In-app preferences
    okr_created BOOLEAN NOT NULL DEFAULT true,
    okr_completed BOOLEAN NOT NULL DEFAULT true,
    okr_progress BOOLEAN NOT NULL DEFAULT true,
    okr_linked BOOLEAN NOT NULL DEFAULT true,
    team_changes BOOLEAN NOT NULL DEFAULT true,
    wiki_updates BOOLEAN NOT NULL DEFAULT true,
    role_changes BOOLEAN NOT NULL DEFAULT true,
    -- Email preferences (for future)
    email_enabled BOOLEAN NOT NULL DEFAULT false,
    email_digest TEXT DEFAULT 'daily', -- 'immediate', 'daily', 'weekly', 'never'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences"
ON public.notification_preferences FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own preferences"
ON public.notification_preferences FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own preferences"
ON public.notification_preferences FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Function to create notifications for relevant users
CREATE OR REPLACE FUNCTION public.create_user_notification(
    p_user_id UUID,
    p_tenant_id UUID,
    p_event_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_entity_type TEXT DEFAULT NULL,
    p_entity_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO public.notifications (
        user_id, tenant_id, event_type, title, message, entity_type, entity_id
    ) VALUES (
        p_user_id, p_tenant_id, p_event_type, p_title, p_message, p_entity_type, p_entity_id
    )
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$;

-- Trigger function for OKR notifications
CREATE OR REPLACE FUNCTION public.create_okr_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_team_member RECORD;
    v_event_type TEXT;
    v_title TEXT;
    v_message TEXT;
BEGIN
    -- Determine event type and message
    IF TG_OP = 'INSERT' THEN
        v_event_type := 'okr_created';
        v_title := 'Novo OKR criado';
        v_message := format('O OKR "%s" foi criado.', NEW.title);
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
            v_event_type := 'okr_completed';
            v_title := 'OKR concluído';
            v_message := format('O OKR "%s" foi concluído com sucesso!', NEW.title);
        ELSIF OLD.parent_id IS DISTINCT FROM NEW.parent_id AND NEW.parent_id IS NOT NULL THEN
            v_event_type := 'okr_linked';
            v_title := 'OKR vinculado';
            v_message := format('O OKR "%s" foi vinculado a um OKR pai.', NEW.title);
        ELSIF OLD.progress IS DISTINCT FROM NEW.progress AND (NEW.progress - OLD.progress) >= 20 THEN
            -- Only notify on significant progress changes (20%+)
            v_event_type := 'okr_progress';
            v_title := 'Progresso significativo';
            v_message := format('O OKR "%s" avançou para %s%%.', NEW.title, NEW.progress);
        ELSE
            RETURN NEW;
        END IF;
    ELSE
        RETURN NEW;
    END IF;

    -- Notify owner if exists
    IF NEW.owner_id IS NOT NULL THEN
        PERFORM public.create_user_notification(
            (SELECT user_id FROM profiles WHERE id = NEW.owner_id),
            NEW.tenant_id, v_event_type, v_title, v_message, 'okr', NEW.id
        );
    END IF;

    -- Notify team members if team exists
    IF NEW.team_id IS NOT NULL THEN
        FOR v_team_member IN 
            SELECT tm.user_id 
            FROM team_members tm 
            JOIN profiles p ON p.id = tm.user_id
            WHERE tm.team_id = NEW.team_id 
            AND (NEW.owner_id IS NULL OR tm.user_id != NEW.owner_id)
        LOOP
            PERFORM public.create_user_notification(
                v_team_member.user_id,
                NEW.tenant_id, v_event_type, v_title, v_message, 'okr', NEW.id
            );
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$;

-- Create trigger for OKR notifications
CREATE TRIGGER trigger_okr_notifications
AFTER INSERT OR UPDATE ON public.okrs
FOR EACH ROW
EXECUTE FUNCTION public.create_okr_notifications();

-- Trigger function for Wiki notifications
CREATE OR REPLACE FUNCTION public.create_wiki_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user RECORD;
    v_event_type TEXT;
    v_title TEXT;
    v_message TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_event_type := 'wiki_created';
        v_title := 'Novo documento na Wiki';
        v_message := format('O documento "%s" foi criado na Wiki.', NEW.title);
    ELSIF TG_OP = 'UPDATE' AND OLD.is_deleted = false AND NEW.is_deleted = false THEN
        v_event_type := 'wiki_updated';
        v_title := 'Documento atualizado';
        v_message := format('O documento "%s" foi atualizado.', NEW.title);
    ELSE
        RETURN NEW;
    END IF;

    -- Notify all users in the tenant (except author)
    FOR v_user IN 
        SELECT p.user_id 
        FROM profiles p 
        WHERE p.tenant_id = NEW.tenant_id 
        AND p.is_active = true
        AND (NEW.author_id IS NULL OR p.id != NEW.author_id)
    LOOP
        PERFORM public.create_user_notification(
            v_user.user_id,
            NEW.tenant_id, v_event_type, v_title, v_message, 'wiki', NEW.id
        );
    END LOOP;

    RETURN NEW;
END;
$$;

-- Create trigger for Wiki notifications
CREATE TRIGGER trigger_wiki_notifications
AFTER INSERT OR UPDATE ON public.wiki_documents
FOR EACH ROW
EXECUTE FUNCTION public.create_wiki_notifications();

-- Trigger function for team member changes
CREATE OR REPLACE FUNCTION public.create_team_member_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_team_name TEXT;
    v_tenant_id UUID;
    v_user_name TEXT;
    v_event_type TEXT;
    v_title TEXT;
    v_message TEXT;
BEGIN
    -- Get team info
    SELECT t.name, t.tenant_id INTO v_team_name, v_tenant_id
    FROM teams t WHERE t.id = COALESCE(NEW.team_id, OLD.team_id);
    
    -- Get user name
    SELECT p.name INTO v_user_name
    FROM profiles p WHERE p.id = COALESCE(NEW.user_id, OLD.user_id);
    
    IF TG_OP = 'INSERT' THEN
        v_event_type := 'team_member_added';
        v_title := 'Adicionado à equipe';
        v_message := format('Você foi adicionado à equipe "%s".', v_team_name);
        
        -- Notify the user being added
        PERFORM public.create_user_notification(
            (SELECT user_id FROM profiles WHERE id = NEW.user_id),
            v_tenant_id, v_event_type, v_title, v_message, 'team', NEW.team_id
        );
    ELSIF TG_OP = 'DELETE' THEN
        v_event_type := 'team_member_removed';
        v_title := 'Removido da equipe';
        v_message := format('Você foi removido da equipe "%s".', v_team_name);
        
        -- Notify the user being removed
        PERFORM public.create_user_notification(
            (SELECT user_id FROM profiles WHERE id = OLD.user_id),
            v_tenant_id, v_event_type, v_title, v_message, 'team', OLD.team_id
        );
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for team member notifications
CREATE TRIGGER trigger_team_member_notifications
AFTER INSERT OR DELETE ON public.team_members
FOR EACH ROW
EXECUTE FUNCTION public.create_team_member_notifications();

-- Trigger function for role changes
CREATE OR REPLACE FUNCTION public.create_role_change_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tenant_id UUID;
    v_role_name TEXT;
BEGIN
    -- Get tenant_id from profile
    SELECT p.tenant_id INTO v_tenant_id
    FROM profiles p WHERE p.user_id = COALESCE(NEW.user_id, OLD.user_id);
    
    IF v_tenant_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        v_role_name := CASE NEW.role
            WHEN 'root' THEN 'Root'
            WHEN 'admin' THEN 'Administrador'
            WHEN 'leader' THEN 'Líder de Equipe'
            WHEN 'member' THEN 'Membro'
            ELSE NEW.role::text
        END;
        
        PERFORM public.create_user_notification(
            NEW.user_id,
            v_tenant_id,
            'role_changed',
            'Papel alterado',
            format('Seu papel foi alterado para %s.', v_role_name),
            'user_role',
            NEW.id
        );
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for role change notifications
CREATE TRIGGER trigger_role_change_notifications
AFTER INSERT OR UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.create_role_change_notifications();

-- Trigger function for organizational role changes
CREATE OR REPLACE FUNCTION public.create_org_role_change_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tenant_id UUID;
    v_role_name TEXT;
BEGIN
    -- Get role info
    SELECT r.tenant_id, r.name INTO v_tenant_id, v_role_name
    FROM organizational_roles r WHERE r.id = COALESCE(NEW.organizational_role_id, OLD.organizational_role_id);
    
    IF v_tenant_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    IF TG_OP = 'INSERT' THEN
        PERFORM public.create_user_notification(
            NEW.user_id,
            v_tenant_id,
            'org_role_assigned',
            'Papel organizacional atribuído',
            format('Você recebeu o papel organizacional "%s".', v_role_name),
            'organizational_role',
            NEW.organizational_role_id
        );
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM public.create_user_notification(
            OLD.user_id,
            v_tenant_id,
            'org_role_removed',
            'Papel organizacional removido',
            format('O papel organizacional "%s" foi removido.', v_role_name),
            'organizational_role',
            OLD.organizational_role_id
        );
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for organizational role notifications
CREATE TRIGGER trigger_org_role_change_notifications
AFTER INSERT OR DELETE ON public.user_organizational_roles
FOR EACH ROW
EXECUTE FUNCTION public.create_org_role_change_notifications();