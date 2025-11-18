import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import PrescriptionsClient from './PrescriptionsClient';

// Admin Prescription Validation Page
export default async function AdminPrescriptionsPage() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?redirectTo=/admin/prescriptions');
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

  // Fetch order item prescriptions separately to avoid RLS nested query issues
  const { data: rawPrescriptions, error: prescError } = await supabase
    .from('order_item_prescriptions')
    .select('*')
    .order('created_at', { ascending: false });

  if (prescError) {
    console.error('Error fetching prescriptions:', prescError);
  }

  // If no prescriptions, return early
  if (!rawPrescriptions || rawPrescriptions.length === 0) {
    const [
      { data: prescriptionTypes },
      { data: lensTypes },
      { data: lensIndexes },
      { data: viewAreas },
    ] = await Promise.all([
      supabase.from('prescription_types').select('*'),
      supabase.from('lens_types').select('*'),
      supabase.from('lens_indexes').select('*'),
      supabase.from('view_areas').select('*'),
    ]);

    return (
      <PrescriptionsClient
        initialPrescriptions={[]}
        prescriptionTypes={prescriptionTypes || []}
        lensTypes={lensTypes || []}
        lensIndexes={lensIndexes || []}
        viewAreas={viewAreas || []}
      />
    );
  }

  // Fetch related order items
  const orderItemIds = rawPrescriptions.map((p) => p.order_item_id);
  const { data: orderItems } = await supabase
    .from('order_items')
    .select('id, order_id, product_snapshot, quantity, unit_price')
    .in('id', orderItemIds);

  // Fetch related orders
  const orderIds = orderItems?.map((oi) => oi.order_id) || [];
  const { data: orders } = await supabase
    .from('orders')
    .select('id, user_id, order_number, created_at, status')
    .in('id', orderIds);

  // Fetch related users from public.users (name, phone, country)
  const userIds = orders?.map((o) => o.user_id) || [];
  const { data: users } = await supabase
    .from('users')
    .select('id, name, phone, country')
    .in('id', userIds);

  // Fetch emails by querying specific user IDs from auth.users
  // Use admin client to bypass RLS
  const adminClient = createAdminClient();

  // Fetch each user's email individually using getUserById
  const emailPromises = userIds.map(async (userId): Promise<[string, string]> => {
    const { data, error } = await adminClient.auth.admin.getUserById(userId);
    if (error) {
      console.error(`Error fetching user ${userId}:`, error);
      return [userId, 'N/A'];
    }
    return [userId, data.user.email || 'N/A'];
  });

  const emailEntries = await Promise.all(emailPromises);
  const emailMap = new Map<string, string>(emailEntries);

  // Combine the data
  const prescriptions = rawPrescriptions.map((prescription) => {
    const orderItem = orderItems?.find((oi) => oi.id === prescription.order_item_id);
    const order = orders?.find((o) => o.id === orderItem?.order_id);
    const user = users?.find((u) => u.id === order?.user_id);

    return {
      ...prescription,
      order_item: orderItem
        ? {
            id: orderItem.id,
            product_name: (orderItem.product_snapshot as any)?.name || 'Unknown Product',
            product_sku: (orderItem.product_snapshot as any)?.sku || 'N/A',
            quantity: orderItem.quantity,
            unit_price: orderItem.unit_price,
            order: order
              ? {
                  id: order.id,
                  order_number: order.order_number,
                  created_at: order.created_at,
                  status: order.status,
                  user: user
                    ? {
                        full_name: user.name,
                        email: emailMap.get(user.id) || 'N/A',
                        phone: user.phone,
                        country: user.country,
                      }
                    : { full_name: 'Unknown', email: 'N/A', phone: 'N/A', country: 'N/A' },
                }
              : null,
          }
        : null,
    };
  }).filter((p) => p.order_item !== null); // Filter out any prescriptions without order items

  // Fetch prescription metadata for display
  const [
    { data: prescriptionTypes },
    { data: lensTypes },
    { data: lensIndexes },
    { data: viewAreas },
  ] = await Promise.all([
    supabase.from('prescription_types').select('*'),
    supabase.from('lens_types').select('*'),
    supabase.from('lens_indexes').select('*'),
    supabase.from('view_areas').select('*'),
  ]);

  return (
    <PrescriptionsClient
      initialPrescriptions={prescriptions || []}
      prescriptionTypes={prescriptionTypes || []}
      lensTypes={lensTypes || []}
      lensIndexes={lensIndexes || []}
      viewAreas={viewAreas || []}
    />
  );
}
