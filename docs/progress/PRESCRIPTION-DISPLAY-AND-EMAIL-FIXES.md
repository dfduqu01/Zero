# Prescription Display & Email Template Fixes

**Date**: December 27, 2025
**Status**: 🔴 Critical - Blocking MVP Launch
**Priority**: P0 (Must fix before launch)
**Estimated Time**: 2-3 hours

---

## Problem Summary

Customers who order prescription eyewear cannot see:
1. **What prescription configuration they ordered** (lens type, index, view area)
2. **Detailed price breakdown** showing cost per component
3. **Full prescription details** in order confirmation emails

This creates confusion and may lead to customer service issues and returns.

---

## Current State

### What Works ✅
- Prescription data is collected during checkout
- Basic "✓ Con prescripción" indicator shows on orders
- `PrescriptionSummary` component exists and is integrated in order pages

### What's Broken ❌
1. **Prescription data not saving to database** - PostgreSQL column mismatch errors
2. **Prescription details not displaying on order pages** - Because data isn't in DB
3. **Email templates too basic** - Only show "✓ Con prescripción" instead of details

---

## Issue #1: Prescription Data Not Saving (CRITICAL)

### File
`/workspaces/Zyro/zyro-app/app/api/checkout/payment-callback/route.ts` (lines 182-223)

### Status
⏳ **Fix Applied - Needs Testing**

### Root Cause
When copying prescription data from cart to `order_item_prescriptions` table during order creation:
- Cart prescription object includes `cart_item_id` field
- Cart prescription object includes `prescription_image_uploaded_at` field
- Neither of these fields exist in `order_item_prescriptions` table
- PostgreSQL rejects the insert with error: `Could not find the 'cart_item_id' column`

### Fix Applied (December 27, 2025)
Changed from spread operator to explicit field mapping:

**Before (Broken)**:
```typescript
if (cartItem?.prescription) {
  return {
    order_item_id: orderItem.id,
    ...cartItem.prescription, // ❌ Includes invalid fields
  };
}
```

**After (Fixed)**:
```typescript
if (cartItem?.prescription) {
  const presc = cartItem.prescription;
  return {
    order_item_id: orderItem.id,
    prescription_type_id: presc.prescription_type_id,
    lens_type_id: presc.lens_type_id,
    lens_index_id: presc.lens_index_id,
    view_area_id: presc.view_area_id,
    od_sph: presc.od_sph,
    od_cyl: presc.od_cyl,
    od_axis: presc.od_axis,
    os_sph: presc.os_sph,
    os_cyl: presc.os_cyl,
    os_axis: presc.os_axis,
    pd: presc.pd,
    pd_dual_od: presc.pd_dual_od,
    pd_dual_os: presc.pd_dual_os,
    add_value: presc.add_value,
    prescription_image_url: presc.prescription_image_url,
    validation_status: 'pending',
  };
}
```

### Next Steps
1. ✅ **TEST**: Place new order with prescription
2. ✅ **VERIFY**: Check server logs for successful prescription insert
3. ✅ **CONFIRM**: Prescription details appear on order confirmation page
4. ✅ **CONFIRM**: Prescription details appear on order details page

---

## Issue #2: Email Templates Missing Prescription Details

### Files
- SendGrid Template ID: `d-717922b773cf45c9aec5e533e385dc0c` (Order Confirmation)
- SendGrid Template ID: `d-a47f4deaae4c4fcdb90b6ca700fa241d` (Order Shipped)

### Current State
Email shows:
```
PRODUCTOS ORDENADOS
AROS OPTICOS ACETATO FAZIO (1x) - $17.85
SKU: MR03-05C01F
✓ Con prescripción
```

### What's Missing
1. **Prescription Configuration**:
   - Prescription type (Single Vision, Progressive, Non-Prescription)
   - Lens type (Blue Light Block, Photochromatic, Standard Clear, etc.)
   - Lens index (1.50, 1.60, 1.67, 1.74)
   - View area (Standard, 40% Broader) - if Progressive

2. **Price Breakdown**:
   - Base frame price
   - Lens type cost
   - Lens index cost (if applicable)
   - View area cost (if applicable)
   - Item subtotal with all components

### Desired Email Format
```
PRODUCTOS ORDENADOS

AROS OPTICOS ACETATO FAZIO
SKU: MR03-05C01F
Cantidad: 1x

CONFIGURACIÓN DE LENTES:
✓ Tipo: Single Vision - Distancia
✓ Lentes: High-Index (1.60) - 20% más delgados
✓ Tratamiento: Blue Light Block

DESGLOSE DE PRECIO:
- Marco base:            $12.00
- Lentes graduados:       $3.50
- Tratamiento adicional:  $2.35
--------------------------------
Subtotal item:          $17.85
```

### Implementation Plan

#### Step 1: Update Email Service Data Structure
**File**: `/workspaces/Zyro/zyro-app/lib/email/email-service.ts`

**Current `items` data**:
```typescript
items: Array<{
  name: string;
  sku: string;
  quantity: number;
  price: string;
  hasPrescription: boolean; // ❌ Too basic
}>
```

**New `items` data needed**:
```typescript
items: Array<{
  name: string;
  sku: string;
  quantity: number;
  basePrice: string;         // Frame price
  totalPrice: string;        // With all addons
  prescription?: {
    type: string;            // "Single Vision - Distancia"
    lensType: string;        // "Blue Light Block"
    lensTypePrice: string;   // "$25.00"
    lensIndex?: string;      // "High-Index (1.60)"
    lensIndexPrice?: string; // "$50.00"
    viewArea?: string;       // "40% Broader View"
    viewAreaPrice?: string;  // "$75.00"
  };
}>
```

#### Step 2: Update Payment Callback Email Data
**File**: `/workspaces/Zyro/zyro-app/app/api/checkout/payment-callback/route.ts` (lines 243-249)

**Current code** (too simple):
```typescript
items: cartSnapshot.map((item: any) => ({
  name: item.product_snapshot?.name || 'Unknown Product',
  sku: item.product_snapshot?.sku || 'N/A',
  quantity: item.quantity,
  price: `$${item.unit_price.toFixed(2)}`,
  hasPrescription: !!item.prescription,
})),
```

**Needs to become** (with prescription details):
```typescript
items: await Promise.all(cartSnapshot.map(async (item: any) => {
  const baseData = {
    name: item.product_snapshot?.name || 'Unknown Product',
    sku: item.product_snapshot?.sku || 'N/A',
    quantity: item.quantity,
    basePrice: `$${item.product_snapshot.price.toFixed(2)}`,
    totalPrice: `$${item.unit_price.toFixed(2)}`,
  };

  if (item.prescription) {
    // Fetch prescription details from lookup tables
    const prescriptionData = await buildPrescriptionEmailData(
      item.prescription,
      lensTypes,
      lensIndexes,
      viewAreas,
      prescriptionTypes
    );

    return {
      ...baseData,
      prescription: prescriptionData,
    };
  }

  return baseData;
})),
```

#### Step 3: Create Helper Function
**File**: `/workspaces/Zyro/zyro-app/lib/email/email-helpers.ts` (NEW)

```typescript
interface PrescriptionEmailData {
  type: string;
  lensType: string;
  lensTypePrice: string;
  lensIndex?: string;
  lensIndexPrice?: string;
  viewArea?: string;
  viewAreaPrice?: string;
}

export function buildPrescriptionEmailData(
  prescription: any,
  lensTypes: any[],
  lensIndexes: any[],
  viewAreas: any[],
  prescriptionTypes: any[]
): PrescriptionEmailData {
  // Find related records
  const prescType = prescriptionTypes.find(pt => pt.id === prescription.prescription_type_id);
  const lensType = lensTypes.find(lt => lt.id === prescription.lens_type_id);
  const lensIndex = lensIndexes.find(li => li.id === prescription.lens_index_id);
  const viewArea = viewAreas.find(va => va.id === prescription.view_area_id);

  const result: PrescriptionEmailData = {
    type: prescType?.name || 'Prescription',
    lensType: lensType?.name || 'Standard',
    lensTypePrice: `$${(lensType?.price_modifier || 0).toFixed(2)}`,
  };

  if (lensIndex) {
    result.lensIndex = lensIndex.name;
    result.lensIndexPrice = `$${lensIndex.price_modifier.toFixed(2)}`;
  }

  if (viewArea) {
    result.viewArea = viewArea.name;
    result.viewAreaPrice = `$${viewArea.price_modifier.toFixed(2)}`;
  }

  return result;
}
```

#### Step 4: Update SendGrid HTML Templates
**Location**: SendGrid Dashboard → Email API → Dynamic Templates

**Template 1: Order Confirmation** (ID: d-717922b773cf45c9aec5e533e385dc0c)

Replace the items loop with detailed breakdown:

```html
{{#each items}}
<div class="item">
  <strong>{{name}}</strong><br>
  <span style="color: #666; font-size: 14px;">SKU: {{sku}}</span><br>
  <span style="color: #666; font-size: 14px;">Cantidad: {{quantity}}x</span>

  {{#if prescription}}
  <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
    <strong style="color: #000;">CONFIGURACIÓN DE LENTES:</strong><br>
    <div style="margin-top: 8px; color: #28a745;">
      ✓ Tipo: {{prescription.type}}<br>
      ✓ Lentes: {{prescription.lensType}}<br>
      {{#if prescription.lensIndex}}
      ✓ Índice: {{prescription.lensIndex}}<br>
      {{/if}}
      {{#if prescription.viewArea}}
      ✓ Área de visión: {{prescription.viewArea}}<br>
      {{/if}}
    </div>
  </div>

  <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
    <strong style="color: #000;">DESGLOSE DE PRECIO:</strong><br>
    <div style="margin-top: 8px;">
      <div style="display: flex; justify-content: space-between;">
        <span>- Marco base:</span>
        <span>{{basePrice}}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span>- {{prescription.lensType}}:</span>
        <span>{{prescription.lensTypePrice}}</span>
      </div>
      {{#if prescription.lensIndex}}
      <div style="display: flex; justify-content: space-between;">
        <span>- {{prescription.lensIndex}}:</span>
        <span>{{prescription.lensIndexPrice}}</span>
      </div>
      {{/if}}
      {{#if prescription.viewArea}}
      <div style="display: flex; justify-content: space-between;">
        <span>- {{prescription.viewArea}}:</span>
        <span>{{prescription.viewAreaPrice}}</span>
      </div>
      {{/if}}
      <div style="display: flex; justify-content: space-between; margin-top: 10px; padding-top: 10px; border-top: 2px solid #000; font-weight: bold;">
        <span>Subtotal item:</span>
        <span>{{totalPrice}}</span>
      </div>
    </div>
  </div>
  {{else}}
  <div style="margin-top: 10px;">
    <strong>Precio: {{totalPrice}}</strong>
  </div>
  {{/if}}
</div>
{{/each}}
```

**Template 2: Order Shipped** - Similar updates for the items section

---

## Testing Checklist

### Test 1: Prescription Data Saving
- [ ] Place order with Single Vision prescription
- [ ] Check server logs: Should see `[payment-callback] Prescriptions saved successfully`
- [ ] Verify in database: `order_item_prescriptions` table has new record
- [ ] Verify all fields populated: `prescription_type_id`, `lens_type_id`, `lens_index_id`, etc.

### Test 2: Order Pages Display
- [ ] Order confirmation page shows full prescription details
- [ ] Order confirmation page shows price breakdown
- [ ] Order details page shows full prescription details
- [ ] Admin order view shows full prescription details

### Test 3: Email Templates
- [ ] Order confirmation email shows prescription configuration
- [ ] Order confirmation email shows itemized pricing
- [ ] Email is readable on mobile devices
- [ ] Email formatting looks professional

### Test 4: Different Prescription Types
- [ ] Test with Single Vision prescription
- [ ] Test with Progressive prescription
- [ ] Test with Non-Prescription (blue light, etc.)
- [ ] Test without prescription (frame only)

---

## Success Criteria

✅ **Issue considered resolved when**:
1. Prescription data saves successfully to database (no errors in logs)
2. Order pages show complete prescription configuration
3. Order pages show itemized price breakdown
4. Email templates show prescription details
5. Email templates show price breakdown
6. All 4 prescription types tested and working

---

## Files to Modify

### Backend Files
1. `/app/api/checkout/payment-callback/route.ts` - ✅ Already fixed, needs testing
2. `/lib/email/email-service.ts` - Update item data structure
3. `/lib/email/email-helpers.ts` - NEW - Create helper function

### Frontend Files
No changes needed - `PrescriptionSummary` component already exists and integrated

### SendGrid Templates
1. Template d-717922b773cf45c9aec5e533e385dc0c - Update items section
2. Template d-a47f4deaae4c4fcdb90b6ca700fa241d - Update items section

---

## Estimated Time

- **Testing prescription data fix**: 15 minutes
- **Update email service data structure**: 30 minutes
- **Create email helper function**: 30 minutes
- **Update SendGrid templates**: 45 minutes
- **Testing all scenarios**: 30 minutes

**Total**: ~2.5 hours

---

## Related Documents

- Main implementation plan: `/docs/progress/SENDGRID-EMAIL-SERVICE.md`
- Database schema: `/docs/DATABASE-SCHEMA.md`
- Product requirements: `/docs/PRD.md`

---

**Document Created**: December 27, 2025
**Last Updated**: December 27, 2025
**Status**: Ready for Implementation
**Priority**: P0 - Critical
