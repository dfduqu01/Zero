import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export async function SiteHeader() {
  const supabase = await createClient();

  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            ZERO
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/products" className="text-sm font-medium hover:text-gray-600">
              Productos
            </Link>
            <Link href="/about" className="text-sm font-medium hover:text-gray-600">
              Nosotros
            </Link>
            <Link href="/contact" className="text-sm font-medium hover:text-gray-600">
              Contacto
            </Link>
            <Link href="/cart" className="text-sm font-medium hover:text-gray-600">
              Carrito
            </Link>
            {user ? (
              <Link href="/profile" className="text-sm font-medium bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800">
                Mi Perfil
              </Link>
            ) : (
              <Link href="/auth/login" className="text-sm font-medium bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800">
                Ingresar
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
