import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import ProductForm from '@/components/admin/ProductForm';
import type { ProductWithRelations } from '@/lib/types/product';

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?redirectTo=/admin/products/${id}`);
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

  // Fetch product
  const { data: product, error: productError } = await supabase
    .from('products')
    .select(`
      *,
      brand:brands(*),
      category:categories(*),
      frame_material:frame_materials(*),
      frame_shape:frame_shapes(*),
      product_images(*)
    `)
    .eq('id', id)
    .single();

  if (productError || !product) {
    notFound();
  }

  // Sort product images by display_order
  const productWithSortedImages: ProductWithRelations = {
    ...product,
    product_images: product.product_images?.sort((a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order) || [],
  };

  // Fetch lookup data for form
  const [
    { data: brands },
    { data: categories },
    { data: materials },
    { data: shapes },
  ] = await Promise.all([
    supabase.from('brands').select('*').order('name'),
    supabase.from('categories').select('*').order('name'),
    supabase.from('frame_materials').select('*').order('name'),
    supabase.from('frame_shapes').select('*').order('name'),
  ]);

  return (
    <ProductForm
      product={productWithSortedImages}
      brands={brands || []}
      categories={categories || []}
      materials={materials || []}
      shapes={shapes || []}
    />
  );
}
