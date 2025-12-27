import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

/**
 * GET /api/admin/erp-sync/jobs/[id]
 * Poll for job status and progress
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminClient = createAdminClient();

    const { data: job, error } = await adminClient
      .from('erp_sync_jobs')
      .select(`
        *,
        erp_sync_logs!sync_log_id (
          id,
          status,
          records_processed,
          records_updated,
          error_count,
          started_at,
          completed_at
        )
      `)
      .eq('id', id)
      .single();

    if (error || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Get error count from erp_sync_errors table
    const { count: errorCount } = await adminClient
      .from('erp_sync_errors')
      .select('*', { count: 'exact', head: true })
      .eq('sync_log_id', job.sync_log_id);

    return NextResponse.json({
      job: {
        ...job,
        error_count: errorCount || 0,
      },
    });
  } catch (error: any) {
    console.error('[Job Status API] Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

