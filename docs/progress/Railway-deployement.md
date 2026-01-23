# Railway Deployment Guide

**Status:** Phase 1 & 2 Complete | Phase 3 In Progress
**Updated:** 2026-01-23

---

## ✅ Step 1: Create Railway Project (COMPLETE)

1. ~~Go to https://railway.app~~
2. ~~Sign in with GitHub~~
3. ~~Click "New Project" → "Deploy from GitHub repo"~~
4. ~~Select the Zyro repository~~
5. ~~Set Root Directory: zyro-app~~

---

## ✅ Step 2: Set Environment Variables (COMPLETE)

Environment variables configured in Railway:

```bash
# ========== SUPABASE (PRODUCTION) ==========
NEXT_PUBLIC_SUPABASE_URL=https://jehoshecbgspewxotdty.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ========== PAGUELOFACIL (PRODUCTION) ==========
PAGUELOFACIL_CCLW=B3B42F50E474663C6E508CA8DFA9869BC0FBA03E9E6650226DDFBCC38F55C4CF...
PAGUELOFACIL_ENVIRONMENT=production

# ========== APPLICATION URL ==========
NEXT_PUBLIC_APP_URL=https://zyroonline.com

# ========== SENDGRID EMAIL ==========
SENDGRID_API_KEY=SG.xxx
EMAIL_FROM_ADDRESS=pedidos@zyroonline.com
EMAIL_FROM_NAME=Zyro Online

# ========== ERP SYNC (DUBROS) ==========
DUBROS_API_URL=https://dubros.com
DUBROS_BEARER_TOKEN=ba2a5b46d82339b1163b27935c243ffa
```

---

## ✅ Step 3: Deploy (COMPLETE)

Railway automatically built and deployed after connecting repo.

---

## ✅ Step 4: Add Custom Domain (COMPLETE)

1. [x] Go to Railway project → Settings → Domains
2. [x] Click "Add Custom Domain"
3. [x] Added: `zyroonline.com` and `www.zyroonline.com`
4. [x] DNS configured at Dreamhost:
   - `www` → CNAME → `m2u1zvgn.up.railway.app`
   - `@` (root) → Redirect to `https://www.zyroonline.com`

---

## 🔄 Step 5: Verify Deployment & Final Testing (IN PROGRESS)

1. [ ] Visit https://zyroonline.com - verify redirect works
2. [ ] Visit https://www.zyroonline.com - verify site loads
3. [ ] Verify SSL certificate is active (padlock icon)
4. [ ] Test authentication flow (signup, login, password reset)
5. [ ] Test shopping flow (add to cart, checkout)
6. [ ] Test admin functions (login as admin, view orders, ERP sync)

---

## ✅ Post-Deployment Setup (COMPLETE)

1. **Create Admin User:** ✅
   - Signed up on the production site
   - Set `is_admin = true` in Supabase users table

2. **Run ERP Sync:** ✅
   - Logged in as admin
   - Ran full sync to import products from dubros.com  