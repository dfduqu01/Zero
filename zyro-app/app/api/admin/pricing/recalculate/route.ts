import { createAdminClient } from '@/lib/supabase/admin';
import { createPricingRecalculationService } from '@/lib/services/pricing-recalculation-service';
import { NextResponse } from 'next/server';

/**
 * POST /api/admin/pricing/recalculate
 *
 * Create a background job to recalculate prices for products
 * Returns immediately with job_id for polling
 *
 * Body params:
 * - pricingFormula (required): 1 or 2
 *   - Formula 1: price = shipping_cost + (cost_dubros × markup) [CURRENT]
 *   - Formula 2: price = cost_dubros × markup [NEW - shipping separate]
 * - shippingCost (optional): Flat shipping cost per product (default: 25)
 * - respectOverrides (optional): Skip products with manual price overrides (default: true)
 * - productIds (optional): Array of specific product IDs to recalculate (default: all products)
 */
export async function POST(request: Request) {
  try {
    const adminClient = createAdminClient();

    // Parse request body
    const body = await request.json();
    const {
      pricingFormula,
      shippingCost = 25,
      respectOverrides = true,
      productIds = null,
    } = body;

    // Validate required params
    if (!pricingFormula || (pricingFormula !== 1 && pricingFormula !== 2)) {
      return NextResponse.json(
        { error: 'pricingFormula is required and must be 1 or 2' },
        { status: 400 }
      );
    }

    console.log('[Pricing Recalc API] Creating background job...');
    console.log('[Pricing Recalc API] Formula:', pricingFormula);
    console.log('[Pricing Recalc API] Shipping cost:', shippingCost);
    console.log('[Pricing Recalc API] Respect overrides:', respectOverrides);
    console.log('[Pricing Recalc API] Product IDs:', productIds ? `${productIds.length} specific` : 'all');

    // Step 1: Create pricing_recalculation_logs entry
    const { data: logData, error: logError } = await adminClient
      .from('pricing_recalculation_logs')
      .insert({
        status: 'running',
        shipping_cost: shippingCost,
        pricing_formula: pricingFormula,
        respect_overrides: respectOverrides,
        product_ids: productIds,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (logError || !logData) {
      console.error('[Pricing Recalc API] Failed to create log:', logError);
      return NextResponse.json(
        { error: `Failed to create log: ${logError?.message}` },
        { status: 500 }
      );
    }

    const logId = logData.id;
    console.log('[Pricing Recalc API] Created log:', logId);

    // Step 2: Create background_jobs entry
    const { data: jobData, error: jobError } = await adminClient
      .from('background_jobs')
      .insert({
        job_type: 'pricing_recalculation',
        status: 'queued',
        progress: 0,
        current_step: 'Job queued',
        job_params: {
          shippingCost,
          respectOverrides,
          productIds,
          pricingFormula,
        },
        log_id: logId, // Link to pricing_recalculation_logs (use log_id, not sync_log_id)
      })
      .select()
      .single();

    if (jobError || !jobData) {
      console.error('[Pricing Recalc API] Failed to create job:', jobError);
      // Clean up the log entry
      await adminClient.from('pricing_recalculation_logs').delete().eq('id', logId);
      return NextResponse.json(
        { error: `Failed to create job: ${jobError?.message}` },
        { status: 500 }
      );
    }

    const jobId = jobData.id;
    console.log('[Pricing Recalc API] Created job:', jobId);

    // Step 3: Start background processing (non-blocking)
    processJobInBackground(jobId, logId, {
      shippingCost,
      respectOverrides,
      productIds,
      pricingFormula,
    }).catch((error) => {
      console.error('[Pricing Recalc API] Background processing error:', error);
    });

    // Step 4: Return immediately with job ID
    const formulaName = pricingFormula === 1 ? 'Shipping Included' : 'Shipping Separate';
    return NextResponse.json({
      success: true,
      job_id: jobId,
      log_id: logId,
      message: `Pricing recalculation job created using "${formulaName}" formula`,
      status: 'queued',
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Pricing Recalc API] Fatal error:', errorMessage);

    return NextResponse.json(
      { error: `Price recalculation failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * Process the pricing recalculation job in the background
 * This function runs asynchronously after the API response is sent
 */
async function processJobInBackground(
  jobId: string,
  logId: string,
  params: {
    shippingCost: number;
    respectOverrides: boolean;
    productIds: string[] | null;
    pricingFormula: 1 | 2;
  }
): Promise<void> {
  const adminClient = createAdminClient();

  try {
    console.log('[Background Job] Starting processing for job:', jobId);

    // Update job status to 'running'
    await adminClient
      .from('background_jobs')
      .update({
        status: 'running',
        started_at: new Date().toISOString(),
        current_step: 'Initializing...',
      })
      .eq('id', jobId);

    // Execute the recalculation
    const service = createPricingRecalculationService();
    const result = await service.executeRecalculation(jobId, logId, params);

    // Update job to completed
    await adminClient
      .from('background_jobs')
      .update({
        status: result.success ? 'completed' : 'failed',
        progress: 100,
        completed_at: new Date().toISOString(),
        current_step: result.success ? 'Completed' : 'Failed',
        results: {
          success: result.success,
          stats: result.stats,
          duration: result.duration,
        },
      })
      .eq('id', jobId);

    console.log('[Background Job] Job completed:', jobId);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Background Job] Job failed:', jobId, errorMessage);

    // Mark job as failed
    await adminClient
      .from('background_jobs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        current_step: 'Failed',
        error_message: errorMessage,
        error_details: error instanceof Error ? { stack: error.stack } : undefined,
      })
      .eq('id', jobId);

    // Also mark the log as failed
    await adminClient
      .from('pricing_recalculation_logs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', logId);
  }
}
