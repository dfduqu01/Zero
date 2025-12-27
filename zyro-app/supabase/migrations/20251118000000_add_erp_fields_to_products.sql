-- Migration: Add ERP integration fields to products table
-- Date: 2025-11-18
-- Purpose: Enable tracking of dubros.com ERP sync data for products

-- Add ERP tracking fields to products table
ALTER TABLE products
  ADD COLUMN erp_id TEXT UNIQUE,
  ADD COLUMN erp_last_synced_at TIMESTAMPTZ,
  ADD COLUMN erp_data JSONB,
  ADD COLUMN sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'error', 'manual')),
  ADD COLUMN gender TEXT CHECK (gender IN ('Male', 'Female', 'Unisex'));

-- Create indexes for performance
CREATE INDEX idx_products_erp_id ON products(erp_id) WHERE erp_id IS NOT NULL;
CREATE INDEX idx_products_sync_status ON products(sync_status);
CREATE INDEX idx_products_erp_last_synced_at ON products(erp_last_synced_at) WHERE erp_last_synced_at IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN products.erp_id IS 'dubros.com product ID (_id field from API)';
COMMENT ON COLUMN products.erp_last_synced_at IS 'Timestamp of last successful sync from dubros.com';
COMMENT ON COLUMN products.erp_data IS 'Full JSON payload from dubros.com API for debugging/recovery';
COMMENT ON COLUMN products.sync_status IS 'Sync status: pending (not synced), synced (from ERP), error (sync failed), manual (created manually)';
COMMENT ON COLUMN products.gender IS 'Product gender from dubros.com (Male, Female, Unisex)';
