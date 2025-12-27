# ERP Sync Flow - Step by Step

## Overview

When you click "Sincronizar Ahora", here's what happens:

---

## Step 1: Button Click → API Route

**Client Action**: `ErpSyncClient.tsx` sends POST request

```typescript
fetch('/api/admin/erp-sync', {
  method: 'POST',
  body: JSON.stringify({
    syncType: 'manual',
    testLimit: 50,  // Only sync 50 products for testing
  }),
})
```

**API Route**: `/api/admin/erp-sync/route.ts`

1. Authenticates user (checks if admin)
2. Validates environment variables (`DUBROS_API_URL`, `DUBROS_BEARER_TOKEN`)
3. Creates `DubrosApiClient` with 180s timeout
4. Tests connection to dubros.com
5. Calls `syncService.executeSync('manual', 50)`

---

## Step 2: Create Sync Log

**Service**: `erp-sync-service.ts` → `createSyncLog()`

**Inserts into**: `erp_sync_logs` table

```json
{
  "sync_type": "manual",
  "status": "running",
  "started_at": "2025-11-22T01:30:00.000Z",
  "total_records_fetched": 0,
  "records_processed": 0,
  "records_updated": 0,
  "records_skipped": 0,
  "error_count": 0
}
```

**Returns**: `syncLogId` (UUID)

---

## Step 3: Fetch Lookup Tables from dubros.com

**Service**: `erp-sync-service.ts` → `syncLookupTables()`

Fetches 3 endpoints **in parallel**:

### 3A. Categories Endpoint

**URL**: `GET https://dubros.com/api/1.1/obj/Categoria`

**Response JSON**:
```json
{
  "response": {
    "cursor": 0,
    "results": [
      {
        "_id": "1622833234567x123456789",
        "Nombre": "Lentes de Sol",
        "Created_Date": "2021-06-04T18:00:34.567Z",
        "Modified_Date": "2023-01-15T10:30:00.000Z"
      },
      {
        "_id": "1622833234568x987654321",
        "Nombre": "Lentes Ópticos",
        ...
      }
    ],
    "remaining": 0
  }
}
```

**Maps to**: `categories` table
```json
{
  "name": "Lentes de Sol",
  "slug": "lentes-de-sol",
  "erp_id": "1622833234567x123456789",
  "display_order": 0
}
```

**Upsert on**: `erp_id` (unique constraint)

### 3B. Brands Endpoint

**URL**: `GET https://dubros.com/api/1.1/obj/Brands?constraints=[{"key":"active","constraint_type":"equals","value":"yes"}]`

**Response JSON**:
```json
{
  "response": {
    "cursor": 0,
    "results": [
      {
        "_id": "1622833234569x111111111",
        "Name": "Ray-Ban",
        "Logo": "//s3.amazonaws.com/dubros/logos/rayban.png",
        "active": true,
        "Created_Date": "2021-06-04T18:00:34.567Z"
      },
      ...
    ],
    "remaining": 0
  }
}
```

**Maps to**: `brands` table
```json
{
  "name": "Ray-Ban",
  "slug": "ray-ban",
  "logo_url": "https://s3.amazonaws.com/dubros/logos/rayban.png",
  "erp_id": "1622833234569x111111111"
}
```

**Upsert on**: `erp_id` (unique constraint)

### 3C. Materials Endpoint

**URL**: `GET https://dubros.com/api/1.1/obj/Product_Material`

**Response JSON**:
```json
{
  "response": {
    "cursor": 0,
    "results": [
      {
        "_id": "1622833234570x222222222",
        "Nombre": "Acetato",
        "Created_Date": "2021-06-04T18:00:34.567Z"
      },
      ...
    ],
    "remaining": 0
  }
}
```

**Maps to**: `frame_materials` table
```json
{
  "name": "Acetato",
  "erp_id": "1622833234570x222222222"
}
```

**Upsert on**: `erp_id` (unique constraint)

### Result: Lookup Maps

After upserting, creates mapping dictionaries:
```typescript
{
  categories: Map { "1622833234567x123456789" => "uuid-of-category" },
  brands: Map { "1622833234569x111111111" => "uuid-of-brand" },
  materials: Map { "1622833234570x222222222" => "uuid-of-material" }
}
```

---

## Step 4: Fetch Products from dubros.com

**URL**: `GET https://dubros.com/api/1.1/obj/Producto-lean-mirror?constraints=[{"key":"Cantidad","constraint_type":"greater than","value":0}]`

**Headers**:
```
Authorization: Bearer <DUBROS_BEARER_TOKEN>
Content-Type: application/json
```

**NOTE**: Requires authentication to get `Price` field!

**Response JSON** (single product example):
```json
{
  "response": {
    "cursor": 50,
    "results": [
      {
        "_id": "1622833234571x333333333",
        "Referencia": "RB3025-001-58",
        "Descripcion": "Ray-Ban Aviator Classic Gold Green",
        "Price": 159.99,
        "Cantidad": 25,
        "Categoria_Parent": "1622833234567x123456789",
        "Brand_Parent": "1622833234569x111111111",
        "Material_Parent": "1622833234570x222222222",
        "Genero_Parent": null,
        "Talla_ocular": 58,
        "Imagen_Low_Res": "//s3.amazonaws.com/dubros/images/RB3025-001-58.jpg",
        "Image_high_Res": null,
        "Slug": "ray-ban-aviator-classic-gold-green",
        "promo": null,
        "Created_Date": "2021-06-04T18:00:34.567Z",
        "Modified_Date": "2023-11-20T15:45:00.000Z",
        "Last_Updated": "2023-11-20T15:45:00.000Z"
      },
      ...
    ],
    "remaining": 3500,
    "count": 50
  }
}
```

**Pagination**: If `remaining > 0`, fetches next page with `cursor` param until `remaining = 0` or `maxRecords` reached.

**Time**: ~100 seconds for first page (Bubble.io is slow)

---

## Step 5: Validate Products

**Mapper**: `product-mapper.ts` → `validateDubrosProduct()`

**Required fields** (validation fails if missing):
- `Referencia` (SKU)
- `Descripcion` (Name)
- `Price` (Number >= 0)
- `Categoria_Parent` (Category ID)
- `Brand_Parent` (Brand ID)

Products missing required fields are logged as errors and skipped.

---

## Step 6: Map Products to ZERO Schema

**Mapper**: `product-mapper.ts` → `mapProduct()`

**Input** (dubros format):
```json
{
  "_id": "1622833234571x333333333",
  "Referencia": "RB3025-001-58",
  "Descripcion": "Ray-Ban Aviator Classic Gold Green",
  "Price": 159.99,
  "Cantidad": 25,
  "Categoria_Parent": "1622833234567x123456789",
  "Brand_Parent": "1622833234569x111111111",
  "Material_Parent": "1622833234570x222222222",
  "Talla_ocular": 58,
  "Imagen_Low_Res": "//s3.amazonaws.com/dubros/images/RB3025-001-58.jpg"
}
```

**Output** (ZERO format):
```json
{
  "sku": "RB3025-001-58",
  "name": "Ray-Ban Aviator Classic Gold Green",
  "description": "Ray-Ban Aviator Classic Gold Green",
  "price": 159.99,
  "stock_quantity": 25,
  "brand_id": "uuid-of-rayban-brand",
  "category_id": "uuid-of-lentes-de-sol",
  "frame_material_id": "uuid-of-acetato",
  "frame_shape_id": null,
  "lens_width": 58,
  "bridge_width": null,
  "temple_length": null,
  "gender": null,
  "erp_id": "1622833234571x333333333",
  "erp_last_synced_at": "2025-11-22T01:31:45.000Z",
  "erp_data": { /* full dubros JSON */ },
  "sync_status": "synced",
  "low_stock_threshold": 5,
  "is_active": true
}
```

**Foreign Key Resolution**:
- `Categoria_Parent` → lookup in `categories` Map → get UUID
- `Brand_Parent` → lookup in `brands` Map → get UUID
- `Material_Parent` → lookup in `materials` Map → get UUID

**If lookup fails** (category or brand not found), product is skipped!

---

## Step 7: Upsert Products to Database

**Service**: `erp-sync-service.ts` → `syncProducts()`

For each product:

### 7A. Check if Exists
```sql
SELECT id, stock_quantity FROM products WHERE sku = 'RB3025-001-58'
```

### 7B. Upsert Product
**Upsert on**: `sku` (unique constraint)

```sql
INSERT INTO products (
  sku, name, description, price, stock_quantity,
  brand_id, category_id, frame_material_id, frame_shape_id,
  lens_width, bridge_width, temple_length, gender,
  erp_id, erp_last_synced_at, erp_data, sync_status,
  low_stock_threshold, is_active
) VALUES (...)
ON CONFLICT (sku) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  stock_quantity = EXCLUDED.stock_quantity,
  ...
RETURNING id
```

### 7C. Upsert Product Image

**Maps to**: `product_images` table
```json
{
  "product_id": "uuid-of-product",
  "image_url": "https://s3.amazonaws.com/dubros/images/RB3025-001-58.jpg",
  "image_url_high": "https://dubros-image-repository.s3.us-east-1.amazonaws.com/RB3025-001-58.jpg",
  "is_primary": true,
  "display_order": 0
}
```

### 7D. Log Inventory Movement (if stock changed)

**Inserts into**: `inventory_movements` table
```json
{
  "product_id": "uuid-of-product",
  "movement_type": "erp_sync",
  "quantity_change": 5,
  "quantity_after": 25,
  "reference_id": "sync-log-uuid",
  "reason": "ERP sync from dubros.com"
}
```

---

## Step 8: Finalize Sync Log

**Service**: `erp-sync-service.ts` → `finalizeSyncLog()`

**Updates**: `erp_sync_logs` table
```json
{
  "status": "success",
  "completed_at": "2025-11-22T01:33:00.000Z",
  "total_records_fetched": 50,
  "records_processed": 48,
  "records_updated": 30,
  "records_skipped": 2,
  "error_count": 2,
  "duration_seconds": 120
}
```

---

## Step 9: Return Response to Client

**API Route** returns:
```json
{
  "success": true,
  "syncLogId": "uuid-of-sync-log",
  "stats": {
    "fetched": 50,
    "processed": 48,
    "created": 18,
    "updated": 30,
    "skipped": 2,
    "errors": 2
  },
  "duration": 120,
  "message": "Sync completed successfully. 18 products created, 30 updated.",
  "diagnostics": {
    "dbCounts": {
      "syncLogs": 5,
      "products": 48,
      "categories": 10,
      "brands": 25
    }
  }
}
```

---

## Database Tables Summary

| Table | Purpose | Upsert Key |
|-------|---------|------------|
| `erp_sync_logs` | Track sync operations | `id` (auto) |
| `erp_sync_errors` | Log individual product errors | `id` (auto) |
| `categories` | Product categories | `erp_id` |
| `brands` | Product brands | `erp_id` |
| `frame_materials` | Frame materials | `erp_id` |
| `products` | Main products | `sku` |
| `product_images` | Product images | `product_id + is_primary` |
| `inventory_movements` | Stock change history | `id` (auto) |

---

## Potential Failure Points

### 1. Validation Fails
- Missing `Price` field (if no auth token)
- Missing `Referencia`, `Descripcion`
- Missing `Categoria_Parent` or `Brand_Parent`

### 2. Lookup Resolution Fails
- Category ID not found in lookup map
- Brand ID not found in lookup map
- **This is the most likely cause of 0 records!**

### 3. Database Upsert Fails
- Unique constraint violations
- Foreign key violations
- RLS policy blocking writes

### 4. Timeout
- GitHub Codespaces tunnel times out at ~100s
- API route has 300s max duration
- dubros.com first page takes ~100s

---

## Key Insight for Debugging

The most likely reason for **0 records** is:

1. **Lookup tables upsert fails** → empty maps
2. **All products fail lookup resolution** → all skipped
3. **Stats show 0 created, 0 updated, N skipped**

To debug:
1. Check if categories/brands/materials have records with `erp_id`
2. Check Supabase logs for upsert errors on lookup tables
3. The upsert uses `onConflict: 'erp_id'` - this requires unique constraint on `erp_id` column
