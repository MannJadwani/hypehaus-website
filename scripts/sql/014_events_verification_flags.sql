-- Add Instagram and Email Domain verification flags to events table
-- These flags control whether verification gates are enabled at checkout

-- Whether event requires Instagram handle verification at checkout
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS require_instagram_verification boolean NOT NULL DEFAULT false;

-- Whether event requires email domain verification at checkout
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS require_email_domain_verification boolean NOT NULL DEFAULT false;

-- List of allowed email domains when email domain verification is enabled
-- Example: ['college.edu', 'school.edu']
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS allowed_email_domains text[] DEFAULT NULL;

-- Index for quickly finding events with verification enabled
CREATE INDEX IF NOT EXISTS idx_events_require_instagram_verification 
  ON public.events(require_instagram_verification) 
  WHERE require_instagram_verification = true;

CREATE INDEX IF NOT EXISTS idx_events_require_email_domain_verification 
  ON public.events(require_email_domain_verification) 
  WHERE require_email_domain_verification = true;
