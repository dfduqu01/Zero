import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Settings, ShoppingCart, User } from 'lucide-react';
import { MobileMenu } from './mobile-menu';

export async function SiteHeader() {
  const supabase = await createClient();

  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser();

  // Check if user is admin
  let isAdmin = false;
  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    isAdmin = userData?.is_admin || false;
  }

  return (
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            Zyro
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/products" className="text-sm font-medium hover:text-gray-600">
              Productos
            </Link>
            <Link href="/about" className="text-sm font-medium hover:text-gray-600">
              Nosotros
            </Link>
            <Link href="/cart" className="text-sm font-medium hover:text-gray-600">
              Carrito
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Settings className="h-4 w-4" />
                Admin
              </Link>
            )}
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

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center gap-4">
            <Link href="/cart" className="p-2 hover:bg-gray-100 rounded-md">
              <ShoppingCart className="h-5 w-5" />
            </Link>
            <Link href={user ? "/profile" : "/auth/login"} className="p-2 hover:bg-gray-100 rounded-md">
              <User className="h-5 w-5" />
            </Link>
            <MobileMenu isAdmin={isAdmin} />
          </div>
        </div>
      </div>
    </header>
  );
}
