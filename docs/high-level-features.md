# ZERO - High-Level Features

## Project Overview
**ZERO** es una plataforma de e-commerce B2C para productos ópticos dirigida al mercado latinoamericano. La plataforma se enfoca en entregar una experiencia optimizada para la compra de gafas en línea.

## Brand Philosophy
Empezando desde **cero**: cero intermediarios, cero complicaciones, cero límites. ZERO lleva 25+ años de experiencia en la industria óptica directamente al consumidor final, combinando conocimiento profundo con tecnología moderna y diseño pensado para una nueva generación.

---

## High-Level Features

### Customer-Facing Features

**Authentication**
- User registration and login (includes **country field** in registration)
- Account management (profile includes country)
- Login required at checkout (browse freely with localStorage cart)

**Product Catalog & Browsing**
- Browse optical products with intuitive interface
- Text-based search functionality
- Filter by lens size, material, and frame shape
- Product categories (gafas de sol, gafas con receta)
- Industry-specific search and discovery
- Multiple product images with zoom functionality
- Size guide and fit information
- Hide out-of-stock products

**Purchase Flow with Prescription Support**
- View detailed product information
- Choose between regular or prescription lenses
- Enter prescription details with structured fields (SPH, CYL, AXIS, PD, etc.)
- Upload prescription image for validation
- Prescription format validation
- Select lens treatments (photochromatic, anti-reflective, blue-coat)
- Registration/login gate before payment
- localStorage cart persistence for unauthenticated users
- Automatic cart transfer on registration
- **International shipping address management** (add/edit/save addresses with **required country field**)
- **Country selection required** for calculating shipping costs across Latin American countries
- Complete checkout and online payment (USD only)
- International shipping cost calculator based on destination country

**Order Management**
- Order history and tracking
- Email notifications (order confirmation, shipping updates)

**Shopping Experience**
- Wishlist/favorites functionality
- Abandoned cart recovery emails
- Product reviews and ratings

**Information & Support**
- Contact/support page with form (includes **country field**)
- **Phone support** (clickable phone numbers)
- **WhatsApp support** (clickable link, opens in new tab)
- **NO live chat** - Support via phone and WhatsApp only
- Return/refund policy display (international shipping considerations)
- Privacy policy (international operations)
- Terms of service (international shipping terms)

### Administrative Features

**Authentication**
- Admin login and role-based access control

**Product Management**
- Bulk product creation via CSV upload
- Manual creation, editing, and deletion of individual products
- Bulk editing and deletion via CSV files
- Product image management
- Product categorization and tagging
- Manage product visibility based on stock status

**Catalog Configuration**
- Create, edit, and delete lens treatments
- Manage product variables and attributes
- Organize products into categories

**User Management**
- View registered users and login activity
- Monitor user sessions
- View cart contents for active users
- User account management and support

**Order Management**
- View and process orders
- Update order status (pending, processing, shipped, delivered)
- Prescription verification and validation (compare manual entry with uploaded image)
- View shipping addresses

**Inventory Management**
- Track stock levels
- Every 2 days automated sync with ERP endpoint
- Process paginated JSON product data from ERP
- Automatic product hiding when out of stock

**Analytics & Insights**
- Sales metrics dashboard
- Popular products tracking
- Conversion rate analytics
- Customer behavior insights

### Technical Infrastructure

**Payment & Security**
- Payment gateway integration (PagueloFacil or similar local platform)
- USD currency support

**Communication**
- Email service for transactional emails
- Password reset functionality
- Contact form submissions

**Storage & Performance**
- Cloud storage/CDN for product images
- Prescription image storage
- Optimized image delivery

**ERP Integration**
- Every 2 days scheduled job to sync inventory from ERP endpoint
- Handle paginated JSON responses
- Update product stock levels automatically

**International Shipping Integration**
- Integration with international shipping provider API
- Real-time shipping rate calculation based on destination country
- Support for multiple Latin American countries
- Country-specific delivery times and costs

---

## MVP Scope
This MVP focuses on establishing core functionality and user flow before adding advanced features in future iterations.

## Language & Market
**Primary Language**: Español (Spanish) for all customer-facing content
**Target Market**: Latinoamérica
**Currency**: USD
