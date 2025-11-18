# ZERO E-COMMERCE - DATABASE SCHEMA WITH MOCK DATA

**Version**: 2.0
**Date**: November 7, 2025 (Major Update)
**Database**: Supabase (PostgreSQL)
**Purpose**: Complete database schema visualization for ZERO MVP

**Recent Updates**:
- ✨ **Prescription System Restructure** (November 7, 2025)
  - **NEW**: 4 admin-editable tables for complete flexibility:
    - `prescription_types` - Prescription categories (Single Vision, Progressive, Non-Prescription)
    - `lens_types` - Lens materials/features (replaces and extends lens_treatments)
    - `lens_indexes` - Lens thickness options (1.50, 1.60, 1.67, 1.74)
    - `view_areas` - Progressive lens view areas (Standard, 40% Broader)
  - Added foreign key columns to `cart_item_prescriptions` and `order_item_prescriptions`
  - All pricing now admin-editable through tables (not hardcoded)
  - RLS policies added for all new tables
  - Migration: `20251107000000_restructure_prescription_system.sql`
  - **DEPRECATED**: Old `lens_options` and `lens_treatments` tables (marked for cleanup)
- Enhanced Prescription System (November 6, 2025) - **SUPERSEDED**
- Removed guest checkout fields (November 3, 2025)
- Added order creation INSERT policies (November 4, 2025)

---

## Table of Contents

1. [Authentication & Users](#1-authentication--users)
2. [Product Catalog](#2-product-catalog)
3. [Shopping Cart](#3-shopping-cart)
4. [Orders & Transactions](#4-orders--transactions)
5. [Inventory & ERP](#5-inventory--erp)
6. [Customer Engagement (P2)](#6-customer-engagement-p2)
7. [Support & Communication](#7-support--communication)
8. [Relationships Summary](#8-relationships-summary)

---

## 1. Authentication & Users

### 1.1 `auth.users` (Managed by Supabase Auth)

**Description**: Supabase's internal authentication table. Managed automatically by Supabase Auth system.

| id | email | encrypted_password | email_confirmed_at | created_at | last_sign_in_at | role |
|----|-------|-------------------|-------------------|------------|----------------|------|
| a1b2c3d4-... | juan.perez@email.com | [encrypted] | 2025-10-15 10:30:00 | 2025-10-15 10:30:00 | 2025-11-01 14:20:00 | authenticated |
| e5f6g7h8-... | maria.garcia@email.com | [encrypted] | 2025-10-20 11:15:00 | 2025-10-20 11:15:00 | 2025-11-02 09:45:00 | authenticated |
| i9j0k1l2-... | admin@zero.com | [encrypted] | 2025-09-01 08:00:00 | 2025-09-01 08:00:00 | 2025-11-02 08:30:00 | authenticated |

**Note**: We don't modify this table directly. Supabase manages it.

---

### 1.2 `public.users`

**Description**: Extended user profile information linked to Supabase Auth users.

**Fields**:
- `id` (UUID, PRIMARY KEY, FK to auth.users.id)
- `name` (TEXT, NOT NULL)
- `phone` (TEXT, NOT NULL)
- `country` (TEXT, NOT NULL) - **REQUIRED for international shipping**
- `is_admin` (BOOLEAN, DEFAULT false)
- `created_at` (TIMESTAMPTZ, DEFAULT now())
- `updated_at` (TIMESTAMPTZ, DEFAULT now())

| id | name | phone | country | is_admin | created_at | updated_at |
|----|------|-------|---------|----------|------------|------------|
| a1b2c3d4-... | Juan Pérez | +52 55 1234 5678 | México | false | 2025-10-15 10:30:00 | 2025-10-15 10:30:00 |
| e5f6g7h8-... | María García | +57 1 234 5678 | Colombia | false | 2025-10-20 11:15:00 | 2025-10-20 11:15:00 |
| i9j0k1l2-... | Admin User | +52 55 9876 5432 | México | true | 2025-09-01 08:00:00 | 2025-09-01 08:00:00 |

---

### 1.3 `addresses`

**Description**: Reusable shipping addresses for registered users.

**Fields**:
- `id` (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- `user_id` (UUID, NOT NULL, FK to users.id)
- `full_name` (TEXT, NOT NULL)
- `phone` (TEXT, NOT NULL)
- `country` (TEXT, NOT NULL) - **REQUIRED for shipping calculation**
- `address_line_1` (TEXT, NOT NULL)
- `address_line_2` (TEXT)
- `city` (TEXT, NOT NULL)
- `state_province` (TEXT, NOT NULL)
- `postal_code` (TEXT, NOT NULL)
- `is_default` (BOOLEAN, DEFAULT false)
- `created_at` (TIMESTAMPTZ, DEFAULT now())
- `updated_at` (TIMESTAMPTZ, DEFAULT now())

| id | user_id | full_name | phone | country | address_line_1 | address_line_2 | city | state_province | postal_code | is_default | created_at |
|----|---------|-----------|-------|---------|----------------|----------------|------|----------------|-------------|------------|------------|
| addr-001 | a1b2c3d4-... | Juan Pérez | +52 55 1234 5678 | México | Av. Reforma 123 | Piso 4, Depto 402 | Ciudad de México | CDMX | 06600 | true | 2025-10-15 10:35:00 |
| addr-002 | e5f6g7h8-... | María García | +57 1 234 5678 | Colombia | Calle 72 # 10-51 | Apartamento 301 | Bogotá | Cundinamarca | 110221 | true | 2025-10-20 11:20:00 |
| addr-003 | a1b2c3d4-... | Juan Pérez (Oficina) | +52 55 1234 5678 | México | Polanco 456 | NULL | Ciudad de México | CDMX | 11560 | false | 2025-10-25 15:00:00 |

---

## 2. Product Catalog

### 2.1 `brands`

**Description**: Product brands (e.g., Ray-Ban, Oakley).

**Fields**:
- `id` (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- `name` (TEXT, NOT NULL, UNIQUE)
- `slug` (TEXT, NOT NULL, UNIQUE)
- `logo_url` (TEXT)
- `created_at` (TIMESTAMPTZ, DEFAULT now())

| id | name | slug | logo_url | created_at |
|----|------|------|----------|------------|
| brand-001 | Ray-Ban | ray-ban | https://storage.../rayban-logo.png | 2025-09-01 10:00:00 |
| brand-002 | Oakley | oakley | https://storage.../oakley-logo.png | 2025-09-01 10:00:00 |
| brand-003 | Persol | persol | https://storage.../persol-logo.png | 2025-09-01 10:00:00 |
| brand-004 | ZERO Signature | zero-signature | https://storage.../zero-logo.png | 2025-09-01 10:00:00 |

---

### 2.2 `categories`

**Description**: Product categories (e.g., Gafas de Sol, Gafas con Receta).

**Fields**:
- `id` (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- `name` (TEXT, NOT NULL)
- `slug` (TEXT, NOT NULL, UNIQUE)
- `description` (TEXT)
- `display_order` (INTEGER, DEFAULT 0)
- `created_at` (TIMESTAMPTZ, DEFAULT now())

| id | name | slug | description | display_order | created_at |
|----|------|------|-------------|---------------|------------|
| cat-001 | Gafas de Sol | gafas-de-sol | Protección UV y estilo | 1 | 2025-09-01 10:00:00 |
| cat-002 | Gafas con Receta | gafas-con-receta | Lentes graduados para tu vista | 2 | 2025-09-01 10:00:00 |

---

### 2.3 `frame_materials`

**Description**: Frame material options (acetate, metal, titanium, etc.).

**Fields**:
- `id` (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- `name` (TEXT, NOT NULL, UNIQUE)
- `created_at` (TIMESTAMPTZ, DEFAULT now())

| id | name | created_at |
|----|------|------------|
| mat-001 | Acetato | 2025-09-01 10:00:00 |
| mat-002 | Metal | 2025-09-01 10:00:00 |
| mat-003 | Titanio | 2025-09-01 10:00:00 |
| mat-004 | Plástico | 2025-09-01 10:00:00 |

---

### 2.4 `frame_shapes`

**Description**: Frame shape options (round, square, aviator, cat-eye, etc.).

**Fields**:
- `id` (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- `name` (TEXT, NOT NULL, UNIQUE)
- `created_at` (TIMESTAMPTZ, DEFAULT now())

| id | name | created_at |
|----|------|------------|
| shape-001 | Redondo | 2025-09-01 10:00:00 |
| shape-002 | Cuadrado | 2025-09-01 10:00:00 |
| shape-003 | Aviador | 2025-09-01 10:00:00 |
| shape-004 | Ojo de Gato | 2025-09-01 10:00:00 |
| shape-005 | Wayfarer | 2025-09-01 10:00:00 |

---

### 2.5 `products`

**Description**: Core product information for eyewear.

**Fields**:
- `id` (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- `sku` (TEXT, NOT NULL, UNIQUE)
- `name` (TEXT, NOT NULL)
- `description` (TEXT)
- `price` (DECIMAL(10,2), NOT NULL) - USD
- `brand_id` (UUID, NOT NULL, FK to brands.id)
- `category_id` (UUID, FK to categories.id)
- `frame_material_id` (UUID, FK to frame_materials.id)
- `frame_shape_id` (UUID, FK to frame_shapes.id)
- `lens_width` (INTEGER) - mm
- `bridge_width` (INTEGER) - mm
- `temple_length` (INTEGER) - mm
- `stock_quantity` (INTEGER, DEFAULT 0)
- `low_stock_threshold` (INTEGER, DEFAULT 5)
- `is_active` (BOOLEAN, DEFAULT true)
- `created_at` (TIMESTAMPTZ, DEFAULT now())
- `updated_at` (TIMESTAMPTZ, DEFAULT now())

| id | sku | name | description | price | brand_id | category_id | frame_material_id | frame_shape_id | lens_width | bridge_width | temple_length | stock_quantity | low_stock_threshold | is_active | created_at |
|----|-----|------|-------------|-------|----------|-------------|-------------------|----------------|------------|--------------|---------------|----------------|---------------------|-----------|------------|
| prod-001 | RB-3025-001 | Ray-Ban Aviator Classic | Icónicas gafas de sol aviador con lentes de cristal | 159.99 | brand-001 | cat-001 | mat-002 | shape-003 | 58 | 14 | 135 | 45 | 5 | true | 2025-09-15 |
| prod-002 | OAK-9208-920801 | Oakley Radar EV Path | Gafas deportivas de alto rendimiento | 189.99 | brand-002 | cat-001 | mat-004 | shape-002 | 138 | 0 | 128 | 12 | 5 | true | 2025-09-15 |
| prod-003 | ZERO-001 | ZERO Signature Acetato | Diseño exclusivo en acetato premium | 129.99 | brand-004 | cat-002 | mat-001 | shape-005 | 52 | 18 | 145 | 3 | 5 | true | 2025-09-20 |
| prod-004 | RB-5154-2000 | Ray-Ban Clubmaster Optic | Monturas clásicas para lentes graduados | 145.00 | brand-001 | cat-002 | mat-001 | shape-002 | 49 | 21 | 140 | 0 | 5 | false | 2025-09-15 |

---

### 2.6 `product_images`

**Description**: Multiple images per product (gallery).

**Fields**:
- `id` (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- `product_id` (UUID, NOT NULL, FK to products.id, ON DELETE CASCADE)
- `image_url` (TEXT, NOT NULL) - Supabase Storage URL
- `display_order` (INTEGER, DEFAULT 0)
- `is_primary` (BOOLEAN, DEFAULT false)
- `created_at` (TIMESTAMPTZ, DEFAULT now())

| id | product_id | image_url | display_order | is_primary | created_at |
|----|------------|-----------|---------------|------------|------------|
| img-001 | prod-001 | https://storage.../rayban-aviator-front.jpg | 1 | true | 2025-09-15 12:00:00 |
| img-002 | prod-001 | https://storage.../rayban-aviator-side.jpg | 2 | false | 2025-09-15 12:00:00 |
| img-003 | prod-001 | https://storage.../rayban-aviator-angle.jpg | 3 | false | 2025-09-15 12:00:00 |
| img-004 | prod-002 | https://storage.../oakley-radar-front.jpg | 1 | true | 2025-09-15 12:05:00 |
| img-005 | prod-002 | https://storage.../oakley-radar-side.jpg | 2 | false | 2025-09-15 12:05:00 |
| img-006 | prod-003 | https://storage.../zero-signature-front.jpg | 1 | true | 2025-09-20 10:00:00 |

---

### 2.7 `prescription_types` ✨ NEW (Nov 7, 2025)

**Description**: Admin-editable prescription categories. Replaces hardcoded enum values.

**Fields**:
- `id` (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- `name` (VARCHAR(100), NOT NULL, UNIQUE)
- `slug` (VARCHAR(100), NOT NULL, UNIQUE)
- `description` (TEXT)
- `is_active` (BOOLEAN, DEFAULT true)
- `display_order` (INTEGER, DEFAULT 0)
- `created_at` (TIMESTAMPTZ, DEFAULT now())
- `updated_at` (TIMESTAMPTZ, DEFAULT now())

| id | name | slug | description | is_active | display_order | created_at |
|----|------|------|-------------|-----------|---------------|------------|
| ptype-001 | Single Vision | single-vision | One field of vision (near or distance) | true | 1 | 2025-11-07 |
| ptype-002 | Progressive | progressive | Multiple vision zones in one lens | true | 2 | 2025-11-07 |
| ptype-003 | Non-Prescription | non-prescription | Cosmetic or protective use only | true | 3 | 2025-11-07 |

**RLS Policies**:
- Public can SELECT active types
- Admins can manage all types

---

### 2.8 `lens_types` ✨ NEW (Nov 7, 2025)

**Description**: Admin-editable lens materials/features. Replaces and extends old lens_treatments table.

**Fields**:
- `id` (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- `name` (VARCHAR(100), NOT NULL, UNIQUE)
- `slug` (VARCHAR(100), NOT NULL, UNIQUE)
- `description` (TEXT)
- `price_modifier` (DECIMAL(10,2), DEFAULT 0.00) - USD
- `is_active` (BOOLEAN, DEFAULT true)
- `display_order` (INTEGER, DEFAULT 0)
- `applies_to_without_rx` (BOOLEAN, DEFAULT false) - Can be used for Frame Only flow
- `applies_to_with_rx` (BOOLEAN, DEFAULT false) - Can be used for Prescription flow
- `created_at` (TIMESTAMPTZ, DEFAULT now())
- `updated_at` (TIMESTAMPTZ, DEFAULT now())

| id | name | slug | description | price_modifier | applies_to_without_rx | applies_to_with_rx | is_active | display_order |
|----|------|------|-------------|----------------|----------------------|--------------------|-----------|---------------|
| ltype-001 | Frame Only (Demo Lenses) | frame-only | Solo el marco, sin lentes incluidos | 0.00 | true | false | true | 1 |
| ltype-002 | Blue Light Block | blue-light-block | Protects eyes from digital screens | 25.00 | true | true | true | 2 |
| ltype-003 | Standard Clear Lenses | standard-clear | Everyday transparent lenses | 15.00 | true | true | true | 3 |
| ltype-004 | Photochromatic | photochromatic | Automatically darkens in sunlight | 89.99 | true | true | true | 4 |
| ltype-005 | Anti-Reflective Coating | anti-reflective | Reduces glare and improves visual clarity | 49.99 | false | true | true | 5 |
| ltype-006 | UV Protection | uv-protection | 100% UV ray protection | 29.99 | false | true | true | 6 |

**RLS Policies**:
- Public can SELECT active types
- Admins can manage all types

---

### 2.9 `lens_indexes` ✨ NEW (Nov 7, 2025)

**Description**: Admin-editable lens thickness options for prescription lenses.

**Fields**:
- `id` (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- `name` (VARCHAR(100), NOT NULL, UNIQUE)
- `slug` (VARCHAR(100), NOT NULL, UNIQUE)
- `index_value` (VARCHAR(10), NOT NULL) - '1.50', '1.60', '1.67', '1.74'
- `description` (TEXT)
- `price_modifier` (DECIMAL(10,2), DEFAULT 0.00) - USD
- `is_active` (BOOLEAN, DEFAULT true)
- `display_order` (INTEGER, DEFAULT 0)
- `created_at` (TIMESTAMPTZ, DEFAULT now())
- `updated_at` (TIMESTAMPTZ, DEFAULT now())

| id | name | slug | index_value | description | price_modifier | is_active | display_order |
|----|------|------|-------------|-------------|----------------|-----------|---------------|
| lidx-001 | Mid-Index (1.50) | mid-index-150 | 1.50 | Standard plastic lens | 0.00 | true | 1 |
| lidx-002 | High-Index (1.60) | high-index-160 | 1.60 | 20% thinner and lighter | 50.00 | true | 2 |
| lidx-003 | Ultra-Thin (1.67) | ultra-thin-167 | 1.67 | 30% thinner - Coming soon | 100.00 | false | 3 |
| lidx-004 | Ultra-Thin Plus (1.74) | ultra-thin-plus-174 | 1.74 | 40% thinner - Coming soon | 150.00 | false | 4 |

**RLS Policies**:
- Public can SELECT active indexes
- Admins can manage all indexes

---

### 2.10 `view_areas` ✨ NEW (Nov 7, 2025)

**Description**: Admin-editable progressive lens view area options.

**Fields**:
- `id` (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- `name` (VARCHAR(100), NOT NULL, UNIQUE)
- `slug` (VARCHAR(100), NOT NULL, UNIQUE)
- `description` (TEXT)
- `price_modifier` (DECIMAL(10,2), DEFAULT 0.00) - USD
- `is_active` (BOOLEAN, DEFAULT true)
- `display_order` (INTEGER, DEFAULT 0)
- `created_at` (TIMESTAMPTZ, DEFAULT now())
- `updated_at` (TIMESTAMPTZ, DEFAULT now())

| id | name | slug | description | price_modifier | is_active | display_order |
|----|------|------|-------------|----------------|-----------|---------------|
| view-001 | Standard View | standard-view | Traditional progressive corridor | 0.00 | true | 1 |
| view-002 | 40% Broader View | broader-view-40 | Wider zones for computer work | 75.00 | true | 2 |

**RLS Policies**:
- Public can SELECT active view areas
- Admins can manage all view areas

---

### 2.11 `lens_treatments` ⚠️ DEPRECATED (Legacy)

**Status**: Marked for cleanup. Functionality merged into `lens_types` table.

**Description**: Optional lens treatment options (photochromatic, AR coating, etc.). **Use lens_types instead.**

**Fields**:
- `id` (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- `name` (TEXT, NOT NULL)
- `description` (TEXT)
- `base_price` (DECIMAL(10,2), NOT NULL) - USD
- `is_active` (BOOLEAN, DEFAULT true)
- `display_order` (INTEGER, DEFAULT 0)
- `created_at` (TIMESTAMPTZ, DEFAULT now())

---

### 2.12 `lens_options` ⚠️ DEPRECATED (Legacy)

**Status**: Marked for cleanup. Replaced by separate prescription_types, lens_types, lens_indexes, and view_areas tables.

**Description**: Old lens configuration table. **Use new tables instead.**

---

### 2.13 `product_lens_treatments` ⚠️ DEPRECATED (Legacy Join Table)

**Description**: Many-to-many relationship between products and lens treatments with optional price override.

**Fields**:
- `product_id` (UUID, NOT NULL, FK to products.id, ON DELETE CASCADE)
- `treatment_id` (UUID, NOT NULL, FK to lens_treatments.id, ON DELETE CASCADE)
- `price_override` (DECIMAL(10,2)) - NULL means use base_price
- `created_at` (TIMESTAMPTZ, DEFAULT now())
- PRIMARY KEY (product_id, treatment_id)

| product_id | treatment_id | price_override | created_at |
|------------|--------------|----------------|------------|
| prod-001 | treat-001 | NULL | 2025-09-15 |
| prod-001 | treat-004 | NULL | 2025-09-15 |
| prod-002 | treat-003 | NULL | 2025-09-15 |
| prod-003 | treat-001 | 79.99 | 2025-09-20 |
| prod-003 | treat-002 | NULL | 2025-09-20 |
| prod-003 | treat-003 | NULL | 2025-09-20 |
| prod-003 | treat-004 | NULL | 2025-09-20 |

---

## 3. Shopping Cart

### Cart Persistence Strategy
- **Unauthenticated Users**: Cart stored in browser localStorage (not in database)
- **Authenticated Users**: Cart stored in database (cart_items table)
- **Registration/Login Flow**: localStorage cart automatically transfers to database
- **Cart Transfer**: Automatic sync from localStorage to database upon successful authentication

### 3.1 `cart_items`

**Description**: Shopping cart entries for logged-in users only. Unauthenticated users store cart data in browser localStorage.

**Fields**:
- `id` (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- `user_id` (UUID, NOT NULL, FK to users.id, ON DELETE CASCADE) - Login required
- `product_id` (UUID, NOT NULL, FK to products.id)
- `quantity` (INTEGER, NOT NULL, DEFAULT 1)
- `created_at` (TIMESTAMPTZ, DEFAULT now())

| id | user_id | product_id | quantity | created_at |
|----|---------|------------|----------|------------|
| cart-001 | a1b2c3d4-... | prod-001 | 1 | 2025-11-01 14:30:00 |
| cart-002 | a1b2c3d4-... | prod-003 | 1 | 2025-11-01 14:35:00 |

---

### 3.2 `cart_item_prescriptions` ✨ ENHANCED (Nov 6, 2025)

**Description**: Prescription data associated with cart items with enhanced configuration options.

**Fields**:
- `id` (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- `cart_item_id` (UUID, NOT NULL, UNIQUE, FK to cart_items.id, ON DELETE CASCADE)
- `has_prescription` (BOOLEAN, DEFAULT false) - Legacy field

**✨ Enhanced Prescription Fields (Nov 6, 2025)**:
- `prescription_type` (prescription_type_enum, **REQUIRED**) - 'without_rx', 'single_vision', 'progressive'
- `without_rx_type` (without_rx_type_enum) - 'frame_only', 'blue_block', 'standard_eyeglasses'
- `single_vision_type` (single_vision_type_enum) - 'near', 'intermediate', 'distance'
- `lens_index` (lens_index_enum) - '1.50', '1.60', '1.67', '1.74'
- `progressive_view_area` (progressive_view_area_enum) - 'standard', 'broader_40'
- `prescription_image_uploaded_at` (TIMESTAMPTZ) - Timestamp of image upload

**Original Prescription Formula Fields**:
- `od_sph` (DECIMAL(5,2)) - Right eye sphere (-20.00 to +20.00)
- `od_cyl` (DECIMAL(5,2)) - Right eye cylinder (-4.00 to +4.00)
- `od_axis` (INTEGER) - Right eye axis (0-180)
- `os_sph` (DECIMAL(5,2)) - Left eye sphere
- `os_cyl` (DECIMAL(5,2)) - Left eye cylinder
- `os_axis` (INTEGER) - Left eye axis
- `pd` (DECIMAL(4,1)) - Pupillary distance (20.0-80.0)
- `pd_dual_od` (DECIMAL(4,1)) - Dual PD right eye
- `pd_dual_os` (DECIMAL(4,1)) - Dual PD left eye
- `add_value` (DECIMAL(3,2)) - For progressive lenses
- `prescription_image_url` (TEXT) - Supabase Storage URL or base64
- `created_at` (TIMESTAMPTZ, DEFAULT now())

**CHECK Constraints**:
- `prescription_type` is REQUIRED
- If `prescription_type` = 'without_rx' → `without_rx_type` is REQUIRED
- If `prescription_type` = 'single_vision' → `single_vision_type` and `lens_index` are REQUIRED
- If `prescription_type` = 'progressive' → `lens_index` and `progressive_view_area` are REQUIRED
- If `prescription_type` != 'without_rx' → Formula OR image is REQUIRED

| id | cart_item_id | has_prescription | od_sph | od_cyl | od_axis | os_sph | os_cyl | os_axis | pd | pd_dual_od | pd_dual_os | add_value | prescription_image_url | created_at |
|----|--------------|------------------|--------|--------|---------|--------|--------|---------|----|-----------|-----------|-----------|-----------------------|------------|
| presc-001 | cart-002 | true | -2.50 | -0.75 | 180 | -2.25 | -0.50 | 175 | 63.0 | NULL | NULL | NULL | https://storage.../prescriptions/user1_presc.pdf | 2025-11-01 14:40:00 |

---

### 3.3 `cart_item_treatments` (Join Table)

**Description**: Selected lens treatments for cart items.

**Fields**:
- `cart_item_id` (UUID, NOT NULL, FK to cart_items.id, ON DELETE CASCADE)
- `treatment_id` (UUID, NOT NULL, FK to lens_treatments.id)
- `created_at` (TIMESTAMPTZ, DEFAULT now())
- PRIMARY KEY (cart_item_id, treatment_id)

| cart_item_id | treatment_id | created_at |
|--------------|--------------|------------|
| cart-002 | treat-001 | 2025-11-01 14:42:00 |
| cart-002 | treat-002 | 2025-11-01 14:42:00 |
| cart-003 | treat-003 | 2025-11-02 10:05:00 |

---

## 4. Orders & Transactions

### 4.1 `orders`

**Description**: Main order records for registered users. Login required at checkout.

**Fields**:
- `id` (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- `order_number` (TEXT, NOT NULL, UNIQUE) - Display-friendly (e.g., "ZERO-2025-00123")
- `user_id` (UUID, NOT NULL, FK to users.id) - Login required at checkout
- `status` (TEXT, NOT NULL) - ENUM: 'pending', 'processing', 'shipped', 'delivered', 'cancelled'
- `shipping_address_id` (UUID, FK to addresses.id)
- `shipping_address_snapshot` (JSONB) - Denormalized address for historical accuracy
- `shipping_method` (TEXT)
- `shipping_cost` (DECIMAL(10,2), NOT NULL)
- `subtotal` (DECIMAL(10,2), NOT NULL)
- `treatments_cost` (DECIMAL(10,2), DEFAULT 0)
- `total` (DECIMAL(10,2), NOT NULL)
- `payment_method` (TEXT)
- `payment_status` (TEXT) - ENUM: 'pending', 'completed', 'failed', 'refunded'
- `payment_transaction_id` (TEXT)
- `tracking_number` (TEXT)
- `tracking_carrier` (TEXT)
- `estimated_delivery_date` (DATE)
- `created_at` (TIMESTAMPTZ, DEFAULT now())
- `updated_at` (TIMESTAMPTZ, DEFAULT now())

| id | order_number | user_id | status | shipping_address_id | shipping_address_snapshot | shipping_method | shipping_cost | subtotal | treatments_cost | total | payment_method | payment_status | payment_transaction_id | tracking_number | tracking_carrier | estimated_delivery_date | created_at |
|----|--------------|---------|--------|---------------------|---------------------------|-----------------|---------------|----------|-----------------|-------|----------------|----------------|------------------------|-----------------|------------------|------------------------|------------|
| order-001 | ZERO-2025-00001 | a1b2c3d4-... | delivered | addr-001 | {"full_name":"Juan Pérez","country":"México","address_line_1":"Av. Reforma 123"...} | Envío Express | 15.00 | 289.98 | 139.98 | 444.96 | PagueloFacil | completed | TXN-ABC123 | 1Z999AA10123456784 | UPS | 2025-10-22 | 2025-10-18 15:00:00 |
| order-002 | ZERO-2025-00002 | e5f6g7h8-... | shipped | addr-002 | {"full_name":"María García","country":"Colombia","address_line_1":"Calle 72"...} | Envío Estándar | 12.00 | 189.99 | 39.99 | 241.98 | PagueloFacil | completed | TXN-DEF456 | 2Z999BB20234567895 | FedEx | 2025-11-05 | 2025-10-30 10:30:00 |

---

### 4.2 `order_items`

**Description**: Line items within orders (products ordered).

**Fields**:
- `id` (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- `order_id` (UUID, NOT NULL, FK to orders.id, ON DELETE CASCADE)
- `product_id` (UUID, FK to products.id) - Can be NULL if product deleted
- `product_snapshot` (JSONB, NOT NULL) - Product details at time of order
- `quantity` (INTEGER, NOT NULL)
- `unit_price` (DECIMAL(10,2), NOT NULL)
- `subtotal` (DECIMAL(10,2), NOT NULL)
- `created_at` (TIMESTAMPTZ, DEFAULT now())

| id | order_id | product_id | product_snapshot | quantity | unit_price | subtotal | created_at |
|----|----------|------------|------------------|----------|------------|----------|------------|
| oi-001 | order-001 | prod-001 | {"sku":"RB-3025-001","name":"Ray-Ban Aviator Classic","brand":"Ray-Ban","price":159.99} | 1 | 159.99 | 159.99 | 2025-10-18 15:00:00 |
| oi-002 | order-001 | prod-003 | {"sku":"ZERO-001","name":"ZERO Signature Acetato","brand":"ZERO Signature","price":129.99} | 1 | 129.99 | 129.99 | 2025-10-18 15:00:00 |
| oi-003 | order-002 | prod-002 | {"sku":"OAK-9208-920801","name":"Oakley Radar EV Path","brand":"Oakley","price":189.99} | 1 | 189.99 | 189.99 | 2025-10-30 10:30:00 |
| oi-004 | order-003 | prod-001 | {"sku":"RB-3025-001","name":"Ray-Ban Aviator Classic","brand":"Ray-Ban","price":159.99} | 1 | 159.99 | 159.99 | 2025-11-01 16:45:00 |

---

### 4.3 `order_item_prescriptions` ✨ ENHANCED (Nov 6, 2025)

**Description**: Prescription data snapshot for order items (immutable after order creation).

**Fields**:
- `id` (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- `order_item_id` (UUID, NOT NULL, UNIQUE, FK to order_items.id, ON DELETE CASCADE)
- `has_prescription` (BOOLEAN, DEFAULT false) - Legacy field

**✨ Enhanced Prescription Fields (Nov 6, 2025)**:
- `prescription_type` (prescription_type_enum, **REQUIRED**) - 'without_rx', 'single_vision', 'progressive'
- `without_rx_type` (without_rx_type_enum) - 'frame_only', 'blue_block', 'standard_eyeglasses'
- `single_vision_type` (single_vision_type_enum) - 'near', 'intermediate', 'distance'
- `lens_index` (lens_index_enum) - '1.50', '1.60', '1.67', '1.74'
- `progressive_view_area` (progressive_view_area_enum) - 'standard', 'broader_40'
- `prescription_image_uploaded_at` (TIMESTAMPTZ) - Timestamp of image upload

**Original Prescription Formula Fields**:
- `od_sph` (DECIMAL(5,2)) - Right eye sphere
- `od_cyl` (DECIMAL(5,2)) - Right eye cylinder
- `od_axis` (INTEGER) - Right eye axis
- `os_sph` (DECIMAL(5,2)) - Left eye sphere
- `os_cyl` (DECIMAL(5,2)) - Left eye cylinder
- `os_axis` (INTEGER) - Left eye axis
- `pd` (DECIMAL(4,1)) - Pupillary distance
- `pd_dual_od` (DECIMAL(4,1)) - Dual PD right eye
- `pd_dual_os` (DECIMAL(4,1)) - Dual PD left eye
- `add_value` (DECIMAL(3,2)) - For progressive lenses
- `prescription_image_url` (TEXT) - Supabase Storage URL

**Validation Fields** (for admin review):
- `validation_status` (prescription_validation_status) - ENUM: 'pending', 'approved', 'rejected'
- `validated_by_user_id` (UUID, FK to users.id) - Admin who validated
- `validated_at` (TIMESTAMPTZ)
- `validation_notes` (TEXT)
- `created_at` (TIMESTAMPTZ, DEFAULT now())

| id | order_item_id | has_prescription | od_sph | od_cyl | od_axis | os_sph | os_cyl | os_axis | pd | pd_dual_od | pd_dual_os | add_value | prescription_image_url | validation_status | validated_by_user_id | validated_at | validation_notes | created_at |
|----|---------------|------------------|--------|--------|---------|--------|--------|---------|----|-----------|-----------|-----------|-----------------------|-------------------|----------------------|--------------|------------------|------------|
| oip-001 | oi-002 | true | -2.50 | -0.75 | 180 | -2.25 | -0.50 | 175 | 63.0 | NULL | NULL | NULL | https://storage.../prescriptions/order_001_item_002.pdf | approved | i9j0k1l2-... | 2025-10-19 09:00:00 | Prescription verified and approved | 2025-10-18 15:00:00 |
| oip-002 | oi-003 | false | NULL | NULL | NULL | NULL | NULL | NULL | NULL | NULL | NULL | NULL | NULL | pending | NULL | NULL | NULL | 2025-10-30 10:30:00 |

---

### 4.4 `order_item_treatments` (Join Table)

**Description**: Snapshot of selected treatments for order items.

**Fields**:
- `order_item_id` (UUID, NOT NULL, FK to order_items.id, ON DELETE CASCADE)
- `treatment_id` (UUID, FK to lens_treatments.id) - Can be NULL if treatment deleted
- `treatment_name` (TEXT, NOT NULL) - Snapshot
- `treatment_price` (DECIMAL(10,2), NOT NULL) - Snapshot
- `created_at` (TIMESTAMPTZ, DEFAULT now())
- PRIMARY KEY (order_item_id, treatment_id)

| order_item_id | treatment_id | treatment_name | treatment_price | created_at |
|---------------|--------------|----------------|-----------------|------------|
| oi-002 | treat-001 | Fotocromático | 79.99 | 2025-10-18 15:00:00 |
| oi-002 | treat-002 | Anti-Reflejo | 49.99 | 2025-10-18 15:00:00 |
| oi-003 | treat-003 | Bloqueo Luz Azul | 39.99 | 2025-10-30 10:30:00 |

---

### 4.5 `order_status_history`

**Description**: Audit trail of all order status changes.

**Fields**:
- `id` (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- `order_id` (UUID, NOT NULL, FK to orders.id, ON DELETE CASCADE)
- `from_status` (TEXT)
- `to_status` (TEXT, NOT NULL)
- `changed_by_user_id` (UUID, FK to users.id) - Admin who made change
- `notes` (TEXT)
- `tracking_number` (TEXT)
- `created_at` (TIMESTAMPTZ, DEFAULT now())

| id | order_id | from_status | to_status | changed_by_user_id | notes | tracking_number | created_at |
|----|----------|-------------|-----------|-----------------------|-------|-----------------|------------|
| osh-001 | order-001 | NULL | pending | NULL | Order created | NULL | 2025-10-18 15:00:00 |
| osh-002 | order-001 | pending | processing | i9j0k1l2-... | Payment confirmed, preparing order | NULL | 2025-10-18 16:30:00 |
| osh-003 | order-001 | processing | shipped | i9j0k1l2-... | Order shipped via UPS | 1Z999AA10123456784 | 2025-10-19 14:00:00 |
| osh-004 | order-001 | shipped | delivered | NULL | Delivered (auto-updated from tracking) | 1Z999AA10123456784 | 2025-10-22 11:30:00 |
| osh-005 | order-002 | NULL | pending | NULL | Order created | NULL | 2025-10-30 10:30:00 |
| osh-006 | order-002 | pending | processing | i9j0k1l2-... | Payment confirmed | NULL | 2025-10-30 11:00:00 |
| osh-007 | order-002 | processing | shipped | i9j0k1l2-... | Shipped to Colombia | 2Z999BB20234567895 | 2025-10-31 10:00:00 |
| osh-008 | order-003 | NULL | pending | NULL | Guest order created | NULL | 2025-11-01 16:45:00 |
| osh-009 | order-003 | pending | processing | i9j0k1l2-... | Payment confirmed | NULL | 2025-11-01 17:00:00 |

---

## 5. Inventory & ERP

### 5.1 `inventory_movements`

**Description**: Complete audit trail of all stock changes.

**Fields**:
- `id` (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- `product_id` (UUID, NOT NULL, FK to products.id)
- `movement_type` (TEXT, NOT NULL) - ENUM: 'erp_sync', 'order', 'manual_adjustment', 'return'
- `quantity_change` (INTEGER, NOT NULL) - Can be negative
- `quantity_after` (INTEGER, NOT NULL)
- `reference_id` (UUID) - order_id or sync_log_id
- `reason` (TEXT)
- `created_by_user_id` (UUID, FK to users.id) - NULL for automated movements
- `created_at` (TIMESTAMPTZ, DEFAULT now())

| id | product_id | movement_type | quantity_change | quantity_after | reference_id | reason | created_by_user_id | created_at |
|----|------------|---------------|-----------------|----------------|--------------|--------|-------------------|------------|
| inv-001 | prod-001 | erp_sync | +50 | 50 | sync-001 | ERP sync - initial stock | NULL | 2025-09-15 20:00:00 |
| inv-002 | prod-002 | erp_sync | +25 | 25 | sync-001 | ERP sync - initial stock | NULL | 2025-09-15 20:00:00 |
| inv-003 | prod-003 | manual_adjustment | +10 | 10 | NULL | New shipment received | i9j0k1l2-... | 2025-09-20 10:00:00 |
| inv-004 | prod-001 | order | -1 | 49 | order-001 | Sold in order ZERO-2025-00001 | NULL | 2025-10-18 15:00:00 |
| inv-005 | prod-003 | order | -1 | 9 | order-001 | Sold in order ZERO-2025-00001 | NULL | 2025-10-18 15:00:00 |
| inv-006 | prod-002 | order | -1 | 24 | order-002 | Sold in order ZERO-2025-00002 | NULL | 2025-10-30 10:30:00 |
| inv-007 | prod-001 | order | -1 | 48 | order-003 | Sold in order ZERO-2025-00003 | NULL | 2025-11-01 16:45:00 |
| inv-008 | prod-002 | erp_sync | -12 | 12 | sync-002 | ERP sync - stock adjustment | NULL | 2025-10-31 20:00:00 |
| inv-009 | prod-003 | manual_adjustment | -6 | 3 | NULL | Damaged items removed | i9j0k1l2-... | 2025-11-01 11:00:00 |

---

### 5.2 `erp_sync_logs`

**Description**: Log of all ERP synchronization attempts.

**Fields**:
- `id` (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- `sync_type` (TEXT, NOT NULL) - ENUM: 'scheduled', 'manual'
- `status` (TEXT, NOT NULL) - ENUM: 'success', 'failed', 'partial'
- `started_at` (TIMESTAMPTZ, NOT NULL)
- `completed_at` (TIMESTAMPTZ)
- `duration_seconds` (INTEGER)
- `total_records_fetched` (INTEGER)
- `records_processed` (INTEGER)
- `records_updated` (INTEGER)
- `records_skipped` (INTEGER)
- `error_count` (INTEGER, DEFAULT 0)
- `created_at` (TIMESTAMPTZ, DEFAULT now())

| id | sync_type | status | started_at | completed_at | duration_seconds | total_records_fetched | records_processed | records_updated | records_skipped | error_count | created_at |
|----|-----------|--------|------------|--------------|------------------|-----------------------|-------------------|-----------------|-----------------|-------------|------------|
| sync-001 | manual | success | 2025-09-15 20:00:00 | 2025-09-15 20:05:30 | 330 | 150 | 150 | 150 | 0 | 0 | 2025-09-15 20:05:30 |
| sync-002 | scheduled | success | 2025-10-31 20:00:00 | 2025-10-31 20:04:15 | 255 | 148 | 148 | 145 | 0 | 3 | 2025-10-31 20:04:15 |
| sync-003 | manual | partial | 2025-11-02 09:00:00 | 2025-11-02 09:03:45 | 225 | 152 | 147 | 140 | 5 | 7 | 2025-11-02 09:03:45 |

---

### 5.3 `erp_sync_errors`

**Description**: Detailed errors from ERP sync operations.

**Fields**:
- `id` (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- `sync_log_id` (UUID, NOT NULL, FK to erp_sync_logs.id, ON DELETE CASCADE)
- `product_sku` (TEXT)
- `error_message` (TEXT, NOT NULL)
- `error_details` (JSONB) - Flexible structure for error data
- `created_at` (TIMESTAMPTZ, DEFAULT now())

| id | sync_log_id | product_sku | error_message | error_details | created_at |
|----|-------------|-------------|---------------|---------------|------------|
| err-001 | sync-002 | RB-9999-ERR | Product not found in local database | {"erp_id": "12345", "erp_name": "Unknown Product"} | 2025-10-31 20:02:00 |
| err-002 | sync-002 | OAK-1111-BAD | Invalid stock quantity in ERP response | {"erp_stock": "invalid", "expected_type": "integer"} | 2025-10-31 20:03:00 |
| err-003 | sync-002 | ZERO-888-OLD | Product discontinued in ERP | {"erp_status": "discontinued", "last_stock": 0} | 2025-10-31 20:03:30 |
| err-004 | sync-003 | RB-7777-NET | Network timeout fetching product data | {"timeout_seconds": 30, "attempt": 3} | 2025-11-02 09:01:30 |
| err-005 | sync-003 | OAK-6666-JSON | Malformed JSON in ERP response | {"raw_response": "[incomplete json..."} | 2025-11-02 09:02:00 |

---

## 6. Customer Engagement (P2)

### 6.1 `wishlists`

**Description**: Saved products for registered users (P2 feature).

**Fields**:
- `id` (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- `user_id` (UUID, NOT NULL, FK to users.id, ON DELETE CASCADE)
- `product_id` (UUID, NOT NULL, FK to products.id, ON DELETE CASCADE)
- `created_at` (TIMESTAMPTZ, DEFAULT now())
- UNIQUE (user_id, product_id)

| id | user_id | product_id | created_at |
|----|---------|------------|------------|
| wish-001 | a1b2c3d4-... | prod-002 | 2025-10-25 16:00:00 |
| wish-002 | e5f6g7h8-... | prod-001 | 2025-10-28 11:30:00 |
| wish-003 | e5f6g7h8-... | prod-003 | 2025-10-28 11:31:00 |

---

### 6.2 `product_reviews`

**Description**: Customer reviews and ratings (P2 feature).

**Fields**:
- `id` (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- `product_id` (UUID, NOT NULL, FK to products.id, ON DELETE CASCADE)
- `user_id` (UUID, NOT NULL, FK to users.id, ON DELETE CASCADE)
- `order_id` (UUID, NOT NULL, FK to orders.id) - Verify purchase
- `rating` (INTEGER, NOT NULL) - 1-5 stars
- `title` (TEXT)
- `review_text` (TEXT)
- `is_approved` (BOOLEAN, DEFAULT false) - Admin moderation
- `approved_by_user_id` (UUID, FK to users.id) - Admin who approved
- `approved_at` (TIMESTAMPTZ)
- `created_at` (TIMESTAMPTZ, DEFAULT now())
- `updated_at` (TIMESTAMPTZ, DEFAULT now())

| id | product_id | user_id | order_id | rating | title | review_text | is_approved | approved_by_user_id | approved_at | created_at |
|----|------------|---------|----------|--------|-------|-------------|-------------|---------------------|-------------|------------|
| rev-001 | prod-001 | a1b2c3d4-... | order-001 | 5 | ¡Excelentes gafas! | Las Ray-Ban Aviator son clásicas y de excelente calidad. Llegaron rápido y bien empacadas. | true | i9j0k1l2-... | 2025-10-25 10:00:00 | 2025-10-23 14:30:00 |
| rev-002 | prod-002 | e5f6g7h8-... | order-002 | 4 | Muy buenas para deporte | Las Oakley son perfectas para ciclismo. El único detalle es que son un poco grandes para mi rostro. | true | i9j0k1l2-... | 2025-11-01 09:00:00 | 2025-10-31 18:00:00 |

---

## 7. Support & Communication

### 7.1 `contact_submissions`

**Description**: Contact form submissions from customers.

**Fields**:
- `id` (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- `user_id` (UUID, FK to users.id) - NULL if not logged in
- `name` (TEXT, NOT NULL)
- `email` (TEXT, NOT NULL)
- `country` (TEXT, NOT NULL) - **REQUIRED**
- `subject` (TEXT, NOT NULL)
- `message` (TEXT, NOT NULL)
- `status` (TEXT, DEFAULT 'pending') - ENUM: 'pending', 'in_progress', 'resolved'
- `assigned_to_user_id` (UUID, FK to users.id) - Admin assigned
- `created_at` (TIMESTAMPTZ, DEFAULT now())
- `resolved_at` (TIMESTAMPTZ)

| id | user_id | name | email | country | subject | message | status | assigned_to_user_id | created_at | resolved_at |
|----|---------|------|-------|---------|---------|---------|--------|---------------------|------------|-------------|
| cont-001 | NULL | Ana López | ana.lopez@email.com | Argentina | Consulta sobre envío | ¿Cuánto tarda el envío a Buenos Aires? | resolved | i9j0k1l2-... | 2025-10-20 10:00:00 | 2025-10-20 14:30:00 |
| cont-002 | a1b2c3d4-... | Juan Pérez | juan.perez@email.com | México | Problema con mi pedido | Mi pedido ZERO-2025-00001 llegó con un lente rayado | in_progress | i9j0k1l2-... | 2025-10-23 16:00:00 | NULL |
| cont-003 | NULL | Pedro Martínez | pedro@email.com | Perú | Pregunta sobre receta | ¿Puedo cargar mi receta después de hacer el pedido? | pending | NULL | 2025-11-01 09:30:00 | NULL |

---

## 8. Relationships Summary

### Visual Relationship Map

```
┌─────────────────┐
│  auth.users     │
│  (Supabase)     │
└────────┬────────┘
         │ 1:1
         ▼
┌─────────────────┐
│  public.users   │◄──────┐
└────────┬────────┘       │
         │                │
         ├─ 1:many ──────►│ addresses
         │                │
         ├─ 1:many ──────►│ cart_items ──► products
         │                │      │
         │                │      ├── 1:1 ──► cart_item_prescriptions
         │                │      └── many:many ──► lens_treatments
         │                │                         (via cart_item_treatments)
         │                │
         ├─ 1:many ──────►│ orders ──► order_items ──► products
         │                │      │           │
         │                │      │           ├── 1:1 ──► order_item_prescriptions
         │                │      │           └── many:many ──► lens_treatments
         │                │      │                              (via order_item_treatments)
         │                │      └── 1:many ──► order_status_history
         │                │
         ├─ 1:many ──────►│ wishlists ──► products
         │                │
         ├─ 1:many ──────►│ product_reviews ──► products
         │                │                      └── orders (verify purchase)
         └─ 1:many ──────►│ contact_submissions


┌─────────────────┐
│   products      │
└────────┬────────┘
         │
         ├─ many:1 ──► brands
         ├─ many:1 ──► categories
         ├─ many:1 ──► frame_materials
         ├─ many:1 ──► frame_shapes
         ├─ 1:many ──► product_images
         ├─ 1:many ──► inventory_movements
         └─ many:many ──► lens_treatments
                          (via product_lens_treatments)


┌─────────────────┐
│ erp_sync_logs   │
└────────┬────────┘
         │
         └─ 1:many ──► erp_sync_errors
```

---

## Key Indexes for Performance

```sql
-- Users
CREATE INDEX idx_users_country ON users(country);

-- Products
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_brand_id ON products(brand_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_stock_quantity ON products(stock_quantity);

-- Cart Items
CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX idx_cart_items_session_id ON cart_items(session_id);
CREATE INDEX idx_cart_items_expires_at ON cart_items(expires_at);

-- Orders
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Inventory
CREATE INDEX idx_inventory_movements_product_id ON inventory_movements(product_id);
CREATE INDEX idx_inventory_movements_created_at ON inventory_movements(created_at DESC);

-- ERP Sync
CREATE INDEX idx_erp_sync_logs_created_at ON erp_sync_logs(created_at DESC);
CREATE INDEX idx_erp_sync_errors_sync_log_id ON erp_sync_errors(sync_log_id);
```

---

## ENUMs Definition

```sql
-- Order Status
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');

-- Payment Status
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Prescription Validation Status
CREATE TYPE prescription_validation_status AS ENUM ('pending', 'approved', 'rejected');

-- Inventory Movement Type
CREATE TYPE inventory_movement_type AS ENUM ('erp_sync', 'order', 'manual_adjustment', 'return');

-- ERP Sync Type
CREATE TYPE erp_sync_type AS ENUM ('scheduled', 'manual');

-- ERP Sync Status
CREATE TYPE erp_sync_status AS ENUM ('success', 'failed', 'partial');

-- Contact Submission Status
CREATE TYPE contact_status AS ENUM ('pending', 'in_progress', 'resolved');
```

---

## Summary Statistics

**Total Tables**: 23

**Breakdown by Domain**:
- Authentication & Users: 2 tables
- Product Catalog: 8 tables
- Shopping Cart: 3 tables
- Orders & Transactions: 5 tables
- Inventory & ERP: 3 tables
- Customer Engagement (P2): 2 tables
- Support: 1 table

**Total Mock Records**: ~150+ records across all tables

---

**End of Database Schema Document**
