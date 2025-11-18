import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Package, MapPin, CreditCard, Clock } from 'lucide-react';
import OrderStatusForm from './OrderStatusForm';
import PrescriptionSummary from '@/components/PrescriptionSummary';

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id } = await params;

  // Fetch order details
  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !order) {
    redirect('/admin/orders');
  }

  // Fetch order items with prescriptions
  const { data: orderItemsData } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', id);

  const orderItemIds = orderItemsData?.map((item) => item.id) || [];

  // Fetch prescriptions and metadata
  const [prescriptionsResult, lensTypesResult, lensIndexesResult, viewAreasResult, prescriptionTypesResult] = await Promise.all([
    orderItemIds.length > 0
      ? supabase.from('order_item_prescriptions').select('*').in('order_item_id', orderItemIds)
      : Promise.resolve({ data: [] }),
    supabase.from('lens_types').select('id, name, slug, description, price_modifier, is_active'),
    supabase.from('lens_indexes').select('id, name, slug, description, price_modifier, index_value, is_active'),
    supabase.from('view_areas').select('id, name, slug, description, price_modifier, is_active'),
    supabase.from('prescription_types').select('id, name, slug, description, is_active'),
  ]);

  const prescriptions = prescriptionsResult.data || [];
  const lensTypes = lensTypesResult.data || [];
  const lensIndexes = lensIndexesResult.data || [];
  const viewAreas = viewAreasResult.data || [];
  const prescriptionTypes = prescriptionTypesResult.data || [];

  // Combine order items with prescriptions
  const orderItems = orderItemsData?.map((item) => ({
    ...item,
    order_item_prescriptions: prescriptions.filter((p) => p.order_item_id === item.id),
  }));

  // Fetch status history
  const { data: statusHistory } = await supabase
    .from('order_status_history')
    .select('*')
    .eq('order_id', id)
    .order('created_at', { ascending: true });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/orders"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Order {order.order_number}</h1>
          <p className="text-gray-600 mt-1">
            Placed on {new Date(order.created_at).toLocaleDateString('es-MX', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <div>
          <StatusBadge status={order.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Update Form */}
          <Card>
            <CardHeader>
              <CardTitle>Update Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderStatusForm
                orderId={order.id}
                currentStatus={order.status}
                currentTrackingNumber={order.tracking_number}
                currentTrackingCarrier={order.tracking_carrier}
              />
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orderItems?.map((item) => {
                  const prescription = item.order_item_prescriptions?.[0];

                  return (
                    <div key={item.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                      <div className="flex justify-between mb-2">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {item.product_snapshot.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            SKU: {item.product_snapshot.sku}
                          </p>
                          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                          <p className="text-sm text-gray-600">
                            Unit Price: ${parseFloat(item.unit_price).toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            ${parseFloat(item.subtotal).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Prescription Details */}
                      {prescription && (
                        <div className="mt-3 bg-blue-50 p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-blue-900">Prescription Details</h4>
                            <ValidationStatusBadge status={prescription.validation_status} />
                          </div>

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
                          />

                          {prescription.validation_notes && (
                            <div className="mt-3 pt-3 border-t border-blue-200">
                              <p className="text-sm font-medium text-blue-900">Validation Notes:</p>
                              <p className="text-sm text-blue-800 mt-1">{prescription.validation_notes}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Status History */}
          {statusHistory && statusHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Status History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statusHistory.map((history, index) => (
                    <div key={history.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-full ${
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
                          Status: {history.to_status}
                        </p>
                        {history.notes && (
                          <p className="text-sm text-gray-600 mt-1">{history.notes}</p>
                        )}
                        {history.tracking_number && (
                          <p className="text-sm text-blue-600 mt-1">
                            Tracking: {history.tracking_number}
                            {history.tracking_carrier && ` (${history.tracking_carrier})`}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(history.created_at).toLocaleString('es-MX')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">${parseFloat(order.subtotal).toFixed(2)}</span>
              </div>
              {parseFloat(order.treatments_cost) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Lenses & Treatments</span>
                  <span className="text-gray-900">${parseFloat(order.treatments_cost).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span className="text-gray-900">${parseFloat(order.shipping_cost).toFixed(2)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-semibold">
                <span className="text-gray-900">Total</span>
                <span className="text-blue-600">${parseFloat(order.total).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin size={18} />
                <CardTitle>Shipping Address</CardTitle>
              </div>
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
              <div className="flex items-center gap-2">
                <CreditCard size={18} />
                <CardTitle>Payment Info</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Method</span>
                <span className="text-gray-900">{order.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <PaymentBadge status={order.payment_status} />
              </div>
              {order.payment_transaction_id && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID</span>
                  <span className="text-gray-900 text-xs font-mono">
                    {order.payment_transaction_id}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const badges = {
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    processing: { label: 'Processing', color: 'bg-blue-100 text-blue-800' },
    shipped: { label: 'Shipped', color: 'bg-purple-100 text-purple-800' },
    delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800' },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  };

  const badge = badges[status as keyof typeof badges] || badges.pending;

  return (
    <span className={`px-4 py-2 rounded-full text-sm font-medium ${badge.color}`}>
      {badge.label}
    </span>
  );
}

// Payment Badge Component
function PaymentBadge({ status }: { status: string }) {
  const badges = {
    completed: { label: 'Paid', color: 'bg-green-100 text-green-800' },
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    failed: { label: 'Failed', color: 'bg-red-100 text-red-800' },
  };

  const badge = badges[status as keyof typeof badges] || badges.pending;

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${badge.color}`}>
      {badge.label}
    </span>
  );
}

// Validation Status Badge
function ValidationStatusBadge({ status }: { status: string | null }) {
  if (!status) return null;

  const badges = {
    pending: { label: 'Pending Validation', color: 'bg-yellow-100 text-yellow-800' },
    approved: { label: 'Approved', color: 'bg-green-100 text-green-800' },
    rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
  };

  const badge = badges[status as keyof typeof badges] || badges.pending;

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${badge.color}`}>
      {badge.label}
    </span>
  );
}

// Get Status Icon
function getStatusIcon(status: string) {
  switch (status) {
    case 'pending':
      return <Clock size={16} />;
    case 'processing':
    case 'shipped':
    case 'delivered':
      return <Package size={16} />;
    default:
      return <Clock size={16} />;
  }
}
