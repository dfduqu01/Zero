// Pricing Recalculation Service - Orchestrates background pricing updates
// Mirrors ERP sync pattern for consistency

import { createAdminClient } from '@/lib/supabase/admin';
import { PricingService } from './pricing-service';

/**
 * Parameters for pricing recalculation job
 */
export interface RecalculationParams {
  shippingCost: number;
  respectOverrides: boolean;
  productIds: string[] | null;
  pricingFormula: 1 | 2;
  createdBy?: string;
}

/**
 * Result of pricing recalculation
 */
export interface RecalculationResult {
  success: boolean;
  logId: string;
  stats: {
    total: number;
    updated: number;
    skipped: number;
    errors: number;
  };
  duration: number;
}

/**
 * Product data for recalculation
 */
interface ProductForRecalc {
  id: string;
  sku: string;
  cost_dubros: number;
  is_price_override: boolean;
  price: number;
}

/**
 * PricingRecalculationService handles background pricing updates for products
 *
 * Supports two pricing formulas:
 * - Formula 1: price = shipping_cost + (cost_dubros × markup)
 * - Formula 2: price = cost_dubros × markup (shipping separate)
 */
export class PricingRecalculationService {
  private supabase: ReturnType<typeof createAdminClient>;
  private pricingService: PricingService;

  constructor(supabase: ReturnType<typeof createAdminClient>) {
    this.supabase = supabase;
    this.pricingService = new PricingService();
  }

  /**
   * Execute complete pricing recalculation workflow
   */
  async executeRecalculation(
    jobId: string,
    logId: string,
    params: RecalculationParams
  ): Promise<RecalculationResult> {
    const startTime = Date.now();

    console.log('[Pricing Recalc] ========== STARTING PRICING RECALCULATION ==========');
    console.log('[Pricing Recalc] Formula:', params.pricingFormula);
    console.log('[Pricing Recalc] Shipping cost:', params.shippingCost);
    console.log('[Pricing Recalc] Respect overrides:', params.respectOverrides);
    console.log('[Pricing Recalc] Product filter:', params.productIds ? `${params.productIds.length} specific` : 'all');

    try {
      // Step 1: Load pricing tiers (0-10%)
      await this.updateJobProgress(jobId, 5, 'Loading pricing tiers...');
      console.log('[Pricing Recalc] Loading pricing tiers...');
      await this.pricingService.loadTiers(this.supabase);
      console.log('[Pricing Recalc] Loaded', this.pricingService.getTiers().length, 'pricing tiers');

      // Step 2: Fetch products (10-20%)
      await this.updateJobProgress(jobId, 10, 'Fetching products...');
      console.log('[Pricing Recalc] Fetching products...');
      const products = await this.fetchProductsInChunks(params);
      console.log(`[Pricing Recalc] Fetched ${products.length} products to process`);

      // Update log with total count
      await this.supabase
        .from('pricing_recalculation_logs')
        .update({ total_products: products.length })
        .eq('id', logId);

      await this.updateJobProgress(
        jobId,
        20,
        `Processing ${products.length} products...`,
        0,
        products.length
      );

      // Step 3: Recalculate products (20-95%)
      const stats = await this.recalculateProducts(products, params, jobId, logId);

      // Step 4: Finalize (95-100%)
      await this.updateJobProgress(jobId, 95, 'Finalizing...');
      const duration = Math.round((Date.now() - startTime) / 1000);

      await this.finalizeRecalcLog(logId, {
        status: stats.errors > 0 ? 'partial' : 'success',
        products_updated: stats.updated,
        products_skipped: stats.skipped,
        error_count: stats.errors,
        duration_seconds: duration,
      });

      await this.updateJobProgress(jobId, 100, 'Completed', stats.updated, stats.total);

      console.log('[Pricing Recalc] Recalculation completed successfully');
      console.log(`[Pricing Recalc] Stats: ${stats.updated} updated, ${stats.skipped} skipped, ${stats.errors} errors`);

      return {
        success: true,
        logId,
        stats: {
          total: stats.total,
          updated: stats.updated,
          skipped: stats.skipped,
          errors: stats.errors,
        },
        duration,
      };
    } catch (error) {
      const duration = Math.round((Date.now() - startTime) / 1000);

      // Mark log as failed
      await this.finalizeRecalcLog(logId, {
        status: 'failed',
        products_updated: 0,
        products_skipped: 0,
        error_count: 1,
        duration_seconds: duration,
      });

      // Log the fatal error
      await this.logRecalcError(logId, {
        product_id: null,
        product_sku: null,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        error_details: {
          reason: 'fatal_error',
          stack: error instanceof Error ? error.stack : undefined,
        },
      });

      console.error('[Pricing Recalc] Recalculation failed:', error);

      return {
        success: false,
        logId,
        stats: {
          total: 0,
          updated: 0,
          skipped: 0,
          errors: 1,
        },
        duration,
      };
    }
  }

  /**
   * Fetch products in chunks to handle 4,000+ products
   * Uses same pattern as products page (Map deduplication)
   */
  private async fetchProductsInChunks(params: RecalculationParams): Promise<ProductForRecalc[]> {
    const CHUNK_SIZE = 1000;
    const productMap = new Map<string, ProductForRecalc>();
    let hasMore = true;
    let offset = 0;

    while (hasMore) {
      let query = this.supabase
        .from('products')
        .select('id, sku, cost_dubros, is_price_override, price');

      // Only process active products with stock
      query = query.eq('is_active', true);
      query = query.gt('stock_quantity', 0);

      // Filter by price override flag if needed
      if (params.respectOverrides) {
        query = query.eq('is_price_override', false);
      }

      // Filter by specific product IDs if provided
      if (params.productIds && Array.isArray(params.productIds) && params.productIds.length > 0) {
        query = query.in('id', params.productIds);
      }

      // Add pagination
      query = query.range(offset, offset + CHUNK_SIZE - 1);

      const { data: chunk, error: chunkError } = await query;

      if (chunkError) {
        console.error(`[Pricing Recalc] Error fetching chunk at offset ${offset}:`, chunkError);
        throw new Error(`Failed to fetch products: ${chunkError.message}`);
      }

      if (!chunk || chunk.length === 0) {
        hasMore = false;
        break;
      }

      // Add to Map for deduplication
      chunk.forEach(product => {
        productMap.set(product.id, product as ProductForRecalc);
      });

      // If we got fewer rows than requested, we've reached the end
      if (chunk.length < CHUNK_SIZE) {
        hasMore = false;
      } else {
        offset += CHUNK_SIZE;
      }
    }

    return Array.from(productMap.values());
  }

  /**
   * Recalculate prices for products
   * Returns stats about the operation
   */
  private async recalculateProducts(
    products: ProductForRecalc[],
    params: RecalculationParams,
    jobId: string,
    logId: string
  ): Promise<{ total: number; updated: number; skipped: number; errors: number }> {
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    const total = products.length;

    for (let i = 0; i < products.length; i++) {
      const product = products[i];

      // Update progress every 100 products (20-95%)
      if (i % 100 === 0) {
        const progress = 20 + Math.round((i / total) * 75); // 20-95%
        await this.updateJobProgress(
          jobId,
          progress,
          `Recalculating products: ${i}/${total}...`,
          i,
          total
        );
      }

      try {
        // Skip if no dubros cost
        if (!product.cost_dubros || product.cost_dubros <= 0) {
          console.warn('[Pricing Recalc] Skipping', product.sku, '- no dubros cost');
          skipped++;
          continue;
        }

        // Calculate new pricing using selected formula
        const pricing = this.pricingService.calculatePriceWithFormula(
          product.cost_dubros,
          params.shippingCost,
          params.pricingFormula
        );

        if (!pricing) {
          console.warn('[Pricing Recalc] Skipping', product.sku, '- no tier found for cost', product.cost_dubros);
          skipped++;
          continue;
        }

        // Update product with new pricing
        const { error: updateError } = await this.supabase
          .from('products')
          .update({
            cost_shipping: pricing.cost_shipping,
            cost_total: pricing.cost_total,
            pricing_tier_id: pricing.pricing_tier_id,
            markup_multiplier: pricing.markup_multiplier,
            price: pricing.price,
            profit_amount: pricing.profit_amount,
            profit_margin_percent: pricing.profit_margin_percent,
            price_calculated_at: new Date().toISOString(),
          })
          .eq('id', product.id);

        if (updateError) {
          console.error('[Pricing Recalc] Error updating', product.sku, ':', updateError);
          await this.logRecalcError(logId, {
            product_id: product.id,
            product_sku: product.sku,
            error_message: updateError.message,
            error_details: {
              reason: 'database_error',
              error: updateError,
            },
          });
          errors++;
          continue;
        }

        updated++;

        // Log progress every 500 products
        if (updated % 500 === 0) {
          console.log(`[Pricing Recalc] Progress: ${updated}/${total} products updated`);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('[Pricing Recalc] Error processing', product.sku, ':', errorMessage);
        await this.logRecalcError(logId, {
          product_id: product.id,
          product_sku: product.sku,
          error_message: errorMessage,
          error_details: {
            reason: 'processing_error',
            error: err instanceof Error ? err.stack : undefined,
          },
        });
        errors++;
      }
    }

    return { total, updated, skipped, errors };
  }

  /**
   * Finalize recalculation log with results
   */
  private async finalizeRecalcLog(
    logId: string,
    updates: {
      status: 'running' | 'success' | 'partial' | 'failed';
      products_updated: number;
      products_skipped: number;
      error_count: number;
      duration_seconds: number;
    }
  ): Promise<void> {
    await this.supabase
      .from('pricing_recalculation_logs')
      .update({
        ...updates,
        completed_at: new Date().toISOString(),
      })
      .eq('id', logId);
  }

  /**
   * Log individual pricing error
   */
  private async logRecalcError(
    logId: string,
    error: {
      product_id: string | null;
      product_sku: string | null;
      error_message: string;
      error_details: any;
    }
  ): Promise<void> {
    await this.supabase.from('pricing_recalculation_errors').insert({
      log_id: logId,
      product_id: error.product_id,
      product_sku: error.product_sku,
      error_message: error.error_message,
      error_details: error.error_details,
    });
  }

  /**
   * Update job progress in background_jobs table
   */
  private async updateJobProgress(
    jobId: string,
    progress: number,
    currentStep: string,
    currentItemCount?: number,
    totalItemCount?: number
  ): Promise<void> {
    try {
      const updates: any = {
        progress,
        current_step: currentStep,
      };

      if (currentItemCount !== undefined) {
        updates.current_item_count = currentItemCount;
      }

      if (totalItemCount !== undefined) {
        updates.total_item_count = totalItemCount;
      }

      await this.supabase
        .from('background_jobs')
        .update(updates)
        .eq('id', jobId);
    } catch (error) {
      console.error('[Pricing Recalc] Failed to update job progress:', error);
      // Don't throw - progress updates are non-critical
    }
  }
}

/**
 * Create pricing recalculation service instance
 */
export function createPricingRecalculationService(): PricingRecalculationService {
  const supabase = createAdminClient();
  return new PricingRecalculationService(supabase);
}
