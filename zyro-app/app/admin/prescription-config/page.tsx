import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PrescriptionConfigClient from './PrescriptionConfigClient';

export default async function AdminPrescriptionConfigPage() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?redirectTo=/admin/prescription-config');
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

  // Fetch all prescription configuration data
  const [
    { data: prescriptionTypes },
    { data: lensTypes },
    { data: lensIndexes },
    { data: viewAreas },
  ] = await Promise.all([
    supabase.from('prescription_types').select('*').order('display_order', { ascending: true }),
    supabase.from('lens_types').select('*').order('display_order', { ascending: true }),
    supabase.from('lens_indexes').select('*').order('display_order', { ascending: true }),
    supabase.from('view_areas').select('*').order('display_order', { ascending: true }),
  ]);

  return (
    <PrescriptionConfigClient
      initialPrescriptionTypes={prescriptionTypes || []}
      initialLensTypes={lensTypes || []}
      initialLensIndexes={lensIndexes || []}
      initialViewAreas={viewAreas || []}
    />
  );
}
