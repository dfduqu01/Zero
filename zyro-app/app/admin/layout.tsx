import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FileText,
  Settings,
  Users,
  LogOut,
  Warehouse,
} from 'lucide-react';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?redirectTo=/admin');
  }

  // Check if user is admin
  const { data: userData } = await supabase
    .from('users')
    .select('is_admin, name')
    .eq('id', user.id)
    .single();

  if (!userData?.is_admin) {
    // Not an admin - redirect to home
    redirect('/');
  }

  // Logout handler would be client-side, so we'll create a client component for that
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        {/* Logo/Brand */}
        <div className="p-6 border-b border-gray-800">
          <Link href="/admin" className="text-2xl font-bold">
            ZERO Admin
          </Link>
          <p className="text-sm text-gray-400 mt-1">{userData.name}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <NavLink href="/admin" icon={<LayoutDashboard size={20} />}>
            Dashboard
          </NavLink>

          <NavLink href="/admin/orders" icon={<ShoppingCart size={20} />}>
            Orders
          </NavLink>

          <NavLink href="/admin/prescriptions" icon={<FileText size={20} />}>
            Prescriptions
          </NavLink>

          <NavLink href="/admin/products" icon={<Package size={20} />}>
            Products
          </NavLink>

          <NavLink href="/admin/inventory" icon={<Warehouse size={20} />}>
            Inventory
          </NavLink>

          <NavLink href="/admin/prescription-config" icon={<Settings size={20} />}>
            Prescription Config
          </NavLink>

          <NavLink href="/admin/users" icon={<Users size={20} />}>
            Users
          </NavLink>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 rounded hover:bg-gray-800 transition-colors"
          >
            <LogOut size={20} />
            <span>Back to Store</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}

// Navigation Link Component
function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors"
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}
