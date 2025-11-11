import CartClient from './CartClient';
import { SiteHeader } from '@/components/site-header';

export const metadata = {
  title: 'Carrito de Compras | ZERO',
  description: 'Revisa tu carrito de compras',
};

export default function CartPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <SiteHeader />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-500">
            <p>&copy; 2025 ZERO Eyewear. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
