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
  // Note: Supabase PostgREST has a hard max-rows limit (default 1000)
  // We need to fetch in chunks and combine the results

  const CHUNK_SIZE = 1000;
  const productMap = new Map(); // Use Map to deduplicate by ID
  let hasMore = true;
  let offset = 0;
  let error = null;

  while (hasMore) {
    const { data: chunk, error: chunkError } = await supabase
      .from('products')
      .select(`
        *,
        brand:brands(*),
        category:categories(*),
        frame_material:frame_materials(*),
        frame_shape:frame_shapes(*),
        product_images(*)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + CHUNK_SIZE - 1);

    if (chunkError) {
      console.error(`Error fetching products chunk at offset ${offset}:`, chunkError);
      error = chunkError;
      break;
    }

    if (!chunk || chunk.length === 0) {
      hasMore = false;
      break;
    }

    // Add products to Map to automatically deduplicate by ID
    chunk.forEach(product => {
      productMap.set(product.id, product);
    });

    // If we got fewer rows than requested, we've reached the end
    if (chunk.length < CHUNK_SIZE) {
      hasMore = false;
    } else {
      offset += CHUNK_SIZE;
    }
  }

  // Convert Map back to array
  const products = Array.from(productMap.values());

  if (error) {
    console.error('Error fetching products:', error);
  }

  // Sort product images by display_order
  const productsWithSortedImages: ProductWithRelations[] = (products || []).map(product => ({
    ...product,
    product_images: product.product_images?.sort((a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order) || [],
  }));

  return <ProductsClient initialProducts={productsWithSortedImages} />;
}
