# ZERO E-COMMERCE PLATFORM - MoSCoW PRIORITIZATION

**Version**: MVP 1.1
**Date**: November 6, 2025 (Updated)
**Project**: ZERO - B2C E-commerce para Productos Ópticos
**Status**: Phase 1 Complete | Phase 2 Partial | Phase 3 Next

---

## Legend

- **M - MUST HAVE**: Critical for MVP launch - business won't work without it
- **S - SHOULD HAVE**: Important but MVP can launch without it
- **C - COULD HAVE**: Desirable but not necessary for initial launch
- **W - WON'T HAVE**: Explicitly out of scope for MVP

---

## 🔴 MUST HAVE (M) - CRITICAL FOR MVP LAUNCH

### 1. Authentication & User Management

- **[M]** Customer registration/login (email/password via Supabase Auth)
- **[M]** Admin login with role-based access (RLS policies)
- **[M]** Password reset functionality
- **[M]** Login required at checkout (browse freely, cart in localStorage)
- **[M]** localStorage cart management and transfer on registration
- **[M]** Basic profile management (name, email, phone, country)
- **[M]** Country field REQUIRED in all address forms

### 2. Product Catalog & Discovery (✅ Phase 1 Complete - Nov 6, 2025)

- **[M]** ✅ Product listing page (responsive grid layout)
- **[M]** ✅ Product detail page with:
  - Multiple images (3-5) with zoom
  - Name, SKU, brand, price (USD)
  - Description & specifications
  - Frame dimensions (lens width, bridge, temple)
  - Stock status
- **[M]** ✅ Product categories (Gafas de Sol, Gafas con Receta)
- **[M]** ✅ Auto-hide out-of-stock products
- **[M]** ⏳ Text-based search functionality (TODO)
- **[M]** ⏳ Filter products by: (TODO)
  - Brand (Ray-Ban, Oakley, etc.)
  - Lens size
  - Material (acetate, metal, titanium)
  - Frame shape (round, square, aviator, cat-eye)
- **[M]** ✅ Category-based navigation
- **[M]** ⏳ Basic sorting (price low-to-high, high-to-low, newest) (TODO)

### 3. Shopping Cart & Checkout

**Cart Features:**
- **[M]** ✅ Shopping cart (add/remove/update quantities)
- **[M]** ✅ Display cart subtotal with prescription & treatments pricing
- **[M]** ⏳ Persist cart for logged-in users (Supabase) - Phase 2
- **[M]** ✅ localStorage-based cart for unauthenticated users (enhanced with prescription data)
- **[M]** ⏳ Cart transfer from localStorage to database on registration/login - Phase 2
- **[M]** ⏳ Cart merge logic (handle duplicate items) - Phase 2
- **[M]** ✅ Display prescription & lens treatments per item (with PrescriptionSummary component)

**Prescription Management (✅ RESTRUCTURED - Implemented Nov 7, 2025):**
- **[M]** ✅ Admin-editable table structure (4 separate tables):
  - `prescription_types` - Single Vision, Progressive, Non-Prescription
  - `lens_types` - Frame Only, Blue Light, Photochromatic, Anti-Reflective, etc.
  - `lens_indexes` - Mid-Index (1.50), High-Index (1.60), Ultra-Thin (1.67/1.74)
  - `view_areas` - Standard View, 40% Broader View
- **[M]** ✅ Multi-step prescription flow with Frame Only option
- **[M]** ✅ Step 1: Frame Only OR Add Prescription Lenses
- **[M]** ✅ Step 2: Prescription type selection (Single Vision/Progressive/Non-Prescription)
- **[M]** ✅ Step 3: Formula entry (SPH, CYL, AXIS, PD, ADD) OR image upload
- **[M]** ✅ Step 4: Lens type selection (context-aware based on flow)
- **[M]** ✅ Step 5: Lens index selection (for prescription types)
- **[M]** ✅ Step 6: View area selection (for progressive only)
- **[M]** ✅ Progressive disclosure UI with back/next navigation
- **[M]** ✅ Real-time price calculation with itemized breakdown
- **[M]** ✅ Field validation (SPH: -20 to +20, CYL: -4 to +4, AXIS: 0-180, PD: 20-80mm)
- **[M]** ✅ Image upload (JPG, PNG, PDF - max 5MB, compressed to <500KB)
- **[M]** ✅ Client-side image compression before upload
- **[M]** ✅ Associate with cart item (localStorage for unauthenticated users)
- **[M]** ✅ Database: 4 admin tables with RLS policies and foreign keys
- **[M]** ✅ Migration: 20251107000000_restructure_prescription_system.sql

**Lens Treatments (⚠️ DEPRECATED):**
- **[M]** ⚠️ Merged into lens_types table
- **[M]** ⚠️ Legacy lens_treatments table exists for backward compatibility
- **[M]** ⏳ Cleanup phase needed (remove old tables and ENUMs)

**Checkout Flow (⏳ Phase 3 - NOT STARTED):**
- **[M]** ⏳ Step 1: Review cart
- **[M]** ⏳ Step 2: Shipping address (with REQUIRED country dropdown)
- **[M]** ⏳ Step 3: Shipping method & cost (varies by country)
- **[M]** ⏳ Step 4: Payment (PagueloFacil integration - USD)
- **[M]** ⏳ Step 5: Order confirmation
- **[M]** ⏳ Address form with required fields including Country
- **[M]** ⏳ International shipping cost calculation
- **[M]** ⏳ Order confirmation email (Spanish)

### 4. Admin - Product Management

- **[M]** Create product (name, SKU, brand, description, price, specs)
- **[M]** Edit product (update details, images, stock)
- **[M]** Delete product (soft delete/mark inactive)
- **[M]** View products (paginated list, search, filter)
- **[M]** Upload multiple images (up to 5) to Supabase Storage
- **[M]** Category management (create/edit/delete, assign products)
- **[M]** Lens treatment management (create/edit/delete, set pricing)

### 5. Admin - Order Management

- **[M]** View all orders (paginated table)
- **[M]** Filter orders (status, date range, customer)
- **[M]** Search orders by order number
- **[M]** Order details view:
  - Customer info, shipping address
  - Order items with prescription & treatments
  - Order total breakdown
  - Payment status
- **[M]** Update order status manually
- **[M]** Add tracking number for shipped orders
- **[M]** Add internal notes
- **[M]** Prescription validation:
  - View manual entry vs uploaded image
  - Flag discrepancies
  - Approve/reject prescription
- **[M]** Order shipped notification email with tracking

### 6. Admin - Inventory Management

- **[M]** View inventory levels for all products
- **[M]** Low stock alerts (configurable threshold < 5 units)
- **[M]** Manual stock adjustment with reason notes
- **[M]** Stock movement history (orders, manual adjustments, ERP sync)

**ERP Integration:**
- **[M]** Automated sync every 48 hours (2 days)
- **[M]** Fetch inventory from ERP endpoint (JSON)
- **[M]** Update stock quantities by SKU
- **[M]** Auto-hide/show products based on stock
- **[M]** Sync logging (timestamp, status, records)
- **[M]** Log errors and skipped items
- **[M]** Manual sync trigger button

### 7. Static Pages & Legal (Spanish)

- **[M]** Contact/Support page:
  - Contact form (name, email, country, message)
  - Phone number (clickable tel: link)
  - WhatsApp number (clickable link)
  - NO live chat
- **[M]** Return/Refund Policy
- **[M]** Privacy Policy (required for prescription data)
- **[M]** Terms of Service (international shipping terms)
- **[M]** About Us (ZERO brand story)
- **[M]** Shipping Information (Latin America shipping)

### 8. Technical Infrastructure

- **[M]** Next.js 14+ with App Router
- **[M]** Supabase (database, auth, storage)
- **[M]** Railway deployment
- **[M]** shadcn/ui + Tailwind CSS
- **[M]** Responsive design (mobile, tablet, desktop)
- **[M]** Spanish language UI/UX
- **[M]** Email notifications (SendGrid or Supabase Edge Functions)
- **[M]** Image optimization (Next.js Image)
- **[M]** SEO-friendly URLs

---

## 🟡 SHOULD HAVE (S) - IMPORTANT BUT NOT CRITICAL FOR LAUNCH

### 1. Customer Features

- **[S]** Order history page (view past orders)
- **[S]** Order details (order number, products, prescription, status)
- **[S]** Order status tracking (Pending, Processing, Shipped, Delivered)
- **[S]** Welcome email on registration

### 2. Admin Features

**Bulk Product Operations:**
- **[S]** CSV upload for creation/updates
- **[S]** Download CSV template
- **[S]** Validation & error reporting
- **[S]** Background processing for large files

**Customer Management:**
- **[S]** View registered customers list
- **[S]** Search by name/email
- **[S]** View customer profile (orders, total spent, addresses)
- **[S]** View customer's active cart
- **[S]** View order history

**Product Attributes Management:**
- **[S]** Manage frame materials
- **[S]** Manage frame shapes
- **[S]** Manage lens size options

### 3. Product Discovery

- **[S]** Size guide page:
  - Explain frame measurements
  - Visual guide for measuring face width
  - Fit recommendations

---

## 🟢 COULD HAVE (C) - NICE TO HAVE, NOT ESSENTIAL

### 1. Analytics & Reporting

**Admin Analytics Dashboard:**
- **[C]** Revenue metrics (7 days, 30 days, all time)
- **[C]** Number of orders
- **[C]** Average order value
- **[C]** Total customers
- **[C]** Sales over time (line chart)
- **[C]** Orders by status (pie chart)
- **[C]** Top products (best-sellers)
- **[C]** Product view counts
- **[C]** Cart abandonment rate
- **[C]** Conversion rate

### 2. Customer Engagement

**Wishlist:**
- **[C]** Add/remove products
- **[C]** View saved items
- **[C]** Move to cart
- **[C]** Persist in Supabase

**Product Reviews & Ratings:**
- **[C]** Leave reviews (requires login + purchase)
- **[C]** Star rating (1-5)
- **[C]** Written review
- **[C]** Display average rating
- **[C]** Admin moderation
- **[C]** Filter by star rating

**Abandoned Cart Recovery:**
- **[C]** Email sent 24h after abandonment
- **[C]** Include cart items & checkout link
- **[C]** Track open/click rates
- **[C]** Unsubscribe option

---

## ⚫ WON'T HAVE (W) - EXPLICITLY OUT OF SCOPE FOR MVP

### Features Not Included in MVP

- **[W]** Live chat support (Use WhatsApp + Phone instead)
- **[W]** Social media login (Facebook, Google OAuth)
- **[W]** Loyalty/rewards program
- **[W]** Gift cards or promo codes
- **[W]** Multiple currencies (USD only for MVP)
- **[W]** Multi-language support (Spanish only for MVP)
- **[W]** Try-on AR/VR features
- **[W]** Advanced AI recommendations
- **[W]** Subscription/recurring orders
- **[W]** Affiliate program
- **[W]** Advanced inventory forecasting
- **[W]** Multi-warehouse inventory
- **[W]** Custom frame design tool
- **[W]** In-store pickup option
- **[W]** Real-time inventory sync (2-day sync is sufficient)
- **[W]** Mobile app (web-only for MVP)
- **[W]** Advanced analytics/BI dashboards
- **[W]** CRM integration
- **[W]** Marketing automation
- **[W]** A/B testing framework

---

## Summary Statistics

**Total Features Categorized**: ~85+

| Priority | Count | Percentage | Description |
|----------|-------|------------|-------------|
| **MUST HAVE (M)** | ~60 features | 71% | Core MVP - Cannot launch without |
| **SHOULD HAVE (S)** | ~15 features | 18% | Launch if time permits |
| **COULD HAVE (C)** | ~10 features | 11% | Post-MVP iteration |
| **WON'T HAVE (W)** | ~20 features | - | Explicitly excluded |

**MVP Complexity**: Medium-High
**Estimated Timeline**: 8-12 weeks (for MUST + SHOULD features)
**Tech Debt Risk**: Low (using proven stack: Next.js + Supabase)

---

## Launch Criteria (Definition of Done for MVP)

**Phase 1 - Product Catalog (✅ COMPLETE as of Nov 6, 2025):**
- ✅ Customer can browse products (basic layout complete, filters/search TODO)
- ✅ Customer can add prescription glasses to cart with ENHANCED prescription data (3 types, lens config, pricing)
- ✅ Customer can select lens treatments (integrated with prescription pricing)
- ✅ Cart displays prescription summary and dynamic pricing

**Phase 2 - Authentication (⏳ PARTIAL):**
- ⏳ Customer registration/login (auth routes exist, needs testing)
- ⏳ Cart transfer from localStorage to database (NOT IMPLEMENTED)
- ⏳ Profile management (NOT IMPLEMENTED)

**Phase 3 - Checkout & Orders (❌ NOT STARTED):**
- ⏳ Customer can checkout with international shipping (country required)
- ⏳ Customer receives order confirmation email
- ⏳ Payment integration working (PagueloFacil - USD)
- ⏳ Order processing workflow

**Admin Features (❌ NOT STARTED):**
- ⏳ Admin can create/edit products with brand field
- ⏳ Admin can process orders & validate prescriptions
- ⏳ Admin can update order status & add tracking
- ⏳ Admin can manage inventory (manual + ERP sync every 2 days)

**Infrastructure & Content (⏳ PARTIAL):**
- ⏳ All static/legal pages present (Spanish)
- ⏳ Email notifications working (order confirmation, shipping)
- ✅ Platform responsive (mobile, tablet, desktop)
- ✅ Platform fully in Spanish (UI components)

---

## Risk Mitigation

### HIGH RISK

- **Payment integration (PagueloFacil)** - Test thoroughly
- **ERP integration (JSON format TBD)** - Need API spec ASAP
- **Prescription validation workflow** - User testing required
- **International shipping calculation** - Verify rates per country

### MEDIUM RISK

- **Image upload/storage** - Supabase Storage limits
- **Email deliverability** - SendGrid setup
- **Performance with large product catalogs** - Optimize queries

### LOW RISK

- **Authentication** - Supabase Auth is mature
- **UI components** - shadcn/ui well-tested
- **Deployment** - Railway is stable

---

## Next Steps

1. **Finalize ERP JSON structure** - Critical for inventory sync
2. **Set up PagueloFacil payment gateway** - Test in sandbox
3. **Design database schema** - Based on MUST HAVE features
4. **Create development roadmap** - Sprint planning for 8-12 weeks
5. **Set up development environment** - Next.js + Supabase + Railway
6. **Begin with authentication & product catalog** - Foundation first

---

**Document Version**: 1.1
**Last Updated**: November 6, 2025
**Status**: Phase 1 Complete - Enhanced Prescription System Implemented
