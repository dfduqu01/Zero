# Zyro Online - Production Deployment Plan

**Created:** 2026-01-20
**Updated:** 2026-01-27
**Status:** ✅ ALL PHASES COMPLETE - Site is LIVE and ready for customers! 🚀
**Platform:** Railway + Supabase

---

## Overview

This document outlines the complete deployment plan for Zyro Online with **separate development and production environments**.

### Environment Strategy

| Environment | Hosting | Supabase | PagueloFacil | Purpose |
|-------------|---------|----------|--------------|---------|
| **Development** | GitHub Codespace | Current project (test data) | SANDBOX | Build features, test |
| **Production** | Railway | NEW project (clean) | PRODUCTION | Real customers |

### Why Separate Supabase Projects?
- ✅ Test data doesn't mix with real customer data
- ✅ Saf2e to experiment without affecting production
- ✅ Clean database for real orders and customers
- ✅ Can test payment flows with sandbox mode
- ✅ Production reports show only real data

---

## Pre-Deployment Checklist (Already Complete)

- [x] All static pages (Privacy, Terms, Shipping, Returns, About, Size Guide)
- [x] Spanish email templates in Supabase (Confirm signup, Reset password)
- [x] Password reset flow working
- [x] Forgot password form in Spanish
- [x] Update password form in Spanish
- [x] Full E2E test passed
- [x] Payment integration (PagueloFacil SANDBOX)
- [x] Email notifications (SendGrid)
- [x] ERP sync (dubros.com)
- [x] Admin dashboard complete

---

## Deployment Steps (Chronological Order)

### Phase 1: Create Production Supabase Project ✅ COMPLETE

#### Step 1.1: Create New Supabase Project
- [x] Go to [supabase.com](https://supabase.com)
- [x] Create new project: `zyro-production`
- [x] Select region closest to Panama/Latin America
- [x] Save the following credentials:
  - [x] Project URL
  - [x] Anon Key
  - [x] Service Role Key
  - [x] Database Password

#### Step 1.2: Run Database Migrations
- [x] Go to Supabase Dashboard → SQL Editor
- [x] Run all migrations from `/zyro-app/supabase/migrations/` in order:
  ```
  1. Initial schema migration
  2. Prescription system tables
  3. Checkout sessions table
  4. ERP sync jobs table
  5. Any other migrations
  ```
- [x] Verify all tables created successfully

#### Step 1.3: Configure Storage Buckets
- [x] Create `product-images` bucket (public)
- [x] Create `prescriptions` bucket (private)
- [x] Set up storage policies (copy from development project)

#### Step 1.4: Configure Authentication
- [x] Go to Authentication → URL Configuration
- [x] Set Site URL: `https://zyroonline.com`
- [x] Add Redirect URLs:
  - `https://zyroonline.com/**`
  - `https://zyroonline.com/auth/callback`

#### Step 1.5: Configure Email Templates (Spanish)
- [x] Go to Authentication → Email Templates
- [x] **Confirm Signup:**
  ```
  Subject: Confirma tu cuenta en Zyro Online

  <h2>Confirma tu cuenta en Zyro Online</h2>
  <p>¡Gracias por registrarte!</p>
  <p>Haz clic en el siguiente enlace para confirmar tu correo electrónico:</p>
  <p><a href="{{ .ConfirmationURL }}">Confirmar mi cuenta</a></p>
  <p>Si no creaste esta cuenta, puedes ignorar este mensaje.</p>
  <p>Saludos,<br>Equipo Zyro Online</p>
  ```
- [x] **Reset Password:**
  ```
  Subject: Restablecer tu contraseña - Zyro Online

  <h2>Restablecer tu contraseña - Zyro Online</h2>
  <p>Recibimos una solicitud para restablecer tu contraseña.</p>
  <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
  <p><a href="{{ .ConfirmationURL }}">Restablecer mi contraseña</a></p>
  <p>Este enlace expirará en 24 horas.</p>
  <p>Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
  <p>Saludos,<br>Equipo Zyro Online</p>
  ```

#### Step 1.6: Copy Essential Configuration Data
Copy these tables from development to production (data only, not test data):

- [x] `prescription_types` (3 rows)
- [x] `lens_types` (6+ rows)
- [x] `lens_indexes` (4 rows)
- [x] `view_areas` (2 rows)
- [x] `categories` (product categories)
- [x] `brands` (if not synced via ERP)
- [x] `frame_materials`
- [x] `frame_shapes`

**Option A:** Export/Import via Supabase Dashboard
**Option B:** Run INSERT statements in SQL Editor

#### Step 1.7: Create Admin User
- [x] Sign up on production site (after Railway deploy)
- [x] Go to Supabase → Table Editor → `users` table
- [x] Set `is_admin = true` for your user

---

### Phase 2: Railway Setup ✅ COMPLETE

#### Step 2.1: Create Railway Account & Project
- [x] Go to [railway.app](https://railway.app)
- [x] Sign up / Log in with GitHub
- [x] Create new project

#### Step 2.2: Connect GitHub Repository
- [x] Click "Deploy from GitHub repo"
- [x] Select `Zyro` repository
- [x] Set root directory: `zyro-app`

#### Step 2.3: Configure Environment Variables
Set these in Railway → Variables:

```bash
# App Configuration
NODE_ENV=production
NEXT_PUBLIC_BASE_URL=https://zyroonline.com

# Supabase (PRODUCTION PROJECT)
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-prod-service-role-key

# PagueloFacil (PRODUCTION MODE)
PAGUELOFACIL_ENV=production
PAGUELOFACIL_CCLW=your-production-cclw

# SendGrid
SENDGRID_API_KEY=SG.your-api-key
EMAIL_FROM_ADDRESS=pedidos@zyroonline.com
EMAIL_FROM_NAME=Zyro Online

# ERP (Dubros)
DUBROS_API_URL=https://dubros.com
DUBROS_BEARER_TOKEN=your-erp-token
```

#### Step 2.4: Deploy
- [x] Railway should auto-deploy after connecting repo
- [x] Watch build logs for errors
- [x] Note the Railway-provided URL (e.g., `zyro-production.up.railway.app`)

#### Step 2.5: Test on Railway URL
- [x] Visit the Railway URL
- [x] Verify site loads correctly
- [x] Test basic navigation

---

### Phase 3: Domain & SSL ✅ COMPLETE

#### Step 3.1: Add Custom Domain in Railway
- [x] Go to Railway project → Settings → Domains
- [x] Click "Add Custom Domain"
- [x] Enter: `zyroonline.com`
- [x] Also add: `www.zyroonline.com`

#### Step 3.2: Configure DNS
At Dreamhost, configured these records:

| Type | Name | Value |
|------|------|-------|
| Redirect | @ | `https://www.zyroonline.com` (with SSL) |
| CNAME | www | `zero-production-e1d4.up.railway.app` |

#### Step 3.3: Wait for DNS Propagation
- [x] DNS propagated successfully
- [x] Verified with Google DNS resolver

#### Step 3.4: Verify SSL Certificate
- [x] Railway auto-provisioned SSL via Let's Encrypt
- [x] Visit `https://zyroonline.com` - ✅ Working (redirects to www)
- [x] Visit `https://www.zyroonline.com` - ✅ Working with padlock

---

### Phase 4: Production Configuration ✅ COMPLETE

#### Step 4.1: Update Supabase Site URL
- [x] Go to Supabase (production) → Authentication → URL Configuration
- [x] Verify Site URL is: `https://zyroonline.com`

#### Step 4.2: Populate Products via ERP Sync
- [x] Log in as admin on production site
- [x] Go to Admin → ERP Sync
- [x] Run full sync to import all products from dubros.com
- [x] Verify products appear correctly

**Status:** ✅ ERP sync complete and functional!

#### Step 4.3: Verify SendGrid Domain
- [x] SendGrid configured to send from `admin@zyroonline.com`
- [x] Verified sender address working

---

### Phase 5: Final Testing (Production) ✅ COMPLETE

#### Step 5.1: Test Authentication
- [x] Sign up with new email
- [x] Verify confirmation email received (in Spanish)
- [x] Confirm account
- [x] Log in successfully
- [x] Test password reset flow

#### Step 5.2: Test Shopping Flow
- [x] Browse products
- [x] Add item to cart
- [x] Configure prescription (if applicable)
- [x] Proceed to checkout
- [x] Complete payment (use real card, small amount) ✅
- [x] Verify order confirmation email received ✅

#### Step 5.3: Test Admin Functions
- [x] Log in as admin
- [x] View orders ✅
- [x] Update order status to "Shipped" ✅
- [x] Verify shipping notification email sent ✅
- [x] Check ERP sync works ✅

#### Step 5.4: Refund Test Order
- [x] First real order recorded - kept as test/first order

---

### Phase 6: Go Live! ✅ COMPLETE

#### Step 6.1: Final Checks
- [x] All tests passed ✅
- [x] SSL working ✅
- [x] Emails sending correctly ✅
- [x] Payment processing works ✅
- [x] Admin functions work ✅

#### Step 6.2: Announce Launch
- [x] Site is LIVE at https://www.zyroonline.com
- [ ] Update any marketing materials with live URL
- [ ] Share with initial customers
- [x] Monitoring for issues

---

## Post-Launch Monitoring

### First 24 Hours
- [ ] Monitor Railway logs for errors
- [ ] Check Supabase logs
- [ ] Verify email delivery
- [ ] Watch for payment issues

### First Week
- [ ] Monitor user signups
- [ ] Check order completion rate
- [ ] Review any error reports
- [ ] Gather user feedback
- [x] Check ERP sync is running correctly ✅

---

## Environment Reference

### Development (GitHub Codespace)
```
URL: https://mysterious-spooky-monster-*.app.github.dev
Supabase: Current development project
PagueloFacil: SANDBOX
Purpose: Build and test new features
```

### Production (Railway)
```
URL: https://zyroonline.com
Supabase: zyro-production (NEW)
PagueloFacil: PRODUCTION
Purpose: Real customers and orders
```

---

## Troubleshooting

### Railway Build Fails
- Check build logs in Railway dashboard
- Ensure all environment variables are set
- Verify `zyro-app` is set as root directory

### Supabase Connection Issues
- Verify environment variables are correct
- Check Supabase project is not paused
- Verify RLS policies are set up

### Emails Not Sending
- Check SendGrid API key is valid
- Verify sender email is verified in SendGrid
- Check Supabase email templates are saved

### Payment Issues
- Verify PagueloFacil credentials are for production
- Check callback URL is correct
- Review PagueloFacil dashboard for errors

---

## Session Notes

- **2026-01-20**: Created initial deployment plan
- **2026-01-21**: Completed static pages, Spanish email templates, password reset flow
- **2026-01-22**: Updated plan to use separate Supabase projects for dev/production
- **2026-01-23**: Completed Phase 1 (Production Supabase) and Phase 2 (Railway Setup). App deployed to Railway. Now configuring custom domain.
- **2026-01-25**: Completed Phase 3 (Domain & SSL) and Phase 4 (Production Configuration). Both `zyroonline.com` and `www.zyroonline.com` working with SSL. Site is LIVE!
- **2026-01-27**: ERP sync completed and functional. Products imported from dubros.com. Fixed PagueloFacil CCLW (was using sandbox token in production). Payment flow now working! Completed full E2E testing - order confirmation and shipping emails working. **SITE IS FULLY OPERATIONAL AND READY FOR CUSTOMERS!** 🎉

---

## Quick Reference: What Goes Where

| Item | Development | Production |
|------|-------------|------------|
| Supabase Project | Current (test data) | NEW (clean) |
| PagueloFacil Mode | SANDBOX | PRODUCTION |
| Test Orders | ✅ Here | ❌ Never |
| Real Customers | ❌ Never | ✅ Here |
| Feature Development | ✅ Here | ❌ Never |
| ERP Sync Testing | ✅ Here | ✅ Also here |

