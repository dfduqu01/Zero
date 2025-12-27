// TypeScript interfaces for dubros.com ERP API
// Based on ERP-INTEGRATION.md specification

// ============================================================================
// dubros.com API Response Types
// ============================================================================

export interface DubrosApiResponse<T> {
  response: {
    cursor: number;
    results: T[];
    remaining?: number;
    count?: number;
  };
}

// ============================================================================
// dubros.com Product Entity (Producto-lean-mirror)
// ============================================================================

export interface DubrosProduct {
  _id: string; // Unique product ID in dubros
  Referencia: string; // SKU
  Descripcion: string; // Product name/description
  Price?: number; // Price in USD (requires authentication)
  Cantidad: number; // Stock quantity

  // Foreign key references (IDs)
  Categoria_Parent: string | null; // Category ID
  Brand_Parent: string | null; // Brand ID
  Material_Parent: string | null; // Material ID
  Genero_Parent: string | null; // Gender ID

  // Text fields (not reliable - use _Parent IDs instead)
  Categoria_Text?: string;
  Brand_text?: string;
  Material_Text?: string;

  // Optional fields
  Talla_ocular?: number | null; // Lens width
  Tipo_Venta_Parent?: string | null; // Sale type (check for "DOCENA" for dozen pricing)
  Tipo_Venta_Text?: string | null; // Sale type text (check for "DOCENA" for dozen pricing)
  Flex_Parent?: string | null; // Flex (B2B only - ignore)

  // Images
  Imagen_Low_Res?: string | null; // Low-res image URL (protocol-less)
  Image_high_Res?: string | null; // High-res image URL (ignore - construct from SKU)

  // Metadata
  Slug?: string | null;
  promo?: string | null;
  Created_Date?: string;
  Modified_Date?: string;
  Last_Updated?: string;
}

// ============================================================================
// dubros.com Lookup Entities
// ============================================================================

export interface DubrosCategory {
  _id: string;
  Nombre: string; // Category name in Spanish
  Created_Date?: string;
  Modified_Date?: string;
}

export interface DubrosBrand {
  _id: string;
  Name: string; // Brand name (NOTE: uses 'Name', not 'Nombre')
  Logo?: string | null; // Logo URL (protocol-less)
  active?: boolean;
  Created_Date?: string;
  Modified_Date?: string;
}

export interface DubrosMaterial {
  _id: string;
  Nombre: string; // Material name in Spanish
  Created_Date?: string;
  Modified_Date?: string;
}

// ============================================================================
// ZERO Database Types (for mapping)
// ============================================================================

export interface ZeroProduct {
  id?: string; // UUID (auto-generated if new)
  sku: string; // Required - from Referencia
  name: string; // Required - from Descripcion
  description: string; // Required - from Descripcion
  price: number; // Required - from Price
  stock_quantity: number; // Required - from Cantidad

  // Foreign keys (resolved from dubros IDs)
  brand_id: string; // Required - resolved from Brand_Parent
  category_id?: string | null; // Optional - resolved from Categoria_Parent
  frame_material_id?: string | null; // Optional - resolved from Material_Parent
  frame_shape_id?: string | null; // Always null (not in dubros)

  // Optional fields
  lens_width?: number | null; // From Talla_ocular
  bridge_width?: number | null; // Always null (not in dubros)
  temple_length?: number | null; // Always null (not in dubros)
  gender?: 'Male' | 'Female' | 'Unisex' | null; // From Genero_Parent

  // Pricing fields (B2C pricing with shipping)
  cost_dubros?: number | null; // Wholesale cost per unit from dubros
  cost_shipping?: number | null; // Flat shipping cost per product (DHL)
  cost_total?: number | null; // Total cost: cost_dubros + cost_shipping
  pricing_tier_id?: string | null; // FK to pricing_tiers
  markup_multiplier?: number | null; // Markup from tier (stored for audit)
  profit_amount?: number | null; // Profit: price - cost_total
  profit_margin_percent?: number | null; // Margin: (profit / cost_total) × 100
  is_price_override?: boolean; // True if admin set custom price
  is_sold_by_dozen?: boolean; // True if dubros sells by dozen
  price_calculated_at?: string | null; // When price was last calculated

  // ERP tracking fields
  erp_id: string; // From _id
  erp_last_synced_at: string; // Current timestamp
  erp_data: Record<string, unknown>; // Full dubros JSON
  sync_status: 'pending' | 'synced' | 'error' | 'manual';

  // Defaults
  low_stock_threshold: number; // Default: 5
  is_active: boolean; // Default: true

  // Timestamps (auto-managed by Supabase)
  created_at?: string;
  updated_at?: string;
}

export interface ZeroProductImage {
  id?: string; // UUID
  product_id: string; // Foreign key to products
  image_url: string; // Low-res image URL (with https:)
  image_url_high?: string | null; // High-res image URL (constructed)
  cloudfront_url?: string | null; // CloudFront CDN URL for high-res
  is_primary: boolean; // First image = primary
  display_order: number; // Default: 0
  created_at?: string;
}

export interface ZeroCategory {
  id?: string; // UUID
  name: string; // From Nombre
  slug: string; // Generated from name
  erp_id?: string | null; // From _id
  description?: string | null;
  display_order?: number;
  created_at?: string;
}

export interface ZeroBrand {
  id?: string; // UUID
  name: string; // From Name
  slug: string; // Generated from name
  logo_url?: string | null; // From Logo (with https:)
  erp_id?: string | null; // From _id
  created_at?: string;
}

export interface ZeroMaterial {
  id?: string; // UUID
  name: string; // From Nombre
  erp_id?: string | null; // From _id
  created_at?: string;
}

// ============================================================================
// Sync Types
// ============================================================================

export interface SyncLog {
  id?: string; // UUID
  sync_type: 'scheduled' | 'manual';
  status: 'running' | 'success' | 'partial' | 'failed';
  started_at: string;
  completed_at?: string | null;
  duration_seconds?: number | null;
  total_records_fetched: number;
  records_processed: number;
  records_updated: number;
  records_skipped: number;
  error_count: number;
  created_at?: string;
}

export interface SyncError {
  id?: string; // UUID
  sync_log_id: string; // Foreign key
  product_sku?: string | null;
  error_message: string;
  error_details: {
    reason: 'missing_required_field' | 'validation_error' | 'lookup_failed' | 'network_error' | 'other';
    missing_fields?: string[];
    validation_errors?: string[];
    dubros_raw_data?: DubrosProduct;
    [key: string]: unknown;
  };
  created_at?: string;
}

export interface InventoryMovement {
  id?: string; // UUID
  product_id: string;
  movement_type: 'erp_sync' | 'order' | 'manual_adjustment' | 'return';
  quantity_change: number;
  quantity_after: number;
  reference_id?: string | null; // sync_log_id or order_id
  reason?: string | null;
  created_by_user_id?: string | null;
  created_at?: string;
}

// ============================================================================
// Mapping & Validation Types
// ============================================================================

export interface LookupMaps {
  categories: Map<string, string>; // dubros_id -> zero_id
  brands: Map<string, string>; // dubros_id -> zero_id
  materials: Map<string, string>; // dubros_id -> zero_id
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  missingFields: string[];
}

export interface SyncResult {
  success: boolean;
  syncLogId: string;
  stats: {
    fetched: number;
    processed: number;
    created: number;
    updated: number;
    skipped: number;
    errors: number;
  };
  duration: number; // seconds
  errors: SyncError[];
}

// ============================================================================
// API Client Configuration
// ============================================================================

export interface DubrosApiConfig {
  baseUrl: string; // 'https://dubros.com' or 'https://dubros.com/version-test'
  bearerToken?: string; // Required for Price field
  timeout?: number; // Request timeout in ms (default: 30000)
}

export interface FetchOptions {
  constraints?: Array<{
    key: string;
    constraint_type:
      | 'equals'
      | 'not equal'
      | 'greater than'
      | 'less than'
      | 'is_empty'
      | 'is_not_empty'
      | 'text contains'
      | 'not text contains'
      | 'in'
      | 'not in'
      | 'contains'
      | 'not contains'
      | 'empty'
      | 'not empty'
      | 'geographic_search';
    value: string | number | boolean | string[] | number[]; // Support arrays for 'in' constraint
  }>;
  cursor?: number;
  limit?: number;
  maxRecords?: number; // Stop fetching after this many total records
}
