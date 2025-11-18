1-- ============================================================================
-- Migration: Restructure Prescription System
-- Date: 2025-11-07
-- Description: Creates 4 separate admin-editable tables for prescription flow
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE NEW TABLES
-- ============================================================================

-- 1.1 Prescription Types Table
CREATE TABLE prescription_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 Lens Types Table (replaces and extends lens_treatments)
CREATE TABLE lens_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  price_modifier DECIMAL(10,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  applies_to_without_rx BOOLEAN DEFAULT false, -- Can be used for Frame Only flow
  applies_to_with_rx BOOLEAN DEFAULT false,    -- Can be used for prescription flow
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.3 Lens Indexes Table
CREATE TABLE lens_indexes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  index_value VARCHAR(10) NOT NULL, -- '1.50', '1.60', '1.67', '1.74'
  description TEXT,
  price_modifier DECIMAL(10,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.4 View Areas Table (for progressive lenses)
CREATE TABLE view_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  price_modifier DECIMAL(10,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 2: ADD INDEXES
-- ============================================================================

CREATE INDEX idx_prescription_types_active ON prescription_types(is_active);
CREATE INDEX idx_prescription_types_slug ON prescription_types(slug);

CREATE INDEX idx_lens_types_active ON lens_types(is_active);
CREATE INDEX idx_lens_types_slug ON lens_types(slug);
CREATE INDEX idx_lens_types_without_rx ON lens_types(applies_to_without_rx);
CREATE INDEX idx_lens_types_with_rx ON lens_types(applies_to_with_rx);

CREATE INDEX idx_lens_indexes_active ON lens_indexes(is_active);
CREATE INDEX idx_lens_indexes_slug ON lens_indexes(slug);

CREATE INDEX idx_view_areas_active ON view_areas(is_active);
CREATE INDEX idx_view_areas_slug ON view_areas(slug);

-- ============================================================================
-- STEP 3: POPULATE TABLES WITH INITIAL DATA
-- ============================================================================

-- 3.1 Prescription Types
INSERT INTO prescription_types (name, slug, description, display_order) VALUES
('Single Vision', 'single-vision', 'One field of vision (near or distance)', 1),
('Progressive', 'progressive', 'Multiple vision zones in one lens', 2),
('Non-Prescription', 'non-prescription', 'Cosmetic or protective use only', 3);

-- 3.2 Lens Types (Frame Only options + Prescription options)
INSERT INTO lens_types (name, slug, description, price_modifier, applies_to_without_rx, applies_to_with_rx, display_order) VALUES
-- Frame Only / Non-RX options
('Frame Only (Demo Lenses)', 'frame-only', 'Solo el marco, sin lentes incluidos', 0.00, true, false, 1),
('Blue Light Block', 'blue-light-block', 'Protects eyes from digital screens', 25.00, true, true, 2),
('Standard Clear Lenses', 'standard-clear', 'Everyday transparent lenses', 15.00, true, true, 3),
('Photochromatic', 'photochromatic', 'Automatically darkens in sunlight', 89.99, true, true, 4),

-- Additional treatments (from old lens_treatments - applies to prescription only)
('Anti-Reflective Coating', 'anti-reflective', 'Reduces glare and improves visual clarity', 49.99, false, true, 5),
('UV Protection', 'uv-protection', '100% UV ray protection', 29.99, false, true, 6);

-- 3.3 Lens Indexes
INSERT INTO lens_indexes (name, slug, index_value, description, price_modifier, display_order) VALUES
('Mid-Index (1.50)', 'mid-index-150', '1.50', 'Standard plastic lens', 0.00, 1),
('High-Index (1.60)', 'high-index-160', '1.60', '20% thinner and lighter', 50.00, 2),
('Ultra-Thin (1.67)', 'ultra-thin-167', '1.67', '30% thinner - Coming soon', 100.00, 3),
('Ultra-Thin Plus (1.74)', 'ultra-thin-plus-174', '1.74', '40% thinner - Coming soon', 150.00, 4);

-- Mark future lens indexes as inactive
UPDATE lens_indexes SET is_active = false WHERE index_value IN ('1.67', '1.74');

-- 3.4 View Areas (for progressive lenses)
INSERT INTO view_areas (name, slug, description, price_modifier, display_order) VALUES
('Standard View', 'standard-view', 'Traditional progressive corridor', 0.00, 1),
('40% Broader View', 'broader-view-40', 'Wider zones for computer work', 75.00, 2);

-- ============================================================================
-- STEP 4: ALTER CART_ITEM_PRESCRIPTIONS TABLE
-- ============================================================================

-- Add foreign key columns (make them nullable for migration)
ALTER TABLE cart_item_prescriptions
  ADD COLUMN prescription_type_id UUID REFERENCES prescription_types(id),
  ADD COLUMN lens_type_id UUID REFERENCES lens_types(id),
  ADD COLUMN lens_index_id UUID REFERENCES lens_indexes(id),
  ADD COLUMN view_area_id UUID REFERENCES view_areas(id);

-- Add index for lookups
CREATE INDEX idx_cart_prescriptions_type ON cart_item_prescriptions(prescription_type_id);
CREATE INDEX idx_cart_prescriptions_lens_type ON cart_item_prescriptions(lens_type_id);

-- ============================================================================
-- STEP 5: ALTER ORDER_ITEM_PRESCRIPTIONS TABLE
-- ============================================================================

-- Add foreign key columns
ALTER TABLE order_item_prescriptions
  ADD COLUMN prescription_type_id UUID REFERENCES prescription_types(id),
  ADD COLUMN lens_type_id UUID REFERENCES lens_types(id),
  ADD COLUMN lens_index_id UUID REFERENCES lens_indexes(id),
  ADD COLUMN view_area_id UUID REFERENCES view_areas(id);

-- Add index for lookups
CREATE INDEX idx_order_prescriptions_type ON order_item_prescriptions(prescription_type_id);
CREATE INDEX idx_order_prescriptions_lens_type ON order_item_prescriptions(lens_type_id);

-- ============================================================================
-- STEP 6: CREATE RLS POLICIES
-- ============================================================================

-- 6.1 Prescription Types
ALTER TABLE prescription_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prescription_types_select_policy"
  ON prescription_types FOR SELECT
  USING (is_active = true);

CREATE POLICY "prescription_types_admin_all_policy"
  ON prescription_types FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- 6.2 Lens Types
ALTER TABLE lens_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lens_types_select_policy"
  ON lens_types FOR SELECT
  USING (is_active = true);

CREATE POLICY "lens_types_admin_all_policy"
  ON lens_types FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- 6.3 Lens Indexes
ALTER TABLE lens_indexes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lens_indexes_select_policy"
  ON lens_indexes FOR SELECT
  USING (is_active = true);

CREATE POLICY "lens_indexes_admin_all_policy"
  ON lens_indexes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- 6.4 View Areas
ALTER TABLE view_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_areas_select_policy"
  ON view_areas FOR SELECT
  USING (is_active = true);

CREATE POLICY "view_areas_admin_all_policy"
  ON view_areas FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- ============================================================================
-- STEP 7: ADD UPDATED_AT TRIGGERS
-- ============================================================================

CREATE TRIGGER update_prescription_types_updated_at
  BEFORE UPDATE ON prescription_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lens_types_updated_at
  BEFORE UPDATE ON lens_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lens_indexes_updated_at
  BEFORE UPDATE ON lens_indexes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_view_areas_updated_at
  BEFORE UPDATE ON view_areas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 8: COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE prescription_types IS 'Admin-editable prescription types (Single Vision, Progressive, etc.)';
COMMENT ON TABLE lens_types IS 'Admin-editable lens types - replaces lens_treatments. Used for both Frame Only and Prescription flows.';
COMMENT ON TABLE lens_indexes IS 'Admin-editable lens thickness indexes (1.50, 1.60, etc.)';
COMMENT ON TABLE view_areas IS 'Admin-editable progressive lens view areas';

COMMENT ON COLUMN lens_types.applies_to_without_rx IS 'Can be used in Frame Only flow (without prescription)';
COMMENT ON COLUMN lens_types.applies_to_with_rx IS 'Can be used in Prescription flow (with prescription)';

-- ============================================================================
-- NOTES FOR FUTURE CLEANUP
-- ============================================================================

-- TODO: After updating application code, consider:
-- 1. Dropping old lens_options table (if no longer needed)
-- 2. Dropping old lens_treatments table (migrated to lens_types)
-- 3. Dropping old prescription type ENUMs (replaced with table references)
-- 4. Removing old ENUM columns from cart_item_prescriptions and order_item_prescriptions

-- For now, we keep them for backward compatibility during migration

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary:
-- ✅ 4 new admin-editable tables created:
--    - prescription_types (3 records)
--    - lens_types (6 records, replaces lens_treatments)
--    - lens_indexes (4 records, 2 inactive for future)
--    - view_areas (2 records)
-- ✅ Foreign key columns added to cart_item_prescriptions
-- ✅ Foreign key columns added to order_item_prescriptions
-- ✅ RLS policies added for all tables
-- ✅ Updated_at triggers added
-- ✅ Indexes created for performance
