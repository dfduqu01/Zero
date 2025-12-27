// Test 2: Fetch Dubros Categories
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

    const client = new DubrosApiClient({
      baseUrl: dubrosApiUrl,
      bearerToken: dubrosBearerToken,
      timeout: 30000,
    });

    const categories = await client.fetchCategories();

    return NextResponse.json({
      success: true,
      message: `Fetched ${categories.length} categories`,
      count: categories.length,
      categories: categories.slice(0, 10), // Return first 10 for preview
      sample: categories[0], // Show one full example
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
