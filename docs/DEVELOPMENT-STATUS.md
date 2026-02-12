Ok # DEVELOPMENT STATUS

> Last Updated: 2026-01-27

## 1. Project Overview

| Field | Value |
|-------|-------|
| **Product** | ZERO / Zyro Online |
| **Target Market** | B2C optical e-commerce for Latin America |
| **Language** | Spanish |
| **Currency** | USD |
| **Live URL** | https://www.zyroonline.com |

---

## 2. Current Status

**STATUS: LIVE IN PRODUCTION**

All P0 (Must Have) features are operational and have been fully E2E tested:

- [x] User authentication (sign up, login, password reset)
- [x] Product catalog with brand filtering
- [x] Shopping cart functionality
- [x] Multi-step prescription configuration flow
- [x] Checkout with address management
- [x] PagueloFacil payment integration (redirect flow)
- [x] Order creation and confirmation emails
- [x] Admin dashboard for order management
- [x] ERP sync with dubros.com
- [x] Shipping notification emails

---

## 3. Tech Stack & Architecture

### Frontend
- **Framework**: Next.js 16+ (App Router with Turbopack)
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS 3.4
- **React**: React 19

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Edge Functions**: Supabase Edge Functions

### Hosting & Infrastructure
- **Hosting**: Railway (auto-deploy from GitHub `main` branch)
- **CDN**: Cloudfront (product images)

### Integrations
- **Payments**: PagueloFacil (Panama) - redirect flow
- **Email**: SendGrid (transactional emails)
- **ERP**: dubros.com API (inventory and product sync)

---

## 4. Environment Configuration

### Development Environment
- **IDE**: GitHub Codespace
- **Supabase Project**: `zyro-app-edv` (development)
- **Payment Gateway**: PagueloFacil Sandbox

### Production Environment
- **Hosting**: Railway
- **Supabase Project**: `zyro-production`
- **Payment Gateway**: PagueloFacil Production

### Key Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# PagueloFacil
PAGUELOFACIL_BASE_URL=
PAGUELOFACIL_CCLW=
PAGUELOFACIL_TOKEN=
NEXT_PUBLIC_SITE_URL=

# SendGrid
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=

# ERP (dubros.com)
ERP_API_KEY=
```

---

## 5. Database Schema Summary

### Core Tables

| Table | Purpose | Row Count |
|-------|---------|-----------|
| `users` | Customer and admin accounts | 1 |
| `products` | Product catalog | 5,121 |
| `product_images` | Product image URLs (low/high res) | 5,030 |
| `brands` | Product brands | 160 |
| `categories` | Product categories | 0 |
| `frame_materials` | Frame material options | 3 |
| `frame_shapes` | Frame shape options | 0 |

### Prescription System

| Table | Purpose |
|-------|---------|
| `prescription_types` | Types: Single Vision, Progressive, Frame Only |
| `lens_types` | Lens options with price modifiers |
| `lens_indexes` | Lens index options (1.50, 1.56, 1.60, etc.) |
| `view_areas` | View area options for progressives |

### Cart System

| Table | Purpose |
|-------|---------|
| `cart_items` | User cart items with calculated unit price |
| `cart_item_prescriptions` | Prescription data attached to cart items |

### Order System

| Table | Purpose | Row Count |
|-------|---------|-----------|
| `orders` | Customer orders | 12 |
| `order_items` | Individual items in each order | 12 |
| `order_item_prescriptions` | Prescription data for order items | 12 |
| `order_status_history` | Status change audit trail | 4 |

### Support Tables

| Table | Purpose |
|-------|---------|
| `addresses` | Customer shipping addresses |
| `checkout_sessions` | Pre-payment session data |
| `inventory_movements` | Stock change audit log |
| `erp_sync_logs` | ERP sync operation logs |
| `erp_sync_errors` | ERP sync error details |
| `background_jobs` | Async job queue (ERP sync, pricing) |
| `pricing_tiers` | Markup tier configuration |
| `pricing_recalculation_logs` | Pricing job audit logs |
| `wishlists` | Customer wishlists (future feature) |
| `product_reviews` | Product reviews (future feature) |
| `contact_submissions` | Contact form submissions |

---

## 6. API Routes Reference

### Admin - ERP Sync
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/admin/erp-sync` | POST | Trigger ERP sync job |
| `/api/admin/erp-sync/jobs/[id]` | GET | Get sync job status |
| `/api/admin/erp-sync-status/[id]` | GET | Get sync status by ID |

### Admin - ERP Test
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/admin/erp-test/admin-client` | GET | Test ERP admin client |
| `/api/admin/erp-test/fetch-brands` | GET | Fetch brands from ERP |
| `/api/admin/erp-test/fetch-categories` | GET | Fetch categories from ERP |
| `/api/admin/erp-test/fetch-materials` | GET | Fetch materials from ERP |
| `/api/admin/erp-test/fetch-products` | GET | Fetch products from ERP |
| `/api/admin/erp-test/full-sync` | POST | Run full ERP sync |

### Admin - Pricing
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/admin/pricing/recalculate` | POST | Trigger price recalculation |
| `/api/admin/pricing/history` | GET | Get pricing history |
| `/api/admin/pricing-status/[id]` | GET | Get pricing job status |
| `/api/admin/pricing-tiers/[id]` | GET/PUT | Manage pricing tiers |

### Checkout
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/checkout/session` | POST | Create checkout session |
| `/api/checkout/create-payment-link` | POST | Generate PagueloFacil link |
| `/api/checkout/payment-callback` | GET | Handle payment callback |

### Orders
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/orders/[id]/send-shipped-email` | POST | Send shipping notification |

---

## 7. Key Implemented Features

### Multi-Step Prescription Configuration
1. **Step 1**: Select prescription type (Frame Only, Single Vision, Progressive)
2. **Step 2**: Select lens type (Clear, Transition, Polarized, etc.)
3. **Step 3**: Select lens index (1.50, 1.56, 1.60, 1.67, 1.74)
4. **Step 4**: Enter prescription values (SPH, CYL, AXIS, PD, ADD)
5. **Step 5**: Select view area (for progressives only)

### Real-Time Price Calculation
```
Total = Base Frame Price + Lens Type Modifier + Lens Index Modifier + View Area Modifier
```
All modifiers are configurable in the database.

### ERP Sync with dubros.com
- Manual trigger from admin dashboard
- Background job processing (handles 5,000+ products)
- Syncs: Products, Brands, Materials, Inventory
- Progress tracking and error logging

### PagueloFacil Payment Flow
1. Create checkout session with cart snapshot
2. Generate payment link via PagueloFacil API
3. Redirect customer to PagueloFacil
4. Handle callback on success/failure
5. Create order and send confirmation email

### Order Management
- Order status: `pending` → `processing` → `shipped` → `delivered`
- Status history tracking
- Tracking number and carrier support
- Shipping notification emails via SendGrid

---

## 8. Pending Features (MOSCOW Priority)

### SHOULD HAVE (S) - Next Priority

| Feature | Description |
|---------|-------------|
| Customer Order History | View past orders in account page |
| Bulk Product CSV Upload | Admin tool for mass product updates |
| Customer Management | Admin dashboard for customer list |
| Size Guide Page | Frame measurement guide for customers |

### COULD HAVE (C) - Future

| Feature | Description |
|---------|-------------|
| Wishlist | Save products for later (table exists) |
| Product Reviews | Customer ratings and reviews (table exists) |
| Analytics Dashboard | Sales and traffic analytics |
| Abandoned Cart Emails | Recovery email automation |

---

## 9. File Structure Overview

```
zyro-app/
├── app/
│   ├── (routes)/              # Customer-facing pages
│   │   ├── products/          # Product listing & detail
│   │   ├── cart/              # Shopping cart
│   │   ├── account/           # User account pages
│   │   └── ...
│   ├── admin/                 # Admin dashboard
│   │   ├── orders/            # Order management
│   │   ├── products/          # Product management
│   │   ├── erp-sync/          # ERP sync interface
│   │   └── ...
│   ├── api/                   # API routes
│   │   ├── admin/             # Admin APIs
│   │   ├── checkout/          # Checkout APIs
│   │   └── orders/            # Order APIs
│   └── checkout/              # Checkout flow pages
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── products/              # Product components
│   ├── cart/                  # Cart components
│   ├── checkout/              # Checkout components
│   └── admin/                 # Admin components
├── lib/
│   ├── supabase/              # Supabase client setup
│   │   ├── client.ts          # Browser client
│   │   └── server.ts          # Server client
│   ├── payment/               # PagueloFacil integration
│   │   └── paguelofacil-client.ts
│   ├── types/                 # TypeScript type definitions
│   └── utils/                 # Helper functions
└── supabase/
    └── migrations/            # Database migrations
```

---

## 10. Quick Reference Commands

### Development
```bash
cd zyro-app
npm run dev          # Start dev server with Turbopack
npm run build        # Production build
npm run lint         # Run ESLint
```

### Database
```bash
# Supabase CLI commands (if installed)
supabase db diff     # Generate migration from changes
supabase db push     # Apply migrations
```

---

## 11. Known Issues & Technical Debt

1. **Categories not populated** - Category table is empty; products have null category_id
2. **Frame shapes not populated** - Frame shapes table is empty
3. **Prescription config tables** - May need seed data verification

---

## 12. Contact & Resources

- **Live Site**: https://www.zyroonline.com
- **GitHub Repo**: (private)
- **Supabase Dashboard**: Access via Supabase console
- **Railway Dashboard**: Access via Railway console
