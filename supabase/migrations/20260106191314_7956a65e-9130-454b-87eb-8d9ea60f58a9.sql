-- Create key_results table
CREATE TABLE public.key_results (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    okr_id UUID NOT NULL REFERENCES public.okrs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    target_value NUMERIC NOT NULL DEFAULT 100,
    current_value NUMERIC NOT NULL DEFAULT 0,
    unit TEXT DEFAULT '%',
    progress INTEGER NOT NULL DEFAULT 0,
    owner_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for key_results
CREATE POLICY "Root users can manage all key_results"
ON public.key_results
FOR ALL
USING (is_root(auth.uid()));

CREATE POLICY "Users can view key_results in their tenant"
ON public.key_results
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.okrs o
        WHERE o.id = key_results.okr_id
        AND o.tenant_id = get_user_tenant_id(auth.uid())
    )
);

CREATE POLICY "Admins can manage key_results in their tenant"
ON public.key_results
FOR ALL
USING (
    has_role(auth.uid(), 'admin') AND
    EXISTS (
        SELECT 1 FROM public.okrs o
        WHERE o.id = key_results.okr_id
        AND o.tenant_id = get_user_tenant_id(auth.uid())
    )
);

CREATE POLICY "Leaders can manage key_results in their tenant"
ON public.key_results
FOR ALL
USING (
    has_role(auth.uid(), 'leader') AND
    EXISTS (
        SELECT 1 FROM public.okrs o
        WHERE o.id = key_results.okr_id
        AND o.tenant_id = get_user_tenant_id(auth.uid())
    )
);

CREATE POLICY "Members can update key_results progress"
ON public.key_results
FOR UPDATE
USING (
    has_role(auth.uid(), 'member') AND
    EXISTS (
        SELECT 1 FROM public.okrs o
        WHERE o.id = key_results.okr_id
        AND o.tenant_id = get_user_tenant_id(auth.uid())
    )
);

-- Trigger to update key_result progress when current_value changes
CREATE OR REPLACE FUNCTION public.calculate_key_result_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.target_value > 0 THEN
        NEW.progress := LEAST(100, ROUND((NEW.current_value / NEW.target_value) * 100));
    ELSE
        NEW.progress := 0;
    END IF;
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER calculate_kr_progress
BEFORE INSERT OR UPDATE ON public.key_results
FOR EACH ROW
EXECUTE FUNCTION public.calculate_key_result_progress();

-- Trigger to update OKR progress based on key results average
CREATE OR REPLACE FUNCTION public.update_okr_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    avg_progress INTEGER;
    okr_record RECORD;
BEGIN
    -- Get the OKR ID
    SELECT COALESCE(NEW.okr_id, OLD.okr_id) INTO okr_record;
    
    -- Calculate average progress of key results
    SELECT COALESCE(ROUND(AVG(progress)), 0) INTO avg_progress
    FROM public.key_results
    WHERE okr_id = COALESCE(NEW.okr_id, OLD.okr_id);
    
    -- Update the OKR progress
    UPDATE public.okrs
    SET progress = avg_progress,
        updated_at = now(),
        status = CASE
            WHEN avg_progress >= 100 THEN 'completed'
            WHEN avg_progress >= 70 THEN 'active'
            WHEN avg_progress >= 30 THEN 'at_risk'
            ELSE 'behind'
        END
    WHERE id = COALESCE(NEW.okr_id, OLD.okr_id);
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_okr_progress_on_kr_change
AFTER INSERT OR UPDATE OR DELETE ON public.key_results
FOR EACH ROW
EXECUTE FUNCTION public.update_okr_progress();

-- Trigger to update parent OKR progress based on children average
CREATE OR REPLACE FUNCTION public.update_parent_okr_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    avg_child_progress INTEGER;
BEGIN
    -- Only proceed if this OKR has a parent
    IF NEW.parent_id IS NOT NULL THEN
        -- Calculate average progress of sibling OKRs
        SELECT COALESCE(ROUND(AVG(progress)), 0) INTO avg_child_progress
        FROM public.okrs
        WHERE parent_id = NEW.parent_id;
        
        -- Update parent OKR progress
        UPDATE public.okrs
        SET progress = avg_child_progress,
            updated_at = now(),
            status = CASE
                WHEN avg_child_progress >= 100 THEN 'completed'
                WHEN avg_child_progress >= 70 THEN 'active'
                WHEN avg_child_progress >= 30 THEN 'at_risk'
                ELSE 'behind'
            END
        WHERE id = NEW.parent_id;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_parent_okr_on_child_change
AFTER UPDATE ON public.okrs
FOR EACH ROW
WHEN (OLD.progress IS DISTINCT FROM NEW.progress)
EXECUTE FUNCTION public.update_parent_okr_progress();

-- Function to create feed event for OKR actions
CREATE OR REPLACE FUNCTION public.create_okr_feed_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    event_type TEXT;
    event_title TEXT;
    event_description TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        event_type := 'okr_created';
        event_title := 'Novo OKR criado: ' || NEW.title;
        event_description := NEW.description;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.progress IS DISTINCT FROM NEW.progress THEN
            event_type := 'okr_progress_updated';
            event_title := 'Progresso atualizado: ' || NEW.title;
            event_description := 'Progresso: ' || OLD.progress || '% → ' || NEW.progress || '%';
        ELSIF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'completed' THEN
            event_type := 'okr_completed';
            event_title := 'OKR concluído: ' || NEW.title;
            event_description := 'O OKR foi concluído com sucesso!';
        ELSIF OLD.parent_id IS DISTINCT FROM NEW.parent_id AND NEW.parent_id IS NOT NULL THEN
            event_type := 'okr_linked';
            event_title := 'OKR vinculado: ' || NEW.title;
            event_description := 'O OKR foi vinculado a um OKR pai';
        ELSE
            event_type := 'okr_modified';
            event_title := 'OKR modificado: ' || NEW.title;
            event_description := 'Dados do OKR foram atualizados';
        END IF;
    END IF;
    
    -- Insert feed event
    INSERT INTO public.feed_events (
        tenant_id,
        event_type,
        entity_type,
        entity_id,
        title,
        description,
        author_id
    ) VALUES (
        NEW.tenant_id,
        event_type,
        'okr',
        NEW.id,
        event_title,
        event_description,
        NEW.owner_id
    );
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER okr_feed_event_trigger
AFTER INSERT OR UPDATE ON public.okrs
FOR EACH ROW
EXECUTE FUNCTION public.create_okr_feed_event();

-- Add updated_at trigger for key_results
CREATE TRIGGER update_key_results_updated_at
BEFORE UPDATE ON public.key_results
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();