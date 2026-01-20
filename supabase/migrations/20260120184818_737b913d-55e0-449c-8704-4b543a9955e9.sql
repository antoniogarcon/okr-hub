-- Fix security issues identified in the security scan

-- 1. PROFILES TABLE: Add policy for members to view profiles in their tenant
-- This is needed for app functionality (viewing team members, OKR owners, etc.)
CREATE POLICY "Members can view profiles in their tenant"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'member'::app_role) 
  AND tenant_id = get_user_tenant_id(auth.uid())
);

-- Leaders also need to view profiles in their tenant
CREATE POLICY "Leaders can view profiles in their tenant"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'leader'::app_role) 
  AND tenant_id = get_user_tenant_id(auth.uid())
);

-- 2. AUDIT_LOGS TABLE: Add explicit denial policies for non-root operations
-- Prevent any updates to audit logs (immutable)
CREATE POLICY "Audit logs are immutable - no updates"
ON public.audit_logs
FOR UPDATE
USING (false);

-- Prevent deletion of audit logs
CREATE POLICY "Audit logs cannot be deleted"
ON public.audit_logs
FOR DELETE
USING (false);

-- Allow system/admin to insert audit logs (not just root)
DROP POLICY IF EXISTS "Root users can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can insert their own audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND user_id = auth.uid()
);

-- Allow admins to view audit logs in their tenant
CREATE POLICY "Admins can view audit logs in their tenant"
ON public.audit_logs
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = audit_logs.user_id
    AND p.tenant_id = get_user_tenant_id(auth.uid())
  )
);

-- 3. USER_ROLES TABLE: Add restrictive policies for role management
-- Prevent members/leaders from modifying roles
CREATE POLICY "Only admins can insert roles in their tenant"
ON public.user_roles
FOR INSERT
WITH CHECK (
  (has_role(auth.uid(), 'admin'::app_role) OR is_root(auth.uid()))
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = user_roles.user_id
    AND (p.tenant_id = get_user_tenant_id(auth.uid()) OR is_root(auth.uid()))
  )
  -- Prevent privilege escalation: non-root users cannot create root roles
  AND (is_root(auth.uid()) OR role != 'root'::app_role)
);

CREATE POLICY "Only admins can update roles in their tenant"
ON public.user_roles
FOR UPDATE
USING (
  (has_role(auth.uid(), 'admin'::app_role) OR is_root(auth.uid()))
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = user_roles.user_id
    AND (p.tenant_id = get_user_tenant_id(auth.uid()) OR is_root(auth.uid()))
  )
)
WITH CHECK (
  -- Prevent privilege escalation: non-root users cannot assign root role
  is_root(auth.uid()) OR role != 'root'::app_role
);

CREATE POLICY "Only admins can delete roles in their tenant"
ON public.user_roles
FOR DELETE
USING (
  (has_role(auth.uid(), 'admin'::app_role) OR is_root(auth.uid()))
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = user_roles.user_id
    AND (p.tenant_id = get_user_tenant_id(auth.uid()) OR is_root(auth.uid()))
  )
  -- Prevent deleting root roles by non-root users
  AND (is_root(auth.uid()) OR role != 'root'::app_role)
);

-- Leaders can also view roles in their tenant (for team management)
CREATE POLICY "Leaders can view roles in their tenant"
ON public.user_roles
FOR SELECT
USING (
  has_role(auth.uid(), 'leader'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = user_roles.user_id
    AND p.tenant_id = get_user_tenant_id(auth.uid())
  )
);