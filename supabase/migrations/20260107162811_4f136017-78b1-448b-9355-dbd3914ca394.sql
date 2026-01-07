-- Create trigger to generate feed events for sprint metric updates
CREATE OR REPLACE FUNCTION public.create_sprint_feed_event()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_id uuid;
  v_team_name text;
  v_event_type text;
  v_title text;
  v_description text;
BEGIN
  -- Get tenant_id and team name from team
  SELECT t.tenant_id, t.name INTO v_tenant_id, v_team_name
  FROM public.teams t
  WHERE t.id = NEW.team_id;
  
  IF v_tenant_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Determine event type and message
  IF TG_OP = 'INSERT' THEN
    v_event_type := 'sprint_created';
    v_title := 'Nova sprint criada';
    v_description := format('Sprint "%s" criada para equipe %s', NEW.name, v_team_name);
  ELSIF TG_OP = 'UPDATE' THEN
    -- Check what changed
    IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
      v_event_type := 'sprint_closed';
      v_title := 'Sprint encerrada';
      v_description := format('Sprint "%s" foi encerrada pela equipe %s. Velocity: %s pts', NEW.name, v_team_name, COALESCE(NEW.completed_points, 0));
    ELSIF OLD.completed_points IS DISTINCT FROM NEW.completed_points THEN
      v_event_type := 'velocity_updated';
      v_title := 'Velocity atualizado';
      v_description := format('Velocity da sprint "%s" atualizado para %s pts pela equipe %s', NEW.name, COALESCE(NEW.completed_points, 0), v_team_name);
    ELSIF OLD.capacity IS DISTINCT FROM NEW.capacity THEN
      v_event_type := 'capacity_updated';
      v_title := 'Capacidade atualizada';
      v_description := format('Capacidade da sprint "%s" atualizada para %s%% pela equipe %s', NEW.name, COALESCE(NEW.capacity, 0), v_team_name);
    ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
      v_event_type := 'sprint_status_changed';
      v_title := 'Status da sprint alterado';
      v_description := format('Sprint "%s" da equipe %s alterada para %s', NEW.name, v_team_name, NEW.status);
    ELSE
      RETURN NEW;
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  -- Insert feed event
  INSERT INTO public.feed_events (
    tenant_id,
    event_type,
    title,
    description,
    entity_type,
    entity_id
  ) VALUES (
    v_tenant_id,
    v_event_type,
    v_title,
    v_description,
    'sprint',
    NEW.id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for sprint feed events
DROP TRIGGER IF EXISTS sprint_feed_event_trigger ON public.sprints;
CREATE TRIGGER sprint_feed_event_trigger
  AFTER INSERT OR UPDATE ON public.sprints
  FOR EACH ROW
  EXECUTE FUNCTION public.create_sprint_feed_event();