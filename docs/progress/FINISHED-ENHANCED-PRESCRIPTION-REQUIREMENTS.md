# Enhanced Prescription Flow Requirements

**Date**: November 6, 2025
**Status**: 🚧 IN PROGRESS - Documentation Phase
**Impact**: VERY HIGH - Major Feature Enhancement
**Estimated Implementation Time**: 7-10 hours

---

## Table of Contents

1. [Overview](#overview)
2. [Requirements Specification](#requirements-specification)
3. [Prescription Flow Decision Tree](#prescription-flow-decision-tree)
4. [Database Schema Changes](#database-schema-changes)
5. [Impact Analysis](#impact-analysis)
6. [Updated TypeScript Interfaces](#updated-typescript-interfaces)
7. [UI/UX Considerations](#uiux-considerations)
8. [Implementation Checklist](#implementation-checklist)
9. [Testing Scenarios](#testing-scenarios)
10. [Future Enhancements](#future-enhancements)

---

## Overview

### Business Context

The current prescription flow allows users to add prescription glasses to their cart with basic prescription details (OD, OS, PD). However, the actual product offering is much more complex, requiring:

- **Multiple prescription types** (No RX, Single Vision, Progressive)
- **Lens options** (index, view area)
- **Prescription validation** (formula required for RX glasses)
- **Image upload capability** (for prescription verification)

This enhancement aligns the digital experience with the actual product catalog and clinical requirements for prescription eyewear.

### Goals

1. ✅ **Capture complete prescription information** at point of product selection
2. ✅ **Guide users** through complex prescription options with clear decision tree
3. ✅ **Validate requirements** - ensure formula OR image provided for RX glasses
4. ✅ **Support clinical workflow** - opticians need prescription images for verification
5. ✅ **Maintain flexibility** - allow users to skip/complete later if needed

### Success Metrics

- Reduced cart abandonment at checkout (target: <15%)
- Increased prescription completeness (target: >80% complete at add-to-cart)
- Reduced customer service inquiries about prescription requirements
- Improved order fulfillment accuracy

---

## Requirements Specification

### 1. Prescription Type Selection

**Field**: `prescription_type`
**Type**: Enum/Radio Selection
**Required**: YES (for products with `requires_prescription = true`)
**Options**:

| Option | Value | Description |
|--------|-------|-------------|
| Without RX | `without_rx` | Non-prescription eyewear |
| Single Vision | `single_vision` | One prescription power throughout entire lens |
| Progressive | `progressive` | Multiple prescription powers in one lens (near, intermediate, distance) |

---

### 2. Without RX Sub-Options

**Field**: `without_rx_type`
**Type**: Enum/Radio Selection
**Required**: YES (when `prescription_type = 'without_rx'`)
**Options**:

| Option | Value | Description | Price Impact |
|--------|-------|-------------|--------------|
| Frame Only | `frame_only` | Just the frame, no lenses included | Base price |
| Blue Block | `blue_block` | Blue light blocking lenses (non-prescription) | +$25.00 |
| Standard Eyeglasses | `standard_eyeglasses` | Clear non-prescription lenses | +$15.00 |

**Business Rules**:
- Frame Only: No lens specifications needed
- Blue Block: Functional non-RX lens for screen protection
- Standard Eyeglasses: Clear non-RX lens for fashion/protection

---

### 3. Single Vision Sub-Options

**Field**: `single_vision_type`
**Type**: Enum/Radio Selection
**Required**: YES (when `prescription_type = 'single_vision'`)
**Options**:

| Option | Value | Description |
|--------|-------|-------------|
| Near (Reading) | `near` | Optimized for reading/close work (30-40cm) |
| Intermediate (Computer) | `intermediate` | Optimized for computer/desk work (50-80cm) |
| Distance (Driving) | `distance` | Optimized for distance vision (2m+) |

**Business Rules**:
- Prescription formula REQUIRED (manual entry OR image upload)
- Lens index selection required
- Treatments optional

---

### 4. Progressive Sub-Options

**Field**: `progressive_type`
**Type**: Display Only (always "Near, Intermediate, Distance")
**Required**: N/A (informational only)
**Description**: Progressive lenses include all three viewing zones in one lens

**Business Rules**:
- Prescription formula REQUIRED (manual entry OR image upload)
- Lens index selection required
- View area selection required (unique to progressive)
- Treatments optional

---

### 5. Prescription Formula Fields

**Group**: `prescription_details`
**Required**: YES (when `prescription_type IN ['single_vision', 'progressive']`)
**Validation**: At least ONE of the following must be provided:
- Manual entry (all OD/OS fields)
- Image upload

#### Manual Entry Fields:

| Field | Label | Format | Range | Example |
|-------|-------|--------|-------|---------|
| `od_sph` | OD - Sphere (SPH) | Decimal | -20.00 to +20.00 | -2.50 |
| `od_cyl` | OD - Cylinder (CYL) | Decimal | -4.00 to +4.00 | -0.75 |
| `od_axis` | OD - Axis | Integer | 0 to 180 | 90 |
| `os_sph` | OS - Sphere (SPH) | Decimal | -20.00 to +20.00 | -2.25 |
| `os_cyl` | OS - Cylinder (CYL) | Decimal | -4.00 to +4.00 | -0.50 |
| `os_axis` | OS - Axis | Integer | 0 to 180 | 85 |
| `pd` | Pupillary Distance (PD) | Decimal | 20.0 to 80.0 | 63.0 |

**Notes**:
- OD = Oculus Dexter (Right Eye)
- OS = Oculus Sinister (Left Eye)
- Axis only relevant when CYL ≠ 0
- All fields optional individually, but at least OD SPH or OS SPH should be provided

#### Image Upload:

**Field**: `prescription_image_url`
**Type**: File Upload (Image)
**Accepted Formats**: JPEG, PNG, PDF
**Max Size**: 5 MB
**Storage**: Supabase Storage bucket `prescription-images/`
**Security**: Authenticated users only, RLS policies

**Upload Flow**:
1. User selects image file
2. Client validates format and size
3. Upload to Supabase Storage with unique filename
4. Store public URL in cart item
5. Display thumbnail preview

**Business Rules**:
- User can provide EITHER manual entry OR image OR both
- If image provided without manual entry, optician will enter formula during order processing
- Image serves as verification even if manual entry provided

---

### 6. Lens Index Selection

**Field**: `lens_index`
**Type**: Enum/Radio Selection
**Required**: YES (when `prescription_type IN ['single_vision', 'progressive']`)
**Options**:

| Option | Value | Description | Thickness | Price Impact |
|--------|-------|-------------|-----------|--------------|
| 1.50 Standard | `1.50` | Standard plastic lens, thicker profile | Standard | Base price |
| 1.60 Thin | `1.60` | High-index lens, thinner and lighter | 20% thinner | +$50.00 |

**Future Options** (Post-MVP):
- 1.67 Ultra-Thin (+$100.00)
- 1.74 Premium Thin (+$150.00)

**Business Rules**:
- Higher index = thinner lens = better aesthetics for strong prescriptions
- Recommended: 1.60+ for prescriptions with SPH > ±3.00 or CYL > ±2.00

---

### 7. View Area Selection (Progressive Only)

**Field**: `progressive_view_area`
**Type**: Enum/Radio Selection
**Required**: YES (when `prescription_type = 'progressive'`)
**Conditional**: Only shown for progressive lenses
**Options**:

| Option | Value | Description | Use Case | Price Impact |
|--------|-------|-------------|----------|--------------|
| Standard View Area | `standard` | Traditional progressive corridor | General use | Base price |
| 40% Broader View Area | `broader_40` | Wider intermediate/near zones | Computer work, reading | +$75.00 |

**Technical Details**:
- Standard: 10-12mm corridor width
- Broader: 14-15mm corridor width
- Affects peripheral distortion and adaptation time

**Business Rules**:
- Only applicable to progressive lenses
- Hidden/disabled for single vision and without RX
- Default to "Standard" if not selected

---

### 8. Treatments (Existing - No Changes)

**Field**: `selected_treatments`
**Type**: Multi-select checkboxes
**Required**: NO (optional add-ons)
**Existing Options**:
- Anti-reflejo (Anti-Reflective) - $30.00
- Fotocromático (Photochromic) - $50.00
- Polarizado (Polarized) - $40.00

**Business Rules** (unchanged):
- Multiple treatments can be selected
- Prices additive
- Available for all prescription types including "Without RX" with lenses

---

## Prescription Flow Decision Tree

```
User selects product with prescription option
    ↓
[1] Select Prescription Type?
    ├─ Without RX
    │   ↓
    │   [2] Select Without RX Type?
    │   ├─ Frame Only
    │   │   ↓
    │   │   [Optional] Select Treatments
    │   │   ↓
    │   │   Add to Cart ✓
    │   │
    │   ├─ Blue Block
    │   │   ↓
    │   │   [Optional] Select Treatments
    │   │   ↓
    │   │   Add to Cart ✓
    │   │
    │   └─ Standard Eyeglasses
    │       ↓
    │       [Optional] Select Treatments
    │       ↓
    │       Add to Cart ✓
    │
    ├─ Single Vision
    │   ↓
    │   [3] Select Single Vision Type?
    │   ├─ Near (Reading)
    │   ├─ Intermediate (Computer)
    │   └─ Distance (Driving)
    │   ↓
    │   [4] Enter Prescription Formula OR Upload Image? (REQUIRED)
    │   ├─ Manual Entry (OD, OS, PD)
    │   ├─ Image Upload
    │   └─ Both (recommended)
    │   ↓
    │   [5] Select Lens Index? (REQUIRED)
    │   ├─ 1.50 Standard
    │   └─ 1.60 Thin (+$50)
    │   ↓
    │   [Optional] Select Treatments
    │   ↓
    │   Add to Cart ✓
    │
    └─ Progressive
        ↓
        [Info] "Includes Near, Intermediate, and Distance in one lens"
        ↓
        [6] Enter Prescription Formula OR Upload Image? (REQUIRED)
        ├─ Manual Entry (OD, OS, PD)
        ├─ Image Upload
        └─ Both (recommended)
        ↓
        [7] Select Lens Index? (REQUIRED)
        ├─ 1.50 Standard
        └─ 1.60 Thin (+$50)
        ↓
        [8] Select View Area? (REQUIRED)
        ├─ Standard
        └─ 40% Broader (+$75)
        ↓
        [Optional] Select Treatments
        ↓
        Add to Cart ✓
```

**Validation Rules**:
- Step [4] and [6]: At least one prescription input method required
- Step [5] and [7]: Lens index selection required
- Step [8]: View area selection required (progressive only)
- Cannot add to cart until all required fields completed

---

## Database Schema Changes

### 1. New Enums

#### `prescription_type_enum`
```sql
CREATE TYPE prescription_type_enum AS ENUM (
  'without_rx',
  'single_vision',
  'progressive'
);
```

#### `without_rx_type_enum`
```sql
CREATE TYPE without_rx_type_enum AS ENUM (
  'frame_only',
  'blue_block',
  'standard_eyeglasses'
);
```

#### `single_vision_type_enum`
```sql
CREATE TYPE single_vision_type_enum AS ENUM (
  'near',
  'intermediate',
  'distance'
);
```

#### `lens_index_enum`
```sql
CREATE TYPE lens_index_enum AS ENUM (
  '1.50',
  '1.60',
  '1.67',  -- Future
  '1.74'   -- Future
);
```

#### `progressive_view_area_enum`
```sql
CREATE TYPE progressive_view_area_enum AS ENUM (
  'standard',
  'broader_40'
);
```

---

### 2. Updated Table: `cart_item_prescriptions`

**Current Schema** (to be modified):
```sql
CREATE TABLE cart_item_prescriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_item_id UUID REFERENCES cart_items(id) ON DELETE CASCADE,
  od_sph DECIMAL(5,2),
  od_cyl DECIMAL(5,2),
  od_axis INTEGER,
  os_sph DECIMAL(5,2),
  os_cyl DECIMAL(5,2),
  os_axis INTEGER,
  pd DECIMAL(4,1),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**New Schema** (with enhancements):
```sql
ALTER TABLE cart_item_prescriptions
  ADD COLUMN prescription_type prescription_type_enum,
  ADD COLUMN without_rx_type without_rx_type_enum,
  ADD COLUMN single_vision_type single_vision_type_enum,
  ADD COLUMN lens_index lens_index_enum,
  ADD COLUMN progressive_view_area progressive_view_area_enum,
  ADD COLUMN prescription_image_url TEXT,
  ADD COLUMN prescription_image_uploaded_at TIMESTAMPTZ;

-- Add validation constraints
ALTER TABLE cart_item_prescriptions
  ADD CONSTRAINT prescription_type_required
    CHECK (prescription_type IS NOT NULL),

  ADD CONSTRAINT without_rx_subtype_required
    CHECK (
      prescription_type != 'without_rx'
      OR without_rx_type IS NOT NULL
    ),

  ADD CONSTRAINT single_vision_subtype_required
    CHECK (
      prescription_type != 'single_vision'
      OR single_vision_type IS NOT NULL
    ),

  ADD CONSTRAINT rx_lens_index_required
    CHECK (
      prescription_type = 'without_rx'
      OR lens_index IS NOT NULL
    ),

  ADD CONSTRAINT progressive_view_area_required
    CHECK (
      prescription_type != 'progressive'
      OR progressive_view_area IS NOT NULL
    ),

  ADD CONSTRAINT rx_formula_or_image_required
    CHECK (
      prescription_type = 'without_rx'
      OR (od_sph IS NOT NULL OR os_sph IS NOT NULL OR prescription_image_url IS NOT NULL)
    );
```

**Field Mapping**:
| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `prescription_type` | `prescription_type_enum` | NO | Main prescription category |
| `without_rx_type` | `without_rx_type_enum` | YES | Sub-type for non-RX |
| `single_vision_type` | `single_vision_type_enum` | YES | Sub-type for single vision |
| `lens_index` | `lens_index_enum` | YES* | Required for RX types |
| `progressive_view_area` | `progressive_view_area_enum` | YES* | Required for progressive |
| `prescription_image_url` | TEXT | YES | Supabase Storage URL |
| `prescription_image_uploaded_at` | TIMESTAMPTZ | YES | Upload timestamp |

*Enforced by CHECK constraints based on `prescription_type`

---

### 3. Updated Table: `order_item_prescriptions`

**Apply same schema changes as `cart_item_prescriptions`**:

```sql
ALTER TABLE order_item_prescriptions
  ADD COLUMN prescription_type prescription_type_enum,
  ADD COLUMN without_rx_type without_rx_type_enum,
  ADD COLUMN single_vision_type single_vision_type_enum,
  ADD COLUMN lens_index lens_index_enum,
  ADD COLUMN progressive_view_area progressive_view_area_enum,
  ADD COLUMN prescription_image_url TEXT,
  ADD COLUMN prescription_image_uploaded_at TIMESTAMPTZ;

-- Add same validation constraints as cart_item_prescriptions
-- (constraints repeated here)
```

**Business Logic**:
- When cart is converted to order, prescription data is copied from `cart_item_prescriptions` to `order_item_prescriptions`
- Order prescriptions are immutable (no edits after order placed)
- Prescription images remain accessible for order fulfillment

---

### 4. Pricing Configuration Tables

#### New Table: `lens_options`
```sql
CREATE TABLE lens_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  option_type VARCHAR(50) NOT NULL, -- 'without_rx_type', 'lens_index', 'view_area'
  option_value VARCHAR(50) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  price_modifier DECIMAL(10,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_lens_options_type ON lens_options(option_type);
CREATE INDEX idx_lens_options_active ON lens_options(is_active);

-- Initial data
INSERT INTO lens_options (option_type, option_value, display_name, description, price_modifier, display_order) VALUES
-- Without RX Types
('without_rx_type', 'frame_only', 'Frame Only', 'Just the frame, no lenses included', 0.00, 1),
('without_rx_type', 'blue_block', 'Blue Block', 'Blue light blocking lenses (non-prescription)', 25.00, 2),
('without_rx_type', 'standard_eyeglasses', 'Standard Eyeglasses', 'Clear non-prescription lenses', 15.00, 3),

-- Lens Index
('lens_index', '1.50', '1.50 Standard', 'Standard plastic lens', 0.00, 1),
('lens_index', '1.60', '1.60 Thin', 'High-index lens, 20% thinner and lighter', 50.00, 2),

-- Progressive View Area
('view_area', 'standard', 'Standard View Area', 'Traditional progressive corridor', 0.00, 1),
('view_area', 'broader_40', '40% Broader View Area', 'Wider intermediate/near zones for computer work', 75.00, 2);
```

**Benefits**:
- Centralized pricing management
- Easy to add new lens options without code changes
- Display order configurable
- Can be toggled active/inactive

---

### 5. Migration File

**File**: `/zyro-app/supabase/migrations/YYYYMMDDHHMMSS_add_enhanced_prescription_fields.sql`

```sql
-- Migration: Add Enhanced Prescription Fields
-- Date: 2025-11-06
-- Description: Adds prescription type, lens options, and image upload support

-- Step 1: Create enums
CREATE TYPE prescription_type_enum AS ENUM ('without_rx', 'single_vision', 'progressive');
CREATE TYPE without_rx_type_enum AS ENUM ('frame_only', 'blue_block', 'standard_eyeglasses');
CREATE TYPE single_vision_type_enum AS ENUM ('near', 'intermediate', 'distance');
CREATE TYPE lens_index_enum AS ENUM ('1.50', '1.60', '1.67', '1.74');
CREATE TYPE progressive_view_area_enum AS ENUM ('standard', 'broader_40');

-- Step 2: Create lens_options table
CREATE TABLE lens_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  option_type VARCHAR(50) NOT NULL,
  option_value VARCHAR(50) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  price_modifier DECIMAL(10,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lens_options_type ON lens_options(option_type);
CREATE INDEX idx_lens_options_active ON lens_options(is_active);

-- Step 3: Populate lens_options
INSERT INTO lens_options (option_type, option_value, display_name, description, price_modifier, display_order) VALUES
('without_rx_type', 'frame_only', 'Frame Only', 'Just the frame, no lenses included', 0.00, 1),
('without_rx_type', 'blue_block', 'Blue Block', 'Blue light blocking lenses (non-prescription)', 25.00, 2),
('without_rx_type', 'standard_eyeglasses', 'Standard Eyeglasses', 'Clear non-prescription lenses', 15.00, 3),
('lens_index', '1.50', '1.50 Standard', 'Standard plastic lens', 0.00, 1),
('lens_index', '1.60', '1.60 Thin', 'High-index lens, 20% thinner and lighter', 50.00, 2),
('view_area', 'standard', 'Standard View Area', 'Traditional progressive corridor', 0.00, 1),
('view_area', 'broader_40', '40% Broader View Area', 'Wider intermediate/near zones', 75.00, 2);

-- Step 4: Alter cart_item_prescriptions
ALTER TABLE cart_item_prescriptions
  ADD COLUMN prescription_type prescription_type_enum,
  ADD COLUMN without_rx_type without_rx_type_enum,
  ADD COLUMN single_vision_type single_vision_type_enum,
  ADD COLUMN lens_index lens_index_enum,
  ADD COLUMN progressive_view_area progressive_view_area_enum,
  ADD COLUMN prescription_image_url TEXT,
  ADD COLUMN prescription_image_uploaded_at TIMESTAMPTZ;

-- Step 5: Add constraints to cart_item_prescriptions
ALTER TABLE cart_item_prescriptions
  ADD CONSTRAINT prescription_type_required
    CHECK (prescription_type IS NOT NULL),
  ADD CONSTRAINT without_rx_subtype_required
    CHECK (prescription_type != 'without_rx' OR without_rx_type IS NOT NULL),
  ADD CONSTRAINT single_vision_subtype_required
    CHECK (prescription_type != 'single_vision' OR single_vision_type IS NOT NULL),
  ADD CONSTRAINT rx_lens_index_required
    CHECK (prescription_type = 'without_rx' OR lens_index IS NOT NULL),
  ADD CONSTRAINT progressive_view_area_required
    CHECK (prescription_type != 'progressive' OR progressive_view_area IS NOT NULL),
  ADD CONSTRAINT rx_formula_or_image_required
    CHECK (prescription_type = 'without_rx' OR (od_sph IS NOT NULL OR os_sph IS NOT NULL OR prescription_image_url IS NOT NULL));

-- Step 6: Alter order_item_prescriptions (same as cart)
ALTER TABLE order_item_prescriptions
  ADD COLUMN prescription_type prescription_type_enum,
  ADD COLUMN without_rx_type without_rx_type_enum,
  ADD COLUMN single_vision_type single_vision_type_enum,
  ADD COLUMN lens_index lens_index_enum,
  ADD COLUMN progressive_view_area progressive_view_area_enum,
  ADD COLUMN prescription_image_url TEXT,
  ADD COLUMN prescription_image_uploaded_at TIMESTAMPTZ;

-- Step 7: Add constraints to order_item_prescriptions
ALTER TABLE order_item_prescriptions
  ADD CONSTRAINT prescription_type_required
    CHECK (prescription_type IS NOT NULL),
  ADD CONSTRAINT without_rx_subtype_required
    CHECK (prescription_type != 'without_rx' OR without_rx_type IS NOT NULL),
  ADD CONSTRAINT single_vision_subtype_required
    CHECK (prescription_type != 'single_vision' OR single_vision_type IS NOT NULL),
  ADD CONSTRAINT rx_lens_index_required
    CHECK (prescription_type = 'without_rx' OR lens_index IS NOT NULL),
  ADD CONSTRAINT progressive_view_area_required
    CHECK (prescription_type != 'progressive' OR progressive_view_area IS NOT NULL),
  ADD CONSTRAINT rx_formula_or_image_required
    CHECK (prescription_type = 'without_rx' OR (od_sph IS NOT NULL OR os_sph IS NOT NULL OR prescription_image_url IS NOT NULL));

-- Step 8: Add RLS policies for lens_options
ALTER TABLE lens_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lens_options_select_policy"
  ON lens_options FOR SELECT
  USING (true); -- Public read access

CREATE POLICY "lens_options_insert_update_delete_policy"
  ON lens_options FOR ALL
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin')); -- Admin only

-- Migration complete
```

---

## Impact Analysis

### 1. Database (☑️ VERY HIGH IMPACT)

**Affected Tables**:
- `cart_item_prescriptions` - 7 new columns + constraints
- `order_item_prescriptions` - 7 new columns + constraints
- `lens_options` - NEW TABLE

**Affected Enums**:
- 5 new enums created

**Migration Required**: YES

**Backward Compatibility**:
- Existing cart items: Need migration script to set default `prescription_type = 'single_vision'` for items with `od_sph` or `os_sph` populated
- New columns nullable during transition period
- After deployment, make `prescription_type` NOT NULL

**RLS Policies**:
- `lens_options` needs read-only public policy
- Prescription image URLs: need authenticated read policy

---

### 2. Product Detail Page (☑️ VERY HIGH IMPACT)

**File**: `/zyro-app/app/products/[id]/ProductDetailClient.tsx`

**Changes Required**:

1. **State Management** - Add new state variables:
   ```typescript
   const [prescriptionType, setPrescriptionType] = useState<'without_rx' | 'single_vision' | 'progressive' | null>(null);
   const [withoutRxType, setWithoutRxType] = useState<'frame_only' | 'blue_block' | 'standard_eyeglasses' | null>(null);
   const [singleVisionType, setSingleVisionType] = useState<'near' | 'intermediate' | 'distance' | null>(null);
   const [lensIndex, setLensIndex] = useState<'1.50' | '1.60' | null>(null);
   const [progressiveViewArea, setProgressiveViewArea] = useState<'standard' | 'broader_40' | null>(null);
   const [prescriptionImage, setPrescriptionImage] = useState<File | null>(null);
   const [prescriptionImagePreview, setPrescriptionImagePreview] = useState<string | null>(null);
   ```

2. **Conditional Rendering** - Multi-level form:
   - Level 1: Prescription Type selector (radio buttons)
   - Level 2a: Without RX sub-options (conditional)
   - Level 2b: Single Vision sub-options + formula + lens index (conditional)
   - Level 2c: Progressive info + formula + lens index + view area (conditional)

3. **Image Upload Handler**:
   ```typescript
   const handlePrescriptionImageUpload = async (file: File) => {
     // Validate file type and size
     // Upload to Supabase Storage
     // Get public URL
     // Set state
   };
   ```

4. **Validation Logic**:
   - Disable "Add to Cart" until required fields filled
   - Show validation messages for incomplete sections
   - Visual indicators for completed sections

5. **Price Calculation** - Update to include:
   ```typescript
   const calculateTotalPrice = () => {
     let total = product.price;

     // Add without_rx_type price
     if (prescriptionType === 'without_rx' && withoutRxType) {
       total += getLensOptionPrice('without_rx_type', withoutRxType);
     }

     // Add lens_index price
     if (lensIndex && lensIndex !== '1.50') {
       total += getLensOptionPrice('lens_index', lensIndex);
     }

     // Add view_area price
     if (progressiveViewArea === 'broader_40') {
       total += getLensOptionPrice('view_area', 'broader_40');
     }

     // Add treatments
     selectedTreatments.forEach(t => total += t.price);

     return total;
   };
   ```

6. **Updated Cart Item Structure**:
   ```typescript
   const cartItem = {
     ...existingFields,
     prescriptionDetails: {
       prescriptionType,
       withoutRxType,
       singleVisionType,
       lensIndex,
       progressiveViewArea,
       prescriptionImageUrl: uploadedImageUrl,
       od_sph, od_cyl, od_axis,
       os_sph, os_cyl, os_axis,
       pd,
     },
   };
   ```

**Estimated Lines Changed**: ~400 lines (major refactor)

---

### 3. Cart Page (☑️ HIGH IMPACT)

**File**: `/zyro-app/app/cart/CartClient.tsx`

**Changes Required**:

1. **Interface Updates**:
   ```typescript
   interface PrescriptionDetails {
     prescriptionType: 'without_rx' | 'single_vision' | 'progressive';
     withoutRxType?: 'frame_only' | 'blue_block' | 'standard_eyeglasses';
     singleVisionType?: 'near' | 'intermediate' | 'distance';
     lensIndex?: '1.50' | '1.60';
     progressiveViewArea?: 'standard' | 'broader_40';
     prescriptionImageUrl?: string;
     od_sph?: string;
     od_cyl?: string;
     od_axis?: string;
     os_sph?: string;
     os_cyl?: string;
     os_axis?: string;
     pd?: string;
   }
   ```

2. **Enhanced Display Section**:
   ```typescript
   {item.prescriptionDetails && (
     <div className="prescription-display">
       {/* Prescription Type Badge */}
       <Badge>
         {getPrescriptionTypeLabel(item.prescriptionDetails.prescriptionType)}
       </Badge>

       {/* Without RX Details */}
       {item.prescriptionDetails.prescriptionType === 'without_rx' && (
         <div>Type: {item.prescriptionDetails.withoutRxType}</div>
       )}

       {/* Single Vision / Progressive Details */}
       {(item.prescriptionDetails.prescriptionType === 'single_vision' ||
         item.prescriptionDetails.prescriptionType === 'progressive') && (
         <>
           {/* Formula display */}
           {/* Lens index display */}
           {/* View area display (progressive only) */}
           {/* Prescription image thumbnail */}
         </>
       )}
     </div>
   )}
   ```

3. **Price Display** - Include lens options:
   ```typescript
   const itemTotal =
     item.productPrice +
     getLensOptionPrices(item.prescriptionDetails) +
     item.selectedTreatments.reduce((sum, t) => sum + t.price, 0);
   ```

**Estimated Lines Changed**: ~150 lines

---

### 4. Checkout Page (☑️ MEDIUM IMPACT)

**File**: `/zyro-app/app/checkout/page.tsx` (to be created)

**Changes Required**:

1. **Review & Edit Prescription**:
   - Display all prescription details (read-only by default)
   - "Edit" button to modify prescription details
   - Re-validation before order submission

2. **Prescription Image Display**:
   - Thumbnail with "View Full Size" modal
   - Download option for user

3. **Order Submission**:
   - Include all prescription data in order creation
   - Upload prescription image to permanent storage (if not already)
   - Copy from `cart_item_prescriptions` to `order_item_prescriptions`

**Estimated Lines Changed**: ~100 lines (new file, estimated 500+ lines total)

---

### 5. PRD Document (☑️ HIGH IMPACT)

**File**: `/docs/PRD.md`

**Sections to Update**:

1. **Product Requirements** - Section 3.2 (Prescription Eyewear):
   - Replace basic prescription capture with enhanced flow
   - Add prescription type options
   - Add lens configuration options
   - Add image upload requirement

2. **User Stories** - Add new stories:
   ```
   US-012: As a customer, I want to select my prescription type (no RX, single vision, progressive) so that I receive the correct lenses for my needs.

   US-013: As a customer, I want to choose lens thickness (index) so that I can get thinner lenses for my strong prescription.

   US-014: As a customer, I want to upload a photo of my prescription so that I don't have to manually type all the numbers.

   US-015: As a customer with progressive lenses, I want to choose a broader view area so that my computer work is more comfortable.
   ```

3. **Technical Requirements** - Section 5:
   - Add Supabase Storage configuration
   - Add enum type definitions
   - Add validation rules

4. **Pricing Logic** - Section 6:
   - Update pricing calculation formula
   - Add lens option price matrix

**Estimated Lines Changed**: ~200 lines

---

### 6. MOSCOW Prioritization (☑️ MEDIUM IMPACT)

**File**: `/docs/MOSCOW-PRIORITIZATION.md`

**Changes Required**:

1. **Move to "MUST HAVE"**:
   - Enhanced prescription flow
   - Lens index selection
   - Prescription image upload

2. **Move to "SHOULD HAVE"**:
   - Progressive view area selection (could be "Could Have" if timeline tight)
   - Without RX sub-options (Frame Only vs Blue Block vs Standard)

3. **Add to "COULD HAVE"**:
   - OCR for prescription image auto-fill
   - Saved prescriptions in user profile
   - Prescription history

4. **Add to "WON'T HAVE (for MVP)**:
   - 1.67 and 1.74 lens index options
   - Virtual try-on with prescription preview
   - Prescription verification by optician before order

**Estimated Lines Changed**: ~50 lines

---

### 7. Wireframes (☑️ HIGH IMPACT)

**Files Affected**:
- `/docs/wireframes/customer/06-login-register.txt` - Minor updates to show prescription in profile
- `/docs/wireframes/customer/10-checkout-page.txt` - Major updates to show enhanced prescription review

**New Wireframe Needed**:
- `/docs/wireframes/customer/07-product-detail-prescription-flow.txt`

**Content for New Wireframe**:

```
═══════════════════════════════════════════════════════════════════
ZYRO - PRESCRIPTION CONFIGURATION FLOW (Product Detail Page)
═══════════════════════════════════════════════════════════════════

[STEP 1: Prescription Type Selection]
┌─────────────────────────────────────────────────────────────────┐
│ ⚕️ Configure Your Prescription                                   │
│                                                                   │
│ Select your prescription type:                                   │
│                                                                   │
│ ○ Without RX                                                     │
│   For non-prescription eyewear or fashion glasses                │
│                                                                   │
│ ⦿ Single Vision                                                  │
│   One prescription power for reading, computer, or distance      │
│                                                                   │
│ ○ Progressive                                                    │
│   Multiple powers in one lens (near, intermediate, distance)     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

[STEP 2a: Without RX Sub-Options]
┌─────────────────────────────────────────────────────────────────┐
│ Select lens type:                                                │
│                                                                   │
│ ⦿ Frame Only                    Base Price                       │
│   Just the frame, no lenses                                      │
│                                                                   │
│ ○ Blue Block                    +$25.00                          │
│   Blue light blocking lenses                                     │
│                                                                   │
│ ○ Standard Eyeglasses          +$15.00                           │
│   Clear non-prescription lenses                                  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

[STEP 2b: Single Vision Flow]
┌─────────────────────────────────────────────────────────────────┐
│ Optimized for:                                                   │
│                                                                   │
│ ○ Near (Reading)        30-40cm                                  │
│ ⦿ Intermediate (Computer)  50-80cm                               │
│ ○ Distance (Driving)    2m+                                      │
│                                                                   │
│ ─────────────────────────────────────────────────────────────   │
│                                                                   │
│ 📝 Enter Prescription Details (Required)                         │
│                                                                   │
│ [Manual Entry]  [Upload Image]                                   │
│                                                                   │
│ Right Eye (OD):                                                  │
│ SPH: [-2.50] CYL: [-0.75] AXIS: [90]                             │
│                                                                   │
│ Left Eye (OS):                                                   │
│ SPH: [-2.25] CYL: [-0.50] AXIS: [85]                             │
│                                                                   │
│ PD (Pupillary Distance): [63.0] mm                               │
│                                                                   │
│ OR                                                                │
│                                                                   │
│ 📷 Upload Prescription Image                                     │
│ ┌─────────────────────────────┐                                  │
│ │  [Drop image or click to   ]│                                  │
│ │  [      upload             ]│                                  │
│ └─────────────────────────────┘                                  │
│ JPEG, PNG, PDF - Max 5MB                                         │
│                                                                   │
│ ─────────────────────────────────────────────────────────────   │
│                                                                   │
│ 🔬 Select Lens Index (Required)                                  │
│                                                                   │
│ ⦿ 1.50 Standard             Base Price                           │
│   Standard thickness                                             │
│                                                                   │
│ ○ 1.60 Thin                 +$50.00                              │
│   20% thinner, recommended for SPH > ±3.00                       │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

[STEP 2c: Progressive Flow]
┌─────────────────────────────────────────────────────────────────┐
│ ℹ️ Progressive lenses include Near, Intermediate, and Distance   │
│   vision zones in one lens.                                      │
│                                                                   │
│ 📝 Enter Prescription Details (Required)                         │
│ [Same as Single Vision - formula entry + image upload]           │
│                                                                   │
│ ─────────────────────────────────────────────────────────────   │
│                                                                   │
│ 🔬 Select Lens Index (Required)                                  │
│ [Same as Single Vision]                                          │
│                                                                   │
│ ─────────────────────────────────────────────────────────────   │
│                                                                   │
│ 👁️ Select View Area (Required)                                   │
│                                                                   │
│ ⦿ Standard View Area        Base Price                           │
│   Traditional progressive corridor                               │
│                                                                   │
│ ○ 40% Broader View Area     +$75.00                              │
│   Wider zones for computer work and reading                      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

[STEP 3: Treatments (All Prescription Types)]
┌─────────────────────────────────────────────────────────────────┐
│ ✨ Optional Treatments                                            │
│                                                                   │
│ ☑ Anti-Reflective Coating                   +$30.00             │
│ ☐ Photochromic (Transitions)                +$50.00             │
│ ☐ Polarized                                  +$40.00             │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

[PRICE SUMMARY]
┌─────────────────────────────────────────────────────────────────┐
│ Frame:                                       $150.00             │
│ Lens Configuration:                          $50.00              │
│   • Single Vision (Intermediate)                                 │
│   • 1.60 Thin Index                                              │
│ Treatments:                                  $30.00              │
│   • Anti-Reflective Coating                                      │
│ ─────────────────────────────────────────────────────────────   │
│ TOTAL:                                       $230.00             │
│                                                                   │
│ [  Add to Cart  ]                                                │
│                                                                   │
│ ⚠️ Complete all required fields to add to cart                   │
└─────────────────────────────────────────────────────────────────┘
```

**Estimated Lines Changed**: ~300 lines (new file)

---

### 8. Implementation Plan (☑️ LOW IMPACT)

**File**: `/docs/progress/IMPLEMENTATION-PLAN.md`

**Changes Required**:

1. **Phase 1.2** - Mark as "NEEDS REWORK" or "SUPERSEDED BY v2"
2. **Add Phase 1.2.v2** - Enhanced Prescription Flow
   - Task 1: Database migration
   - Task 2: Supabase Storage setup
   - Task 3: Product detail UI refactor
   - Task 4: Cart display updates
   - Task 5: Checkout integration
   - Task 6: Testing

3. **Update Timeline**:
   - Original Phase 1.2: 2-3 hours (basic prescription)
   - New Phase 1.2.v2: 7-10 hours (enhanced prescription)

**Estimated Lines Changed**: ~100 lines

---

### 9. Supabase Storage (☑️ HIGH IMPACT)

**New Configuration Required**:

#### Storage Bucket: `prescription-images`

```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('prescription-images', 'prescription-images', false);

-- RLS Policies for prescription-images bucket
CREATE POLICY "Authenticated users can upload prescription images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'prescription-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own prescription images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'prescription-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own prescription images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'prescription-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admin can view all prescription images
CREATE POLICY "Admins can view all prescription images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'prescription-images'
  AND auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);
```

**Folder Structure**:
```
prescription-images/
├── {user_id}/
│   ├── {timestamp}_{random}_prescription.jpg
│   ├── {timestamp}_{random}_prescription.png
│   └── {timestamp}_{random}_prescription.pdf
```

**Upload Naming Convention**:
```typescript
const filename = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}_prescription.${ext}`;
```

**Client-Side Upload Function**:
```typescript
import { createClient } from '@/lib/supabase/client';

export async function uploadPrescriptionImage(file: File, userId: string): Promise<string> {
  const supabase = createClient();

  // Validate file
  const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, and PDF allowed.');
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File too large. Maximum size is 5MB.');
  }

  // Generate unique filename
  const ext = file.name.split('.').pop();
  const filename = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}_prescription.${ext}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('prescription-images')
    .upload(filename, file);

  if (error) throw error;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('prescription-images')
    .getPublicUrl(filename);

  return publicUrl;
}
```

**Estimated Implementation Time**: 2 hours (setup + testing)

---

### 10. Login/Register Pages (☑️ LOW IMPACT)

**Files**:
- `/zyro-app/app/auth/login/page.tsx`
- `/zyro-app/app/auth/sign-up/page.tsx`

**Changes Required**: None directly

**Notes**:
- No changes needed to auth flow
- Prescription data stored in localStorage cart for unauthenticated users
- Upon login/registration, cart transfer logic handles prescription data

**Estimated Lines Changed**: 0 lines

---

## Updated TypeScript Interfaces

### 1. Product Detail Client

```typescript
// /zyro-app/app/products/[id]/ProductDetailClient.tsx

interface PrescriptionDetails {
  // Main type
  prescriptionType: 'without_rx' | 'single_vision' | 'progressive';

  // Sub-types
  withoutRxType?: 'frame_only' | 'blue_block' | 'standard_eyeglasses';
  singleVisionType?: 'near' | 'intermediate' | 'distance';

  // Lens options
  lensIndex?: '1.50' | '1.60' | '1.67' | '1.74';
  progressiveViewArea?: 'standard' | 'broader_40';

  // Formula (manual entry)
  od_sph?: string;
  od_cyl?: string;
  od_axis?: string;
  os_sph?: string;
  os_cyl?: string;
  os_axis?: string;
  pd?: string;

  // Image upload
  prescriptionImageUrl?: string;
  prescriptionImageFile?: File | null; // Client-side only
}

interface LensOption {
  id: string;
  option_type: 'without_rx_type' | 'lens_index' | 'view_area';
  option_value: string;
  display_name: string;
  description: string;
  price_modifier: number;
  is_active: boolean;
  display_order: number;
}

interface ProductDetailClientProps {
  product: Product;
  treatments: Treatment[];
  lensOptions: LensOption[]; // NEW - fetched from database
}
```

### 2. Cart Client

```typescript
// /zyro-app/app/cart/CartClient.tsx

interface CartTreatment {
  id: string;
  name: string;
  price: number;
}

interface PrescriptionDetails {
  prescriptionType: 'without_rx' | 'single_vision' | 'progressive';
  withoutRxType?: 'frame_only' | 'blue_block' | 'standard_eyeglasses';
  singleVisionType?: 'near' | 'intermediate' | 'distance';
  lensIndex?: '1.50' | '1.60' | '1.67' | '1.74';
  progressiveViewArea?: 'standard' | 'broader_40';
  od_sph?: string;
  od_cyl?: string;
  od_axis?: string;
  os_sph?: string;
  os_cyl?: string;
  os_axis?: string;
  pd?: string;
  prescriptionImageUrl?: string;
}

interface CartItem {
  productId: string;
  productName: string;
  productPrice: number;
  productImage: string | null;
  quantity: number;
  needsPrescription: boolean;
  prescriptionDetails?: PrescriptionDetails | null;
  selectedTreatments: CartTreatment[];
  addedAt: string;
}
```

### 3. Shared Types (New File)

```typescript
// /zyro-app/types/prescription.ts

export type PrescriptionType = 'without_rx' | 'single_vision' | 'progressive';
export type WithoutRxType = 'frame_only' | 'blue_block' | 'standard_eyeglasses';
export type SingleVisionType = 'near' | 'intermediate' | 'distance';
export type LensIndex = '1.50' | '1.60' | '1.67' | '1.74';
export type ProgressiveViewArea = 'standard' | 'broader_40';

export interface PrescriptionDetails {
  prescriptionType: PrescriptionType;
  withoutRxType?: WithoutRxType;
  singleVisionType?: SingleVisionType;
  lensIndex?: LensIndex;
  progressiveViewArea?: ProgressiveViewArea;
  od_sph?: string;
  od_cyl?: string;
  od_axis?: string;
  os_sph?: string;
  os_cyl?: string;
  os_axis?: string;
  pd?: string;
  prescriptionImageUrl?: string;
}

export interface LensOption {
  id: string;
  option_type: 'without_rx_type' | 'lens_index' | 'view_area';
  option_value: string;
  display_name: string;
  description: string;
  price_modifier: number;
  is_active: boolean;
  display_order: number;
}

// Validation helpers
export function isPrescriptionComplete(details: PrescriptionDetails): boolean {
  if (!details.prescriptionType) return false;

  if (details.prescriptionType === 'without_rx') {
    return !!details.withoutRxType;
  }

  if (details.prescriptionType === 'single_vision') {
    const hasSubType = !!details.singleVisionType;
    const hasFormula = !!(details.od_sph || details.os_sph || details.prescriptionImageUrl);
    const hasLensIndex = !!details.lensIndex;
    return hasSubType && hasFormula && hasLensIndex;
  }

  if (details.prescriptionType === 'progressive') {
    const hasFormula = !!(details.od_sph || details.os_sph || details.prescriptionImageUrl);
    const hasLensIndex = !!details.lensIndex;
    const hasViewArea = !!details.progressiveViewArea;
    return hasFormula && hasLensIndex && hasViewArea;
  }

  return false;
}

export function getPrescriptionTypeLabel(type: PrescriptionType): string {
  const labels: Record<PrescriptionType, string> = {
    without_rx: 'Without Prescription',
    single_vision: 'Single Vision',
    progressive: 'Progressive',
  };
  return labels[type] || type;
}

export function getLensOptionPrice(
  lensOptions: LensOption[],
  optionType: string,
  optionValue: string
): number {
  const option = lensOptions.find(
    (o) => o.option_type === optionType && o.option_value === optionValue
  );
  return option?.price_modifier || 0;
}
```

---

## UI/UX Considerations

### 1. Progressive Disclosure

Use **collapsible sections** to avoid overwhelming users:

```
[✓ Step 1: Prescription Type] ← Completed, collapsed
    ↓
[► Step 2: Lens Configuration] ← Current, expanded
    ↓
[  Step 3: Treatments] ← Upcoming, collapsed
```

### 2. Visual Indicators

- ✅ Green checkmark for completed sections
- ⚠️ Warning icon for incomplete required fields
- 💰 Price changes highlighted as user makes selections
- 📷 Image thumbnail preview after upload

### 3. Help Text

Provide contextual help:
- "What's my prescription type?" - Tooltip with examples
- "What is lens index?" - Explanation of thickness and recommendations
- "How do I read my prescription?" - Link to help article

### 4. Mobile Optimization

- Stacked layout for prescription form (no side-by-side on mobile)
- Large touch targets for radio buttons
- Image upload uses native camera on mobile devices
- Sticky "Add to Cart" button at bottom

### 5. Error States

Clear validation messages:
- "Please select a prescription type to continue"
- "Prescription formula or image required for RX glasses"
- "Please select a lens index"
- "File too large. Maximum size is 5MB"

### 6. Loading States

- Show spinner during image upload
- Disable "Add to Cart" during upload
- Show progress indicator for large files

---

## Implementation Checklist

### Phase 1: Database Setup (2-3 hours)

- [ ] Create migration file with all SQL
- [ ] Apply migration to development database
- [ ] Verify enums created correctly
- [ ] Verify constraints working
- [ ] Seed `lens_options` table with initial data
- [ ] Test constraint validation (should fail on invalid data)
- [ ] Set up Supabase Storage bucket `prescription-images`
- [ ] Apply RLS policies to storage bucket
- [ ] Test image upload/download with authenticated user
- [ ] Document database changes in DATABASE-SCHEMA.md

**Dependencies**: None
**Blocks**: Phase 2, Phase 3

---

### Phase 2: TypeScript Types & Utilities (1 hour)

- [ ] Create `/zyro-app/types/prescription.ts`
- [ ] Define all type aliases
- [ ] Define PrescriptionDetails interface
- [ ] Define LensOption interface
- [ ] Create validation helper functions
- [ ] Create label/display helper functions
- [ ] Create price calculation helpers
- [ ] Add JSDoc comments for all exports
- [ ] Test type imports in other files

**Dependencies**: Phase 1 (database schema informs types)
**Blocks**: Phase 3, Phase 4

---

### Phase 3: Product Detail Page Refactor (4-5 hours)

- [ ] Import new types from `/types/prescription.ts`
- [ ] Fetch `lens_options` from database in page.tsx
- [ ] Pass `lensOptions` prop to ProductDetailClient
- [ ] Add state variables for all new prescription fields
- [ ] Create prescription type selector UI
- [ ] Create "Without RX" sub-options UI
- [ ] Create "Single Vision" sub-options UI
- [ ] Create "Progressive" info display
- [ ] Create prescription formula input section (existing, may need tweaks)
- [ ] Create lens index selector UI
- [ ] Create progressive view area selector UI
- [ ] Create image upload section with preview
- [ ] Implement image upload function
- [ ] Update price calculation logic
- [ ] Implement conditional rendering based on prescription type
- [ ] Implement validation logic
- [ ] Disable "Add to Cart" until valid
- [ ] Update `handleAddToCart` to include all new fields
- [ ] Test all prescription type paths
- [ ] Test image upload
- [ ] Test price calculations
- [ ] Test validation error states
- [ ] Mobile responsive testing

**Dependencies**: Phase 1, Phase 2
**Blocks**: Phase 4

---

### Phase 4: Cart Page Updates (2 hours)

- [ ] Update CartItem interface with new prescription fields
- [ ] Update prescription display section
- [ ] Add prescription type badge
- [ ] Display without_rx_type details
- [ ] Display single_vision_type details
- [ ] Display lens index
- [ ] Display progressive view area
- [ ] Display prescription image thumbnail with modal
- [ ] Update price display to include lens options
- [ ] Test display for all prescription type combinations
- [ ] Test price calculations
- [ ] Test prescription image viewing
- [ ] Mobile responsive testing

**Dependencies**: Phase 2, Phase 3
**Blocks**: Phase 5

---

### Phase 5: Checkout Integration (2-3 hours)

- [ ] Create checkout page if not exists
- [ ] Display full order summary with prescription details
- [ ] Implement "Edit Prescription" functionality
- [ ] Re-validate prescription before order submission
- [ ] On order creation, copy prescription data to `order_item_prescriptions`
- [ ] Ensure prescription images accessible for fulfillment team
- [ ] Test full checkout flow
- [ ] Test prescription editing at checkout
- [ ] Test order creation with all prescription types

**Dependencies**: Phase 3, Phase 4
**Blocks**: Phase 6 (testing)

---

### Phase 6: Documentation Updates (1-2 hours)

- [ ] Update `/docs/PRD.md` with enhanced prescription requirements
- [ ] Update `/docs/MOSCOW-PRIORITIZATION.md`
- [ ] Create new wireframe `/docs/wireframes/customer/07-product-detail-prescription-flow.txt`
- [ ] Update `/docs/wireframes/customer/10-checkout-page.txt`
- [ ] Update `/docs/progress/IMPLEMENTATION-PLAN.md` timeline
- [ ] Update `/docs/DATABASE-SCHEMA.md` with new tables and fields
- [ ] Create `/docs/SUPABASE-STORAGE.md` (if doesn't exist) or update
- [ ] Review all documentation for accuracy

**Dependencies**: Phase 1-5 complete
**Blocks**: None

---

### Phase 7: Testing & QA (2-3 hours)

- [ ] Test all prescription type flows end-to-end
- [ ] Test validation for all required fields
- [ ] Test image upload (success and error cases)
- [ ] Test price calculations for all combinations
- [ ] Test cart display for all prescription types
- [ ] Test checkout flow
- [ ] Test order creation
- [ ] Test mobile experience
- [ ] Test with slow network (image upload)
- [ ] Test with large files (should fail validation)
- [ ] Test accessibility (keyboard navigation, screen readers)
- [ ] Browser compatibility testing (Chrome, Firefox, Safari, Edge)
- [ ] Create test data for all scenarios
- [ ] Document test results

**Dependencies**: All phases complete
**Blocks**: Production deployment

---

## Testing Scenarios

### Scenario 1: Without RX - Frame Only

**Steps**:
1. Select product with prescription option
2. Check "Needs Prescription"
3. Select "Without RX"
4. Select "Frame Only"
5. Optionally select treatments
6. Add to cart

**Expected**:
- No prescription formula fields shown
- No lens index selection shown
- No image upload shown
- Price = base price + treatments
- Cart shows "Without RX - Frame Only"

---

### Scenario 2: Without RX - Blue Block

**Steps**:
1. Select product with prescription option
2. Check "Needs Prescription"
3. Select "Without RX"
4. Select "Blue Block"
5. Add to cart

**Expected**:
- Price = base price + $25.00
- Cart shows "Without RX - Blue Block"

---

### Scenario 3: Single Vision - Distance with Manual Entry

**Steps**:
1. Select product with prescription option
2. Check "Needs Prescription"
3. Select "Single Vision"
4. Select "Distance"
5. Enter OD: SPH -2.50, CYL -0.75, AXIS 90
6. Enter OS: SPH -2.25, CYL -0.50, AXIS 85
7. Enter PD: 63.0
8. Select "1.60 Thin" lens index
9. Select "Anti-Reflective" treatment
10. Add to cart

**Expected**:
- Add to cart enabled after all required fields filled
- Price = base + $50 (lens) + $30 (treatment) = base + $80
- Cart shows full prescription details
- Cart shows lens index "1.60 Thin"

---

### Scenario 4: Single Vision - Image Upload Only

**Steps**:
1. Select product with prescription option
2. Check "Needs Prescription"
3. Select "Single Vision"
4. Select "Near"
5. Upload prescription image (no manual entry)
6. Select "1.50 Standard" lens index
7. Add to cart

**Expected**:
- Add to cart enabled after image uploaded and lens selected
- Image thumbnail shown in product detail
- Price = base price
- Cart shows prescription image thumbnail
- Cart shows "Formula to be entered by optician"

---

### Scenario 5: Progressive with Full Configuration

**Steps**:
1. Select product with prescription option
2. Check "Needs Prescription"
3. Select "Progressive"
4. Enter full prescription formula
5. Upload prescription image (for verification)
6. Select "1.60 Thin" lens index
7. Select "40% Broader View Area"
8. Select "Photochromic" treatment
9. Add to cart

**Expected**:
- Price = base + $50 (lens) + $75 (view area) + $50 (treatment) = base + $175
- Cart shows "Progressive"
- Cart shows lens index "1.60 Thin"
- Cart shows "40% Broader View Area"
- Cart shows prescription formula
- Cart shows prescription image thumbnail

---

### Scenario 6: Validation - Incomplete RX

**Steps**:
1. Select "Single Vision"
2. Select "Distance"
3. Do NOT enter formula or upload image
4. Select lens index
5. Try to add to cart

**Expected**:
- "Add to Cart" button disabled
- Error message: "Please enter prescription formula or upload image"
- Cannot proceed until requirement met

---

### Scenario 7: Image Upload Error Handling

**Steps**:
1. Select "Single Vision"
2. Try to upload 10MB file

**Expected**:
- Upload fails
- Error message: "File too large. Maximum size is 5MB"
- User can try again with smaller file

---

### Scenario 8: Checkout Review & Edit

**Steps**:
1. Add item with Single Vision prescription
2. Go to checkout
3. Click "Edit Prescription" on cart item
4. Modify prescription details
5. Save changes
6. Complete checkout

**Expected**:
- Prescription editable from checkout
- Changes reflected in order summary
- Updated prescription saved to order

---

### Scenario 9: Mobile Image Upload

**Steps**:
1. On mobile device, select Single Vision
2. Click "Upload Image"
3. Select "Take Photo"
4. Take photo of prescription
5. Photo uploaded successfully

**Expected**:
- Native camera opens
- Photo captured and uploaded
- Thumbnail preview shown
- Can proceed to add to cart

---

### Scenario 10: Multiple Items with Different Prescriptions

**Steps**:
1. Add Product A with "Without RX - Frame Only"
2. Add Product B with "Single Vision - Distance"
3. Add Product C with "Progressive"
4. Go to cart

**Expected**:
- All three items shown with distinct prescription details
- Prices calculated correctly for each
- Total includes all lens options and treatments

---

## Future Enhancements

### Post-MVP Features

1. **Advanced Lens Options**:
   - 1.67 Ultra-Thin lens index
   - 1.74 Premium Thin lens index
   - Trivex impact-resistant material
   - Polycarbonate for sports

2. **OCR Integration**:
   - Automatic prescription extraction from uploaded image
   - Pre-fill formula fields with extracted data
   - User confirmation/correction step
   - Integration: Google Cloud Vision API or Tesseract.js

3. **Saved Prescriptions**:
   - User profile stores multiple prescriptions
   - Quick-select from saved prescriptions
   - Label prescriptions ("Driving", "Reading", "Computer")
   - Prescription expiration tracking (typically 1-2 years)

4. **Prescription Verification**:
   - Admin dashboard for opticians
   - Review uploaded images
   - Verify entered formulas
   - Approve/reject before order processing
   - Contact customer for clarification if needed

5. **Virtual Try-On with RX Preview**:
   - Show lens thickness based on prescription and index
   - Visual representation of lens tint/treatments
   - Progressive corridor visualization

6. **Prescription History**:
   - View past prescriptions from completed orders
   - Track prescription changes over time
   - Reorder with same prescription (one-click)
   - Prescription comparison tool

7. **Advanced Validation**:
   - Real-time validation of prescription value ranges
   - Warning for unusual prescriptions (very strong, axis without cylinder)
   - Recommendation engine (e.g., "Consider 1.67 index for your prescription")

8. **Insurance Integration**:
   - Upload insurance card
   - Check coverage for prescription lenses
   - Apply insurance discount at checkout
   - Submit claim automatically

---

## Summary & Next Steps

### What We're Building

A comprehensive prescription configuration system that:
- ✅ Guides users through complex lens options
- ✅ Captures prescription data with multiple input methods (manual + image)
- ✅ Validates requirements before checkout
- ✅ Supports clinical workflow for opticians
- ✅ Scales to support future lens options

### Key Technical Decisions

1. **Database**: Enums for type safety + `lens_options` table for flexible pricing
2. **Storage**: Supabase Storage with RLS for prescription images
3. **UI Pattern**: Progressive disclosure with collapsible sections
4. **Validation**: Client-side + database constraints
5. **Types**: Shared TypeScript types for consistency

### Implementation Timeline

| Phase | Tasks | Hours | Status |
|-------|-------|-------|--------|
| 1. Database Setup | Migration, storage, RLS | 2-3 | 🔴 Not Started |
| 2. TypeScript Types | Interfaces, helpers | 1 | 🔴 Not Started |
| 3. Product Detail | UI refactor, upload | 4-5 | 🔴 Not Started |
| 4. Cart Updates | Display enhancements | 2 | 🔴 Not Started |
| 5. Checkout | Integration, validation | 2-3 | 🔴 Not Started |
| 6. Documentation | PRD, MOSCOW, wireframes | 1-2 | 🟡 In Progress (this doc) |
| 7. Testing & QA | All scenarios | 2-3 | 🔴 Not Started |
| **TOTAL** | | **14-19 hours** | 🟡 **5% Complete** |

### Success Criteria

✅ All prescription types configurable
✅ Image upload working with proper security
✅ Prices calculated correctly for all combinations
✅ Validation prevents invalid orders
✅ Cart displays complete prescription details
✅ Mobile experience excellent
✅ All documentation updated
✅ 80%+ prescription completeness at add-to-cart

---

**Document Status**: ✅ COMPLETE - Ready for Implementation
**Next Action**: Begin Phase 1 - Database Setup
**Approved By**: [Pending User Approval]
**Created By**: Claude Code
**Date**: November 6, 2025
