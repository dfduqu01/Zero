/**
 * TEST ENDPOINT - Remove after verification
 * GET /api/test-payment
 *
 * Tests PagueloFacil client connection and payment link creation
 */

import { NextResponse } from 'next/server';
import { createPagueloFacilClient } from '@/lib/payment/paguelofacil-client';

export async function GET() {
  try {
    console.log('[test-payment] Starting payment link creation test...');

    // Create client
    const client = createPagueloFacilClient();

    // Test connection first
    console.log('[test-payment] Testing connection...');
    const connectionOk = await client.testConnection();

    if (!connectionOk) {
      return NextResponse.json({
        success: false,
        error: 'Connection test failed',
      }, { status: 500 });
    }

    console.log('[test-payment] Connection OK. Creating payment link...');

    // Create a test payment link
    const result = await client.createPaymentLink({
      amount: 1.00, // $1.00 test
      description: 'Zyro Online - Test Payment Link',
      returnUrl: 'http://localhost:3000/api/checkout/payment-callback',
      orderNumber: `TEST-${Date.now()}`,
      expiresIn: 3600,
    });

    console.log('[test-payment] Result:', JSON.stringify(result, null, 2));

    return NextResponse.json({
      success: true,
      environment: process.env.PAGUELOFACIL_ENVIRONMENT || 'sandbox',
      result,
    });

  } catch (error: any) {
    console.error('[test-payment] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      details: error,
    }, { status: 500 });
  }
}
