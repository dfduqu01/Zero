-- Pricing Recalculation Logs Table
-- Date: December 8, 2025
-- Purpose: Audit log for pricing recalculation jobs (similar to erp_sync_logs)

CREATE TABLE IF NOT EXISTS pricing_recalculation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'success', 'partial', 'failed')),

  -- Timestamps
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,

  -- Statistics
  total_products INTEGER DEFAULT 0,
  products_updated INTEGER DEFAULT 0,
  products_skipped INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,

  -- Job parameters (stored for audit trail)
  shipping_cost DECIMAL(10,2),
  pricing_formula INTEGER NOT NULL CHECK (pricing_formula IN (1, 2)),
  respect_overrides BOOLEAN DEFAULT true,
  product_ids JSONB, -- Array of specific product IDs, or NULL for all products

  -- Relationships
  job_id UUID REFERENCES background_jobs(id) ON DELETE CASCADE,
  created_by UUID,

  -- Audit timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_pricing_recalc_logs_status ON pricing_recalculation_logs(status);
CREATE INDEX idx_pricing_recalc_logs_started_at ON pricing_recalculation_logs(started_at DESC);
CREATE INDEX idx_pricing_recalc_logs_job_id ON pricing_recalculation_logs(job_id);
CREATE INDEX idx_pricing_recalc_logs_formula ON pricing_recalculation_logs(pricing_formula);

-- RLS policies
ALTER TABLE pricing_recalculation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view logs"
  ON pricing_recalculation_logs FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage all logs"
  ON pricing_recalculation_logs FOR ALL
  USING (true);

-- Add log_id to background_jobs for backward linking (if not already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'background_jobs' AND column_name = 'log_id'
  ) THEN
    ALTER TABLE background_jobs ADD COLUMN log_id UUID;
    CREATE INDEX idx_background_jobs_log_id ON background_jobs(log_id);
  END IF;
END $$;

-- Comments for documentation
COMMENT ON TABLE pricing_recalculation_logs IS 'Audit log for pricing recalculation jobs. Tracks which products were updated, formulas used, and results.';
COMMENT ON COLUMN pricing_recalculation_logs.pricing_formula IS 'Formula used: 1 = price = shipping + (cost × markup), 2 = price = cost × markup (shipping separate)';
COMMENT ON COLUMN pricing_recalculation_logs.respect_overrides IS 'If true, skipped products with is_price_override = true';
COMMENT ON COLUMN pricing_recalculation_logs.product_ids IS 'JSONB array of specific product IDs to recalculate, or NULL for all products';
COMMENT ON COLUMN pricing_recalculation_logs.shipping_cost IS 'Flat shipping cost used in calculations (typically $25)';
