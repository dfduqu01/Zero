import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

/**
 * GET /api/admin/pricing-status/[id]
 *
 * Poll the status of a pricing recalculation background job
 * Returns job progress, current step, and results when completed
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminClient = createAdminClient();

    // Fetch the job with related log data
    const { data: job, error: jobError } = await adminClient
      .from('background_jobs')
      .select(`
        id,
        job_type,
        status,
        progress,
        current_step,
        current_item_count,
        total_item_count,
        job_params,
        results,
        created_at,
        started_at,
        completed_at,
        error_message,
        error_details,
        log_id
      `)
      .eq('id', id)
      .eq('job_type', 'pricing_recalculation')
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Fetch associated log if exists
    let logData = null;
    if (job.log_id) {
      const { data: log, error: logError } = await adminClient
        .from('pricing_recalculation_logs')
        .select('*')
        .eq('id', job.log_id)
        .single();

      if (!logError && log) {
        logData = log;
      }
    }

    // Format response
    const response: any = {
      job: {
        id: job.id,
        status: job.status,
        progress: job.progress,
        current_step: job.current_step,
        current_item_count: job.current_item_count,
        total_item_count: job.total_item_count,
        created_at: job.created_at,
        started_at: job.started_at,
        completed_at: job.completed_at,
        error_message: job.error_message,
        results: job.results,
        params: job.job_params,
      },
    };

    // Include log data if available
    if (logData) {
      response.job.log = {
        total_products: logData.total_products,
        products_updated: logData.products_updated,
        products_skipped: logData.products_skipped,
        error_count: logData.error_count,
        duration_seconds: logData.duration_seconds,
        shipping_cost: logData.shipping_cost,
        pricing_formula: logData.pricing_formula,
        respect_overrides: logData.respect_overrides,
      };
    }

    return NextResponse.json(response);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Pricing Status API] Error:', errorMessage);

    return NextResponse.json(
      { error: `Failed to fetch job status: ${errorMessage}` },
      { status: 500 }
    );
  }
}
