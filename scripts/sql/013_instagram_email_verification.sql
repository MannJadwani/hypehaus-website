-- Add Instagram verification and Email domain verification columns to orders table
-- Also adds refund tracking fields

-- Instagram handle submitted at checkout (already may exist via notes, but making it a proper column)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS instagram_handle text;

-- Instagram verification status: not_required (event doesn't require it), pending (awaiting review), approved, rejected
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS instagram_verification_status text NOT NULL DEFAULT 'not_required'
  CHECK (instagram_verification_status IN ('not_required', 'pending', 'approved', 'rejected'));

-- Timestamp when Instagram verification status was last updated
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS instagram_verified_at timestamptz;

-- Admin user who approved/rejected (for audit trail)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS instagram_verified_by uuid REFERENCES public.admin_users(id);

-- Email domain extracted from the buyer's email at checkout
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS email_domain text;

-- Email domain verification status: not_required, approved (domain matched allowed list), rejected (domain didn't match)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS email_domain_status text NOT NULL DEFAULT 'not_required'
  CHECK (email_domain_status IN ('not_required', 'approved', 'rejected'));

-- Refund tracking fields
-- Whether a refund has been requested/needed (e.g., after Instagram rejection)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS refund_requested boolean NOT NULL DEFAULT false;

-- Reason for refund request
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS refund_reason text;

-- Timestamp when refund was requested
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS refund_requested_at timestamptz;

-- Whether the refund has been processed (manually by admin)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS refund_processed boolean NOT NULL DEFAULT false;

-- Timestamp when refund was marked as processed
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS refund_processed_at timestamptz;

-- Admin user who processed the refund
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS refund_processed_by uuid REFERENCES public.admin_users(id);

-- Notes about the refund (e.g., transaction ID, method used)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS refund_notes text;

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_orders_instagram_verification_status ON public.orders(instagram_verification_status);
CREATE INDEX IF NOT EXISTS idx_orders_instagram_handle ON public.orders(instagram_handle);
CREATE INDEX IF NOT EXISTS idx_orders_email_domain ON public.orders(email_domain);
CREATE INDEX IF NOT EXISTS idx_orders_email_domain_status ON public.orders(email_domain_status);
CREATE INDEX IF NOT EXISTS idx_orders_refund_requested ON public.orders(refund_requested);
CREATE INDEX IF NOT EXISTS idx_orders_refund_processed ON public.orders(refund_processed);

-- Composite index for finding orders pending Instagram review (paid but pending verification)
CREATE INDEX IF NOT EXISTS idx_orders_pending_ig_review 
  ON public.orders(instagram_verification_status, status) 
  WHERE instagram_verification_status = 'pending' AND status = 'paid';

-- Composite index for finding orders needing refund processing
CREATE INDEX IF NOT EXISTS idx_orders_pending_refund 
  ON public.orders(refund_requested, refund_processed) 
  WHERE refund_requested = true AND refund_processed = false;
