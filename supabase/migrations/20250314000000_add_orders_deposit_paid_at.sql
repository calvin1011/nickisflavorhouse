-- Add deposit_paid_at for full-payment flow (set when checkout.session.completed).
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS deposit_paid_at timestamptz;
