// Product utility functions

import { ProductFormData } from '../types/product';

/**
 * Validate product form data
 */
export function validateProductForm(data: ProductFormData): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  // Required fields
  if (!data.sku.trim()) {
    errors.sku = 'SKU is required';
  } else if (!/^[A-Z0-9-]+$/.test(data.sku)) {
    errors.sku = 'SKU must contain only uppercase letters, numbers, and hyphens';
  }

  if (!data.name.trim()) {
    errors.name = 'Product name is required';
  }

  if (!data.price.trim()) {
    errors.price = 'Price is required';
  } else {
    const price = parseFloat(data.price);
    if (isNaN(price) || price < 0) {
      errors.price = 'Price must be a positive number';
    }
  }

  if (!data.brand_id) {
    errors.brand_id = 'Brand is required';
  }

  // Optional numeric fields validation
  if (data.lens_width && !/^\d+$/.test(data.lens_width)) {
    errors.lens_width = 'Lens width must be a number';
  }

  if (data.bridge_width && !/^\d+$/.test(data.bridge_width)) {
    errors.bridge_width = 'Bridge width must be a number';
  }

  if (data.temple_length && !/^\d+$/.test(data.temple_length)) {
    errors.temple_length = 'Temple length must be a number';
  }

  if (data.stock_quantity && !/^\d+$/.test(data.stock_quantity)) {
    errors.stock_quantity = 'Stock quantity must be a number';
  } else {
    const stock = parseInt(data.stock_quantity);
    if (stock < 0) {
      errors.stock_quantity = 'Stock quantity cannot be negative';
    }
  }

  if (data.low_stock_threshold && !/^\d+$/.test(data.low_stock_threshold)) {
    errors.low_stock_threshold = 'Low stock threshold must be a number';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Format product form data for database insertion
 */
export function formatProductForDB(data: ProductFormData) {
  return {
    sku: data.sku.toUpperCase().trim(),
    name: data.name.trim(),
    description: data.description.trim() || null,
    price: parseFloat(data.price),
    brand_id: data.brand_id || null,
    category_id: data.category_id || null,
    frame_material_id: data.frame_material_id || null,
    frame_shape_id: data.frame_shape_id || null,
    lens_width: data.lens_width ? parseInt(data.lens_width) : null,
    bridge_width: data.bridge_width ? parseInt(data.bridge_width) : null,
    temple_length: data.temple_length ? parseInt(data.temple_length) : null,
    stock_quantity: data.stock_quantity ? parseInt(data.stock_quantity) : 0,
    low_stock_threshold: data.low_stock_threshold ? parseInt(data.low_stock_threshold) : 5,
    is_active: data.is_active,
  };
}

/**
 * Compress and resize image for upload
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = height * (maxWidth / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = width * (maxHeight / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          file.type,
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
}

/**
 * Generate a unique filename for upload
 */
export function generateUniqueFileName(originalName: string, productId: string): string {
  const extension = originalName.split('.').pop();
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `${productId}/${timestamp}-${random}.${extension}`;
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-PA', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}

/**
 * Check if product is low on stock
 */
export function isLowStock(stockQuantity: number, threshold: number): boolean {
  return stockQuantity <= threshold && stockQuantity > 0;
}

/**
 * Check if product is out of stock
 */
export function isOutOfStock(stockQuantity: number): boolean {
  return stockQuantity === 0;
}
