import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface UserWithDetails {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  teamId: string | null;
  teamName: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  role: UserRole;
  teamId?: string | null;
}

export interface UpdateUserData {
  userId: string;
  role?: UserRole;
  teamId?: string | null;
  isActive?: boolean;
}

// Audit logging function
const logAudit = async (
  userId: string,
  action: string,
  entityType: string,
  entityId: string | null,
  details: object
) => {
  try {
    await supabase.from('audit_logs').insert([{
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details: details as never,
    }]);
  } catch (error) {
    console.error('Failed to log audit:', error);
  }
};

export const useUsers = (tenantId: string | null) => {
  return useQuery({
    queryKey: ['users', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      // Fetch profiles with their roles and teams
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          name,
          email,
          is_active,
          tenant_id,
          created_at
        `)
        .eq('tenant_id', tenantId)
        .order('name');

      if (profilesError) throw profilesError;
      if (!profiles || profiles.length === 0) return [];

      // Get user roles for all users
      const userIds = profiles.map(p => p.user_id);
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      if (rolesError) throw rolesError;

      // Create a map of user_id to role
      const roleMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);

      // Fetch all teams for the tenant
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('id, name')
        .eq('tenant_id', tenantId);

      if (teamsError) throw teamsError;

      // For now, we don't have a team_members junction table
      // So we'll return users without team assignment initially
      // This can be enhanced when team_members table is added

      const users: UserWithDetails[] = profiles.map(profile => ({
        id: profile.id,
        userId: profile.user_id,
        name: profile.name,
        email: profile.email,
        role: (roleMap.get(profile.user_id) as UserRole) || 'member',
        teamId: null, // Will be populated when team_members exists
        teamName: null,
        isActive: profile.is_active,
        createdAt: profile.created_at,
      }));

      return users;
    },
    enabled: !!tenantId,
  });
};

export const useTeamsForSelect = (tenantId: string | null) => {
  return useQuery({
    queryKey: ['teams-select', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const { data, error } = await supabase
        .from('teams')
        .select('id, name')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  const { profile, getTenantId } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateUserData) => {
      const tenantId = getTenantId();
      if (!tenantId) throw new Error('Tenant not found');

      // Generate a temporary password for the invitation
      const tempPassword = generateSecurePassword();

      // Create user in Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email.trim(),
        password: tempPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
          data: {
            name: data.name,
            tenant_id: tenantId,
            role: data.role,
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          throw new Error('Este email já está cadastrado');
        }
        throw signUpError;
      }

      if (!authData.user) {
        throw new Error('Falha ao criar usuário');
      }

      // Log audit
      if (profile?.userId) {
        await logAudit(
          profile.userId,
          'user_created',
          'user',
          authData.user.id,
          {
            email: data.email,
            name: data.name,
            role: data.role,
            teamId: data.teamId,
          }
        );
      }

      return authData.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Usuário criado',
        description: 'Um email de convite foi enviado para o usuário.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar usuário',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: UpdateUserData) => {
      const updates: Record<string, unknown> = {};

      // Update role if provided
      if (data.role !== undefined) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role: data.role })
          .eq('user_id', data.userId);

        if (roleError) throw roleError;
        updates.role = data.role;
      }

      // Update active status if provided
      if (data.isActive !== undefined) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ is_active: data.isActive })
          .eq('user_id', data.userId);

        if (profileError) throw profileError;
        updates.isActive = data.isActive;
      }

      // Log audit
      if (profile?.userId) {
        await logAudit(
          profile.userId,
          data.isActive === false ? 'user_deactivated' : 'user_updated',
          'user',
          data.userId,
          updates
        );
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      
      if (variables.isActive === false) {
        toast({
          title: 'Usuário desativado',
          description: 'O usuário foi desativado com sucesso.',
        });
      } else if (variables.isActive === true) {
        toast({
          title: 'Usuário ativado',
          description: 'O usuário foi ativado com sucesso.',
        });
      } else {
        toast({
          title: 'Usuário atualizado',
          description: 'Os dados do usuário foram atualizados.',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar usuário',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Generate a secure temporary password
function generateSecurePassword(): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = uppercase + lowercase + numbers + special;
  
  let password = '';
  // Ensure at least one of each required type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Fill the rest randomly
  for (let i = 0; i < 8; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}
