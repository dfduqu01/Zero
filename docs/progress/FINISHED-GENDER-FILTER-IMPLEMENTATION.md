# Plan: Add Gender Filter to /products Page

> **Status:** IN PROGRESS
> **Created:** 2026-01-30
> **Environment:** Development (zyro-app-edv)

## Overview
Add a gender filter to the products page, populated from ERP sync data.

**Key Discovery:** The `Genero_Parent` field from dubros.com contains **text values** (FEMENINO, MASCULINO, UNISEX), not IDs. The database `gender` column already exists with CHECK constraint for 'Male', 'Female', 'Unisex'.

**Localization approach:**
- **Database values:** English (`Male`, `Female`, `Unisex`) - matches existing constraint
- **UI labels:** Spanish (`Hombre`, `Mujer`, `Unisex`) - what users see in dropdown

---

## Files to Modify

| File | Change | Status |
|------|--------|--------|
| `lib/erp/product-mapper.ts` | Fix `mapGender()` to map Spanish → English | [ ] |
| `app/products/ProductFilters.tsx` | Add gender to FilterState + dropdown UI | [ ] |
| `app/products/ProductsClient.tsx` | Add gender to Product interface + filtering logic | [ ] |
| `lib/types/product.ts` | Add gender to shared Product interface | [ ] |

---

## Implementation Steps

### Step 1: Fix ERP Gender Mapping
**File:** `zyro-app/lib/erp/product-mapper.ts` (lines 82-88)

Replace the `mapGender()` function:
```typescript
export function mapGender(generoParent: string | null): 'Male' | 'Female' | 'Unisex' | null {
  if (!generoParent) return null;

  const normalized = generoParent.toUpperCase().trim();

  switch (normalized) {
    case 'FEMENINO':
      return 'Female';
    case 'MASCULINO':
      return 'Male';
    case 'UNISEX':
      return 'Unisex';
    default:
      console.warn(`[mapGender] Unknown gender value: ${generoParent}`);
      return null;
  }
}
```

### Step 2: Update TypeScript Interfaces

**File:** `zyro-app/lib/types/product.ts`
- Add `gender: 'Male' | 'Female' | 'Unisex' | null;` to Product interface

**File:** `zyro-app/app/products/ProductsClient.tsx` (line 8-26)
- Add `gender: 'Male' | 'Female' | 'Unisex' | null;` to local Product interface

### Step 3: Update FilterState
**File:** `zyro-app/app/products/ProductFilters.tsx`

Add `gender: string;` to:
1. `FilterState` interface (line 35-44)
2. Initial state in `useState` (line 53-62) - set to `'all'`
3. `resetFilters()` function (line 72-85) - set to `'all'`

### Step 4: Add Gender Dropdown UI
**File:** `zyro-app/app/products/ProductFilters.tsx`

Add dropdown after Brand filter (around line 226):
```tsx
{/* Gender */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Género
  </label>
  <select
    value={filters.gender}
    onChange={(e) => handleFilterChange('gender', e.target.value)}
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <option value="all">Todos</option>
    <option value="Female">Mujer</option>
    <option value="Male">Hombre</option>
    <option value="Unisex">Unisex</option>
  </select>
</div>
```

### Step 5: Add Gender Filtering Logic
**File:** `zyro-app/app/products/ProductsClient.tsx`

1. Add `gender: 'all'` to initial filters state (line 41-50)
2. Add filter logic in `useMemo` after shape filter (around line 75):
```typescript
if (filters.gender !== 'all') {
  filtered = filtered.filter((p) => p.gender === filters.gender);
}
```

### Step 6: Run ERP Sync
After code changes, trigger ERP sync from admin dashboard to populate gender values.

---

## Verification Checklist

- [ ] **Build check:** `npm run build` - no TypeScript errors
- [ ] **ERP Sync:** Run sync from `/admin/erp-sync`
- [ ] **DB verification:** Check gender populated via Supabase:
  ```sql
  SELECT gender, COUNT(*) FROM products GROUP BY gender;
  ```
  Expected: ~3,194 Female, ~1,358 Male, ~112 Unisex
- [ ] Gender dropdown appears on /products page
- [ ] "Mujer" filter shows female products only
- [ ] "Hombre" filter shows male products only
- [ ] "Unisex" filter shows unisex products only
- [ ] "Todos" shows all products
- [ ] Combined filters work (e.g., Brand + Gender)
- [ ] Reset filters clears gender selection
- [ ] Mobile filter view works correctly
