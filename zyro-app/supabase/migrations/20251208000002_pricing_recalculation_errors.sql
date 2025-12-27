-- Pricing Recalculation Errors Table
-- Date: December 8, 2025
-- Purpose: Detailed error logging for individual product pricing failures

CREATE TABLE IF NOT EXISTS pricing_recalculation_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  log_id UUID NOT NULL REFERENCES pricing_recalculation_logs(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_sku TEXT,

  -- Error details
  error_message TEXT NOT NULL,
  error_details JSONB,

  -- Audit timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_pricing_recalc_errors_log_id ON pricing_recalculation_errors(log_id);
CREATE INDEX idx_pricing_recalc_errors_product_id ON pricing_recalculation_errors(product_id);
CREATE INDEX idx_pricing_recalc_errors_created_at ON pricing_recalculation_errors(created_at DESC);

-- RLS policies
ALTER TABLE pricing_recalculation_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view errors"
  ON pricing_recalculation_errors FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage all errors"
  ON pricing_recalculation_errors FOR ALL
  USING (true);

-- Comments for documentation
COMMENT ON TABLE pricing_recalculation_errors IS 'Detailed error log for individual product pricing failures during recalculation jobs';
COMMENT ON COLUMN pricing_recalculation_errors.log_id IS 'Reference to the parent pricing_recalculation_logs entry';
COMMENT ON COLUMN pricing_recalculation_errors.product_sku IS 'SKU of the product that failed (stored in case product is deleted)';
COMMENT ON COLUMN pricing_recalculation_errors.error_details IS 'Additional error context as JSON (e.g., input values, tier info)';
