-- Migration: Add high-resolution image URL field
-- Date: 2025-11-18
-- Purpose: Support two-tier image system (low-res for lists, high-res for detail pages)

-- Add high-res image URL to product_images table
ALTER TABLE product_images
  ADD COLUMN image_url_high TEXT;

-- Add comments for documentation
COMMENT ON COLUMN product_images.image_url IS 'Low-resolution image URL for product lists (fast loading)';
COMMENT ON COLUMN product_images.image_url_high IS 'High-resolution image URL for product detail pages (better quality)';

-- Note: Both URLs will reference dubros.com S3 buckets directly (no local storage)
-- Low-res format: https://s3.amazonaws.com/appforest_uf/f{timestamp}x{id}/{SKU}.jpg
-- High-res format: https://dubros-image-repository.s3.us-east-1.amazonaws.com/{SKU}.jpg
