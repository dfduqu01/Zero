// Test 6: Full Sync Workflow (5 products)
import { NextResponse } from 'next/server';
import { DubrosApiClient } from '@/lib/erp/dubros-client';
import { createErpSyncService } from '@/lib/services/erp-sync-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(request: Request) {
  console.log('[Test 6] ===== FULL SYNC TEST STARTING =====');

  try {
    // Parse request body for testLimit
    const body = await request.json().catch(() => ({}));
    const testLimit = body.testLimit !== undefined ? body.testLimit : 5;
    console.log('[Test 6] Test limit:', testLimit === null ? 'ALL PRODUCTS' : `${testLimit} products`);

    console.log('[Test 6] Step 1: Checking env vars...');
    const dubrosApiUrl = process.env.DUBROS_API_URL;
    const dubrosBearerToken = process.env.DUBROS_BEARER_TOKEN;

    if (!dubrosApiUrl) {
      console.log('[Test 6] ERROR: DUBROS_API_URL not set');
      return NextResponse.json(
        { success: false, error: 'DUBROS_API_URL not set' },
        { status: 500 }
      );
    }

    if (!dubrosBearerToken) {
      console.log('[Test 6] ERROR: DUBROS_BEARER_TOKEN not set');
      return NextResponse.json(
        { success: false, error: 'DUBROS_BEARER_TOKEN not set' },
        { status: 500 }
      );
    }

    console.log('[Test 6] Step 2: Creating Dubros client...');
    const client = new DubrosApiClient({
      baseUrl: dubrosApiUrl,
      bearerToken: dubrosBearerToken,
      timeout: 180000,
    });

    console.log('[Test 6] Step 3: Testing connection...');
    const connectionOk = await client.testConnection();
    if (!connectionOk) {
      console.log('[Test 6] ERROR: Connection test failed');
      return NextResponse.json(
        { success: false, error: 'Failed to connect to dubros.com' },
        { status: 503 }
      );
    }
    console.log('[Test 6] Connection OK');

    console.log('[Test 6] Step 4: Creating sync service...');
    const syncService = createErpSyncService(client);

    console.log('[Test 6] Step 5: Calling executeSync with limit:', testLimit);
    const result = await syncService.executeSync('manual', testLimit);
    console.log('[Test 6] executeSync returned:', result);

    if (!result.success) {
      console.log('[Test 6] Sync failed with result:', result);
      return NextResponse.json(
        {
          success: false,
          error: 'Sync failed',
          syncLogId: result.syncLogId,
          stats: result.stats,
          duration: result.duration,
        },
        { status: 500 }
      );
    }

    console.log('[Test 6] Sync completed successfully');
    return NextResponse.json({
      success: true,
      message: `Sync completed: ${result.stats.created} created, ${result.stats.updated} updated`,
      syncLogId: result.syncLogId,
      stats: result.stats,
      duration: result.duration,
    });
  } catch (error) {
    console.log('[Test 6] EXCEPTION:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Exception thrown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
