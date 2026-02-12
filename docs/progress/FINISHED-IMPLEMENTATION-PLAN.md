# ZERO E-Commerce - Implementation Plan

**Date**: January 13, 2026 (Updated - Major Milestone)
**Status**: Phase 1-5 Complete (100%) | Payment & Email Integration Complete | ~95% MVP Ready
**Database**: ✅ Fully Migrated to UUID-based Multi-step Prescription System
**Security**: ✅ Critical Issues Fixed
**Latest**: 🎉 **PagueloFacil Payment Integration COMPLETE** | **SendGrid Email Notifications COMPLETE** | **ERP Sync COMPLETE**

---

## Overview

This document outlines the step-by-step implementation plan for building the ZERO e-commerce MVP. All critical security issues have been resolved, and the database has been fully migrated to a modern UUID-based prescription system with cart transfer functionality working end-to-end.

**Major Milestone**: Payment processing, email notifications, and ERP sync are now fully operational. Platform is ~95% ready for MVP launch.

---

## Recent Major Accomplishments (Nov 6 - Jan 13, 2026)

### ✅ Multi-step Prescription Flow (Nov 6-7)
- Complete refactor from ENUM-based to UUID-based foreign key system
- 4 admin-editable tables: `prescription_types`, `lens_types`, `lens_indexes`, `view_areas`
- Enhanced prescription form with progressive disclosure UX
- Real-time pricing calculations
- Formula entry + image upload support

### ✅ Cart Transfer System (Nov 7)
- **login-form.tsx**: Cart merge on login with full prescription data transfer
- **CartSync.tsx**: Automatic cart transfer after email confirmation
- Both flows tested and working with complete prescription data

### ✅ Database Cleanup (Nov 8)
- Dropped deprecated ENUM types (5 types removed)
- Dropped treatment tables (treatments merged into `lens_types`)
- Dropped `lens_options` table
- Removed old ENUM columns from prescription tables
- Database now 100% UUID-based with clean schema

### ✅ User Profile & Addresses (Nov 8-9)
- **Phase 2.3 Complete**: Profile management and address CRUD fully functional
- Fixed critical bugs: Table name mismatches and schema alignment issues
- Database interface alignment: All fields match `addresses` table exactly
- RLS policies verified: Users can only access their own data
- Profile page compiles and renders successfully (200 OK)

### ✅ Checkout Flow & Order Management (Nov 9)
- **Phase 3 Complete**: Full checkout flow with multi-step process
  - Authentication gate with redirect handling
  - Shipping address selection and creation
  - Shipping method selection (Standard/Express)
  - Order review and confirmation
  - Order creation with prescription data transfer
  - Cart clearing after successful order
- **Phase 4 Complete**: Order tracking and history
  - Order history page with status filtering
  - Detailed order view with prescription configuration
  - Status timeline with tracking information
  - Prescription validation status display
- **Files Created**:
  - `/app/checkout/page.tsx` & `CheckoutClient.tsx`
  - `/app/orders/page.tsx` - Order history
  - `/app/orders/[id]/page.tsx` - Order details
  - `/app/orders/[id]/confirmation/page.tsx` - Order confirmation
- **Pending**: PagueloFacil payment integration, email notifications

### ✅ Complete Prescription Display System (Nov 11)
- **Prescription Details Everywhere**: Full prescription configuration visible across all pages
  - Cart: Shows PrescriptionSummary with Spanish names and pricing
  - Checkout: Displays prescription costs breakdown in order summary
  - Order Confirmation: Complete prescription details with PrescriptionSummary
  - Order Detail: Prescription configuration with validation status
- **CartSync Enhancement**: Fixed prescription data transfer from localStorage to database
  - Upsert logic to handle existing prescriptions
  - Better null handling for optional fields
  - Enhanced error logging
  - Support for formula values and images
- **RLS Policy Fix**: Resolved nested query issues with separate fetches
- **Pricing Accuracy**: All prescription add-ups calculate and display correctly
- **Files Modified**: 6 files (CartSync, Cart, Checkout pages, Order pages)

### ✅ Admin Prescription Configuration Management (Nov 13)
- **Complete Admin UI**: Full CRUD interface for managing all prescription configuration tables
  - `/app/admin/prescription-config/page.tsx` - Server component with auth gate
  - `/app/admin/prescription-config/PrescriptionConfigClient.tsx` - 1596-line admin UI
- **Inline Editing**: Edit button (✏️) toggles between view and edit modes for all fields
  - Edit names, descriptions, prices, and applicability flags inline
  - Save/Cancel buttons in edit mode
  - Real-time validation
- **Per-Prescription-Type Flags**: Fine-grained control over lens type and index availability
  - Database migration added `applies_to_single_vision` and `applies_to_progressive` columns
  - Checkboxes: "Sin Receta", "Visión Sencilla", "Progresivo" for lens types
  - Checkboxes: "Visión Sencilla", "Progresivo" for lens indexes
- **User-Facing Form Fix**: Updated prescription form to respect new flags
  - `prescription-helpers.ts`: groupLensTypes() and getActiveLensIndexes() now filter by prescription type
  - `PrescriptionForm.tsx`: Passes prescription type slug to filter functions
  - **Verified Working**: Lens options now filter correctly based on prescription type selection
- **Files Modified**: 4 files (PrescriptionConfigClient, page.tsx, prescription-helpers.ts, PrescriptionForm.tsx)

### ✅ Product Management & Products List (Nov 14)
- **Phase 5.3 Complete**: Full admin product management system

### ✅ Inventory Management System (Nov 15 AM)
- **Phase 5.7 Complete**: Comprehensive inventory tracking and stock management
  - Stock statistics dashboard (Total, In Stock, Low Stock, Out of Stock)
  - Product table with real-time stock levels
  - Search and filter functionality (by name, SKU, stock status)
  - Stock adjustment modal (Add/Remove/Set operations)
  - Inventory movement history tracking
  - Database logging for audit trail
  - Spanish locale date/time formatting
  - Responsive design for mobile and desktop

### ✅ Spanish Translation for Admin Pages (Nov 15 PM)
- **Complete Translation**: Dashboard and Orders pages now fully in Spanish
  - Dashboard: All labels, alerts, and status badges translated
  - Orders: Complete translation including table headers, filters, search
  - Status badges: Pendiente, Procesando, Enviado, Entregado, Cancelado
  - Payment badges: Pagado, Pendiente, Fallido
  - Date formatting with Spanish locale (es-ES)

### ✅ User Management System (Nov 15 PM)
- **Phase 5.8 Complete**: Full admin user management interface
  - User statistics dashboard (Total Users, Admins, Customers)
  - Complete user table with name, email, phone, country, order count
  - Real-time search by name, email, or phone
  - Filter by user type (All, Admins, Customers)
  - Admin promotion/demotion with confirmation dialog
  - Safety check prevents self-demotion
  - User details modal with complete information
  - Order count tracking per user
  - All text in Spanish
  - Admin badge display with color coding
  - Fetches emails using admin client from auth.users
  - Real-time state updates after admin status changes
  - Form validation and error handling
  - Stats dashboard: Total, Active, Inactive, Low Stock, Out of Stock
  - Search and filter functionality
  - Delete with storage cleanup
- **Phase 1.1 Complete**: Public products list page with advanced features
  - Real-time search across name, SKU, description, brand
  - Smart pagination (12 products per page)
  - Filtering by category, brand, material, shape, price
  - Sorting by newest, price, name
  - Mobile-friendly collapsible filters
  - Responsive grid layout (1-4 columns)
  - Stock badges for low inventory
- **Files Created**: 8 files (ProductForm, ImageUploader, ProductsClient, ProductFilters, product-helpers, product types, 3 admin pages)
- **Bug Fixes**:
  - Fixed schema mismatch: `product_images` uses `is_primary` not `alt_text`
  - Added Supabase storage domain to Next.js image configuration
  - Fixed RLS policies for storage upload and database insert

### ✅ PagueloFacil Payment Integration (Dec 2025 - Jan 2026)
- **Phase 3.4 COMPLETE**: Full payment processing with PagueloFacil LinkDeamon API
- **Redirect-Based Flow**: PCI-compliant payment processing (card data handled by PagueloFacil)
- **Key Features**:
  - Payment link creation with session management (1-hour expiration)
  - Payment callback handler with order creation
  - Prescription data transfer to `order_item_prescriptions` table
  - Prescription cost recalculation from fresh lookup data
  - Cart clearing after successful payment
  - Email trigger integration after payment completion
  - Sandbox/production environment switching
  - Comprehensive error handling with Spanish messages
  - Duplicate order prevention
  - Session recovery for interrupted flows
- **Files Implemented**:
  - `/lib/payment/paguelofacil-client.ts` - API client (220 lines)
  - `/lib/types/payment.ts` - Payment type definitions
  - `/app/api/checkout/create-payment-link/route.ts` - Payment link creation
  - `/app/api/checkout/payment-callback/route.ts` - Callback handler with order creation (411 lines)
  - `/app/api/checkout/session/route.ts` - Session management
  - `/supabase/migrations/20251212000000_checkout_sessions.sql` - Session storage table
- **Status**: Working in SANDBOX mode, production-ready (just need env var change)

### ✅ SendGrid Email Notifications (Dec 27-28, 2025)
- **Email System COMPLETE**: Transactional emails with prescription details
- **Two Email Types Implemented**:
  1. **Order Confirmation Email**:
     - Sent automatically after successful payment
     - Complete prescription configuration with Spanish names
     - Itemized price breakdown (base + lens type + index + view area)
     - Prescription formula display (OD/OS SPH, CYL, AXIS, PD, ADD)
     - Shipping address and delivery estimates
     - Template ID: `d-717922b773cf45c9aec5e533e385dc0c`
  2. **Order Shipped Email**:
     - Sent from admin panel when marking as shipped
     - Tracking number and carrier information
     - Estimated delivery date
     - Complete item list with quantities
     - Shipping address display (fixed from N/A bug)
     - Template ID: `d-a47f4deaae4c4fcdb90b6ca700fa241d`
- **Key Fixes** (from FINISHED-PRESCRIPTION-DISPLAY doc):
  - ✅ Prescription costs calculate correctly
  - ✅ Shipping addresses display properly (not N/A)
  - ✅ Email subjects configured in SendGrid templates
  - ✅ `treatments_cost` field calculates accurately
  - ✅ Price breakdowns show itemized costs correctly
- **Files Implemented**:
  - `/lib/email/sendgrid-client.ts` - SendGrid API wrapper
  - `/lib/email/email-service.ts` - Email sending functions (108 lines)
  - `/lib/email/email-helpers.ts` - Prescription formatting utilities (171 lines)
  - `/app/api/orders/[id]/send-shipped-email/route.ts` - Shipping email API (134 lines)
- **Integration Points**:
  - Order confirmation: Triggered in payment callback after order creation
  - Shipping notification: Triggered from admin order status form
  - Non-blocking: Email failures don't break order processing

### ✅ ERP Integration & Inventory Sync (Dec 2025 - Jan 2026)
- **Automatic Sync COMPLETE**: dubros.com API integration with job queue
- **Architecture**: Asynchronous job processing handles 4,000+ products without timeout
- **Sync Features**:
  - Manual trigger from admin panel (`/admin/erp-sync`)
  - Real-time progress tracking (9 steps with percentages)
  - Batch processing with 50-product progress updates
  - Automatic product deactivation for missing items
  - Pricing calculation with tier-based markup
  - Stock movement logging to `inventory_movements` table
  - Manual price override preservation
  - Comprehensive error tracking in `erp_sync_errors` table
- **Admin UI Features**:
  - Quick limit buttons (50, 100, 500, All products)
  - Real-time progress bar with step descriptions
  - Item counter (current / total)
  - Sync history table with status badges
  - Cancel button for mid-sync termination
  - Error logs with detailed reasons
- **Data Synced**:
  - Product SKU, name, price, stock quantity
  - Brand, category, material lookups
  - Product images (low-res + high-res CDN)
  - Inventory movements for audit trail
- **Files Implemented**:
  - `/lib/erp/dubros-client.ts` - API client for dubros.com
  - `/lib/erp/types.ts` - TypeScript interfaces
  - `/lib/erp/product-mapper.ts` - Data transformation & validation
  - `/lib/services/erp-sync-service.ts` - Main sync orchestrator
  - `/app/api/admin/erp-sync/route.ts` - Manual sync trigger
  - `/app/api/admin/erp-sync-status/[id]/route.ts` - Job status polling
  - `/app/admin/erp-sync/ErpSyncClient.tsx` - Admin UI with polling
  - `/supabase/migrations/20251201000000_erp_sync_jobs.sql` - Job queue table
- **Performance**: ~2-5 minutes for full sync of 4,138 products
- **Status**: Manual sync working perfectly, scheduled sync infrastructure ready (not activated)

---

## Pre-Launch Checklist

### ✅ Completed (Platform Ready)
- [x] Database schema created with RLS policies
- [x] Seed data added (categories, materials, shapes, brands, products)
- [x] Security audit completed
- [x] **CRITICAL FIX**: Middleware now allows public routes
- [x] **CRITICAL FIX**: Open redirect vulnerability patched
- [x] **CRITICAL FIX**: Order creation INSERT policies added
- [x] Multi-step prescription system implemented
- [x] Cart transfer system (login + email confirmation flows)
- [x] Database cleanup (ENUMs removed, UUID-only system)
- [x] Product catalog list page (`/products`) - ✅ Complete
- [x] Checkout process - ✅ Complete
- [x] Admin dashboard - ✅ Complete (All 8 features)
- [x] Spanish translation for admin - ✅ Complete
- [x] Inventory management - ✅ Complete
- [x] User management - ✅ Complete
- [x] **Payment integration (PagueloFacil)** - ✅ Complete (Dec 2025 - Jan 2026)
- [x] **Email notifications** (order confirmation, shipping) - ✅ Complete (Dec 27-28, 2025)
- [x] **ERP integration** (dubros.com inventory sync) - ✅ Complete (Dec 2025 - Jan 2026)

### 🟡 Remaining for MVP Launch
- [ ] Static/legal pages in Spanish (Contact, About, Policies, Size Guide, Shipping Info)
- [ ] Analytics setup (optional for launch)
- [ ] Error tracking (Sentry or similar) (optional for launch)
- [ ] Performance testing and optimization
- [ ] Final security audit
- [ ] Production environment setup

---

## Phase 1: Product Catalog (Week 1-2)

**Goal**: Allow public users to browse products without authentication

### 1.1 Products List Page (`/products`)
**Priority**: 🔴 HIGH
**Estimated Time**: 2-3 days
**Status**: ✅ COMPLETE (Nov 14, 2025)

**Tasks**:
- [x] Create `/app/products/page.tsx`
- [x] Fetch products from Supabase with:
  - Brand information
  - Category information
  - Product images
  - Frame materials & shapes
- [x] Display products in responsive grid layout
- [x] Add filtering by:
  - Category (Gafas de Sol / Gafas con Receta)
  - Brand (ZERO, Ray-Ban, Oakley, Persol)
  - Price range
  - Frame material
  - Frame shape
- [x] Add sorting by:
  - Price (low to high, high to low)
  - Name (A-Z, Z-A)
  - Newest first
- [x] Add search functionality
- [x] Implement pagination or infinite scroll

**Technical Details**:
```typescript
// Supabase query example
const { data: products } = await supabase
  .from('products')
  .select(`
    *,
    brand:brands(*),
    category:categories(*),
    frame_material:frame_materials(*),
    frame_shape:frame_shapes(*),
    product_images(*)
  `)
  .eq('is_active', true)
  .order('created_at', { ascending: false });
```

**Implementation Details** (Nov 14, 2025):
- **Files**: `/app/products/page.tsx`, `/app/products/ProductsClient.tsx`, `/app/products/ProductFilters.tsx`
- **Search Functionality**:
  - Real-time search across product name, SKU, description, brand name
  - Search input with clear button (X)
  - Case-insensitive filtering
- **Pagination**:
  - 12 products per page
  - Smart pagination controls with Previous/Next buttons
  - Page number buttons with ellipsis for large ranges
  - Current page highlighted in blue
  - Auto-resets to page 1 when filters change
  - Results counter: "Mostrando 1-12 de X productos (Y totales)"
- **Filters**: Category, Brand, Material, Shape, Price Range slider
- **Sorting**: Newest, Price (Low/High), Name (A-Z/Z-A)
- **Mobile-friendly**: Collapsible filters panel
- **Stock Badges**: "Pocas Unidades" for low stock items

**Success Criteria**:
- ✅ Users can browse products without login
- ✅ Products display correctly with images
- ✅ Filters work and update results
- ✅ Search functionality works across multiple fields
- ✅ Pagination handles large product catalogs
- ✅ Page is responsive (mobile + desktop)
- ✅ Performance: Page loads in < 2 seconds

---

### 1.2 Product Detail Page (`/products/[id]`)
**Priority**: 🔴 HIGH
**Estimated Time**: 2-3 days
**Status**: ✅ COMPLETE (Nov 6-7, 2025)

**Tasks**:
- [x] Create `/app/products/[id]/page.tsx`
- [x] Fetch single product with all related data
- [x] Build product image gallery
- [x] Display product specifications
- [x] Add "Add to Cart" button
- [x] Add multi-step prescription form
- [x] Implement quantity selector
- [x] Add to localStorage cart (unauthenticated users)

**localStorage Cart Structure** (✅ **UPDATED** - Nov 8, 2025):
```typescript
interface LocalStorageCartItem {
  id: string; // Unique cart item ID
  productId: string;
  productName: string;
  productPrice: number;
  productImage: string | null;
  quantity: number;

  // ✨ NEW UUID-BASED PRESCRIPTION SYSTEM
  prescription?: {
    // UUID Foreign Keys to admin-editable tables
    prescription_type_id: string;  // Links to prescription_types table
    lens_type_id: string;          // Links to lens_types table (includes former treatments)
    lens_index_id: string;         // Links to lens_indexes table
    view_area_id: string;          // Links to view_areas table

    // Prescription formula (optional if image provided)
    formula?: {
      od_sph?: number;     // Right Eye Sphere (-20 to +20)
      od_cyl?: number;     // Right Eye Cylinder (-4 to +4)
      od_axis?: number;    // Right Eye Axis (0-180)
      os_sph?: number;     // Left Eye Sphere
      os_cyl?: number;     // Left Eye Cylinder
      os_axis?: number;    // Left Eye Axis
      pd?: number;         // Pupillary Distance (20-80mm)
      pd_dual_od?: number; // Dual PD - Right
      pd_dual_os?: number; // Dual PD - Left
      add_value?: number;  // For progressive lenses
    };

    // Prescription image (base64 compressed, <500KB)
    prescription_image_url?: string;
  };

  // Prescription costs for display (calculated from tables)
  prescriptionCosts?: {
    lensTypeCost: number;
    lensIndexCost: number;
    viewAreaCost: number;
  };

  addedAt: string;
}
```

**Key Changes from Old System**:
- ❌ Removed: All ENUM fields (prescription_type, without_rx_type, etc.)
- ❌ Removed: selectedTreatments array (merged into lens_types)
- ✅ Added: UUID foreign keys to 4 admin-editable tables
- ✅ Added: prescriptionCosts for cart display

**Success Criteria**:
- ✅ Product details load correctly
- ✅ Image gallery works (zoom, navigation)
- ✅ Add to cart works for unauthenticated users
- ✅ Multi-step prescription form works
- ✅ Cart persists in localStorage
- ✅ Prescription costs calculate correctly

---

### 1.3 Cart Page (`/app/cart`)
**Priority**: 🔴 HIGH
**Estimated Time**: 2 days
**Status**: ✅ COMPLETE (Nov 6-7, Enhanced Nov 11, 2025)

**Tasks**:
- [x] Create `/app/cart/page.tsx` and `/app/cart/CartClient.tsx`
- [x] Display cart items from localStorage (logged out) OR database (logged in)
- [x] Fetch product details for cart items
- [x] Show prescription configuration with costs
- [x] Implement quantity update
- [x] Implement item removal
- [x] Calculate totals with prescription costs
- [x] Add "Proceed to Checkout" button
- [x] Add "Continue Shopping" link
- [x] **(Nov 11)** Fetch prescription metadata (lens_types, lens_indexes, view_areas, prescription_types)
- [x] **(Nov 11)** Display PrescriptionSummary component with Spanish names
- [x] **(Nov 11)** Show complete prescription configuration for each item

**Cart Display Features**:
- Auth-aware: Automatically switches between localStorage and database
- Fetches lens_types, lens_indexes, view_areas, prescription_types with Spanish names
- Displays complete prescription configuration with PrescriptionSummary component
- Shows itemized costs: Base price + Lens type + Index + View area
- Displays formula values (OD/OS SPH, CYL, AXIS, PD, ADD)
- Shows prescription image if uploaded
- Real-time total calculations

**Success Criteria**:
- ✅ Cart displays items from localStorage (logged out)
- ✅ Cart displays items from database (logged in)
- ✅ Prescription details shown clearly with Spanish names
- ✅ Prescription costs calculated and displayed
- ✅ Complete prescription configuration visible
- ✅ Quantity updates work
- ✅ Remove item works
- ✅ Totals calculate correctly
- ✅ Empty cart state displays properly

---

## ✨ MULTI-STEP PRESCRIPTION SYSTEM (November 6-8, 2025)

**Status**: ✅ **COMPLETE**
**Database**: UUID-based Foreign Key System
**Frontend**: Progressive Disclosure UX

### Database Architecture

**Admin-Editable Configuration Tables** (All have RLS policies):
1. **prescription_types** (3 rows)
   - id (UUID PK)
   - name, slug, description
   - is_active, display_order
   - Examples: "Sin Receta", "Visión Sencilla", "Progresivo"

2. **lens_types** (6 rows)
   - id (UUID PK)
   - name, slug, description
   - price_modifier (numeric)
   - applies_to_without_rx, applies_to_with_rx (booleans)
   - is_active, display_order
   - Examples: "Solo el Marco" ($0), "Blue Block" (+$25), "Lentes Estándar" (+$15)
   - **Note**: Former treatments merged into this table

3. **lens_indexes** (4 rows)
   - id (UUID PK)
   - name, slug, index_value, description
   - price_modifier (numeric)
   - is_active, display_order
   - Examples: "1.50 Estándar" ($0), "1.60 Delgado" (+$50)

4. **view_areas** (2 rows)
   - id (UUID PK)
   - name, slug, description
   - price_modifier (numeric)
   - is_active, display_order
   - Examples: "Estándar" ($0), "40% Más Amplio" (+$75)

**Prescription Storage Tables**:
1. **cart_item_prescriptions**
   - cart_item_id (UUID FK) - One-to-one with cart_items
   - prescription_type_id (UUID FK) - Links to prescription_types
   - lens_type_id (UUID FK) - Links to lens_types
   - lens_index_id (UUID FK) - Links to lens_indexes
   - view_area_id (UUID FK) - Links to view_areas
   - Formula fields: od_sph, od_cyl, od_axis, os_sph, os_cyl, os_axis, pd, pd_dual_od, pd_dual_os, add_value
   - prescription_image_url (text) - Base64 or Storage URL

2. **order_item_prescriptions**
   - Same structure as cart_item_prescriptions
   - Additional: validation_status, validated_by_user_id, validated_at, validation_notes

**Removed Tables** (Cleanup Nov 8, 2025):
- ❌ lens_treatments
- ❌ product_lens_treatments
- ❌ cart_item_treatments
- ❌ order_item_treatments
- ❌ lens_options

**Removed ENUM Types** (Cleanup Nov 8, 2025):
- ❌ prescription_type_enum
- ❌ without_rx_type_enum
- ❌ single_vision_type_enum
- ❌ lens_index_enum
- ❌ progressive_view_area_enum

### Frontend Implementation

**Components**:
1. `/components/PrescriptionForm.tsx` - Multi-step prescription form
2. `/components/PrescriptionSummary.tsx` - Compact display for cart
3. `/lib/types/prescription.ts` - TypeScript types
4. `/lib/utils/prescription-helpers.ts` - Validation, pricing, image compression

**Features**:
- ✅ Progressive disclosure: Show relevant options based on selections
- ✅ Real-time pricing: Calculate costs as user configures
- ✅ Formula OR image: Flexible prescription entry
- ✅ Image compression: Reduce to <500KB base64
- ✅ Validation: Client-side with clear error messages
- ✅ Admin-editable: All options come from database

### Pricing Examples

| Configuration | Base Price | Lens Type | Index | View Area | Total |
|--------------|-----------|-----------|-------|-----------|-------|
| Frame Only | $100 | $0 | - | - | $100 |
| Blue Block | $100 | +$25 | - | - | $125 |
| Single Vision + High Index | $100 | +$15 | +$50 | - | $165 |
| Progressive + Broader View | $100 | +$15 | +$50 | +$75 | $240 |

---

## Phase 2: Authentication & User Management (Week 3-4)

**Goal**: Allow users to register, login, and manage their profile
**Status**: ✅ COMPLETE (Nov 7-9, 2025)

### 2.1 Registration Page (`/auth/sign-up`)
**Priority**: 🔴 HIGH
**Estimated Time**: 2 days
**Status**: ✅ COMPLETE

**Tasks**:
- [x] Create `/app/auth/sign-up/page.tsx`
- [x] Build registration form (email, password, name, phone, country)
- [x] Implement form validation
- [x] Integrate Supabase Auth signup
- [x] Create user profile in `users` table
- [x] Email verification flow
- [x] **Cart Transfer**: Automatic via CartSync component

**Cart Transfer Implementation**:
- `/components/CartSync.tsx` - Runs on every page load
- Detects authenticated user + localStorage cart
- Transfers all items including full prescription data (UUID-based)
- Handles both new items and quantity merging for existing items
- Clears localStorage after successful transfer
- Tested and working for email confirmation flow

**Success Criteria**:
- ✅ Registration works with email verification
- ✅ User profile created in database
- ✅ localStorage cart transferred automatically via CartSync
- ✅ Form validation prevents invalid data
- ✅ Country field is required

---

### 2.2 Login Page (`/auth/login`)
**Priority**: 🔴 HIGH
**Estimated Time**: 1 day
**Status**: ✅ COMPLETE

**Tasks**:
- [x] Create `/app/auth/login/page.tsx`
- [x] Build login form (email + password)
- [x] Implement Supabase Auth signin
- [x] **Cart Merge**: Merge localStorage cart with database cart
- [x] Forgot password link
- [x] Redirect to products page after login
- [x] Error handling for invalid credentials

**Cart Merge Implementation** (`/components/login-form.tsx`):
```typescript
// After successful login
1. Fetch existing cart items from database
2. For each localStorage item:
   - If product exists in DB cart: Add quantities together
   - If product doesn't exist: Insert new cart_item
3. For BOTH new and existing items:
   - Insert cart_item_prescriptions with full UUID-based data
   - Transfer formula fields if present
   - Transfer prescription image (base64) if present
4. Clear localStorage cart
5. Redirect to /products
```

**Key Fix (Nov 7)**: Prescription insertion now runs for BOTH new and existing cart items, ensuring no prescription data is lost during merge.

**Success Criteria**:
- ✅ Login works correctly
- ✅ Cart merges properly (local + database)
- ✅ Prescription data transferred completely
- ✅ Redirects to /products page
- ✅ Error messages display correctly

---

### 2.3 User Profile & Addresses (`/profile`)
**Priority**: 🟡 MEDIUM
**Estimated Time**: 2 days
**Status**: ✅ COMPLETE (Nov 8-9, 2025)

**Tasks**:
- [x] Create `/app/profile/page.tsx`
- [x] Display user information (name, email, phone, country)
- [x] Allow profile editing
- [x] Create address management section:
  - Add new address
  - Edit existing address
  - Delete address
  - Set default address
- [x] Implement RLS-protected queries
- [x] Form validation for addresses

**Implementation Details**:
- **Files Created**:
  - `/app/profile/page.tsx` - Server component fetching user and addresses data
  - `/app/profile/ProfileClient.tsx` - Client component with full CRUD operations
- **Database Alignment**: Fixed all references from `user_addresses` to `addresses` table
- **Schema Fixes**: Updated UserAddress interface to match database exactly:
  - `full_name`, `phone`, `country`, `address_line_1`, `address_line_2`, `city`, `state_province`, `postal_code`, `is_default`
- **RLS Policies Verified**: Users can SELECT, INSERT, UPDATE, DELETE own addresses via `auth.uid() = user_id`
- **Form Features**:
  - Profile editing with name, phone, country
  - Address management with all required fields for international shipping
  - Set default address functionality
  - Form validation and error handling

**Bugs Fixed (Nov 8-9)**:
1. Table name mismatch: `user_addresses` → `addresses` (6 occurrences)
2. Interface schema mismatch: Old field names → Database column names
3. Form state initialization with incorrect fields
4. Address display showing non-existent fields
5. cancelAddressForm function using old field structure

**Success Criteria**:
- ✅ Users can view/edit their profile
- ✅ Users can manage shipping addresses
- ✅ Default address selection works
- ✅ Only user's own data is accessible (RLS)
- ✅ Profile page compiles and renders successfully (200 OK)
- ✅ All TypeScript errors resolved

---

## Phase 3: Checkout Flow (Week 5-6)

**Goal**: Complete order creation and payment processing
**Status**: ✅ COMPLETE (Dec 2025 - Jan 2026) - Payment, email, and order creation all working

### 3.1 Checkout Authentication Gate
**Priority**: 🔴 HIGH
**Estimated Time**: 1 day
**Status**: ✅ COMPLETE (Nov 9, 2025)

**Tasks**:
- [x] Create checkout page with authentication check
- [x] Check if user is authenticated
- [x] If not authenticated, redirect to login with return URL
- [x] After auth, continue to checkout
- [x] Cart automatically transfers via existing CartSync

**Implementation**:
- `/app/checkout/page.tsx` - Server component with auth check
- Redirects to `/auth/login?redirectTo=/checkout` if not authenticated
- Fetches user data, addresses, and cart items
- Redirects to cart if cart is empty

**Success Criteria**:
- ✅ Unauthenticated users can't access checkout (redirected to login)
- ✅ Return URL preserves checkout intent
- ✅ Cart preserved through auth flow

---

### 3.2 & 3.3 Multi-Step Checkout (`/checkout`)
**Priority**: 🔴 HIGH
**Estimated Time**: 3 days
**Status**: ✅ COMPLETE (Nov 9, Enhanced Nov 11, 2025)

**Tasks**:
- [x] Create `/app/checkout/CheckoutClient.tsx` with multi-step flow
- [x] Display cart summary (sidebar)
- [x] Load user's saved addresses
- [x] Allow address selection
- [x] Add "New Address" form with all required fields
- [x] Validate required fields (including country)
- [x] Display shipping options with pricing
- [x] Allow shipping method selection (Standard/Express)
- [x] Update order total based on selections
- [x] Progress indicator (4 steps: Shipping, Method, Payment, Review)
- [x] **(Nov 11)** Fetch prescription metadata tables
- [x] **(Nov 11)** Calculate prescription costs accurately
- [x] **(Nov 11)** Display "Lentes y Tratamientos" with correct total
- [x] **(Nov 11)** Show PrescriptionSummary in Step 4 review

**Implementation Details**:
- **Step 1: Shipping Address**
  - Display saved addresses or new address form
  - Country dropdown required for international shipping
  - Address validation before proceeding
- **Step 2: Shipping Method**
  - Standard Shipping ($15, 7-10 days)
  - Express Shipping ($25, 3-5 days)
- **Step 3: Payment**
  - Placeholder for PagueloFacil integration (⏳ PENDING)
  - Shows "Integration coming soon" message
- **Step 4: Review Order**
  - Complete order summary with all details
  - Confirm and place order button

**Success Criteria**:
- ✅ Saved addresses display correctly
- ✅ New address form works with validation
- ✅ Address validation works (all required fields)
- ✅ Progress indicator shows current step
- ✅ Shipping methods selectable
- ✅ Selection updates order total
- ✅ Step navigation works (back/next)

---

### 3.4 Order Creation & Payment
**Priority**: 🔴 HIGH
**Estimated Time**: 3-4 days
**Status**: ✅ COMPLETE (Dec 2025 - Jan 2026)

**Tasks**:
- [x] Create order in database on checkout completion
- [x] Insert into `orders` table with all details
- [x] Insert into `order_items` table
- [x] Copy prescription data to `order_item_prescriptions`
- [x] Clear cart after successful order creation
- [x] Redirect to order confirmation
- [x] ✅ Integrate **PagueloFacil** payment gateway (COMPLETE)
- [x] ✅ Handle payment form/redirect (COMPLETE)
- [x] ✅ Process payment response (COMPLETE)
- [x] ✅ Update order status based on payment (COMPLETE)
- [x] ✅ Recalculate prescription costs from lookup tables (COMPLETE)
- [x] ✅ Handle payment failure gracefully (COMPLETE)
- [x] ✅ Trigger order confirmation email (COMPLETE)

**Complete Payment Flow**:
```typescript
1. User clicks "Finalizar Compra" in checkout
2. Save checkout session to database (1-hour expiration)
3. Create PagueloFacil payment link via LinkDeamon API
4. Redirect user to PagueloFacil payment page
5. User completes payment on PagueloFacil's secure page
6. PagueloFacil redirects back to payment-callback route with result
7. Validate payment response (Estado, Oper, TotalPagado)
8. If successful:
   - Generate unique order number (ZERO-YYYY-#####)
   - Create order record with payment details
   - Create order_items from cart snapshot
   - Recalculate unit_price from prescription lookup tables
   - Copy prescription data to order_item_prescriptions
   - Calculate treatments_cost correctly
   - Send order confirmation email via SendGrid
   - Clear user's cart
   - Redirect to /orders/[id]/confirmation
9. If failed:
   - Mark session as failed
   - Redirect to checkout with error message
   - Display Spanish error message to user
```

**Implementation Details**:
- **Payment Client**: `/lib/payment/paguelofacil-client.ts`
  - LinkDeamon API integration
  - Sandbox/production environment switching
  - 30-second timeout protection
  - Comprehensive error handling
- **API Routes**:
  - `POST /api/checkout/create-payment-link` - Creates payment link
  - `GET /api/checkout/payment-callback` - Handles redirect and order creation (411 lines)
  - `POST /api/checkout/session` - Saves session before redirect
  - `GET /api/checkout/session` - Retrieves session data
- **Session Management**: `checkout_sessions` table with 1-hour expiration
- **Duplicate Prevention**: Checks if session already completed
- **Prescription Cost Fix**: Recalculates prices from fresh lookup data (fixes cart caching issues)
- **Email Integration**: Triggers SendGrid order confirmation automatically

**Success Criteria**:
- ✅ Orders created successfully in database
- ✅ Order items copied with prescription data
- ✅ Cart cleared after order creation
- ✅ Payment integration works (PagueloFacil LinkDeamon)
- ✅ Payment callback handles success and failure
- ✅ Prescription costs recalculated accurately
- ✅ Order confirmation email sent automatically
- ✅ Error messages displayed in Spanish
- ✅ Session management prevents duplicates
- ✅ Currently in SANDBOX mode, production-ready

---

### 3.5 Order Confirmation & Email Notifications
**Priority**: 🔴 HIGH
**Estimated Time**: 1 day
**Status**: ✅ COMPLETE (Nov 9, Enhanced Nov 11, Email Complete Dec 27-28, 2025)

**Tasks**:
- [x] Create `/app/orders/[id]/confirmation/page.tsx`
- [x] Display order details with success message
- [x] Show order number prominently
- [x] Display shipping address
- [x] Display order items with prescription details
- [x] Show order summary and totals
- [x] Show payment status
- [x] Link to order details page
- [x] Link to continue shopping
- [x] **(Nov 11)** Fetch prescription metadata tables
- [x] **(Nov 11)** Display PrescriptionSummary with complete configuration
- [x] **(Nov 11)** Show prescription costs breakdown
- [x] **(Nov 11)** Fixed RLS policy issues with separate fetches
- [x] ✅ **(Dec 27-28)** Send order confirmation email via SendGrid (COMPLETE)
- [x] ✅ **(Dec 27-28)** Include prescription details in email (COMPLETE)
- [x] ✅ **(Dec 27-28)** Show itemized price breakdown in email (COMPLETE)

**Confirmation Page**:
- Success icon and confirmation message
- Order number displayed prominently
- Complete order breakdown with all details
- Prescription configuration shown for items
- Payment status badge
- "What's next?" section explaining next steps
- Actions: View order details, Continue shopping

**Email Notification System (SendGrid)**:
- **Order Confirmation Email** (Template: `d-717922b773cf45c9aec5e533e385dc0c`):
  - Sent automatically after successful payment in payment callback
  - Subject: "Confirmación de Pedido - {{orderNumber}}"
  - Includes:
    - Customer name and order details
    - Complete prescription configuration with Spanish names
    - Itemized price breakdown (base + lens type + index + view area)
    - Prescription formula display (OD/OS SPH, CYL, AXIS, PD, ADD)
    - Subtotal (base products only)
    - Lenses & Treatments cost (prescription addons)
    - Shipping cost and total
    - Shipping address
- **Order Shipped Email** (Template: `d-a47f4deaae4c4fcdb90b6ca700fa241d`):
  - Sent from admin panel when marking order as shipped
  - Subject: "Tu Pedido Ha Sido Enviado - {{orderNumber}}"
  - Includes:
    - Tracking number and carrier
    - Estimated delivery date
    - Item list with quantities
    - Shipping address
- **Implementation Files**:
  - `/lib/email/sendgrid-client.ts` - SendGrid API wrapper
  - `/lib/email/email-service.ts` - Email sending functions
  - `/lib/email/email-helpers.ts` - Prescription formatting utilities
  - `/app/api/orders/[id]/send-shipped-email/route.ts` - Shipping email API

**Success Criteria**:
- ✅ Order details display correctly
- ✅ User can navigate to order details
- ✅ Professional confirmation UI
- ✅ Order confirmation email sent automatically
- ✅ Prescription details formatted correctly in email
- ✅ Price breakdown shows itemized costs
- ✅ Shipping address displays properly (not N/A)
- ✅ Email subjects configured in SendGrid templates
- ✅ Emails work in both English and Spanish contexts

---

## Phase 4: User Order Management (Week 7)

**Goal**: Allow users to view and track their orders
**Status**: ✅ COMPLETE (Nov 9, 2025)

### 4.1 Order History (`/orders`)
**Priority**: 🟡 MEDIUM
**Estimated Time**: 2 days
**Status**: ✅ COMPLETE (Nov 9, 2025)

**Tasks**:
- [x] Create `/app/orders/page.tsx`
- [x] Fetch user's orders with RLS
- [x] Display orders list in card format
- [x] Show order number, date, status, and total
- [x] Display item count per order
- [x] Link to order details
- [x] Empty state with call to action
- [x] Support section with links

**Implementation Details**:
- Server component with authentication check
- Redirects to login if not authenticated
- Fetches orders sorted by creation date (newest first)
- Shows status badges with color coding
- Highlights payment status if pending
- Card-based layout for better UX
- "No orders" state with link to products

**Success Criteria**:
- ✅ Orders display correctly in cards
- ✅ Only user's orders visible (RLS enforced)
- ✅ Status badges show appropriate colors
- ✅ Empty state shows when no orders
- ✅ Links to order details work

---

### 4.2 Order Details (`/orders/[id]`)
**Priority**: 🟡 MEDIUM
**Estimated Time**: 1 day
**Status**: ✅ COMPLETE (Nov 9, Enhanced Nov 11, 2025)

**Tasks**:
- [x] Create `/app/orders/[id]/page.tsx`
- [x] Display full order details
- [x] Show prescription configuration from UUID-based system
- [x] Display prescription validation status
- [x] Show order status timeline/history
- [x] Display tracking information if available
- [x] Show complete order breakdown
- [x] Display shipping address and payment info
- [x] **(Nov 11)** Fetch prescription metadata tables
- [x] **(Nov 11)** Display PrescriptionSummary with complete details
- [x] **(Nov 11)** Show prescription with Spanish names
- [x] **(Nov 11)** Fixed RLS policy issues with separate fetches
- [ ] ⏳ Allow prescription re-upload if rejected (FUTURE)

**Implementation Details**:
- Server component with auth check
- Fetches order with all related data:
  - Order items with prescriptions
  - Prescription types, lens types, indexes, view areas
  - Order status history
  - Shipping address snapshot
- Status timeline with icons and timestamps
- Prescription details shown in blue info boxes
- Validation status badges
- Responsive grid layout (2 columns on desktop)
- Sidebar with order summary, address, and payment info

**Success Criteria**:
- ✅ Order details load correctly
- ✅ Status timeline displays with history
- ✅ Prescription configuration visible
- ✅ Prescription validation status shown
- ✅ Tracking info displayed when available
- ✅ Only order owner can view (RLS)
- ✅ 404 page if order not found
- ⏳ Re-upload prescription (FUTURE enhancement)

---

## Phase 5: Admin Dashboard (Week 8-9)

**Goal**: Allow admins to manage products, orders, and inventory
**Status**: ✅ COMPLETE (Nov 14, 2025)

### 5.1 Admin Authentication & Layout
**Priority**: 🔴 HIGH
**Estimated Time**: 1 day
**Status**: ✅ COMPLETE (Nov 11, 2025)

**Tasks**:
- [x] Create `/app/admin/layout.tsx`
- [x] Check `is_admin` flag from database
- [x] Redirect non-admins to home
- [x] Create admin navigation sidebar

**Implementation Details**:
- **Files Created**: `/app/admin/layout.tsx`
- **Authentication Gate**: Checks `auth.getUser()` and `is_admin` flag
- **Redirects**: Non-authenticated → `/auth/login?redirectTo=/admin`, Non-admin → `/`
- **Navigation**: Sidebar with links to Dashboard, Orders, Prescriptions, Products, Users, Config
- **User Display**: Shows admin name in header

**Success Criteria**:
- ✅ Only admins can access admin routes
- ✅ Navigation sidebar displays correctly
- ✅ Admin name shown in header
- ✅ Non-admin users redirected appropriately

---

### 5.2 Admin Dashboard (`/admin`)
**Priority**: 🟡 MEDIUM
**Estimated Time**: 2 days
**Status**: ✅ COMPLETE (Nov 11, 2025)

**Tasks**:
- [x] Create `/app/admin/page.tsx`
- [x] Display key metrics
- [x] Show recent orders
- [x] Show low stock alerts
- [x] Show prescriptions pending validation

**Implementation Details**:
- **Files Created**: `/app/admin/page.tsx`
- **Metrics Cards**:
  - Total orders count with status breakdown
  - Pending prescriptions count (validation_status = 'pending')
  - Monthly revenue calculation from completed orders
  - Low stock items (stock_quantity <= 10)
- **Recent Orders Section**: Last 5 orders with order number, status, total, date
- **Alerts Section**: Prescription validation alerts, low stock warnings
- **Quick Actions**: Links to Orders, Prescriptions, Products pages

**Success Criteria**:
- ✅ Dashboard displays key metrics
- ✅ Recent orders shown correctly
- ✅ Alerts display pending prescriptions
- ✅ Low stock items highlighted
- ✅ Quick actions work

---

### 5.3 Product Management (`/admin/products`)
**Priority**: 🔴 HIGH
**Estimated Time**: 3-4 days
**Status**: ✅ COMPLETE (Nov 14, 2025)

**Tasks**:
- [x] Create `/app/admin/products/page.tsx`
- [x] Display products list
- [x] Add/edit/delete products
- [x] Image upload (Supabase Storage)
- [x] Form validation

**Implementation Details** (Nov 14, 2025):
- **Files Created**:
  - `/app/admin/products/page.tsx` - Server component with auth gate
  - `/app/admin/products/ProductsClient.tsx` - Products list with filters
  - `/app/admin/products/new/page.tsx` - Add product page
  - `/app/admin/products/[id]/page.tsx` - Edit product page
  - `/components/admin/ProductForm.tsx` - Comprehensive product form (536 lines)
  - `/components/admin/ImageUploader.tsx` - Multi-image upload component
  - `/lib/types/product.ts` - TypeScript interfaces
  - `/lib/utils/product-helpers.ts` - Validation, formatting, image compression
- **Product List Features**:
  - Stats cards: Total, Active, Inactive, Low Stock, Out of Stock
  - Search by name or SKU
  - Filter by status: All, Active, Inactive, Low Stock, Out of Stock
  - Products table with images, SKU, name, brand, price, stock, status
  - Inline edit and delete actions
  - Delete with storage cleanup (removes images from bucket)
- **Product Form Features**:
  - Four sections: Basic Info, Classification, Physical Specs, Images
  - Fields: SKU, Name, Description, Price, Stock, Brand, Category, Material, Shape
  - Frame dimensions: Lens width, Bridge width, Temple length
  - Multi-image upload (up to 5 images, 10MB each)
  - Auto image compression before upload
  - First image automatically marked as primary (`is_primary: true`)
  - Existing images management (view, delete)
  - Real-time form validation
  - Supports both create and edit modes
- **Storage Integration**:
  - Supabase Storage bucket: `product-images` (public, 20MB limit)
  - RLS policies for admin-only upload/delete
  - Images stored with unique filenames: `{product_id}/{timestamp}-{random}.jpg`
  - Public URL generation for display
  - Cleanup on delete (removes from storage and database)
- **Database Schema Match**:
  - Fixed schema alignment: `product_images` table has `is_primary` (not `alt_text`)
  - TypeScript interfaces updated to match actual database columns
- **Next.js Image Configuration**:
  - Added Supabase storage domain to `next.config.ts` remote patterns
  - Enables Next.js Image optimization for product images

**Success Criteria**:
- ✅ Admins can view all products with filtering
- ✅ Admins can create new products
- ✅ Admins can edit existing products
- ✅ Admins can delete products (with storage cleanup)
- ✅ Multi-image upload works (up to 5 images)
- ✅ Images display in admin panel and public pages
- ✅ Form validation prevents invalid data
- ✅ Only admins can access (auth gate enforced)
- ✅ Stock tracking and low stock alerts

---

### 5.4 Prescription Configuration Management (`/admin/prescription-config`)
**Priority**: 🔴 HIGH
**Estimated Time**: 2-3 days
**Status**: ✅ COMPLETE (Nov 13, 2025)

**Tasks**:
- [x] Create `/app/admin/prescription-config/page.tsx`
- [x] Create `/app/admin/prescription-config/PrescriptionConfigClient.tsx`
- [x] Manage **prescription_types**:
  - Add/edit/delete types
  - Set name, slug, description
  - Set active status and display order
- [x] Manage **lens_types**:
  - Add/edit/delete lens types
  - Set price modifiers
  - Set applies_to flags (without_rx, single_vision, progressive)
  - Set active status and display order
- [x] Manage **lens_indexes**:
  - Add/edit/delete indexes
  - Set price modifiers
  - Set applies_to flags (single_vision, progressive)
  - Set active status and display order
- [x] Manage **view_areas**:
  - Add/edit/delete view areas
  - Set price modifiers
  - Set active status and display order
- [x] Real-time preview of pricing impact
- [x] Inline editing for all fields (name, description, price, flags)
- [x] Database migration: Added `applies_to_single_vision` and `applies_to_progressive` flags

**Implementation Details**:
- **Files Created**:
  - `/app/admin/prescription-config/page.tsx` - Server component with auth check
  - `/app/admin/prescription-config/PrescriptionConfigClient.tsx` - Full admin UI (1596 lines)
- **Database Migration**: `add_prescription_type_applicability_flags`
  - Added `applies_to_single_vision` and `applies_to_progressive` to lens_types
  - Added `applies_to_single_vision` and `applies_to_progressive` to lens_indexes
- **Features Implemented**:
  - Tabbed interface for 4 configuration tables
  - Full CRUD operations with inline editing
  - Edit mode with save/cancel buttons
  - Checkboxes for prescription type applicability ("Sin Receta", "Visión Sencilla", "Progresivo")
  - Real-time pricing preview
  - Active/inactive toggles with visual feedback
  - Reordering with up/down arrows
  - Edit button (✏️) that toggles between view and edit modes
- **User-Facing Form Updates**:
  - Updated `prescription-helpers.ts`: groupLensTypes() and getActiveLensIndexes() now filter by prescription type
  - Updated `PrescriptionForm.tsx`: Passes prescription type slug to helper functions
  - **Verified Working**: Lens types and indexes now filter correctly based on prescription type selection

**Success Criteria**:
- ✅ Admins can CRUD all prescription configuration options
- ✅ Price modifiers update correctly
- ✅ Display order affects frontend presentation
- ✅ Inline editing works for all fields
- ✅ Per-prescription-type flags work correctly
- ✅ Inactive items hidden from customers
- ✅ Changes reflect immediately in product pages
- ✅ User-facing form respects applicability flags

---

### 5.5 Order Management (`/admin/orders`)
**Priority**: 🔴 HIGH
**Estimated Time**: 3 days
**Status**: ✅ COMPLETE (Nov 11, 2025)

**Tasks**:
- [x] Create `/app/admin/orders/page.tsx`
- [x] Display all orders
- [x] Allow status updates
- [x] Allow adding tracking number
- [x] Show prescription details from UUID-based system

**Implementation Details**:
- **Files Created**:
  - `/app/admin/orders/page.tsx` - Orders list with filtering
  - `/app/admin/orders/[id]/page.tsx` - Order detail page
  - `/app/admin/orders/[id]/OrderStatusForm.tsx` - Status update form

**Orders List Features**:
- Status filter cards with counts (All, Pending, Processing, Shipped, Delivered, Cancelled)
- Search by order number
- Orders table displaying:
  - Order number (clickable)
  - Customer name and country
  - Date with Spanish locale formatting
  - Status and payment badges
  - Total amount
  - View details link

**Order Detail Features**:
- Order header with number, date, and status badge
- Status update form with:
  - Status dropdown (Pendiente, Procesando, Enviado, Entregado, Cancelado)
  - Tracking number input
  - Tracking carrier input
  - Notes textarea
  - Form validation and error handling
- Order items display with:
  - Product details (name, SKU, quantity, price)
  - Complete prescription details via PrescriptionSummary
  - Prescription validation status badges
- Status history timeline:
  - Visual timeline with icons
  - Status changes with timestamps
  - Notes and tracking information
  - Spanish locale date formatting
- Order summary sidebar:
  - Subtotal, lenses & treatments, shipping costs
  - Total with blue highlight
- Shipping address card
- Payment information card

**Database Operations**:
- Updates `orders` table with status, tracking_number, tracking_carrier
- Inserts into `order_status_history` with from_status, to_status, notes, tracking_number
- Page refresh after successful update to show new status

**Bug Fixes (Nov 11)**:
- Fixed RLS nested query issues by fetching prescriptions separately
- Fixed `tracking_carrier` column mismatch (only in orders table, not in order_status_history)
- Proper error handling with user-friendly Spanish messages

**Success Criteria**:
- ✅ Orders list displays with filtering and search
- ✅ Order details load with complete prescription data
- ✅ Status updates work correctly
- ✅ Tracking information can be added
- ✅ Status history timeline displays
- ✅ Prescription validation status visible
- ✅ Only admins can access (auth gate enforced)

---

### 5.6 Prescription Validation (`/admin/prescriptions`)
**Priority**: 🔴 HIGH
**Estimated Time**: 2 days
**Status**: ✅ COMPLETE (Nov 15, 2025)

**Tasks**:
- [x] Create `/app/admin/prescriptions/page.tsx`
- [x] Create `/app/admin/prescriptions/PrescriptionsClient.tsx`
- [x] Display prescriptions pending validation
- [x] Show prescription image
- [x] Display prescription configuration from UUID system
- [x] Add validation actions (approve/reject)
- [x] Fix data loading issue (prescriptions not displaying) - FIXED
- [ ] Notify customer via email (FUTURE)

**Implementation Details**:
- **Files Created**:
  - `/app/admin/prescriptions/page.tsx` - Server component with auth check (140 lines)
  - `/app/admin/prescriptions/PrescriptionsClient.tsx` - Full validation UI (670 lines)
- **Data Fetching**: Separate queries to avoid RLS nested query issues
  - Fetches order_item_prescriptions, order_items, orders, users separately
  - Combines data on server side
  - Fixed column name issue (name vs full_name)
- **Filter Tabs**:
  - All prescriptions
  - Pending (yellow badge with clock icon)
  - Approved (green badge with checkmark)
  - Rejected (red badge with X icon)
  - Shows count for each status
- **Prescription List Cards**:
  - Product name and SKU
  - Order number with badge
  - Customer name and email
  - Prescription configuration (type, lens type, index, view area)
  - Formula display with formatPrescriptionFormula helper
  - Image indicator if prescription image uploaded
  - Status badges with color coding
  - Validation notes (if any)
  - "Ver Detalles" button to open modal
- **Detailed Modal**:
  - Full product information
  - Complete prescription configuration with blue info box
  - Detailed formula table (OD/OS with SPH, CYL, AXIS, PD, ADD)
  - Full-size prescription image preview
  - For **pending** prescriptions:
    - Notes textarea (optional)
    - Approve button (green, CheckCircle2 icon)
    - Reject button (red, XCircle icon)
  - For **approved/rejected** prescriptions:
    - Validation status badge
    - Validation date (formatted in Spanish locale)
    - Validation notes
- **Database Operations**:
  - Updates `order_item_prescriptions` table
  - Sets `validation_status` (approved/rejected)
  - Records `validated_by_user_id`
  - Records `validated_at` timestamp
  - Saves `validation_notes`
  - Calls router.refresh() after update
**Bug Fixes (Nov 15)**:
  - ✅ Fixed data loading with admin client for auth.users
  - ✅ Fixed separate queries to avoid RLS nested query issues
  - ✅ Fixed data combination on server side
  - ✅ All prescriptions now display correctly

**Success Criteria**:
- ✅ Page loads without errors
- ✅ UI fully implemented with filters and modal
- ✅ Approve/reject actions implemented
- ✅ Database updates working
- ✅ Data loading working correctly
- ⏳ Email notifications (FUTURE)

---

### 5.7 Inventory Management (`/admin/inventory`)
**Priority**: 🔴 HIGH
**Estimated Time**: 2 days
**Status**: ✅ COMPLETE (Nov 15, 2025)

**Tasks**:
- [x] Create `/app/admin/inventory/page.tsx`
- [x] Create `/app/admin/inventory/InventoryClient.tsx`
- [x] Display products with stock info in table
- [x] Show stock status indicators (In Stock, Low Stock, Out of Stock)
- [x] Filter by stock status
- [x] Search products by name/SKU
- [x] Show low stock alerts section (via stats cards)
- [x] Create stock adjustment modal
- [x] Allow manual stock adjustments (add/remove/set)
- [x] Log inventory movements to database
- [x] Display inventory movement history per product
- [x] Show stock statistics cards

**Implementation Details** (Nov 15, 2025):
- **Files Created**:
  - `/app/admin/inventory/page.tsx` - Server component with auth gate (75 lines)
  - `/app/admin/inventory/InventoryClient.tsx` - Full inventory management UI (720 lines)
- **Stock Statistics Cards**:
  - Total Products count
  - In Stock count (stock > low_stock_threshold)
  - Low Stock count (0 < stock <= low_stock_threshold)
  - Out of Stock count (stock = 0)
- **Product Table Features**:
  - Display all products with stock levels
  - Show brand and category information
  - Color-coded stock quantities (green/yellow/red)
  - Stock status badges
  - Search by product name or SKU
  - Filter by stock status (All, In Stock, Low Stock, Out of Stock)
- **Stock Adjustment Modal**:
  - Three adjustment types:
    - **Add**: Increase stock by specified amount
    - **Remove**: Decrease stock (minimum 0)
    - **Set**: Set stock to exact value
  - Required reason field for audit trail
  - Real-time preview of new stock level
  - Client-side validation
- **Inventory Movement Logging**:
  - Records to `inventory_movements` table
  - Captures: product_id, movement_type, quantity_change, quantity_after, reason, created_by_user_id
  - movement_type = 'manual_adjustment' for admin changes
- **Inventory History Modal**:
  - Shows last 20 movements per product
  - Displays quantity change (+/-)
  - Shows movement type (Manual Adjustment, Order, ERP Sync, Return)
  - Includes reason for adjustment
  - Shows stock level after each movement
  - Formatted dates and times in Spanish locale
- **Navigation Integration**:
  - Added to admin sidebar with Warehouse icon
  - Accessible at `/admin/inventory`

**Success Criteria**:
- ✅ Admins can view all products with stock levels
- ✅ Stock statistics display correctly
- ✅ Search and filters work properly
- ✅ Stock adjustments can be made (add/remove/set)
- ✅ All movements logged to database
- ✅ Movement history displays correctly
- ✅ Real-time local state updates
- ✅ Only admins can access (auth gate enforced)
- ✅ TypeScript compilation successful
- ✅ Responsive design works on mobile and desktop

---

### 5.8 User Management (`/admin/users`)
**Priority**: 🟡 MEDIUM
**Estimated Time**: 1-2 days
**Status**: ✅ COMPLETE (Nov 15, 2025)

**Tasks**:
- [x] Create `/app/admin/users/page.tsx`
- [x] Create `/app/admin/users/UsersClient.tsx`
- [x] Display all users in table format
- [x] Show user statistics cards (Total Users, Admins, Customers)
- [x] Search users by name, email, or phone
- [x] Filter by user type (All, Admins, Customers)
- [x] View user details in modal (orders count, addresses)
- [x] Toggle admin status (promote/demote)
- [x] View user activity (order count)
- [x] Translate to Spanish

**Implementation Details**:
- **Files to Create**:
  - `/app/admin/users/page.tsx` - Server component with auth gate
  - `/app/admin/users/UsersClient.tsx` - Client component with user management UI
- **User Table Features**:
  - Display all users with name, email, phone, country
  - Show admin badge for admin users
  - Show registration date
  - Show total orders count
  - Color-coded user types
- **Search & Filters**:
  - Search by name, email, or phone
  - Filter by user type (All, Admins, Customers)
  - Real-time filtering
- **Admin Management**:
  - Toggle `is_admin` flag
  - Confirmation dialog before changing admin status
  - Prevent demoting yourself (safety check)
  - Database update with error handling
- **User Details Modal**:
  - Complete user information
  - Order history count
  - Prescription count
  - Saved addresses count
  - Registration date
  - Last activity
- **Statistics Cards**:
  - Total Users count
  - Admins count
  - Customers count (non-admin users)

**Database Operations**:
- Fetch users from `users` table
- Fetch user emails from `auth.users` using admin client
- Update `is_admin` flag in `users` table
- Count orders per user from `orders` table

**Implementation Complete (Nov 15, 2025)**:
- **Files Created**: `/app/admin/users/page.tsx`, `/app/admin/users/UsersClient.tsx`
- Fetches users from `users` table with admin client for emails
- Counts orders per user for activity display
- Statistics cards showing Total, Admins, Customers
- Search by name, email, or phone in real-time
- Filter by All, Admins, or Customers
- Toggle admin status with confirmation dialog
- Safety check prevents self-demotion
- User details modal with complete information
- All text translated to Spanish

**Success Criteria**:
- ✅ Admins can view all users
- ✅ User statistics display correctly
- ✅ Search functionality works
- ✅ Admin promotion/demotion works
- ✅ Safety checks prevent self-demotion
- ✅ User details display correctly
- ✅ Only admins can access (auth gate enforced)
- ✅ All text in Spanish
- ✅ TypeScript compilation successful
- ✅ Responsive design works

---

### 5.9 ERP Integration & Automated Inventory Sync (`/admin/erp-sync`)
**Priority**: 🔴 HIGH
**Estimated Time**: 4-5 days
**Status**: ✅ COMPLETE (Dec 2025 - Jan 2026)

**Tasks**:
- [x] Create dubros.com API client
- [x] Implement async job queue for long-running syncs
- [x] Create admin UI for manual sync triggering
- [x] Implement real-time progress tracking
- [x] Sync products, brands, categories, materials from dubros
- [x] Calculate pricing with tier-based markup
- [x] Update inventory stock levels
- [x] Log inventory movements for audit trail
- [x] Handle errors and validation failures
- [x] Preserve manual price overrides
- [x] Deactivate products missing from sync
- [x] Create job status polling endpoint

**Implementation Details** (Dec 2025 - Jan 2026):
- **Architecture**: Job queue-based async processing (handles 4,000+ products without timeout)
- **Core Files**:
  - `/lib/erp/dubros-client.ts` - API client for dubros.com with auth token
  - `/lib/erp/types.ts` - TypeScript interfaces for ERP entities
  - `/lib/erp/product-mapper.ts` - Data transformation & validation
  - `/lib/services/erp-sync-service.ts` - Main sync orchestrator with 9-step progress
- **API Routes**:
  - `POST /api/admin/erp-sync` - Trigger manual sync (creates job)
  - `GET /api/admin/erp-sync-status/[id]` - Job status polling (2-second intervals)
  - `GET /api/admin/erp-sync/jobs/[id]` - Job details endpoint
- **Admin UI**:
  - `/app/admin/erp-sync/page.tsx` - Server component with auth gate
  - `/app/admin/erp-sync/ErpSyncClient.tsx` - Client UI with real-time polling
  - Quick limit buttons: 50, 100, 500, All products (~4,138)
  - Real-time progress bar (0-100%)
  - Current step description display
  - Item counter (current / total)
  - Cancel button for mid-sync termination
  - Sync history table with status badges
- **Database Tables**:
  - `erp_sync_logs` - Audit trail of all syncs
  - `erp_sync_errors` - Detailed error tracking
  - `erp_sync_jobs` - Job queue with progress tracking
  - `inventory_movements` - Stock change logging (movement_type: 'erp_sync')

**Sync Process (9 Steps)**:
```
Step 1 (5%):   Initialize sync log
Step 2 (10%):  Load pricing tiers from config
Step 3 (15%):  Sync lookup tables (categories, brands, materials)
Step 4 (25%):  Fetch products from dubros.com API (paginated)
Step 5 (40%):  Map products and calculate pricing
Step 6 (50%):  Upsert products to database (batch processing)
Step 7 (95%):  Deactivate missing products (in DB but not in sync)
Step 8 (95%):  Log mapping errors to database
Step 9 (100%): Finalize sync log with results
```

**Pricing Calculation**:
- Base cost from dubros.com (requires bearer token)
- Add flat shipping cost ($25 per product)
- Determine pricing tier (budget/mid_range/premium)
- Apply markup multiplier from tier
- Calculate retail price, profit, and margin
- Preserve manual price overrides (`is_price_override = true`)

**Features**:
- **Pagination**: Offset-based with automatic page fetching
- **Validation**: Skips products with missing required fields
- **Error Tracking**: Detailed error logs with reason codes
- **Progress Updates**: Every 50 products + every batch
- **Product Deactivation**: Sets `is_active = false` for missing products
- **Stock Logging**: Records each stock change in `inventory_movements`
- **Duplicate Prevention**: Uses `erp_id` as conflict key
- **Image Sync**: Fetches low-res + high-res images from dubros CDN

**Performance**:
- Full sync (4,138 products): ~2-5 minutes
- Timeout protection: 3 minutes for API calls
- Non-blocking: Job runs in background
- Real-time polling: Every 2 seconds from frontend

**Environment Variables**:
```
DUBROS_API_URL=https://dubros.com
DUBROS_BEARER_TOKEN=<secret-token-for-price-field>
```

**Success Criteria**:
- ✅ Manual sync triggers successfully from admin panel
- ✅ Job queue handles 4,000+ products without timeout
- ✅ Real-time progress tracking works (9 steps)
- ✅ Products upserted with pricing calculations
- ✅ Stock levels update correctly
- ✅ Inventory movements logged for audit trail
- ✅ Lookup tables sync (brands, categories, materials)
- ✅ Product images fetched and stored
- ✅ Missing products deactivated automatically
- ✅ Manual price overrides preserved
- ✅ Error tracking captures validation failures
- ✅ Admin UI displays sync history and errors
- ✅ Cancel functionality stops sync mid-process
- ✅ Scheduled sync infrastructure ready (not activated yet)

---

## Phase 6: Additional Features (Week 10)

### 6.1 Wishlist (`/wishlist`)
**Priority**: 🟢 LOW
**Estimated Time**: 2 days

### 6.2 Product Reviews
**Priority**: 🟢 LOW
**Estimated Time**: 2 days

### 6.3 Search Functionality
**Priority**: 🟡 MEDIUM
**Estimated Time**: 2 days

---

## Phase 7: Polish & Testing (Week 11-12)

### 7.1 UI/UX Polish
**Priority**: 🟡 MEDIUM
**Estimated Time**: 3 days

### 7.2 Rate Limiting & Security
**Priority**: 🔴 HIGH
**Estimated Time**: 2 days

### 7.3 Testing
**Priority**: 🔴 HIGH
**Estimated Time**: 3-4 days

**Additional Tests for UUID-based System**:
- [ ] Test prescription configuration with all combinations
- [ ] Test admin editing of prescription tables
- [ ] Test pricing updates when admin changes price_modifiers
- [ ] Test cart transfer with complex prescriptions
- [ ] Test order creation with UUID-based prescriptions

### 7.4 Documentation
**Priority**: 🟡 MEDIUM
**Estimated Time**: 2 days

**Documentation Updates Required**:
- [ ] Update DATABASE-SCHEMA.md with UUID-based system
- [ ] Update DATABASE-ERD.md with current structure
- [ ] Document admin prescription configuration workflow
- [ ] Update API documentation

---

## Phase 8: Pre-Launch (Week 13)

### 8.1 Deployment Preparation
**Priority**: 🔴 HIGH
**Estimated Time**: 2 days

### 8.2 Final Security Check
**Priority**: 🔴 HIGH
**Estimated Time**: 1 day

### 8.3 Launch Checklist
**Priority**: 🔴 HIGH
**Estimated Time**: 1 day

---

## Timeline Summary

| Phase | Duration | Status | Key Deliverables |
|-------|----------|--------|------------------|
| **Phase 1**: Product Catalog | 1-2 weeks | ✅ Complete | Product detail, Cart, Prescription flow |
| **Phase 2**: Authentication | 1-2 weeks | ✅ Complete | Login, Register, Cart Transfer, Profile |
| **Phase 3**: Checkout & Payment | 2-3 weeks | ✅ Complete | Multi-step checkout, PagueloFacil integration, Email notifications |
| **Phase 4**: Order Management | 1 week | ✅ Complete | Order history, Order details |
| **Phase 5**: Admin Dashboard | 2-3 weeks | ✅ Complete | ✅ Dashboard, ✅ Orders, ✅ Config, ✅ Products, ✅ Prescriptions, ✅ Inventory, ✅ Users, ✅ ERP Sync |
| **Phase 6**: Additional Features | 1 week | ⏳ Pending | Wishlist, reviews, search (optional) |
| **Phase 7**: Polish & Testing | 2 weeks | ⏳ Pending | UI polish, testing, security |
| **Phase 8**: Pre-Launch | 1 week | ⏳ Pending | Static pages, deployment, final checks |
| **TOTAL** | **11-14 weeks** | **~95% Complete** | **Customer MVP ✅, Admin Panel ✅ (All 9 Features), Payment ✅, Email ✅, ERP ✅** |

---

## Risk Management

### High-Risk Items

1. **Production Deployment**
   - Risk: Environment configuration, DNS setup, SSL certificates
   - Mitigation: Use Vercel for hosting, test in staging environment first

2. **Static/Legal Pages**
   - Risk: Incomplete legal compliance for e-commerce
   - Mitigation: Consult legal expert, use standard templates

### Mitigated Risks ✅
- ~~Cart Transfer & Merge Logic~~ - ✅ COMPLETE and tested
- ~~Prescription Data Structure~~ - ✅ COMPLETE with UUID system
- ~~Database Cleanup~~ - ✅ COMPLETE
- ~~**Payment Integration (PagueloFacil)**~~ - ✅ COMPLETE (Dec 2025 - Jan 2026)
- ~~**Email Notifications**~~ - ✅ COMPLETE with SendGrid (Dec 27-28, 2025)
- ~~**ERP Integration**~~ - ✅ COMPLETE with dubros.com sync (Dec 2025 - Jan 2026)
- ~~**Prescription Configuration Management**~~ - ✅ COMPLETE with admin CRUD and validation
- ~~**Inventory Management**~~ - ✅ COMPLETE with stock logging and ERP sync

---

## Success Metrics

### MVP Launch Criteria
- ✅ Users can browse products without authentication
- ✅ Users can register and login
- ✅ Users can add products to cart (with prescriptions)
- ✅ Cart transfers automatically on authentication
- ✅ Users can complete checkout with payment (PagueloFacil)
- ✅ Orders are created with UUID-based prescriptions
- ✅ Customers receive order confirmation emails
- ✅ Customers receive shipping notification emails
- ✅ Admins can manage products
- ✅ Admins can manage prescription configuration
- ✅ Admins can manage orders
- ✅ Admins can validate prescriptions
- ✅ Admins can sync inventory from ERP (dubros.com)
- ✅ All security vulnerabilities addressed
- ✅ Site is responsive and accessible
- ✅ Performance is acceptable (< 2s page loads)
- [ ] Static/legal pages created (Contact, About, Policies, Shipping Info)
- [ ] Production environment configured

---

## Technical Stack Summary

**Frontend**:
- Next.js 16.0.1 (App Router with Turbopack)
- React
- TypeScript
- Tailwind CSS
- shadcn/ui components

**Backend**:
- Supabase (PostgreSQL + Auth + Storage)
- Row Level Security (RLS)
- UUID-based foreign keys (no ENUMs)
- Job Queue system for async processing

**Payments**:
- PagueloFacil LinkDeamon API (redirect-based, PCI-compliant)
- Currently in SANDBOX mode, production-ready

**Email**:
- SendGrid API (transactional emails)
- Dynamic templates with prescription details
- Order confirmation & shipping notifications

**ERP Integration**:
- dubros.com API integration
- Async job queue for inventory sync
- Automatic pricing calculation with tier-based markup

**Hosting**:
- Vercel (recommended for Next.js)

**External Services**:
- Authentication: Supabase Auth
- File Storage: Supabase Storage
- Email: SendGrid API
- Payment Gateway: PagueloFacil
- ERP: dubros.com API
- Analytics: TBD
- Error Tracking: TBD

---

## Next Immediate Steps

### ✅ Completed (All Core Features)
1. ✅ ~~**Complete Phase 5.1-5.8**: All admin features~~ - DONE (Nov 2025)
2. ✅ ~~**Complete Phase 5.9**: ERP integration and inventory sync~~ - DONE (Dec 2025 - Jan 2026)
3. ✅ ~~**Complete Phase 3.4**: Payment integration (PagueloFacil)~~ - DONE (Dec 2025 - Jan 2026)
4. ✅ ~~**Complete Phase 3.5**: Email notifications (SendGrid)~~ - DONE (Dec 27-28, 2025)
5. ✅ ~~**Fix prescription display and email bugs**~~ - DONE (Dec 2025)

### 🟡 Remaining for MVP Launch (Next 1-2 weeks)
1. **Static/Legal Pages** (Spanish) - HIGH PRIORITY
   - Contact page with form
   - About Us page
   - Privacy Policy
   - Terms & Conditions
   - Return/Refund Policy
   - Shipping Information
   - Size Guide for frames

2. **Production Environment Setup** - HIGH PRIORITY
   - Switch PagueloFacil to production mode
   - Configure production Supabase instance (or keep current)
   - Set up custom domain and SSL
   - Configure environment variables for production
   - Test full order flow in production

3. **Final Testing** - MEDIUM PRIORITY
   - End-to-end payment flow testing
   - Email delivery testing
   - ERP sync testing with full product catalog
   - Mobile responsiveness testing
   - Performance optimization

4. **Optional Enhancements** (Can be done post-launch)
   - Analytics setup (Google Analytics or similar)
   - Error tracking (Sentry)
   - Scheduled ERP sync (cron job or edge function)
   - Additional email templates (password reset, etc.)

---

## Notes

- This plan reflects the current state as of **January 13, 2026**
- Major refactoring completed: ENUM → UUID-based system
- Cart transfer system fully functional
- Database is clean and production-ready
- **Admin Dashboard**: ✅ 100% Complete - All 9 admin features implemented
  - ✅ Dashboard (metrics & alerts) - Spanish
  - ✅ Order management (status updates, tracking) - Spanish
  - ✅ Product management (CRUD with image upload)
  - ✅ Prescription configuration (4 admin tables)
  - ✅ Prescription validation (approve/reject with notes)
  - ✅ Inventory management (stock adjustments & history)
  - ✅ User management (admin promotion/demotion)
  - ✅ ERP integration (dubros.com sync with job queue)
  - ✅ Spanish translation (Dashboard, Orders, Inventory, Prescriptions, Users)
- **Customer Features**: ✅ 100% Complete
  - Product catalog, cart, checkout, orders, prescriptions, profile
- **Payment Integration**: ✅ COMPLETE
  - PagueloFacil LinkDeamon API fully integrated
  - Redirect-based flow (PCI-compliant)
  - Session management with 1-hour expiration
  - Order creation with prescription data transfer
  - Currently in SANDBOX mode, production-ready
- **Email Notifications**: ✅ COMPLETE
  - SendGrid integration with dynamic templates
  - Order confirmation emails with prescription details
  - Shipping notification emails with tracking info
  - Itemized price breakdowns
  - Spanish formatting and subjects
- **ERP Integration**: ✅ COMPLETE
  - dubros.com API integration with async job queue
  - Manual sync from admin panel
  - Real-time progress tracking (9 steps)
  - Handles 4,000+ products without timeout
  - Automatic pricing calculation with tier-based markup
  - Inventory movement logging
- **MVP Launch Readiness**: ~95% complete
  - ✅ All customer features working
  - ✅ All admin features working
  - ✅ Payment processing working (PagueloFacil)
  - ✅ Email notifications working (SendGrid)
  - ✅ ERP sync working (dubros.com)
  - ⏳ Static/legal pages needed
  - ⏳ Production environment setup needed

**Remaining Work for Launch**:
1. Static/legal pages in Spanish (1-2 days)
2. Production environment setup (1 day)
3. Final testing and QA (2-3 days)
4. **Estimated time to launch**: 1-2 weeks

---

**Last Updated**: January 13, 2026
**Next Review**: January 20, 2026
**Phase 3 Completion**: 100% (Payment & Email)
**Phase 5 Completion**: 100% (9/9 features complete including ERP)
**Overall Completion**: ~95%
