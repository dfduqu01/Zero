# ZERO MVP - Product Requirements Document

## Project Overview
**Product Name**: ZERO
**Version**: MVP 1.1 (Updated Nov 6, 2025)
**Platform**: B2C E-commerce para Productos Ópticos
**Target Market**: Latinoamérica (español)
**Tech Stack**: Next.js + Supabase
**Deployment**: Railway
**Repository**: GitHub
**Authentication**: Supabase Auth
**UI Components**: shadcn/ui + Tailwind CSS

**Latest Update**: ✨ Enhanced Prescription System implemented with multi-step flow, lens configuration options, and dynamic pricing (Section 3.2)

## Brand Story
Durante más de 25 años hemos conectado fábricas, marcas y ópticas en toda Latinoamérica. Tras décadas trabajando B2B, surge la pregunta: ¿Por qué el consumidor final sigue tan lejos de todo esto?

Así nació **ZERO** - una nueva marca que quiere empezar desde cero:
- **Cero** intermediarios
- **Cero** complicaciones
- **Cero** límites para elegir lo que realmente te queda bien

ZERO es la evolución natural de una historia familiar, llevando experiencia y conocimiento directamente a las personas usando tecnología, diseño y décadas de experiencia acumulada.

## Language & Localization
**Primary Language**: Español (Spanish)
**Target Region**: Latinoamérica
**Currency**: USD (widely used in Latin American e-commerce)
**UI/UX Considerations**:
- All user-facing content must be in Spanish
- Product descriptions, categories, and navigation in Spanish
- Email notifications in Spanish
- Error messages and form validations in Spanish
- Admin interface in Spanish
- Date formats: DD/MM/YYYY (Latin American standard)

## International Shipping & Country Selection
**Shipping Coverage**: Multiple Latin American countries
**Country Field**: **REQUIRED** in all address forms
**Importance**:
- Country selection is **CRITICAL** for calculating international shipping costs
- Each address (shipping, billing, user registration) must include country
- Shipping rates and delivery times vary by destination country
**Implementation**:
- Country dropdown in checkout, address forms, and user registration
- Country-specific validation for postal codes and state/province formats
- Display shipping costs dynamically based on selected country
- Admin can view orders grouped by destination country

---

## 1. User Authentication & Account Management

### 1.1 Customer Authentication
- **Priority**: P0 (Critical)
- User registration via Supabase Auth (email/password)
- Registration form includes: name, email, phone, **country** (dropdown)
- Login/logout functionality
- Password reset via Supabase Auth email
- Basic profile management (name, email, phone, **country**) stored in Supabase
- Login required at checkout - users can browse and add to cart, but must register/login before payment
- Cart data stored in localStorage/cookies until user registers
- Quick registration flow at checkout (5 fields max)

### 1.2 Admin Authentication
- **Priority**: P0 (Critical)
- Admin login via Supabase Auth with role-based access (RLS policies)
- Admin role assignment in user metadata
- Separate admin dashboard route protection

---

## 2. Product Catalog

### 2.1 Product Display
- **Priority**: P0 (Critical)
- Product listing page with responsive grid layout
- Product detail page including:
  - Multiple product images (3-5 images per product)
  - Image zoom functionality
  - Product name, SKU, brand, price (USD)
  - Description and specifications
  - Frame dimensions (lens width, bridge, temple length)
  - Stock status visibility
- Product categories (Gafas de Sol, Gafas con Receta)
- Auto-hide products when out of stock

### 2.2 Search & Discovery
- **Priority**: P0 (Critical)
- Text-based search functionality
- Filter products by:
  - Brand (Ray-Ban, Oakley, etc.)
  - Lens size
  - Material (acetate, metal, titanium, etc.)
  - Frame shape (round, square, aviator, cat-eye, etc.)
- Category-based navigation
- Basic sorting (price: low-to-high, high-to-low, newest)

### 2.3 Size Guide
- **Priority**: P1 (High)
- Static page explaining frame measurements
- Visual guide for measuring face width
- Fit recommendations based on frame dimensions

---

## 3. Shopping Cart & Checkout

### 3.1 Shopping Cart
- **Priority**: P0 (Critical)
- Add/remove products from cart
- Update product quantities
- Display cart subtotal
- Persist cart in Supabase for logged-in users
- Session-based cart for guest users
- Display selected prescription and lens treatments per item

### 3.2 Prescription Management ✨ RESTRUCTURED (Nov 7, 2025)
- **Priority**: P0 (Critical)
- **Status**: ✅ IMPLEMENTED with admin-editable table structure

**Database Architecture**:
- **4 Admin-Editable Tables** for complete flexibility:
  1. `prescription_types` - Type of prescription (Single Vision, Progressive, Non-Prescription)
  2. `lens_types` - Lens materials/features (Blue Light, Photochromatic, Anti-Reflective, etc.)
  3. `lens_indexes` - Lens thickness options (1.50, 1.60, 1.67, 1.74)
  4. `view_areas` - Progressive lens view areas (Standard, 40% Broader)

**Multi-Step Prescription Flow**:

**Step 1: Initial Choice**
- **Frame Only** → Select lens type (non-prescription options)
- **Add Prescription Lenses** → Continue to prescription type

**Step 2: Prescription Type Selection** (if Add Prescription)
- **Single Vision** - One focal distance (near/intermediate/distance)
- **Progressive** - Multi-focal lenses in one lens
- **Non-Prescription** - Redirects to Frame Only flow

**Step 3: Formula Entry** (Single Vision & Progressive)
- **Right Eye (OD)**: SPH, CYL, AXIS
- **Left Eye (OS)**: SPH, CYL, AXIS
- **PD (Pupillary Distance)**: Single or dual
- **ADD** (for progressive lenses)
- **Image Upload Alternative**: JPG, PNG, WebP, PDF (max 5MB)
- Field validation:
  - SPH: -20.00 to +20.00
  - CYL: -4.00 to +4.00
  - AXIS: 0-180°
  - PD: 20-80mm

**Step 4: Lens Type Selection**
- Shows appropriate lens types based on flow:
  - **Frame Only flow**: Frame Only, Blue Light Block, Standard Clear, Photochromatic
  - **Prescription flow**: Blue Light Block, Standard Clear, Photochromatic, Anti-Reflective, UV Protection
- Each lens type has:
  - Name, description
  - Price modifier
  - Applicability flags (applies_to_without_rx, applies_to_with_rx)

**Step 5: Lens Index** (Prescription only)
- **Mid-Index (1.50)** - Standard plastic lens - $0
- **High-Index (1.60)** - 20% thinner and lighter - +$50
- **Ultra-Thin (1.67)** - 30% thinner (inactive/future) - +$100
- **Ultra-Thin Plus (1.74)** - 40% thinner (inactive/future) - +$150

**Step 6: View Area** (Progressive only)
- **Standard View** - Traditional progressive corridor - $0
- **40% Broader View** - Wider zones for computer work - +$75

**Real-Time Price Calculation**:
- Base product price
- + Lens type cost (from lens_types table)
- + Lens index cost (from lens_indexes table)
- + View area cost (from view_areas table)
- + Additional treatments cost (deprecated/legacy)
- = Total with itemized breakdown

**Admin Capabilities**:
- Add/edit/deactivate prescription types
- Add/edit/deactivate lens types with pricing
- Add/edit/deactivate lens indexes with pricing
- Add/edit/deactivate view areas with pricing
- Full control over display order
- Update descriptions and names

**Validation System**:
- Client-side validation with clear error messages
- Database foreign key constraints
- Required fields based on prescription type
- Formula OR image required for RX types

**Technical Implementation**:
- `/lib/types/prescription.ts` - Complete type system
- `/lib/utils/prescription-helpers.ts` - Validation & pricing
- `/components/PrescriptionForm.tsx` - Multi-step UI
- `/components/PrescriptionSummary.tsx` - Cart display
- Database: 4 admin tables with RLS policies
- Migration: `20251107000000_restructure_prescription_system.sql`

### 3.3 Lens Treatments (DEPRECATED - Merged into lens_types)
- **Status**: ⚠️ DEPRECATED - Use lens_types table instead
- Legacy `lens_treatments` table exists for backward compatibility
- Will be removed in future cleanup phase
- Calculate total with treatments applied

### 3.4 Checkout Flow
- **Priority**: P0 (Critical)
- **Step 1**: Review cart items
- **Step 1.5**: User Authentication Gate
  - If not logged in, show registration/login modal
  - Two options: "Already have account? Login" or "New customer? Create account"
  - Quick registration: name, email, phone, country, password
  - After successful auth: transfer localStorage cart to database
- **Step 2**: Shipping information
  - Add/edit shipping address form with **required country selection**
  - **Country dropdown**: List of Latin American countries we ship to
  - Address fields must include:
    - Full Name
    - Phone Number (with country code)
    - **Country** (dropdown - REQUIRED for international shipping)
    - Address Line 1
    - Address Line 2 (optional)
    - City
    - State/Province
    - Postal Code
  - Save multiple addresses to user profile (each with country)
  - Address validation (required fields including country)
- **Step 3**: Shipping method & cost
  - Display calculated shipping cost based on destination country
  - International shipping rates vary by country
  - Flat rate option as fallback
- **Step 4**: Payment
  - PagueloFacil payment integration (USD only)
  - Display order summary with international shipping details
- **Step 5**: Order confirmation
  - Display order number
  - Order summary with all details including destination country
  - Send order confirmation email

### 3.5 localStorage Cart Management
- **Priority**: P0 (Critical)
- Cart stored in browser localStorage for unauthenticated users
- Cart structure: JSON array of { product_id, quantity, prescription, treatments }
- Maximum cart size: 50 items
- Cart expiry: 30 days (client-side)
- On registration/login:
  - Transfer localStorage cart to database
  - Merge with existing database cart (if any)
  - Clear localStorage cart
  - Conflict resolution: keep higher quantity for duplicates

---

## 4. Order Management (Customer)

### 4.1 Order History
- **Priority**: P1 (High)
- View list of past orders
- Order details including:
  - Order number and date
  - Products purchased (with images)
  - Prescription details
  - Selected lens treatments
  - Shipping address
  - Order total
- Order status tracking:
  - Pending (payment confirmed)
  - Processing (being prepared)
  - Shipped (tracking info if available)
  - Delivered

### 4.2 Email Notifications
- **Priority**: P0 (Critical)
- Order confirmation email (via Supabase Edge Functions or SendGrid)
- Order shipped notification with tracking info
- Welcome email on registration

---

## 5. Admin Dashboard - Product Management

### 5.1 Product CRUD Operations
- **Priority**: P0 (Critical)
- **Create Product**:
  - Product information form (name, SKU, brand, description, price)
  - Frame specifications (lens width, bridge, temple length, material)
  - Category assignment
  - Frame shape selection
  - Initial stock quantity
  - Upload multiple images (up to 5) to Supabase Storage
- **Edit Product**:
  - Update product details
  - Add/remove/reorder images
  - Update stock quantity manually
- **Delete Product**:
  - Soft delete (mark as inactive) or hard delete
- **View Products**:
  - Paginated product list
  - Search and filter products
  - Quick edit actions

### 5.2 Bulk Product Operations
- **Priority**: P1 (High)
- CSV upload for bulk product creation
- CSV upload for bulk product updates
- Download CSV template
- Validation and error reporting on upload
- Background processing for large CSV files

### 5.3 Category Management
- **Priority**: P0 (Critical)
- Create/edit/delete product categories
- Assign products to categories
- Set category display order
- Category slug for SEO-friendly URLs

### 5.4 Lens Treatment Management
- **Priority**: P0 (Critical)
- Create/edit/delete lens treatment options
- Set treatment name and description
- Set additional cost per treatment
- Enable/disable treatments
- Reorder treatment display priority

### 5.5 Product Attributes Management
- **Priority**: P1 (High)
- Manage frame materials (add/edit/delete)
- Manage frame shapes (add/edit/delete)
- Manage lens size options

---

## 6. Admin Dashboard - Order Management

### 6.1 Order Processing
- **Priority**: P0 (Critical)
- View all orders in paginated table
- Filter orders by:
  - Status (Pending, Processing, Shipped, Delivered)
  - Date range
  - Customer name/email
- Search orders by order number
- **Order Details View**:
  - Customer information (name, email, phone)
  - Shipping address
  - Order items with product details
  - Prescription details (display form data and uploaded image)
  - Lens treatments selected
  - Order total breakdown (subtotal, treatments, shipping, total)
  - Payment status
- **Update Order Status**:
  - Manually change order status
  - Add tracking number for shipped orders
  - Add internal notes
- **Prescription Validation**:
  - Side-by-side view of manual entry vs uploaded prescription image
  - Flag discrepancies for review
  - Approve/reject prescription

---

## 7. Admin Dashboard - User Management

### 7.1 Customer Management
- **Priority**: P1 (High)
- View registered customers list (paginated)
- Search customers by name/email
- View customer profile:
  - Registration date
  - Total orders
  - Total spent
  - Saved addresses
- View customer's active cart contents
- View customer order history

---

## 8. Admin Dashboard - Inventory Management

### 8.1 Stock Tracking
- **Priority**: P0 (Critical)
- View inventory levels for all products
- Low stock alerts (configurable threshold, e.g., < 5 units)
- Manual stock adjustment with reason notes
- Stock movement history (orders, manual adjustments, ERP sync)

### 8.2 ERP Integration
- **Priority**: P0 (Critical)
- **Automated Sync (Every 2 Days)**:
  - Scheduled job runs every 48 hours (using Supabase Edge Functions or Railway Cron)
  - Fetch inventory data from ERP endpoint (paginated JSON response)
  - **NOTE**: ERP JSON structure will be provided later - implementation will be based on that structure
  - Process all pages of inventory data
  - Update product stock quantities in Supabase (match by SKU)
  - Auto-hide products when stock = 0
  - Auto-show products when stock > 0
- **Sync Logging**:
  - Log each sync attempt (timestamp, status, records processed)
  - Log errors and skipped items
  - Display sync history in admin dashboard
- **Manual Sync Trigger**:
  - Button to trigger immediate sync
  - Display sync progress

---

## 9. Admin Dashboard - Analytics

### 9.1 Dashboard Overview
- **Priority**: P2 (Nice-to-have)
- **Key Metrics**:
  - Total revenue (last 7 days, 30 days, all time)
  - Number of orders (last 7 days, 30 days, all time)
  - Average order value
  - Total customers
- **Charts**:
  - Sales over time (line chart)
  - Orders by status (pie chart)
- **Top Products**:
  - Best-selling products (last 30 days)
  - Product view counts
- **Conversion Metrics**:
  - Cart abandonment rate
  - Conversion rate (visitors to customers)

---

## 10. Additional Customer Features

### 10.1 Wishlist
- **Priority**: P2 (Nice-to-have)
- Add/remove products to wishlist (requires login)
- View saved wishlist items
- Move wishlist items to cart
- Persist wishlist in Supabase

### 10.2 Product Reviews & Ratings
- **Priority**: P2 (Nice-to-have)
- Customers can leave reviews (requires login and purchase)
- Star rating (1-5 stars)
- Written review (optional)
- Display average rating on product cards and detail page
- Admin moderation (approve/reject reviews)
- Filter reviews by star rating

### 10.3 Abandoned Cart Recovery
- **Priority**: P2 (Nice-to-have)
- Automated email sent 24 hours after cart abandonment
- Email includes cart items and direct checkout link
- Track email open and click rates
- Unsubscribe option

---

## 11. Static Pages & Legal

### 11.1 Information Pages
- **Priority**: P0 (Critical)
- **Contact/Support Page**:
  - Contact form (name, email, **country**, message)
  - Submit to Supabase and send email notification to admin
  - Display business contact info:
    - Email
    - **Phone number** (clickable tel: link)
    - **WhatsApp number** (clickable link that opens WhatsApp Web/App in new tab)
    - Business address
  - **NO live chat feature** - support via phone and WhatsApp only
- **Return/Refund Policy**: Static content page with international shipping considerations
- **Privacy Policy**: Static content page (required for prescription data and international operations)
- **Terms of Service**: Static content page with international shipping terms
- **About Us**: Brand story page (ZERO origin story)
- **Shipping Information**: Static page explaining international shipping process to Latin American countries

---

## 12. Technical Infrastructure

### 12.1 Next.js Application Structure
- **Priority**: P0 (Critical)
- Next.js 14+ with App Router
- Server Components for data fetching
- Client Components for interactive elements
- API Routes for server-side logic
- Middleware for auth protection

### 12.2 Supabase Setup
- **Priority**: P0 (Critical)
- **Database Schema**:
  - Users (extends Supabase Auth)
  - Products
  - Categories
  - Product Images
  - Lens Treatments
  - Cart Items
  - Orders
  - Order Items
  - Prescriptions
  - Addresses
  - Reviews
  - Inventory Sync Logs
- **Row Level Security (RLS)**:
  - Customer can only view/edit their own data
  - Admin role can access all data
  - Public read access for products and categories
- **Storage Buckets**:
  - Product images (public)
  - Prescription images (private, user-specific access)
- **Edge Functions**:
  - ERP inventory sync
  - Email notifications
  - Payment processing webhook

### 12.3 Railway Deployment
- **Priority**: P0 (Critical)
- Configure Next.js deployment on Railway
- Environment variables management
- Automatic deployments from GitHub main branch
- Staging environment (optional)

### 12.4 UI Components
- **Priority**: P0 (Critical)
- shadcn/ui component library
- Tailwind CSS for styling
- Responsive design (mobile-first)
- Accessible components (WCAG 2.1 AA compliance)
- Loading states and error handling
- Toast notifications for user actions
- Form validation with proper error messages

### 12.5 External Integrations
- **Priority**: P0 (Critical)
- **PagueloFacil Payment Gateway**:
  - API integration
  - Webhook handling for payment confirmations
  - USD currency support
- **Shipping Provider** (TBD):
  - API integration for rate calculation
  - Webhook for tracking updates
  - Fallback to flat rate if API fails
- **Email Service**:
  - SendGrid or similar for transactional emails
  - Email templates for order confirmation, shipping, etc.

---

## Feature Priority Summary

### P0 (Critical - Must Have for MVP Launch)
1. User authentication (customer + admin)
2. Product catalog with search and filters
3. Shopping cart
4. Prescription entry and image upload
5. Lens treatment selection
6. Checkout flow with PagueloFacil
7. Admin product management (CRUD)
8. Admin order management
9. Admin category and treatment management
10. ERP inventory sync
11. Email notifications
12. Static information pages

### P1 (High - Important but Can Launch Without)
13. Order history for customers
14. Bulk product operations via CSV
15. Customer management in admin
16. Product attributes management
17. Size guide

### P2 (Nice-to-Have - Post-Launch Features)
18. Wishlist
19. Product reviews and ratings
20. Abandoned cart recovery emails
21. Analytics dashboard

---

## Success Metrics (Post-Launch)

- **Customer Acquisition**: Number of registered users
- **Conversion Rate**: Percentage of visitors who complete purchase
- **Average Order Value**: Revenue per order
- **Prescription Orders**: Percentage of orders with prescriptions
- **Cart Abandonment Rate**: Track and optimize checkout flow
- **Customer Retention**: Repeat purchase rate

---

## Timeline Estimation

**Phase 1 - Foundation (Weeks 1-2)**
- Setup Next.js + Supabase + Railway
- Database schema and RLS policies
- Basic authentication and routing
- shadcn/ui setup and theming

**Phase 2 - Core Features (Weeks 3-5)**
- Product catalog and display
- Shopping cart
- Prescription flow and lens treatments

**Phase 3 - Checkout & Payments (Weeks 6-7)**
- Checkout flow
- PagueloFacil integration
- Order creation

**Phase 4 - Admin Dashboard (Weeks 8-10)**
- Product management
- Order management
- Inventory sync with ERP

**Phase 5 - Polish & Launch (Weeks 11-12)**
- Email notifications
- Static pages
- Testing and bug fixes
- Deployment

**Estimated Total**: 12 weeks for P0 features

---

**End of PRD**
