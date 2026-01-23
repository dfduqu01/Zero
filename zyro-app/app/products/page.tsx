import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import ProductsClient from './ProductsClient';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

export const metadata = {
  title: 'Productos | Zyro Online',
  description: 'Explora nuestra colección de gafas premium',
};

export default async function ProductsPage() {
  const supabase = await createClient();

  // Fetch products with all related data
  // Note: Supabase PostgREST has a hard max-rows limit (default 1000)
  // We need to fetch in chunks and combine the results

  const CHUNK_SIZE = 1000;
  const productMap = new Map(); // Use Map to deduplicate by ID
  let hasMore = true;
  let offset = 0;

  while (hasMore) {
    const { data: chunk, error: chunkError } = await supabase
      .from('products')
      .select(`
        *,
        brand:brands!inner(id, name, slug, is_active),
        category:categories(id, name, slug),
        frame_material:frame_materials(id, name),
        frame_shape:frame_shapes(id, name),
        product_images(id, image_url, cloudfront_url, display_order)
      `)
      .eq('is_active', true)
      .eq('brand.is_active', true)
      .order('created_at', { ascending: false})
      .range(offset, offset + CHUNK_SIZE - 1);

    if (chunkError) {
      console.error(`Error fetching products chunk at offset ${offset}:`, chunkError);
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
  const productsError = products.length === 0 ? new Error('No products found') : null;

  // Fetch filter options (only active brands)
  const [
    { data: brands },
    { data: categoriesRaw },
    { data: materials },
    { data: shapes }
  ] = await Promise.all([
    supabase.from('brands').select('id, name, slug').eq('is_active', true).order('name'),
    supabase.from('categories').select('id, name, slug').order('display_order'),
    supabase.from('frame_materials').select('id, name').order('name'),
    supabase.from('frame_shapes').select('id, name').order('name'),
  ]);

  // Filter categories to only show Aros opticos and Sol (the ones with inventory)
  const categories = categoriesRaw?.filter((cat) =>
    cat.slug === 'aros-opticos' ||
    cat.slug === 'sol'
  ) || [];

  if (productsError) {
    console.error('Error fetching products:', productsError);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error al Cargar Productos</h1>
          <p className="text-gray-600">{productsError.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <SiteHeader />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Todos los Productos</h1>
          <p className="text-gray-600">
            Descubre nuestra colección de gafas premium
          </p>
        </div>

        {/* Products with Filters */}
        {!products || products.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-gray-500 text-lg">No hay productos disponibles aún.</p>
            <Link href="/" className="mt-4 inline-block text-blue-600 hover:text-blue-700">
              Volver al Inicio
            </Link>
          </div>
        ) : (
          <ProductsClient
            products={products}
            filterOptions={{
              brands: brands || [],
              categories: categories || [],
              materials: materials || [],
              shapes: shapes || [],
            }}
          />
        )}
      </main>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}
