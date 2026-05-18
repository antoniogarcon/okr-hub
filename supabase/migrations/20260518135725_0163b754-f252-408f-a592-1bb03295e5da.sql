
-- Drop misleading permissive "deny anonymous" policies (permissive policies are OR'd, so they don't deny anything)
DROP POLICY IF EXISTS "Deny anonymous access to audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Deny anonymous access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Deny anonymous access to user_roles" ON public.user_roles;

-- Add RESTRICTIVE policies that actually block unauthenticated access on every command
CREATE POLICY "Require authentication - audit_logs"
ON public.audit_logs
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Require authentication - profiles"
ON public.profiles
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Require authentication - user_roles"
ON public.user_roles
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Enforce tenant isolation as a RESTRICTIVE rule on user_roles SELECT
-- (root users bypass via the OR; everyone else must share tenant with the target user)
CREATE POLICY "Tenant isolation - user_roles select"
ON public.user_roles
AS RESTRICTIVE
FOR SELECT
TO public
USING (
  is_root(auth.uid())
  OR user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = user_roles.user_id
      AND p.tenant_id IS NOT NULL
      AND p.tenant_id = get_user_tenant_id(auth.uid())
  )
);

-- Enforce tenant isolation as a RESTRICTIVE rule on audit_logs SELECT
CREATE POLICY "Tenant isolation - audit_logs select"
ON public.audit_logs
AS RESTRICTIVE
FOR SELECT
TO public
USING (
  is_root(auth.uid())
  OR user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = audit_logs.user_id
      AND p.tenant_id IS NOT NULL
      AND p.tenant_id = get_user_tenant_id(auth.uid())
  )
);
