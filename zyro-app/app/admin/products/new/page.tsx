import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ProductForm from '@/components/admin/ProductForm';

export default async function NewProductPage() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?redirectTo=/admin/products/new');
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

  // Fetch lookup data for form
  const [
    { data: brands },
    { data: categories },
    { data: materials },
    { data: shapes },
  ] = await Promise.all([
    supabase.from('brands').select('*').order('name'),
    supabase.from('categories').select('*').order('name'),
    supabase.from('frame_materials').select('*').order('name'),
    supabase.from('frame_shapes').select('*').order('name'),
  ]);

  return (
    <ProductForm
      brands={brands || []}
      categories={categories || []}
      materials={materials || []}
      shapes={shapes || []}
    />
  );
}
