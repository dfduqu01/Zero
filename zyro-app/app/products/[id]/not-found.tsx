import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Producto No Encontrado</h2>
        <p className="text-gray-600 mb-8">
          Lo sentimos, el producto que buscas no existe o ya no está disponible.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/products"
            className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Ver Todos los Productos
          </Link>
          <Link
            href="/"
            className="border border-gray-300 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Volver al Inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
