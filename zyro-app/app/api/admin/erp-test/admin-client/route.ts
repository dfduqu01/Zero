// Test 1: Admin Client DB Write
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const adminClient = createAdminClient();

    // Test insert
    const { data, error } = await adminClient
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
      .select('id, sync_type, status, started_at')
      .single();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insert failed',
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        },
        { status: 500 }
      );
    }

    // Delete the test record
    await adminClient.from('erp_sync_logs').delete().eq('id', data.id);

    return NextResponse.json({
      success: true,
      message: 'Admin client successfully inserted and deleted test record',
      testRecordId: data.id,
      testRecord: data,
    });
  } catch (error) {
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
