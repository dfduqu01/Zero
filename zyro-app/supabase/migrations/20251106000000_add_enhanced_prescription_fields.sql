-- Migration: Add Enhanced Prescription Fields
-- Date: 2025-11-06
-- Description: Adds prescription type, lens options, and image upload support
-- Status: Phase 1 - Database Setup

-- ============================================================================
-- STEP 1: CREATE ENUMS
-- ============================================================================

-- Prescription Type Enum
CREATE TYPE prescription_type_enum AS ENUM (
  'without_rx',
  'single_vision',
  'progressive'
);

-- Without RX Sub-type Enum
CREATE TYPE without_rx_type_enum AS ENUM (
  'frame_only',
  'blue_block',
  'standard_eyeglasses'
);

-- Single Vision Sub-type Enum
CREATE TYPE single_vision_type_enum AS ENUM (
  'near',
  'intermediate',
  'distance'
);

-- Lens Index Enum
CREATE TYPE lens_index_enum AS ENUM (
  '1.50',
  '1.60',
  '1.67',  -- Future
  '1.74'   -- Future
);

-- Progressive View Area Enum
CREATE TYPE progressive_view_area_enum AS ENUM (
  'standard',
  'broader_40'
);

-- ============================================================================
-- STEP 2: CREATE LENS_OPTIONS TABLE
-- ============================================================================

CREATE TABLE lens_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  option_type VARCHAR(50) NOT NULL, -- 'without_rx_type', 'lens_index', 'view_area'
  option_value VARCHAR(50) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  price_modifier DECIMAL(10,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lens_options
CREATE INDEX idx_lens_options_type ON lens_options(option_type);
CREATE INDEX idx_lens_options_active ON lens_options(is_active);

-- ============================================================================
-- STEP 3: POPULATE LENS_OPTIONS TABLE
-- ============================================================================

INSERT INTO lens_options (option_type, option_value, display_name, description, price_modifier, display_order) VALUES
-- Without RX Types
('without_rx_type', 'frame_only', 'Solo el Marco', 'Solo el marco, sin lentes incluidos', 0.00, 1),
('without_rx_type', 'blue_block', 'Bloqueo de Luz Azul', 'Lentes con bloqueo de luz azul (sin receta)', 25.00, 2),
('without_rx_type', 'standard_eyeglasses', 'Lentes Estándar', 'Lentes transparentes sin receta', 15.00, 3),

-- Lens Index
('lens_index', '1.50', '1.50 Estándar', 'Lente de plástico estándar', 0.00, 1),
('lens_index', '1.60', '1.60 Delgado', 'Lente de alto índice, 20% más delgado y ligero', 50.00, 2),

-- Progressive View Area
('view_area', 'standard', 'Área de Visión Estándar', 'Corredor progresivo tradicional', 0.00, 1),
('view_area', 'broader_40', 'Área de Visión 40% Más Amplia', 'Zonas más amplias para trabajo en computadora', 75.00, 2);

-- ============================================================================
-- STEP 4: ALTER CART_ITEM_PRESCRIPTIONS TABLE
-- ============================================================================
-- Note: prescription_image_url already exists in the schema

ALTER TABLE cart_item_prescriptions
  ADD COLUMN prescription_type prescription_type_enum,
  ADD COLUMN without_rx_type without_rx_type_enum,
  ADD COLUMN single_vision_type single_vision_type_enum,
  ADD COLUMN lens_index lens_index_enum,
  ADD COLUMN progressive_view_area progressive_view_area_enum,
  ADD COLUMN prescription_image_uploaded_at TIMESTAMPTZ;

-- ============================================================================
-- STEP 5: ADD CONSTRAINTS TO CART_ITEM_PRESCRIPTIONS
-- ============================================================================

-- Prescription type is required
ALTER TABLE cart_item_prescriptions
  ADD CONSTRAINT prescription_type_required
    CHECK (prescription_type IS NOT NULL);

-- Without RX sub-type required when prescription_type = 'without_rx'
ALTER TABLE cart_item_prescriptions
  ADD CONSTRAINT without_rx_subtype_required
    CHECK (
      prescription_type != 'without_rx'
      OR without_rx_type IS NOT NULL
    );

-- Single Vision sub-type required when prescription_type = 'single_vision'
ALTER TABLE cart_item_prescriptions
  ADD CONSTRAINT single_vision_subtype_required
    CHECK (
      prescription_type != 'single_vision'
      OR single_vision_type IS NOT NULL
    );

-- Lens index required for RX types (single_vision or progressive)
ALTER TABLE cart_item_prescriptions
  ADD CONSTRAINT rx_lens_index_required
    CHECK (
      prescription_type = 'without_rx'
      OR lens_index IS NOT NULL
    );

-- Progressive view area required when prescription_type = 'progressive'
ALTER TABLE cart_item_prescriptions
  ADD CONSTRAINT progressive_view_area_required
    CHECK (
      prescription_type != 'progressive'
      OR progressive_view_area IS NOT NULL
    );

-- RX formula OR image required for single_vision and progressive
ALTER TABLE cart_item_prescriptions
  ADD CONSTRAINT rx_formula_or_image_required
    CHECK (
      prescription_type = 'without_rx'
      OR (od_sph IS NOT NULL OR os_sph IS NOT NULL OR prescription_image_url IS NOT NULL)
    );

-- ============================================================================
-- STEP 6: ALTER ORDER_ITEM_PRESCRIPTIONS TABLE (same as cart)
-- ============================================================================
-- Note: prescription_image_url already exists in the schema

ALTER TABLE order_item_prescriptions
  ADD COLUMN prescription_type prescription_type_enum,
  ADD COLUMN without_rx_type without_rx_type_enum,
  ADD COLUMN single_vision_type single_vision_type_enum,
  ADD COLUMN lens_index lens_index_enum,
  ADD COLUMN progressive_view_area progressive_view_area_enum,
  ADD COLUMN prescription_image_uploaded_at TIMESTAMPTZ;

-- ============================================================================
-- STEP 7: ADD CONSTRAINTS TO ORDER_ITEM_PRESCRIPTIONS
-- ============================================================================

-- Prescription type is required
ALTER TABLE order_item_prescriptions
  ADD CONSTRAINT order_prescription_type_required
    CHECK (prescription_type IS NOT NULL);

-- Without RX sub-type required when prescription_type = 'without_rx'
ALTER TABLE order_item_prescriptions
  ADD CONSTRAINT order_without_rx_subtype_required
    CHECK (
      prescription_type != 'without_rx'
      OR without_rx_type IS NOT NULL
    );

-- Single Vision sub-type required when prescription_type = 'single_vision'
ALTER TABLE order_item_prescriptions
  ADD CONSTRAINT order_single_vision_subtype_required
    CHECK (
      prescription_type != 'single_vision'
      OR single_vision_type IS NOT NULL
    );

-- Lens index required for RX types
ALTER TABLE order_item_prescriptions
  ADD CONSTRAINT order_rx_lens_index_required
    CHECK (
      prescription_type = 'without_rx'
      OR lens_index IS NOT NULL
    );

-- Progressive view area required when prescription_type = 'progressive'
ALTER TABLE order_item_prescriptions
  ADD CONSTRAINT order_progressive_view_area_required
    CHECK (
      prescription_type != 'progressive'
      OR progressive_view_area IS NOT NULL
    );

-- RX formula OR image required
ALTER TABLE order_item_prescriptions
  ADD CONSTRAINT order_rx_formula_or_image_required
    CHECK (
      prescription_type = 'without_rx'
      OR (od_sph IS NOT NULL OR os_sph IS NOT NULL OR prescription_image_url IS NOT NULL)
    );

-- ============================================================================
-- STEP 8: ADD RLS POLICIES FOR LENS_OPTIONS
-- ============================================================================

-- Enable RLS
ALTER TABLE lens_options ENABLE ROW LEVEL SECURITY;

-- Public can view active lens options
CREATE POLICY "lens_options_select_policy"
  ON lens_options FOR SELECT
  USING (is_active = true);

-- Admins can manage all lens options
CREATE POLICY "lens_options_admin_all_policy"
  ON lens_options FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- ============================================================================
-- STEP 9: ADD UPDATED_AT TRIGGER FOR LENS_OPTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lens_options_updated_at
  BEFORE UPDATE ON lens_options
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary:
-- ✅ 5 new enums created
-- ✅ lens_options table created with 7 initial records
-- ✅ cart_item_prescriptions table altered (7 new columns + 6 constraints)
-- ✅ order_item_prescriptions table altered (7 new columns + 6 constraints)
-- ✅ RLS policies added for lens_options
-- ✅ Updated_at trigger added for lens_options
