# ZERO - Screens & UI Structure

## Overview
This document outlines all screens, pages, and UI components needed for the ZERO MVP, organized by user type and functionality.

**Brand**: ZERO - Empezando desde cero (cero intermediarios, cero complicaciones, cero límites)
**Language**: Español (Spanish) - all customer-facing content
**Target Market**: Latinoamérica

**Important Note**: While screen descriptions below are in English for technical clarity, ALL user-facing content (buttons, labels, messages, etc.) must be in Spanish. Examples:
- "Add to Cart" → "Agregar al Carrito"
- "Login" → "Iniciar Sesión"
- "Search" → "Buscar"
- "My Account" → "Mi Cuenta"
- "Checkout" → "Finalizar Compra"

**Critical Requirements**:
- **Country Field**: REQUIRED in all address forms (registration, checkout, address modal) for international shipping to multiple Latin American countries
- **Support Channels**: Phone and WhatsApp ONLY - NO live chat feature
- **WhatsApp Integration**: Clickable link that opens WhatsApp in new tab
- **Phone Numbers**: All phone numbers must be clickable (tel: links)

**Total Screens**: ~42 screens (including modals and drawers)
- Customer-facing: ~27 screens
- Admin: ~15 screens

---

## Customer-Facing Screens

### Public/Guest Screens

#### 1. Home/Landing Page
**Purpose**: Main entry point for the e-commerce platform
**Key Elements**:
- Hero section with main CTA
- Featured products carousel/grid
- Category showcase (Gafas de Sol, Gafas con Receta)
- Value propositions (free shipping, prescription support, etc.)
- Testimonials/reviews section (optional)

#### 2. Product Listing Page
**Purpose**: Browse all products with filtering and sorting
**Key Elements**:
- Product grid (responsive: 4 cols desktop, 2 cols tablet, 1 col mobile)
- Filters sidebar (desktop) / drawer (mobile):
  - Brand (Ray-Ban, Oakley, etc.)
  - Lens size
  - Material (acetate, metal, titanium, etc.)
  - Frame shape (round, square, aviator, cat-eye, etc.)
  - Price range
  - Category
- Search bar
- Sorting dropdown (price: low-to-high, high-to-low, newest)
- Pagination or infinite scroll
- Active filter chips with clear option
- Results count

#### 3. Product Detail Page
**Purpose**: Display detailed product information and enable purchase
**Key Elements**:
- Image gallery (3-5 images) with zoom on click/hover
- Main image viewer
- Thumbnail selector
- Product information:
  - Product name
  - Brand
  - SKU
  - Price (USD)
  - Stock status
  - Description
  - Frame specifications (lens width, bridge, temple length)
  - Material
  - Frame shape
- "Add Prescription" button (triggers modal)
- "Select Lens Treatments" button (triggers modal)
- Quantity selector
- "Add to Cart" button
- "Add to Wishlist" button (P2)
- Product reviews section (P2 - only show if user purchased)
- Related products carousel
- Size guide link

#### 4. Search Results Page
**Purpose**: Display products matching search query
**Key Elements**:
- Similar layout to Product Listing Page
- Search query displayed ("Results for: [query]")
- Number of results found
- Search suggestions if no results

#### 5. Category Page
**Purpose**: Display products within a specific category
**Key Elements**:
- Similar to Product Listing Page
- Category name and description header
- Category-specific filters
- Breadcrumb navigation

---

### Authentication Screens

#### 6. Login/Register Page
**Purpose**: User authentication
**Key Elements**:
- Can be combined with tabs or separate pages
- **Login Tab/Section**:
  - Email input
  - Password input
  - "Forgot password?" link
  - "Login" button
  - Social auth options (optional)
  - "Don't have an account? Register" link
- **Register Tab/Section**:
  - Name input
  - Email input
  - Phone input (with country code)
  - **Country dropdown** (required for shipping)
  - Password input
  - Confirm password input
  - Terms acceptance checkbox
  - "Register" button
  - "Already have an account? Login" link

#### 7. Forgot Password Page
**Purpose**: Initiate password reset
**Key Elements**:
- Email input
- "Send reset link" button
- Success message
- Back to login link

#### 8. Reset Password Page
**Purpose**: Set new password (accessed via email link)
**Key Elements**:
- New password input
- Confirm password input
- Password requirements display
- "Reset password" button
- Success message with login redirect

---

### Shopping Flow

#### 9. Shopping Cart Page
**Purpose**: Review cart items before checkout
**Key Elements**:
- Cart items list with:
  - Product image
  - Product name
  - SKU
  - Quantity selector
  - Price per unit
  - Prescription summary (if applicable)
  - Selected lens treatments (if applicable)
  - Treatment costs
  - Remove button
  - Edit prescription button
- Cart summary sidebar/section:
  - Subtotal
  - Estimated shipping
  - Estimated tax (if applicable)
  - Total
  - "Proceed to Checkout" button
  - "Continue Shopping" link
- Empty cart state with CTA to browse products
- Save cart for later (for logged-in users)

#### 10. Checkout Page (Single Page Multi-Step)
**Purpose**: Complete purchase with shipping and payment info
**Layout**: Single page with step indicator at top
**Steps**:

**Step 1: Cart Review**
- Order summary (read-only)
- Edit cart link

**Step 1.5: Authentication Gate** (NEW)
- If user not logged in:
  - Show modal or inline section
  - "Iniciar Sesión" button
  - "Crear Cuenta" button
  - Message: "Crea tu cuenta para completar la compra"
- If user logged in: Skip to Step 2

**Step 2: Shipping Address**
- For logged-in users: Select from saved addresses or add new
- Address form fields:
  - **Country** (dropdown - **REQUIRED** for international shipping)
  - Full name
  - Phone number (with country code)
  - Address line 1
  - Address line 2 (optional)
  - City
  - State/Province
  - Postal code
- Helper text: "País requerido para calcular costos de envío internacional"
- "Save this address" checkbox (logged-in users)
- Continue button

**Step 3: Shipping Method**
- Display available shipping options with costs (calculated based on destination country)
- Estimated delivery dates (vary by country)
- International shipping notice
- Selected option highlighted
- Continue button

**Step 4: Payment**
- PagueloFacil payment integration
- Order summary sidebar:
  - Items subtotal
  - Lens treatments
  - Shipping
  - Total (USD)
- Payment form/widget
- "Place Order" button
- Terms and privacy policy agreement checkbox

**Progress Indicator**: Shows current step (1/4, 2/4, etc.)

#### 10.5 Checkout Authentication Modal (NEW)
**Purpose**: Require registration/login before checkout
**Trigger**: User clicks "Proceed to Checkout" without being logged in
**Key Elements**:
- Modal overlay
- Two tabs: "Iniciar Sesión" and "Crear Cuenta"
- Login tab: Email, password, "Forgot password?" link
- Registration tab: Name, email, phone, country, password
- After successful login/registration:
  - Transfer localStorage cart to database
  - Redirect to checkout Step 2 (Shipping Address)
- "Tu carrito se guardará" reassurance message

#### 11. Order Confirmation Page
**Purpose**: Confirm successful order placement
**Key Elements**:
- Success icon/animation
- Order number (prominent)
- Thank you message
- Order summary:
  - Items ordered
  - Shipping address
  - Estimated delivery
  - Total paid
- "View Order Details" button
- "Continue Shopping" button
- Email confirmation notice

---

### Modals & Drawers

#### 12. Prescription Configuration (Multi-Step Form) ✨ UPDATED Nov 7, 2025
**Purpose**: Collect prescription details through guided flow
**Location**: Inline on Product Detail page (not modal)
**Type**: Progressive disclosure multi-step form

**Initial State**:
- "+ Configurar Lentes" button

**Step 1: Initial Choice**
- Header: "Configuración de Lentes"
- Two options:
  - **Solo el Marco (Frame Only)**
    - Description: "Sin receta o lentes de protección"
  - **Agregar Lentes con Receta**
    - Description: "Lentes graduados según tu prescripción"
- Navigation: "Quitar" (reset)

**Step 2A: Prescription Type** (if "Agregar Lentes con Receta")
- Header: "Tipo de Prescripción"
- Three options (from prescription_types table):
  - **Single Vision** - "One field of vision (near or distance)"
  - **Progressive** - "Multiple vision zones in one lens"
  - **Non-Prescription** - "Cosmetic or protective use only" (redirects to Step 2B)
- Navigation: "← Atrás" | "X"

**Step 2B: Formula Entry** (if Single Vision or Progressive)
- Header: "Ingresa tu Prescripción"
- Current type displayed: "Tipo: Single Vision/Progressive"
- Form fields:
  - **Ojo Derecho (OD)**: SPH, CYL, AXIS, ADD (progressive only)
  - **Ojo Izquierdo (OS)**: SPH, CYL, AXIS, ADD (progressive only)
  - **PD (Distancia Pupilar)**: Single value (20-80mm)
- **OR** Image upload alternative:
  - "O sube una imagen de tu receta"
  - File input (JPG, PNG, PDF - max 5MB)
  - Image preview if uploaded
- Button: "Siguiente"
- Navigation: "← Atrás" | "X"

**Step 3: Lens Type Selection**
- Header: "Tipo de Lente"
- Current prescription displayed (if applicable)
- Radio button list showing appropriate lens types:
  - **Frame Only flow**: Frame Only, Blue Light Block, Standard Clear, Photochromatic
  - **Prescription flow**: Blue Light Block, Standard Clear, Photochromatic, Anti-Reflective, UV Protection
- Each option shows:
  - Name
  - Description
  - Price modifier (if > $0): "+$XX.XX"
- Button: "Siguiente" (Frame Only) or "Completar" (prescription flow continues)
- Navigation: "← Atrás" | "X"

**Step 4: Lens Index** (Prescription types only)
- Header: "Índice de Lente"
- Note: "* Todos los lentes incluyen anti-reflejante y resistencia a rayones"
- Radio button list (from lens_indexes table):
  - Mid-Index (1.50) - $0
  - High-Index (1.60) - +$50
  - Ultra-Thin (1.67) - +$100 (if active)
  - Ultra-Thin Plus (1.74) - +$150 (if active)
- Each shows name, description, price
- Button: "Siguiente" (if Progressive) or "Completar" (if Single Vision)
- Navigation: "← Atrás" | "X"

**Step 5: View Area** (Progressive only)
- Header: "Área de Visión"
- Radio button list (from view_areas table):
  - Standard View - FREE or $0
  - 40% Broader View - +$75
- Each shows name, description, price
- Button: "Completar"
- Navigation: "← Atrás" | "X"

**Price Display**:
- Real-time subtotal updates shown in product pricing section
- Itemized breakdown:
  - Base price: $XX.XX
  - + Tipo de lente: $XX.XX (if applicable)
  - + Índice de lente: $XX.XX (if applicable)
  - + Área de visión: $XX.XX (if applicable)
  - = Total: $XX.XX

**Technical Notes**:
- Data sources: prescription_types, lens_types, lens_indexes, view_areas tables
- All pricing is admin-editable
- RLS policies ensure only active items are shown
- Validation happens on each step before "Siguiente"

#### 13. Lens Treatments Section (⚠️ DEPRECATED)
**Status**: Merged into lens_types table
**Note**: Legacy treatments still display from lens_treatments table for backward compatibility
- Will be phased out in cleanup
- New lens types handle both frame-only and prescription lens options

#### 14. Mobile Filter Drawer
**Purpose**: Show filters on mobile devices
**Trigger**: "Filter" button on Product Listing (mobile only)
**Key Elements**:
- Slides in from left or bottom
- Same filter options as desktop sidebar
- "Apply Filters" button
- "Clear All" button
- Close button

#### 15. Write Review Modal (P2)
**Purpose**: Allow customers to review purchased products
**Trigger**: From Order Detail or Product Detail (if purchased)
**Key Elements**:
- Modal header: "Write a Review"
- Product name and image
- Star rating selector (1-5 stars)
- Review title (optional)
- Review text area
- Character count/limit
- "Submit Review" button
- "Cancel" button
- Note: "Only available for purchased products"

#### 16. Address Form Modal
**Purpose**: Add or edit shipping address
**Trigger**: From Checkout or Account Settings
**Key Elements**:
- Modal header: "Add Address" or "Edit Address"
- Address form fields:
  - **Country** (dropdown - **REQUIRED**)
  - Full name
  - Phone number (with country code)
  - Address line 1
  - Address line 2 (optional)
  - City
  - State/Province
  - Postal code
- Helper text: "País requerido para calcular costos de envío"
- "Set as default" checkbox
- "Save Address" button
- "Cancel" button

---

### Account Area (Logged In)

#### 17. My Account Dashboard
**Purpose**: Overview of customer account
**Key Elements**:
- Welcome message with user name
- Quick stats:
  - Total orders
  - Pending orders
  - Wishlist items (P2)
- Recent orders list (last 3-5)
- Quick links:
  - View All Orders
  - Edit Profile
  - Manage Addresses
  - Wishlist (P2)
- Account details summary

#### 18. Order History Page
**Purpose**: View all past orders
**Key Elements**:
- Orders list/table:
  - Order number
  - Date
  - Status badge (Pending, Processing, Shipped, Delivered)
  - Total amount
  - Quick view button
- Filter by status
- Search by order number
- Pagination
- Empty state if no orders

#### 19. Order Detail Page
**Purpose**: View specific order details
**Key Elements**:
- Order number and date (header)
- Order status with progress indicator
- Tracking number (if shipped)
- "Track Order" button/link
- Order items:
  - Product images
  - Product names
  - Quantities
  - Prices
  - Prescription details (if applicable)
  - Lens treatments (if applicable)
- Shipping address
- Payment method
- Order summary:
  - Subtotal
  - Treatments
  - Shipping
  - Total
- "Reorder" button (P2)
- "Contact Support" button
- "Write Review" button (P2)

#### 20. Wishlist Page (P2)
**Purpose**: View and manage saved products
**Key Elements**:
- Product grid (similar to Product Listing)
- Each product card:
  - Product image
  - Name
  - Price
  - Stock status
  - "Add to Cart" button
  - "Remove from Wishlist" button
- Empty state with CTA to browse products
- "Add all to cart" button (if multiple items)

---

### Information Pages (Static Content)

#### 21. Contact/Support Page
**Purpose**: Enable customer communication
**Key Elements**:
- Page header
- Contact form:
  - Name
  - Email
  - **Country dropdown** (required)
  - Subject/Topic dropdown
  - Message textarea
  - Submit button
- Business contact information:
  - Email address
  - **Phone number** (clickable tel: link)
  - **WhatsApp number** (clickable link, opens WhatsApp in new tab)
  - Note: "Haz clic para abrir WhatsApp"
  - Business address
  - Business hours
- **NO live chat feature** - Support via phone and WhatsApp only
- Optional: Map/location embed
- FAQ section (optional)

#### 22. Size Guide Page
**Purpose**: Help customers choose correct frame size
**Key Elements**:
- Page header
- Visual guide explaining frame measurements:
  - Lens width
  - Bridge width
  - Temple length
- How to measure your face width
- Face shape guide (optional)
- Frame size recommendations
- Printable ruler/measuring tool (optional)

#### 23. Return/Refund Policy Page
**Purpose**: Display return policy
**Key Elements**:
- Policy content (static markdown/HTML)
- Return timeframe
- Conditions for returns
- Refund process
- Contact information

#### 24. Privacy Policy Page
**Purpose**: Legal compliance for data handling
**Key Elements**:
- Policy content (static markdown/HTML)
- Data collection practices
- Prescription data handling
- Cookie policy
- User rights

#### 25. Terms of Service Page
**Purpose**: Legal terms and conditions
**Key Elements**:
- Terms content (static markdown/HTML)
- User obligations
- Limitations of liability
- Dispute resolution

#### 26. Shipping Information Page
**Purpose**: Explain shipping process and costs
**Key Elements**:
- Shipping methods available
- Estimated delivery times
- Shipping costs structure
- International shipping (if applicable)
- Order tracking instructions

#### 27. About Us Page
**Purpose**: Company information and story
**Key Elements**:
- Company story/mission
- Team information (optional)
- Values and commitments
- Why choose us section

---

## Admin Screens

**Language**: All admin interface content must be in Spanish

### Admin Access & Navigation

**Admin Access**:
- Admin users login through same authentication system
- Role-based redirect to admin dashboard
- Admin navigation accessible from main header (visible only to admin role)

**Admin Navigation Structure**:
- Dashboard
- Products
- Orders
- Customers
- Inventory
- Analytics (P2)
- "Back to Store" link

---

### Admin Dashboard

#### 28. Admin Dashboard Home
**Purpose**: Overview of key metrics and quick actions
**Key Elements**:
- Welcome message
- Key metrics cards:
  - Today's sales
  - Pending orders count
  - Low stock products count
  - Total customers
- Quick stats:
  - Revenue (7 days, 30 days, all time)
  - Orders (7 days, 30 days, all time)
  - Average order value
- Recent orders table (last 10)
- Low stock alerts
- Recent customer registrations
- Quick action buttons:
  - Add Product
  - View Orders
  - Sync Inventory

---

### Product Management

#### 29. Products List Page
**Purpose**: View and manage all products
**Key Elements**:
- Page header with "Add Product" button
- Bulk actions dropdown:
  - Bulk delete
  - Bulk export
  - Go to Bulk Upload
- Products table/grid:
  - Product image thumbnail
  - Name
  - SKU
  - Category
  - Price
  - Stock quantity
  - Status (active/inactive)
  - Actions (Edit, Delete, View)
- Search bar
- Filters:
  - Category
  - Stock status (in stock, low stock, out of stock)
  - Status (active/inactive)
- Sorting options
- Pagination
- Stock level color coding (green: high, yellow: low, red: out)

#### 30. Add/Edit Product Page
**Purpose**: Create new product or update existing
**Key Elements**:
- Page header: "Add Product" or "Edit Product"
- Tabs or sections:

  **Basic Information**:
  - Product name
  - SKU (auto-generate option)
  - Description (rich text editor)
  - Price (USD)
  - Category dropdown/select

  **Frame Specifications**:
  - Lens width
  - Bridge width
  - Temple length
  - Material dropdown
  - Frame shape dropdown

  **Images**:
  - Image upload area (drag & drop or click)
  - Support up to 5 images
  - Image preview with reorder functionality
  - Set primary image
  - Delete image option

  **Inventory**:
  - Current stock quantity
  - Low stock threshold
  - Status toggle (active/inactive)

  **SEO** (optional):
  - Meta title
  - Meta description
  - URL slug

- "Save" and "Cancel" buttons
- "Save and Add Another" option
- Validation messages

#### 31. Product Categories Page
**Purpose**: Manage product categories
**Key Elements**:
- Page header with "Add Category" button
- Categories table:
  - Category name
  - Slug
  - Product count
  - Display order
  - Actions (Edit, Delete)
- Inline editing or modal for add/edit
- Drag-to-reorder functionality
- Delete confirmation

#### 32. Lens Treatments Page
**Purpose**: Manage lens treatment options
**Key Elements**:
- Page header with "Add Treatment" button
- Treatments table:
  - Treatment name
  - Description
  - Additional cost (USD)
  - Status (active/inactive)
  - Display order
  - Actions (Edit, Delete)
- Inline editing or modal for add/edit
- Drag-to-reorder functionality
- Enable/disable toggle

#### 33. Product Attributes Page
**Purpose**: Manage frame materials, shapes, and sizes
**Key Elements**:
- Tabs or accordion sections:

  **Materials Tab**:
  - Materials list with add/edit/delete
  - Material name
  - Description (optional)

  **Frame Shapes Tab**:
  - Shapes list with add/edit/delete
  - Shape name
  - Icon/image (optional)

  **Lens Sizes Tab**:
  - Size options with add/edit/delete
  - Size value
  - Display label

- Quick inline editing
- Bulk actions

#### 34. Bulk Upload Page
**Purpose**: Upload products via CSV
**Key Elements**:
- Page header
- Instructions section
- "Download CSV Template" button
- File upload area (drag & drop or click)
- Accept only .csv files
- Upload button
- Progress indicator during processing
- Validation results section:
  - Success count
  - Error count
  - Error details table (row number, error message)
  - Download error report
- "View Products" link after successful upload

---

### Order Management

#### 35. Orders List Page
**Purpose**: View and manage all orders
**Key Elements**:
- Page header
- Orders table:
  - Order number (clickable)
  - Date
  - Customer name
  - Status badge (Pending, Processing, Shipped, Delivered)
  - Total amount
  - Actions (View, Update Status)
- Filters:
  - Status dropdown
  - Date range picker
  - Customer search
- Search by order number
- Export orders button (CSV)
- Pagination
- Bulk actions (optional)

#### 36. Order Detail Page
**Purpose**: View and manage specific order
**Key Elements**:
- Order header:
  - Order number
  - Order date
  - Current status
- Status update section:
  - Status dropdown (Pending, Processing, Shipped, Delivered)
  - "Update Status" button
  - Add tracking number input (when status = Shipped)
  - Internal notes textarea
- Customer information card:
  - Name
  - Email
  - Phone
  - Link to customer profile
- Shipping address card
- Order items table:
  - Product image
  - Product name
  - SKU
  - Quantity
  - Price
  - Prescription details (view button if applicable)
  - Lens treatments
- Prescription validation section (if applicable):
  - "View Prescription" button (triggers modal)
  - Validation status (Pending, Approved, Rejected)
  - Approve/Reject buttons
- Payment information:
  - Payment method
  - Payment status
  - Transaction ID
- Order summary:
  - Subtotal
  - Treatments cost
  - Shipping cost
  - Total
- Activity log (order history/timeline)
- "Send Email to Customer" button (optional)

---

### Customer Management

#### 37. Customers List Page
**Purpose**: View all registered customers
**Key Elements**:
- Page header
- Customers table:
  - Name
  - Email
  - Registration date
  - Total orders
  - Total spent
  - Status (active/inactive)
  - Actions (View)
- Search by name or email
- Sort by (registration date, total spent, total orders)
- Pagination
- Export customers button (CSV)

#### 38. Customer Detail Page
**Purpose**: View detailed customer information
**Key Elements**:
- Customer header:
  - Name
  - Email
  - Phone
  - Registration date
- Stats cards:
  - Total orders
  - Total spent
  - Average order value
  - Last order date
- Tabs or sections:

  **Orders Tab**:
  - Customer's order history (table)
  - Link to each order detail

  **Cart Tab**:
  - Current cart contents
  - Items in cart
  - Cart value
  - Cart abandonment date

  **Addresses Tab**:
  - Saved shipping addresses
  - Default address indicator

  **Account Tab**:
  - Account status
  - Registration method
  - Last login date
  - Account actions (deactivate, reset password, etc.)

- "Send Email" button (optional)
- Notes section for admin use

---

### Inventory Management

#### 39. Inventory Management Page
**Purpose**: Track and manage product stock levels
**Key Elements**:
- Page header with "Manual Sync" button
- Inventory table:
  - Product image
  - Product name
  - SKU
  - Current stock
  - Low stock threshold
  - Status indicator (color-coded)
  - Last updated date
  - Actions (Adjust Stock)
- Filters:
  - Low stock only
  - Out of stock only
  - All products
- Search by product name or SKU
- Sort by stock level
- Stock level alerts section (top of page)
- Bulk stock adjustment (optional)

#### 40. ERP Sync Page
**Purpose**: Manage inventory synchronization with ERP
**Key Elements**:
- Page header
- Sync control section:
  - Last sync date/time
  - Next scheduled sync date/time
  - "Trigger Manual Sync" button
  - Sync in progress indicator
- Sync history table:
  - Sync date/time
  - Status (Success, Failed, Partial)
  - Records processed
  - Records updated
  - Errors count
  - Duration
  - Actions (View Details, Download Log)
- Sync statistics:
  - Total syncs
  - Success rate
  - Average duration
- Error log section (expandable):
  - Failed items
  - Error messages
  - Timestamp

---

### Analytics (P2)

#### 41. Analytics Dashboard
**Purpose**: View business metrics and insights
**Key Elements**:
- Date range selector (7 days, 30 days, 90 days, custom)
- Key metrics cards:
  - Total revenue
  - Total orders
  - Average order value
  - Conversion rate
  - Cart abandonment rate
- Charts:
  - Sales over time (line chart)
  - Orders by status (pie chart)
  - Revenue by category (bar chart)
  - Top selling products (bar chart)
- Tables:
  - Top 10 products by revenue
  - Top 10 products by units sold
  - Top 10 customers by spend
- Customer insights:
  - New vs returning customers
  - Customer lifetime value
- Export reports button

---

### Admin Modals

#### 42. Stock Adjustment Modal
**Purpose**: Manually adjust product stock
**Trigger**: From Inventory Management page
**Key Elements**:
- Modal header: "Adjust Stock"
- Product name and current stock
- Adjustment type radio buttons:
  - Add stock
  - Remove stock
  - Set stock to specific value
- Quantity input
- Reason dropdown or textarea:
  - Damaged items
  - Inventory count correction
  - Return/refund
  - Other (with note)
- New stock preview
- "Confirm" and "Cancel" buttons

#### 43. Order Status Update Modal
**Purpose**: Update order status with tracking
**Trigger**: From Order Detail page
**Key Elements**:
- Modal header: "Update Order Status"
- Current status display
- New status dropdown
- Tracking number input (if status = Shipped)
- Shipping carrier dropdown (if status = Shipped)
- Estimated delivery date (if status = Shipped)
- Customer notification checkbox: "Send email notification"
- Internal notes textarea
- "Update" and "Cancel" buttons

#### 44. Prescription Validation Modal
**Purpose**: Compare manual prescription entry with uploaded image
**Trigger**: From Order Detail page
**Key Elements**:
- Modal header: "Validate Prescription"
- Split view (side-by-side):

  **Left Panel - Manual Entry**:
  - Display entered prescription values in table format
  - OD (Right Eye): SPH, CYL, AXIS
  - OS (Left Eye): SPH, CYL, AXIS
  - PD
  - ADD (if applicable)

  **Right Panel - Uploaded Image**:
  - Display uploaded prescription image
  - Zoom controls
  - Rotate controls (if needed)
  - Download image button

- Discrepancy flags (if values don't match common patterns)
- Validation actions:
  - "Approve" button
  - "Request Clarification" button (sends email to customer)
  - "Reject" button
- Notes textarea for internal use
- "Close" button

---

## Navigation Structure

### Customer Header (Desktop)
- Logo (left, links to home) - "ZERO"
- Category links (Gafas de Sol, Gafas con Receta)
- Search bar (center/right)
- Icons (right):
  - Wishlist icon with badge (P2)
  - Cart icon with badge
  - Account dropdown:
    - Logged out: Login / Register
    - Logged in: My Account, Orders, Wishlist (P2), Logout
- Admin link (if user has admin role): "Admin Dashboard"

### Customer Header (Mobile)
- Hamburger menu icon (left)
- Logo (center)
- Icons (right):
  - Search icon
  - Cart icon with badge

### Mobile Menu Drawer
- Category links
- Search bar
- Account links (Login/My Account)
- Wishlist (P2)
- Information pages links
- Admin link (if admin)

### Customer Footer
- **Company**:
  - About Us
  - Contact
  - Careers (optional)
- **Support**:
  - Size Guide
  - Shipping Information
  - Return Policy
  - FAQ
- **Legal**:
  - Privacy Policy
  - Terms of Service
- **Contact Info**:
  - Email
  - Phone
  - Address
- **Social Media Icons** (optional)
- Newsletter signup (optional)

### Admin Navigation
- Sidebar or top navigation with sections:
  - Dashboard (home icon)
  - Products (dropdown):
    - All Products
    - Add Product
    - Categories
    - Treatments
    - Attributes
    - Bulk Upload
  - Orders
  - Customers
  - Inventory (dropdown):
    - Stock Management
    - ERP Sync
  - Analytics (P2)
  - Settings (optional)
- User profile dropdown (top right):
  - Back to Store
  - Account Settings
  - Logout

---

## Mobile-Specific Considerations

### Mobile Variations

1. **Product Listing**:
   - Filters accessible via drawer instead of sidebar
   - Smaller product cards (1-2 columns)
   - Sticky "Filter" button at bottom

2. **Product Detail**:
   - Full-width image gallery with swipe
   - Sticky "Add to Cart" button at bottom
   - Collapsible sections for specs and description

3. **Cart**:
   - Simplified item cards
   - Bottom sheet for cart summary

4. **Checkout**:
   - Single column layout
   - Step indicator condensed
   - Sticky "Continue" button

5. **Admin Tables**:
   - Horizontal scroll for wide tables
   - Card view option for some tables
   - Simplified actions (swipe actions)

6. **Modals**:
   - Full-screen or bottom sheet on mobile
   - Prescription modal becomes full page

---

## Screen Priority for Development

### Phase 1 (Weeks 1-2): Foundation
- Login/Register Page
- Home Page
- Product Listing Page
- Product Detail Page

### Phase 2 (Weeks 3-5): Core Shopping
- Shopping Cart Page
- Prescription Modal
- Lens Treatments Modal
- Checkout Page

### Phase 3 (Weeks 6-7): Orders & Confirmation
- Order Confirmation Page
- Order History Page
- Order Detail Page

### Phase 4 (Weeks 8-10): Admin
- Admin Dashboard Home
- Products List Page
- Add/Edit Product Page
- Orders List Page
- Order Detail Page
- Inventory Management Page
- ERP Sync Page

### Phase 5 (Weeks 11-12): Polish & Static Pages
- Contact Page
- Size Guide
- All policy pages
- My Account Dashboard
- Customer Management (admin)

### Post-MVP (P2 Features):
- Wishlist Page
- Write Review Modal
- Analytics Dashboard
- Bulk Upload Page

---

**End of Screens Document**
