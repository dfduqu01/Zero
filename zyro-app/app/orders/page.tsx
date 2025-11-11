import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Package } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';

export default async function OrdersPage() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?redirectTo=/orders');
  }

  // Fetch user's orders
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      status,
      total,
      created_at,
      payment_status
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Get order item counts
  const ordersWithItemCounts = orders
    ? await Promise.all(
        orders.map(async (order) => {
          const { count } = await supabase
            .from('order_items')
            .select('*', { count: 'exact', head: true })
            .eq('order_id', order.id);

          return {
            ...order,
            itemCount: count || 0,
          };
        })
      )
    : [];

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

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Pedidos</h1>
          <p className="text-gray-600">
            Revisa el estado y detalles de todos tus pedidos
          </p>
        </div>

        {/* Orders List */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            Error al cargar tus pedidos. Por favor intenta de nuevo.
          </div>
        )}

        {ordersWithItemCounts.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No tienes pedidos aún
                </h3>
                <p className="text-gray-600 mb-6">
                  Comienza a explorar nuestros productos y realiza tu primer pedido
                </p>
                <Button asChild>
                  <Link href="/products">Explorar Productos</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {ordersWithItemCounts.map((order) => {
              const statusBadge = getStatusBadge(order.status);
              return (
                <Card
                  key={order.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Order Info */}
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Package className="w-6 h-6 text-blue-600" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              Pedido {order.order_number}
                            </h3>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                              <span>
                                {new Date(order.created_at).toLocaleDateString('es-MX', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                              <span>•</span>
                              <span>
                                {order.itemCount}{' '}
                                {order.itemCount === 1 ? 'artículo' : 'artículos'}
                              </span>
                              <span>•</span>
                              <span className="font-medium text-gray-900">
                                ${order.total.toFixed(2)} USD
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Status and Action */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 lg:flex-shrink-0">
                        <div className="flex flex-col gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${statusBadge.color}`}
                          >
                            {statusBadge.label}
                          </span>
                          {order.payment_status === 'pending' && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                              Pago Pendiente
                            </span>
                          )}
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/orders/${order.id}`}>Ver Detalles →</Link>
                        </Button>
                      </div>
                    </div>

                    {/* Additional Info for specific statuses */}
                    {order.status === 'shipped' && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          📦 Tu pedido ha sido enviado. Haz clic para ver el número de
                          rastreo.
                        </p>
                      </div>
                    )}
                    {order.status === 'delivered' && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm text-green-600">
                          ✓ Pedido entregado exitosamente
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Help Section */}
        {ordersWithItemCounts.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>¿Necesitas ayuda con un pedido?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Si tienes preguntas sobre algún pedido, nuestro equipo de soporte está
                listo para ayudarte.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" asChild>
                  <Link href="/contact">Contactar Soporte</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/profile">Ver Mi Perfil</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
