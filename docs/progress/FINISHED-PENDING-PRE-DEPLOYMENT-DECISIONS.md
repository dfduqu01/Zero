# Pre-Deployment Decisions & Tasks

**Created:** 2026-01-18
**Last Updated:** 2026-01-20
**Status:** Ready for Deployment

---

## All Core Tasks Complete ✅

| Task | Status | Date | Notes |
|------|--------|------|-------|
| Configure custom SMTP for emails | ✅ Done | Jan 19 | SendGrid via `admin@zyroonline.com` |
| Move landing to homepage (`/`) | ✅ Done | Jan 19 | landing-v2 content now at root |
| Remove shipping estimate from cart | ✅ Done | Jan 19 | Cart shows subtotal only |
| Implement Panama shipping + pickup | ✅ Done | Jan 19 | $8 delivery, free pickup |
| Update branding to "Zyro Online" | ✅ Done | Jan 19 | All pages updated |
| Fix shipping cost persistence bug | ✅ Done | Jan 20 | Was hardcoded to $15, now dynamic |
| E2E test with shipping fix | ✅ Passed | Jan 20 | Full flow verified |

---

## Bug Fix Applied (Jan 20, 2026)

### Issue: Shipping Cost Not Persisted Correctly

**Problem:** After payment, the order was created with **$15 shipping** instead of the correct **$8 for Panama**.

**Fix Applied:**
1. Added `shipping_cost` column to `checkout_sessions` table
2. Updated session API to store `shippingCost`
3. Updated `CheckoutClient.tsx` to send `shippingCost`
4. Updated payment callback to use stored value

**Verified:** E2E test confirmed shipping cost now persists correctly.

---

## Current Configuration

### Shipping Rates
| Location | Method | Cost | Details |
|----------|--------|------|---------|
| Panama | Delivery | $8.00 | 3-5 días |
| Panama | Pickup | $0.00 | Terrazas de Albrook, Local B15 |
| International | Delivery | $25.00 | 7-14 días |

**Pickup Location:**
- Address: Ave. Omar Torrijos Herrera CC Terrazas de Albrook, Local B15, Panamá
- Hours: 9:00 AM - 5:00 PM
- Note: Items available 24 hours after order is placed

### Email Configuration
| Service | Provider | From Address |
|---------|----------|--------------|
| Transactional (orders, shipping) | SendGrid | admin@zyroonline.com |
| Auth (signup, password reset) | Supabase SMTP via SendGrid | admin@zyroonline.com |

---

## Remaining Tasks Before Go-Live

### High Priority (Required)

| # | Task | Effort | Notes |
|---|------|--------|-------|
| 1 | **Switch PagueloFacil to production** | Low | Change `PAGUELOFACIL_ENV=production` in `.env` |
| 2 | **Set production domain in Supabase** | Low | Update Site URL and Redirect URLs |
| 3 | **Verify SendGrid domain authentication** | Low | Ensure `zyroonline.com` is verified |

### Medium Priority (Recommended)

| # | Task | Effort | Notes |
|---|------|--------|-------|
| 4 | Create static pages | Medium | Privacy Policy, Terms of Service, About Us |
| 5 | Add favicon and meta tags | Low | SEO and branding |
| 6 | Configure Google Analytics | Low | Track user behavior |

### Low Priority (Nice to Have)

| # | Task | Effort | Notes |
|---|------|--------|-------|
| 7 | Add size guide page | Low | Help customers choose frame sizes |
| 8 | Add shipping info page | Low | Explain delivery times and pickup |
| 9 | Add contact page | Low | Contact form or info |

---

## Deployment Checklist

### Environment Variables to Update for Production

```bash
# PagueloFacil - Switch to production
PAGUELOFACIL_ENV=production
PAGUELOFACIL_CCLW=your-production-merchant-id

# Verify these are set
SENDGRID_API_KEY=SG.xxx
EMAIL_FROM_ADDRESS=admin@zyroonline.com

# Supabase (should already be production)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

### Supabase Dashboard Settings
- [ ] Site URL → `https://zyroonline.com`
- [ ] Redirect URLs → Add `https://zyroonline.com/**`
- [ ] SMTP verified and working

### DNS/Hosting
- [ ] Domain pointing to hosting provider
- [ ] SSL certificate configured
- [ ] Environment variables set in hosting platform

---

## Session Notes

- **2026-01-18**: Created plan, confirmed pickup location and shipping rate
- **2026-01-19**: Completed all major tasks, E2E test passed, found shipping cost bug
- **2026-01-20**: Fixed shipping cost persistence bug, verified with E2E test - **READY FOR DEPLOYMENT**
