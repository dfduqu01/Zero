# User-Side Adjustments Plan

**Date:** 2025-11-09 (Updated 2025-11-10)
**Status:** ✅ COMPLETED (2025-11-10)
**Phase:** Post Phase 3 - User Experience Improvements

---

## Overview

This document outlines small but important adjustments needed on the user-facing side of the application before proceeding with admin-side implementation.

**ALL ISSUES HAVE BEEN RESOLVED** ✅

---

## Issues Identified & Resolved

### Issue 1: Email Authentication Redirect ✅
**Problem:** When users authenticate through email confirmation links, they are redirected to `/products` instead of `/cart`, potentially losing their shopping session context.

**Impact:** Users who add items to cart before signing up lose the cart context after email confirmation.

**Status:** ✅ FIXED

### Issue 2: Incomplete Country List in Checkout ✅
**Problem:** The checkout address form only shows 5 countries (México, Colombia, Argentina, Chile, Perú) instead of the full 17 Latin American countries available in other parts of the app.

**Impact:** Users from other Latin American countries cannot complete checkout.

**Status:** ✅ FIXED

### Issue 3: Missing Header Navigation ✅
**Problem:** Orders, order details, checkout, and profile pages were missing the site header, making navigation difficult.

**Impact:** Users couldn't navigate to other sections from these pages without using browser back button.

**Status:** ✅ FIXED

### Issue 4: Prescription Data in English ✅
**Problem:** All prescription-related data (lens types, prescription types, indexes, view areas) was stored in English in the database instead of Spanish.

**Impact:** Spanish-speaking customers saw English text during prescription configuration ("Photochromatic" instead of "Fotocromático", etc.).

**Status:** ✅ FIXED

---

## Current Implementation Details

### Email Authentication Flow

#### File: `/app/auth/callback/route.ts`
**Line 8:**
```typescript
const next = searchParams.get("next") ?? "/products";
```
- Default redirect is hardcoded to `/products`
- Should default to `/cart` to preserve shopping context

#### File: `/components/register-form.tsx`
**Line 91:**
```typescript
emailRedirectTo: `${window.location.origin}/auth/callback?next=/products`,
```
- Registration form explicitly sets redirect to `/products`
- Should be changed to `/cart`

---

### Country Selection Implementation

#### File: `/app/checkout/CheckoutClient.tsx`
**Lines 410-415:**
```typescript
<select id="country" className="..." value={addressForm.country} ...>
  <option value="México">México</option>
  <option value="Colombia">Colombia</option>
  <option value="Argentina">Argentina</option>
  <option value="Chile">Chile</option>
  <option value="Perú">Perú</option>
</select>
```
**Status:** ❌ Only 5 countries (INCOMPLETE)

#### File: `/app/profile/ProfileClient.tsx`
**Lines 100-118:**
```typescript
const countries = [
  'Argentina', 'Bolivia', 'Chile', 'Colombia', 'Costa Rica',
  'Ecuador', 'El Salvador', 'Guatemala', 'Honduras', 'México',
  'Nicaragua', 'Panamá', 'Paraguay', 'Perú', 'República Dominicana',
  'Uruguay', 'Venezuela',
];
```
**Status:** ✅ Complete list (17 countries)

#### File: `/components/register-form.tsx`
**Lines 34-52:**
```typescript
const countries = [
  "Argentina", "Bolivia", "Chile", "Colombia", "Costa Rica",
  "Ecuador", "El Salvador", "Guatemala", "Honduras", "México",
  "Nicaragua", "Panamá", "Paraguay", "Perú", "República Dominicana",
  "Uruguay", "Venezuela",
];
```
**Status:** ✅ Complete list (17 countries)

---

## Proposed Solution

### Task 1: Create Shared Countries Constant
**Action:** Create new file `/lib/constants/countries.ts`

```typescript
export const LATIN_AMERICAN_COUNTRIES = [
  'Argentina',
  'Bolivia',
  'Chile',
  'Colombia',
  'Costa Rica',
  'Ecuador',
  'El Salvador',
  'Guatemala',
  'Honduras',
  'México',
  'Nicaragua',
  'Panamá',
  'Paraguay',
  'Perú',
  'República Dominicana',
  'Uruguay',
  'Venezuela',
] as const;

export type LatinAmericanCountry = typeof LATIN_AMERICAN_COUNTRIES[number];
```

**Rationale:**
- Single source of truth for countries
- Easy to maintain and update
- Type-safe with TypeScript
- Consistent across all forms

---

### Task 2: Fix Email Authentication Redirect

#### Change 1: Update Auth Callback Default
**File:** `/app/auth/callback/route.ts`
**Line 8:**

**Before:**
```typescript
const next = searchParams.get("next") ?? "/products";
```

**After:**
```typescript
const next = searchParams.get("next") ?? "/cart";
```

#### Change 2: Update Registration Form Redirect
**File:** `/components/register-form.tsx`
**Line 91:**

**Before:**
```typescript
emailRedirectTo: `${window.location.origin}/auth/callback?next=/products`,
```

**After:**
```typescript
emailRedirectTo: `${window.location.origin}/auth/callback?next=/cart`,
```

**Expected Outcome:**
- Users who sign up during checkout flow return to cart after email confirmation
- Shopping context is preserved
- Better user experience for cart-to-checkout flow

---

### Task 3: Fix Country Dropdown in Checkout

#### Update Checkout Form
**File:** `/app/checkout/CheckoutClient.tsx`
**Lines 1-2 (add import):**
```typescript
import { LATIN_AMERICAN_COUNTRIES } from '@/lib/constants/countries';
```

**Lines 410-415 (replace hardcoded options):**

**Before:**
```typescript
<select id="country" className="..." value={addressForm.country} ...>
  <option value="México">México</option>
  <option value="Colombia">Colombia</option>
  <option value="Argentina">Argentina</option>
  <option value="Chile">Chile</option>
  <option value="Perú">Perú</option>
</select>
```

**After:**
```typescript
<select id="country" className="..." value={addressForm.country} ...>
  {LATIN_AMERICAN_COUNTRIES.map((country) => (
    <option key={country} value={country}>
      {country}
    </option>
  ))}
</select>
```

---

### Task 4: Refactor Profile to Use Shared Constant

**File:** `/app/profile/ProfileClient.tsx`

**Lines 1-2 (add import):**
```typescript
import { LATIN_AMERICAN_COUNTRIES } from '@/lib/constants/countries';
```

**Lines 100-118 (remove local array):**
Delete the local `countries` constant.

**Lines 741 & 839 (update select dropdowns):**
Replace references to local `countries` with `LATIN_AMERICAN_COUNTRIES`.

---

### Task 5: Refactor Registration Form to Use Shared Constant

**File:** `/components/register-form.tsx`

**Lines 1-2 (add import):**
```typescript
import { LATIN_AMERICAN_COUNTRIES } from '@/lib/constants/countries';
```

**Lines 34-52 (remove local array):**
Delete the local `countries` constant.

**Line 175 (update select dropdown):**
Replace references to local `countries` with `LATIN_AMERICAN_COUNTRIES`.

---

## Implementation Checklist

- [x] Create `/lib/constants/countries.ts` with shared countries constant
- [x] Update `/app/auth/callback/route.ts` - change redirect default to `/cart`
- [x] Update `/components/register-form.tsx` - change emailRedirectTo to `/cart`
- [x] Update `/app/checkout/CheckoutClient.tsx` - use shared countries constant
- [x] Update `/app/profile/ProfileClient.tsx` - use shared countries constant
- [x] Update `/components/register-form.tsx` - use shared countries constant
- [x] Add SiteHeader to `/app/orders/page.tsx`
- [x] Add SiteHeader to `/app/orders/[id]/page.tsx`
- [x] Add SiteHeader to `/app/checkout/page.tsx`
- [x] Replace inline header in `/app/profile/page.tsx` with SiteHeader
- [x] Create migration to translate prescription data to Spanish
- [x] Test email confirmation flow redirects to cart
- [x] Test all address forms show 17 countries
- [x] Verify all prescription data displays in Spanish
- [x] Verify no breaking changes

---

## Testing Plan

### Test 1: Email Authentication Redirect
1. Add items to cart (not logged in)
2. Go to checkout and click "Register"
3. Complete registration form
4. Check email and click confirmation link
5. **Expected:** User is redirected to `/cart` with items still present

### Test 2: Country Selection - Checkout
1. Go to checkout
2. Click "Add new address"
3. Open country dropdown
4. **Expected:** See all 17 Latin American countries listed

### Test 3: Country Selection - Profile
1. Go to profile page
2. Navigate to "Direcciones" tab
3. Click "Add Address"
4. Open country dropdown
5. **Expected:** See all 17 Latin American countries listed

### Test 4: Country Selection - Registration
1. Go to registration page
2. Open country dropdown in registration form
3. **Expected:** See all 17 Latin American countries listed

---

## Files Changed Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `/lib/constants/countries.ts` | **NEW** | Shared countries constant (17 countries) |
| `/app/auth/callback/route.ts` | **EDIT** | Change redirect from `/products` to `/cart` |
| `/components/register-form.tsx` | **EDIT** | Change redirect + use shared constant |
| `/app/checkout/CheckoutClient.tsx` | **EDIT** | Use shared countries constant + add header |
| `/app/profile/ProfileClient.tsx` | **EDIT** | Use shared countries constant |
| `/app/profile/page.tsx` | **EDIT** | Replace inline header with SiteHeader |
| `/app/orders/page.tsx` | **EDIT** | Add SiteHeader component |
| `/app/orders/[id]/page.tsx` | **EDIT** | Add SiteHeader component |
| `/app/checkout/page.tsx` | **EDIT** | Add SiteHeader wrapper |
| `supabase/migrations/translate_prescription_data_to_spanish.sql` | **NEW** | Migration to translate all prescription data |

**Total Files:** 10 (2 new, 8 edited)

## Database Changes

**Migration:** `translate_prescription_data_to_spanish.sql`

Translated all user-facing prescription data from English to Spanish:

### Tables Updated:
1. **prescription_types** - 3 records translated
2. **lens_types** - 6 records translated
3. **lens_indexes** - 4 records translated
4. **view_areas** - 2 records translated

**Total Records Translated:** 15 records

---

## Risk Assessment

**Risk Level:** LOW

**Potential Issues:**
- Users with browsers caching old redirect URLs (minimal impact)
- Country sort order changes (cosmetic only)

**Mitigation:**
- Test in incognito/private browsing
- Verify cart persistence after email confirmation
- Check all dropdowns render correctly

---

## Next Steps

After completing these user-side adjustments:
1. Test all changes thoroughly
2. Document any issues found
3. Proceed with **Admin-Side Implementation** (Phase 4-5)

---

## Related Documentation
- [PRD.md](../PRD.md)
- [DATABASE-SCHEMA.md](../DATABASE-SCHEMA.md)
- [MOSCOW-PRIORITIZATION.md](../MOSCOW-PRIORITIZATION.md)
- [Conversation-2025-nov-08.md](../CONVERSATIONS/Conversation-2025-nov-08.md)
