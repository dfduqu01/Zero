import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Search } from 'lucide-react';

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const statusFilter = params.status;
  const searchQuery = params.search;

  // Build query
  let query = supabase
    .from('orders')
    .select(`
      id,
      order_number,
      status,
      payment_status,
      total,
      created_at,
      shipping_address_snapshot
    `)
    .order('created_at', { ascending: false });

  // Apply status filter
  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  // Apply search filter (search by order number)
  if (searchQuery) {
    query = query.ilike('order_number', `%${searchQuery}%`);
  }

  const { data: orders } = await query;

  // Count orders by status
  const { data: allOrders } = await supabase
    .from('orders')
    .select('status');

  const statusCounts = {
    all: allOrders?.length || 0,
    pending: allOrders?.filter(o => o.status === 'pending').length || 0,
    processing: allOrders?.filter(o => o.status === 'processing').length || 0,
    shipped: allOrders?.filter(o => o.status === 'shipped').length || 0,
    delivered: allOrders?.filter(o => o.status === 'delivered').length || 0,
    cancelled: allOrders?.filter(o => o.status === 'cancelled').length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Pedidos</h1>
        <p className="text-gray-600 mt-2">
          Administra y rastrea todos los pedidos de clientes
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <StatCard
          label="Todos"
          count={statusCounts.all}
          status="all"
          active={!statusFilter || statusFilter === 'all'}
        />
        <StatCard
          label="Pendientes"
          count={statusCounts.pending}
          status="pending"
          color="yellow"
          active={statusFilter === 'pending'}
        />
        <StatCard
          label="Procesando"
          count={statusCounts.processing}
          status="processing"
          color="blue"
          active={statusFilter === 'processing'}
        />
        <StatCard
          label="Enviados"
          count={statusCounts.shipped}
          status="shipped"
          color="purple"
          active={statusFilter === 'shipped'}
        />
        <StatCard
          label="Entregados"
          count={statusCounts.delivered}
          status="delivered"
          color="green"
          active={statusFilter === 'delivered'}
        />
        <StatCard
          label="Cancelados"
          count={statusCounts.cancelled}
          status="cancelled"
          color="red"
          active={statusFilter === 'cancelled'}
        />
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <form action="/admin/orders" method="get" className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                name="search"
                placeholder="Buscar por número de pedido..."
                defaultValue={searchQuery}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Buscar
            </button>
            {(searchQuery || (statusFilter && statusFilter !== 'all')) && (
              <Link
                href="/admin/orders"
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Limpiar
              </Link>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Pedidos ({orders?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!orders || orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No se encontraron pedidos</h3>
              <p className="mt-2 text-sm text-gray-500">
                {searchQuery || statusFilter
                  ? 'Intenta ajustar tus filtros o búsqueda.'
                  : 'Los pedidos aparecerán aquí una vez que los clientes los realicen.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Número de Pedido
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pago
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {order.order_number}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {order.shipping_address_snapshot?.full_name || 'N/A'}
                          </div>
                          <div className="text-gray-500">
                            {order.shipping_address_snapshot?.country || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString('es-MX', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <PaymentBadge status={order.payment_status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        ${parseFloat(order.total).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Ver Detalles →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Stat Card Component
function StatCard({
  label,
  count,
  status,
  color = 'gray',
  active,
}: {
  label: string;
  count: number;
  status: string;
  color?: string;
  active?: boolean;
}) {
  const colors = {
    gray: 'bg-gray-100 text-gray-800 border-gray-300',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    blue: 'bg-blue-100 text-blue-800 border-blue-300',
    purple: 'bg-purple-100 text-purple-800 border-purple-300',
    green: 'bg-green-100 text-green-800 border-green-300',
    red: 'bg-red-100 text-red-800 border-red-300',
  };

  return (
    <Link
      href={`/admin/orders?status=${status}`}
      className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
        active ? `${colors[color as keyof typeof colors]} border-opacity-100` : 'bg-white border-gray-200'
      }`}
    >
      <div className="text-sm font-medium">{label}</div>
      <div className="text-2xl font-bold mt-1">{count}</div>
    </Link>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const badges = {
    pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
    processing: { label: 'Procesando', color: 'bg-blue-100 text-blue-800' },
    shipped: { label: 'Enviado', color: 'bg-purple-100 text-purple-800' },
    delivered: { label: 'Entregado', color: 'bg-green-100 text-green-800' },
    cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
  };

  const badge = badges[status as keyof typeof badges] || badges.pending;

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
      {badge.label}
    </span>
  );
}

// Payment Badge Component
function PaymentBadge({ status }: { status: string }) {
  const badges = {
    completed: { label: 'Pagado', color: 'bg-green-100 text-green-800' },
    pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
    failed: { label: 'Fallido', color: 'bg-red-100 text-red-800' },
  };

  const badge = badges[status as keyof typeof badges] || badges.pending;

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
      {badge.label}
    </span>
  );
}
