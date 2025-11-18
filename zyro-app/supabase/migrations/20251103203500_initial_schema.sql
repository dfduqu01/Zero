-- ============================================
-- ZERO E-COMMERCE - INITIAL DATABASE SCHEMA
-- ============================================
-- Migration: 20251103203500_initial_schema.sql
-- Description: Creates all tables, enums, indexes, and RLS policies for ZERO MVP
-- Author: Claude
-- Date: 2025-11-03
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

-- ============================================
-- 1. AUTHENTICATION & USERS
-- ============================================

-- 1.1 Extended user profile (extends auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  country TEXT NOT NULL, -- REQUIRED for international shipping
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 1.2 User addresses
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  country TEXT NOT NULL, -- REQUIRED for shipping calculation
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT NOT NULL,
  state_province TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 2. PRODUCT CATALOG
-- ============================================

-- 2.1 Brands
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.2 Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.3 Frame materials
CREATE TABLE frame_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.4 Frame shapes
CREATE TABLE frame_shapes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.5 Products
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
  lens_width INTEGER, -- mm
  bridge_width INTEGER, -- mm
  temple_length INTEGER, -- mm
  stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
  low_stock_threshold INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.6 Product images
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.7 Lens treatments
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

-- 2.8 Product lens treatments (many-to-many)
CREATE TABLE product_lens_treatments (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  treatment_id UUID NOT NULL REFERENCES lens_treatments(id) ON DELETE CASCADE,
  price_override DECIMAL(10,2), -- NULL means use base_price
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (product_id, treatment_id)
);

-- ============================================
-- 3. SHOPPING CART
-- ============================================
-- Note: Cart data is stored in localStorage for unauthenticated users.
-- Upon registration/login, the cart is transferred from localStorage to the database.

-- 3.1 Cart items
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Login required
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3.2 Cart item prescriptions
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

-- 3.3 Cart item treatments (many-to-many)
CREATE TABLE cart_item_treatments (
  cart_item_id UUID NOT NULL REFERENCES cart_items(id) ON DELETE CASCADE,
  treatment_id UUID NOT NULL REFERENCES lens_treatments(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (cart_item_id, treatment_id)
);

-- ============================================
-- 4. ORDERS & TRANSACTIONS
-- ============================================

-- 4.1 Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT NOT NULL UNIQUE, -- e.g., "ZER-2025-00001"
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL, -- Login required at checkout
  status order_status NOT NULL DEFAULT 'pending',
  shipping_address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
  shipping_address_snapshot JSONB, -- Denormalized for historical accuracy
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

-- 4.2 Order items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL, -- Can be NULL if product deleted
  product_snapshot JSONB NOT NULL, -- Product details at time of order
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.3 Order item prescriptions
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
  validated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Admin who validated
  validated_at TIMESTAMPTZ,
  validation_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.4 Order item treatments (many-to-many with snapshot)
CREATE TABLE order_item_treatments (
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  treatment_id UUID REFERENCES lens_treatments(id) ON DELETE SET NULL, -- Can be NULL if treatment deleted
  treatment_name TEXT NOT NULL, -- Snapshot
  treatment_price DECIMAL(10,2) NOT NULL CHECK (treatment_price >= 0), -- Snapshot
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (order_item_id, treatment_id)
);

-- 4.5 Order status history (audit trail)
CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status order_status,
  to_status order_status NOT NULL,
  changed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Admin who made change
  notes TEXT,
  tracking_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 5. INVENTORY & ERP
-- ============================================

-- 5.1 Inventory movements (audit trail)
CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  movement_type inventory_movement_type NOT NULL,
  quantity_change INTEGER NOT NULL, -- Can be negative
  quantity_after INTEGER NOT NULL CHECK (quantity_after >= 0),
  reference_id UUID, -- order_id or sync_log_id
  reason TEXT,
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL for automated movements
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5.2 ERP sync logs
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

-- 5.3 ERP sync errors
CREATE TABLE erp_sync_errors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sync_log_id UUID NOT NULL REFERENCES erp_sync_logs(id) ON DELETE CASCADE,
  product_sku TEXT,
  error_message TEXT NOT NULL,
  error_details JSONB, -- Flexible structure for error data
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 6. CUSTOMER ENGAGEMENT (P2)
-- ============================================

-- 6.1 Wishlists
CREATE TABLE wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- 6.2 Product reviews
CREATE TABLE product_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE, -- Verify purchase
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  review_text TEXT,
  is_approved BOOLEAN DEFAULT false, -- Admin moderation
  approved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Admin who approved
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 7. SUPPORT & COMMUNICATION
-- ============================================

-- 7.1 Contact submissions
CREATE TABLE contact_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL if not logged in
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  country TEXT NOT NULL, -- REQUIRED
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status contact_status DEFAULT 'pending',
  assigned_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Admin assigned
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- ============================================
-- INDEXES
-- ============================================

-- Users
CREATE INDEX idx_users_country ON users(country);

-- Addresses
CREATE INDEX idx_addresses_user_id ON addresses(user_id);
CREATE INDEX idx_addresses_is_default ON addresses(user_id, is_default) WHERE is_default = true;

-- Products
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_brand_id ON products(brand_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_stock_quantity ON products(stock_quantity);
CREATE INDEX idx_products_category_is_active ON products(category_id, is_active) WHERE is_active = true;

-- Product images
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_is_primary ON product_images(product_id, is_primary) WHERE is_primary = true;

-- Cart items
CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);

-- Orders
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_created_at_status ON orders(created_at DESC, status);

-- Order items
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- Inventory
CREATE INDEX idx_inventory_movements_product_id ON inventory_movements(product_id);
CREATE INDEX idx_inventory_movements_created_at ON inventory_movements(created_at DESC);
CREATE INDEX idx_inventory_movements_reference_id ON inventory_movements(reference_id);

-- ERP Sync
CREATE INDEX idx_erp_sync_logs_created_at ON erp_sync_logs(created_at DESC);
CREATE INDEX idx_erp_sync_logs_status ON erp_sync_logs(status);
CREATE INDEX idx_erp_sync_errors_sync_log_id ON erp_sync_errors(sync_log_id);

-- Wishlists
CREATE INDEX idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX idx_wishlists_product_id ON wishlists(product_id);

-- Product reviews
CREATE INDEX idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX idx_product_reviews_user_id ON product_reviews(user_id);
CREATE INDEX idx_product_reviews_is_approved ON product_reviews(product_id, is_approved) WHERE is_approved = true;

-- Contact submissions
CREATE INDEX idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX idx_contact_submissions_assigned_to ON contact_submissions(assigned_to_user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
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
-- USERS TABLE POLICIES
-- ============================================

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- ============================================
-- ADDRESSES TABLE POLICIES
-- ============================================

-- Users can view their own addresses
CREATE POLICY "Users can view own addresses"
  ON addresses FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own addresses
CREATE POLICY "Users can insert own addresses"
  ON addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own addresses
CREATE POLICY "Users can update own addresses"
  ON addresses FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own addresses
CREATE POLICY "Users can delete own addresses"
  ON addresses FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- PRODUCT CATALOG POLICIES (PUBLIC READ)
-- ============================================

-- Public can read active products
CREATE POLICY "Public can view active products"
  ON products FOR SELECT
  USING (is_active = true);

-- Admins can manage all products
CREATE POLICY "Admins can manage products"
  ON products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Public can read brands
CREATE POLICY "Public can view brands"
  ON brands FOR SELECT
  USING (true);

-- Public can read categories
CREATE POLICY "Public can view categories"
  ON categories FOR SELECT
  USING (true);

-- Public can read frame materials
CREATE POLICY "Public can view frame_materials"
  ON frame_materials FOR SELECT
  USING (true);

-- Public can read frame shapes
CREATE POLICY "Public can view frame_shapes"
  ON frame_shapes FOR SELECT
  USING (true);

-- Public can read product images
CREATE POLICY "Public can view product_images"
  ON product_images FOR SELECT
  USING (true);

-- Public can read active lens treatments
CREATE POLICY "Public can view active lens_treatments"
  ON lens_treatments FOR SELECT
  USING (is_active = true);

-- Public can read product lens treatments
CREATE POLICY "Public can view product_lens_treatments"
  ON product_lens_treatments FOR SELECT
  USING (true);

-- Admins can manage catalog tables
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
-- SHOPPING CART POLICIES
-- ============================================

-- Users can view their own cart items
CREATE POLICY "Users can view own cart_items"
  ON cart_items FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own cart items
CREATE POLICY "Users can insert own cart_items"
  ON cart_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own cart items
CREATE POLICY "Users can update own cart_items"
  ON cart_items FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own cart items
CREATE POLICY "Users can delete own cart_items"
  ON cart_items FOR DELETE
  USING (auth.uid() = user_id);

-- Users can manage prescriptions for their cart items
CREATE POLICY "Users can manage own cart_item_prescriptions"
  ON cart_item_prescriptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM cart_items
      WHERE cart_items.id = cart_item_prescriptions.cart_item_id
      AND cart_items.user_id = auth.uid()
    )
  );

-- Users can manage treatments for their cart items
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
-- ORDERS POLICIES
-- ============================================

-- Users can view their own orders
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create orders (login required)
CREATE POLICY "Users can create orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all orders
CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Admins can update orders
CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Users can view their own order items
CREATE POLICY "Users can view own order_items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Admins can view all order items
CREATE POLICY "Admins can view all order_items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Users can view their own order prescriptions
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

-- Admins can manage order prescriptions
CREATE POLICY "Admins can manage order_item_prescriptions"
  ON order_item_prescriptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Users can view their order treatments
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

-- Admins can view all order treatments
CREATE POLICY "Admins can view all order_item_treatments"
  ON order_item_treatments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Users can view their order status history
CREATE POLICY "Users can view own order_status_history"
  ON order_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_status_history.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Admins can manage order status history
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
-- INVENTORY & ERP POLICIES (ADMIN ONLY)
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
-- CUSTOMER ENGAGEMENT POLICIES (P2)
-- ============================================

-- Wishlists
CREATE POLICY "Users can manage own wishlists"
  ON wishlists FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Product reviews
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
-- CONTACT SUBMISSIONS POLICIES
-- ============================================

-- Anyone can create contact submissions
CREATE POLICY "Anyone can create contact_submissions"
  ON contact_submissions FOR INSERT
  WITH CHECK (true);

-- Users can view their own contact submissions
CREATE POLICY "Users can view own contact_submissions"
  ON contact_submissions FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can manage all contact submissions
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

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
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
-- MIGRATION COMPLETE
-- ============================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Migration 20251103203500_initial_schema.sql completed successfully';
  RAISE NOTICE 'Created: 23 tables, 7 enums, 40+ indexes, 50+ RLS policies';
  RAISE NOTICE 'Next step: Run seed data migration';
END $$;
