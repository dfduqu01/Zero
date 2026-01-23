import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/admin/erp-sync-status/[id]
 * Poll for job status and progress
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const adminClient = createAdminClient();

    // Fetch job
    const { data: job, error: jobError } = await adminClient
      .from('erp_sync_jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (jobError || !job) {
      console.error('[Job Status API] Job not found:', jobError);
      return NextResponse.json(
        { error: 'Job not found', details: jobError?.message },
        { status: 404 }
      );
    }

    // Fetch sync log separately
    let syncLog = null;
    if (job.sync_log_id) {
      const { data: logData } = await adminClient
        .from('erp_sync_logs')
        .select('id, status, records_processed, records_updated, error_count, started_at, completed_at')
        .eq('id', job.sync_log_id)
        .single();

      syncLog = logData;
    }

    // Get error count from erp_sync_errors table
    const { count: errorCount } = await adminClient
      .from('erp_sync_errors')
      .select('*', { count: 'exact', head: true })
      .eq('sync_log_id', job.sync_log_id);

    return NextResponse.json({
      job: {
        ...job,
        erp_sync_logs: syncLog,
        error_count: errorCount || 0,
      },
    });
  } catch (error: unknown) {
    console.error('[Job Status API] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
