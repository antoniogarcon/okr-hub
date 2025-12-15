-- Create teams table
CREATE TABLE public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#6366f1',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, slug)
);

-- Create sprints table
CREATE TABLE public.sprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    planned_points INTEGER DEFAULT 0,
    completed_points INTEGER DEFAULT 0,
    capacity INTEGER DEFAULT 100,
    status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create OKRs table
CREATE TABLE public.okrs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    parent_id UUID REFERENCES public.okrs(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'objective' CHECK (type IN ('objective', 'key_result')),
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'at_risk', 'delayed', 'cancelled')),
    start_date DATE,
    end_date DATE,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create feed events table
CREATE TABLE public.feed_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('okr_update', 'wiki_update', 'milestone', 'comment', 'team_update', 'sprint_update')),
    title TEXT NOT NULL,
    description TEXT,
    entity_type TEXT,
    entity_id UUID,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.okrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for teams
CREATE POLICY "Root users can manage all teams"
    ON public.teams FOR ALL
    USING (is_root(auth.uid()));

CREATE POLICY "Users can view teams in their tenant"
    ON public.teams FOR SELECT
    USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Admins can manage teams in their tenant"
    ON public.teams FOR ALL
    USING (
        has_role(auth.uid(), 'admin'::app_role) 
        AND tenant_id = get_user_tenant_id(auth.uid())
    );

-- RLS policies for sprints
CREATE POLICY "Root users can manage all sprints"
    ON public.sprints FOR ALL
    USING (is_root(auth.uid()));

CREATE POLICY "Users can view sprints in their tenant"
    ON public.sprints FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.teams t
            WHERE t.id = sprints.team_id
            AND t.tenant_id = get_user_tenant_id(auth.uid())
        )
    );

CREATE POLICY "Admins and leaders can manage sprints in their tenant"
    ON public.sprints FOR ALL
    USING (
        (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'leader'::app_role))
        AND EXISTS (
            SELECT 1 FROM public.teams t
            WHERE t.id = sprints.team_id
            AND t.tenant_id = get_user_tenant_id(auth.uid())
        )
    );

-- RLS policies for OKRs
CREATE POLICY "Root users can manage all okrs"
    ON public.okrs FOR ALL
    USING (is_root(auth.uid()));

CREATE POLICY "Users can view okrs in their tenant"
    ON public.okrs FOR SELECT
    USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Admins can manage okrs in their tenant"
    ON public.okrs FOR ALL
    USING (
        has_role(auth.uid(), 'admin'::app_role)
        AND tenant_id = get_user_tenant_id(auth.uid())
    );

CREATE POLICY "Leaders can manage team okrs"
    ON public.okrs FOR ALL
    USING (
        has_role(auth.uid(), 'leader'::app_role)
        AND tenant_id = get_user_tenant_id(auth.uid())
    );

-- RLS policies for feed events
CREATE POLICY "Root users can manage all feed events"
    ON public.feed_events FOR ALL
    USING (is_root(auth.uid()));

CREATE POLICY "Users can view feed events in their tenant"
    ON public.feed_events FOR SELECT
    USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "System can insert feed events"
    ON public.feed_events FOR INSERT
    WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- Create indexes for better performance
CREATE INDEX idx_teams_tenant_id ON public.teams(tenant_id);
CREATE INDEX idx_sprints_team_id ON public.sprints(team_id);
CREATE INDEX idx_okrs_tenant_id ON public.okrs(tenant_id);
CREATE INDEX idx_okrs_team_id ON public.okrs(team_id);
CREATE INDEX idx_okrs_parent_id ON public.okrs(parent_id);
CREATE INDEX idx_feed_events_tenant_id ON public.feed_events(tenant_id);
CREATE INDEX idx_feed_events_created_at ON public.feed_events(created_at DESC);

-- Triggers for updated_at
CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON public.teams
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sprints_updated_at
    BEFORE UPDATE ON public.sprints
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_okrs_updated_at
    BEFORE UPDATE ON public.okrs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for feed events
ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_events;