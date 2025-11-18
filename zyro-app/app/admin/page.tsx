import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ShoppingCart,
  FileText,
  DollarSign,
  TrendingUp,
  Package,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch dashboard statistics
  const [ordersResult, prescriptionsResult, productsResult] = await Promise.all([
    supabase.from('orders').select('id, total, status, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('order_item_prescriptions').select('id, validation_status').eq('validation_status', 'pending'),
    supabase.from('products').select('id, name, stock_quantity').lte('stock_quantity', 10),
  ]);

  const orders = ordersResult.data || [];
  const pendingPrescriptions = prescriptionsResult.data || [];
  const lowStockProducts = productsResult.data || [];

  // Calculate total revenue (simple sum - in production you'd filter by date range)
  const totalRevenue = orders.reduce((sum, order) => {
    if (order.status !== 'cancelled') {
      return sum + parseFloat(order.total);
    }
    return sum;
  }, 0);

  // Count orders by status
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const processingOrders = orders.filter(o => o.status === 'processing').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Panel de Control</h1>
        <p className="text-gray-600 mt-2">
          ¡Bienvenido! Aquí está lo que está sucediendo con tu tienda.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pedidos Recientes
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-gray-500 mt-1">Últimos 5 pedidos</p>
          </CardContent>
        </Card>

        {/* Pending Prescriptions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Validaciones Pendientes
            </CardTitle>
            <FileText className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPrescriptions.length}</div>
            <p className="text-xs text-gray-500 mt-1">Requieren revisión</p>
          </CardContent>
        </Card>

        {/* Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Ingresos Totales
            </CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1">De pedidos recientes</p>
          </CardContent>
        </Card>

        {/* Low Stock */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Productos con Stock Bajo
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockProducts.length}</div>
            <p className="text-xs text-gray-500 mt-1">≤ 10 unidades</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Pedidos Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className="text-gray-500 text-sm">No hay pedidos recientes</p>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        Pedido #{order.id.substring(0, 8)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${parseFloat(order.total).toFixed(2)}</p>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          order.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : order.status === 'processing'
                            ? 'bg-blue-100 text-blue-800'
                            : order.status === 'shipped'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {order.status === 'pending' ? 'Pendiente' :
                         order.status === 'processing' ? 'Procesando' :
                         order.status === 'shipped' ? 'Enviado' :
                         order.status === 'delivered' ? 'Entregado' : order.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <Link
              href="/admin/orders"
              className="block mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Ver todos los pedidos →
            </Link>
          </CardContent>
        </Card>

        {/* Alerts & Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Alertas y Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Pending Prescriptions Alert */}
            {pendingPrescriptions.length > 0 && (
              <Link
                href="/admin/prescriptions"
                className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors"
              >
                <FileText className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-sm text-yellow-900">
                    {pendingPrescriptions.length} Prescripción{pendingPrescriptions.length > 1 ? 'es' : ''} Pendiente{pendingPrescriptions.length > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-yellow-700">Requieren validación</p>
                </div>
              </Link>
            )}

            {/* Low Stock Alert */}
            {lowStockProducts.length > 0 && (
              <Link
                href="/admin/products"
                className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
              >
                <Package className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-medium text-sm text-orange-900">
                    {lowStockProducts.length} Producto{lowStockProducts.length > 1 ? 's' : ''} con Stock Bajo
                  </p>
                  <p className="text-xs text-orange-700">Reabastecimiento necesario</p>
                </div>
              </Link>
            )}

            {/* Pending Orders */}
            {pendingOrders > 0 && (
              <Link
                href="/admin/orders"
                className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <ShoppingCart className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-sm text-blue-900">
                    {pendingOrders} Pedido{pendingOrders > 1 ? 's' : ''} Pendiente{pendingOrders > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-blue-700">Esperando procesamiento</p>
                </div>
              </Link>
            )}

            {/* All clear state */}
            {pendingPrescriptions.length === 0 && lowStockProducts.length === 0 && pendingOrders === 0 && (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-sm text-green-900">¡Todo al Día!</p>
                  <p className="text-xs text-green-700">No hay acciones pendientes</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
