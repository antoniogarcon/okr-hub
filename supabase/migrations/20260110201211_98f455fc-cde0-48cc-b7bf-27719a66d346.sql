-- Add leader_id column to teams table
ALTER TABLE public.teams ADD COLUMN leader_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Create team_members junction table
CREATE TABLE public.team_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(team_id, user_id)
);

-- Enable RLS on team_members
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for team_members
CREATE POLICY "Root users can manage all team members"
ON public.team_members
FOR ALL
USING (is_root(auth.uid()));

CREATE POLICY "Admins can manage team members in their tenant"
ON public.team_members
FOR ALL
USING (
    has_role(auth.uid(), 'admin') 
    AND EXISTS (
        SELECT 1 FROM teams t 
        WHERE t.id = team_members.team_id 
        AND t.tenant_id = get_user_tenant_id(auth.uid())
    )
);

CREATE POLICY "Leaders can view their team members"
ON public.team_members
FOR SELECT
USING (
    has_role(auth.uid(), 'leader')
    AND EXISTS (
        SELECT 1 FROM teams t 
        WHERE t.id = team_members.team_id 
        AND t.tenant_id = get_user_tenant_id(auth.uid())
        AND t.leader_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
);

CREATE POLICY "Users can view team members in their tenant"
ON public.team_members
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM teams t 
        WHERE t.id = team_members.team_id 
        AND t.tenant_id = get_user_tenant_id(auth.uid())
    )
);

-- Create function to generate feed events for team changes
CREATE OR REPLACE FUNCTION public.create_team_feed_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO feed_events (tenant_id, event_type, title, description, entity_type, entity_id, author_id)
        VALUES (
            NEW.tenant_id,
            'team_created',
            'Equipe "' || NEW.name || '" foi criada',
            'Uma nova equipe foi adicionada ao sistema.',
            'team',
            NEW.id,
            NEW.leader_id
        );
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.name <> NEW.name OR OLD.description IS DISTINCT FROM NEW.description OR OLD.leader_id IS DISTINCT FROM NEW.leader_id THEN
            INSERT INTO feed_events (tenant_id, event_type, title, description, entity_type, entity_id, author_id)
            VALUES (
                NEW.tenant_id,
                'team_updated',
                'Equipe "' || NEW.name || '" foi atualizada',
                'As informações da equipe foram modificadas.',
                'team',
                NEW.id,
                NEW.leader_id
            );
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for team feed events
DROP TRIGGER IF EXISTS on_team_change ON public.teams;
CREATE TRIGGER on_team_change
AFTER INSERT OR UPDATE ON public.teams
FOR EACH ROW
EXECUTE FUNCTION public.create_team_feed_event();

-- Create function to generate feed events for team member changes
CREATE OR REPLACE FUNCTION public.create_team_member_feed_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_team_name text;
    v_member_name text;
    v_tenant_id uuid;
BEGIN
    SELECT t.name, t.tenant_id INTO v_team_name, v_tenant_id
    FROM teams t WHERE t.id = COALESCE(NEW.team_id, OLD.team_id);
    
    SELECT p.name INTO v_member_name
    FROM profiles p WHERE p.id = COALESCE(NEW.user_id, OLD.user_id);
    
    IF TG_OP = 'INSERT' THEN
        INSERT INTO feed_events (tenant_id, event_type, title, description, entity_type, entity_id)
        VALUES (
            v_tenant_id,
            'member_added',
            v_member_name || ' foi adicionado(a) à equipe "' || v_team_name || '"',
            'Um novo membro foi adicionado à equipe.',
            'team',
            NEW.team_id
        );
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO feed_events (tenant_id, event_type, title, description, entity_type, entity_id)
        VALUES (
            v_tenant_id,
            'member_removed',
            v_member_name || ' foi removido(a) da equipe "' || v_team_name || '"',
            'Um membro foi removido da equipe.',
            'team',
            OLD.team_id
        );
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for team member feed events
DROP TRIGGER IF EXISTS on_team_member_change ON public.team_members;
CREATE TRIGGER on_team_member_change
AFTER INSERT OR DELETE ON public.team_members
FOR EACH ROW
EXECUTE FUNCTION public.create_team_member_feed_event();

-- Create index for better performance
CREATE INDEX idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX idx_teams_leader_id ON public.teams(leader_id);