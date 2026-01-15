-- Performance indexes for multi-tenant queries
CREATE INDEX IF NOT EXISTS idx_okrs_tenant_id ON public.okrs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_okrs_team_id ON public.okrs(team_id);
CREATE INDEX IF NOT EXISTS idx_okrs_owner_id ON public.okrs(owner_id);
CREATE INDEX IF NOT EXISTS idx_okrs_status ON public.okrs(status);
CREATE INDEX IF NOT EXISTS idx_okrs_tenant_status ON public.okrs(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_okrs_team_status ON public.okrs(team_id, status);

-- Teams indexes
CREATE INDEX IF NOT EXISTS idx_teams_tenant_id ON public.teams(tenant_id);
CREATE INDEX IF NOT EXISTS idx_teams_leader_id ON public.teams(leader_id);
CREATE INDEX IF NOT EXISTS idx_teams_tenant_active ON public.teams(tenant_id, is_active);

-- Sprints indexes
CREATE INDEX IF NOT EXISTS idx_sprints_team_id ON public.sprints(team_id);
CREATE INDEX IF NOT EXISTS idx_sprints_status ON public.sprints(status);
CREATE INDEX IF NOT EXISTS idx_sprints_team_status ON public.sprints(team_id, status);

-- Key results indexes
CREATE INDEX IF NOT EXISTS idx_key_results_okr_id ON public.key_results(okr_id);
CREATE INDEX IF NOT EXISTS idx_key_results_owner_id ON public.key_results(owner_id);

-- Team members indexes
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);

-- Feed events indexes
CREATE INDEX IF NOT EXISTS idx_feed_events_tenant_id ON public.feed_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_feed_events_created_at ON public.feed_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_events_tenant_created ON public.feed_events(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_events_entity_type ON public.feed_events(entity_type);

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_active ON public.profiles(tenant_id, is_active);

-- Wiki indexes
CREATE INDEX IF NOT EXISTS idx_wiki_documents_tenant_id ON public.wiki_documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_wiki_documents_category_id ON public.wiki_documents(category_id);
CREATE INDEX IF NOT EXISTS idx_wiki_documents_tenant_deleted ON public.wiki_documents(tenant_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_wiki_categories_tenant_id ON public.wiki_categories(tenant_id);

-- Audit logs indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- User roles indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);