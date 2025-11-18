import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ProductsClient from './ProductsClient';
import type { ProductWithRelations } from '@/lib/types/product';

export default async function AdminProductsPage() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?redirectTo=/admin/products');
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

  // Fetch products with all relations
  const { data: products, error } = await supabase
    .from('products')
    .select(`
      *,
      brand:brands(*),
      category:categories(*),
      frame_material:frame_materials(*),
      frame_shape:frame_shapes(*),
      product_images(*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
  }

  // Sort product images by display_order
  const productsWithSortedImages: ProductWithRelations[] = (products || []).map(product => ({
    ...product,
    product_images: product.product_images?.sort((a, b) => a.display_order - b.display_order) || [],
  }));

  return <ProductsClient initialProducts={productsWithSortedImages} />;
}
