-- ============================================
-- Pricing Tiers System Migration
-- Date: November 29, 2025
-- Purpose: Add pricing tier system for B2C pricing with shipping costs
-- ============================================

-- 1. CREATE PRICING_TIERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tier definition
  tier_name TEXT NOT NULL,
  min_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_cost DECIMAL(10,2),  -- NULL means infinity
  markup_multiplier DECIMAL(5,2) NOT NULL,

  -- Metadata
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. INSERT DEFAULT PRICING TIERS
-- ============================================
INSERT INTO pricing_tiers (tier_name, min_cost, max_cost, markup_multiplier, display_order) VALUES
  ('Budget',     0,    30,   4.0, 1),
  ('Mid-Range',  30,   100,  3.0, 2),
  ('Premium',    100,  NULL, 2.5, 3);

-- 3. CREATE INDEXES FOR PRICING_TIERS
-- ============================================
CREATE INDEX idx_pricing_tiers_active ON pricing_tiers(is_active);
CREATE INDEX idx_pricing_tiers_display_order ON pricing_tiers(display_order);

-- 4. ENABLE RLS ON PRICING_TIERS
-- ============================================
ALTER TABLE pricing_tiers ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active tiers
CREATE POLICY "Anyone can view active tiers"
  ON pricing_tiers FOR SELECT
  USING (is_active = true);

-- Policy: Service role can manage all tiers
CREATE POLICY "Service role can manage all tiers"
  ON pricing_tiers FOR ALL
  USING (true);

-- 5. ADD PRICING COLUMNS TO PRODUCTS TABLE
-- ============================================
DO $$
BEGIN
  -- Dubros costs
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='products' AND column_name='cost_dubros') THEN
    ALTER TABLE products ADD COLUMN cost_dubros DECIMAL(10,2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='products' AND column_name='cost_shipping') THEN
    ALTER TABLE products ADD COLUMN cost_shipping DECIMAL(10,2) DEFAULT 25;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='products' AND column_name='cost_total') THEN
    ALTER TABLE products ADD COLUMN cost_total DECIMAL(10,2);
  END IF;

  -- Pricing calculation
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='products' AND column_name='pricing_tier_id') THEN
    ALTER TABLE products ADD COLUMN pricing_tier_id UUID REFERENCES pricing_tiers(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='products' AND column_name='markup_multiplier') THEN
    ALTER TABLE products ADD COLUMN markup_multiplier DECIMAL(5,2);
  END IF;

  -- Profit tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='products' AND column_name='profit_amount') THEN
    ALTER TABLE products ADD COLUMN profit_amount DECIMAL(10,2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='products' AND column_name='profit_margin_percent') THEN
    ALTER TABLE products ADD COLUMN profit_margin_percent DECIMAL(5,2);
  END IF;

  -- Flags
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='products' AND column_name='is_price_override') THEN
    ALTER TABLE products ADD COLUMN is_price_override BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='products' AND column_name='is_sold_by_dozen') THEN
    ALTER TABLE products ADD COLUMN is_sold_by_dozen BOOLEAN DEFAULT false;
  END IF;

  -- Audit
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='products' AND column_name='price_calculated_at') THEN
    ALTER TABLE products ADD COLUMN price_calculated_at TIMESTAMPTZ;
  END IF;
END $$;

-- 6. ADD CLOUDFRONT URL TO PRODUCT_IMAGES TABLE
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='product_images' AND column_name='cloudfront_url') THEN
    ALTER TABLE product_images ADD COLUMN cloudfront_url TEXT;
  END IF;
END $$;

-- 7. CREATE INDEXES FOR PRODUCTS PRICING COLUMNS
-- ============================================
CREATE INDEX IF NOT EXISTS idx_products_pricing_tier ON products(pricing_tier_id);
CREATE INDEX IF NOT EXISTS idx_products_price_override ON products(is_price_override);
CREATE INDEX IF NOT EXISTS idx_products_cost_dubros ON products(cost_dubros);

-- 8. ADD COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON TABLE pricing_tiers IS 'Pricing tier configuration for B2C pricing with shipping costs';
COMMENT ON COLUMN pricing_tiers.tier_name IS 'Display name of the tier (e.g., Budget, Mid-Range, Premium)';
COMMENT ON COLUMN pricing_tiers.min_cost IS 'Minimum dubros cost (inclusive) for this tier';
COMMENT ON COLUMN pricing_tiers.max_cost IS 'Maximum dubros cost (exclusive) for this tier. NULL = no upper limit';
COMMENT ON COLUMN pricing_tiers.markup_multiplier IS 'Multiplier for pricing formula: Price = Shipping + (Dubros Cost × Multiplier)';

COMMENT ON COLUMN products.cost_dubros IS 'Wholesale cost per unit from dubros.com (after dozen calculation if applicable)';
COMMENT ON COLUMN products.cost_shipping IS 'Flat shipping cost per product (DHL rate)';
COMMENT ON COLUMN products.cost_total IS 'Total cost: cost_dubros + cost_shipping';
COMMENT ON COLUMN products.pricing_tier_id IS 'FK to pricing_tiers - which tier was used for calculation';
COMMENT ON COLUMN products.markup_multiplier IS 'Markup multiplier used from tier (stored for audit)';
COMMENT ON COLUMN products.profit_amount IS 'Profit amount: price - cost_total';
COMMENT ON COLUMN products.profit_margin_percent IS 'Profit margin percentage: (profit_amount / cost_total) × 100';
COMMENT ON COLUMN products.is_price_override IS 'True if admin manually set custom price (preserved during sync)';
COMMENT ON COLUMN products.is_sold_by_dozen IS 'True if dubros sells by dozen (cost_dubros is per-unit after /12)';
COMMENT ON COLUMN products.price_calculated_at IS 'Timestamp when price was last calculated';

COMMENT ON COLUMN product_images.cloudfront_url IS 'High-res CloudFront CDN URL: https://dhbamyabyqtec.cloudfront.net/{SKU}.jpg';
