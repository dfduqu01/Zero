// Product-related TypeScript types and interfaces

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface FrameMaterial {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface FrameShape {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  display_order: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  price: number;
  brand_id: string;
  category_id: string | null;
  frame_material_id: string | null;
  frame_shape_id: string | null;
  lens_width: number | null;
  bridge_width: number | null;
  temple_length: number | null;
  stock_quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductWithRelations extends Product {
  brand?: Brand;
  category?: Category;
  frame_material?: FrameMaterial;
  frame_shape?: FrameShape;
  product_images?: ProductImage[];
}

export interface ProductFormData {
  sku: string;
  name: string;
  description: string;
  price: string;
  brand_id: string;
  category_id: string;
  frame_material_id: string;
  frame_shape_id: string;
  lens_width: string;
  bridge_width: string;
  temple_length: string;
  stock_quantity: string;
  low_stock_threshold: string;
  is_active: boolean;
}

export interface ProductImageUpload {
  file: File;
  preview: string;
  alt_text?: string;
}
