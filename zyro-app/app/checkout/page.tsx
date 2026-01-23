import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import CheckoutClient from './CheckoutClient';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

export const metadata = {
  title: 'Finalizar Compra',
  description: 'Completa tu pedido en Zyro Online',
};

export default async function CheckoutPage() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If not authenticated, redirect to login with return URL
  if (!user) {
    redirect('/auth/login?redirectTo=/checkout');
  }

  // Fetch user profile data
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch user's saved addresses
  const { data: addresses } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  // Fetch cart items with full details, prescription metadata tables, and shipping config
  const [cartResult, lensTypesResult, lensIndexesResult, viewAreasResult, prescriptionTypesResult, shippingConfigResult] = await Promise.all([
    supabase
      .from('cart_items')
      .select(`
        id,
        product_id,
        quantity,
        created_at,
        products (
          id,
          sku,
          name,
          price,
          description,
          stock_quantity
        )
      `)
      .eq('user_id', user.id),
    supabase.from('lens_types').select('*'),
    supabase.from('lens_indexes').select('*'),
    supabase.from('view_areas').select('*'),
    supabase.from('prescription_types').select('*'),
    // Get latest shipping cost from pricing recalculation logs
    supabase
      .from('pricing_recalculation_logs')
      .select('shipping_cost')
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
  ]);

  const cartItems = cartResult.data;
  const lensTypes = lensTypesResult.data || [];
  const lensIndexes = lensIndexesResult.data || [];
  const viewAreas = viewAreasResult.data || [];
  const prescriptionTypes = prescriptionTypesResult.data || [];

  // Shipping configuration: Panama = $8, other countries = from pricing config (default $25)
  const internationalShippingCost = shippingConfigResult.data?.shipping_cost ?? 25;

  // Fetch prescription data and product images for each cart item
  const cartItemsWithPrescriptions = await Promise.all(
    (cartItems || []).map(async (item) => {
      const [prescriptionResult, imageResult] = await Promise.all([
        supabase
          .from('cart_item_prescriptions')
          .select('*')
          .eq('cart_item_id', item.id)
          .single(),
        supabase
          .from('product_images')
          .select('image_url, cloudfront_url')
          .eq('product_id', item.product_id)
          .or('is_primary.eq.true,display_order.eq.1')
          .order('is_primary', { ascending: false })
          .order('display_order', { ascending: true })
          .limit(1)
          .single()
      ]);

      // Transform products from array to single object if needed
      const products = Array.isArray(item.products) ? item.products[0] : item.products;

      // Add image_url to products object
      const productWithImage = {
        ...products,
        image_url: imageResult.data?.cloudfront_url || imageResult.data?.image_url || null
      };

      return {
        ...item,
        products: productWithImage,
        prescription: prescriptionResult.data,
      };
    })
  );

  // If cart is empty, redirect to cart page
  if (!cartItemsWithPrescriptions || cartItemsWithPrescriptions.length === 0) {
    redirect('/cart');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <SiteHeader />
      <div className="flex-1">
        <CheckoutClient
          user={{
            ...userData,
            email: user.email, // Include email from auth user
          }}
          addresses={addresses || []}
          cartItems={cartItemsWithPrescriptions}
          lensTypes={lensTypes}
          lensIndexes={lensIndexes}
          viewAreas={viewAreas}
          prescriptionTypes={prescriptionTypes}
          shippingConfig={{
            panamaDelivery: 8,
            panamaPickup: 0,
            international: internationalShippingCost,
            pickupLocation: {
              address: 'Ave. Omar Torrijos Herrera CC Terrazas de Albrook, Local B15, Panamá',
              hours: '9:00 AM - 5:00 PM',
              note: 'Disponible para recoger 24 horas después de realizar el pedido',
            },
          }}
        />
      </div>
      <SiteFooter />
    </div>
  );
}
