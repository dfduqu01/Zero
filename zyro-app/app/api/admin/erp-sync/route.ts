// API Route: POST /api/admin/erp-sync
// Trigger manual ERP sync from dubros.com

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DubrosApiClient } from '@/lib/erp/dubros-client';
import { createErpSyncService } from '@/lib/services/erp-sync-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes timeout for long sync operations

/**
 * POST /api/admin/erp-sync
 * Trigger manual ERP sync
 *
 * Authentication: Requires admin user
 * Body: { syncType?: 'manual' | 'scheduled' }
 */
export async function POST(request: NextRequest) {
  console.log('[API Route] POST /api/admin/erp-sync - Starting');

  try {
    // Check authentication and admin status
    console.log('[API Route] Checking authentication...');
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.is_admin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const syncType = body.syncType || 'manual';
    const testLimit = body.testLimit || null; // Limit products for testing (e.g., 50)
    const quickTest = body.quickTest || false; // Just test DB writes, skip dubros fetch

    // Validate environment variables
    const dubrosApiUrl = process.env.DUBROS_API_URL;
    const dubrosBearerToken = process.env.DUBROS_BEARER_TOKEN;

    if (!dubrosApiUrl) {
      return NextResponse.json(
        { error: 'Configuration error: DUBROS_API_URL not set' },
        { status: 500 }
      );
    }

    if (!dubrosBearerToken) {
      console.warn('DUBROS_BEARER_TOKEN not set - Price field will not be available');
    }

    // Create dubros client
    const dubrosClient = new DubrosApiClient({
      baseUrl: dubrosApiUrl,
      bearerToken: dubrosBearerToken,
      timeout: 180000, // 3 minutes for API endpoint (products fetch takes ~100s)
    });

    // Test connection first
    const connectionOk = await dubrosClient.testConnection();
    if (!connectionOk) {
      return NextResponse.json(
        { error: 'Failed to connect to dubros.com API' },
        { status: 503 }
      );
    }

    // Test admin client directly before sync
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const adminClient = createAdminClient();

    // Test insert to erp_sync_logs
    const testInsert = await adminClient
      .from('erp_sync_logs')
      .insert({
        sync_type: 'manual',
        status: 'running',
        started_at: new Date().toISOString(),
        total_records_fetched: 0,
        records_processed: 0,
        records_updated: 0,
        records_skipped: 0,
        error_count: 0,
      })
      .select('id')
      .single();

    // Return detailed response about the test insert
    if (testInsert.error) {
      return NextResponse.json(
        {
          error: 'Admin client test failed',
          message: testInsert.error.message,
          code: testInsert.error.code,
          details: testInsert.error.details,
          hint: testInsert.error.hint,
        },
        { status: 500 }
      );
    }

    if (!testInsert.data) {
      return NextResponse.json(
        {
          error: 'Admin client test failed - no data returned',
        },
        { status: 500 }
      );
    }

    // Delete the test record
    const deleteResult = await adminClient.from('erp_sync_logs').delete().eq('id', testInsert.data.id);
    if (deleteResult.error) {
      return NextResponse.json(
        {
          error: 'Failed to delete test record',
          message: deleteResult.error.message,
          testRecordId: testInsert.data.id,
        },
        { status: 500 }
      );
    }

    // If quickTest mode, return success without running full sync
    if (quickTest) {
      return NextResponse.json({
        success: true,
        message: 'Quick test passed - admin client can write to database',
        testRecordId: testInsert.data.id,
        mode: 'quickTest',
      });
    }

    // CREATE JOB INSTEAD OF RUNNING SYNC DIRECTLY
    console.log('[API Route] Creating sync job...');

    // 1. Create sync log entry (status: pending)
    const { data: syncLog, error: logError } = await adminClient
      .from('erp_sync_logs')
      .insert({
        sync_type: syncType,
        status: 'pending',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (logError || !syncLog) {
      return NextResponse.json(
        { error: 'Failed to create sync log' },
        { status: 500 }
      );
    }

    // 2. Create job entry (status: queued)
    const { data: job, error: jobError } = await adminClient
      .from('erp_sync_jobs')
      .insert({
        status: 'queued',
        sync_type: syncType,
        test_limit: testLimit,
        sync_log_id: syncLog.id,
        created_by: user.id,
        current_step: 'Queued - waiting to start',
        progress: 0,
      })
      .select()
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Failed to create job' },
        { status: 500 }
      );
    }

    // 3. Process the job in the background (non-blocking)
    // Note: We don't await this - it runs in the background
    processJobInBackground(job.id, syncLog.id, syncType, testLimit).catch(error => {
      console.error('[API Route] Background job processing failed:', error);
    });

    console.log('[API Route] Background job processing started for job:', job.id);

    // 4. Return immediately with job ID
    console.log('[API Route] Job created successfully:', job.id);

    return NextResponse.json({
      success: true,
      job_id: job.id,
      sync_log_id: syncLog.id,
      message: 'Sync job created. Processing in background.',
      status: 'queued',
    });
  } catch (error) {
    console.error('[API] ERP Sync error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/erp-sync
 * Get sync status and recent syncs
 */
export async function GET() {
  try {
    // Check authentication and admin status
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.is_admin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get recent sync logs
    const { data: recentSyncs, error: syncsError } = await supabase
      .from('erp_sync_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(10);

    if (syncsError) {
      return NextResponse.json({ error: 'Failed to fetch sync logs' }, { status: 500 });
    }

    // Get latest sync
    const latestSync = recentSyncs?.[0] || null;

    // Check if sync is currently running
    const isRunning = latestSync?.status === 'running';

    return NextResponse.json({
      isRunning,
      latestSync,
      recentSyncs: recentSyncs || [],
    });
  } catch (error) {
    console.error('[API] ERP Sync status error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Process sync job in the background without blocking the response
 * This runs asynchronously after the API returns
 */
async function processJobInBackground(
  jobId: string,
  syncLogId: string,
  syncType: string,
  testLimit: number | null
): Promise<void> {
  const { createAdminClient } = await import('@/lib/supabase/admin');
  const adminClient = createAdminClient();

  try {
    // Import sync service
    const { createErpSyncService} = await import('@/lib/services/erp-sync-service');
    const { DubrosApiClient } = await import('@/lib/erp/dubros-client');

    const dubrosApiUrl = process.env.DUBROS_API_URL;
    const dubrosBearerToken = process.env.DUBROS_BEARER_TOKEN;

    if (!dubrosApiUrl) {
      throw new Error('DUBROS_API_URL not configured');
    }

    const dubrosClient = new DubrosApiClient({
      baseUrl: dubrosApiUrl,
      bearerToken: dubrosBearerToken,
      timeout: 180000,
    });

    const syncService = createErpSyncService(dubrosClient);

    // Update job to running
    await adminClient
      .from('erp_sync_jobs')
      .update({
        status: 'running',
        started_at: new Date().toISOString(),
        current_step: 'Starting sync...',
        progress: 0,
      })
      .eq('id', jobId);

    // Execute the sync (pass jobId for progress updates)
    const result = await syncService.executeSync(syncType as 'manual' | 'scheduled', testLimit, 25, jobId);

    // Update job as completed
    const finalStatus = result.success ? 'completed' : 'failed';
    await adminClient
      .from('erp_sync_jobs')
      .update({
        status: finalStatus,
        completed_at: new Date().toISOString(),
        current_step: finalStatus === 'completed' ? 'Completed successfully' : 'Failed',
        progress: 100,
        current_item_count: result.stats.processed,
        total_item_count: result.stats.processed,
      })
      .eq('id', jobId);

    console.log(`[Background] Job ${jobId} completed with status: ${finalStatus}`);
  } catch (error) {
    console.error(`[Background] Job ${jobId} failed:`, error);

    // Mark job as failed
    await adminClient
      .from('erp_sync_jobs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        current_step: 'Failed',
        progress: 100,
        error_message: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('id', jobId);
  }
}
