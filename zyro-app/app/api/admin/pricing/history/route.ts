import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

/**
 * GET /api/admin/pricing/history
 *
 * Fetch recent pricing recalculation history
 * Query params:
 * - limit (optional): Number of records to return (default: 10, max: 50)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    const adminClient = createAdminClient();

    // Fetch recent pricing recalculation logs
    const { data: logs, error: logsError } = await adminClient
      .from('pricing_recalculation_logs')
      .select(`
        id,
        status,
        started_at,
        completed_at,
        duration_seconds,
        total_products,
        products_updated,
        products_skipped,
        error_count,
        shipping_cost,
        pricing_formula,
        respect_overrides,
        product_ids,
        created_by
      `)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (logsError) {
      console.error('[Pricing History API] Error fetching logs:', logsError);
      return NextResponse.json(
        { error: `Failed to fetch history: ${logsError.message}` },
        { status: 500 }
      );
    }

    // Format the response
    const formattedLogs = logs.map(log => ({
      id: log.id,
      status: log.status,
      started_at: log.started_at,
      completed_at: log.completed_at,
      duration_seconds: log.duration_seconds,
      stats: {
        total: log.total_products,
        updated: log.products_updated,
        skipped: log.products_skipped,
        errors: log.error_count,
      },
      params: {
        shipping_cost: log.shipping_cost,
        pricing_formula: log.pricing_formula,
        respect_overrides: log.respect_overrides,
        product_ids: log.product_ids,
      },
      created_by: log.created_by,
    }));

    return NextResponse.json({
      success: true,
      logs: formattedLogs,
      count: formattedLogs.length,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Pricing History API] Error:', errorMessage);

    return NextResponse.json(
      { error: `Failed to fetch history: ${errorMessage}` },
      { status: 500 }
    );
  }
}
