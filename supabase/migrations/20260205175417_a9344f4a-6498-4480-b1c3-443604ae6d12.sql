-- Fix security issue: Deny anonymous access to user_roles table
CREATE POLICY "Deny anonymous access to user_roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Fix security issue: Deny anonymous access to profiles table
CREATE POLICY "Deny anonymous access to profiles" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Fix security issue: Deny anonymous access to audit_logs table
CREATE POLICY "Deny anonymous access to audit_logs" 
ON public.audit_logs 
FOR SELECT 
USING (auth.uid() IS NOT NULL);