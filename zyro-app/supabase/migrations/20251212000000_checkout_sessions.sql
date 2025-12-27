-- Migration: Create checkout_sessions table for redirect payment flow
-- Created: 2025-12-12
-- Purpose: Store checkout session data before redirecting to PagueloFacil

-- Create checkout_sessions table
CREATE TABLE IF NOT EXISTS checkout_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL UNIQUE,
  payment_link_code TEXT,  -- LK-XXX from PagueloFacil
  address_id UUID REFERENCES addresses(id),
  shipping_method TEXT NOT NULL,
  cart_snapshot JSONB NOT NULL,  -- Full cart data
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour',
  completed_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT checkout_sessions_order_number_key UNIQUE (order_number),
  CONSTRAINT checkout_sessions_amount_positive CHECK (amount > 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_user_id
  ON checkout_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_checkout_sessions_order_number
  ON checkout_sessions(order_number);

CREATE INDEX IF NOT EXISTS idx_checkout_sessions_payment_link_code
  ON checkout_sessions(payment_link_code);

CREATE INDEX IF NOT EXISTS idx_checkout_sessions_status
  ON checkout_sessions(status);

CREATE INDEX IF NOT EXISTS idx_checkout_sessions_created_at
  ON checkout_sessions(created_at DESC);

-- Add RLS (Row Level Security) policies
ALTER TABLE checkout_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own checkout sessions
CREATE POLICY "Users can view own checkout sessions"
  ON checkout_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own checkout sessions
CREATE POLICY "Users can create own checkout sessions"
  ON checkout_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own checkout sessions
CREATE POLICY "Users can update own checkout sessions"
  ON checkout_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Allow service role full access (for API routes)
CREATE POLICY "Service role has full access to checkout sessions"
  ON checkout_sessions
  FOR ALL
  USING (auth.role() = 'service_role');

-- Add comment to table
COMMENT ON TABLE checkout_sessions IS 'Stores checkout session data before redirecting to PagueloFacil for payment';

COMMENT ON COLUMN checkout_sessions.order_number IS 'Pre-generated order number sent to PagueloFacil as PARM_1';
COMMENT ON COLUMN checkout_sessions.payment_link_code IS 'Payment link code (LK-XXX) from PagueloFacil response';
COMMENT ON COLUMN checkout_sessions.cart_snapshot IS 'Full cart data including products and prescriptions';
COMMENT ON COLUMN checkout_sessions.status IS 'Session status: pending (awaiting payment), completed (order created), failed (payment failed), expired (session expired)';
COMMENT ON COLUMN checkout_sessions.expires_at IS 'Session expiration time (default 1 hour from creation)';
