import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ProductDetailClient from './ProductDetailClient';
import { SiteHeader } from '@/components/site-header';

interface ProductDetailPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: ProductDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from('products')
    .select('name, description')
    .eq('id', id)
    .single();

  return {
    title: product ? `${product.name} | Zyro Online` : 'Producto | Zyro Online',
    description: product?.description || 'Descubre nuestras gafas premium',
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch product with all related data (only from active brands)
  const { data: product, error } = await supabase
    .from('products')
    .select(`
      *,
      brand:brands!inner(id, name, slug, is_active),
      category:categories(id, name, slug),
      frame_material:frame_materials(id, name),
      frame_shape:frame_shapes(id, name),
      product_images(id, image_url, cloudfront_url, display_order, is_primary)
    `)
    .eq('id', id)
    .eq('is_active', true)
    .eq('brand.is_active', true)
    .single();

  if (error || !product) {
    notFound();
  }

  // Fetch prescription configuration tables
  const { data: prescriptionTypes } = await supabase
    .from('prescription_types')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  const { data: lensTypes } = await supabase
    .from('lens_types')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  const { data: lensIndexes } = await supabase
    .from('lens_indexes')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  const { data: viewAreas } = await supabase
    .from('view_areas')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <SiteHeader />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-600">
          <Link href="/" className="hover:text-gray-900">
            Inicio
          </Link>
          <span>/</span>
          <Link href="/products" className="hover:text-gray-900">
            Productos
          </Link>
          <span>/</span>
          <span className="text-gray-900">{product.name}</span>
        </div>

        {/* Product Detail Client Component */}
        <ProductDetailClient
          product={product}
          prescriptionTypes={prescriptionTypes || []}
          lensTypes={lensTypes || []}
          lensIndexes={lensIndexes || []}
          viewAreas={viewAreas || []}
        />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} Zyro Online. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
