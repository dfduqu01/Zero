-- ============================================
-- ZYRO ONLINE - PRODUCTION DATABASE MIGRATION
-- ============================================
-- This file contains ALL migrations in order for the production database.
-- Run this in Supabase Dashboard → SQL Editor
--
-- NOTE: Due to size, you may need to run this in multiple parts.
-- Each section is marked with "-- MIGRATION X:" headers.
-- ============================================
-- Generated: 2026-01-22
-- ============================================

-- ============================================
-- MIGRATION 1: INITIAL SCHEMA (20251103203500)
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

-- Order status enum
CREATE TYPE order_status AS ENUM (
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled'
);

-- Payment status enum
CREATE TYPE payment_status AS ENUM (
  'pending',
  'completed',
  'failed',
  'refunded'
);

-- Prescription validation status enum
CREATE TYPE prescription_validation_status AS ENUM (
  'pending',
  'approved',
  'rejected'
);

-- Inventory movement type enum
CREATE TYPE inventory_movement_type AS ENUM (
  'erp_sync',
  'order',
  'manual_adjustment',
  'return'
);

-- ERP sync type enum
CREATE TYPE erp_sync_type AS ENUM (
  'scheduled',
  'manual'
);

-- ERP sync status enum
CREATE TYPE erp_sync_status AS ENUM (
  'success',
  'failed',
  'partial'
);

-- Contact submission status enum
CREATE TYPE contact_status AS ENUM (
  'pending',
  'in_progress',
  'resolved'
);

-- ============================================
-- TABLES
-- ============================================

-- 1. Extended user profile (extends auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  country TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. User addresses
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  country TEXT NOT NULL,
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT NOT NULL,
  state_province TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Brands
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Frame materials
CREATE TABLE frame_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Frame shapes
CREATE TABLE frame_shapes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE RESTRICT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  frame_material_id UUID REFERENCES frame_materials(id) ON DELETE SET NULL,
  frame_shape_id UUID REFERENCES frame_shapes(id) ON DELETE SET NULL,
  lens_width INTEGER,
  bridge_width INTEGER,
  temple_length INTEGER,
  stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
  low_stock_threshold INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Product images
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Lens treatments
CREATE TABLE lens_treatments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  base_price DECIMAL(10,2) NOT NULL CHECK (base_price >= 0),
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Product lens treatments (many-to-many)
CREATE TABLE product_lens_treatments (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  treatment_id UUID NOT NULL REFERENCES lens_treatments(id) ON DELETE CASCADE,
  price_override DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (product_id, treatment_id)
);

-- 11. Cart items
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Cart item prescriptions
CREATE TABLE cart_item_prescriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_item_id UUID NOT NULL UNIQUE REFERENCES cart_items(id) ON DELETE CASCADE,
  has_prescription BOOLEAN DEFAULT false,
  od_sph DECIMAL(5,2) CHECK (od_sph BETWEEN -20.00 AND 20.00),
  od_cyl DECIMAL(5,2) CHECK (od_cyl BETWEEN -4.00 AND 4.00),
  od_axis INTEGER CHECK (od_axis BETWEEN 0 AND 180),
  os_sph DECIMAL(5,2) CHECK (os_sph BETWEEN -20.00 AND 20.00),
  os_cyl DECIMAL(5,2) CHECK (os_cyl BETWEEN -4.00 AND 4.00),
  os_axis INTEGER CHECK (os_axis BETWEEN 0 AND 180),
  pd DECIMAL(4,1) CHECK (pd BETWEEN 20.0 AND 80.0),
  pd_dual_od DECIMAL(4,1) CHECK (pd_dual_od BETWEEN 20.0 AND 80.0),
  pd_dual_os DECIMAL(4,1) CHECK (pd_dual_os BETWEEN 20.0 AND 80.0),
  add_value DECIMAL(3,2),
  prescription_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. Cart item treatments (many-to-many)
CREATE TABLE cart_item_treatments (
  cart_item_id UUID NOT NULL REFERENCES cart_items(id) ON DELETE CASCADE,
  treatment_id UUID NOT NULL REFERENCES lens_treatments(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (cart_item_id, treatment_id)
);

-- 14. Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  status order_status NOT NULL DEFAULT 'pending',
  shipping_address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
  shipping_address_snapshot JSONB,
  shipping_method TEXT,
  shipping_cost DECIMAL(10,2) NOT NULL CHECK (shipping_cost >= 0),
  subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
  treatments_cost DECIMAL(10,2) DEFAULT 0 CHECK (treatments_cost >= 0),
  total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
  payment_method TEXT,
  payment_status payment_status DEFAULT 'pending',
  payment_transaction_id TEXT,
  tracking_number TEXT,
  tracking_carrier TEXT,
  estimated_delivery_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 15. Order items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_snapshot JSONB NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 16. Order item prescriptions
CREATE TABLE order_item_prescriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_item_id UUID NOT NULL UNIQUE REFERENCES order_items(id) ON DELETE CASCADE,
  has_prescription BOOLEAN DEFAULT false,
  od_sph DECIMAL(5,2),
  od_cyl DECIMAL(5,2),
  od_axis INTEGER,
  os_sph DECIMAL(5,2),
  os_cyl DECIMAL(5,2),
  os_axis INTEGER,
  pd DECIMAL(4,1),
  pd_dual_od DECIMAL(4,1),
  pd_dual_os DECIMAL(4,1),
  add_value DECIMAL(3,2),
  prescription_image_url TEXT,
  validation_status prescription_validation_status DEFAULT 'pending',
  validated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  validated_at TIMESTAMPTZ,
  validation_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 17. Order item treatments (many-to-many with snapshot)
CREATE TABLE order_item_treatments (
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  treatment_id UUID REFERENCES lens_treatments(id) ON DELETE SET NULL,
  treatment_name TEXT NOT NULL,
  treatment_price DECIMAL(10,2) NOT NULL CHECK (treatment_price >= 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (order_item_id, treatment_id)
);

-- 18. Order status history
CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status order_status,
  to_status order_status NOT NULL,
  changed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  tracking_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 19. Inventory movements
CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  movement_type inventory_movement_type NOT NULL,
  quantity_change INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL CHECK (quantity_after >= 0),
  reference_id UUID,
  reason TEXT,
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 20. ERP sync logs
CREATE TABLE erp_sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sync_type erp_sync_type NOT NULL,
  status erp_sync_status NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  total_records_fetched INTEGER,
  records_processed INTEGER,
  records_updated INTEGER,
  records_skipped INTEGER,
  error_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 21. ERP sync errors
CREATE TABLE erp_sync_errors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sync_log_id UUID NOT NULL REFERENCES erp_sync_logs(id) ON DELETE CASCADE,
  product_sku TEXT,
  error_message TEXT NOT NULL,
  error_details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 22. Wishlists
CREATE TABLE wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- 23. Product reviews
CREATE TABLE product_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  review_text TEXT,
  is_approved BOOLEAN DEFAULT false,
  approved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 24. Contact submissions
CREATE TABLE contact_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  country TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status contact_status DEFAULT 'pending',
  assigned_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_users_country ON users(country);
CREATE INDEX idx_addresses_user_id ON addresses(user_id);
CREATE INDEX idx_addresses_is_default ON addresses(user_id, is_default) WHERE is_default = true;
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_brand_id ON products(brand_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_stock_quantity ON products(stock_quantity);
CREATE INDEX idx_products_category_is_active ON products(category_id, is_active) WHERE is_active = true;
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_is_primary ON product_images(product_id, is_primary) WHERE is_primary = true;
CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_created_at_status ON orders(created_at DESC, status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_inventory_movements_product_id ON inventory_movements(product_id);
CREATE INDEX idx_inventory_movements_created_at ON inventory_movements(created_at DESC);
CREATE INDEX idx_inventory_movements_reference_id ON inventory_movements(reference_id);
CREATE INDEX idx_erp_sync_logs_created_at ON erp_sync_logs(created_at DESC);
CREATE INDEX idx_erp_sync_logs_status ON erp_sync_logs(status);
CREATE INDEX idx_erp_sync_errors_sync_log_id ON erp_sync_errors(sync_log_id);
CREATE INDEX idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX idx_wishlists_product_id ON wishlists(product_id);
CREATE INDEX idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX idx_product_reviews_user_id ON product_reviews(user_id);
CREATE INDEX idx_product_reviews_is_approved ON product_reviews(product_id, is_approved) WHERE is_approved = true;
CREATE INDEX idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX idx_contact_submissions_assigned_to ON contact_submissions(assigned_to_user_id);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE frame_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE frame_shapes ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE lens_treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_lens_treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_item_prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_item_treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_sync_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - USERS
-- ============================================

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- RLS POLICIES - ADDRESSES
-- ============================================

CREATE POLICY "Users can view own addresses"
  ON addresses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own addresses"
  ON addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses"
  ON addresses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own addresses"
  ON addresses FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - PRODUCT CATALOG (PUBLIC READ)
-- ============================================

CREATE POLICY "Public can view active products"
  ON products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage products"
  ON products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

CREATE POLICY "Public can view brands"
  ON brands FOR SELECT
  USING (true);

CREATE POLICY "Public can view categories"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "Public can view frame_materials"
  ON frame_materials FOR SELECT
  USING (true);

CREATE POLICY "Public can view frame_shapes"
  ON frame_shapes FOR SELECT
  USING (true);

CREATE POLICY "Public can view product_images"
  ON product_images FOR SELECT
  USING (true);

CREATE POLICY "Public can view active lens_treatments"
  ON lens_treatments FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public can view product_lens_treatments"
  ON product_lens_treatments FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage brands"
  ON brands FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admins can manage frame_materials"
  ON frame_materials FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admins can manage frame_shapes"
  ON frame_shapes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admins can manage product_images"
  ON product_images FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admins can manage lens_treatments"
  ON lens_treatments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admins can manage product_lens_treatments"
  ON product_lens_treatments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- ============================================
-- RLS POLICIES - SHOPPING CART
-- ============================================

CREATE POLICY "Users can view own cart_items"
  ON cart_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cart_items"
  ON cart_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart_items"
  ON cart_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cart_items"
  ON cart_items FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own cart_item_prescriptions"
  ON cart_item_prescriptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM cart_items
      WHERE cart_items.id = cart_item_prescriptions.cart_item_id
      AND cart_items.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own cart_item_treatments"
  ON cart_item_treatments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM cart_items
      WHERE cart_items.id = cart_item_treatments.cart_item_id
      AND cart_items.user_id = auth.uid()
    )
  );

-- ============================================
-- RLS POLICIES - ORDERS
-- ============================================

CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

CREATE POLICY "Users can view own order_items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all order_items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

CREATE POLICY "Users can view own order_item_prescriptions"
  ON order_item_prescriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM order_items
      JOIN orders ON orders.id = order_items.order_id
      WHERE order_items.id = order_item_prescriptions.order_item_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage order_item_prescriptions"
  ON order_item_prescriptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

CREATE POLICY "Users can view own order_item_treatments"
  ON order_item_treatments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM order_items
      JOIN orders ON orders.id = order_items.order_id
      WHERE order_items.id = order_item_treatments.order_item_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all order_item_treatments"
  ON order_item_treatments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

CREATE POLICY "Users can view own order_status_history"
  ON order_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_status_history.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage order_status_history"
  ON order_status_history FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- ============================================
-- RLS POLICIES - INVENTORY & ERP (ADMIN ONLY)
-- ============================================

CREATE POLICY "Admins can manage inventory_movements"
  ON inventory_movements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admins can manage erp_sync_logs"
  ON erp_sync_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admins can manage erp_sync_errors"
  ON erp_sync_errors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- ============================================
-- RLS POLICIES - CUSTOMER ENGAGEMENT
-- ============================================

CREATE POLICY "Users can manage own wishlists"
  ON wishlists FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can create reviews for purchased products"
  ON product_reviews FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM orders
      JOIN order_items ON order_items.order_id = orders.id
      WHERE orders.user_id = auth.uid()
      AND order_items.product_id = product_reviews.product_id
    )
  );

CREATE POLICY "Users can view approved reviews"
  ON product_reviews FOR SELECT
  USING (is_approved = true);

CREATE POLICY "Users can view own reviews"
  ON product_reviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reviews"
  ON product_reviews FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- ============================================
-- RLS POLICIES - CONTACT SUBMISSIONS
-- ============================================

CREATE POLICY "Anyone can create contact_submissions"
  ON contact_submissions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view own contact_submissions"
  ON contact_submissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all contact_submissions"
  ON contact_submissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_addresses_updated_at
  BEFORE UPDATE ON addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_frame_materials_updated_at
  BEFORE UPDATE ON frame_materials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_frame_shapes_updated_at
  BEFORE UPDATE ON frame_shapes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_images_updated_at
  BEFORE UPDATE ON product_images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lens_treatments_updated_at
  BEFORE UPDATE ON lens_treatments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_reviews_updated_at
  BEFORE UPDATE ON product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- MIGRATION 2: SEED DATA (20251103203600)
-- ============================================
-- NOTE: For production, we skip sample products but include
-- categories, materials, shapes, and treatments

INSERT INTO categories (id, name, slug, description, display_order) VALUES
  ('c1111111-1111-4111-8111-111111111111', 'Gafas de Sol', 'gafas-de-sol', 'Protección UV y estilo para el día a día', 1),
  ('c2222222-2222-4222-8222-222222222222', 'Gafas con Receta', 'gafas-con-receta', 'Lentes graduados para tu vista perfecta', 2);

INSERT INTO frame_materials (id, name) VALUES
  ('a1111111-1111-4111-8111-111111111111', 'Acetato'),
  ('a2222222-2222-4222-8222-222222222222', 'Metal'),
  ('a3333333-3333-4333-8333-333333333333', 'Titanio'),
  ('a4444444-4444-4444-8444-444444444444', 'Plástico'),
  ('a5555555-5555-4555-8555-555555555555', 'Acero Inoxidable'),
  ('a6666666-6666-4666-8666-666666666666', 'Aluminio');

INSERT INTO frame_shapes (id, name) VALUES
  ('f1111111-1111-4111-8111-111111111111', 'Redondo'),
  ('f2222222-2222-4222-8222-222222222222', 'Cuadrado'),
  ('f3333333-3333-4333-8333-333333333333', 'Aviador'),
  ('f4444444-4444-4444-8444-444444444444', 'Ojo de Gato'),
  ('f5555555-5555-4555-8555-555555555555', 'Wayfarer'),
  ('f6666666-6666-4666-8666-666666666666', 'Rectangular'),
  ('f7777777-7777-4777-8777-777777777777', 'Ovalado'),
  ('f8888888-8888-4888-8888-888888888888', 'Mariposa');

INSERT INTO lens_treatments (id, name, description, base_price, is_active, display_order) VALUES
  ('11111111-1111-4111-8111-111111111111', 'Fotocromático', 'Lentes que se oscurecen automáticamente con la luz solar y se aclaran en interiores', 89.99, true, 1),
  ('22222222-2222-4222-8222-222222222222', 'Anti-Reflejo', 'Reduce reflejos y mejora claridad visual en pantallas y conducción nocturna', 49.99, true, 2),
  ('33333333-3333-4333-8333-333333333333', 'Bloqueo Luz Azul', 'Protección contra luz azul de dispositivos digitales, reduce fatiga visual', 39.99, true, 3),
  ('44444444-4444-4444-8444-444444444444', 'Protección UV', 'Protección 100% contra rayos UV dañinos del sol', 29.99, true, 4),
  ('55555555-5555-4555-8555-555555555555', 'Polarizado', 'Elimina reflejos del agua, nieve y superficies brillantes', 79.99, true, 5),
  ('66666666-6666-4666-8666-666666666666', 'Resistente a Rayaduras', 'Capa protectora que mantiene tus lentes como nuevos por más tiempo', 24.99, true, 6);


-- ============================================
-- MIGRATION 3: ORDER INSERT POLICIES (20251104000000)
-- ============================================

CREATE POLICY "Users can insert order_items during order creation"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
      AND orders.created_at > now() - interval '10 minutes'
    )
  );

CREATE POLICY "Admins can insert order_items"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

CREATE POLICY "Users can insert order_item_prescriptions"
  ON order_item_prescriptions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM order_items
      JOIN orders ON orders.id = order_items.order_id
      WHERE order_items.id = order_item_prescriptions.order_item_id
      AND orders.user_id = auth.uid()
      AND orders.created_at > now() - interval '10 minutes'
    )
  );

CREATE POLICY "Users can insert order_item_treatments"
  ON order_item_treatments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM order_items
      JOIN orders ON orders.id = order_items.order_id
      WHERE order_items.id = order_item_treatments.order_item_id
      AND orders.user_id = auth.uid()
      AND orders.created_at > now() - interval '10 minutes'
    )
  );


-- ============================================
-- MIGRATION 4: FIX RLS RECURSION (20251104000001)
-- ============================================

-- Create security definer function for admin check
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.users WHERE id = auth.uid()),
    false
  );
$$;

-- Recreate admin view policy using the function
DROP POLICY IF EXISTS "Admins can view all users" ON users;

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    public.is_admin() OR auth.uid() = id
  );


-- ============================================
-- MIGRATION 5: ENHANCED PRESCRIPTION FIELDS (20251106000000)
-- ============================================

CREATE TYPE prescription_type_enum AS ENUM (
  'without_rx',
  'single_vision',
  'progressive'
);

CREATE TYPE without_rx_type_enum AS ENUM (
  'frame_only',
  'blue_block',
  'standard_eyeglasses'
);

CREATE TYPE single_vision_type_enum AS ENUM (
  'near',
  'intermediate',
  'distance'
);

CREATE TYPE lens_index_enum AS ENUM (
  '1.50',
  '1.60',
  '1.67',
  '1.74'
);

CREATE TYPE progressive_view_area_enum AS ENUM (
  'standard',
  'broader_40'
);

CREATE TABLE lens_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  option_type VARCHAR(50) NOT NULL,
  option_value VARCHAR(50) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  price_modifier DECIMAL(10,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lens_options_type ON lens_options(option_type);
CREATE INDEX idx_lens_options_active ON lens_options(is_active);

INSERT INTO lens_options (option_type, option_value, display_name, description, price_modifier, display_order) VALUES
('without_rx_type', 'frame_only', 'Solo el Marco', 'Solo el marco, sin lentes incluidos', 0.00, 1),
('without_rx_type', 'blue_block', 'Bloqueo de Luz Azul', 'Lentes con bloqueo de luz azul (sin receta)', 25.00, 2),
('without_rx_type', 'standard_eyeglasses', 'Lentes Estándar', 'Lentes transparentes sin receta', 15.00, 3),
('lens_index', '1.50', '1.50 Estándar', 'Lente de plástico estándar', 0.00, 1),
('lens_index', '1.60', '1.60 Delgado', 'Lente de alto índice, 20% más delgado y ligero', 50.00, 2),
('view_area', 'standard', 'Área de Visión Estándar', 'Corredor progresivo tradicional', 0.00, 1),
('view_area', 'broader_40', 'Área de Visión 40% Más Amplia', 'Zonas más amplias para trabajo en computadora', 75.00, 2);

ALTER TABLE cart_item_prescriptions
  ADD COLUMN prescription_type prescription_type_enum,
  ADD COLUMN without_rx_type without_rx_type_enum,
  ADD COLUMN single_vision_type single_vision_type_enum,
  ADD COLUMN lens_index lens_index_enum,
  ADD COLUMN progressive_view_area progressive_view_area_enum,
  ADD COLUMN prescription_image_uploaded_at TIMESTAMPTZ;

ALTER TABLE order_item_prescriptions
  ADD COLUMN prescription_type prescription_type_enum,
  ADD COLUMN without_rx_type without_rx_type_enum,
  ADD COLUMN single_vision_type single_vision_type_enum,
  ADD COLUMN lens_index lens_index_enum,
  ADD COLUMN progressive_view_area progressive_view_area_enum,
  ADD COLUMN prescription_image_uploaded_at TIMESTAMPTZ;

ALTER TABLE lens_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lens_options_select_policy"
  ON lens_options FOR SELECT
  USING (is_active = true);

CREATE POLICY "lens_options_admin_all_policy"
  ON lens_options FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

CREATE TRIGGER update_lens_options_updated_at
  BEFORE UPDATE ON lens_options
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- MIGRATION 6: PRESCRIPTION STORAGE (20251106000001)
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'prescription-images',
  'prescription-images',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own prescription images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'prescription-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view own prescription images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'prescription-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own prescription images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'prescription-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own prescription images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'prescription-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admins can view all prescription images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'prescription-images' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.is_admin = true
  )
);


-- ============================================
-- MIGRATION 7: RESTRUCTURE PRESCRIPTION SYSTEM (20251107000000)
-- ============================================

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

CREATE TABLE lens_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  price_modifier DECIMAL(10,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  applies_to_without_rx BOOLEAN DEFAULT false,
  applies_to_with_rx BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE lens_indexes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  index_value VARCHAR(10) NOT NULL,
  description TEXT,
  price_modifier DECIMAL(10,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

INSERT INTO prescription_types (name, slug, description, display_order) VALUES
('Single Vision', 'single-vision', 'One field of vision (near or distance)', 1),
('Progressive', 'progressive', 'Multiple vision zones in one lens', 2),
('Non-Prescription', 'non-prescription', 'Cosmetic or protective use only', 3);

INSERT INTO lens_types (name, slug, description, price_modifier, applies_to_without_rx, applies_to_with_rx, display_order) VALUES
('Frame Only (Demo Lenses)', 'frame-only', 'Solo el marco, sin lentes incluidos', 0.00, true, false, 1),
('Blue Light Block', 'blue-light-block', 'Protects eyes from digital screens', 25.00, true, true, 2),
('Standard Clear Lenses', 'standard-clear', 'Everyday transparent lenses', 15.00, true, true, 3),
('Photochromatic', 'photochromatic', 'Automatically darkens in sunlight', 89.99, true, true, 4),
('Anti-Reflective Coating', 'anti-reflective', 'Reduces glare and improves visual clarity', 49.99, false, true, 5),
('UV Protection', 'uv-protection', '100% UV ray protection', 29.99, false, true, 6);

INSERT INTO lens_indexes (name, slug, index_value, description, price_modifier, display_order) VALUES
('Mid-Index (1.50)', 'mid-index-150', '1.50', 'Standard plastic lens', 0.00, 1),
('High-Index (1.60)', 'high-index-160', '1.60', '20% thinner and lighter', 50.00, 2),
('Ultra-Thin (1.67)', 'ultra-thin-167', '1.67', '30% thinner - Coming soon', 100.00, 3),
('Ultra-Thin Plus (1.74)', 'ultra-thin-plus-174', '1.74', '40% thinner - Coming soon', 150.00, 4);

UPDATE lens_indexes SET is_active = false WHERE index_value IN ('1.67', '1.74');

INSERT INTO view_areas (name, slug, description, price_modifier, display_order) VALUES
('Standard View', 'standard-view', 'Traditional progressive corridor', 0.00, 1),
('40% Broader View', 'broader-view-40', 'Wider zones for computer work', 75.00, 2);

ALTER TABLE cart_item_prescriptions
  ADD COLUMN prescription_type_id UUID REFERENCES prescription_types(id),
  ADD COLUMN lens_type_id UUID REFERENCES lens_types(id),
  ADD COLUMN lens_index_id UUID REFERENCES lens_indexes(id),
  ADD COLUMN view_area_id UUID REFERENCES view_areas(id);

CREATE INDEX idx_cart_prescriptions_type ON cart_item_prescriptions(prescription_type_id);
CREATE INDEX idx_cart_prescriptions_lens_type ON cart_item_prescriptions(lens_type_id);

ALTER TABLE order_item_prescriptions
  ADD COLUMN prescription_type_id UUID REFERENCES prescription_types(id),
  ADD COLUMN lens_type_id UUID REFERENCES lens_types(id),
  ADD COLUMN lens_index_id UUID REFERENCES lens_indexes(id),
  ADD COLUMN view_area_id UUID REFERENCES view_areas(id);

CREATE INDEX idx_order_prescriptions_type ON order_item_prescriptions(prescription_type_id);
CREATE INDEX idx_order_prescriptions_lens_type ON order_item_prescriptions(lens_type_id);

ALTER TABLE prescription_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE lens_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE lens_indexes ENABLE ROW LEVEL SECURITY;
ALTER TABLE view_areas ENABLE ROW LEVEL SECURITY;

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


-- ============================================
-- MIGRATION 8: ERP FIELDS (20251118000000)
-- ============================================

ALTER TABLE products
  ADD COLUMN erp_id TEXT UNIQUE,
  ADD COLUMN erp_last_synced_at TIMESTAMPTZ,
  ADD COLUMN erp_data JSONB,
  ADD COLUMN sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'error', 'manual')),
  ADD COLUMN gender TEXT CHECK (gender IN ('Male', 'Female', 'Unisex'));

CREATE INDEX idx_products_erp_id ON products(erp_id) WHERE erp_id IS NOT NULL;
CREATE INDEX idx_products_sync_status ON products(sync_status);
CREATE INDEX idx_products_erp_last_synced_at ON products(erp_last_synced_at) WHERE erp_last_synced_at IS NOT NULL;


-- ============================================
-- MIGRATION 9: HIGH RES IMAGE URL (20251118000001)
-- ============================================

ALTER TABLE product_images
  ADD COLUMN image_url_high TEXT;


-- ============================================
-- MIGRATION 10: ERP ID TO LOOKUP TABLES (20251118000002)
-- ============================================

ALTER TABLE categories
  ADD COLUMN erp_id TEXT UNIQUE;

CREATE INDEX idx_categories_erp_id ON categories(erp_id) WHERE erp_id IS NOT NULL;

ALTER TABLE brands
  ADD COLUMN erp_id TEXT UNIQUE;

CREATE INDEX idx_brands_erp_id ON brands(erp_id) WHERE erp_id IS NOT NULL;

ALTER TABLE frame_materials
  ADD COLUMN erp_id TEXT UNIQUE;

CREATE INDEX idx_frame_materials_erp_id ON frame_materials(erp_id) WHERE erp_id IS NOT NULL;


-- ============================================
-- MIGRATION 11: PRICING TIERS (20251129000000)
-- ============================================

CREATE TABLE IF NOT EXISTS pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name TEXT NOT NULL,
  min_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_cost DECIMAL(10,2),
  markup_multiplier DECIMAL(5,2) NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO pricing_tiers (tier_name, min_cost, max_cost, markup_multiplier, display_order) VALUES
  ('Budget',     0,    30,   4.0, 1),
  ('Mid-Range',  30,   100,  3.0, 2),
  ('Premium',    100,  NULL, 2.5, 3);

CREATE INDEX idx_pricing_tiers_active ON pricing_tiers(is_active);
CREATE INDEX idx_pricing_tiers_display_order ON pricing_tiers(display_order);

ALTER TABLE pricing_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active tiers"
  ON pricing_tiers FOR SELECT
  USING (is_active = true);

CREATE POLICY "Service role can manage all tiers"
  ON pricing_tiers FOR ALL
  USING (true);

DO $$
BEGIN
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

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='products' AND column_name='pricing_tier_id') THEN
    ALTER TABLE products ADD COLUMN pricing_tier_id UUID REFERENCES pricing_tiers(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='products' AND column_name='markup_multiplier') THEN
    ALTER TABLE products ADD COLUMN markup_multiplier DECIMAL(5,2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='products' AND column_name='profit_amount') THEN
    ALTER TABLE products ADD COLUMN profit_amount DECIMAL(10,2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='products' AND column_name='profit_margin_percent') THEN
    ALTER TABLE products ADD COLUMN profit_margin_percent DECIMAL(5,2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='products' AND column_name='is_price_override') THEN
    ALTER TABLE products ADD COLUMN is_price_override BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='products' AND column_name='is_sold_by_dozen') THEN
    ALTER TABLE products ADD COLUMN is_sold_by_dozen BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='products' AND column_name='price_calculated_at') THEN
    ALTER TABLE products ADD COLUMN price_calculated_at TIMESTAMPTZ;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='product_images' AND column_name='cloudfront_url') THEN
    ALTER TABLE product_images ADD COLUMN cloudfront_url TEXT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_pricing_tier ON products(pricing_tier_id);
CREATE INDEX IF NOT EXISTS idx_products_price_override ON products(is_price_override);
CREATE INDEX IF NOT EXISTS idx_products_cost_dubros ON products(cost_dubros);


-- ============================================
-- MIGRATION 12: ERP SYNC JOBS (20251201000000)
-- ============================================

CREATE TABLE IF NOT EXISTS erp_sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  current_step TEXT,
  current_item_count INTEGER DEFAULT 0,
  total_item_count INTEGER,
  sync_type TEXT DEFAULT 'manual' CHECK (sync_type IN ('manual', 'scheduled', 'test')),
  test_limit INTEGER,
  sync_log_id UUID REFERENCES erp_sync_logs(id) ON DELETE CASCADE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  error_details JSONB,
  cancel_requested BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID
);

CREATE INDEX idx_erp_sync_jobs_status ON erp_sync_jobs(status);
CREATE INDEX idx_erp_sync_jobs_created_at ON erp_sync_jobs(created_at DESC);
CREATE INDEX idx_erp_sync_jobs_sync_log_id ON erp_sync_jobs(sync_log_id);

ALTER TABLE erp_sync_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view jobs"
  ON erp_sync_jobs FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage all jobs"
  ON erp_sync_jobs FOR ALL
  USING (true);

ALTER TABLE erp_sync_logs ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES erp_sync_jobs(id);
CREATE INDEX IF NOT EXISTS idx_erp_sync_logs_job_id ON erp_sync_logs(job_id);


-- ============================================
-- MIGRATION 13: GENERALIZE BACKGROUND JOBS (20251208000000)
-- ============================================

CREATE TYPE job_type AS ENUM ('erp_sync', 'pricing_recalculation');

ALTER TABLE erp_sync_jobs RENAME TO background_jobs;

ALTER TABLE background_jobs ADD COLUMN job_type job_type NOT NULL DEFAULT 'erp_sync';
ALTER TABLE background_jobs ADD COLUMN job_params JSONB;

ALTER INDEX idx_erp_sync_jobs_status RENAME TO idx_background_jobs_status;
ALTER INDEX idx_erp_sync_jobs_created_at RENAME TO idx_background_jobs_created_at;
ALTER INDEX idx_erp_sync_jobs_sync_log_id RENAME TO idx_background_jobs_sync_log_id;

CREATE INDEX idx_background_jobs_job_type ON background_jobs(job_type);
CREATE INDEX idx_background_jobs_type_status ON background_jobs(job_type, status);

DROP POLICY IF EXISTS "Anyone can view jobs" ON background_jobs;
DROP POLICY IF EXISTS "Service role can manage all jobs" ON background_jobs;

CREATE POLICY "Anyone can view jobs"
  ON background_jobs FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage all jobs"
  ON background_jobs FOR ALL
  USING (true);

CREATE VIEW erp_sync_jobs AS
  SELECT * FROM background_jobs WHERE job_type = 'erp_sync';


-- ============================================
-- MIGRATION 14: PRICING RECALCULATION LOGS (20251208000001)
-- ============================================

CREATE TABLE IF NOT EXISTS pricing_recalculation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'success', 'partial', 'failed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  total_products INTEGER DEFAULT 0,
  products_updated INTEGER DEFAULT 0,
  products_skipped INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  shipping_cost DECIMAL(10,2),
  pricing_formula INTEGER NOT NULL CHECK (pricing_formula IN (1, 2)),
  respect_overrides BOOLEAN DEFAULT true,
  product_ids JSONB,
  job_id UUID REFERENCES background_jobs(id) ON DELETE CASCADE,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pricing_recalc_logs_status ON pricing_recalculation_logs(status);
CREATE INDEX idx_pricing_recalc_logs_started_at ON pricing_recalculation_logs(started_at DESC);
CREATE INDEX idx_pricing_recalc_logs_job_id ON pricing_recalculation_logs(job_id);
CREATE INDEX idx_pricing_recalc_logs_formula ON pricing_recalculation_logs(pricing_formula);

ALTER TABLE pricing_recalculation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view logs"
  ON pricing_recalculation_logs FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage all logs"
  ON pricing_recalculation_logs FOR ALL
  USING (true);

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


-- ============================================
-- MIGRATION 15: PRICING RECALCULATION ERRORS (20251208000002)
-- ============================================

CREATE TABLE IF NOT EXISTS pricing_recalculation_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id UUID NOT NULL REFERENCES pricing_recalculation_logs(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_sku TEXT,
  error_message TEXT NOT NULL,
  error_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pricing_recalc_errors_log_id ON pricing_recalculation_errors(log_id);
CREATE INDEX idx_pricing_recalc_errors_product_id ON pricing_recalculation_errors(product_id);
CREATE INDEX idx_pricing_recalc_errors_created_at ON pricing_recalculation_errors(created_at DESC);

ALTER TABLE pricing_recalculation_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view errors"
  ON pricing_recalculation_errors FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage all errors"
  ON pricing_recalculation_errors FOR ALL
  USING (true);


-- ============================================
-- MIGRATION 16: CHECKOUT SESSIONS (20251212000000)
-- ============================================

CREATE TABLE IF NOT EXISTS checkout_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL UNIQUE,
  payment_link_code TEXT,
  address_id UUID REFERENCES addresses(id),
  shipping_method TEXT NOT NULL,
  cart_snapshot JSONB NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour',
  completed_at TIMESTAMPTZ,
  CONSTRAINT checkout_sessions_order_number_key UNIQUE (order_number),
  CONSTRAINT checkout_sessions_amount_positive CHECK (amount > 0)
);

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

ALTER TABLE checkout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own checkout sessions"
  ON checkout_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own checkout sessions"
  ON checkout_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checkout sessions"
  ON checkout_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access to checkout sessions"
  ON checkout_sessions
  FOR ALL
  USING (auth.role() = 'service_role');


-- ============================================
-- MIGRATION 17: UNIT PRICE TO CART ITEMS (20260112000000)
-- ============================================

ALTER TABLE cart_items
ADD COLUMN IF NOT EXISTS unit_price NUMERIC(10, 2);


-- ============================================
-- ALL MIGRATIONS COMPLETE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ALL MIGRATIONS COMPLETED SUCCESSFULLY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tables created: 30+';
  RAISE NOTICE 'Enums created: 12';
  RAISE NOTICE 'Indexes created: 60+';
  RAISE NOTICE 'RLS policies created: 50+';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Configure storage bucket for product-images (public)';
  RAISE NOTICE '2. Configure authentication settings';
  RAISE NOTICE '3. Set up email templates (Spanish)';
  RAISE NOTICE '4. Create admin user';
  RAISE NOTICE '========================================';
END $$;
