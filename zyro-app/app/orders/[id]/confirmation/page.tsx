import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import PrescriptionSummary from '@/components/PrescriptionSummary';

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id } = await params;

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch order with all details
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      addresses (
        full_name,
        phone,
        country,
        address_line_1,
        address_line_2,
        city,
        state_province,
        postal_code
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !order) {
    redirect('/');
  }

  // Fetch order items first
  const { data: orderItemsData } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', order.id);

  // Fetch prescriptions for all order items separately
  const orderItemIds = orderItemsData?.map(item => item.id) || [];

  const [prescriptionsResult, lensTypesResult, lensIndexesResult, viewAreasResult, prescriptionTypesResult] = await Promise.all([
    orderItemIds.length > 0
      ? supabase
          .from('order_item_prescriptions')
          .select('*')
          .in('order_item_id', orderItemIds)
      : Promise.resolve({ data: [] }),
    supabase.from('lens_types').select('id, name, slug, description, price_modifier, is_active'),
    supabase.from('lens_indexes').select('id, name, slug, description, price_modifier, index_value, is_active'),
    supabase.from('view_areas').select('id, name, slug, description, price_modifier, is_active'),
    supabase.from('prescription_types').select('id, name, slug, description, is_active'),
  ]);

  const prescriptions = prescriptionsResult.data || [];

  // Combine order items with their prescriptions
  const orderItems = orderItemsData?.map(item => ({
    ...item,
    order_item_prescriptions: prescriptions.filter(p => p.order_item_id === item.id)
  }));

  const lensTypes = lensTypesResult.data || [];
  const lensIndexes = lensIndexesResult.data || [];
  const viewAreas = viewAreasResult.data || [];
  const prescriptionTypes = prescriptionTypesResult.data || [];

  // Debug: Log data to see what we have
  console.log('📦 Order Items:', orderItems?.length);
  console.log('💊 Prescriptions fetched:', prescriptions.length);
  console.log('👓 Lens Types:', lensTypes.length);
  console.log('🔍 Lens Indexes:', lensIndexes.length);
  console.log('👁️ View Areas:', viewAreas.length);
  console.log('📋 Prescription Types:', prescriptionTypes.length);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ¡Pedido Confirmado!
          </h1>
          <p className="text-gray-600">
            Gracias por tu compra. Hemos recibido tu pedido y lo procesaremos pronto.
          </p>
        </div>

        {/* Order Number */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Número de Pedido</p>
              <p className="text-2xl font-bold text-blue-600">{order.order_number}</p>
              <p className="text-sm text-gray-500 mt-2">
                Te hemos enviado un correo de confirmación a tu email
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Detalles del Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Shipping Address */}
            <div>
              <h3 className="font-semibold mb-2 text-sm text-gray-700">
                Dirección de Envío
              </h3>
              {order.shipping_address_snapshot && (
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium text-gray-900">
                    {order.shipping_address_snapshot.full_name}
                  </p>
                  <p>{order.shipping_address_snapshot.address_line_1}</p>
                  {order.shipping_address_snapshot.address_line_2 && (
                    <p>{order.shipping_address_snapshot.address_line_2}</p>
                  )}
                  <p>
                    {order.shipping_address_snapshot.city},{' '}
                    {order.shipping_address_snapshot.state_province}{' '}
                    {order.shipping_address_snapshot.postal_code}
                  </p>
                  <p>{order.shipping_address_snapshot.country}</p>
                  <p className="mt-1">{order.shipping_address_snapshot.phone}</p>
                </div>
              )}
            </div>

            {/* Shipping Method */}
            <div>
              <h3 className="font-semibold mb-2 text-sm text-gray-700">
                Método de Envío
              </h3>
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <p>{order.shipping_method}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Recibirás un email con el número de rastreo cuando se envíe tu pedido
                </p>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h3 className="font-semibold mb-3 text-sm text-gray-700">Productos</h3>
              <div className="space-y-3">
                {orderItems?.map((item) => {
                  const prescription = item.order_item_prescriptions?.[0];

                  return (
                    <div key={item.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {item.product_snapshot.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            SKU: {item.product_snapshot.sku}
                          </p>
                          <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            ${item.subtotal.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">
                            ${item.unit_price.toFixed(2)} c/u
                          </p>
                        </div>
                      </div>

                      {/* DEBUG: Show if prescription exists */}
                      {prescription && <p className="text-xs text-gray-500 mt-2">✓ Prescription data found</p>}
                      {!prescription && <p className="text-xs text-red-500 mt-2">⚠ No prescription data</p>}

                      {/* Show prescription details using PrescriptionSummary */}
                      {prescription && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs mb-2 text-gray-500">Prescription IDs: type={prescription.prescription_type_id?.substring(0,8)}, lens={prescription.lens_type_id?.substring(0,8)}</p>
                          <PrescriptionSummary
                            prescription={{
                              prescription_type_id: prescription.prescription_type_id,
                              lens_type_id: prescription.lens_type_id,
                              lens_index_id: prescription.lens_index_id,
                              view_area_id: prescription.view_area_id,
                              formula: {
                                od_sph: prescription.od_sph,
                                od_cyl: prescription.od_cyl,
                                od_axis: prescription.od_axis,
                                os_sph: prescription.os_sph,
                                os_cyl: prescription.os_cyl,
                                os_axis: prescription.os_axis,
                                pd: prescription.pd,
                                pd_dual_od: prescription.pd_dual_od,
                                pd_dual_os: prescription.pd_dual_os,
                                add_value: prescription.add_value,
                              },
                              prescription_image_url: prescription.prescription_image_url,
                            }}
                            lensTypes={lensTypes}
                            lensIndexes={lensIndexes}
                            viewAreas={viewAreas}
                            prescriptionTypes={prescriptionTypes}
                            compact
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Summary */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3 text-sm text-gray-700">
                Resumen de Pago
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">${order.subtotal.toFixed(2)}</span>
                </div>
                {order.treatments_cost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Lentes y Tratamientos</span>
                    <span className="text-gray-900">
                      ${order.treatments_cost.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Envío</span>
                  <span className="text-gray-900">${order.shipping_cost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-bold border-t pt-2 mt-2">
                  <span className="text-gray-900">Total</span>
                  <span className="text-blue-600">${order.total.toFixed(2)} USD</span>
                </div>
              </div>
            </div>

            {/* Payment Status */}
            <div>
              <h3 className="font-semibold mb-2 text-sm text-gray-700">
                Estado del Pago
              </h3>
              <div className="text-sm bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      order.payment_status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : order.payment_status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {order.payment_status === 'completed'
                      ? 'Pagado'
                      : order.payment_status === 'pending'
                      ? 'Pendiente'
                      : 'Fallido'}
                  </span>
                  <span className="text-gray-600">{order.payment_method}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild className="flex-1">
            <Link href={`/orders/${order.id}`}>Ver Detalles del Pedido</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="/products">Continuar Comprando</Link>
          </Button>
        </div>

        {/* Additional Info */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">¿Qué sigue?</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Recibirás un email de confirmación con los detalles de tu pedido</li>
            <li>
              • Procesaremos tu pedido dentro de las próximas 24-48 horas hábiles
            </li>
            <li>• Te notificaremos cuando tu pedido sea enviado con información de rastreo</li>
            <li>
              • Si incluiste una receta, nuestro equipo la validará antes de fabricar tus
              lentes
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
