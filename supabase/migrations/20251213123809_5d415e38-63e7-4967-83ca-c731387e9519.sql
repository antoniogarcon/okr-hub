-- Create audit_logs table for tracking tenant management actions
CREATE TABLE public.audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only root users can view audit logs
CREATE POLICY "Root users can view all audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (is_root(auth.uid()));

-- Only root users can insert audit logs
CREATE POLICY "Root users can insert audit logs" 
ON public.audit_logs 
FOR INSERT 
WITH CHECK (is_root(auth.uid()));

-- Create index for faster queries
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);