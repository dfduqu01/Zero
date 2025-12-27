-- Migration: Add ERP ID tracking to lookup tables
-- Date: 2025-11-18
-- Purpose: Track dubros.com IDs for categories, brands, and materials to enable proper foreign key resolution

-- Add erp_id to categories table
ALTER TABLE categories
  ADD COLUMN erp_id TEXT UNIQUE;

CREATE INDEX idx_categories_erp_id ON categories(erp_id) WHERE erp_id IS NOT NULL;

COMMENT ON COLUMN categories.erp_id IS 'dubros.com category ID (Categoria._id from API)';

-- Add erp_id to brands table
ALTER TABLE brands
  ADD COLUMN erp_id TEXT UNIQUE;

CREATE INDEX idx_brands_erp_id ON brands(erp_id) WHERE erp_id IS NOT NULL;

COMMENT ON COLUMN brands.erp_id IS 'dubros.com brand ID (Brands._id from API)';

-- Add erp_id to frame_materials table
ALTER TABLE frame_materials
  ADD COLUMN erp_id TEXT UNIQUE;

CREATE INDEX idx_frame_materials_erp_id ON frame_materials(erp_id) WHERE erp_id IS NOT NULL;

COMMENT ON COLUMN frame_materials.erp_id IS 'dubros.com material ID (Product_Material._id from API)';

-- Note: These erp_id fields enable us to:
-- 1. Match dubros.com entities to existing ZERO entities
-- 2. Auto-create missing categories/brands/materials during sync
-- 3. Maintain sync integrity across multiple sync runs
