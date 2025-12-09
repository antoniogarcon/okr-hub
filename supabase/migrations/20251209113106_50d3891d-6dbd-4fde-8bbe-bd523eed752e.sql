-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('root', 'admin', 'leader', 'member');

-- Create tenants table
CREATE TABLE public.tenants (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table (linked to auth.users)
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable Row Level Security
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Create security definer function to get user's tenant_id
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT tenant_id
    FROM public.profiles
    WHERE user_id = _user_id
$$;

-- Create security definer function to check if user is root
CREATE OR REPLACE FUNCTION public.is_root(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = 'root'
    )
$$;

-- Create security definer function to get user's primary role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role
    FROM public.user_roles
    WHERE user_id = _user_id
    ORDER BY 
        CASE role 
            WHEN 'root' THEN 1 
            WHEN 'admin' THEN 2 
            WHEN 'leader' THEN 3 
            WHEN 'member' THEN 4 
        END
    LIMIT 1
$$;

-- RLS Policies for tenants
CREATE POLICY "Root users can view all tenants"
ON public.tenants FOR SELECT
TO authenticated
USING (public.is_root(auth.uid()));

CREATE POLICY "Users can view their own tenant"
ON public.tenants FOR SELECT
TO authenticated
USING (id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Root users can insert tenants"
ON public.tenants FOR INSERT
TO authenticated
WITH CHECK (public.is_root(auth.uid()));

CREATE POLICY "Root users can update tenants"
ON public.tenants FOR UPDATE
TO authenticated
USING (public.is_root(auth.uid()));

CREATE POLICY "Root users can delete tenants"
ON public.tenants FOR DELETE
TO authenticated
USING (public.is_root(auth.uid()));

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Root users can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_root(auth.uid()));

CREATE POLICY "Admins can view profiles in their tenant"
ON public.profiles FOR SELECT
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') 
    AND tenant_id = public.get_user_tenant_id(auth.uid())
);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "System can insert profiles"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Root users can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.is_root(auth.uid()));

CREATE POLICY "Admins can view roles in their tenant"
ON public.user_roles FOR SELECT
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin')
    AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = user_roles.user_id
        AND p.tenant_id = public.get_user_tenant_id(auth.uid())
    )
);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Insert profile
    INSERT INTO public.profiles (user_id, name, email, tenant_id)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
        NEW.email,
        (NEW.raw_user_meta_data ->> 'tenant_id')::UUID
    );
    
    -- Insert default role (member) or specified role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (
        NEW.id,
        COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'member')
    );
    
    RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON public.tenants
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_tenant_id ON public.profiles(tenant_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_tenants_slug ON public.tenants(slug);