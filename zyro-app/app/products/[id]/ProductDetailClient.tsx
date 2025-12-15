'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import PrescriptionForm from '@/components/PrescriptionForm';
import type {
  PrescriptionData,
  PrescriptionType,
  LensType,
  LensIndex,
  ViewArea,
} from '@/lib/types/prescription';
import { calculatePrescriptionPrice } from '@/lib/utils/prescription-helpers';

interface Product {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  lens_width: number | null;
  bridge_width: number | null;
  temple_length: number | null;
  brand: { id: string; name: string; slug: string } | null;
  category: { id: string; name: string; slug: string } | null;
  frame_material: { id: string; name: string } | null;
  frame_shape: { id: string; name: string } | null;
  product_images: Array<{
    id: string;
    image_url: string;
    cloudfront_url: string | null;
    display_order: number;
    is_primary: boolean;
  }>;
}

interface ProductDetailClientProps {
  product: Product;
  prescriptionTypes: PrescriptionType[];
  lensTypes: LensType[];
  lensIndexes: LensIndex[];
  viewAreas: ViewArea[];
}

export default function ProductDetailClient({
  product,
  prescriptionTypes,
  lensTypes,
  lensIndexes,
  viewAreas,
}: ProductDetailClientProps) {
  const router = useRouter();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [prescription, setPrescription] = useState<PrescriptionData | undefined>(undefined);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isPrescriptionFormActive, setIsPrescriptionFormActive] = useState(false);

  // Sort images by display_order
  const sortedImages = [...product.product_images].sort(
    (a, b) => a.display_order - b.display_order
  );

  const selectedImage = sortedImages[selectedImageIndex] || null;

  // Calculate pricing with new prescription structure
  const pricing = calculatePrescriptionPrice(
    product.price,
    prescription,
    lensTypes,
    lensIndexes,
    viewAreas,
    [] // Empty array - treatments removed
  );

  const totalPrice = pricing.total * quantity;

  // Handle add to cart
  const handleAddToCart = async () => {
    setIsAddingToCart(true);

    try {
      // Validate prescription before proceeding
      if (prescription) {
        const { validatePrescription } = await import('@/lib/utils/prescription-helpers');
        const validationResult = validatePrescription(prescription, prescriptionTypes);

        if (!validationResult.isValid) {
          // Show validation errors to user
          const errorMessages = validationResult.errors.map(e => e.message).join('\n');
          alert(`Por favor corrige los siguientes errores:\n\n${errorMessages}`);
          setIsAddingToCart(false);
          return;
        }
      }

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      // Prepare prescription data
      let prescriptionData: PrescriptionData | undefined = undefined;

      if (prescription) {
        // If there's an image file, compress and convert to base64
        if (prescription.prescription_image_file) {
          const { compressPrescriptionImage } = await import('@/lib/utils/prescription-helpers');
          const { base64 } = await compressPrescriptionImage(prescription.prescription_image_file);

          prescriptionData = {
            ...prescription,
            prescription_image_url: base64,
            prescription_image_file: undefined, // Remove File object for localStorage
          };
        } else {
          prescriptionData = prescription;
        }
      }

      if (user) {
        // USER IS LOGGED IN - Save to database
        console.log('🛒 User logged in, saving to database');

        // Insert cart item
        const { data: dbCartItem, error: cartError } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            product_id: product.id,
            quantity,
          })
          .select()
          .single();

        if (cartError) {
          console.error('Error saving cart item to database:', cartError);
          throw new Error('Error al agregar al carrito');
        }

        // If there's a prescription, save it to database
        if (prescriptionData && dbCartItem) {
          const { error: prescError } = await supabase
            .from('cart_item_prescriptions')
            .insert({
              cart_item_id: dbCartItem.id,
              prescription_type_id: prescriptionData.prescription_type_id,
              lens_type_id: prescriptionData.lens_type_id,
              lens_index_id: prescriptionData.lens_index_id,
              view_area_id: prescriptionData.view_area_id,
              od_sph: prescriptionData.formula?.od_sph,
              od_cyl: prescriptionData.formula?.od_cyl,
              od_axis: prescriptionData.formula?.od_axis,
              os_sph: prescriptionData.formula?.os_sph,
              os_cyl: prescriptionData.formula?.os_cyl,
              os_axis: prescriptionData.formula?.os_axis,
              pd: prescriptionData.formula?.pd,
              pd_dual_od: prescriptionData.formula?.pd_dual_od,
              pd_dual_os: prescriptionData.formula?.pd_dual_os,
              add_value: prescriptionData.formula?.add_value,
              prescription_image_url: prescriptionData.prescription_image_url,
            });

          if (prescError) {
            console.error('Error saving prescription to database:', prescError);
            // Show more detailed error information
            const errorMessage = prescError.message || 'Error desconocido al guardar la prescripción';
            alert(`Error al guardar la prescripción: ${errorMessage}`);
            throw new Error('Error al guardar la prescripción');
          }
        }

        console.log('✅ Cart item saved to database');

      } else {
        // USER IS NOT LOGGED IN - Save to localStorage
        console.log('🛒 User not logged in, saving to localStorage');

        // Get existing cart from localStorage
        const existingCart = localStorage.getItem('cart');
        const cart = existingCart ? JSON.parse(existingCart) : [];

        // Calculate prescription costs to store in cart
        let prescriptionCosts = {
          lensTypeCost: 0,
          lensIndexCost: 0,
          viewAreaCost: 0,
        };

        if (prescriptionData) {
          const selectedLensType = lensTypes.find(lt => lt.id === prescriptionData.lens_type_id);
          const selectedLensIndex = lensIndexes.find(li => li.id === prescriptionData.lens_index_id);
          const selectedViewArea = viewAreas.find(va => va.id === prescriptionData.view_area_id);

          prescriptionCosts.lensTypeCost = selectedLensType?.price_modifier || 0;
          prescriptionCosts.lensIndexCost = selectedLensIndex?.price_modifier || 0;
          prescriptionCosts.viewAreaCost = selectedViewArea?.price_modifier || 0;
        }

        // Create cart item with enhanced prescription
        const cartItem = {
          id: crypto.randomUUID(),
          productId: product.id,
          productName: product.name,
          productPrice: product.price,
          productImage: selectedImage?.image_url || null,
          quantity,
          prescription: prescriptionData,
          prescriptionCosts, // Add costs for cart display
          addedAt: new Date().toISOString(),
        };

        // Add to cart
        cart.push(cartItem);

        // Save to localStorage
        localStorage.setItem('cart', JSON.stringify(cart));

        console.log('✅ Cart item saved to localStorage');
      }

      // Redirect to cart
      setTimeout(() => {
        router.push('/cart');
      }, 500);
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Error al agregar al carrito');
      setIsAddingToCart(false);
    }
  };

  const isOutOfStock = product.stock_quantity === 0;
  const isLowStock = product.stock_quantity <= product.low_stock_threshold && product.stock_quantity > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      {/* Left Column - Images */}
      <div className="space-y-4">
        {/* Main Image */}
        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
          {selectedImage ? (
            <Image
              src={selectedImage.cloudfront_url || selectedImage.image_url}
              alt={product.name}
              fill
              className="object-contain"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}

          {/* Stock Badge */}
          {isLowStock && (
            <div className="absolute top-4 right-4 bg-orange-500 text-white text-sm font-medium px-3 py-1 rounded-full">
              Pocas Unidades
            </div>
          )}
          {isOutOfStock && (
            <div className="absolute top-4 right-4 bg-red-500 text-white text-sm font-medium px-3 py-1 rounded-full">
              Agotado
            </div>
          )}
        </div>

        {/* Thumbnail Images */}
        {sortedImages.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {sortedImages.map((image, index) => (
              <button
                key={image.id}
                onClick={() => setSelectedImageIndex(index)}
                className={`aspect-square bg-gray-100 rounded-md overflow-hidden border-2 transition-colors ${
                  selectedImageIndex === index ? 'border-black' : 'border-transparent hover:border-gray-300'
                }`}
              >
                <Image
                  src={image.image_url}
                  alt={`${product.name} - ${index + 1}`}
                  width={100}
                  height={100}
                  className="object-contain w-full h-full"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right Column - Product Info */}
      <div className="space-y-6">
        {/* Brand */}
        {product.brand && (
          <p className="text-sm text-gray-500 uppercase tracking-wide">{product.brand.name}</p>
        )}

        {/* Product Name */}
        <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>

        {/* Price Breakdown */}
        <div className="space-y-2">
          <div className="flex items-baseline gap-3">
            <p className="text-4xl font-bold text-gray-900">${product.price.toFixed(2)}</p>
            <p className="text-sm text-gray-500">Precio base</p>
          </div>

          {/* Prescription costs */}
          {prescription && (
            <div className="text-sm space-y-1">
              {pricing.lens_type_cost > 0 && (
                <p className="text-gray-600">+ ${pricing.lens_type_cost.toFixed(2)} (tipo de lente)</p>
              )}
              {pricing.lens_index_cost > 0 && (
                <p className="text-gray-600">+ ${pricing.lens_index_cost.toFixed(2)} (índice de lente)</p>
              )}
              {pricing.view_area_cost > 0 && (
                <p className="text-gray-600">+ ${pricing.view_area_cost.toFixed(2)} (área de visión)</p>
              )}
            </div>
          )}
        </div>

        {/* Total Price */}
        {(quantity > 1 || prescription) && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total:</span>
              <span className="text-2xl font-bold text-gray-900">${totalPrice.toFixed(2)}</span>
            </div>
            {quantity > 1 && (
              <p className="text-xs text-gray-500 mt-1">${pricing.total.toFixed(2)} × {quantity}</p>
            )}
          </div>
        )}

        {/* Description */}
        {product.description && (
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-600">{product.description}</p>
          </div>
        )}

        {/* Product Details */}
        <div className="border-t border-b border-gray-200 py-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">SKU:</span>
            <span className="font-medium text-gray-900">{product.sku}</span>
          </div>
          {product.category && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Categoría:</span>
              <span className="font-medium text-gray-900">{product.category.name}</span>
            </div>
          )}
          {product.frame_material && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Material:</span>
              <span className="font-medium text-gray-900">{product.frame_material.name}</span>
            </div>
          )}
          {product.frame_shape && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Forma:</span>
              <span className="font-medium text-gray-900">{product.frame_shape.name}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Disponibilidad:</span>
            <span className={`font-medium ${isOutOfStock ? 'text-red-600' : 'text-green-600'}`}>
              {isOutOfStock ? 'Agotado' : `${product.stock_quantity} en stock`}
            </span>
          </div>
        </div>

        {/* Frame Dimensions */}
        {(product.lens_width || product.bridge_width || product.temple_length) && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Dimensiones del Marco</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              {product.lens_width && (
                <div>
                  <p className="text-2xl font-bold text-gray-900">{product.lens_width}</p>
                  <p className="text-xs text-gray-600">Ancho Lente (mm)</p>
                </div>
              )}
              {product.bridge_width && (
                <div>
                  <p className="text-2xl font-bold text-gray-900">{product.bridge_width}</p>
                  <p className="text-xs text-gray-600">Puente (mm)</p>
                </div>
              )}
              {product.temple_length && (
                <div>
                  <p className="text-2xl font-bold text-gray-900">{product.temple_length}</p>
                  <p className="text-xs text-gray-600">Varilla (mm)</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Prescription Form */}
        {(product.category?.slug === 'gafas-con-receta' || product.category?.slug === 'aros-opticos') && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Configuración de Lentes</h3>
            <PrescriptionForm
              value={prescription}
              onChange={setPrescription}
              prescriptionTypes={prescriptionTypes}
              lensTypes={lensTypes}
              lensIndexes={lensIndexes}
              viewAreas={viewAreas}
              onAddToCart={handleAddToCart}
              onFormStateChange={setIsPrescriptionFormActive}
            />
          </div>
        )}

        {/* Old Lens Treatments section removed - now handled in multi-step prescription form */}

        {/* Quantity Selector */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-900">Cantidad</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <input
              type="number"
              min="1"
              max={product.stock_quantity}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock_quantity, parseInt(e.target.value) || 1)))}
              className="w-20 text-center px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
            />
            <button
              onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
              disabled={quantity >= product.stock_quantity}
              className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Add to Cart Button */}
        <div className="space-y-3">
          {!isPrescriptionFormActive && (product.category?.slug === 'gafas-con-receta' || product.category?.slug === 'aros-opticos') && !prescription && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <p className="text-sm text-yellow-900 font-medium">
                ⚠️ Por favor elige una opción de lentes arriba
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Selecciona "Seleccionar Lentes" o "Solo el Marco"
              </p>
            </div>
          )}
          {!isPrescriptionFormActive && ((product.category?.slug !== 'gafas-con-receta' && product.category?.slug !== 'aros-opticos') || prescription) && (
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || isAddingToCart}
              className="w-full bg-black text-white py-4 rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isAddingToCart ? 'Agregando...' : isOutOfStock ? 'Agotado' : 'Agregar al Carrito'}
            </button>
          )}
          {isPrescriptionFormActive && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-sm text-blue-900 font-medium">
                Por favor completa la configuración de lentes arriba
              </p>
              <p className="text-xs text-blue-700 mt-1">
                El botón "Agregar al Carrito" aparecerá al finalizar
              </p>
            </div>
          )}
          <Link
            href="/products"
            className="block w-full text-center py-4 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Seguir Comprando
          </Link>
        </div>
      </div>
    </div>
  );
}
