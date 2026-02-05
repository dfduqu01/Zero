import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ProductDetailClient from './ProductDetailClient';
import { SiteHeader } from '@/components/site-header';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface ProductDetailPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from('products')
    .select('name, description, price, sku, brand:brands(name), product_images(image_url, cloudfront_url, is_primary)')
    .eq('id', id)
    .single();

  if (!product) {
    return {
      title: 'Producto | Zyro Online',
      description: 'Descubre nuestras gafas premium',
    };
  }

  const primaryImage = product.product_images?.find((img: { is_primary?: boolean }) => img.is_primary)
    || product.product_images?.[0];
  const imageUrl = primaryImage?.cloudfront_url || primaryImage?.image_url || null;
  const brand = product.brand as { name: string }[] | { name: string } | null;
  const brandName = Array.isArray(brand) ? brand[0]?.name : brand?.name || 'Zyro';
  const productUrl = `${siteUrl}/products/${id}`;

  return {
    title: `${product.name} | Zyro Online`,
    description: product.description || `${product.name} de ${brandName}. Gafas premium en Zyro Online.`,
    alternates: {
      canonical: productUrl,
    },
    openGraph: {
      title: `${product.name} | Zyro Online`,
      description: product.description || `${product.name} de ${brandName}. Gafas premium en Zyro Online.`,
      url: productUrl,
      siteName: 'Zyro Online',
      locale: 'es_LA',
      type: 'website',
      ...(imageUrl && {
        images: [
          {
            url: imageUrl,
            width: 800,
            height: 800,
            alt: product.name,
          },
        ],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | Zyro Online`,
      description: product.description || `${product.name} de ${brandName}. Gafas premium en Zyro Online.`,
      ...(imageUrl && { images: [imageUrl] }),
    },
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

  // Build Product JSON-LD
  const primaryImage = product.product_images?.find((img: { is_primary?: boolean }) => img.is_primary)
    || product.product_images?.[0];
  const imageUrl = primaryImage?.cloudfront_url || primaryImage?.image_url || null;

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || undefined,
    ...(product.sku && { sku: product.sku }),
    ...(imageUrl && { image: imageUrl }),
    brand: {
      '@type': 'Brand',
      name: product.brand?.name || 'Zyro',
    },
    offers: {
      '@type': 'Offer',
      url: `${siteUrl}/products/${id}`,
      priceCurrency: 'USD',
      price: product.price,
      availability: product.stock_quantity > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Product JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

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
