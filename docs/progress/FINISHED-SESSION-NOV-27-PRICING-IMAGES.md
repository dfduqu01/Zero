# ERP Integration: Pricing & Images Enhancement

**Date**: November 27, 2025
**Status**: 🚀 Ready to Implement
**Estimated Time**: 2.5 hours
**Session Goal**: Add price filtering, dozen pricing, and CloudFront images

---

## 📋 Session Overview

### What We're Adding

1. **Three-Layer Price Filtering** ✅
   - Layer 1: API-level constraint on `Price` field (dubros.com confirmed supports this)
   - Layer 2: Client-side safety filter on raw price
   - Layer 3: Filter on calculated per-unit price (critical for dozen products)

2. **Dozen vs Unit Pricing** ✅
   - Detect from `Tipo_Venta_Parent` or `Tipo_Venta_Text` field
   - Calculate per-unit price (divide wholesale by 12)
   - Store both wholesale and unit prices in database
   - Always display unit price to customers

3. **CloudFront Image URLs** ✅
   - Low-res from dubros DB for product grid (~1024x682 variable)
   - High-res from CloudFront CDN (1800x1200): `https://dhbamyabyqtec.cloudfront.net/{SKU}.jpg`
   - No image processing/resizing needed - just URL construction
   - Fix CSS with `object-contain` for proper display

4. **Admin UI - Price Threshold** ✅
   - "Precio Mínimo" input field (default: $3.00)
   - Help text explaining dozen pricing behavior
   - Display settings used in sync results
   - Settings saved in sync logs for audit trail

---

## 🎯 Why Three-Layer Filtering?

**Problem**: Products sold by dozen need accurate per-unit filtering

**Example**:
```
Product: "Eyeglass Frames Kit - Dozen Pack"
- Tipo_Venta: "DOCENA"
- Price: $30 (wholesale, per dozen)
- Min threshold: $3 per unit

Layer 1 (API): 30 > 3 ✅ PASS (dubros filters by wholesale)
Layer 2 (Raw): 30 >= 3 ✅ PASS (safety check)
Layer 3 (Calculated): 30/12 = $2.50 < $3 ❌ FAIL

Result: Correctly filtered out! ✅
```

**Without Layer 3**: Product would be imported at $2.50/unit (below threshold) ❌

---

## 📝 Implementation Checklist

### Phase 1: Database Schema (15 mins)
- [ ] Create migration: `20251127000000_add_pricing_and_cloudfront.sql`
- [ ] Add `price_wholesale`, `price_per_unit`, `is_sold_by_dozen` to products table
- [ ] Add `cloudfront_url` to product_images table
- [ ] Add `min_price_threshold`, `sync_settings` to erp_sync_logs table
- [ ] Push migration to Supabase

### Phase 2: Update Types (5 mins)
- [ ] Add `Tipo_Venta_Parent`, `Tipo_Venta_Text` to `DubrosProduct` interface
- [ ] Add `minPrice` to `FetchProductsOptions` interface
- [ ] Add pricing and CloudFront fields to `MappedProduct` interface
- [ ] Add `SyncSettings` interface with `minPrice` field

### Phase 3: dubros Client - Price Filter (10 mins)
- [ ] Add `minPrice` constraint to `fetchProducts()` API call (Layer 1)
- [ ] Add client-side safety filter on raw price (Layer 2)
- [ ] Log when client-side filtering is needed

### Phase 4: Product Mapper - Pricing + CloudFront (20 mins)
- [ ] Detect dozen products from `Tipo_Venta` field
- [ ] Calculate per-unit price (wholesale / 12 if dozen)
- [ ] Calculate display price (always per-unit)
- [ ] Construct CloudFront URL pattern
- [ ] Update `validateDubrosProduct()` to check minimum price
- [ ] Return all pricing fields in mapped product

### Phase 5: Sync Service - Settings & Layer 3 Filter (30 mins)
- [ ] Add `SyncSettings` parameter to `executeSync()`
- [ ] Get `minPrice` from settings or environment variable (default: $3.00)
- [ ] Pass `minPrice` to dubros client
- [ ] Track settings in sync log creation
- [ ] Implement Layer 3: Filter mapped products by `price_per_unit >= minPrice`
- [ ] Log filtered dozen products with details
- [ ] Save filtered products to `erp_sync_errors` with reason
- [ ] Update product upsert to include new pricing fields
- [ ] Update image upsert to include CloudFront URL
- [ ] Return settings used in sync result

### Phase 6: API Route - Accept Settings (10 mins)
- [ ] Parse `minPrice` from POST body
- [ ] Validate `minPrice` (must be >= 0)
- [ ] Pass settings to sync service
- [ ] Return settings used in response

### Phase 7: Admin UI - Price Threshold Input (20 mins)
- [ ] Add "Precio Mínimo" input field with default value
- [ ] Add help text explaining dozen pricing
- [ ] Keep "Límite de Prueba" field for testing
- [ ] Send `minPrice` in fetch request
- [ ] Display settings used in results card
- [ ] Show per-unit price explanation

### Phase 8: Frontend - Image Display Fix (15 mins)
- [ ] Find ProductCard component
- [ ] Update to use `image_url` (low-res) with `object-contain`
- [ ] Find ProductDetail component
- [ ] Update to use `cloudfront_url` (high-res) with `object-contain`
- [ ] Ensure Next.js Image component configured with proper sizes
- [ ] Add fallback to `image_url` if CloudFront URL fails

### Phase 9: Testing (30 mins)
- [ ] Test sync with `minPrice = 3.00`
- [ ] Test sync with `minPrice = 5.00`
- [ ] Verify dozen products correctly filtered (Layer 3)
- [ ] Verify unit products pass through
- [ ] Check database: `price_wholesale`, `price_per_unit`, `is_sold_by_dozen`
- [ ] Check database: `cloudfront_url` in product_images
- [ ] Verify images display correctly on product grid
- [ ] Verify images display correctly on product detail page
- [ ] Check sync logs have `min_price_threshold` and `sync_settings`
- [ ] Review filtered products in `erp_sync_errors`

---

## 📊 Database Schema Changes

```sql
-- Products table
ALTER TABLE products
  ADD COLUMN price_wholesale DECIMAL(10,2),
  ADD COLUMN price_per_unit DECIMAL(10,2),
  ADD COLUMN is_sold_by_dozen BOOLEAN DEFAULT false;

-- Product images table
ALTER TABLE product_images
  ADD COLUMN cloudfront_url TEXT;

-- Sync logs table
ALTER TABLE erp_sync_logs
  ADD COLUMN min_price_threshold DECIMAL(10,2),
  ADD COLUMN sync_settings JSONB;
```

---

## 🔍 Key Code Locations

**Files to Modify**:
1. `supabase/migrations/20251127000000_add_pricing_and_cloudfront.sql` (NEW)
2. `lib/erp/types.ts` (Update interfaces)
3. `lib/erp/dubros-client.ts` (Add Layer 1 & 2 filters)
4. `lib/erp/product-mapper.ts` (Add pricing logic)
5. `lib/services/erp-sync-service.ts` (Add Layer 3 filter)
6. `app/api/admin/erp-sync/route.ts` (Accept settings)
7. `app/admin/erp-sync/ErpSyncClient.tsx` (Add UI inputs)
8. Find and update: Product display components (grid + detail)

---

## ✅ Success Criteria

- [ ] Sync accepts `minPrice` parameter from UI
- [ ] Products below threshold are filtered (all 3 layers)
- [ ] Dozen products calculate per-unit price correctly
- [ ] Dozen products below unit threshold are filtered
- [ ] Database stores wholesale, per-unit, and display prices
- [ ] Images display correctly using CloudFront URLs
- [ ] CSS uses `object-contain` for proper aspect ratio
- [ ] Sync logs track threshold and settings used
- [ ] Filtered products logged with detailed reasons

---

## 🚀 After This Session

**Next Session**: Implement background job system (5 hours)
- Job queue table
- Edge Functions for async processing
- Progress tracking and polling
- Cancellation support
- CSV/Excel export of errors

**Documentation Updated**:
- ✅ `ERP-INTEGRATION.md` - Added three-layer filtering section
- ✅ `BACKGROUND-JOB-IMPLEMENTATION-PLAN.md` - Updated with Phase 0

---

## 📞 Quick Reference

**CloudFront URL Pattern**:
```typescript
const cloudfrontUrl = `https://dhbamyabyqtec.cloudfront.net/${sku}.jpg`;
```

**Dozen Detection**:
```typescript
const tipoVenta = dubrosProduct.Tipo_Venta_Parent || dubrosProduct.Tipo_Venta_Text || '';
const isSoldByDozen = tipoVenta.toUpperCase().includes('DOCENA') ||
                      tipoVenta.toUpperCase() === 'DOZEN';
```

**Price Calculation**:
```typescript
const wholesalePrice = dubrosProduct.Price;
const perUnitPrice = isSoldByDozen ? wholesalePrice / 12 : wholesalePrice;
const displayPrice = perUnitPrice;
```

**Layer 3 Filter**:
```typescript
if (mapped.price_per_unit >= minPrice) {
  // Keep product
} else {
  // Filter out and log
  console.log(`Filtered ${mapped.sku}: $${mapped.price_per_unit} < $${minPrice}`);
}
```

---

**Ready to start!** 🚀
