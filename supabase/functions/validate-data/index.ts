import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-tenant-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ValidationRule {
  field: string;
  rules: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    email?: boolean;
    uuid?: boolean;
    min?: number;
    max?: number;
  };
}

interface ValidationRequest {
  entity: string;
  data: Record<string, unknown>;
  rules?: ValidationRule[];
}

interface ValidationError {
  field: string;
  code: string;
  message: string;
}

// Default validation rules by entity type
const entityRules: Record<string, ValidationRule[]> = {
  okr: [
    { field: 'title', rules: { required: true, minLength: 3, maxLength: 200 } },
    { field: 'tenant_id', rules: { required: true, uuid: true } },
    { field: 'type', rules: { required: true, pattern: '^(objective|team)$' } },
    { field: 'status', rules: { pattern: '^(active|at_risk|behind|completed)$' } },
    { field: 'progress', rules: { min: 0, max: 100 } },
  ],
  key_result: [
    { field: 'title', rules: { required: true, minLength: 3, maxLength: 200 } },
    { field: 'okr_id', rules: { required: true, uuid: true } },
    { field: 'target_value', rules: { required: true, min: 0 } },
    { field: 'current_value', rules: { min: 0 } },
  ],
  team: [
    { field: 'name', rules: { required: true, minLength: 2, maxLength: 100 } },
    { field: 'tenant_id', rules: { required: true, uuid: true } },
    { field: 'slug', rules: { required: true, pattern: '^[a-z0-9-]+$', maxLength: 50 } },
  ],
  sprint: [
    { field: 'name', rules: { required: true, minLength: 2, maxLength: 100 } },
    { field: 'team_id', rules: { required: true, uuid: true } },
    { field: 'start_date', rules: { required: true } },
    { field: 'end_date', rules: { required: true } },
    { field: 'capacity', rules: { min: 0, max: 100 } },
    { field: 'planned_points', rules: { min: 0 } },
    { field: 'completed_points', rules: { min: 0 } },
  ],
  wiki_document: [
    { field: 'title', rules: { required: true, minLength: 2, maxLength: 200 } },
    { field: 'tenant_id', rules: { required: true, uuid: true } },
    { field: 'content', rules: { maxLength: 100000 } },
  ],
  wiki_category: [
    { field: 'name', rules: { required: true, minLength: 2, maxLength: 100 } },
    { field: 'tenant_id', rules: { required: true, uuid: true } },
    { field: 'slug', rules: { required: true, pattern: '^[a-z0-9-]+$', maxLength: 50 } },
  ],
  user: [
    { field: 'name', rules: { required: true, minLength: 2, maxLength: 100 } },
    { field: 'email', rules: { required: true, email: true } },
    { field: 'role', rules: { required: true, pattern: '^(admin|leader|member)$' } },
  ],
};

// UUID regex pattern
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateField(
  field: string,
  value: unknown,
  rules: ValidationRule['rules']
): ValidationError | null {
  // Required check
  if (rules.required && (value === undefined || value === null || value === '')) {
    return {
      field,
      code: 'VALIDATION_REQUIRED',
      message: `Field ${field} is required`,
    };
  }

  // Skip further validation if value is empty and not required
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const strValue = String(value);

  // String length validations
  if (rules.minLength && strValue.length < rules.minLength) {
    return {
      field,
      code: 'VALIDATION_MIN_LENGTH',
      message: `Field ${field} must have at least ${rules.minLength} characters`,
    };
  }

  if (rules.maxLength && strValue.length > rules.maxLength) {
    return {
      field,
      code: 'VALIDATION_MAX_LENGTH',
      message: `Field ${field} must have at most ${rules.maxLength} characters`,
    };
  }

  // Pattern validation
  if (rules.pattern) {
    const regex = new RegExp(rules.pattern);
    if (!regex.test(strValue)) {
      return {
        field,
        code: 'VALIDATION_INVALID_FORMAT',
        message: `Field ${field} has invalid format`,
      };
    }
  }

  // Email validation
  if (rules.email && !EMAIL_PATTERN.test(strValue)) {
    return {
      field,
      code: 'VALIDATION_INVALID_FORMAT',
      message: `Field ${field} must be a valid email`,
    };
  }

  // UUID validation
  if (rules.uuid && !UUID_PATTERN.test(strValue)) {
    return {
      field,
      code: 'VALIDATION_INVALID_FORMAT',
      message: `Field ${field} must be a valid UUID`,
    };
  }

  // Numeric validations
  if (typeof value === 'number' || !isNaN(Number(value))) {
    const numValue = Number(value);
    
    if (rules.min !== undefined && numValue < rules.min) {
      return {
        field,
        code: 'VALIDATION_INVALID_FORMAT',
        message: `Field ${field} must be at least ${rules.min}`,
      };
    }

    if (rules.max !== undefined && numValue > rules.max) {
      return {
        field,
        code: 'VALIDATION_INVALID_FORMAT',
        message: `Field ${field} must be at most ${rules.max}`,
      };
    }
  }

  return null;
}

function validateData(
  entity: string,
  data: Record<string, unknown>,
  customRules?: ValidationRule[]
): { valid: boolean; errors: ValidationError[] } {
  const rules = customRules || entityRules[entity] || [];
  const errors: ValidationError[] = [];

  for (const rule of rules) {
    const error = validateField(rule.field, data[rule.field], rule.rules);
    if (error) {
      errors.push(error);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client to verify user
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request
    const body: ValidationRequest = await req.json();
    const { entity, data, rules } = body;

    if (!entity || !data) {
      return new Response(
        JSON.stringify({ error: "Entity and data are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate data
    const result = validateData(entity, data, rules);

    return new Response(
      JSON.stringify(result),
      { 
        status: result.valid ? 200 : 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Validation error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
