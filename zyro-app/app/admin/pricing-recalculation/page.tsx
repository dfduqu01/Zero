// Server Component: Pricing Recalculation Dashboard
// Path: /admin/pricing-recalculation

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PricingRecalculationClient from './PricingRecalculationClient';

export const metadata = {
  title: 'Recalcular Precios | Admin',
  description: 'Recalcular precios de productos basado en costos y fórmulas de pricing',
};

export default async function PricingRecalculationPage() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('[Pricing Recalc Page] Auth error:', authError);
    redirect('/auth/login?redirectTo=/admin/pricing-recalculation');
  }

  // Check admin status
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('is_admin, name')
    .eq('id', user.id)
    .single();

  if (userError) {
    console.error('[Pricing Recalc Page] User fetch error:', userError);
    redirect('/');
  }

  if (!userData?.is_admin) {
    console.log('[Pricing Recalc Page] User is not admin:', userData);
    redirect('/');
  }

  // Fetch pricing tiers to show in UI
  const { data: pricingTiers, error: tiersError } = await supabase
    .from('pricing_tiers')
    .select('*')
    .eq('is_active', true)
    .order('min_cost');

  if (tiersError) {
    console.error('[Pricing Recalc Page] Tiers fetch error:', tiersError);
  }

  // Fetch recent pricing recalculation logs
  const { data: recentLogs, error: logsError } = await supabase
    .from('pricing_recalculation_logs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(10);

  if (logsError) {
    console.error('[Pricing Recalc Page] Logs fetch error:', logsError);
  }

  // Fetch recent pricing errors
  const { data: pricingErrors, error: errorsError } = await supabase
    .from('pricing_recalculation_errors')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (errorsError) {
    console.error('[Pricing Recalc Page] Errors fetch error:', errorsError);
  }

  // Fetch most recent job to check if there's an active recalculation
  const { data: recentJob, error: jobError } = await supabase
    .from('background_jobs')
    .select('id, status, created_at')
    .eq('job_type', 'pricing_recalculation')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (jobError && jobError.code !== 'PGRST116') {
    // PGRST116 = no rows found, which is fine
    console.error('[Pricing Recalc Page] Job fetch error:', jobError);
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

  console.log('[Pricing Recalc Page] Rendering page for user:', userData.name, 'activeJobId:', activeJobId);

  return (
    <PricingRecalculationClient
      recentLogs={recentLogs || []}
      pricingErrors={pricingErrors || []}
      activeJobId={activeJobId}
      pricingTiers={pricingTiers || []}
    />
  );
}
