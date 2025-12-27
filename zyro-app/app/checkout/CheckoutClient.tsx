'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LATIN_AMERICAN_COUNTRIES } from '@/lib/constants/countries';
import PrescriptionSummary from '@/components/PrescriptionSummary';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { LensType, LensIndex, ViewArea, PrescriptionType } from '@/lib/types/prescription';

interface User {
  id: string;
  name: string;
  email?: string;
  phone: string;
  country: string;
}

interface Address {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  country: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state_province: string;
  postal_code: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  products: {
    id: string;
    sku: string;
    name: string;
    price: number;
    description: string | null;
    stock_quantity: number;
    image_url: string;
  };
  prescription: any;
}


interface CheckoutClientProps {
  user: User;
  addresses: Address[];
  cartItems: CartItem[];
  lensTypes: LensType[];
  lensIndexes: LensIndex[];
  viewAreas: ViewArea[];
  prescriptionTypes: PrescriptionType[];
}

type CheckoutStep = 'shipping' | 'method' | 'review';

export default function CheckoutClient({
  user,
  addresses,
  cartItems,
  lensTypes,
  lensIndexes,
  viewAreas,
  prescriptionTypes,
}: CheckoutClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [currentStep, setCurrentStep] = useState<CheckoutStep>('shipping');
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    addresses.find((a) => a.is_default)?.id || addresses[0]?.id || null
  );
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<string>('standard');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for payment errors in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlError = urlParams.get('error');
    if (urlError) {
      // Map error codes to user-friendly messages
      const errorMessages: Record<string, string> = {
        'INVALID_CVN': '❌ Código de seguridad (CVV) inválido. Por favor verifica los datos de tu tarjeta.',
        'INSUFFICIENT_FUNDS': '❌ Fondos insuficientes. Por favor intenta con otra tarjeta.',
        'CARD_EXPIRED': '❌ Tarjeta vencida. Por favor usa una tarjeta válida.',
        'CARD_DECLINED': '❌ Tarjeta rechazada. Por favor contacta a tu banco o intenta con otra tarjeta.',
        'unexpected_error': '❌ Error inesperado. Por favor intenta nuevamente.',
        'session_not_found': '❌ Sesión expirada. Por favor intenta nuevamente.',
      };

      const friendlyMessage = errorMessages[urlError] || `❌ Error en el pago: ${decodeURIComponent(urlError)}`;
      setError(friendlyMessage);

      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Clear error from URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  // Address form state
  const [addressForm, setAddressForm] = useState({
    full_name: user.name || '',
    phone: user.phone || '',
    country: user.country || 'México',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state_province: '',
    postal_code: '',
    is_default: false,
  });

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = cartItems.reduce((sum, item) => {
      return sum + item.products.price * item.quantity;
    }, 0);

    // Calculate prescription costs from lens_types, lens_indexes, view_areas
    const prescriptionCosts = cartItems.reduce((sum, item) => {
      if (!item.prescription) return sum;

      let itemPrescriptionCost = 0;

      // Lens type cost
      if (item.prescription.lens_type_id) {
        const lensType = lensTypes.find((lt) => lt.id === item.prescription.lens_type_id);
        itemPrescriptionCost += parseFloat(String(lensType?.price_modifier || 0));
      }

      // Lens index cost
      if (item.prescription.lens_index_id) {
        const lensIndex = lensIndexes.find((li) => li.id === item.prescription.lens_index_id);
        itemPrescriptionCost += parseFloat(String(lensIndex?.price_modifier || 0));
      }

      // View area cost (for progressive lenses)
      if (item.prescription.view_area_id) {
        const viewArea = viewAreas.find((va) => va.id === item.prescription.view_area_id);
        itemPrescriptionCost += parseFloat(String(viewArea?.price_modifier || 0));
      }

      // Multiply by quantity
      return sum + itemPrescriptionCost * item.quantity;
    }, 0);

    // Shipping costs based on method
    const shippingCost =
      shippingMethod === 'express' ? 25.0 :
      shippingMethod === 'no_delivery' ? 0.0 :
      15.0; // standard

    const total = subtotal + prescriptionCosts + shippingCost;

    return {
      subtotal,
      prescriptionCosts,
      shippingCost,
      total,
    };
  };

  const totals = calculateTotals();

  // Step navigation
  const steps: { id: CheckoutStep; label: string; number: number }[] = [
    { id: 'shipping', label: 'Dirección de Envío', number: 1 },
    { id: 'method', label: 'Método de Envío', number: 2 },
    { id: 'review', label: 'Revisar Pedido', number: 3 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  const handleNextStep = () => {
    if (currentStep === 'shipping') {
      if (!selectedAddressId && !isAddingAddress) {
        setError('Por favor selecciona una dirección de envío');
        return;
      }
      setCurrentStep('method');
    } else if (currentStep === 'method') {
      setCurrentStep('review');
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 'method') {
      setCurrentStep('shipping');
    } else if (currentStep === 'review') {
      setCurrentStep('method');
    }
  };

  // Save new address
  const handleSaveAddress = async () => {
    setError(null);
    setIsProcessing(true);

    // Validation
    if (
      !addressForm.full_name.trim() ||
      !addressForm.phone.trim() ||
      !addressForm.address_line_1.trim() ||
      !addressForm.city.trim() ||
      !addressForm.state_province.trim() ||
      !addressForm.postal_code.trim()
    ) {
      setError('Todos los campos obligatorios son requeridos');
      setIsProcessing(false);
      return;
    }

    try {
      const { data: newAddress, error: insertError } = await supabase
        .from('addresses')
        .insert({
          user_id: user.id,
          ...addressForm,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Set as selected address
      setSelectedAddressId(newAddress.id);
      setIsAddingAddress(false);

      // Refresh page to get updated addresses
      router.refresh();
    } catch (err: any) {
      console.error('Error saving address:', err);
      setError(err.message || 'Error al guardar la dirección');
    } finally {
      setIsProcessing(false);
    }
  };

  // Place order (redirect-based payment flow)
  const handlePlaceOrder = async () => {
    setError(null);
    setIsProcessing(true);

    try {
      // 1. Get selected address
      const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
      if (!selectedAddress) {
        throw new Error('No se seleccionó dirección de envío');
      }

      // 2. Generate order number
      const orderNumber = `ZERO-${new Date().getFullYear()}-${String(
        Math.floor(Math.random() * 100000)
      ).padStart(5, '0')}`;

      console.log('[Checkout] Saving checkout session for order:', orderNumber);

      // 3. Save checkout session (before redirect)
      const sessionResponse = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber,
          addressId: selectedAddressId,
          shippingMethod,
          cartItems: cartItems.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.products.price,
            product_snapshot: {
              sku: item.products.sku,
              name: item.products.name,
              price: item.products.price,
              description: item.products.description,
              image_url: item.products.image_url,
            },
            prescription: item.prescription,
          })),
          amount: totals.total,
        }),
      });

      if (!sessionResponse.ok) {
        const result = await sessionResponse.json();
        throw new Error(result.error || 'Error al guardar la sesión');
      }

      console.log('[Checkout] Session saved, creating payment link...');

      // 4. Create payment link
      const paymentResponse = await fetch('/api/checkout/create-payment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totals.total,
          orderNumber,
          description: `ZERO Optical - Order #${orderNumber}`,
        }),
      });

      const paymentResult = await paymentResponse.json();

      if (!paymentResult.success || !paymentResult.paymentUrl) {
        throw new Error(paymentResult.error || 'No se pudo crear el enlace de pago');
      }

      console.log('[Checkout] Payment link created, redirecting to PagueloFacil...');

      // 5. Redirect to PagueloFacil hosted checkout
      window.location.href = paymentResult.paymentUrl;
    } catch (err: any) {
      console.error('[Checkout] Error creating payment:', err);
      setError(err.message || 'Error al procesar el pedido');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                      index <= currentStepIndex
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}
                  >
                    {step.number}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium ${
                      index <= currentStepIndex ? 'text-blue-600' : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 ${
                      index < currentStepIndex ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-5 w-5" />
                <AlertTitle className="text-lg font-semibold">Error en el Pago</AlertTitle>
                <AlertDescription className="mt-2 text-base">
                  {error}
                  <p className="mt-3 text-sm">
                    Tu carrito se ha mantenido. Puedes intentar nuevamente con otra tarjeta o método de pago.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {/* Step 1: Shipping Address */}
            {currentStep === 'shipping' && (
              <Card>
                <CardHeader>
                  <CardTitle>Dirección de Envío</CardTitle>
                  <CardDescription>
                    Selecciona o agrega una dirección de envío
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!isAddingAddress ? (
                    <>
                      {addresses.length > 0 && (
                        <div className="space-y-3 mb-4">
                          {addresses.map((address) => (
                            <div
                              key={address.id}
                              className={`p-4 border rounded-lg cursor-pointer transition ${
                                selectedAddressId === address.id
                                  ? 'border-blue-600 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => setSelectedAddressId(address.id)}
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-semibold">{address.full_name}</p>
                                  <p className="text-sm text-gray-600">{address.address_line_1}</p>
                                  {address.address_line_2 && (
                                    <p className="text-sm text-gray-600">{address.address_line_2}</p>
                                  )}
                                  <p className="text-sm text-gray-600">
                                    {address.city}, {address.state_province} {address.postal_code}
                                  </p>
                                  <p className="text-sm text-gray-600">{address.country}</p>
                                  <p className="text-sm text-gray-500 mt-1">{address.phone}</p>
                                </div>
                                {address.is_default && (
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    Predeterminada
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <Button
                        onClick={() => setIsAddingAddress(true)}
                        variant="outline"
                        className="w-full"
                      >
                        + Agregar Nueva Dirección
                      </Button>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="full_name">Nombre Completo del Destinatario</Label>
                        <Input
                          id="full_name"
                          value={addressForm.full_name}
                          onChange={(e) =>
                            setAddressForm({ ...addressForm, full_name: e.target.value })
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="phone">Teléfono</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={addressForm.phone}
                          onChange={(e) =>
                            setAddressForm({ ...addressForm, phone: e.target.value })
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="country">País</Label>
                        <select
                          id="country"
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          value={addressForm.country}
                          onChange={(e) =>
                            setAddressForm({ ...addressForm, country: e.target.value })
                          }
                        >
                          {LATIN_AMERICAN_COUNTRIES.map((country) => (
                            <option key={country} value={country}>
                              {country}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <Label htmlFor="address_line_1">Dirección Línea 1</Label>
                        <Input
                          id="address_line_1"
                          value={addressForm.address_line_1}
                          onChange={(e) =>
                            setAddressForm({ ...addressForm, address_line_1: e.target.value })
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="address_line_2">Dirección Línea 2 (Opcional)</Label>
                        <Input
                          id="address_line_2"
                          placeholder="Apartamento, Suite, Edificio"
                          value={addressForm.address_line_2}
                          onChange={(e) =>
                            setAddressForm({ ...addressForm, address_line_2: e.target.value })
                          }
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="city">Ciudad</Label>
                          <Input
                            id="city"
                            value={addressForm.city}
                            onChange={(e) =>
                              setAddressForm({ ...addressForm, city: e.target.value })
                            }
                          />
                        </div>

                        <div>
                          <Label htmlFor="state_province">Estado/Provincia</Label>
                          <Input
                            id="state_province"
                            value={addressForm.state_province}
                            onChange={(e) =>
                              setAddressForm({ ...addressForm, state_province: e.target.value })
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="postal_code">Código Postal</Label>
                        <Input
                          id="postal_code"
                          value={addressForm.postal_code}
                          onChange={(e) =>
                            setAddressForm({ ...addressForm, postal_code: e.target.value })
                          }
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={handleSaveAddress}
                          disabled={isProcessing}
                          className="flex-1"
                        >
                          {isProcessing ? 'Guardando...' : 'Guardar Dirección'}
                        </Button>
                        <Button
                          onClick={() => setIsAddingAddress(false)}
                          variant="outline"
                          disabled={isProcessing}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 2: Shipping Method */}
            {currentStep === 'method' && (
              <Card>
                <CardHeader>
                  <CardTitle>Método de Envío</CardTitle>
                  <CardDescription>
                    Selecciona el método de envío que prefieras
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div
                      className={`p-4 border rounded-lg cursor-pointer transition ${
                        shippingMethod === 'standard'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setShippingMethod('standard')}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">Envío Estándar</p>
                          <p className="text-sm text-gray-600">Entrega en 7-10 días hábiles</p>
                        </div>
                        <span className="font-semibold">$15.00</span>
                      </div>
                    </div>

                    <div
                      className={`p-4 border rounded-lg cursor-pointer transition ${
                        shippingMethod === 'express'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setShippingMethod('express')}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">Envío Express</p>
                          <p className="text-sm text-gray-600">Entrega en 3-5 días hábiles</p>
                        </div>
                        <span className="font-semibold">$25.00</span>
                      </div>
                    </div>

                    <div
                      className={`p-4 border rounded-lg cursor-pointer transition ${
                        shippingMethod === 'no_delivery'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setShippingMethod('no_delivery')}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">Sin Envío (Testing)</p>
                          <p className="text-sm text-gray-600">Solo para productos de prueba</p>
                        </div>
                        <span className="font-semibold text-green-600">GRATIS</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Review */}
            {currentStep === 'review' && (
              <Card>
                <CardHeader>
                  <CardTitle>Revisar Pedido</CardTitle>
                  <CardDescription>
                    Confirma los detalles de tu pedido antes de finalizar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Shipping Address */}
                    <div>
                      <h3 className="font-semibold mb-2">Dirección de Envío</h3>
                      {selectedAddressId && (
                        <>
                          {addresses
                            .filter((a) => a.id === selectedAddressId)
                            .map((address) => (
                              <div key={address.id} className="text-sm text-gray-600">
                                <p>{address.full_name}</p>
                                <p>{address.address_line_1}</p>
                                {address.address_line_2 && <p>{address.address_line_2}</p>}
                                <p>
                                  {address.city}, {address.state_province} {address.postal_code}
                                </p>
                                <p>{address.country}</p>
                                <p>{address.phone}</p>
                              </div>
                            ))}
                        </>
                      )}
                    </div>

                    {/* Shipping Method */}
                    <div>
                      <h3 className="font-semibold mb-2">Método de Envío</h3>
                      <p className="text-sm text-gray-600">
                        {shippingMethod === 'express' ? 'Envío Express' : 'Envío Estándar'} - $
                        {totals.shippingCost.toFixed(2)}
                      </p>
                    </div>

                    {/* Cart Items */}
                    <div>
                      <h3 className="font-semibold mb-2">Productos</h3>
                      <div className="space-y-4">
                        {cartItems.map((item) => {
                          // Calculate per-item prescription cost
                          let itemPrescriptionCost = 0;
                          if (item.prescription) {
                            if (item.prescription.lens_type_id) {
                              const lensType = lensTypes.find(
                                (lt) => lt.id === item.prescription.lens_type_id
                              );
                              itemPrescriptionCost += parseFloat(
                                String(lensType?.price_modifier || 0)
                              );
                            }
                            if (item.prescription.lens_index_id) {
                              const lensIndex = lensIndexes.find(
                                (li) => li.id === item.prescription.lens_index_id
                              );
                              itemPrescriptionCost += parseFloat(
                                String(lensIndex?.price_modifier || 0)
                              );
                            }
                            if (item.prescription.view_area_id) {
                              const viewArea = viewAreas.find(
                                (va) => va.id === item.prescription.view_area_id
                              );
                              itemPrescriptionCost += parseFloat(
                                String(viewArea?.price_modifier || 0)
                              );
                            }
                          }

                          const itemTotal =
                            (item.products.price + itemPrescriptionCost) * item.quantity;

                          return (
                            <div key={item.id} className="border-b pb-4">
                              <div className="flex gap-4 mb-2">
                                {/* Product Image */}
                                {item.products.image_url && (
                                  <img
                                    src={item.products.image_url}
                                    alt={item.products.name}
                                    className="w-20 h-20 object-cover rounded-md border"
                                  />
                                )}
                                <div className="flex-1">
                                  <div className="flex justify-between">
                                    <div className="flex-1">
                                      <p className="font-medium">{item.products.name}</p>
                                      <p className="text-sm text-gray-600">SKU: {item.products.sku}</p>
                                      <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                                      <p className="text-sm text-gray-600">
                                        Precio base: ${item.products.price.toFixed(2)}
                                      </p>
                                      {itemPrescriptionCost > 0 && (
                                        <p className="text-sm text-gray-600">
                                          Lentes y tratamientos: ${itemPrescriptionCost.toFixed(2)}
                                        </p>
                                      )}
                                    </div>
                                    <span className="font-medium">${itemTotal.toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Show prescription details if present */}
                              {item.prescription && (
                                <div className="mt-2 bg-gray-50 p-3 rounded-lg">
                                  <PrescriptionSummary
                                    prescription={{
                                      prescription_type_id: item.prescription.prescription_type_id,
                                      lens_type_id: item.prescription.lens_type_id,
                                      lens_index_id: item.prescription.lens_index_id,
                                      view_area_id: item.prescription.view_area_id,
                                      formula: {
                                        od_sph: item.prescription.od_sph,
                                        od_cyl: item.prescription.od_cyl,
                                        od_axis: item.prescription.od_axis,
                                        os_sph: item.prescription.os_sph,
                                        os_cyl: item.prescription.os_cyl,
                                        os_axis: item.prescription.os_axis,
                                        pd: item.prescription.pd,
                                        pd_dual_od: item.prescription.pd_dual_od,
                                        pd_dual_os: item.prescription.pd_dual_os,
                                        add_value: item.prescription.add_value,
                                      },
                                      prescription_image_url: item.prescription.prescription_image_url,
                                    }}
                                    lensTypes={lensTypes}
                                    lensIndexes={lensIndexes}
                                    viewAreas={viewAreas}
                                    prescriptionTypes={prescriptionTypes}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="mt-6 flex justify-between">
              <Button
                onClick={handlePrevStep}
                variant="outline"
                disabled={currentStep === 'shipping' || isProcessing}
              >
                ← Atrás
              </Button>

              {currentStep !== 'review' ? (
                <Button
                  onClick={handleNextStep}
                  disabled={isProcessing}
                >
                  Siguiente →
                </Button>
              ) : (
                <Button onClick={handlePlaceOrder} disabled={isProcessing}>
                  {isProcessing ? 'Redirigiendo a pago...' : `Continuar al Pago ($${totals.total.toFixed(2)} USD)`}
                </Button>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Resumen del Pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Lentes y Tratamientos</span>
                    <span>${totals.prescriptionCosts.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Envío</span>
                    <span>${totals.shippingCost.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${totals.total.toFixed(2)}</span>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-2">
                      {cartItems.length} {cartItems.length === 1 ? 'artículo' : 'artículos'}
                    </p>
                    <div className="space-y-2">
                      {cartItems.map((item) => (
                        <div key={item.id} className="text-sm flex gap-2">
                          {item.products.image_url && (
                            <img
                              src={item.products.image_url}
                              alt={item.products.name}
                              className="w-12 h-12 object-cover rounded border"
                            />
                          )}
                          <div className="flex-1 flex justify-between">
                            <span className="text-gray-600">
                              {item.products.name} × {item.quantity}
                            </span>
                            <span className="font-medium">${(item.products.price * item.quantity).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
