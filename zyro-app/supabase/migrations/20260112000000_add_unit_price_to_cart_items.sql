-- Migration: Add unit_price to cart_items
-- Date: January 12, 2026
-- Description: Add unit_price column to store calculated price (base + prescription costs)

-- Add unit_price column to cart_items table
ALTER TABLE cart_items
ADD COLUMN IF NOT EXISTS unit_price NUMERIC(10, 2);

-- Set default value for existing rows (use product price)
UPDATE cart_items ci
SET unit_price = p.price
FROM products p
WHERE ci.product_id = p.id
  AND ci.unit_price IS NULL;

-- Make unit_price NOT NULL with default to product price
-- Note: We can't enforce this automatically, so we'll leave it nullable
-- and ensure the application always sets it
COMMENT ON COLUMN cart_items.unit_price IS 'Total price per unit including base product price and all prescription add-ons (lens type, index, view area). Calculated at cart add time.';
