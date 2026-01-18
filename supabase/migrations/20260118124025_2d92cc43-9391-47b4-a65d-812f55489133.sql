
-- Create organizational_roles table for customizable SAFe roles per tenant
CREATE TABLE public.organizational_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'custom', -- 'default' for predefined, 'custom' for tenant-created
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, name)
);

-- Create user_organizational_roles table for associating users with organizational roles
CREATE TABLE public.user_organizational_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organizational_role_id UUID NOT NULL REFERENCES public.organizational_roles(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, organizational_role_id)
);

-- Add sponsor_id to okrs table for BO sponsorship
ALTER TABLE public.okrs ADD COLUMN sponsor_id UUID REFERENCES public.profiles(id);

-- Enable RLS
ALTER TABLE public.organizational_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_organizational_roles ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_organizational_roles_tenant ON public.organizational_roles(tenant_id);
CREATE INDEX idx_organizational_roles_active ON public.organizational_roles(tenant_id, is_active);
CREATE INDEX idx_user_org_roles_user ON public.user_organizational_roles(user_id);
CREATE INDEX idx_user_org_roles_role ON public.user_organizational_roles(organizational_role_id);
CREATE INDEX idx_user_org_roles_primary ON public.user_organizational_roles(user_id, is_primary);
CREATE INDEX idx_okrs_sponsor ON public.okrs(sponsor_id);

-- RLS Policies for organizational_roles
CREATE POLICY "Users can view organizational roles in their tenant"
ON public.organizational_roles FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Admins can manage organizational roles in their tenant"
ON public.organizational_roles FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) AND tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Root users can manage all organizational roles"
ON public.organizational_roles FOR ALL
USING (is_root(auth.uid()));

-- RLS Policies for user_organizational_roles
CREATE POLICY "Users can view their own organizational roles"
ON public.user_organizational_roles FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can view organizational roles in their tenant"
ON public.user_organizational_roles FOR SELECT
USING (EXISTS (
  SELECT 1 FROM organizational_roles r
  WHERE r.id = user_organizational_roles.organizational_role_id
  AND r.tenant_id = get_user_tenant_id(auth.uid())
));

CREATE POLICY "Admins can manage user organizational roles in their tenant"
ON public.user_organizational_roles FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) AND EXISTS (
  SELECT 1 FROM organizational_roles r
  WHERE r.id = user_organizational_roles.organizational_role_id
  AND r.tenant_id = get_user_tenant_id(auth.uid())
));

CREATE POLICY "Root users can manage all user organizational roles"
ON public.user_organizational_roles FOR ALL
USING (is_root(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_organizational_roles_updated_at
BEFORE UPDATE ON public.organizational_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default SAFe organizational roles function
CREATE OR REPLACE FUNCTION public.create_default_organizational_roles(p_tenant_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.organizational_roles (tenant_id, name, description, type, sort_order)
  VALUES
    (p_tenant_id, 'Product Owner', 'Responsible for maximizing product value and managing the product backlog', 'default', 1),
    (p_tenant_id, 'Product Manager', 'Owns the program backlog and works with Product Owners', 'default', 2),
    (p_tenant_id, 'Business Owner', 'Key stakeholder with business accountability for program value', 'default', 3),
    (p_tenant_id, 'Release Train Engineer', 'Servant leader and coach for the Agile Release Train', 'default', 4),
    (p_tenant_id, 'Tech Lead', 'Technical leadership and guidance for the team', 'default', 5),
    (p_tenant_id, 'Agile Coach', 'Coaches teams and leaders in Agile practices', 'default', 6),
    (p_tenant_id, 'Scrum Master', 'Facilitates Scrum ceremonies and removes impediments', 'default', 7),
    (p_tenant_id, 'System Architect', 'Defines and evolves the system architecture', 'default', 8)
  ON CONFLICT (tenant_id, name) DO NOTHING;
END;
$$;
