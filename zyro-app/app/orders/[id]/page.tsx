import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Package, Truck, CheckCircle2, Clock } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import PrescriptionSummary from '@/components/PrescriptionSummary';

export default async function OrderDetailPage({
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
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Pedido no encontrado
          </h1>
          <p className="text-gray-600 mb-6">
            No pudimos encontrar el pedido que estás buscando.
          </p>
          <Button asChild>
            <Link href="/orders">Ver todos mis pedidos</Link>
          </Button>
        </div>
      </div>
    );
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
    supabase.from('lens_types').select('*'),
    supabase.from('lens_indexes').select('*'),
    supabase.from('view_areas').select('*'),
    supabase.from('prescription_types').select('*'),
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

  // Fetch order status history
  const { data: statusHistory } = await supabase
    .from('order_status_history')
    .select('*')
    .eq('order_id', order.id)
    .order('created_at', { ascending: true });

  // Status badge helper
  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
      processing: { label: 'Procesando', color: 'bg-blue-100 text-blue-800' },
      shipped: { label: 'Enviado', color: 'bg-purple-100 text-purple-800' },
      delivered: { label: 'Entregado', color: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  const statusBadge = getStatusBadge(order.status);

  // Status timeline
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5" />;
      case 'processing':
        return <Package className="w-5 h-5" />;
      case 'shipped':
        return <Truck className="w-5 h-5" />;
      case 'delivered':
        return <CheckCircle2 className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <SiteHeader />
      <div className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/orders"
            className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-block"
          >
            ← Volver a mis pedidos
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Pedido {order.order_number}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Realizado el {new Date(order.created_at).toLocaleDateString('es-MX', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div>
              <span
                className={`px-4 py-2 rounded-full text-sm font-medium ${statusBadge.color}`}
              >
                {statusBadge.label}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Timeline */}
            {statusHistory && statusHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Estado del Pedido</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {statusHistory.map((history, index) => (
                      <div key={history.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`flex items-center justify-center w-10 h-10 rounded-full ${
                              index === statusHistory.length - 1
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            {getStatusIcon(history.to_status)}
                          </div>
                          {index < statusHistory.length - 1 && (
                            <div className="w-0.5 h-12 bg-gray-200 my-1" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="font-medium text-gray-900">
                            {getStatusBadge(history.to_status).label}
                          </p>
                          {history.notes && (
                            <p className="text-sm text-gray-600 mt-1">{history.notes}</p>
                          )}
                          {history.tracking_number && (
                            <p className="text-sm text-blue-600 mt-1">
                              Número de rastreo: {history.tracking_number}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(history.created_at).toLocaleString('es-MX', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tracking Information */}
            {order.tracking_number && (
              <Card>
                <CardHeader>
                  <CardTitle>Información de Rastreo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Número de Rastreo</span>
                      <span className="text-sm font-medium">{order.tracking_number}</span>
                    </div>
                    {order.tracking_carrier && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Transportista</span>
                        <span className="text-sm font-medium">
                          {order.tracking_carrier}
                        </span>
                      </div>
                    )}
                    {order.estimated_delivery_date && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Entrega Estimada
                        </span>
                        <span className="text-sm font-medium">
                          {new Date(order.estimated_delivery_date).toLocaleDateString(
                            'es-MX',
                            { year: 'numeric', month: 'long', day: 'numeric' }
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Productos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orderItems?.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 pb-4 border-b last:border-b-0"
                    >
                      {/* Product Image */}
                      {item.product_snapshot.image_url && (
                        <img
                          src={item.product_snapshot.image_url}
                          alt={item.product_snapshot.name}
                          className="w-24 h-24 object-cover rounded-md border flex-shrink-0"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {item.product_snapshot.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          SKU: {item.product_snapshot.sku}
                        </p>
                        <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>

                        {/* Prescription Details using PrescriptionSummary */}
                        {item.order_item_prescriptions &&
                          item.order_item_prescriptions.length > 0 && (
                            <div className="mt-3">
                              <PrescriptionSummary
                                prescription={{
                                  prescription_type_id: item.order_item_prescriptions[0].prescription_type_id,
                                  lens_type_id: item.order_item_prescriptions[0].lens_type_id,
                                  lens_index_id: item.order_item_prescriptions[0].lens_index_id,
                                  view_area_id: item.order_item_prescriptions[0].view_area_id,
                                  formula: {
                                    od_sph: item.order_item_prescriptions[0].od_sph,
                                    od_cyl: item.order_item_prescriptions[0].od_cyl,
                                    od_axis: item.order_item_prescriptions[0].od_axis,
                                    os_sph: item.order_item_prescriptions[0].os_sph,
                                    os_cyl: item.order_item_prescriptions[0].os_cyl,
                                    os_axis: item.order_item_prescriptions[0].os_axis,
                                    pd: item.order_item_prescriptions[0].pd,
                                    pd_dual_od: item.order_item_prescriptions[0].pd_dual_od,
                                    pd_dual_os: item.order_item_prescriptions[0].pd_dual_os,
                                    add_value: item.order_item_prescriptions[0].add_value,
                                  },
                                  prescription_image_url: item.order_item_prescriptions[0].prescription_image_url,
                                }}
                                lensTypes={lensTypes}
                                lensIndexes={lensIndexes}
                                viewAreas={viewAreas}
                                prescriptionTypes={prescriptionTypes}
                              />

                              {/* Validation Status */}
                              {item.order_item_prescriptions[0].validation_status && (
                                <div className="mt-3 pt-3 border-t">
                                  <span
                                    className={`text-xs px-2 py-1 rounded ${
                                      item.order_item_prescriptions[0]
                                        .validation_status === 'approved'
                                        ? 'bg-green-100 text-green-800'
                                        : item.order_item_prescriptions[0]
                                            .validation_status === 'rejected'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}
                                  >
                                    Validación:{' '}
                                    {item.order_item_prescriptions[0].validation_status ===
                                    'approved'
                                      ? 'Aprobada'
                                      : item.order_item_prescriptions[0]
                                          .validation_status === 'rejected'
                                      ? 'Rechazada'
                                      : 'Pendiente'}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                      </div>

                      <div className="text-right sm:text-right">
                        <p className="font-semibold text-gray-900">
                          ${item.subtotal.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600">
                          ${item.unit_price.toFixed(2)} c/u
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Resumen del Pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
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
                    <span className="text-gray-900">
                      ${order.shipping_cost.toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t pt-3 flex justify-between font-semibold">
                    <span className="text-gray-900">Total</span>
                    <span className="text-blue-600">${order.total.toFixed(2)} USD</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle>Dirección de Envío</CardTitle>
              </CardHeader>
              <CardContent>
                {order.shipping_address_snapshot && (
                  <div className="text-sm text-gray-600">
                    <p className="font-medium text-gray-900">
                      {order.shipping_address_snapshot.full_name}
                    </p>
                    <p className="mt-2">{order.shipping_address_snapshot.address_line_1}</p>
                    {order.shipping_address_snapshot.address_line_2 && (
                      <p>{order.shipping_address_snapshot.address_line_2}</p>
                    )}
                    <p>
                      {order.shipping_address_snapshot.city},{' '}
                      {order.shipping_address_snapshot.state_province}{' '}
                      {order.shipping_address_snapshot.postal_code}
                    </p>
                    <p>{order.shipping_address_snapshot.country}</p>
                    <p className="mt-2">{order.shipping_address_snapshot.phone}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Info */}
            <Card>
              <CardHeader>
                <CardTitle>Información de Pago</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Método</span>
                    <span className="text-gray-900">{order.payment_method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estado</span>
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
                  </div>
                  {order.payment_transaction_id && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">ID de Transacción</span>
                      <span className="text-gray-900 text-xs font-mono">
                        {order.payment_transaction_id}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
