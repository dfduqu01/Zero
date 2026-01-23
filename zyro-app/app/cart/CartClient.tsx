'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import PrescriptionSummary from '@/components/PrescriptionSummary';
import type { LocalStorageCartItem } from '@/lib/types/prescription';

export default function CartClient() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<LocalStorageCartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Prescription metadata for display
  const [lensTypes, setLensTypes] = useState<any[]>([]);
  const [lensIndexes, setLensIndexes] = useState<any[]>([]);
  const [viewAreas, setViewAreas] = useState<any[]>([]);
  const [prescriptionTypes, setPrescriptionTypes] = useState<any[]>([]);

  // Load cart (from database if logged in, or localStorage if not)
  useEffect(() => {
    const loadCart = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Fetch prescription metadata (needed for both logged in and anonymous users)
        const [lensTypesResult, lensIndexesResult, viewAreasResult, prescriptionTypesResult] = await Promise.all([
          supabase.from('lens_types').select('id, name, slug, description, price_modifier, is_active'),
          supabase.from('lens_indexes').select('id, name, slug, description, price_modifier, index_value, is_active'),
          supabase.from('view_areas').select('id, name, slug, description, price_modifier, is_active'),
          supabase.from('prescription_types').select('id, name, slug, description, is_active'),
        ]);

        const lensTypesData = lensTypesResult.data || [];
        const lensIndexesData = lensIndexesResult.data || [];
        const viewAreasData = viewAreasResult.data || [];
        const prescriptionTypesData = prescriptionTypesResult.data || [];

        // Store metadata in state for use in JSX
        setLensTypes(lensTypesData);
        setLensIndexes(lensIndexesData);
        setViewAreas(viewAreasData);
        setPrescriptionTypes(prescriptionTypesData);

        if (user) {
          // User is logged in - fetch from database
          console.log('🛒 User logged in, fetching cart from database');
          setIsLoggedIn(true);

          // Fetch cart items
          const cartResult = await supabase
            .from('cart_items')
            .select(`
              id,
              product_id,
              quantity,
              created_at,
              products (
                id,
                name,
                price,
                product_images (image_url, is_primary)
              ),
              cart_item_prescriptions (
                prescription_type_id,
                lens_type_id,
                lens_index_id,
                view_area_id,
                od_sph, od_cyl, od_axis,
                os_sph, os_cyl, os_axis,
                pd, pd_dual_od, pd_dual_os, add_value,
                prescription_image_url
              )
            `)
            .eq('user_id', user.id);

          if (cartResult.error) {
            console.error('Error fetching cart from database:', cartResult.error);
            return;
          }

          const dbCartItems = cartResult.data;

          // Format items with calculated costs
          const formattedItems: LocalStorageCartItem[] = (dbCartItems || []).map((item: any) => {
            let prescriptionCosts = {
              lensTypeCost: 0,
              lensIndexCost: 0,
              viewAreaCost: 0,
            };

            // Calculate prescription costs if prescription exists
            if (item.cart_item_prescriptions) {
              const presc = item.cart_item_prescriptions;

              // Lens type cost
              if (presc.lens_type_id) {
                const lensType = lensTypesData.find((lt: any) => lt.id === presc.lens_type_id);
                prescriptionCosts.lensTypeCost = parseFloat(lensType?.price_modifier || 0);
              }

              // Lens index cost
              if (presc.lens_index_id) {
                const lensIndex = lensIndexesData.find((li: any) => li.id === presc.lens_index_id);
                prescriptionCosts.lensIndexCost = parseFloat(lensIndex?.price_modifier || 0);
              }

              // View area cost
              if (presc.view_area_id) {
                const viewArea = viewAreasData.find((va: any) => va.id === presc.view_area_id);
                prescriptionCosts.viewAreaCost = parseFloat(viewArea?.price_modifier || 0);
              }
            }

            return {
              id: item.id,
              productId: item.product_id,
              productName: item.products?.name || 'Unknown Product',
              productPrice: parseFloat(item.products?.price || 0),
              productImage: item.products?.product_images?.find((img: any) => img.is_primary)?.image_url || null,
              quantity: item.quantity,
              prescription: item.cart_item_prescriptions ? {
                prescription_type_id: item.cart_item_prescriptions.prescription_type_id,
                lens_type_id: item.cart_item_prescriptions.lens_type_id,
                lens_index_id: item.cart_item_prescriptions.lens_index_id,
                view_area_id: item.cart_item_prescriptions.view_area_id,
                formula: {
                  od_sph: item.cart_item_prescriptions.od_sph,
                  od_cyl: item.cart_item_prescriptions.od_cyl,
                  od_axis: item.cart_item_prescriptions.od_axis,
                  os_sph: item.cart_item_prescriptions.os_sph,
                  os_cyl: item.cart_item_prescriptions.os_cyl,
                  os_axis: item.cart_item_prescriptions.os_axis,
                  pd: item.cart_item_prescriptions.pd,
                  pd_dual_od: item.cart_item_prescriptions.pd_dual_od,
                  pd_dual_os: item.cart_item_prescriptions.pd_dual_os,
                  add_value: item.cart_item_prescriptions.add_value,
                },
                prescription_image_url: item.cart_item_prescriptions.prescription_image_url,
              } : undefined,
              prescriptionCosts,
              addedAt: item.created_at,
            };
          });

          setCartItems(formattedItems);
        } else {
          // User not logged in - read from localStorage
          console.log('🛒 User not logged in, reading from localStorage');
          setIsLoggedIn(false);
          const cartData = localStorage.getItem('cart');
          if (cartData) {
            const parsedCart = JSON.parse(cartData);
            setCartItems(parsedCart);
          }
        }
      } catch (error) {
        console.error('Error loading cart:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCart();
  }, []);

  // Save cart to localStorage
  const saveCart = (items: LocalStorageCartItem[]) => {
    localStorage.setItem('cart', JSON.stringify(items));
    setCartItems(items);
  };

  // Update item quantity
  const updateQuantity = async (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    const item = cartItems[index];

    if (isLoggedIn) {
      // Update in database
      const supabase = createClient();
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', item.id);

      if (error) {
        console.error('Error updating quantity in database:', error);
        return;
      }
    }

    const updatedCart = [...cartItems];
    updatedCart[index].quantity = newQuantity;
    saveCart(updatedCart);
  };

  // Remove item from cart
  const removeItem = async (index: number) => {
    const item = cartItems[index];

    if (isLoggedIn) {
      // Delete from database
      const supabase = createClient();
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', item.id);

      if (error) {
        console.error('Error removing item from database:', error);
        return;
      }
    }

    const updatedCart = cartItems.filter((_, i) => i !== index);
    saveCart(updatedCart);
  };

  // Clear entire cart
  const clearCart = async () => {
    if (!confirm('¿Estás seguro de que quieres vaciar tu carrito?')) {
      return;
    }

    if (isLoggedIn) {
      // Delete all cart items from database
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id);

        if (error) {
          console.error('Error clearing cart in database:', error);
          return;
        }
      }
    }

    saveCart([]);
  };

  // Calculate item price including prescription options
  const calculateItemPrice = (item: LocalStorageCartItem): number => {
    let itemPrice = item.productPrice;

    // Add prescription-related costs
    if (item.prescriptionCosts) {
      itemPrice += item.prescriptionCosts.lensTypeCost || 0;
      itemPrice += item.prescriptionCosts.lensIndexCost || 0;
      itemPrice += item.prescriptionCosts.viewAreaCost || 0;
    }

    return itemPrice * item.quantity;
  };

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => {
    return sum + item.productPrice * item.quantity;
  }, 0);

  const prescriptionTotal = cartItems.reduce((sum, item) => {
    if (item.prescriptionCosts) {
      const prescCost =
        (item.prescriptionCosts.lensTypeCost || 0) +
        (item.prescriptionCosts.lensIndexCost || 0) +
        (item.prescriptionCosts.viewAreaCost || 0);
      return sum + prescCost * item.quantity;
    }
    return sum;
  }, 0);

  const taxRate = 0; // No tax for now
  const taxAmount = (subtotal + prescriptionTotal) * taxRate;
  const grandTotal = subtotal + prescriptionTotal + taxAmount;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando carrito...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <svg
          className="mx-auto h-24 w-24 text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Tu carrito está vacío</h2>
        <p className="text-gray-600 mb-6">
          Agrega productos a tu carrito para continuar con tu compra
        </p>
        <Link
          href="/products"
          className="inline-block bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          Explorar Productos
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Cart Items - Left Column */}
      <div className="lg:col-span-2 space-y-4">
        {/* Clear Cart Button */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600">
            {cartItems.length} {cartItems.length === 1 ? 'producto' : 'productos'} en tu carrito
          </p>
          <button
            onClick={clearCart}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Vaciar Carrito
          </button>
        </div>

        {/* Cart Items List */}
        {cartItems.map((item, index) => {
          const itemTotal = calculateItemPrice(item);

          return (
            <div key={item.id || index} className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Product Image */}
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-100 rounded-lg overflow-hidden relative">
                    {item.productImage ? (
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Link
                        href={`/products/${item.productId}`}
                        className="text-lg font-semibold text-gray-900 hover:text-gray-700"
                      >
                        {item.productName}
                      </Link>
                      <p className="text-sm text-gray-600 mt-1">
                        ${item.productPrice.toFixed(2)} c/u
                      </p>

                      {/* Enhanced Prescription Details */}
                      {item.prescription && (
                        <div className="mt-3">
                          <PrescriptionSummary
                            prescription={item.prescription}
                            lensTypes={lensTypes}
                            lensIndexes={lensIndexes}
                            viewAreas={viewAreas}
                            prescriptionTypes={prescriptionTypes}
                            compact
                          />
                        </div>
                      )}
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeItem(index)}
                      className="ml-4 text-gray-400 hover:text-red-500 transition-colors"
                      title="Eliminar producto"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Quantity Controls and Price */}
                  <div className="flex items-center justify-between mt-4">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(index, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 1)}
                        className="w-16 text-center px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                      />
                      <button
                        onClick={() => updateQuantity(index, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>

                    {/* Item Total */}
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        ${itemTotal.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Continue Shopping Link */}
        <Link
          href="/products"
          className="block text-center py-3 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          ← Seguir Comprando
        </Link>
      </div>

      {/* Order Summary - Right Column */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumen del Pedido</h2>

          <div className="space-y-3 mb-6">
            {/* Subtotal */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
            </div>

            {/* Prescription Costs */}
            {prescriptionTotal > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Configuración de Lentes</span>
                <span className="font-medium text-gray-900">${prescriptionTotal.toFixed(2)}</span>
              </div>
            )}

            {/* Tax (if applicable) */}
            {taxAmount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Impuestos</span>
                <span className="font-medium text-gray-900">${taxAmount.toFixed(2)}</span>
              </div>
            )}

            {/* Shipping Note */}
            <div className="text-sm text-gray-500 italic">
              Envío calculado en el checkout
            </div>
          </div>

          {/* Total */}
          <div className="border-t border-gray-200 pt-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-gray-900">${grandTotal.toFixed(2)}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">USD (Dólares Americanos)</p>
          </div>

          {/* Checkout Button */}
          <button
            onClick={() => router.push('/checkout')}
            className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors mb-3"
          >
            Proceder al Pago
          </button>

          {/* Security Note */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <span>Pago seguro y protegido</span>
          </div>
        </div>
      </div>
    </div>
  );
}
