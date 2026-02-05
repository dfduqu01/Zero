import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const PRODUCTS_PER_SITEMAP = 5000;

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}

export async function generateSitemaps() {
  const supabase = getSupabaseClient();

  const { count } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true);

  const totalProducts = count || 0;
  const totalSitemaps = Math.ceil(totalProducts / PRODUCTS_PER_SITEMAP) + 1; // +1 for static pages

  return Array.from({ length: totalSitemaps }, (_, i) => ({ id: i }));
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  // Sitemap 0: static pages
  if (id === 0) {
    return [
      { url: siteUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
      { url: `${siteUrl}/products`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
      { url: `${siteUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
      { url: `${siteUrl}/size-guide`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
      { url: `${siteUrl}/shipping`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
      { url: `${siteUrl}/returns`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
      { url: `${siteUrl}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
      { url: `${siteUrl}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    ];
  }

  // Product sitemaps (id >= 1)
  const supabase = getSupabaseClient();
  const productIndex = id - 1; // Offset by 1 since sitemap 0 is static pages
  const from = productIndex * PRODUCTS_PER_SITEMAP;
  const to = from + PRODUCTS_PER_SITEMAP - 1;

  const { data: products } = await supabase
    .from('products')
    .select('id, updated_at, brand:brands!inner(is_active)')
    .eq('is_active', true)
    .eq('brand.is_active', true)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (!products) return [];

  return products.map((product) => ({
    url: `${siteUrl}/products/${product.id}`,
    lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));
}
