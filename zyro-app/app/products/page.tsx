import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import ProductsClient from './ProductsClient';
import { SiteHeader } from '@/components/site-header';

export const metadata = {
  title: 'Productos | ZERO',
  description: 'Explora nuestra colección de gafas premium',
};

export default async function ProductsPage() {
  const supabase = await createClient();

  // Fetch products with all related data
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select(`
      *,
      brand:brands(id, name, slug),
      category:categories(id, name, slug),
      frame_material:frame_materials(id, name),
      frame_shape:frame_shapes(id, name),
      product_images(id, image_url, display_order)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  // Fetch filter options
  const [
    { data: brands },
    { data: categories },
    { data: materials },
    { data: shapes }
  ] = await Promise.all([
    supabase.from('brands').select('id, name, slug').order('name'),
    supabase.from('categories').select('id, name, slug').order('display_order'),
    supabase.from('frame_materials').select('id, name').order('name'),
    supabase.from('frame_shapes').select('id, name').order('name'),
  ]);

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <SiteHeader />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-500">
            <p>&copy; 2025 ZERO Eyewear. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
