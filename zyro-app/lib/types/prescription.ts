/**
 * Prescription Types - NEW TABLE STRUCTURE
 * Date: 2025-11-07
 * Based on 4 separate admin-editable tables
 */

// ============================================================================
// DATABASE TABLE TYPES
// ============================================================================

/**
 * Prescription Types Table
 * Admin-editable prescription types (Single Vision, Progressive, Non-Prescription)
 */
export interface PrescriptionType {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Lens Types Table
 * Replaces lens_treatments - Used for both Frame Only and Prescription flows
 * Examples: Frame Only, Blue Light Block, Standard Clear, Photochromatic, etc.
 */
export interface LensType {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_modifier: number;
  is_active: boolean;
  display_order: number;
  applies_to_without_rx: boolean; // Can be used in Frame Only flow
  applies_to_with_rx: boolean;    // DEPRECATED - Use specific flags below
  applies_to_single_vision: boolean; // Can be used for Single Vision prescriptions
  applies_to_progressive: boolean;   // Can be used for Progressive prescriptions
  created_at: string;
  updated_at: string;
}

/**
 * Lens Indexes Table
 * Admin-editable lens thickness options (1.50, 1.60, 1.67, 1.74)
 */
export interface LensIndex {
  id: string;
  name: string;
  slug: string;
  index_value: string; // '1.50', '1.60', '1.67', '1.74'
  description: string | null;
  price_modifier: number;
  is_active: boolean;
  display_order: number;
  applies_to_single_vision: boolean; // Can be used for Single Vision prescriptions
  applies_to_progressive: boolean;   // Can be used for Progressive prescriptions
  created_at: string;
  updated_at: string;
}

/**
 * View Areas Table
 * Admin-editable progressive lens view areas
 */
export interface ViewArea {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_modifier: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// PRESCRIPTION FORMULA
// ============================================================================

export interface PrescriptionFormula {
  // Right Eye (OD - Oculus Dexter)
  od_sph?: number; // Sphere: -20.00 to +20.00
  od_cyl?: number; // Cylinder: -4.00 to +4.00
  od_axis?: number; // Axis: 0-180

  // Left Eye (OS - Oculus Sinister)
  os_sph?: number;
  os_cyl?: number;
  os_axis?: number;

  // Pupillary Distance
  pd?: number; // Single PD: 20.0-80.0
  pd_dual_od?: number; // Dual PD right eye
  pd_dual_os?: number; // Dual PD left eye

  // Additional
  add_value?: number; // For progressive lenses
}

// ============================================================================
// PRESCRIPTION DATA (for cart and orders)
// ============================================================================

/**
 * Complete prescription data with references to admin-editable tables
 */
export interface PrescriptionData {
  // References to admin tables
  prescription_type_id: string | null;
  lens_type_id: string | null;
  lens_index_id: string | null;
  view_area_id: string | null;

  // Optional formula (if not using image upload)
  formula?: PrescriptionFormula;

  // Image upload
  prescription_image_url?: string;
  prescription_image_file?: File; // For client-side upload
  prescription_image_uploaded_at?: string;

  // Legacy fields (keep for backward compatibility)
  has_prescription?: boolean;
}

/**
 * Complete prescription data with full object references (for display)
 */
export interface PrescriptionDataWithRefs extends PrescriptionData {
  prescription_type?: PrescriptionType;
  lens_type?: LensType;
  lens_index?: LensIndex;
  view_area?: ViewArea;
}

// ============================================================================
// CART ITEM PRESCRIPTION (Database Schema)
// ============================================================================

export interface CartItemPrescription extends PrescriptionData {
  id: string;
  cart_item_id: string;
  created_at: string;

  // Flatten formula fields for database compatibility
  od_sph?: number;
  od_cyl?: number;
  od_axis?: number;
  os_sph?: number;
  os_cyl?: number;
  os_axis?: number;
  pd?: number;
  pd_dual_od?: number;
  pd_dual_os?: number;
  add_value?: number;
}

// ============================================================================
// ORDER ITEM PRESCRIPTION (Database Schema)
// ============================================================================

export interface OrderItemPrescription extends CartItemPrescription {
  order_item_id: string;
  validation_status: 'pending' | 'approved' | 'rejected';
  validated_by_user_id?: string;
  validated_at?: string;
  validation_notes?: string;
}

// ============================================================================
// PRICING CALCULATION
// ============================================================================

export interface PrescriptionPricing {
  base_price: number;           // Product price
  lens_type_cost: number;        // Cost for lens type
  lens_index_cost: number;       // Cost for lens index
  view_area_cost: number;        // Cost for progressive view area
  treatments_cost: number;       // Cost for additional treatments (deprecated)
  subtotal: number;              // Total before additional treatments
  total: number;                 // Grand total
}

// ============================================================================
// VALIDATION
// ============================================================================

export interface PrescriptionValidationError {
  field: string;
  message: string;
}

export interface PrescriptionValidationResult {
  isValid: boolean;
  errors: PrescriptionValidationError[];
}

// ============================================================================
// LOCALSTORAGE CART ITEM
// ============================================================================

export interface LocalStorageCartItem {
  id: string; // Temporary UUID
  productId: string;
  productName: string;
  productPrice: number;
  productImage: string | null;
  quantity: number;
  prescription?: PrescriptionData;
  prescriptionCosts?: {
    lensTypeCost: number;
    lensIndexCost: number;
    viewAreaCost: number;
  };
  addedAt: string;
}

// ============================================================================
// UI FLOW STATE
// ============================================================================

/**
 * Flow state for the prescription form
 * Based on Prescription-flow.md
 */
export interface PrescriptionFlowState {
  // Step 1: Frame Only or Add Prescription Lenses
  flow: 'frame_only' | 'add_prescription' | null;

  // If frame_only: select lens type (applies_to_without_rx = true)
  lens_type_id_frame_only?: string;

  // If add_prescription:
  prescription_type_id?: string; // Single Vision, Progressive, or Non-Prescription

  // If Single Vision or Progressive:
  lens_type_id?: string;     // Lens type (applies_to_with_rx = true)
  lens_index_id?: string;    // Required for RX types

  // If Progressive only:
  view_area_id?: string;     // Required for progressive

  // Formula or image (for RX types)
  formula?: PrescriptionFormula;
  image_file?: File;
  image_preview?: string;
}

// ============================================================================
// GROUPED DATA FOR DISPLAY
// ============================================================================

/**
 * Lens types grouped by usage
 */
export interface GroupedLensTypes {
  frame_only: LensType[];    // applies_to_without_rx = true
  prescription: LensType[];  // applies_to_with_rx = true
}
