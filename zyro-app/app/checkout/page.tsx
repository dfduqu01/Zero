import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import CheckoutClient from './CheckoutClient';
import { SiteHeader } from '@/components/site-header';

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

  // Fetch cart items with full details and prescription metadata tables
  const [cartResult, lensTypesResult, lensIndexesResult, viewAreasResult, prescriptionTypesResult] = await Promise.all([
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
    supabase.from('lens_types').select('id, name, slug, description, price_modifier, is_active'),
    supabase.from('lens_indexes').select('id, name, slug, description, price_modifier, index_value, is_active'),
    supabase.from('view_areas').select('id, name, slug, description, price_modifier, is_active'),
    supabase.from('prescription_types').select('id, name, slug, description, is_active'),
  ]);

  const cartItems = cartResult.data;
  const lensTypes = lensTypesResult.data || [];
  const lensIndexes = lensIndexesResult.data || [];
  const viewAreas = viewAreasResult.data || [];
  const prescriptionTypes = prescriptionTypesResult.data || [];

  // Fetch prescription data for each cart item
  const cartItemsWithPrescriptions = await Promise.all(
    (cartItems || []).map(async (item) => {
      const { data: prescription } = await supabase
        .from('cart_item_prescriptions')
        .select('*')
        .eq('cart_item_id', item.id)
        .single();

      return {
        ...item,
        prescription,
      };
    })
  );

  // If cart is empty, redirect to cart page
  if (!cartItemsWithPrescriptions || cartItemsWithPrescriptions.length === 0) {
    redirect('/cart');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      <CheckoutClient
        user={userData}
        addresses={addresses || []}
        cartItems={cartItemsWithPrescriptions}
        lensTypes={lensTypes}
        lensIndexes={lensIndexes}
        viewAreas={viewAreas}
        prescriptionTypes={prescriptionTypes}
      />
    </div>
  );
}
