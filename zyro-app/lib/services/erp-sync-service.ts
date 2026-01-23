// ERP Sync Service - Main orchestration for dubros.com sync
// Handles complete sync workflow from fetch to database storage with pricing

import { createAdminClient } from '@/lib/supabase/admin';
import { DubrosApiClient } from '../erp/dubros-client';
import {
  mapCategories,
  mapBrands,
  mapMaterials,
  mapProducts,
  mapProductImage,
} from '../erp/product-mapper';
import { PricingService } from './pricing-service';
import type {
  SyncResult,
  SyncLog,
  SyncError,
  LookupMaps,
  ZeroCategory,
  ZeroBrand,
  ZeroMaterial,
  ZeroProduct,
  ZeroProductImage,
} from '../erp/types';

export class ErpSyncService {
  private dubrosClient: DubrosApiClient;
  private supabase: ReturnType<typeof createAdminClient>;
  private pricingService: PricingService;

  constructor(dubrosClient: DubrosApiClient, supabase: ReturnType<typeof createAdminClient>) {
    this.dubrosClient = dubrosClient;
    this.supabase = supabase;
    this.pricingService = new PricingService();
  }

  /**
   * Execute complete ERP sync workflow
   */
  async executeSync(
    syncType: 'scheduled' | 'manual' = 'manual',
    testLimit: number | null = null,
    shippingCost: number = 25,
    jobId?: string | null,
    existingSyncLogId?: string | null
  ): Promise<SyncResult> {
    const startTime = Date.now();
    let syncLogId: string | null = null;

    console.log('[ERP Sync] ========== STARTING ERP SYNC ==========');
    console.log('[ERP Sync] Sync type:', syncType, '| Test limit:', testLimit);
    console.log('[ERP Sync] Shipping cost:', shippingCost);

    try {
      // Step 1: Initialize sync log (use existing if provided, otherwise create new)
      await this.updateJobProgress(jobId, 5, 'Initializing sync log...');
      if (existingSyncLogId) {
        syncLogId = existingSyncLogId;
        // Update existing sync log to running status
        await this.supabase
          .from('erp_sync_logs')
          .update({
            status: 'running',
            started_at: new Date().toISOString(),
          })
          .eq('id', syncLogId);
        console.log('[ERP Sync] Step 1 complete - Using existing sync log:', syncLogId);
      } else {
        syncLogId = await this.createSyncLog(syncType);
        console.log('[ERP Sync] Step 1 complete - Created new sync log:', syncLogId);
      }

      // Step 2: Load pricing tiers
      await this.updateJobProgress(jobId, 10, 'Loading pricing tiers...');
      console.log('[ERP Sync] Loading pricing tiers...');
      await this.pricingService.loadTiers(this.supabase);
      console.log('[ERP Sync] Pricing tiers loaded:', this.pricingService.getTiers().length, 'tiers');

      // Step 3: Fetch and upsert lookup tables
      await this.updateJobProgress(jobId, 15, 'Syncing categories, brands, materials...');
      console.log('[ERP Sync] Fetching lookup tables...');
      const lookupMaps = await this.syncLookupTables();

      // Step 4: Fetch products from dubros
      await this.updateJobProgress(jobId, 25, 'Fetching products from dubros.com...');
      console.log('[ERP Sync] Fetching products from dubros.com...');
      // Use maxRecords to limit fetch at API level for faster response
      const fetchOptions = testLimit && testLimit > 0
        ? { maxRecords: testLimit }
        : {};
      const dubrosProducts = await this.dubrosClient.fetchProducts(fetchOptions);
      console.log(`[ERP Sync] Fetched ${dubrosProducts.length} products from API`);

      // Step 5: Map and validate products (with pricing)
      await this.updateJobProgress(jobId, 40, 'Calculating prices for products...');
      console.log('[ERP Sync] Mapping products with pricing calculations...');
      const { products, errors: mappingErrors } = mapProducts(
        dubrosProducts,
        lookupMaps,
        this.pricingService,
        shippingCost
      );
      console.log(`[ERP Sync] Successfully mapped ${products.length} products`);
      console.log(`[ERP Sync] Failed to map ${mappingErrors.length} products`);

      // Step 6: Sync products to database
      await this.updateJobProgress(jobId, 50, `Syncing ${products.length} products to database...`);
      console.log('[ERP Sync] Syncing products to database...');
      const { created, updated, syncErrors } = await this.syncProducts(products, syncLogId, jobId);

      // Step 7: Log mapping errors
      for (const { product, validation } of mappingErrors) {
        await this.logSyncError(syncLogId, {
          product_sku: product.Referencia || null,
          error_message: validation.errors[0] || 'Unknown validation error',
          error_details: {
            reason: 'missing_required_field',
            missing_fields: validation.missingFields,
            validation_errors: validation.errors,
            dubros_raw_data: product,
          },
        });
      }

      // Step 8: Deactivate products not in this sync (Option A)
      await this.updateJobProgress(jobId, 95, 'Deactivating missing products...');
      const deactivatedCount = await this.deactivateMissingProducts(products);
      console.log(`[ERP Sync] Deactivated ${deactivatedCount} products not in sync`);

      // Step 9: Finalize sync log
      const duration = Math.round((Date.now() - startTime) / 1000);
      const totalErrors = mappingErrors.length + syncErrors.length;

      await this.finalizeSyncLog(syncLogId, {
        status: totalErrors > 0 ? 'partial' : 'success',
        total_records_fetched: dubrosProducts.length,
        records_processed: created + updated,
        records_updated: updated,
        records_skipped: mappingErrors.length,
        error_count: totalErrors,
        duration_seconds: duration,
      });

      console.log('[ERP Sync] Sync completed successfully');
      console.log(`[ERP Sync] Stats: ${created} created, ${updated} updated, ${totalErrors} errors`);

      return {
        success: true,
        syncLogId,
        stats: {
          fetched: dubrosProducts.length,
          processed: created + updated,
          created,
          updated,
          skipped: mappingErrors.length,
          errors: totalErrors,
        },
        duration,
        errors: [], // TODO: Return actual error objects if needed
      };
    } catch (error) {
      const duration = Math.round((Date.now() - startTime) / 1000);

      // If sync log was created, mark it as failed
      if (syncLogId) {
        await this.finalizeSyncLog(syncLogId, {
          status: 'failed',
          total_records_fetched: 0,
          records_processed: 0,
          records_updated: 0,
          records_skipped: 0,
          error_count: 1,
          duration_seconds: duration,
        });

        await this.logSyncError(syncLogId, {
          product_sku: null,
          error_message: error instanceof Error ? error.message : 'Unknown error',
          error_details: {
            reason: 'network_error',
            stack: error instanceof Error ? error.stack : undefined,
          },
        });
      }

      console.error('[ERP Sync] Sync failed:', error);

      return {
        success: false,
        syncLogId: syncLogId || 'unknown',
        stats: {
          fetched: 0,
          processed: 0,
          created: 0,
          updated: 0,
          skipped: 0,
          errors: 1,
        },
        duration,
        errors: [],
      };
    }
  }

  /**
   * Sync lookup tables (categories, brands, materials)
   * Returns maps for foreign key resolution
   */
  private async syncLookupTables(): Promise<LookupMaps> {
    // Fetch from dubros - use maxRecords to limit total results
    // maxRecords stops pagination early, unlike limit which just sets page size
    const [dubrosCategories, dubrosBrands, dubrosMaterials] = await Promise.all([
      this.dubrosClient.fetchCategories({ maxRecords: 200 }),
      this.dubrosClient.fetchBrands({ maxRecords: 200 }),
      this.dubrosClient.fetchMaterials({ maxRecords: 200 }), // Only ~18 materials exist in dubros
    ]);

    console.log(`[ERP Sync] Fetched ${dubrosCategories.length} categories`);
    console.log(`[ERP Sync] Fetched ${dubrosBrands.length} brands`);
    console.log(`[ERP Sync] Fetched ${dubrosMaterials.length} materials`);

    // Map to ZERO schema
    const zeroCategories = mapCategories(dubrosCategories);
    const zeroBrands = mapBrands(dubrosBrands);
    const zeroMaterials = mapMaterials(dubrosMaterials);

    // Upsert to database and build maps
    const [categoryMap, brandMap, materialMap] = await Promise.all([
      this.upsertCategories(zeroCategories),
      this.upsertBrands(zeroBrands),
      this.upsertMaterials(zeroMaterials),
    ]);

    return {
      categories: categoryMap,
      brands: brandMap,
      materials: materialMap,
    };
  }

  /**
   * Upsert categories and return mapping of dubros_id -> zero_id
   */
  private async upsertCategories(categories: ZeroCategory[]): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    let successCount = 0;
    let errorCount = 0;

    console.log(`[ERP Sync] Upserting ${categories.length} categories...`);

    for (const category of categories) {
      const { data, error } = await this.supabase
        .from('categories')
        .upsert(
          {
            name: category.name,
            slug: category.slug,
            erp_id: category.erp_id,
            display_order: category.display_order,
          },
          {
            onConflict: 'erp_id',
            ignoreDuplicates: false,
          }
        )
        .select('id, erp_id')
        .single();

      if (error) {
        console.error(`[ERP Sync] Failed to upsert category ${category.name}:`, error);
        errorCount++;
        continue;
      }

      if (data && data.erp_id) {
        map.set(data.erp_id, data.id);
        successCount++;
      }
    }

    console.log(`[ERP Sync] Categories: ${successCount} success, ${errorCount} errors`);
    return map;
  }

  /**
   * Upsert brands and return mapping of dubros_id -> zero_id
   */
  private async upsertBrands(brands: ZeroBrand[]): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    let successCount = 0;
    let errorCount = 0;

    console.log(`[ERP Sync] Upserting ${brands.length} brands...`);

    for (const brand of brands) {
      const { data, error } = await this.supabase
        .from('brands')
        .upsert(
          {
            name: brand.name,
            slug: brand.slug,
            logo_url: brand.logo_url,
            erp_id: brand.erp_id,
          },
          {
            onConflict: 'erp_id',
            ignoreDuplicates: false,
          }
        )
        .select('id, erp_id')
        .single();

      if (error) {
        console.error(`[ERP Sync] Failed to upsert brand ${brand.name}:`, error);
        errorCount++;
        continue;
      }

      if (data && data.erp_id) {
        map.set(data.erp_id, data.id);
        successCount++;
      }
    }

    console.log(`[ERP Sync] Brands: ${successCount} success, ${errorCount} errors`);
    return map;
  }

  /**
   * Upsert materials and return mapping of dubros_id -> zero_id
   */
  private async upsertMaterials(materials: ZeroMaterial[]): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    let successCount = 0;
    let errorCount = 0;

    console.log(`[ERP Sync] Upserting ${materials.length} materials...`);

    for (const material of materials) {
      const { data, error } = await this.supabase
        .from('frame_materials')
        .upsert(
          {
            name: material.name,
            erp_id: material.erp_id,
          },
          {
            onConflict: 'erp_id',
            ignoreDuplicates: false,
          }
        )
        .select('id, erp_id')
        .single();

      if (error) {
        console.error(`[ERP Sync] Failed to upsert material ${material.name}:`, error);
        errorCount++;
        continue;
      }

      if (data && data.erp_id) {
        map.set(data.erp_id, data.id);
        successCount++;
      }
    }

    console.log(`[ERP Sync] Materials: ${successCount} success, ${errorCount} errors`);
    return map;
  }

  /**
   * Sync products to database
   * Returns counts of created and updated products
   */
  private async syncProducts(
    products: ZeroProduct[],
    syncLogId: string,
    jobId?: string | null
  ): Promise<{ created: number; updated: number; syncErrors: SyncError[] }> {
    let created = 0;
    let updated = 0;
    const syncErrors: SyncError[] = [];
    const totalProducts = products.length;

    for (let i = 0; i < products.length; i++) {
      const product = products[i];

      // Update progress every 50 products
      if (jobId && i % 50 === 0) {
        const progress = 50 + Math.round((i / totalProducts) * 45); // 50-95%
        await this.updateJobProgress(jobId, progress, `Syncing products: ${i}/${totalProducts}...`);
      }

      try {
        // Check if product exists and has price override
        const { data: existing } = await this.supabase
          .from('products')
          .select('id, stock_quantity, is_price_override, price')
          .eq('sku', product.sku)
          .single();

        const isUpdate = !!existing;
        const oldStock = existing?.stock_quantity || 0;

        // If product has manual price override, preserve it
        let finalPrice = product.price;
        let isPriceOverride = false;

        if (existing?.is_price_override) {
          finalPrice = existing.price;
          isPriceOverride = true;
          console.log(`[ERP Sync] Preserving price override for ${product.sku}: $${finalPrice}`);
        }

        // Upsert product (with pricing fields)
        const { data: upsertedProduct, error: productError} = await this.supabase
          .from('products')
          .upsert(
            {
              sku: product.sku,
              name: product.name,
              description: product.description,
              price: finalPrice, // Use preserved price if override
              stock_quantity: product.stock_quantity,
              brand_id: product.brand_id,
              category_id: product.category_id,
              frame_material_id: product.frame_material_id,
              frame_shape_id: product.frame_shape_id,
              lens_width: product.lens_width,
              bridge_width: product.bridge_width,
              temple_length: product.temple_length,
              gender: product.gender,

              // Pricing fields (always update dubros cost, but preserve price if override)
              cost_dubros: product.cost_dubros,
              cost_shipping: product.cost_shipping,
              cost_total: product.cost_total,
              pricing_tier_id: product.pricing_tier_id,
              markup_multiplier: product.markup_multiplier,
              profit_amount: isPriceOverride
                ? finalPrice - (product.cost_total || 0)
                : product.profit_amount,
              profit_margin_percent: isPriceOverride && product.cost_total
                ? ((finalPrice - product.cost_total) / product.cost_total) * 100
                : product.profit_margin_percent,
              is_price_override: isPriceOverride,
              is_sold_by_dozen: product.is_sold_by_dozen,
              price_calculated_at: product.price_calculated_at,

              // ERP tracking
              erp_id: product.erp_id,
              erp_last_synced_at: product.erp_last_synced_at,
              erp_data: product.erp_data,
              sync_status: product.sync_status,
              low_stock_threshold: product.low_stock_threshold,
              is_active: product.is_active,
            },
            {
              onConflict: 'sku',
              ignoreDuplicates: false,
            }
          )
          .select('id')
          .single();

        if (productError) {
          console.error(`Failed to upsert product ${product.sku}:`, productError);
          await this.logSyncError(syncLogId, {
            product_sku: product.sku,
            error_message: productError.message,
            error_details: {
              reason: 'other',
              error: productError,
            },
          });
          syncErrors.push({
            sync_log_id: syncLogId,
            product_sku: product.sku,
            error_message: productError.message,
            error_details: { reason: 'other' },
          });
          continue;
        }

        if (!upsertedProduct) {
          console.error(`Failed to get product ID after upsert: ${product.sku}`);
          continue;
        }

        // Update image if available
        const image = mapProductImage(product.erp_data as any, upsertedProduct.id);
        if (image) {
          await this.upsertProductImage(image);
        }

        // Log inventory movement if stock changed
        if (isUpdate && oldStock !== product.stock_quantity) {
          await this.logInventoryMovement({
            product_id: upsertedProduct.id,
            movement_type: 'erp_sync',
            quantity_change: product.stock_quantity - oldStock,
            quantity_after: product.stock_quantity,
            reference_id: syncLogId,
            reason: 'ERP sync from dubros.com',
          });
        }

        if (isUpdate) {
          updated++;
        } else {
          created++;
        }
      } catch (error) {
        console.error(`Error syncing product ${product.sku}:`, error);
        await this.logSyncError(syncLogId, {
          product_sku: product.sku,
          error_message: error instanceof Error ? error.message : 'Unknown error',
          error_details: {
            reason: 'other',
            error: error instanceof Error ? error.stack : undefined,
          },
        });
        syncErrors.push({
          sync_log_id: syncLogId,
          product_sku: product.sku,
          error_message: error instanceof Error ? error.message : 'Unknown error',
          error_details: { reason: 'other' },
        });
      }
    }

    return { created, updated, syncErrors };
  }

  /**
   * Upsert product image
   */
  private async upsertProductImage(image: ZeroProductImage): Promise<void> {
    // First, check if image exists for this product
    const { data: existing } = await this.supabase
      .from('product_images')
      .select('id')
      .eq('product_id', image.product_id)
      .eq('is_primary', true)
      .single();

    if (existing) {
      // Update existing image
      await this.supabase
        .from('product_images')
        .update({
          image_url: image.image_url,
          image_url_high: image.image_url_high,
          cloudfront_url: image.cloudfront_url,
        })
        .eq('id', existing.id);
    } else {
      // Insert new image
      await this.supabase.from('product_images').insert({
        product_id: image.product_id,
        image_url: image.image_url,
        image_url_high: image.image_url_high,
        cloudfront_url: image.cloudfront_url,
        is_primary: image.is_primary,
        display_order: image.display_order,
      });
    }
  }

  /**
   * Create sync log entry
   */
  private async createSyncLog(syncType: 'scheduled' | 'manual'): Promise<string> {
    console.log('[ERP Sync] Creating sync log entry...');

    const { data, error } = await this.supabase
      .from('erp_sync_logs')
      .insert({
        sync_type: syncType,
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

    if (error) {
      console.error('[ERP Sync] Failed to create sync log:', error);
      throw new Error(`Failed to create sync log: ${error?.message}`);
    }

    if (!data) {
      console.error('[ERP Sync] No data returned from sync log insert');
      throw new Error('Failed to create sync log: No data returned');
    }

    console.log('[ERP Sync] Sync log created with ID:', data.id);
    return data.id;
  }

  /**
   * Finalize sync log with results
   */
  private async finalizeSyncLog(
    syncLogId: string,
    updates: Partial<SyncLog>
  ): Promise<void> {
    await this.supabase
      .from('erp_sync_logs')
      .update({
        ...updates,
        completed_at: new Date().toISOString(),
      })
      .eq('id', syncLogId);
  }

  /**
   * Log sync error
   */
  private async logSyncError(
    syncLogId: string,
    error: Omit<SyncError, 'id' | 'sync_log_id' | 'created_at'>
  ): Promise<void> {
    await this.supabase.from('erp_sync_errors').insert({
      sync_log_id: syncLogId,
      product_sku: error.product_sku,
      error_message: error.error_message,
      error_details: error.error_details,
    });
  }

  /**
   * Log inventory movement
   */
  private async logInventoryMovement(movement: {
    product_id: string;
    movement_type: string;
    quantity_change: number;
    quantity_after: number;
    reference_id: string;
    reason: string;
  }): Promise<void> {
    await this.supabase.from('inventory_movements').insert(movement);
  }

  /**
   * Update job progress in erp_sync_jobs table
   */
  private async updateJobProgress(
    jobId: string | null | undefined,
    progress: number,
    currentStep: string
  ): Promise<void> {
    if (!jobId) return;

    try {
      await this.supabase
        .from('erp_sync_jobs')
        .update({
          progress,
          current_step: currentStep,
        })
        .eq('id', jobId);
    } catch (error) {
      console.error('[ERP Sync] Failed to update job progress:', error);
      // Don't throw - progress updates are non-critical
    }
  }

  /**
   * Deactivate products that are not in the current sync
   * This marks them as inactive and sets stock to 0
   * (Option A: Products missing from dubros.com are considered out of stock)
   *
   * FIX: Batch deactivation to avoid 414 Request-URI Too Large error
   * Strategy: Fetch all active ERP products, filter in memory, then batch deactivate
   */
  private async deactivateMissingProducts(syncedProducts: ZeroProduct[]): Promise<number> {
    try {
      // Get all ERP IDs from the current sync
      const syncedErpIds = new Set(
        syncedProducts
          .map(p => p.erp_id)
          .filter(Boolean) as string[]
      );

      if (syncedErpIds.size === 0) {
        console.log('[ERP Sync] No ERP IDs to compare - skipping deactivation');
        return 0;
      }

      console.log(`[ERP Sync] Finding products to deactivate (not in ${syncedErpIds.size} synced products)...`);

      // Step 1: Fetch ALL active products that have an erp_id
      // We filter in memory to avoid URI length issues with large NOT IN clauses
      const { data: allActiveErpProducts, error: fetchError } = await this.supabase
        .from('products')
        .select('id, sku, erp_id')
        .not('erp_id', 'is', null) // Only products that came from ERP
        .eq('is_active', true); // Only currently active products

      if (fetchError) {
        console.error('[ERP Sync] Failed to fetch active ERP products:', fetchError);
        return 0;
      }

      if (!allActiveErpProducts || allActiveErpProducts.length === 0) {
        console.log('[ERP Sync] No active ERP products found');
        return 0;
      }

      console.log(`[ERP Sync] Fetched ${allActiveErpProducts.length} active ERP products`);

      // Step 2: Filter in memory to find products NOT in current sync
      const productsToDeactivate = allActiveErpProducts.filter(
        product => product.erp_id && !syncedErpIds.has(product.erp_id)
      );

      if (productsToDeactivate.length === 0) {
        console.log('[ERP Sync] No products need deactivation');
        return 0;
      }

      console.log(`[ERP Sync] Found ${productsToDeactivate.length} products to deactivate`);

      // Step 3: Deactivate products in batches of 50 to avoid URI length issues
      const batchSize = 50;
      let totalDeactivated = 0;

      for (let i = 0; i < productsToDeactivate.length; i += batchSize) {
        const batch = productsToDeactivate.slice(i, i + batchSize);
        const batchIds = batch.map(p => p.id);

        console.log(`[ERP Sync] Deactivating batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(productsToDeactivate.length / batchSize)} (${batch.length} products)...`);

        const { data, error } = await this.supabase
          .from('products')
          .update({
            is_active: false,
            stock_quantity: 0,
            erp_last_synced_at: new Date().toISOString(),
          })
          .in('id', batchIds)
          .select('id, sku');

        if (error) {
          console.error(`[ERP Sync] Failed to deactivate batch:`, error);
          // Continue with next batch even if this one fails
          continue;
        }

        const deactivatedCount = data?.length || 0;
        totalDeactivated += deactivatedCount;

        // Log SKUs for audit trail
        if (data && data.length > 0) {
          const skus = data.map(p => p.sku).join(', ');
          console.log(`[ERP Sync] Batch deactivated ${deactivatedCount} products: ${skus}`);
        }
      }

      console.log(`[ERP Sync] Total deactivated: ${totalDeactivated} products`);
      return totalDeactivated;
    } catch (error) {
      console.error('[ERP Sync] Error in deactivateMissingProducts:', error);
      return 0;
    }
  }
}

/**
 * Create ERP sync service instance
 */
export function createErpSyncService(dubrosClient: DubrosApiClient): ErpSyncService {
  const supabase = createAdminClient();
  return new ErpSyncService(dubrosClient, supabase);
}
