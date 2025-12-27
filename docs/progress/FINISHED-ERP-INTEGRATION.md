# ERP Integration - dubros.com Sync Planning

**Date**: November 18, 2025
**Status**: ✅ Planning Complete - Ready for Implementation
**Target**: Phase 6 of Implementation Plan
**Estimated Time**: 8-12 hours

---

## Overview

Integrate ZERO e-commerce with dubros.com (B2B platform) to automatically sync product inventory, enable bulk product operations, and maintain catalog synchronization.

**Source System**: dubros.com
**Database**: Producto-lean-mirror
**Sync Strategy**: Full sync (create new products + update existing)
**Frequency**: Every 2 days (48 hours)

---

## dubros.com API Endpoints

⚠️ **IMPORTANT**: URLs shown use `version-test` for testing environment. Production URLs will be:
- Test: `https://dubros.com/version-test/api/1.1/obj/...`
- **Production**: `https://dubros.com/api/1.1/obj/...` (remove `/version-test`)

### 1. Products Endpoint

**URL (Test)**: `https://dubros.com/version-test/api/1.1/obj/Producto-lean-mirror`
**URL (Production)**: `https://dubros.com/api/1.1/obj/Producto-lean-mirror`

**Method**: GET

**Authentication**: Bearer token required for Price field

**Query Parameters**:
```json
{
  "constraints": [
    {
      "key": "Cantidad",
      "constraint_type": "greater than",
      "value": "0"
    },
    {
      "key": "Categoria_Parent",
      "constraint_type": "equals",
      "value": "1655827622559x276190851805177440"
    }
  ]
}
```

**Response Structure**:
```json
{
  "response": {
    "cursor": 0,
    "results": [
      {
        "_id": "1658781785844x377916183000661200",
        "Referencia": "GM0290C091",
        "Descripcion": "AROS OPTICOS METAL GUESS MARCIANO W/CASE",
        "Categoria_Parent": "1655827622559x276190851805177440",
        "Brand_Parent": null,
        "Material_Parent": "1656610751041x740766785224936700",
        "Genero_Parent": null,
        "Talla_ocular": null,
        "Tipo_Venta_Parent": "PIEZA",
        "Flex_Parent": null,
        "Imagen_Low_Res": "//s3.amazonaws.com/appforest_uf/f1659543567535x636614815455612200/GM0290C091.jpg",
        "Cantidad": 1,
        "Slug": null,
        "promo": null
      }
    ]
  }
}
```

### 2. Categories Endpoint

**URL (Test)**: `https://dubros.com/version-test/api/1.1/obj/Categoria`
**URL (Production)**: `https://dubros.com/api/1.1/obj/Categoria`

**Method**: GET

**Authentication**: None

**Response Structure**:
```json
{
  "response": {
    "cursor": 0,
    "results": [
      {
        "_id": "1655827622559x276190851805177440",
        "Nombre": "Aros opticos"
      },
      {
        "_id": "1655827630352x227004568853370600",
        "Nombre": "Sol"
      },
      {
        "_id": "1655827645765x567458492681560000",
        "Nombre": "Seguridad industrial"
      }
    ]
  }
}
```

**Key Field**: `Nombre` (Spanish for "Name")

---

### 3. Brands Endpoint

**URL (Test)**: `https://dubros.com/version-test/api/1.1/obj/Brands`
**URL (Production)**: `https://dubros.com/api/1.1/obj/Brands`

**Method**: GET

**Authentication**: None

**Query Parameters** (recommended):
```json
{
  "constraints": [
    {
      "key": "active",
      "constraint_type": "equals",
      "value": "yes"
    }
  ]
}
```

**Response Structure**:
```json
{
  "response": {
    "cursor": 0,
    "results": [
      {
        "_id": "1654532244367x650529125219644200",
        "Name": "Belluno",
        "Logo": "//s3.amazonaws.com/appforest_uf/f1654532240098x456360325454682430/Belluno.png",
        "active": true,
        "Created Date": "2022-06-06T16:17:24.367Z",
        "Modified Date": "2025-06-20T19:21:36.992Z",
        "Created By": "admin_user_dubrosonline-homepage_test"
      },
      {
        "_id": "1654532281484x394233278793120450",
        "Name": "Boloco",
        "Logo": "//s3.amazonaws.com/appforest_uf/f1654532277550x162099524813589700/Boloco.png",
        "active": true,
        "Created Date": "2022-06-06T16:18:01.484Z",
        "Modified Date": "2025-06-20T19:21:36.791Z",
        "Created By": "admin_user_dubrosonline-homepage_test"
      }
    ]
  }
}
```

**Key Fields**:
- `Name` (brand name - note: uses `Name`, not `Nombre`)
- `Logo` (brand logo URL - protocol-less, add `https:`)
- `active` (boolean - filter by `active=yes`)

---

### 4. Materials Endpoint

**URL (Test)**: `https://dubros.com/version-test/api/1.1/obj/Product_Material`
**URL (Production)**: `https://dubros.com/api/1.1/obj/Product_Material`

**Method**: GET

**Authentication**: None

**Response Structure**:
```json
{
  "response": {
    "cursor": 0,
    "results": [
      {
        "_id": "1656610751041x740766785224936700",
        "Nombre": "Metal",
        "Created Date": "2022-06-30T17:39:11.041Z",
        "Modified Date": "2022-06-30T17:39:11.047Z",
        "Created By": "admin_user_dubrosonline-homepage_test"
      },
      {
        "_id": "1656610761710x494212675609572600",
        "Nombre": "Policarbonato",
        "Created Date": "2022-06-30T17:39:21.710Z",
        "Modified Date": "2022-06-30T17:39:21.716Z",
        "Created By": "admin_user_dubrosonline-homepage_test"
      }
    ]
  }
}
```

**Key Field**: `Nombre` (Spanish for "Name")

---

## 📋 FINAL DATA MAPPING: dubros.com ↔ ZERO

### Complete Field Mapping with Authentication

**Authenticated Response Structure** (with Bearer token):
```json
{
  "response": {
    "cursor": 0,
    "results": [
      {
        "_id": "1658781785844x377916183000661200",
        "Referencia": "GM0290C091",
        "Descripcion": "AROS OPTICOS METAL GUESS MARCIANO W/CASE",
        "Price": 336,
        "Cantidad": 1,
        "Categoria_Parent": "1655827622559x276190851805177440",
        "Categoria_Text": "SN",
        "Brand_Parent": "...",
        "Brand_text": "GUESS",
        "Material_Parent": "1656610751041x740766785224936700",
        "Material_Text": "METAL",
        "Genero_Parent": null,
        "Talla_ocular": null,
        "Imagen_Low_Res": "//s3.amazonaws.com/appforest_uf/f1659543567535x636614815455612200/GM0290C091.jpg",
        "Image_high_Res": "//s3.amazonaws.com/appforest_uf/f1662480812408x767502939231234900/GM0290C091.jpg",
        "Created Date": "2022-07-25T20:43:05.891Z",
        "Modified Date": "2022-09-07T16:11:27.108Z",
        "Last_Updated": "2022-09-07T16:11:18.683Z"
      }
    ]
  }
}
```

### Product Fields Mapping

| dubros.com | ZERO | Required? | If Missing/Null? |
|------------|------|-----------|------------------|
| `_id` | `erp_id` | ➕ NEW | Store dubros ID for tracking |
| `Referencia` | `sku` | ✅ **REQUIRED** | ❌ Skip product, log error |
| `Descripcion` | `name` | ✅ **REQUIRED** | ❌ Skip product, log error |
| `Descripcion` | `description` | ✅ **REQUIRED** | Same as name |
| `Price` | `price` | ✅ **REQUIRED** | ❌ Skip product, log error |
| `Categoria_Parent` (ID) | `category_id` | ✅ **REQUIRED** | ❌ Skip product, log error |
| `Brand_Parent` (ID) | `brand_id` | ✅ **REQUIRED** | ❌ Skip product, log error |
| `Cantidad` | `stock_quantity` | ✅ **REQUIRED** | Set to 0 if missing |
| `Material_Parent` (ID) | `frame_material_id` | ⚪ Optional | ✅ Create with NULL, bulk edit later |
| `Genero_Parent` (ID) | `gender` | ⚪ Optional | ✅ Create with NULL, bulk edit later |
| `Talla_ocular` | `lens_width` | ⚪ Optional | ✅ Create with NULL, bulk edit later |
| `Imagen_Low_Res` | `product_images.image_url` | ⚪ Optional | ✅ Create without image, add later |
| `Image_high_Res` | - | - | **IGNORE** (use low res for speed) |
| `Categoria_Text` | - | - | **IGNORE** (not reliable, use _Parent ID) |
| `Brand_text` | - | - | **IGNORE** (not reliable, use _Parent ID) |
| `Material_Text` | - | - | **IGNORE** (not reliable, use _Parent ID) |
| `Tipo_Venta_Parent` | - | - | **IGNORE** |
| `Flex_Parent` | - | - | **IGNORE** (B2B only) |
| `entrada_parent` | - | - | **IGNORE** |
| `INDEX` | - | - | **IGNORE** |
| `Created Date` | - | - | **IGNORE** (use ZERO's timestamp) |
| `Modified Date` | - | - | **IGNORE** |
| `Last_Updated` | `erp_last_synced_at` | ➕ NEW | Track last sync timestamp |
| - | `bridge_width` | ⚪ Optional | NULL (manual bulk edit later) |
| - | `temple_length` | ⚪ Optional | NULL (manual bulk edit later) |
| - | `frame_shape_id` | ⚪ Optional | NULL (manual bulk edit later) |
| - | `low_stock_threshold` | - | Default: 5 |
| - | `is_active` | - | Default: true |
| - | `sync_status` | ➕ NEW | 'synced' (or 'error') |

### API Endpoints (Confirmed)

**Note**: Test URLs use `/version-test/`. Production URLs remove this: `https://dubros.com/api/1.1/obj/...`

| Entity | Endpoint (Test) | Auth? | Key Fields |
|--------|-----------------|-------|------------|
| Products | `.../Producto-lean-mirror` | ✅ Bearer | `_id`, `Referencia`, `Descripcion`, `Price`, `Cantidad`, etc. |
| Categories | `.../Categoria` | ❌ No | `_id`, `Nombre` |
| Brands | `.../Brands?constraints=[{"key":"active","constraint_type":"equals","value":"yes"}]` | ❌ No | `_id`, **`Name`**, `Logo`, `active` |
| Materials | `.../Product_Material` | ❌ No | `_id`, `Nombre` |

### Lookup Resolution Strategy

**Always use `_Parent` IDs** (do NOT rely on `_Text` fields):

1. **Fetch lookup tables first**:
   ```
   GET /Categoria → Parse response.results[]
      For each: { _id, Nombre } → Map dubros_id → {name: Nombre, zero_category_id}

   GET /Brands?constraints=[{"key":"active","constraint_type":"equals","value":"yes"}]
      For each: { _id, Name, Logo } → Map dubros_id → {name: Name, logo: Logo, zero_brand_id}

   GET /Product_Material → Parse response.results[]
      For each: { _id, Nombre } → Map dubros_id → {name: Nombre, zero_material_id}
   ```

   **⚠️ Important**:
   - Categories use `Nombre` field
   - Materials use `Nombre` field
   - **Brands use `Name` field** (not `Nombre`!)

2. **For each product**:
   ```
   Categoria_Parent → Lookup in categoryMap → Get zero_category_id
   Brand_Parent → Lookup in brandMap → Get zero_brand_id
   Material_Parent → Lookup in materialMap → Get zero_material_id (or NULL)
   ```

3. **Auto-create missing lookups**:
   ```
   If dubros category not found in ZERO:
      → INSERT INTO categories (name, slug, erp_id)
      → VALUES (Nombre, slugify(Nombre), _id)

   If dubros brand not found in ZERO:
      → INSERT INTO brands (name, slug, logo_url, erp_id)
      → VALUES (Name, slugify(Name), 'https:' + Logo, _id)

   If dubros material not found in ZERO:
      → INSERT INTO frame_materials (name, erp_id)
      → VALUES (Nombre, _id)
   ```

   **Brand Logo Handling**:
   - Logo URL format: `//s3.amazonaws.com/appforest_uf/...`
   - Add `https:` protocol when storing in ZERO
   - Optional: Download and re-upload to Supabase Storage (Phase 2)

---

## 🖼️ IMAGE STRATEGY - Two-Tier System

### dubros.com Image Architecture

dubros.com uses a **two-tier image system** for performance:

1. **Low-Resolution Images** (Product Lists)
   - **Source**: `Imagen_Low_Res` field in API response
   - **Format**: `//s3.amazonaws.com/appforest_uf/f1659543567535x636614815455612200/GM0290C091.jpg`
   - **Purpose**: Fast loading in product grids/lists
   - **Size**: Small, optimized for thumbnails

2. **High-Resolution Images** (Product Detail)
   - **Source**: Public S3 bucket (predictable URL pattern)
   - **Bucket**: `https://dubros-image-repository.s3.us-east-1.amazonaws.com/`
   - **URL Pattern**: `{BUCKET_URL}/{Referencia}.jpg`
   - **Example**: `https://dubros-image-repository.s3.us-east-1.amazonaws.com/OR5042C001.jpg`
   - **Purpose**: High-quality display on product detail page
   - **Access**: Public (no authentication required)

### How to Construct High-Res URL

```javascript
// Given a product with SKU (Referencia)
const sku = "OR5042C001";
const highResUrl = `https://dubros-image-repository.s3.us-east-1.amazonaws.com/${sku}.jpg`;

// This image is publicly accessible and already hosted on fast S3
```

### Image Strategy Options for ZERO

#### **Option A: Reference URLs Directly (Recommended)**

**Pros**:
- ✅ **Fastest sync** - No download/upload time
- ✅ **No storage costs** - Images stay on dubros S3
- ✅ **Instant availability** - Images already CDN-optimized
- ✅ **Simple implementation** - Just store URLs
- ✅ **Automatic updates** - If dubros updates image, ZERO shows new version

**Cons**:
- ⚠️ **Dependency** - Relies on dubros S3 bucket availability
- ⚠️ **No control** - Can't optimize/resize ourselves
- ⚠️ **URL changes** - If dubros changes bucket, links break

**Implementation**:
```javascript
// Store in product_images table
{
  product_id: uuid,
  image_url: "https://s3.amazonaws.com/appforest_uf/.../GM0290C091.jpg", // Low-res
  image_url_high: "https://dubros-image-repository.s3.us-east-1.amazonaws.com/GM0290C091.jpg", // High-res
  is_primary: true
}
```

#### **Option B: Download & Re-upload to Supabase (Original Plan)**

**Pros**:
- ✅ **Full control** - Own the images
- ✅ **Independence** - Not dependent on dubros infrastructure
- ✅ **Optimization** - Can resize/compress as needed
- ✅ **Branding** - Images served from ZERO domain

**Cons**:
- ❌ **Slower sync** - Download + upload time per image
- ❌ **Storage costs** - Supabase Storage fees
- ❌ **Complexity** - More error handling needed
- ❌ **Stale images** - If dubros updates, ZERO doesn't auto-update

**Implementation**:
```javascript
// Download both images
const lowResImage = await downloadImage(product.Imagen_Low_Res);
const highResImage = await downloadImage(`https://dubros-image-repository.s3.us-east-1.amazonaws.com/${product.Referencia}.jpg`);

// Compress
const compressedLow = await compressImage(lowResImage);
const compressedHigh = await compressImage(highResImage);

// Upload to Supabase Storage
const lowResUrl = await uploadToSupabase(compressedLow, 'low');
const highResUrl = await uploadToSupabase(compressedHigh, 'high');
```

#### **Option C: Hybrid Approach**

**Strategy**:
- **Phase 1 (Launch)**: Reference URLs directly (Option A) for speed
- **Phase 2 (Later)**: Background job to download/re-upload high-priority products
- **Benefits**: Fast initial sync, gradual migration to owned assets

### **✅ FINAL DECISION: Option A (Reference URLs)**

**Status**: ✅ **APPROVED** - We will reference dubros S3 URLs directly

**Why**:
1. **Speed**: Sync completes in minutes, not hours
2. **Cost**: Zero storage costs initially
3. **Performance**: Amazon S3 is already fast and globally distributed
4. **Simplicity**: Less code, fewer failure points
5. **Pragmatic**: Can migrate to Option B later if needed
6. **Testing**: We'll monitor load times and can switch to Option B if performance is an issue

**Database Schema Addition**:
```sql
ALTER TABLE product_images
  ADD COLUMN image_url_high TEXT; -- High-res image URL

-- Example data:
-- image_url: "https://s3.amazonaws.com/.../low-res.jpg"
-- image_url_high: "https://dubros-image-repository.s3.us-east-1.amazonaws.com/SKU123.jpg"
```

**Frontend Usage**:
```tsx
// Product List (fast loading)
<Image src={product.image_url} alt={product.name} />

// Product Detail (high quality)
<Image src={product.image_url_high || product.image_url} alt={product.name} />
```

### Image Sync Process (Simplified)

```javascript
// For each product during sync:
const lowResUrl = `https:${product.Imagen_Low_Res}`; // Add protocol
const highResUrl = `https://dubros-image-repository.s3.us-east-1.amazonaws.com/${product.Referencia}.jpg`;

// Store both URLs (no download needed)
await supabase
  .from('product_images')
  .insert({
    product_id: productId,
    image_url: lowResUrl,      // Low-res for lists
    image_url_high: highResUrl, // High-res for detail page
    is_primary: true
  });
```

**Validation**: Optionally check if high-res image exists:
```javascript
// Quick HEAD request to verify image exists
const response = await fetch(highResUrl, { method: 'HEAD' });
if (!response.ok) {
  // Fallback to low-res if high-res doesn't exist
  highResUrl = lowResUrl;
}
```

---

## 🚫 SKIPPED PRODUCTS TRACKING SYSTEM

### Overview

Products that fail to sync due to missing **required fields** (SKU, Price, Category, Brand) will be tracked in the existing `erp_sync_errors` table. This allows admins to review, manually create, or fix products later.

### Error Logging Structure

For each skipped product, log to `erp_sync_errors`:

```json
{
  "sync_log_id": "abc-123-def-456",
  "product_sku": "GM0290C091",
  "error_message": "Missing required field: Brand_Parent",
  "error_details": {
    "reason": "missing_required_field",
    "missing_fields": ["Brand_Parent"],
    "validation_errors": [],
    "dubros_raw_data": {
      "_id": "1658781785844x377916183000661200",
      "Referencia": "GM0290C091",
      "Descripcion": "AROS OPTICOS METAL GUESS MARCIANO W/CASE",
      "Price": 336,
      "Categoria_Parent": "1655827622559x276190851805177440",
      "Brand_Parent": null,
      "Material_Parent": "1656610751041x740766785224936700",
      "Cantidad": 1,
      "Imagen_Low_Res": "//s3.amazonaws.com/..."
    }
  },
  "created_at": "2025-11-18T10:30:00Z"
}
```

### Admin UI: Skipped Products Tab

Add to `/app/admin/erp-sync/page.tsx`:

```
┌─────────────────────────────────────────────────────────┐
│  ERP Sync Dashboard                                      │
├─────────────────────────────────────────────────────────┤
│  Tabs: [Overview] [Sync History] [Skipped Products]    │
└─────────────────────────────────────────────────────────┘

📊 Skipped Products (15 items from last sync)
═══════════════════════════════════════════════════════════

Filter: [All] [Missing Brand] [Missing Category] [Missing Price] [Other]

┌──────────────────────────────────────────────────────────┐
│ 🚫 SKU: GM0290C091                                       │
│ 📦 Name: AROS OPTICOS METAL GUESS MARCIANO W/CASE      │
│ ⚠️  Reason: Missing Brand_Parent                        │
│ 🕐 From Sync: 2025-11-18 10:30 AM                      │
│                                                          │
│ Available Data: Price: $336, Stock: 1, Category: ✓     │
│                                                          │
│ [View Full Data] [Create Manually] [Ignore Forever]    │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ 🚫 SKU: OAK-12345                                        │
│ 📦 Name: OAKLEY SPORTS SUNGLASSES                       │
│ ⚠️  Reason: Missing Categoria_Parent                    │
│ 🕐 From Sync: 2025-11-18 10:30 AM                      │
│                                                          │
│ Available Data: Price: $199, Stock: 5, Brand: ✓        │
│                                                          │
│ [View Full Data] [Create Manually] [Ignore Forever]    │
└──────────────────────────────────────────────────────────┘

Actions: [Export to CSV] [Clear Resolved] [Refresh]
```

### Modal: "View Full Data"

When admin clicks "View Full Data":

```
┌─────────────────────────────────────────────────────────┐
│  📦 Skipped Product Details                             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  SKU: GM0290C091                                        │
│  Name: AROS OPTICOS METAL GUESS MARCIANO W/CASE        │
│  Price: $336                                            │
│  Stock: 1                                               │
│  dubros ID: 1658781785844x377916183000661200           │
│                                                          │
│  ⚠️ Missing Required Fields:                            │
│  • Brand_Parent: null                                   │
│                                                          │
│  ✅ Available Data:                                      │
│  • Category: Aros opticos (1655827622559x...)          │
│  • Material: METAL (1656610751041x...)                 │
│  • Description: Full text...                            │
│  • Image: [Preview thumbnail]                           │
│                                                          │
│  📄 Raw dubros.com Data:                                │
│  ▼ Show JSON (expandable)                              │
│    {                                                     │
│      "_id": "1658781785844x377916183000661200",        │
│      "Referencia": "GM0290C091",                        │
│      "Price": 336,                                      │
│      ...                                                │
│    }                                                     │
│                                                          │
│  🛠️ Actions:                                            │
│  [Create Product Manually] [Copy JSON] [Close]         │
└─────────────────────────────────────────────────────────┘
```

### "Create Manually" Flow

When admin clicks "Create Product Manually":

**Step 1: Pre-filled Product Form**
- Opens standard product creation form
- **Auto-populated fields** from dubros data:
  - ✅ SKU: "GM0290C091" (read-only, cannot change)
  - ✅ Name: "AROS OPTICOS METAL GUESS..."
  - ✅ Price: 336
  - ✅ Stock: 1
  - ✅ Category: Pre-selected (if available)
  - ❌ Brand: Empty (admin must select)
  - ✅ Material: Pre-selected (if available)
  - ✅ Description: Auto-filled
  - 🖼️ Image: Auto-downloading in background

**Step 2: Admin fills missing fields**
- Select Brand from dropdown (or create new brand)
- Verify/adjust other fields
- Add optional fields (lens_width, etc.)

**Step 3: Save**
- Product created with `sync_status = 'manual'`
- Mark error record as "resolved"
- Remove from skipped products list

### Sync Summary with Skipped Count

After each sync, show detailed summary:

```
✅ Sync Completed
─────────────────────────────────────────────────
📅 Date: 2025-11-18 10:30 AM
⏱️  Duration: 2m 35s
─────────────────────────────────────────────────

📈 Results:
  ✅ Successfully synced: 245 products
     • Created: 12 new products
     • Updated: 233 existing products
     • Stock adjusted: 189 products

  ⚠️  Skipped: 15 products
     • Missing Brand: 8 products
     • Missing Category: 5 products
     • Missing Price: 2 products

  📊 Inventory Changes:
     • Stock increased: 45 products
     • Stock decreased: 12 products
     • New products added: 12 products

[View Skipped Products →] [View Full Report →]
```

### Benefits

✅ **No data loss** - Full dubros data preserved in error_details JSONB
✅ **Easy review** - Visual list of problematic products
✅ **Manual recovery** - Pre-filled form for quick creation
✅ **Audit trail** - Track why products failed and when resolved
✅ **Bulk export** - Export skipped products to CSV for review
✅ **Filter & search** - Find specific error types quickly

---

## ✅ RESOLVED QUESTIONS

### 1. ✅ **PRICING**
- **Answer**: `Price` field exists in authenticated response (requires Bearer token)
- **Value**: Numeric (e.g., 336 = $336 USD)
- **Auth**: `Authorization: Bearer <token>` header required

### 2. ✅ **API ENDPOINTS**
- **Categories**: `https://dubros.com/version-test/api/1.1/obj/Categoria` (No auth)
- **Brands**: `https://dubros.com/version-test/api/1.1/obj/Brands` (No auth)
- **Materials**: `https://dubros.com/version-test/api/1.1/obj/Product_Material` (No auth)
- **Products with Price**: `https://dubros.com/version-test/api/1.1/obj/Producto-lean-mirror` (Auth required)

### 3. ✅ **DESCRIPCION STRUCTURE**
- **Answer**: Use `Descripcion` directly as both `name` and `description`
- **Format**: Full text string (e.g., "AROS OPTICOS METAL GUESS MARCIANO W/CASE")
- **No parsing needed**: Store as-is

### 4. ✅ **TEXT FIELDS (_Text suffix)**
- **Answer**: Cannot rely on `Brand_text`, `Material_Text`, `Categoria_Text`
- **Reason**: Not always populated
- **Strategy**: Always use `_Parent` IDs and resolve via lookup endpoints

### 5. ✅ **MISSING FIELDS**
- **Bridge width, Temple length, Frame shape**: NOT in dubros.com
- **Strategy**: Set to NULL, populate manually via bulk edit later
- **Status**: Optional fields in ZERO schema

### 6. ✅ **GENERO_PARENT**
- **Answer**: Gender field (Male/Female/Unisex)
- **Decision**: ADD `gender` field to ZERO products table
- **Handling**: Optional - set to NULL if missing

### 7. ✅ **FLEX_PARENT**
- **Answer**: B2B-specific field, not relevant for ZERO
- **Decision**: IGNORE completely

### 8. ✅ **MISSING DATA STRATEGY**
- **Required fields**: SKU, Name, Price, Category, Brand → Skip product if missing
- **Optional fields**: Material, Gender, Lens Width, Images → Create with NULL
- **Recovery**: Track skipped products in `erp_sync_errors` for manual creation

### 9. ✅ **IMAGE HANDLING**
- **Format**: `//s3.amazonaws.com/...` (missing protocol)
- **Strategy**: Add `https:` prefix, download, compress, upload to Supabase Storage
- **If missing**: Create product without image

### 10. ✅ **AUTHENTICATION**
- **Token Strategy**: Generate Bearer token in bubble.io, store in env variable
- **Test approach**: Try long-lived token first, implement refresh if expires
- **Header**: `Authorization: Bearer <token>`

---

## 🔄 SYNC WORKFLOW (Detailed)

### Phase 1: Initialize Sync

```
1. Create sync log entry
   ├─ status: 'running'
   ├─ sync_type: 'scheduled' or 'manual'
   ├─ started_at: now()
   └─ Return sync_log_id
```

### Phase 2: Fetch & Build Lookup Maps

```
2. Fetch Categories from dubros.com
   ├─ GET https://dubros.com/version-test/api/1.1/obj/Categoria
   ├─ For each category:
   │  ├─ Check if exists in ZERO (match by dubros_id in erp_id field)
   │  ├─ If not exists:
   │  │  └─ INSERT INTO categories (name, slug, erp_id)
   │  └─ Build map: dubros_category_id → zero_category_id
   └─ Return categoryMap

3. Fetch Brands from dubros.com
   ├─ GET https://dubros.com/version-test/api/1.1/obj/Brands
   ├─ Same upsert logic as categories
   └─ Return brandMap

4. Fetch Materials from dubros.com
   ├─ GET https://dubros.com/version-test/api/1.1/obj/Product_Material
   ├─ Same upsert logic
   └─ Return materialMap
```

### Phase 3: Fetch & Process Products

```
5. Fetch Products from dubros.com
   ├─ GET https://dubros.com/version-test/api/1.1/obj/Producto-lean-mirror
   ├─ Headers: { Authorization: 'Bearer <token>' }
   ├─ Constraints: [{ key: "Cantidad", constraint_type: "greater than", value: "0" }]
   ├─ Handle pagination (if cursor exists):
   │  └─ Loop until all pages fetched
   └─ Return products[]

6. Process each product
   ├─ Validate REQUIRED fields:
   │  ├─ Referencia (SKU) → If missing: Skip, log error
   │  ├─ Descripcion (Name) → If missing: Skip, log error
   │  ├─ Price → If missing: Skip, log error
   │  ├─ Categoria_Parent → If missing: Skip, log error
   │  └─ Brand_Parent → If missing: Skip, log error
   │
   ├─ If validation fails:
   │  ├─ Log to erp_sync_errors with full dubros_raw_data
   │  ├─ Increment error_count
   │  └─ Continue to next product
   │
   ├─ Resolve foreign keys:
   │  ├─ category_id = categoryMap[Categoria_Parent]
   │  ├─ brand_id = brandMap[Brand_Parent]
   │  ├─ material_id = materialMap[Material_Parent] (or NULL)
   │  └─ If lookup fails: Skip, log error
   │
   ├─ Prepare image URLs (if Imagen_Low_Res exists):
   │  ├─ Add 'https:' protocol to low-res URL
   │  ├─ Construct high-res URL: https://dubros-image-repository.s3.us-east-1.amazonaws.com/{Referencia}.jpg
   │  ├─ (Optional) Validate high-res URL exists with HEAD request
   │  └─ If high-res not found: Use low-res for both
   │
   ├─ Map dubros fields → ZERO fields:
   │  ├─ sku = Referencia
   │  ├─ name = Descripcion
   │  ├─ description = Descripcion
   │  ├─ price = Price
   │  ├─ stock_quantity = Cantidad (or 0)
   │  ├─ category_id = resolved ID
   │  ├─ brand_id = resolved ID
   │  ├─ frame_material_id = resolved ID (or NULL)
   │  ├─ lens_width = Talla_ocular (or NULL)
   │  ├─ gender = map Genero_Parent (or NULL)
   │  ├─ erp_id = _id
   │  ├─ erp_last_synced_at = now()
   │  ├─ sync_status = 'synced'
   │  └─ erp_data = full dubros JSON
   │
   ├─ Upsert product (match by SKU):
   │  ├─ supabase.from('products').upsert({ ...productData }, { onConflict: 'sku' })
   │  ├─ Get product_id from response
   │  └─ If product exists: Track stock change
   │
   ├─ Create/update product image:
   │  ├─ If image URLs prepared successfully:
   │  │  └─ INSERT INTO product_images (product_id, image_url, image_url_high, is_primary)
   │  │     VALUES (productId, lowResUrl, highResUrl, true)
   │  └─ No file upload needed - just store URLs
   │
   ├─ Log inventory movement (if stock changed):
   │  └─ INSERT INTO inventory_movements ({
   │      product_id,
   │      movement_type: 'erp_sync',
   │      quantity_change: new_stock - old_stock,
   │      quantity_after: new_stock,
   │      reference_id: sync_log_id,
   │      reason: 'ERP sync from dubros.com'
   │    })
   │
   └─ Increment counters:
      ├─ If new product: records_created++
      ├─ If updated: records_updated++
      └─ records_processed++
```

### Phase 4: Finalize Sync

```
7. Update sync log
   ├─ completed_at = now()
   ├─ duration_seconds = completed_at - started_at
   ├─ status = 'success' | 'partial' | 'failed'
   ├─ total_records_fetched = products.length
   ├─ records_processed = success_count
   ├─ records_updated = update_count
   ├─ records_skipped = skip_count
   └─ error_count = errors.length

8. Return sync summary
   └─ {
       sync_log_id,
       status,
       duration,
       stats: { fetched, processed, created, updated, skipped, errors }
     }
```

### Error Handling Strategy

**For each error type:**

| Error Type | Action | Log to erp_sync_errors? | Continue Sync? |
|------------|--------|-------------------------|----------------|
| Missing required field | Skip product | ✅ Yes (with full data) | ✅ Yes |
| Invalid price format | Skip product | ✅ Yes | ✅ Yes |
| Lookup resolution fails | Skip product | ✅ Yes | ✅ Yes |
| Image URL invalid/missing | Continue without image | ⚠️ Warning only | ✅ Yes |
| High-res image not found | Use low-res for both | ⚠️ Warning only | ✅ Yes |
| Network timeout | Retry 3x, then fail sync | ✅ Yes | ❌ No (abort) |
| Auth token invalid | Fail sync immediately | ✅ Yes | ❌ No (abort) |
| Database constraint violation | Skip product | ✅ Yes | ✅ Yes |

**Transaction Safety:**
- Use transactions for product upsert + inventory movement together
- If either fails, rollback both
- Continue to next product

---

## Technical Architecture (Preliminary)

### Database Changes Needed

**Summary of Changes**:
1. ✅ Add ERP sync fields to `products` table
2. ✅ Add `gender` field to `products` table
3. ✅ Add `image_url_high` to `product_images` table (for high-res URLs)
4. ⚠️ Note: Product images storage bucket NOT needed (using dubros S3 URLs)

```sql
-- Migration 1: Add ERP sync fields to products table
ALTER TABLE products
  ADD COLUMN erp_id TEXT UNIQUE,
  ADD COLUMN erp_last_synced_at TIMESTAMPTZ,
  ADD COLUMN erp_data JSONB,
  ADD COLUMN sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'error', 'manual')),
  ADD COLUMN gender TEXT CHECK (gender IN ('Male', 'Female', 'Unisex'));

CREATE INDEX idx_products_erp_id ON products(erp_id);
CREATE INDEX idx_products_sync_status ON products(sync_status);

-- Migration 2: Add high-res image URL to product_images
ALTER TABLE product_images
  ADD COLUMN image_url_high TEXT; -- High-resolution image URL

COMMENT ON COLUMN product_images.image_url IS 'Low-resolution image URL for product lists';
COMMENT ON COLUMN product_images.image_url_high IS 'High-resolution image URL for product detail pages';

-- Migration 3: Add erp_id to lookup tables for tracking
ALTER TABLE categories
  ADD COLUMN erp_id TEXT UNIQUE;

ALTER TABLE brands
  ADD COLUMN erp_id TEXT UNIQUE;

ALTER TABLE frame_materials
  ADD COLUMN erp_id TEXT UNIQUE;

-- ❌ NO STORAGE BUCKET MIGRATION NEEDED
-- Reason: Using dubros S3 URLs directly (Option A)
```

### Code Structure

```
zyro-app/
├── lib/
│   ├── erp/
│   │   ├── dubros-client.ts       # HTTP client for dubros.com API
│   │   ├── product-mapper.ts      # Map dubros → ZERO schema
│   │   ├── image-service.ts       # Download & upload images
│   │   └── types.ts               # TypeScript interfaces
│   └── services/
│       └── erp-sync-service.ts    # Main sync orchestration
│
├── app/
│   ├── api/
│   │   └── admin/
│   │       └── erp-sync/
│   │           └── route.ts       # POST /api/admin/erp-sync
│   └── admin/
│       ├── erp-sync/
│       │   ├── page.tsx           # ERP sync dashboard
│       │   └── ErpSyncClient.tsx
│       └── products/
│           └── bulk-import/
│               ├── page.tsx       # Bulk CSV import
│               └── BulkImportClient.tsx
```

---

## Sync Flow (Preliminary)

```
1. Fetch Categories from dubros.com
   ├─> Parse response
   ├─> For each category:
   │   └─> Upsert into ZERO categories table
   │       (match by name, create if not exists)
   └─> Build ID mapping: dubros_category_id → zero_category_id

2. Fetch Brands from dubros.com
   ├─> [Need endpoint URL]
   └─> Same upsert logic

3. Fetch Materials from dubros.com
   ├─> [Need endpoint URL]
   └─> Same upsert logic

4. Fetch Products from dubros.com
   ├─> Apply constraints (Cantidad > 0, specific categories?)
   ├─> Handle pagination (fetch all pages)
   └─> For each product:
       ├─> Parse Descripcion (extract name, details)
       ├─> Resolve category_id (lookup in mapping)
       ├─> Resolve brand_id (lookup in mapping)
       ├─> Resolve material_id (lookup in mapping)
       ├─> Download image from Imagen_Low_Res URL
       ├─> Compress image
       ├─> Upload to Supabase Storage (product-images bucket)
       ├─> Upsert product (match by Referencia/SKU)
       │   ├─> If exists: Update stock, description, image
       │   └─> If new: Create product
       ├─> Log inventory movement (type: 'erp_sync')
       └─> Handle errors (log to erp_sync_errors)

5. Update Sync Log
   ├─> Status: success/partial/failed
   ├─> Stats: records_fetched, records_processed, errors
   └─> Duration
```

---

## Bulk Import/Export Features

### Bulk Import (CSV Upload)
**Required Columns**:
- `sku` (required, unique)
- `name` (required)
- `price` (required)
- `description` (optional)
- `brand` (required - name or ID)
- `category` (optional - name or ID)
- `material` (optional - name or ID)
- `shape` (optional - name or ID)
- `stock_quantity` (optional, default: 0)
- `lens_width` (optional)
- `bridge_width` (optional)
- `temple_length` (optional)

**Features**:
- Template download
- CSV validation before import
- Preview before applying
- Options: Create only, Update only, Upsert
- Error reporting per row

### Bulk Export (CSV Download)
**Columns**:
- All product fields
- Brand name, Category name, Material name, Shape name
- Stock status

**Features**:
- Export all or filtered products
- Select columns to export
- Date-stamped filename

### Bulk Edit (Multi-select)
**Operations**:
- Update category
- Update brand
- Update material
- Update price (fixed amount or %)
- Update stock
- Activate/Deactivate products

---

## Next Steps

### Before Implementation:
1. ✅ Answer all critical questions above
2. ✅ Get API endpoint URLs for brands, materials, gender
3. ✅ Clarify Descripcion array structure
4. ✅ Decide on pricing strategy
5. ✅ Test dubros.com API endpoints (make sample requests)

### After Answers Received:
1. Create database migrations
2. Build dubros.com client library
3. Build data mapper with confirmed structure
4. Build sync service
5. Build admin UI
6. Test end-to-end
7. Set up scheduled sync

---

## Notes

- **No Authentication Required**: dubros.com API is publicly accessible
- **Full Sync Strategy**: Create new + update existing products
- **Auto-create Lookups**: Automatically create missing categories/brands/materials
- **Image Handling**: Download from dubros, re-upload to Supabase Storage
- **Error Isolation**: One product failure shouldn't stop entire sync
- **Audit Trail**: All stock changes logged via inventory_movements table

---

**Status**: ✅ **READY FOR IMPLEMENTATION**
**Next Step**: Begin Phase 1 - Database Migrations

---

## 📝 FINAL IMPLEMENTATION SUMMARY

### Confirmed Decisions

1. ✅ **Image Strategy**: Option A - Reference dubros S3 URLs directly
   - No download/upload needed
   - Store low-res + high-res URLs in database
   - Fast sync, zero storage costs
   - Monitor performance, can migrate to Option B later if needed

2. ✅ **Required Fields**: SKU, Name, Price, Category, Brand
   - Skip products missing these fields
   - Log to `erp_sync_errors` for manual recovery

3. ✅ **Optional Fields**: Material, Gender, Lens Width, Images
   - Create products with NULL values
   - Populate via bulk edit later

4. ✅ **API Authentication**: Bearer token from bubble.io
   - Store in environment variable
   - Test long-lived token approach first

5. ✅ **Field Name Handling**:
   - Categories: `Nombre` field
   - Materials: `Nombre` field
   - **Brands: `Name` field** (different!)

6. ✅ **URL Environments**:
   - Test: `https://dubros.com/version-test/api/1.1/obj/...`
   - Production: `https://dubros.com/api/1.1/obj/...`

### Database Changes

```sql
-- Products table: ERP fields + gender
ALTER TABLE products ADD COLUMN erp_id, erp_last_synced_at, erp_data, sync_status, gender;

-- Product images: High-res URL
ALTER TABLE product_images ADD COLUMN image_url_high TEXT;

-- Lookup tables: ERP tracking
ALTER TABLE categories, brands, frame_materials ADD COLUMN erp_id TEXT UNIQUE;
```

### Estimated Sync Performance (Option A)

- **500 products**: ~5 minutes
- **1000 products**: ~10 minutes
- **No image download/upload** - just URL storage
- **Storage cost**: $0 (using dubros S3)

### Implementation Phases

1. **Phase 1**: Database migrations (30 mins)
2. **Phase 2**: ERP client library (1-2 hours)
3. **Phase 3**: Sync service (2-3 hours)
4. **Phase 4**: API routes (1 hour)
5. **Phase 5**: Admin UI (2-3 hours)
6. **Phase 6**: Testing (1-2 hours)

**Total**: 8-12 hours

---

**Last Updated**: November 21, 2025
**Ready to Begin**: ✅ Yes

---

## 🚀 IMPLEMENTATION STATUS (November 18, 2025)

### Completed Implementation

All code for ERP sync has been implemented as planned:

#### Files Created

1. **Database Migrations**:
   - `supabase/migrations/20251118000000_add_erp_fields_to_products.sql`
   - `supabase/migrations/20251118000001_add_high_res_image_url.sql`
   - `supabase/migrations/20251118000002_add_erp_id_to_lookup_tables.sql`

2. **ERP Client Library** (`lib/erp/`):
   - `dubros-client.ts` - HTTP client for dubros.com API
   - `product-mapper.ts` - Map dubros → ZERO schema
   - `types.ts` - TypeScript interfaces

3. **Sync Service** (`lib/services/`):
   - `erp-sync-service.ts` - Main orchestration for complete sync workflow

4. **API Routes** (`app/api/admin/erp-sync/`):
   - `route.ts` - POST /api/admin/erp-sync (trigger sync)
   - GET /api/admin/erp-sync (get status)

5. **Admin UI** (`app/admin/erp-sync/`):
   - `page.tsx` - ERP sync dashboard
   - `ErpSyncClient.tsx` - Client component with sync controls

#### Features Implemented

- ✅ Fetch products from dubros.com with Bearer token authentication
- ✅ Fetch and sync lookup tables (categories, brands, materials)
- ✅ Map dubros fields to ZERO schema
- ✅ Validate required fields (SKU, Price, Category, Brand)
- ✅ Upsert products with conflict resolution on SKU
- ✅ Store low-res and high-res image URLs
- ✅ Log inventory movements for stock changes
- ✅ Track sync history with detailed logs
- ✅ Error logging with full dubros raw data for manual recovery
- ✅ Admin dashboard with sync controls and history

---

## ⚠️ TESTING STATUS (November 21, 2025)

### Issue Discovered: Gateway Timeout

**Problem**: When testing the ERP sync via the admin UI, the sync fails with a 504 Gateway Timeout error.

**Root Cause**:
- GitHub Codespaces tunnel has a ~100 second timeout that cannot be configured
- dubros.com API takes ~100 seconds to return all 1,737 products in the test environment
- Even with `maxDuration = 300` on the API route, the tunnel times out before the response returns

**Server Behavior**:
- The sync actually completes successfully on the server (logs show 200 status after ~100s)
- But the browser receives a 504 because the tunnel closed the connection

**Attempted Fixes**:
1. Added `maxDuration = 300` to API route config - tunnel still times out
2. Added `testLimit: 50` parameter - still times out because full fetch happens first
3. The bottleneck is fetching ALL products before any filtering

### Production Considerations

- Production dubros.com has ~5,000 products
- Fetch time will be significantly longer
- Need proper async/background job architecture

---

## 🔧 PRODUCTION SOLUTION: Background Job Architecture

### Why Background Jobs?

1. **Timeout Issues**: HTTP request timeouts (tunnel, proxy, browser) cannot handle 5+ minute operations
2. **User Experience**: User shouldn't wait with a spinning button for 5+ minutes
3. **Reliability**: Long-running operations need retry logic and progress tracking
4. **Scalability**: Decouple request handling from heavy processing

### Architecture Design

```
┌─────────────────────────────────────────────────────────────┐
│                     BACKGROUND JOB FLOW                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. User clicks "Sync Now"                                   │
│     │                                                        │
│     ▼                                                        │
│  2. API creates job in database (status: 'queued')           │
│     │                                                        │
│     ▼                                                        │
│  3. API returns immediately with job_id                      │
│     │                                                        │
│     ▼                                                        │
│  4. Edge Function picks up job (triggered by webhook/cron)   │
│     │                                                        │
│     ▼                                                        │
│  5. Edge Function executes sync, updates progress            │
│     │                                                        │
│     ▼                                                        │
│  6. UI polls for status updates                              │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema

```sql
-- Job queue table
CREATE TABLE erp_sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  sync_type TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  progress INTEGER DEFAULT 0, -- 0-100
  current_step TEXT, -- 'fetching_products', 'syncing', etc.
  sync_log_id UUID REFERENCES erp_sync_logs(id),
  error_message TEXT,
  created_by UUID REFERENCES users(id)
);
```

### Implementation Options

#### Option A: Supabase Edge Functions (Recommended)
- Longer timeout limits (up to 150s default, can be extended)
- Built-in Postgres access
- Can be triggered by database webhooks
- Good for medium-complexity jobs

#### Option B: External Worker (for heavy jobs)
- Vercel Cron + separate worker process
- No timeout limits
- More complex setup
- Better for very long operations

### Implementation Steps

1. **Phase 1**: Create job queue table
2. **Phase 2**: Modify API to create job and return immediately
3. **Phase 3**: Create Edge Function or worker to process jobs
4. **Phase 4**: Update UI to poll for job status
5. **Phase 5**: Add progress indicators and cancel functionality

### Current Testing Approach

Before implementing background jobs, we need to verify the sync logic works correctly.

**Test via curl** (bypasses tunnel timeout):
```bash
curl -X POST http://localhost:3000/api/admin/erp-sync \
  -H "Content-Type: application/json" \
  -H "Cookie: <auth-cookie>" \
  -d '{"syncType": "manual", "testLimit": 50}'
```

This will:
1. Validate the sync service works end-to-end
2. Confirm products are created/updated in database
3. Verify error handling and logging

After validation, implement background job system for production use.

---

## 🎉 PRODUCTION SYNC VALIDATION (November 24, 2025)

### Status: ✅ **SYNC MECHANISM VALIDATED & WORKING**

### Critical Bug Discovered & Fixed

**Problem**: Infinite pagination loop causing 100-second timeouts

**Root Cause**:
- Using `limit: 100` parameter which only sets page size, not total records
- dubros.com API cursor stuck at 0 on every page
- Fetched same 100 brands repeatedly in infinite loop until timeout

**Solution**:
- Changed from `limit: 100` to `maxRecords: 200` for lookup tables
- `maxRecords` stops pagination early after fetching specified number of records
- Same fix pattern used in `testConnection()` from previous session

**Files Modified**:
- `/workspaces/Zyro/zyro-app/lib/services/erp-sync-service.ts:169-171`
- Added detailed timing logs to `/workspaces/Zyro/zyro-app/lib/erp/dubros-client.ts:98-148`

### Test Results: Production API (dubros.com)

#### Test 1: 5 Products
```
✅ Completed in 15 seconds
✅ 4 products created successfully
⚠️ 1 product failed (inactive product with missing brand)
📊 Lookup tables: ~900ms (Categories + Brands + Materials)
```

#### Test 2: 100 Products
```
✅ Completed in 34.4 seconds
✅ 95 products created (new)
✅ 4 products updated (already existed)
⚠️ 1 product failed (same inactive product issue)
📊 Performance Breakdown:
    - Lookup tables: ~725ms
    - Products fetch: 571ms (1 page, 100 items)
    - Product mapping: 99/100 successful
    - Database sync: ~33 seconds (99 products)
```

### Key Findings

1. **✅ Performance**: Production API is fast and reliable
   - Lookup table fetches: < 1 second
   - 100 products fetch: < 1 second
   - Database is the bottleneck (~333ms per product)

2. **✅ UPSERT Logic**: Working correctly
   - Identified existing products by SKU
   - Updated 4 products that were already synced
   - Created 95 new products

3. **⚠️ Data Quality Issue**: Found 1 isolated edge case
   - Product with `Cantidad: 1` (has stock)
   - But marked `inactive?: true` (inactive)
   - References an inactive brand not in our active brands fetch
   - Failure rate: 1% (1 out of 100 products)

4. **✅ Pagination Fix**: Resolved infinite loop
   - `maxRecords: 200` stops pagination correctly
   - Fetched 200 brands in 2 pages (901ms total)
   - No more timeout issues

### Production Readiness

**What Works**:
- ✅ Fetch from production dubros.com API
- ✅ Sync lookup tables (categories, brands, materials)
- ✅ Map dubros fields to ZERO schema
- ✅ Validate required fields
- ✅ UPSERT products with conflict resolution
- ✅ Handle duplicate products correctly
- ✅ Error logging with full raw data
- ✅ Sync history tracking

**Known Limitations**:
- ⚠️ Database sync is slow (~333ms per product)
- ⚠️ Edge case: Inactive products with stock
- ⚠️ Limited to 200 brands (156 active brands in production)

**Estimated Full Sync Performance**:
- 1,700 products (all products): ~9-10 minutes
- Bottleneck: Database inserts, not API fetches

---

## 🎯 THREE-LAYER PRICE FILTERING STRATEGY (November 27, 2025)

### Overview

To handle price thresholds with dozen pricing, we implement a three-layer filtering approach:

**Layer 1: API-Level Filter** (Performance Optimization)
- Add constraint to dubros.com API: `{ key: "Price", constraint_type: "greater than", value: "3" }`
- dubros.com filters products server-side (confirmed: API supports this ✅)
- Reduces data transfer and improves performance
- **Note**: This uses wholesale price, not calculated per-unit price

**Layer 2: Client-Side Raw Price Filter** (Safety Net)
- Filter products by raw `Price` field after fetching
- Safety mechanism in case API filter doesn't work
- Catches any products that slipped through

**Layer 3: Calculated Per-Unit Price Filter** (Accuracy)
- Filter after calculating per-unit price for dozen products
- **This is the critical filter for dozen products**
- Example: $30 dozen product becomes $2.50/unit → filtered out if threshold is $3

### Why Three Layers?

**Example Scenario:**
```
Product: "Eyeglass Frames Kit"
- Tipo_Venta: "DOCENA" (sold by dozen)
- Price: $30 (wholesale, per dozen)
- Minimum threshold: $3 per unit

Layer 1 (API): 30 > 3 ✅ PASS (API sees wholesale price)
Layer 2 (Raw): 30 >= 3 ✅ PASS (Safety check)
Layer 3 (Calculated): 30/12 = 2.50 < 3 ❌ FAIL (Correct filtering!)

Result: Product correctly filtered out
```

**Without Layer 3:**
- Product would be imported at $2.50/unit
- Below minimum threshold ❌
- Customer sees products we don't want to sell

**With Layer 3:**
- Product correctly filtered
- Only products >= $3/unit are synced ✅

### Implementation Details

```typescript
// Layer 1: API constraint (dubros-client.ts)
constraints.push({
  key: 'Price',
  constraint_type: 'greater than',
  value: minPrice.toString()
});

// Layer 2: Client-side safety (dubros-client.ts)
const filtered = products.filter(p => p.Price >= options.minPrice);

// Layer 3: Calculated price (erp-sync-service.ts)
const mapped = mapProduct(dubrosProduct, lookupMaps);
if (mapped.price_per_unit >= minPrice) {
  // Keep product
} else {
  // Filter out and log
  logSkippedProduct(syncLog.id, dubrosProduct,
    `Per-unit price $${mapped.price_per_unit} below threshold $${minPrice}`
  );
}
```

### Pricing Logic Details

**Dozen Detection:**
```typescript
const tipoVenta = dubrosProduct.Tipo_Venta_Parent || dubrosProduct.Tipo_Venta_Text || '';
const isSoldByDozen = tipoVenta.toUpperCase().includes('DOCENA') ||
                      tipoVenta.toUpperCase() === 'DOZEN';
```

**Price Calculation:**
```typescript
const wholesalePrice = dubrosProduct.Price; // Original dubros price
const perUnitPrice = isSoldByDozen ? wholesalePrice / 12 : wholesalePrice;
const displayPrice = perUnitPrice; // Always show unit price to customers
```

**Database Storage:**
- `price_wholesale`: Original dubros price (e.g., $36 for dozen)
- `price_per_unit`: Calculated unit price (e.g., $36/12 = $3)
- `price`: Display price (same as price_per_unit, for customer-facing)
- `is_sold_by_dozen`: Boolean flag for tracking

### CloudFront Image Strategy

**No Resizing Needed!**
- Use low-res images from dubros DB for product grids (variable ~1024x682)
- Construct CloudFront URLs for high-res: `https://dhbamyabyqtec.cloudfront.net/{SKU}.jpg` (1800x1200)
- Fix CSS with `object-contain` to display images properly
- No image processing, no storage costs, fast performance ✅

**Image URL Construction:**
```typescript
// Low-res (from dubros DB)
const imageUrl = dubrosProduct.Imagen_Low_Res.startsWith('//')
  ? `https:${dubrosProduct.Imagen_Low_Res}`
  : dubrosProduct.Imagen_Low_Res;

// High-res (CloudFront CDN)
const cloudfrontUrl = `https://dhbamyabyqtec.cloudfront.net/${sku}.jpg`;
```

**Display Strategy:**
- Product grid (`/products`): Use `imageUrl` (low-res)
- Product detail page: Use `cloudfrontUrl` (high-res)
- Both: Use `object-contain` CSS to preserve aspect ratio

---

## 📋 NEXT STEPS

### ✅ Completed (Testing Phase)
1. ✅ Test sync via curl to validate logic - **COMPLETED November 24, 2025**
2. ✅ Verify products created in database - **COMPLETED November 24, 2025**
3. ✅ Check sync logs and error handling - **COMPLETED November 24, 2025**
4. ✅ Fix pagination infinite loop bug - **COMPLETED November 24, 2025**
5. ✅ Validate production API sync (5 products) - **COMPLETED November 24, 2025**
6. ✅ Validate production API sync (100 products) - **COMPLETED November 24, 2025**

### 🎯 Current Priority: Pricing & Image Enhancements (November 27, 2025)

**Decision**: Implement features first, then move to background jobs after validation.

**New Features to Implement**:
1. ⬜ **Price Threshold Filtering** (Three-Layer Approach)
   - Layer 1: API-level constraint on `Price` field (dubros.com supports this ✅)
   - Layer 2: Client-side safety filter on raw price
   - Layer 3: Filter on calculated per-unit price (after dozen calculation)

2. ⬜ **Dozen vs Unit Pricing Logic**
   - Detect from `Tipo_Venta_Parent` or `Tipo_Venta_Text` field
   - Calculate per-unit price (divide by 12 for "DOCENA" products)
   - Store both wholesale and per-unit prices
   - Display unit price to customers

3. ⬜ **CloudFront Image URLs**
   - Use low-res from dubros DB for product grid (variable size ~1024x682)
   - Construct CloudFront URL for high-res: `https://dhbamyabyqtec.cloudfront.net/{SKU}.jpg` (1800x1200)
   - No image resizing/processing needed
   - Fix CSS to use `object-contain` for proper display

### 📝 Implementation Checklist (Session Nov 27)

**Phase 1: Database Schema** (15 mins)
- ⬜ Add `price_wholesale`, `price_per_unit`, `is_sold_by_dozen` to products table
- ⬜ Add `cloudfront_url` to product_images table
- ⬜ Add `min_price_threshold`, `sync_settings` to erp_sync_logs table

**Phase 2: Update Types** (5 mins)
- ⬜ Add `Tipo_Venta_Parent`, `Tipo_Venta_Text` to DubrosProduct interface
- ⬜ Add `minPrice` to FetchProductsOptions interface
- ⬜ Add pricing and CloudFront fields to MappedProduct interface

**Phase 3: dubros Client - Price Filter** (10 mins)
- ⬜ Add `minPrice` constraint to fetchProducts() API call
- ⬜ Add client-side safety filter on raw price

**Phase 4: Product Mapper - Pricing + CloudFront** (20 mins)
- ⬜ Detect dozen products from `Tipo_Venta` field
- ⬜ Calculate per-unit price (wholesale / 12 if dozen)
- ⬜ Construct CloudFront URL: `https://dhbamyabyqtec.cloudfront.net/{SKU}.jpg`
- ⬜ Add validation for minimum price threshold

**Phase 5: Sync Service - Settings & Three-Layer Filter** (30 mins)
- ⬜ Accept `SyncSettings` with `minPrice` parameter
- ⬜ Track settings in sync log for audit trail
- ⬜ Implement Layer 3 filter: Check per-unit price after mapping
- ⬜ Log filtered products (below threshold after dozen calculation)
- ⬜ Update product upsert to include new pricing fields
- ⬜ Update image upsert to include CloudFront URL

**Phase 6: API Route - Accept Settings** (10 mins)
- ⬜ Parse `minPrice` from POST body
- ⬜ Validate and pass to sync service
- ⬜ Return settings used in response

**Phase 7: Admin UI - Price Threshold Input** (20 mins)
- ⬜ Add "Precio Mínimo" input field (default: $3.00)
- ⬜ Add help text explaining dozen pricing
- ⬜ Keep "Límite de Prueba" for testing
- ⬜ Display settings used in results

**Phase 8: Frontend - Image Display Fix** (15 mins)
- ⬜ Update ProductCard to use low-res image with `object-contain`
- ⬜ Update ProductDetail to use CloudFront URL with `object-contain`
- ⬜ Ensure Next.js Image component configured properly

**Phase 9: Testing** (30 mins)
- ⬜ Test with price threshold: $3, $5, $10
- ⬜ Test with products sold by dozen
- ⬜ Test with products sold by unit
- ⬜ Verify image display on grid and detail pages
- ⬜ Verify Layer 3 filtering works (dozen products below threshold)

**Total Estimated Time**: 2.5 hours

### 🎯 After Features Validated: Move to Background Jobs

**Option B: Implement Background Jobs** (Next Session)
1. ⬜ Implement background job queue
2. ⬜ Create Edge Function for job processing
3. ⬜ Update UI with polling and progress
4. ⬜ Add job cancellation support
5. ⬜ Test full sync with all products
6. ⬜ Deploy to production

### Later (Enhancements)
- ⬜ Skipped products admin UI
- ⬜ Bulk import/export features
- ⬜ Optimize database sync performance
- ⬜ Add filter to exclude inactive products with stock
- ⬜ Scheduled sync (cron job every 48 hours)

---

## 💰 PRICING TIER SYSTEM (November 29, 2025)

### Overview

**Challenge**: Dubros.com provides B2B wholesale prices. ZERO is B2C with free shipping (absorbing $20-30 DHL cost per product). Need profitable pricing that includes shipping costs while remaining competitive.

**Solution**: Hybrid pricing system with customizable tiers + separate recalculation workflow.

### Pricing Formula

```
Selling Price = Flat Shipping + (Dubros Cost × Tier Markup)
```

**Why This Works:**
- ✅ Shipping is transparent (not a profit center)
- ✅ Competitive pricing for premium items (lower markup)
- ✅ Profitable pricing for budget items (higher markup to cover shipping)
- ✅ Easy to explain: "3x wholesale + shipping coverage"

### Example Calculations

```
Product A (Budget Frames):
  Dubros: $15
  Tier: Budget (4.0x)
  Selling Price = $25 + ($15 × 4.0) = $85
  Profit: $60 (71% margin)

Product B (Mid-Range Designer):
  Dubros: $60
  Tier: Mid-Range (3.0x)
  Selling Price = $25 + ($60 × 3.0) = $205
  Profit: $180 (88% margin)

Product C (Premium Ray-Ban):
  Dubros: $120
  Tier: Premium (2.5x)
  Selling Price = $25 + ($120 × 2.5) = $325
  Profit: $305 (94% margin)
```

### Database Schema

#### **New Table: `pricing_tiers`**

```sql
CREATE TABLE pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tier definition
  tier_name TEXT NOT NULL,                    -- "Budget", "Mid-Range", "Premium"
  min_cost DECIMAL(10,2) NOT NULL DEFAULT 0,  -- $0
  max_cost DECIMAL(10,2),                     -- $30 (NULL = infinity)
  markup_multiplier DECIMAL(5,2) NOT NULL,    -- 4.0

  -- Metadata
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default data
INSERT INTO pricing_tiers (tier_name, min_cost, max_cost, markup_multiplier, display_order) VALUES
  ('Budget',     0,    30,   4.0, 1),
  ('Mid-Range',  30,   100,  3.0, 2),
  ('Premium',    100,  NULL, 2.5, 3);
```

#### **Update `products` Table**

```sql
ALTER TABLE products ADD COLUMN
  -- Dubros costs
  cost_dubros DECIMAL(10,2),              -- Wholesale cost per unit
  cost_shipping DECIMAL(10,2) DEFAULT 25, -- Flat shipping
  cost_total DECIMAL(10,2),               -- dubros + shipping

  -- Pricing calculation
  pricing_tier_id UUID REFERENCES pricing_tiers(id),
  markup_multiplier DECIMAL(5,2),         -- From tier (can override)
  price DECIMAL(10,2),                    -- Final selling price

  -- Profit tracking
  profit_amount DECIMAL(10,2),            -- price - cost_total
  profit_margin_percent DECIMAL(5,2),     -- (profit / cost_total) × 100

  -- Flags
  is_price_override BOOLEAN DEFAULT false, -- Custom markup per product

  -- Audit
  price_calculated_at TIMESTAMPTZ;
```

### Hybrid Pricing Workflow

#### **Workflow 1: Automatic Pricing During Sync**

```
1. Fetch product from dubros → Dubros cost: $60
2. Calculate per-unit cost → If dozen: $60/12 = $5, else $60
3. Load active pricing tiers from database
4. Find matching tier → Mid-Range (30-100: 3.0x)
5. Calculate selling price → $25 + ($60 × 3.0) = $205
6. Insert product with all pricing fields populated
7. Product immediately available for sale at correct price ✅
```

**Benefits:**
- Products priced immediately on import
- Ready to sell right away
- Uses current active tier configuration

#### **Workflow 2: Bulk Price Recalculation (Separate)**

```
1. Admin updates tier: Mid-Range 3.0x → 2.8x
2. Admin clicks "Recalculate All Prices"
3. API reads all products with cost_dubros
4. For each product:
   → Find tier based on cost
   → Calculate new selling price
   → Skip if is_price_override = true
   → Update price fields
5. All Mid-Range products updated in seconds ✅
```

**Benefits:**
- Change pricing strategy anytime
- No need to re-sync from dubros
- Bulk operation (5,000 products in seconds)
- Respects manual overrides

#### **Workflow 3: Manual Price Override (Per-Product)**

```
1. Ray-Ban Aviator auto-priced at $325
2. Admin checks competitors: Ray-Ban sells for $280 direct
3. Admin sets custom price: $299
4. Toggles "Custom Price" ON (is_price_override = true)
5. Future syncs:
   → Dubros cost updated if changed
   → Price stays $299 (not recalculated) ✅
```

**Benefits:**
- Competitive pricing for key products
- Full control when needed
- Preserved during sync and recalculation

### Integration with Dozen Pricing

**Calculation Order:**

```typescript
// 1. Calculate per-unit dubros cost FIRST
const isSoldByDozen = dubrosProduct.Tipo_Venta_Parent?.includes('DOCENA');
const dubrosCost = isSoldByDozen
  ? dubrosProduct.Price / 12  // Per-unit
  : dubrosProduct.Price;

// 2. Find pricing tier based on per-unit cost
const tier = pricingService.findTier(dubrosCost);

// 3. Apply tier markup
const sellingPrice = shippingCost + (dubrosCost * tier.markup_multiplier);

// 4. Store all pricing info
return {
  cost_dubros: dubrosCost,
  cost_shipping: 25,
  cost_total: dubrosCost + 25,
  pricing_tier_id: tier.id,
  markup_multiplier: tier.markup_multiplier,
  price: sellingPrice,
  profit_amount: sellingPrice - (dubrosCost + 25),
  is_sold_by_dozen: isSoldByDozen
};
```

### Implementation Files

```
lib/services/
└── pricing-service.ts          (NEW) PricingService class

lib/erp/
├── product-mapper.ts           (UPDATE) Integrate pricing service
└── types.ts                    (UPDATE) Add pricing fields

app/api/admin/pricing/
└── recalculate/route.ts        (NEW) Bulk price recalculation

app/admin/pricing-tiers/
├── page.tsx                    (NEW) Tier management UI
└── PricingActions.tsx          (NEW) Recalculate button

app/admin/products/[id]/
└── edit/page.tsx               (UPDATE) Manual price override UI

supabase/migrations/
└── 20251129000000_pricing_tiers.sql  (NEW)
```

### Admin UI Features

**Pricing Tiers Page (`/admin/pricing-tiers`):**
- Create/edit/delete tiers
- Visual table with examples
- Pricing calculator tool
- Live preview of tier changes

**Sync Settings:**
- Flat shipping cost input ($25 default)
- Minimum selling price threshold
- Display active tiers during sync

**Product Edit Page:**
- Auto-calculated price display
- Toggle for custom pricing
- Custom price input (when override enabled)
- Profit breakdown

### Complete Scenarios

**Scenario 1: Initial Setup**
```
1. Admin creates pricing tiers
2. Admin runs ERP sync
3. 1,700 products imported with auto-pricing
4. All products immediately available for sale ✅
```

**Scenario 2: Adjust Pricing Strategy**
```
1. Admin changes Mid-Range: 3.0x → 2.8x
2. Admin clicks "Recalculate All Prices"
3. All Mid-Range products updated in 10 seconds
4. New prices live immediately ✅
```

**Scenario 3: Shipping Cost Increase**
```
1. DHL changes rates: $25 → $28
2. Admin updates shipping cost to $28
3. Admin clicks "Recalculate All Prices"
4. All products updated with new shipping
5. Manual overrides preserved ✅
```

**Scenario 4: Competitive Override**
```
1. Premium product auto-priced at $325
2. Admin sets custom price: $299
3. Future syncs preserve $299
4. Dubros cost still updates if changed ✅
```

### Benefits

✅ **Flexible**: Change tiers anytime without re-sync
✅ **Fast**: Recalculate 5,000 products in seconds
✅ **Transparent**: Shipping separate from profit margin
✅ **Competitive**: Lower markup for premium items
✅ **Profitable**: Higher markup for budget items covers shipping
✅ **Controllable**: Manual override for key products
✅ **Auditable**: Full profit tracking and margin visibility

---
