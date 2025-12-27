// Test 5: Fetch Dubros Products (limited to 5)
import { NextResponse } from 'next/server';
import { DubrosApiClient } from '@/lib/erp/dubros-client';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const dubrosApiUrl = process.env.DUBROS_API_URL;
    const dubrosBearerToken = process.env.DUBROS_BEARER_TOKEN;

    if (!dubrosApiUrl) {
      return NextResponse.json(
        { success: false, error: 'DUBROS_API_URL not set' },
        { status: 500 }
      );
    }

    if (!dubrosBearerToken) {
      return NextResponse.json(
        { success: false, error: 'DUBROS_BEARER_TOKEN not set - required for Price field' },
        { status: 500 }
      );
    }

    const client = new DubrosApiClient({
      baseUrl: dubrosApiUrl,
      bearerToken: dubrosBearerToken,
      timeout: 120000, // 2 minutes
    });

    // Fetch only 5 products for quick testing
    const products = await client.fetchProducts({ maxRecords: 5 });

    return NextResponse.json({
      success: true,
      message: `Fetched ${products.length} products`,
      count: products.length,
      products: products, // Return all 5
      sample: products[0], // Highlight first one
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Fetch failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
