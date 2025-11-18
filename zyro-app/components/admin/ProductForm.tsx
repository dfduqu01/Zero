'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type {
  ProductFormData,
  ProductWithRelations,
  Brand,
  Category,
  FrameMaterial,
  FrameShape,
} from '@/lib/types/product';
import {
  validateProductForm,
  formatProductForDB,
  generateUniqueFileName,
} from '@/lib/utils/product-helpers';
import ImageUploader, { type UploadedImage, type ExistingImage } from './ImageUploader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

interface ProductFormProps {
  product?: ProductWithRelations;
  brands: Brand[];
  categories: Category[];
  materials: FrameMaterial[];
  shapes: FrameShape[];
}

export default function ProductForm({
  product,
  brands,
  categories,
  materials,
  shapes,
}: ProductFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const isEditing = !!product;

  // Form state
  const [formData, setFormData] = useState<ProductFormData>({
    sku: product?.sku || '',
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price?.toString() || '',
    brand_id: product?.brand_id || '',
    category_id: product?.category_id || '',
    frame_material_id: product?.frame_material_id || '',
    frame_shape_id: product?.frame_shape_id || '',
    lens_width: product?.lens_width?.toString() || '',
    bridge_width: product?.bridge_width?.toString() || '',
    temple_length: product?.temple_length?.toString() || '',
    stock_quantity: product?.stock_quantity?.toString() || '0',
    low_stock_threshold: product?.low_stock_threshold?.toString() || '5',
    is_active: product?.is_active ?? true,
  });

  const [images, setImages] = useState<UploadedImage[]>([]);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>(
    product?.product_images || []
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleExistingImageDelete = (imageId: string) => {
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const validation = validateProductForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    // Check if at least one image exists
    if (images.length === 0 && existingImages.length === 0) {
      alert('Debes subir al menos una imagen del producto');
      return;
    }

    setIsSubmitting(true);

    try {
      const productData = formatProductForDB(formData);

      let productId = product?.id;

      if (isEditing) {
        // Update existing product
        const { error: updateError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id);

        if (updateError) {
          console.error('Error updating product:', updateError);
          alert('Error al actualizar el producto');
          return;
        }
      } else {
        // Create new product
        const { data: newProduct, error: insertError } = await supabase
          .from('products')
          .insert([productData])
          .select()
          .single();

        if (insertError || !newProduct) {
          console.error('Error creating product:', insertError);
          alert('Error al crear el producto');
          return;
        }

        productId = newProduct.id;
      }

      // Upload new images
      if (images.length > 0 && productId) {
        for (let i = 0; i < images.length; i++) {
          const image = images[i];
          const fileName = generateUniqueFileName(image.file.name, productId);

          // Upload to storage
          const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(fileName, image.file);

          if (uploadError) {
            console.error('Error uploading image:', uploadError);
            continue;
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(fileName);

          // Insert image record
          await supabase.from('product_images').insert([
            {
              product_id: productId,
              image_url: urlData.publicUrl,
              display_order: existingImages.length + i,
              is_primary: existingImages.length === 0 && i === 0,
            },
          ]);
        }
      }

      // Delete removed existing images
      if (isEditing && product && product.product_images) {
        const removedImages = product.product_images.filter(
          (img) => !existingImages.find((ei) => ei.id === img.id)
        );

        for (const image of removedImages) {
          // Delete from storage
          const url = new URL(image.image_url);
          const filePath = url.pathname.split('/').slice(-2).join('/');
          await supabase.storage.from('product-images').remove([filePath]);

          // Delete from database
          await supabase.from('product_images').delete().eq('id', image.id);
        }
      }

      alert(`Producto ${isEditing ? 'actualizado' : 'creado'} exitosamente`);
      router.push('/admin/products');
      router.refresh();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar el producto');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/products">
            <Button type="button" variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
            </h1>
            {isEditing && product && (
              <p className="text-gray-600 mt-1">SKU: {product.sku}</p>
            )}
          </div>
        </div>
        <Button type="submit" disabled={isSubmitting}>
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Guardando...' : 'Guardar Producto'}
        </Button>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Información Básica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                placeholder="ZERO-001"
                disabled={isEditing}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.sku ? 'border-red-500' : 'border-gray-300'
                } ${isEditing ? 'bg-gray-100' : ''}`}
              />
              {errors.sku && <p className="text-red-500 text-sm mt-1">{errors.sku}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="ZERO Signature Acetato"
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              placeholder="Descripción del producto..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio (USD) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                placeholder="129.99"
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.price ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock
              </label>
              <input
                type="number"
                name="stock_quantity"
                value={formData.stock_quantity}
                onChange={handleInputChange}
                min="0"
                placeholder="0"
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.stock_quantity ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.stock_quantity && (
                <p className="text-red-500 text-sm mt-1">{errors.stock_quantity}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Umbral Stock Bajo
              </label>
              <input
                type="number"
                name="low_stock_threshold"
                value={formData.low_stock_threshold}
                onChange={handleInputChange}
                min="0"
                placeholder="5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600"
            />
            <label className="text-sm font-medium text-gray-700">
              Producto Activo
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Classification */}
      <Card>
        <CardHeader>
          <CardTitle>Clasificación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Marca <span className="text-red-500">*</span>
              </label>
              <select
                name="brand_id"
                value={formData.brand_id}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.brand_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Seleccionar marca...</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
              {errors.brand_id && (
                <p className="text-red-500 text-sm mt-1">{errors.brand_id}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría
              </label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Seleccionar categoría...</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Material del Marco
              </label>
              <select
                name="frame_material_id"
                value={formData.frame_material_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Seleccionar material...</option>
                {materials.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Forma del Marco
              </label>
              <select
                name="frame_shape_id"
                value={formData.frame_shape_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Seleccionar forma...</option>
                {shapes.map((shape) => (
                  <option key={shape.id} value={shape.id}>
                    {shape.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Physical Specifications */}
      <Card>
        <CardHeader>
          <CardTitle>Especificaciones Físicas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ancho del Lente (mm)
              </label>
              <input
                type="number"
                name="lens_width"
                value={formData.lens_width}
                onChange={handleInputChange}
                min="0"
                placeholder="51"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ancho del Puente (mm)
              </label>
              <input
                type="number"
                name="bridge_width"
                value={formData.bridge_width}
                onChange={handleInputChange}
                min="0"
                placeholder="21"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Largo de la Varilla (mm)
              </label>
              <input
                type="number"
                name="temple_length"
                value={formData.temple_length}
                onChange={handleInputChange}
                min="0"
                placeholder="145"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Images */}
      <Card>
        <CardHeader>
          <CardTitle>Imágenes del Producto</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUploader
            images={images}
            existingImages={existingImages}
            onImagesChange={setImages}
            onExistingImageDelete={handleExistingImageDelete}
            maxImages={5}
            maxSizeMB={10}
          />
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Link href="/admin/products">
          <Button type="button" variant="outline">
            Cancelar
          </Button>
        </Link>
        <Button type="submit" disabled={isSubmitting}>
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Guardando...' : 'Guardar Producto'}
        </Button>
      </div>
    </form>
  );
}
