import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import UsersClient from './UsersClient';

// Admin User Management Page
export default async function AdminUsersPage() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?redirectTo=/admin/users');
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

  // Fetch all users from public.users table
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, name, phone, country, is_admin, created_at')
    .order('created_at', { ascending: false });

  if (usersError) {
    console.error('Error fetching users:', usersError);
  }

  // Fetch emails from auth.users using admin client
  const adminClient = createAdminClient();
  const userIds = users?.map((u) => u.id) || [];

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

  // Fetch order counts per user
  const { data: orderCounts } = await supabase
    .from('orders')
    .select('user_id');

  const orderCountMap = new Map<string, number>();
  orderCounts?.forEach((order) => {
    const count = orderCountMap.get(order.user_id) || 0;
    orderCountMap.set(order.user_id, count + 1);
  });

  // Combine data
  const usersWithDetails = users?.map((user) => ({
    ...user,
    email: emailMap.get(user.id) || 'N/A',
    order_count: orderCountMap.get(user.id) || 0,
  }));

  // Calculate statistics
  const totalUsers = usersWithDetails?.length || 0;
  const adminCount = usersWithDetails?.filter((u) => u.is_admin).length || 0;
  const customerCount = totalUsers - adminCount;

  const stats = {
    totalUsers,
    adminCount,
    customerCount,
  };

  return (
    <UsersClient
      initialUsers={usersWithDetails || []}
      stats={stats}
      currentUserId={user.id}
    />
  );
}
