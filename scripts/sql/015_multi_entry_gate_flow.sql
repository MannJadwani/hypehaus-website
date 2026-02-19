-- Multi-entry gate flow configuration

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS enable_entry_gate_flow boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.event_entry_gates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_entry_gates_event_active
  ON public.event_entry_gates(event_id, is_active);

CREATE INDEX IF NOT EXISTS idx_event_entry_gates_event_sort
  ON public.event_entry_gates(event_id, sort_order);

CREATE TABLE IF NOT EXISTS public.ticket_gate_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  gate_id uuid NOT NULL REFERENCES public.event_entry_gates(id) ON DELETE CASCADE,
  scanned_by_admin_id uuid REFERENCES public.admin_users(id) ON DELETE SET NULL,
  scanned_at timestamptz NOT NULL DEFAULT now(),
  scan_source text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_ticket_gate_scans_ticket_gate
  ON public.ticket_gate_scans(ticket_id, gate_id);

CREATE INDEX IF NOT EXISTS idx_ticket_gate_scans_ticket
  ON public.ticket_gate_scans(ticket_id);

CREATE INDEX IF NOT EXISTS idx_ticket_gate_scans_event_gate
  ON public.ticket_gate_scans(event_id, gate_id);

CREATE INDEX IF NOT EXISTS idx_ticket_gate_scans_scanned_at
  ON public.ticket_gate_scans(scanned_at DESC);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_event_entry_gates_updated_at ON public.event_entry_gates;
CREATE TRIGGER trg_event_entry_gates_updated_at
BEFORE UPDATE ON public.event_entry_gates
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();
