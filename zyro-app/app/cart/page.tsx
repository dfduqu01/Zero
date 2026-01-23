import CartClient from './CartClient';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

export const metadata = {
  title: 'Carrito de Compras | Zyro Online',
  description: 'Revisa tu carrito de compras',
};

export default function CartPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <SiteHeader />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Carrito de Compras</h1>
          <p className="text-gray-600">
            Revisa tus productos antes de continuar con la compra
          </p>
        </div>

        {/* Cart Content */}
        <CartClient />
      </main>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}
