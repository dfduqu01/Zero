import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import InventoryClient from './InventoryClient';

// Admin Inventory Management Page
export default async function AdminInventoryPage() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?redirectTo=/admin/inventory');
  }

  // Check if user is admin
  const { data: userData } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!userData?.is_admin) {
    redirect('/');
  }

  // Fetch all products with brand information
  const { data: rawProducts, error: productsError } = await supabase
    .from('products')
    .select(
      `
      id,
      sku,
      name,
      stock_quantity,
      low_stock_threshold,
      is_active,
      price,
      brand:brands!products_brand_id_fkey(id, name),
      category:categories!products_category_id_fkey(id, name)
    `
    )
    .order('name', { ascending: true });

  // Transform the data to match expected types (single objects instead of arrays)
  const products = rawProducts?.map((p: any) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    stock_quantity: p.stock_quantity,
    low_stock_threshold: p.low_stock_threshold,
    is_active: p.is_active,
    price: p.price,
    brand: Array.isArray(p.brand) ? p.brand[0] : p.brand,
    category: Array.isArray(p.category) ? p.category[0] : p.category,
  }));

  if (productsError) {
    console.error('Error fetching products:', productsError);
  }

  // Calculate stock statistics
  const totalProducts = products?.length || 0;
  const inStockCount =
    products?.filter((p) => p.stock_quantity > (p.low_stock_threshold || 5)).length || 0;
  const lowStockCount =
    products?.filter(
      (p) =>
        p.stock_quantity > 0 && p.stock_quantity <= (p.low_stock_threshold || 5)
    ).length || 0;
  const outOfStockCount = products?.filter((p) => p.stock_quantity === 0).length || 0;

  const stats = {
    totalProducts,
    inStockCount,
    lowStockCount,
    outOfStockCount,
  };

  return (
    <InventoryClient
      initialProducts={products || []}
      stats={stats}
      adminUserId={user.id}
    />
  );
}
