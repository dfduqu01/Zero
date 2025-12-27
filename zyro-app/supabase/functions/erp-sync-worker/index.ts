// Supabase Edge Function: erp-sync-worker
// Processes ERP sync jobs asynchronously without timeout constraints
// Deployed at: /functions/v1/erp-sync-worker

import { createClient } from 'jsr:@supabase/supabase-js@2';

// Import types
interface JobProgressUpdate {
  progress: number;
  current_step: string;
  current_item_count: number;
  total_item_count?: number;
}

interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsUpdated: number;
  recordsCreated: number;
  recordsSkipped: number;
  errorCount: number;
  errors?: Array<{
    erp_id: string;
    error_type: string;
    error_message: string;
  }>;
}

Deno.serve(async (req: Request) => {
  try {
    // Parse request body
    const { job_id } = await req.json();

    if (!job_id) {
      return new Response(
        JSON.stringify({ error: 'job_id is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Worker] Processing job: ${job_id}`);

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch job details
    const { data: job, error: fetchError } = await supabase
      .from('erp_sync_jobs')
      .select('*, erp_sync_logs(*)')
      .eq('id', job_id)
      .single();

    if (fetchError || !job) {
      console.error(`[Worker] Failed to fetch job ${job_id}:`, fetchError);
      return new Response(
        JSON.stringify({ error: 'Job not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if already running or completed
    if (['running', 'completed', 'cancelled'].includes(job.status)) {
      console.log(`[Worker] Job ${job_id} already ${job.status}, skipping`);
      return new Response(
        JSON.stringify({ message: `Job already ${job.status}` }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update job status to running
    await supabase
      .from('erp_sync_jobs')
      .update({
        status: 'running',
        started_at: new Date().toISOString(),
        current_step: 'Starting sync...',
        progress: 0,
      })
      .eq('id', job_id);

    // Update sync log status
    await supabase
      .from('erp_sync_logs')
      .update({
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .eq('id', job.sync_log_id);

    console.log(`[Worker] Job ${job_id} marked as running`);

    // Execute the sync using the worker logic
    const result = await executeSync(
      supabase,
      job_id,
      job.sync_log_id,
      job.sync_type,
      job.test_limit
    );

    // Check if cancellation was requested during sync
    const { data: finalJob } = await supabase
      .from('erp_sync_jobs')
      .select('cancel_requested')
      .eq('id', job_id)
      .single();

    if (finalJob?.cancel_requested) {
      console.log(`[Worker] Job ${job_id} was cancelled`);

      await supabase
        .from('erp_sync_jobs')
        .update({
          status: 'cancelled',
          completed_at: new Date().toISOString(),
          current_step: 'Cancelled by user',
          progress: 100,
        })
        .eq('id', job_id);

      await supabase
        .from('erp_sync_logs')
        .update({
          status: 'cancelled',
          completed_at: new Date().toISOString(),
          records_processed: result.recordsProcessed,
          records_updated: result.recordsUpdated,
          records_created: result.recordsCreated,
          records_skipped: result.recordsSkipped,
          error_count: result.errorCount,
        })
        .eq('id', job.sync_log_id);

      return new Response(
        JSON.stringify({ message: 'Job cancelled', result }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update job as completed
    const finalStatus = result.success ? 'completed' : 'failed';

    await supabase
      .from('erp_sync_jobs')
      .update({
        status: finalStatus,
        completed_at: new Date().toISOString(),
        current_step: result.success ? 'Completed successfully' : 'Failed',
        progress: 100,
        error_message: result.success ? null : 'Sync failed with errors',
        error_details: result.success ? null : { errors: result.errors },
      })
      .eq('id', job_id);

    await supabase
      .from('erp_sync_logs')
      .update({
        status: finalStatus,
        completed_at: new Date().toISOString(),
        total_records_fetched: result.recordsProcessed,
        records_processed: result.recordsProcessed,
        records_updated: result.recordsUpdated,
        records_created: result.recordsCreated,
        records_skipped: result.recordsSkipped,
        error_count: result.errorCount,
      })
      .eq('id', job.sync_log_id);

    console.log(`[Worker] Job ${job_id} completed with status: ${finalStatus}`);

    return new Response(
      JSON.stringify({
        success: result.success,
        message: `Sync ${finalStatus}`,
        result,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Worker] Fatal error:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Execute the ERP sync with progress tracking
 * This is a simplified version - we'll need to refactor the actual sync service
 * to work in the Edge Function environment
 */
async function executeSync(
  supabase: any,
  jobId: string,
  syncLogId: string,
  syncType: string,
  testLimit: number | null
): Promise<SyncResult> {
  console.log(`[Worker] Starting sync for job ${jobId}, limit: ${testLimit || 'none'}`);

  // Get environment variables for dubros API
  const dubrosApiUrl = Deno.env.get('DUBROS_API_URL');
  const dubrosBearerToken = Deno.env.get('DUBROS_BEARER_TOKEN');

  if (!dubrosApiUrl) {
    throw new Error('DUBROS_API_URL not configured');
  }

  // Initialize counters
  let recordsProcessed = 0;
  let recordsCreated = 0;
  let recordsUpdated = 0;
  let recordsSkipped = 0;
  let errorCount = 0;
  const errors: Array<{ erp_id: string; error_type: string; error_message: string }> = [];

  try {
    // Step 1: Fetch products from dubros.com
    await updateProgress(supabase, jobId, {
      progress: 5,
      current_step: 'Fetching products from dubros.com...',
      current_item_count: 0,
    });

    const products = await fetchDubrosProducts(dubrosApiUrl, dubrosBearerToken, testLimit);

    console.log(`[Worker] Fetched ${products.length} products from dubros.com`);

    await updateProgress(supabase, jobId, {
      progress: 10,
      current_step: 'Fetching lookup data (brands, categories, materials)...',
      current_item_count: 0,
      total_item_count: products.length,
    });

    // Step 2: Fetch lookup data
    const [brands, categories, materials] = await Promise.all([
      fetchDubrosBrands(dubrosApiUrl),
      fetchDubrosCategories(dubrosApiUrl),
      fetchDubrosMaterials(dubrosApiUrl),
    ]);

    console.log(`[Worker] Fetched lookup data: ${brands.length} brands, ${categories.length} categories, ${materials.length} materials`);

    // Step 3: Sync lookup data
    await updateProgress(supabase, jobId, {
      progress: 15,
      current_step: 'Syncing lookup data to database...',
      current_item_count: 0,
      total_item_count: products.length,
    });

    await syncLookupData(supabase, brands, categories, materials);

    // Step 4: Process products in batches
    const BATCH_SIZE = 100;
    const totalBatches = Math.ceil(products.length / BATCH_SIZE);

    for (let i = 0; i < totalBatches; i++) {
      // Check for cancellation every batch
      const { data: job } = await supabase
        .from('erp_sync_jobs')
        .select('cancel_requested')
        .eq('id', jobId)
        .single();

      if (job?.cancel_requested) {
        console.log(`[Worker] Cancellation detected at batch ${i + 1}/${totalBatches}`);
        break;
      }

      const start = i * BATCH_SIZE;
      const end = Math.min(start + BATCH_SIZE, products.length);
      const batch = products.slice(start, end);

      console.log(`[Worker] Processing batch ${i + 1}/${totalBatches} (${batch.length} products)`);

      // Process each product in the batch
      for (const product of batch) {
        try {
          const result = await processProduct(supabase, product, brands, categories, materials);

          recordsProcessed++;
          if (result.created) recordsCreated++;
          if (result.updated) recordsUpdated++;
          if (result.skipped) recordsSkipped++;
        } catch (error) {
          errorCount++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';

          errors.push({
            erp_id: product._id,
            error_type: 'processing_error',
            error_message: errorMessage,
          });

          // Log error to database
          await supabase.from('erp_sync_errors').insert({
            sync_log_id: syncLogId,
            erp_id: product._id,
            error_type: 'processing_error',
            error_message: errorMessage,
            product_data: product,
          });

          console.error(`[Worker] Error processing product ${product._id}:`, errorMessage);
        }
      }

      // Update progress every batch
      const progress = Math.min(15 + Math.floor((recordsProcessed / products.length) * 80), 95);
      await updateProgress(supabase, jobId, {
        progress,
        current_step: `Processing products (${recordsProcessed}/${products.length})...`,
        current_item_count: recordsProcessed,
        total_item_count: products.length,
      });
    }

    // Step 5: Complete
    await updateProgress(supabase, jobId, {
      progress: 100,
      current_step: 'Sync completed',
      current_item_count: recordsProcessed,
      total_item_count: products.length,
    });

    return {
      success: errorCount === 0 || errorCount < products.length * 0.5, // Success if <50% errors
      recordsProcessed,
      recordsCreated,
      recordsUpdated,
      recordsSkipped,
      errorCount,
      errors: errors.slice(0, 100), // Return first 100 errors
    };

  } catch (error) {
    console.error('[Worker] Fatal sync error:', error);
    throw error;
  }
}

/**
 * Update job progress in database
 */
async function updateProgress(
  supabase: any,
  jobId: string,
  update: JobProgressUpdate
): Promise<void> {
  await supabase
    .from('erp_sync_jobs')
    .update(update)
    .eq('id', jobId);
}

/**
 * Fetch products from dubros.com API
 */
async function fetchDubrosProducts(
  baseUrl: string,
  bearerToken: string | undefined,
  limit: number | null
): Promise<any[]> {
  const constraints = [
    { key: 'Cantidad', constraint_type: 'greater than', value: 0 },
    { key: 'Tipo_Venta_Parent', constraint_type: 'equals', value: 'PIEZA' },
    { key: 'inactive?', constraint_type: 'equals', value: false },
  ];

  const url = new URL(`${baseUrl}/api/1.1/obj/Producto-lean-mirror`);
  url.searchParams.set('constraints', JSON.stringify(constraints));

  if (limit) {
    url.searchParams.set('limit', limit.toString());
  }

  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (bearerToken) {
    headers['Authorization'] = `Bearer ${bearerToken}`;
  }

  const allProducts: any[] = [];
  let cursor = 0;
  let hasMore = true;

  while (hasMore) {
    url.searchParams.set('cursor', cursor.toString());

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    allProducts.push(...data.response.results);

    if (limit && allProducts.length >= limit) {
      return allProducts.slice(0, limit);
    }

    if (data.response.remaining > 0) {
      cursor = data.response.cursor;
    } else {
      hasMore = false;
    }
  }

  return allProducts;
}

/**
 * Fetch brands from dubros.com API
 */
async function fetchDubrosBrands(baseUrl: string): Promise<any[]> {
  const constraints = [
    { key: 'active', constraint_type: 'equals', value: 'yes' },
  ];

  const url = new URL(`${baseUrl}/api/1.1/obj/Brands`);
  url.searchParams.set('constraints', JSON.stringify(constraints));

  const response = await fetch(url.toString());
  const data = await response.json();
  return data.response.results;
}

/**
 * Fetch categories from dubros.com API
 */
async function fetchDubrosCategories(baseUrl: string): Promise<any[]> {
  const url = new URL(`${baseUrl}/api/1.1/obj/Categoria`);
  const response = await fetch(url.toString());
  const data = await response.json();
  return data.response.results;
}

/**
 * Fetch materials from dubros.com API
 */
async function fetchDubrosMaterials(baseUrl: string): Promise<any[]> {
  const url = new URL(`${baseUrl}/api/1.1/obj/Product_Material`);
  const response = await fetch(url.toString());
  const data = await response.json();
  return data.response.results;
}

/**
 * Sync lookup data to database
 */
async function syncLookupData(
  supabase: any,
  brands: any[],
  categories: any[],
  materials: any[]
): Promise<void> {
  // Upsert brands
  const brandData = brands.map(b => ({
    erp_id: b._id,
    name: b.Name || 'Unknown Brand',
  }));

  if (brandData.length > 0) {
    await supabase.from('brands').upsert(brandData, {
      onConflict: 'erp_id',
      ignoreDuplicates: false,
    });
  }

  // Upsert categories
  const categoryData = categories.map(c => ({
    erp_id: c._id,
    name: c.Nombre || 'Unknown Category',
  }));

  if (categoryData.length > 0) {
    await supabase.from('categories').upsert(categoryData, {
      onConflict: 'erp_id',
      ignoreDuplicates: false,
    });
  }

  // Upsert materials
  const materialData = materials.map(m => ({
    erp_id: m._id,
    name: m.Material || 'Unknown Material',
  }));

  if (materialData.length > 0) {
    await supabase.from('materials').upsert(materialData, {
      onConflict: 'erp_id',
      ignoreDuplicates: false,
    });
  }
}

/**
 * Process a single product
 */
async function processProduct(
  supabase: any,
  product: any,
  brands: any[],
  categories: any[],
  materials: any[]
): Promise<{ created: boolean; updated: boolean; skipped: boolean }> {
  // Resolve brand
  const brand = brands.find(b => b._id === product.Marca_Parent);
  if (!brand) {
    throw new Error(`Brand not found: ${product.Marca_Parent}`);
  }

  const { data: brandRecord } = await supabase
    .from('brands')
    .select('id')
    .eq('erp_id', brand._id)
    .single();

  if (!brandRecord) {
    throw new Error(`Brand record not found in DB: ${brand._id}`);
  }

  // Resolve category
  const category = categories.find(c => c._id === product.Categoria_Parent);
  const { data: categoryRecord } = category
    ? await supabase.from('categories').select('id').eq('erp_id', category._id).single()
    : { data: null };

  // Resolve material
  const material = materials.find(m => m._id === product.Material_Parent);
  const { data: materialRecord } = material
    ? await supabase.from('materials').select('id').eq('erp_id', material._id).single()
    : { data: null };

  // Determine pricing tier and calculate retail price
  let pricingTier = 'mid_range';
  let retailPrice = null;

  if (product.Price && typeof product.Price === 'number') {
    const brandName = brand.Name?.toLowerCase() || '';

    if (['oakley', 'ray-ban', 'persol', 'prada', 'dolce & gabbana'].some(b => brandName.includes(b))) {
      pricingTier = 'premium';
      retailPrice = product.Price * 2.5;
    } else if (['arnette', 'vogue', 'ralph lauren'].some(b => brandName.includes(b))) {
      pricingTier = 'budget';
      retailPrice = product.Price * 5;
    } else {
      pricingTier = 'mid_range';
      retailPrice = product.Price * 4;
    }
  }

  // Check if product exists
  const { data: existingProduct } = await supabase
    .from('products')
    .select('id')
    .eq('erp_id', product._id)
    .single();

  const productData = {
    erp_id: product._id,
    sku: product.SKU || `SKU-${product._id}`,
    name: product.Nombre || 'Unknown Product',
    description: product.Descripcion || null,
    brand_id: brandRecord.id,
    category_id: categoryRecord?.id || null,
    material_id: materialRecord?.id || null,
    wholesale_price: product.Price || null,
    retail_price: retailPrice,
    pricing_tier: pricingTier,
    stock_quantity: product.Cantidad || 0,
    image_url: product.foto || null,
    high_res_image_url: product['foto-en-alta'] || null,
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  if (existingProduct) {
    // Update existing product
    await supabase
      .from('products')
      .update(productData)
      .eq('id', existingProduct.id);

    return { created: false, updated: true, skipped: false };
  } else {
    // Create new product
    await supabase.from('products').insert({
      ...productData,
      created_at: new Date().toISOString(),
    });

    return { created: true, updated: false, skipped: false };
  }
}
