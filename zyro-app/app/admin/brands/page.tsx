import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import BrandsClient from './BrandsClient';

export default async function AdminBrandsPage() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?redirectTo=/admin/brands');
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

  // Fetch all brands with product counts
  const { data: brands, error } = await supabase
    .from('brands')
    .select(`
      id,
      name,
      slug,
      is_active,
      created_at
    `)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching brands:', error);
  }

  // Get product counts per brand
  const { data: productCounts } = await supabase
    .from('products')
    .select('brand_id');

  const productCountMap = new Map<string, number>();
  productCounts?.forEach((product) => {
    if (product.brand_id) {
      const count = productCountMap.get(product.brand_id) || 0;
      productCountMap.set(product.brand_id, count + 1);
    }
  });

  // Combine brands with product counts
  const brandsWithCounts = brands?.map((brand) => ({
    ...brand,
    product_count: productCountMap.get(brand.id) || 0,
  })) || [];

  // Calculate statistics
  const totalBrands = brandsWithCounts.length;
  const activeBrands = brandsWithCounts.filter((b) => b.is_active).length;
  const inactiveBrands = totalBrands - activeBrands;
  const totalProducts = brandsWithCounts.reduce((sum, b) => sum + b.product_count, 0);
  const activeProducts = brandsWithCounts
    .filter((b) => b.is_active)
    .reduce((sum, b) => sum + b.product_count, 0);

  const stats = {
    totalBrands,
    activeBrands,
    inactiveBrands,
    totalProducts,
    activeProducts,
  };

  return <BrandsClient initialBrands={brandsWithCounts} stats={stats} />;
}
