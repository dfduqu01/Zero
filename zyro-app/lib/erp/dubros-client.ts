// dubros.com API Client
// Handles all HTTP communication with dubros.com ERP system

import type {
  DubrosApiConfig,
  DubrosApiResponse,
  DubrosProduct,
  DubrosCategory,
  DubrosBrand,
  DubrosMaterial,
  FetchOptions,
} from './types';

export class DubrosApiClient {
  private config: Required<DubrosApiConfig>;

  constructor(config: DubrosApiConfig) {
    this.config = {
      baseUrl: config.baseUrl,
      bearerToken: config.bearerToken || '',
      timeout: config.timeout || 30000,
    };
  }

  /**
   * Fetch products from dubros.com
   * Requires authentication to get Price field
   */
  async fetchProducts(options: FetchOptions = {}): Promise<DubrosProduct[]> {
    const defaultConstraints = [
      {
        key: 'Cantidad',
        constraint_type: 'greater than' as const,
        value: 0,
      },
      {
        key: 'Tipo_Venta_Parent',
        constraint_type: 'equals' as const,
        value: 'PIEZA',
      },
      {
        key: 'inactive?',
        constraint_type: 'equals' as const,
        value: false,
      },
      {
        key: 'Categoria_Parent',
        constraint_type: 'in' as const,
        value: [
          '1655827622559x276190851805177440', // Aros opticos
          '1655827630352x227004568853370600', // Sol
        ],
      },
    ];

    const constraints = options.constraints
      ? [...defaultConstraints, ...options.constraints]
      : defaultConstraints;

    const endpoint = `${this.config.baseUrl}/api/1.1/obj/Producto-lean-mirror`;

    return this.fetchPaginated<DubrosProduct>(endpoint, {
      ...options,
      constraints,
    }, true); // requiresAuth = true
  }

  /**
   * Fetch categories from dubros.com
   * No authentication required
   */
  async fetchCategories(options: FetchOptions = {}): Promise<DubrosCategory[]> {
    const endpoint = `${this.config.baseUrl}/api/1.1/obj/Categoria`;
    return this.fetchPaginated<DubrosCategory>(endpoint, options, false);
  }

  /**
   * Fetch brands from dubros.com
   * No authentication required
   * Filters to active brands only by default
   */
  async fetchBrands(options: FetchOptions = {}): Promise<DubrosBrand[]> {
    const defaultConstraints = [
      {
        key: 'active',
        constraint_type: 'equals' as const,
        value: 'yes',
      },
    ];

    const constraints = options.constraints
      ? [...defaultConstraints, ...options.constraints]
      : defaultConstraints;

    const endpoint = `${this.config.baseUrl}/api/1.1/obj/Brands`;

    return this.fetchPaginated<DubrosBrand>(endpoint, {
      ...options,
      constraints,
    }, false);
  }

  /**
   * Fetch materials from dubros.com
   * No authentication required
   */
  async fetchMaterials(options: FetchOptions = {}): Promise<DubrosMaterial[]> {
    const endpoint = `${this.config.baseUrl}/api/1.1/obj/Product_Material`;
    return this.fetchPaginated<DubrosMaterial>(endpoint, options, false);
  }

  /**
   * Generic paginated fetch with automatic page handling
   * Fetches all pages until cursor returns 0 or maxRecords is reached
   */
  private async fetchPaginated<T>(
    endpoint: string,
    options: FetchOptions,
    requiresAuth: boolean
  ): Promise<T[]> {
    const allResults: T[] = [];
    let cursor = options.cursor || 0;
    let hasMore = true;
    const maxRecords = options.maxRecords;

    // Performance logging
    const endpointName = endpoint.split('/').pop() || 'unknown';
    const startTime = Date.now();
    let pageCount = 0;
    console.log(`[DubrosClient] Starting paginated fetch for ${endpointName} (limit: ${options.limit || 'none'}, maxRecords: ${maxRecords || 'none'})`);

    while (hasMore) {
      pageCount++;
      const pageStartTime = Date.now();
      console.log(`[DubrosClient] Fetching page ${pageCount} for ${endpointName}, cursor: ${cursor}`);

      const response = await this.fetchPage<T>(
        endpoint,
        { ...options, cursor },
        requiresAuth
      );

      const pageDuration = Date.now() - pageStartTime;
      console.log(`[DubrosClient] Page ${pageCount} completed in ${pageDuration}ms, got ${response.response.results.length} items, remaining: ${response.response.remaining || 0}`);

      allResults.push(...response.response.results);

      // Check if we've reached maxRecords limit
      if (maxRecords && allResults.length >= maxRecords) {
        const totalDuration = Date.now() - startTime;
        console.log(`[DubrosClient] Reached maxRecords limit (${maxRecords}), returning. Total time: ${totalDuration}ms, pages: ${pageCount}`);
        return allResults.slice(0, maxRecords);
      }

      // Check if there are more pages
      if (response.response.remaining && response.response.remaining > 0) {
        // BUG FIX: Bubble.io API doesn't increment cursor properly, so we calculate it manually
        // Use offset-based pagination: cursor = total items fetched so far
        cursor = allResults.length;
        console.log(`[DubrosClient] Updated cursor to ${cursor} (offset-based pagination)`);
      } else {
        hasMore = false;
      }
    }

    const totalDuration = Date.now() - startTime;
    console.log(`[DubrosClient] Completed paginated fetch for ${endpointName}. Total items: ${allResults.length}, pages: ${pageCount}, time: ${totalDuration}ms`);
    return allResults;
  }

  /**
   * Fetch a single page from dubros.com API
   */
  private async fetchPage<T>(
    endpoint: string,
    options: FetchOptions,
    requiresAuth: boolean
  ): Promise<DubrosApiResponse<T>> {
    const url = new URL(endpoint);

    // Add constraints as query parameters
    if (options.constraints && options.constraints.length > 0) {
      url.searchParams.set('constraints', JSON.stringify(options.constraints));
    }

    // Add cursor if provided
    if (options.cursor !== undefined) {
      url.searchParams.set('cursor', options.cursor.toString());
    }

    // Add limit if provided
    if (options.limit) {
      url.searchParams.set('limit', options.limit.toString());
    }

    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add authentication if required and token is available
    if (requiresAuth && this.config.bearerToken) {
      headers['Authorization'] = `Bearer ${this.config.bearerToken}`;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(
          `dubros.com API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json() as DubrosApiResponse<T>;

      return data;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${this.config.timeout}ms`);
        }
        throw new Error(`Failed to fetch from dubros.com: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Test connection to dubros.com
   * Returns true if API is reachable
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.fetchCategories({ maxRecords: 1 });
      return true;
    } catch (error) {
      console.error('dubros.com connection test failed:', error);
      return false;
    }
  }
}

/**
 * Create a dubros.com API client from environment variables
 */
export function createDubrosClient(): DubrosApiClient {
  const baseUrl = process.env.DUBROS_API_URL || 'https://dubros.com';
  const bearerToken = process.env.DUBROS_BEARER_TOKEN;

  if (!bearerToken) {
    console.warn(
      'DUBROS_BEARER_TOKEN not set - Price field will not be available'
    );
  }

  return new DubrosApiClient({
    baseUrl,
    bearerToken,
    timeout: 30000,
  });
}
