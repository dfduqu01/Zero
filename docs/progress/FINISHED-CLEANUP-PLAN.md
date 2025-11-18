# DATABASE CLEANUP PLAN

**Version**: 1.0
**Date**: November 7, 2025
**Purpose**: Plan for removing deprecated tables and ENUMs after prescription system restructure

---

## Overview

After restructuring the prescription system (Nov 7, 2025), we have deprecated tables and ENUMs that need to be cleaned up. This document outlines the safe removal process.

---

## ⚠️ DEPRECATED Items

### 1. Tables
- ✅ `lens_options` - Replaced by 4 separate tables
- ✅ `lens_treatments` - Merged into `lens_types`
- ✅ `product_lens_treatments` (Join Table) - No longer needed

### 2. ENUMs
- ✅ `prescription_type_enum` - Replaced by `prescription_types` table
- ✅ `without_rx_type_enum` - Replaced by `lens_types` table
- ✅ `single_vision_type_enum` - No longer used
- ✅ `lens_index_enum` - Replaced by `lens_indexes` table
- ✅ `progressive_view_area_enum` - Replaced by `view_areas` table

### 3. Columns (in cart_item_prescriptions and order_item_prescriptions)
- ✅ `prescription_type` (ENUM) - Use `prescription_type_id` (UUID) instead
- ✅ `without_rx_type` (ENUM) - Use `lens_type_id` instead
- ✅ `single_vision_type` (ENUM) - No longer needed
- ✅ `lens_index` (ENUM) - Use `lens_index_id` instead
- ✅ `progressive_view_area` (ENUM) - Use `view_area_id` instead

---

## Cleanup Steps

### Phase 1: Verification (BEFORE CLEANUP)

**Status**: ✅ Complete

1. ✅ Verify new tables are working:
   - `prescription_types` (3 records)
   - `lens_types` (6 records)
   - `lens_indexes` (4 records)
   - `view_areas` (2 records)

2. ✅ Verify application uses new structure:
   - `PrescriptionForm` component
   - `ProductDetailClient` component
   - `PrescriptionSummary` component
   - Price calculation functions

3. ✅ Verify foreign key relationships:
   - `cart_item_prescriptions.prescription_type_id` → `prescription_types.id`
   - `cart_item_prescriptions.lens_type_id` → `lens_types.id`
   - `cart_item_prescriptions.lens_index_id` → `lens_indexes.id`
   - `cart_item_prescriptions.view_area_id` → `view_areas.id`
   - Same for `order_item_prescriptions`

---

### Phase 2: Data Migration (BEFORE CLEANUP)

**Status**: ⏳ Pending

**Goal**: Migrate any existing data from old structure to new structure

#### Step 2.1: Check for Existing Data

```sql
-- Check if there's any data using old ENUM columns
SELECT COUNT(*) FROM cart_item_prescriptions WHERE prescription_type IS NOT NULL;
SELECT COUNT(*) FROM order_item_prescriptions WHERE prescription_type IS NOT NULL;
```

#### Step 2.2: Migrate Existing Data (if needed)

If there's existing data, create a migration to populate the new ID columns:

```sql
-- Example migration (adjust as needed)
-- Migration: 20251108000000_migrate_prescription_enum_data.sql

-- Migrate prescription_type ENUM to prescription_type_id
UPDATE cart_item_prescriptions
SET prescription_type_id = (
  SELECT id FROM prescription_types
  WHERE slug = CASE prescription_type::text
    WHEN 'without_rx' THEN 'non-prescription'
    WHEN 'single_vision' THEN 'single-vision'
    WHEN 'progressive' THEN 'progressive'
  END
)
WHERE prescription_type IS NOT NULL AND prescription_type_id IS NULL;

-- Migrate lens_index ENUM to lens_index_id
UPDATE cart_item_prescriptions
SET lens_index_id = (
  SELECT id FROM lens_indexes
  WHERE index_value = lens_index::text
)
WHERE lens_index IS NOT NULL AND lens_index_id IS NULL;

-- Migrate progressive_view_area ENUM to view_area_id
UPDATE cart_item_prescriptions
SET view_area_id = (
  SELECT id FROM view_areas
  WHERE slug = CASE progressive_view_area::text
    WHEN 'standard' THEN 'standard-view'
    WHEN 'broader_40' THEN 'broader-view-40'
  END
)
WHERE progressive_view_area IS NOT NULL AND view_area_id IS NULL;

-- Repeat for order_item_prescriptions
-- ...
```

---

### Phase 3: Remove Deprecated Columns

**Status**: ⏳ Pending

**Prerequisites**:
- Phase 1 complete
- Phase 2 complete (data migrated)
- Application tested and working with new structure

#### Step 3.1: Drop ENUM Columns from Prescription Tables

```sql
-- Migration: 20251108000001_drop_prescription_enum_columns.sql

-- Remove old ENUM columns from cart_item_prescriptions
ALTER TABLE cart_item_prescriptions
  DROP COLUMN IF EXISTS prescription_type,
  DROP COLUMN IF EXISTS without_rx_type,
  DROP COLUMN IF EXISTS single_vision_type,
  DROP COLUMN IF EXISTS lens_index,
  DROP COLUMN IF EXISTS progressive_view_area,
  DROP COLUMN IF EXISTS prescription_image_uploaded_at; -- Also deprecated

-- Remove old ENUM columns from order_item_prescriptions
ALTER TABLE order_item_prescriptions
  DROP COLUMN IF EXISTS prescription_type,
  DROP COLUMN IF EXISTS without_rx_type,
  DROP COLUMN IF EXISTS single_vision_type,
  DROP COLUMN IF EXISTS lens_index,
  DROP COLUMN IF EXISTS progressive_view_area,
  DROP COLUMN IF EXISTS prescription_image_uploaded_at; -- Also deprecated
```

---

### Phase 4: Drop Deprecated Tables

**Status**: ⏳ Pending

**Prerequisites**: Phase 3 complete

#### Step 4.1: Drop Join Tables First

```sql
-- Migration: 20251108000002_drop_deprecated_join_tables.sql

-- Drop product_lens_treatments join table
DROP TABLE IF EXISTS product_lens_treatments CASCADE;

-- Drop cart_item_treatments join table
DROP TABLE IF EXISTS cart_item_treatments CASCADE;

-- Drop order_item_treatments join table
DROP TABLE IF EXISTS order_item_treatments CASCADE;
```

#### Step 4.2: Drop Deprecated Tables

```sql
-- Migration: 20251108000003_drop_deprecated_tables.sql

-- Drop old lens_options table
DROP TABLE IF EXISTS lens_options CASCADE;

-- Drop old lens_treatments table
DROP TABLE IF EXISTS lens_treatments CASCADE;
```

---

### Phase 5: Drop Deprecated ENUMs

**Status**: ⏳ Pending

**Prerequisites**: Phase 4 complete

#### Step 5.1: Drop ENUMs

```sql
-- Migration: 20251108000004_drop_deprecated_enums.sql

-- Drop prescription ENUMs
DROP TYPE IF EXISTS prescription_type_enum CASCADE;
DROP TYPE IF EXISTS without_rx_type_enum CASCADE;
DROP TYPE IF EXISTS single_vision_type_enum CASCADE;
DROP TYPE IF EXISTS lens_index_enum CASCADE;
DROP TYPE IF EXISTS progressive_view_area_enum CASCADE;
```

---

## Testing Checklist

Before each cleanup phase:

### Functional Tests
- [ ] Can create new prescription (Frame Only flow)
- [ ] Can create new prescription (Single Vision flow)
- [ ] Can create new prescription (Progressive flow)
- [ ] Can add product to cart with prescription
- [ ] Cart displays prescription summary correctly
- [ ] Price calculation works correctly
- [ ] Can create order with prescription

### Database Tests
- [ ] All foreign keys are valid
- [ ] RLS policies work correctly
- [ ] No orphaned records
- [ ] Queries perform adequately

### Backward Compatibility (during transition)
- [ ] Old enum columns still readable (if not dropped yet)
- [ ] New ID columns properly populated
- [ ] No data loss

---

## Rollback Plan

If issues arise during cleanup:

### Phase 1-2: No rollback needed
- New tables can coexist with old ones
- Application can be reverted to use old structure

### Phase 3-5: Restore from backup
1. Stop application
2. Restore database from pre-cleanup backup
3. Revert application code to previous version
4. Restart application
5. Investigate and fix issues
6. Retry cleanup

---

## Timeline

**Recommended Schedule**:

1. **Week 1**: Verify new system working (✅ Complete - Nov 7, 2025)
2. **Week 2**: Data migration (if needed)
3. **Week 3**: Drop deprecated columns (Phase 3)
4. **Week 4**: Drop deprecated tables and ENUMs (Phase 4-5)

**OR**

**Aggressive Schedule** (if no existing data):
- Can proceed with all phases immediately since there's no data to migrate
- Recommended: Wait 1-2 weeks to ensure system is stable

---

## Notes

- Always backup database before cleanup operations
- Run cleanup during low-traffic periods
- Monitor application logs after each phase
- Keep old migration files for reference
- Document any issues encountered

---

## Cleanup Completion Checklist

When all phases are complete:

- [ ] All deprecated tables dropped
- [ ] All deprecated ENUMs dropped
- [ ] All deprecated columns dropped
- [ ] Application working correctly
- [ ] Database schema documentation updated
- [ ] ERD diagram updated
- [ ] No warnings in application logs
- [ ] Performance metrics normal

**Final Status**: ⏳ Cleanup not started - waiting for system stability verification
