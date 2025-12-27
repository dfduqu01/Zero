// Server Component: ERP Sync Dashboard
// Path: /admin/erp-sync

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ErpSyncClient from './ErpSyncClient';

export const metadata = {
  title: 'Sincronización ERP | Admin',
  description: 'Administrar sincronización de inventario con dubros.com',
};

export default async function ErpSyncPage() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('[ERP Sync Page] Auth error:', authError);
    redirect('/auth/login?redirectTo=/admin/erp-sync');
  }

  // Check admin status
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('is_admin, name')
    .eq('id', user.id)
    .single();

  if (userError) {
    console.error('[ERP Sync Page] User fetch error:', userError);
    redirect('/');
  }

  if (!userData?.is_admin) {
    console.log('[ERP Sync Page] User is not admin:', userData);
    redirect('/');
  }

  // Fetch recent sync logs
  const { data: recentSyncs, error: syncsError } = await supabase
    .from('erp_sync_logs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(10);

  if (syncsError) {
    console.error('[ERP Sync Page] Syncs fetch error:', syncsError);
  }

  // Fetch sync errors for skipped products
  const { data: syncErrors, error: errorsError } = await supabase
    .from('erp_sync_errors')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (errorsError) {
    console.error('[ERP Sync Page] Errors fetch error:', errorsError);
  }

  // Fetch most recent job to check if there's an active sync
  const { data: recentJob, error: jobError } = await supabase
    .from('erp_sync_jobs')
    .select('id, status, created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (jobError && jobError.code !== 'PGRST116') {
    // PGRST116 = no rows found, which is fine
    console.error('[ERP Sync Page] Job fetch error:', jobError);
  }

  // Check if there's an active or recently completed job (within last 5 minutes)
  let activeJobId = null;
  if (recentJob) {
    const jobAge = Date.now() - new Date(recentJob.created_at).getTime();
    const fiveMinutesAgo = 5 * 60 * 1000;

    if (recentJob.status === 'running' || recentJob.status === 'queued') {
      // Job is still running, resume polling
      activeJobId = recentJob.id;
    } else if (jobAge < fiveMinutesAgo && recentJob.status === 'completed') {
      // Job completed recently, show results
      activeJobId = recentJob.id;
    }
  }

  console.log('[ERP Sync Page] Rendering page for user:', userData.name, 'activeJobId:', activeJobId);

  return (
    <ErpSyncClient
      recentSyncs={recentSyncs || []}
      syncErrors={syncErrors || []}
      activeJobId={activeJobId}
    />
  );
}
