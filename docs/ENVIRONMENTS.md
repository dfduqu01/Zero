# Zyro Online - Environment Documentation

**Created:** 2026-01-25
**Last Updated:** 2026-01-25
**Status:** Production LIVE

---

## Overview

Zyro Online uses a **dual-environment strategy** with completely separate Supabase projects for development and production. This ensures test data never mixes with real customer data.

---

## Environment Summary

| Aspect | Development | Production |
|--------|-------------|------------|
| **Purpose** | Build features, test, experiment | Real customers, real orders |
| **Hosting** | GitHub Codespace | Railway |
| **URL** | `*.app.github.dev:3000` | `https://www.zyroonline.com` |
| **Supabase Project** | `zyro-app-edv` | `zyro-production` |
| **PagueloFacil** | SANDBOX (test cards) | PRODUCTION (real payments) |
| **Data** | Test/mock data | Real customer data |

---

## Development Environment

### Hosting: GitHub Codespace

- **URL Pattern:** `https://mysterious-spooky-monster-*.app.github.dev:3000`
- **Branch:** `main` (or feature branches)
- **Auto-start:** Opens in VS Code when codespace launches

### Supabase Project: `zyro-app-edv`

| Property | Value |
|----------|-------|
| **Project Name** | zyro-app-edv |
| **Project ID** | `sgmnhqvofxvbpihdayrp` |
| **Region** | (check Supabase dashboard) |
| **URL** | `https://sgmnhqvofxvbpihdayrp.supabase.co` |
| **Dashboard** | [Supabase Dashboard](https://supabase.com/dashboard/project/sgmnhqvofxvbpihdayrp) |

### Payment Gateway: PagueloFacil SANDBOX

- **Mode:** `sandbox`
- **Purpose:** Test transactions only
- **Test Cards:** Use PagueloFacil sandbox test card numbers
- **Real Charges:** NO - sandbox mode does not process real payments

### Environment Variables (`.env.local`)

```bash
# Supabase (Development)
NEXT_PUBLIC_SUPABASE_URL=https://sgmnhqvofxvbpihdayrp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# PagueloFacil (SANDBOX)
PAGUELOFACIL_ENVIRONMENT=sandbox
PAGUELOFACIL_CCLW=B3B42F50E474663C6E508CA8DFA9869BC0FBA03E...

# App URL (Codespace)
NEXT_PUBLIC_APP_URL=https://mysterious-spooky-monster-*.app.github.dev

# SendGrid (shared)
SENDGRID_API_KEY=SG.xxx
EMAIL_FROM_ADDRESS=admin@zyroonline.com
EMAIL_FROM_NAME=Zyro Online

# ERP Sync (shared)
DUBROS_API_URL=https://dubros.com
DUBROS_BEARER_TOKEN=ba2a5b46d82339b1163b27935c243ffa
```

### What to Use Development For

- ✅ Building new features
- ✅ Testing code changes
- ✅ Testing payment flows with sandbox
- ✅ Experimenting with database changes
- ✅ ERP sync testing
- ✅ Debugging issues
- ❌ Never use for real customer orders

---

## Production Environment

### Hosting: Railway

| Property | Value |
|----------|-------|
| **Platform** | Railway |
| **Project URL** | `zero-production-e1d4.up.railway.app` |
| **Custom Domain** | `https://www.zyroonline.com` |
| **Alt Domain** | `https://zyroonline.com` (redirects to www) |
| **SSL** | Let's Encrypt (auto-provisioned by Railway) |
| **Deploys From** | GitHub `main` branch (auto-deploy) |

### Supabase Project: `zyro-production`

| Property | Value |
|----------|-------|
| **Project Name** | zyro-production |
| **Project ID** | `jehoshecbgspewxotdty` |
| **Region** | (closest to Panama/Latin America) |
| **URL** | `https://jehoshecbgspewxotdty.supabase.co` |
| **Dashboard** | [Supabase Dashboard](https://supabase.com/dashboard/project/jehoshecbgspewxotdty) |

### Payment Gateway: PagueloFacil PRODUCTION

- **Mode:** `production`
- **Purpose:** Real customer transactions
- **Real Charges:** YES - processes actual payments
- **Currency:** USD

### Environment Variables (Railway Dashboard)

```bash
# Supabase (Production)
NEXT_PUBLIC_SUPABASE_URL=https://jehoshecbgspewxotdty.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGci...

# PagueloFacil (PRODUCTION)
PAGUELOFACIL_ENVIRONMENT=production
PAGUELOFACIL_CCLW=54E45D3266DEB2AE3B52241969F9DCA7DDCF2368...

# App URL (Production)
NEXT_PUBLIC_APP_URL=https://zyroonline.com

# SendGrid (shared)
SENDGRID_API_KEY=SG.xxx
EMAIL_FROM_ADDRESS=pedidos@zyroonline.com
EMAIL_FROM_NAME=Zyro Online

# ERP Sync (shared)
DUBROS_API_URL=https://dubros.com
DUBROS_BEARER_TOKEN=ba2a5b46d82339b1163b27935c243ffa
```

### What Production Is For

- ✅ Real customer orders
- ✅ Real payment processing
- ✅ Live ERP inventory sync
- ✅ Real email notifications to customers
- ❌ Never test experimental features here
- ❌ Never use test data here

---

## Database Schema Sync

Both Supabase projects should have **identical schemas** but **different data**.

### Tables Present in Both

- `users` - User profiles
- `addresses` - Shipping addresses
- `products` - Product catalog
- `brands` - Product brands
- `categories` - Product categories
- `frame_materials` - Frame material options
- `frame_shapes` - Frame shape options
- `product_images` - Product image gallery
- `prescription_types` - Prescription categories
- `lens_types` - Lens options and pricing
- `lens_indexes` - Lens thickness options
- `view_areas` - Progressive lens view areas
- `cart_items` - Shopping cart
- `cart_item_prescriptions` - Cart prescription data
- `orders` - Customer orders
- `order_items` - Order line items
- `order_item_prescriptions` - Order prescription data
- `checkout_sessions` - Payment sessions
- `erp_sync_logs` - ERP sync history
- `erp_sync_errors` - ERP sync error details
- `inventory_movements` - Stock change history

### Configuration Data (Copy to Production)

These tables need seed data copied from development to production:

| Table | Records | Purpose |
|-------|---------|---------|
| `prescription_types` | 3 | Single Vision, Progressive, Non-Prescription |
| `lens_types` | 6+ | Frame Only, Blue Light, Photochromatic, etc. |
| `lens_indexes` | 4 | 1.50, 1.60, 1.67, 1.74 |
| `view_areas` | 2 | Standard, 40% Broader |
| `categories` | 2+ | Gafas de Sol, Gafas con Receta |
| `frame_materials` | 4+ | Acetato, Metal, Titanio, etc. |
| `frame_shapes` | 5+ | Redondo, Cuadrado, Aviador, etc. |

---

## Admin Users

### Development Admin

- Create via signup on development site
- Set `is_admin = true` in Supabase → `users` table

### Production Admin

- Created: ✅ Yes
- Set `is_admin = true` in Production Supabase → `users` table

---

## DNS Configuration (Dreamhost)

| Record Type | Name | Value | Purpose |
|-------------|------|-------|---------|
| CNAME | www | `zero-production-e1d4.up.railway.app` | Points www to Railway |
| Redirect | @ | `https://www.zyroonline.com` | Redirects root to www (with SSL) |

---

## Deployment Workflow

### Development → Production

1. **Develop locally** in GitHub Codespace
2. **Test thoroughly** with sandbox payments
3. **Commit to `main`** branch
4. **Railway auto-deploys** from main
5. **Verify on production** site

### Database Migrations

1. Create migration in `/zyro-app/supabase/migrations/`
2. Test in development Supabase project
3. Copy and run migration in production Supabase SQL Editor
4. Verify both environments match

---

## Current Status (2026-01-25)

### Development Environment

| Component | Status |
|-----------|--------|
| Codespace | ✅ Working |
| Supabase | ✅ Connected |
| PagueloFacil Sandbox | ✅ Configured |
| SendGrid | ✅ Working |
| ERP Sync | ✅ Tested |

### Production Environment

| Component | Status |
|-----------|--------|
| Railway Hosting | ✅ Deployed |
| Custom Domain (www) | ✅ Working |
| Custom Domain (root) | ✅ Redirects to www |
| SSL Certificates | ✅ Active |
| Supabase | ✅ Connected |
| PagueloFacil Production | ✅ Configured |
| SendGrid | ✅ Working |
| ERP Sync | ⏳ Pending first run |
| Admin User | ✅ Created |

---

## Troubleshooting

### "Wrong Supabase project"

Check your `.env.local` file - ensure you're using the correct project URL:
- Development: `sgmnhqvofxvbpihdayrp.supabase.co`
- Production (Railway): `jehoshecbgspewxotdty.supabase.co`

### "Payment not working"

Check `PAGUELOFACIL_ENVIRONMENT`:
- Development: Should be `sandbox`
- Production: Should be `production`

### "SSL not working"

- Railway needs CNAME pointing to exact Railway URL
- Root domain redirect needs SSL enabled at registrar (Dreamhost)
- Railway may take a few minutes to provision SSL after DNS propagates

### "Products not showing"

- Run ERP sync from Admin dashboard
- Check `products` table in Supabase
- Verify `is_active = true` for products

---

## Quick Reference Links

| Resource | Development | Production |
|----------|-------------|------------|
| **Site** | Codespace URL | [www.zyroonline.com](https://www.zyroonline.com) |
| **Supabase Dashboard** | [Dev Project](https://supabase.com/dashboard/project/sgmnhqvofxvbpihdayrp) | [Prod Project](https://supabase.com/dashboard/project/jehoshecbgspewxotdty) |
| **Railway Dashboard** | N/A | [Railway](https://railway.app) |
| **SendGrid** | [Dashboard](https://app.sendgrid.com) | Same account |
| **PagueloFacil** | Sandbox Mode | Production Mode |

---

**End of Environment Documentation**
