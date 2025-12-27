// Product Mapper - Transform dubros.com data to ZERO schema
// Handles validation, field mapping, foreign key resolution, and pricing

import type {
  DubrosProduct,
  DubrosCategory,
  DubrosBrand,
  DubrosMaterial,
  ZeroProduct,
  ZeroProductImage,
  ZeroCategory,
  ZeroBrand,
  ZeroMaterial,
  LookupMaps,
  ValidationResult,
} from './types';
import { PricingService } from '../services/pricing-service';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate URL-friendly slug from text
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Remove consecutive hyphens
}

/**
 * Add https: protocol to protocol-less URLs
 */
export function addProtocol(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('//')) return `https:${url}`;
  return url;
}

/**
 * Construct high-res image URL from SKU
 */
export function constructHighResImageUrl(sku: string): string {
  return `https://dubros-image-repository.s3.us-east-1.amazonaws.com/${sku}.jpg`;
}

/**
 * Construct CloudFront CDN URL from SKU
 */
export function constructCloudfrontUrl(sku: string): string {
  return `https://dhbamyabyqtec.cloudfront.net/${sku}.jpg`;
}

/**
 * Check if product is sold by dozen
 */
export function isSoldByDozen(dubrosProduct: DubrosProduct): boolean {
  const tipoVenta = dubrosProduct.Tipo_Venta_Parent || dubrosProduct.Tipo_Venta_Text || '';
  return tipoVenta.toUpperCase().includes('DOCENA') ||
         tipoVenta.toUpperCase() === 'DOZEN';
}

/**
 * Calculate per-unit dubros cost (handles dozen products)
 */
export function calculatePerUnitCost(dubrosProduct: DubrosProduct): number {
  // Dubros.com always provides per-unit price regardless of Tipo_Venta_Parent
  // No calculation needed - use the price as-is
  return dubrosProduct.Price || 0;
}

/**
 * Map dubros gender to ZERO gender enum
 */
export function mapGender(generoParent: string | null): 'Male' | 'Female' | 'Unisex' | null {
  if (!generoParent) return null;

  // TODO: Map actual dubros gender IDs when we get the lookup table
  // For now, return null
  return null;
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate dubros product has all required fields
 */
export function validateDubrosProduct(product: DubrosProduct): ValidationResult {
  const errors: string[] = [];
  const missingFields: string[] = [];

  // Check required fields
  if (!product.Referencia) {
    errors.push('Missing required field: Referencia (SKU)');
    missingFields.push('Referencia');
  }

  if (!product.Descripcion) {
    errors.push('Missing required field: Descripcion (Name)');
    missingFields.push('Descripcion');
  }

  if (product.Price === undefined || product.Price === null) {
    errors.push('Missing required field: Price');
    missingFields.push('Price');
  }

  if (!product.Categoria_Parent) {
    errors.push('Missing required field: Categoria_Parent (Category)');
    missingFields.push('Categoria_Parent');
  }

  if (!product.Brand_Parent) {
    errors.push('Missing required field: Brand_Parent (Brand)');
    missingFields.push('Brand_Parent');
  }

  // Validate Price is a valid number
  if (product.Price !== undefined && product.Price !== null) {
    if (typeof product.Price !== 'number' || product.Price < 0) {
      errors.push(`Invalid price: ${product.Price}`);
    }
  }

  // Validate Cantidad is a valid number
  if (product.Cantidad !== undefined && product.Cantidad !== null) {
    if (typeof product.Cantidad !== 'number' || product.Cantidad < 0) {
      errors.push(`Invalid quantity: ${product.Cantidad}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    missingFields,
  };
}

// ============================================================================
// Lookup Mappers
// ============================================================================

/**
 * Map dubros category to ZERO category
 */
export function mapCategory(dubrosCategory: DubrosCategory): ZeroCategory {
  return {
    name: dubrosCategory.Nombre,
    slug: slugify(dubrosCategory.Nombre),
    erp_id: dubrosCategory._id,
    display_order: 0,
  };
}

/**
 * Map dubros brand to ZERO brand
 */
export function mapBrand(dubrosBrand: DubrosBrand): ZeroBrand {
  return {
    name: dubrosBrand.Name, // NOTE: Brands use 'Name', not 'Nombre'
    slug: slugify(dubrosBrand.Name),
    logo_url: addProtocol(dubrosBrand.Logo),
    erp_id: dubrosBrand._id,
  };
}

/**
 * Map dubros material to ZERO material
 */
export function mapMaterial(dubrosMaterial: DubrosMaterial): ZeroMaterial {
  return {
    name: dubrosMaterial.Nombre,
    erp_id: dubrosMaterial._id,
  };
}

// ============================================================================
// Product Mapper
// ============================================================================

/**
 * Map dubros product to ZERO product
 * Requires lookup maps to resolve foreign key IDs and pricing service for price calculation
 */
export function mapProduct(
  dubrosProduct: DubrosProduct,
  lookupMaps: LookupMaps,
  pricingService?: PricingService,
  shippingCost: number = 25
): ZeroProduct | null {
  // Validate product first
  const validation = validateDubrosProduct(dubrosProduct);
  if (!validation.isValid) {
    return null;
  }

  // Resolve foreign key IDs
  const categoryId = dubrosProduct.Categoria_Parent
    ? lookupMaps.categories.get(dubrosProduct.Categoria_Parent)
    : null;

  const brandId = dubrosProduct.Brand_Parent
    ? lookupMaps.brands.get(dubrosProduct.Brand_Parent)
    : null;

  const materialId = dubrosProduct.Material_Parent
    ? lookupMaps.materials.get(dubrosProduct.Material_Parent)
    : null;

  // If required lookups fail, return null
  if (!categoryId) {
    console.error(`Failed to resolve category: ${dubrosProduct.Categoria_Parent}`);
    return null;
  }

  if (!brandId) {
    console.error(`Failed to resolve brand: ${dubrosProduct.Brand_Parent}`);
    return null;
  }

  // Calculate pricing (if pricing service provided)
  const dubrosCost = calculatePerUnitCost(dubrosProduct);
  const isByDozen = isSoldByDozen(dubrosProduct);
  const pricing = pricingService ? pricingService.calculatePrice(dubrosCost, shippingCost) : null;

  // Map product fields
  const zeroProduct: ZeroProduct = {
    sku: dubrosProduct.Referencia,
    name: dubrosProduct.Descripcion,
    description: dubrosProduct.Descripcion,
    price: pricing ? pricing.price : dubrosProduct.Price!, // Use calculated price if available
    stock_quantity: dubrosProduct.Cantidad || 0,

    // Foreign keys
    brand_id: brandId,
    category_id: categoryId,
    frame_material_id: materialId || null,
    frame_shape_id: null, // Not available in dubros

    // Optional fields
    lens_width: dubrosProduct.Talla_ocular || null,
    bridge_width: null, // Not available in dubros
    temple_length: null, // Not available in dubros
    gender: mapGender(dubrosProduct.Genero_Parent),

    // Pricing fields (if calculated)
    cost_dubros: pricing ? pricing.cost_dubros : null,
    cost_shipping: pricing ? pricing.cost_shipping : null,
    cost_total: pricing ? pricing.cost_total : null,
    pricing_tier_id: pricing ? pricing.pricing_tier_id : null,
    markup_multiplier: pricing ? pricing.markup_multiplier : null,
    profit_amount: pricing ? pricing.profit_amount : null,
    profit_margin_percent: pricing ? pricing.profit_margin_percent : null,
    is_price_override: false, // Default false for new products
    is_sold_by_dozen: isByDozen,
    price_calculated_at: pricing ? new Date().toISOString() : null,

    // ERP tracking
    erp_id: dubrosProduct._id,
    erp_last_synced_at: new Date().toISOString(),
    erp_data: dubrosProduct as unknown as Record<string, unknown>,
    sync_status: 'synced',

    // Defaults
    low_stock_threshold: 5,
    is_active: true,
  };

  return zeroProduct;
}

/**
 * Map dubros product image to ZERO product image
 */
export function mapProductImage(
  dubrosProduct: DubrosProduct,
  productId: string
): ZeroProductImage | null {
  // If no low-res image, return null
  if (!dubrosProduct.Imagen_Low_Res) {
    return null;
  }

  const lowResUrl = addProtocol(dubrosProduct.Imagen_Low_Res);
  const highResUrl = constructHighResImageUrl(dubrosProduct.Referencia);
  const cloudfrontUrl = constructCloudfrontUrl(dubrosProduct.Referencia);

  if (!lowResUrl) {
    return null;
  }

  return {
    product_id: productId,
    image_url: lowResUrl,
    image_url_high: highResUrl,
    cloudfront_url: cloudfrontUrl,
    is_primary: true,
    display_order: 0,
  };
}

// ============================================================================
// Bulk Mapping Functions
// ============================================================================

/**
 * Map array of dubros categories to ZERO categories
 */
export function mapCategories(dubrosCategories: DubrosCategory[]): ZeroCategory[] {
  return dubrosCategories.map(mapCategory);
}

/**
 * Map array of dubros brands to ZERO brands
 */
export function mapBrands(dubrosBrands: DubrosBrand[]): ZeroBrand[] {
  return dubrosBrands.map(mapBrand);
}

/**
 * Map array of dubros materials to ZERO materials
 */
export function mapMaterials(dubrosMaterials: DubrosMaterial[]): ZeroMaterial[] {
  return dubrosMaterials.map(mapMaterial);
}

/**
 * Map array of dubros products to ZERO products
 * Returns both successful mappings and errors
 */
export function mapProducts(
  dubrosProducts: DubrosProduct[],
  lookupMaps: LookupMaps,
  pricingService?: PricingService,
  shippingCost: number = 25
): {
  products: ZeroProduct[];
  errors: Array<{ product: DubrosProduct; validation: ValidationResult }>;
} {
  const products: ZeroProduct[] = [];
  const errors: Array<{ product: DubrosProduct; validation: ValidationResult }> = [];

  for (const dubrosProduct of dubrosProducts) {
    // Validate first
    const validation = validateDubrosProduct(dubrosProduct);
    if (!validation.isValid) {
      errors.push({ product: dubrosProduct, validation });
      continue;
    }

    // Map product (with pricing)
    const zeroProduct = mapProduct(dubrosProduct, lookupMaps, pricingService, shippingCost);
    if (zeroProduct) {
      products.push(zeroProduct);
    } else {
      errors.push({
        product: dubrosProduct,
        validation: {
          isValid: false,
          errors: ['Failed to map product - foreign key resolution failed'],
          missingFields: [],
        },
      });
    }
  }

  return { products, errors };
}
