● User approved Claude's plan
  ⎿  Plan saved to: ~/.claude/plans/prancy-swimming-hopcroft.md · /plan to edit
     Pricing Recalculation Background Job Implementation Plan

     Overview

     Convert the pricing recalculation API from a blocking operation to a background job system, following the proven ERP sync pattern. Support two 
     pricing formulas for A/B testing.

     User Requirements

     - Formula 1 (Current/Default): price = shipping_cost + (cost_dubros × markup_multiplier)
     - Formula 2 (New - Shipping Separate): price = cost_dubros × markup_multiplier
     - Non-blocking execution for 4,000+ products
     - Progress tracking with polling (like ERP sync)
     - Unified job system (rename erp_sync_jobs to background_jobs)

     Implementation Strategy

     Phase 1: Database Migrations (Foundation)

     Migration 1: Generalize Job System

     File: zyro-app/supabase/migrations/20251208000000_generalize_background_jobs.sql

     - Rename erp_sync_jobs → background_jobs
     - Add job_type enum: 'erp_sync' | 'pricing_recalculation'
     - Add job_params JSONB column for flexible parameters
     - Create backward-compatible view erp_sync_jobs for existing code
     - Update indexes (rename with background_jobs prefix)
     - Update RLS policies

     Backward Compatibility: All existing ERP sync code continues working via view.

     Migration 2: Pricing Recalculation Logs

     File: zyro-app/supabase/migrations/20251208000001_pricing_recalculation_logs.sql

     Create audit log table:
     - id, status, started_at, completed_at, duration_seconds
     - total_products, products_updated, products_skipped, error_count
     - shipping_cost, pricing_formula (1 or 2), respect_overrides, product_ids
     - job_id (FK to background_jobs), created_by

     Migration 3: Error Logging

     File: zyro-app/supabase/migrations/20251208000002_pricing_recalculation_errors.sql

     Create error detail table:
     - log_id, product_id, product_sku
     - error_message, error_details (JSONB)

     Phase 2: Service Layer

     Service 1: Enhanced PricingService

     File: zyro-app/lib/services/pricing-service.ts (MODIFY)

     Add new method:
     calculatePriceWithFormula(
       dubrosCost: number,
       shippingCost: number,
       formula: 1 | 2
     ): PricingResult | null

     Formula Logic:
     - Formula 1: price = shippingCost + (dubrosCost × markup) (current)
     - Formula 2: price = dubrosCost × markup (new)

     Keep existing calculatePrice() for backward compatibility (calls Formula 1).

     Service 2: PricingRecalculationService

     File: zyro-app/lib/services/pricing-recalculation-service.ts (NEW)

     Mirror ErpSyncService pattern:

     Key Methods:
     - executeRecalculation(jobId, logId, params) - Main orchestrator
     - createRecalcLog(params) - Initialize log entry
     - finalizeRecalcLog(logId, updates) - Complete log
     - logRecalcError(logId, error) - Log individual errors
     - updateJobProgress(jobId, progress, step) - Update job 0-100%
     - fetchProductsInChunks(params) - Fetch 1000-row chunks
     - recalculateProducts(products, params) - Process batch

     Progress Updates:
     - 0-10%: Loading pricing tiers
     - 10-20%: Fetching products
     - 20-95%: Recalculating (update every 100 products)
     - 95-100%: Finalizing

     Error Handling:
     - Continue on individual product errors
     - Log errors to pricing_recalculation_errors
     - Track error count in results

     Phase 3: API Routes

     API 1: Create Background Job (Non-Blocking)

     File: zyro-app/app/api/admin/pricing/recalculate/route.ts (MODIFY)

     Current: Blocking - returns after all products processed
     New: Non-blocking - returns job_id immediately

     Request Body:
     {
       pricingFormula: 1 | 2,      // Required
       shippingCost?: number,       // Default: 25
       respectOverrides?: boolean,  // Default: true
       productIds?: string[] | null // Default: null (all)
     }

     Response:
     {
       success: true,
       job_id: string,
       log_id: string,
       message: 'Pricing recalculation job created',
       status: 'queued'
     }

     Implementation Pattern:
     1. Validate params (require pricingFormula)
     2. Create pricing_recalculation_logs entry (status: 'running')
     3. Create background_jobs entry (status: 'queued', job_type: 'pricing_recalculation')
     4. Call processJobInBackground() WITHOUT await
     5. Return job_id immediately

     Background Processing:
     async function processJobInBackground(jobId, logId, params) {
       try {
         // Update job → 'running'
         // Create PricingRecalculationService
         // Execute recalculation
         // Update job → 'completed'/'failed' with results
       } catch (error) {
         // Mark job as 'failed' with error_message
       }
     }

     API 2: Poll Job Status

     File: zyro-app/app/api/admin/pricing-status/[id]/route.ts (NEW)

     Mirror /api/admin/erp-sync-status/[id] pattern.

     Request: GET /api/admin/pricing-status/{job_id}

     Response:
     {
       job: {
         id, status, progress, current_step,
         current_item_count, total_item_count,
         error_message?, results?,
         created_at, started_at?, completed_at?,
         pricing_recalculation_logs: {
           products_updated, error_count
         }
       }
     }

     Client polls every 2 seconds while job is active.

     API 3: Get History

     File: zyro-app/app/api/admin/pricing/history/route.ts (NEW)

     Fetch recent logs for UI display.

     Request: GET /api/admin/pricing/history?limit=10

     Response: Array of recent pricing_recalculation_logs with stats.

     Phase 4: UI Components

     Component 1: Server Component

     File: zyro-app/app/admin/pricing-recalculation/page.tsx (NEW)

     Mirror /app/admin/erp-sync/page.tsx:
     - Check auth and admin status
     - Fetch recent logs
     - Fetch active job (if any)
     - Pass to client component

     Component 2: Client Component

     File: zyro-app/app/admin/pricing-recalculation/PricingRecalculationClient.tsx (NEW)

     Mirror /app/admin/erp-sync/ErpSyncClient.tsx:

     UI Elements:
     - Formula Selection: Radio buttons for Formula 1 vs Formula 2
     - Options Panel:
       - Shipping cost input (number, default: 25)
       - Respect overrides checkbox (default: true)
       - Product IDs textarea (optional)
     - Start Button: Creates job
     - Progress Bar: Shows 0-100% with current step
     - Cancel Button: (Future enhancement)
     - Status Display: Real-time job status
     - History Table: Recent recalculations

     Polling Logic:
     useEffect(() => {
       if (!activeJobId) return;

       const pollJob = async () => {
         const res = await fetch(`/api/admin/pricing-status/${activeJobId}`);
         const data = await res.json();

         setJobStatus(data.job);

         // Stop if complete
         if (['completed', 'failed'].includes(data.job.status)) {
           clearInterval(interval);
           setActiveJobId(null);
           router.refresh();
         }
       };

       pollJob();
       const interval = setInterval(pollJob, 2000);
       return () => clearInterval(interval);
     }, [activeJobId]);

     Component 3: Admin Navigation

     File: zyro-app/app/admin/layout.tsx (MODIFY)

     Add navigation link after "Pricing Tiers":
     import { Calculator } from 'lucide-react';

     <NavLink href="/admin/pricing-recalculation" icon={<Calculator size={20} />}>
       Pricing Recalculation
     </NavLink>

     Phase 5: TypeScript Types

     Update Database Types

     File: zyro-app/lib/types/database.ts (MODIFY)

     Add types for:
     - background_jobs (renamed from erp_sync_jobs)
     - pricing_recalculation_logs
     - pricing_recalculation_errors
     - Job type enums

     Critical Files

     New Files (6)

     1. supabase/migrations/20251208000000_generalize_background_jobs.sql
     2. supabase/migrations/20251208000001_pricing_recalculation_logs.sql
     3. supabase/migrations/20251208000002_pricing_recalculation_errors.sql
     4. lib/services/pricing-recalculation-service.ts
     5. app/api/admin/pricing-status/[id]/route.ts
     6. app/admin/pricing-recalculation/page.tsx
     7. app/admin/pricing-recalculation/PricingRecalculationClient.tsx
     8. app/api/admin/pricing/history/route.ts

     Modified Files (3)

     1. lib/services/pricing-service.ts - Add calculatePriceWithFormula()
     2. app/api/admin/pricing/recalculate/route.ts - Convert to non-blocking
     3. app/admin/layout.tsx - Add navigation link

     Implementation Order

     1. Database First (Day 1)
       - Run all 3 migrations
       - Verify backward compatibility with ERP sync
       - Test new table structure
     2. Service Layer (Day 2-3)
       - Update PricingService with dual formula support
       - Create PricingRecalculationService (mirror ErpSyncService)
       - Unit test both formulas
     3. API Routes (Day 3-4)
       - Update recalculate route (non-blocking)
       - Create status polling route
       - Create history route
       - Test job creation and polling
     4. UI Components (Day 4-5)
       - Create server component (page)
       - Create client component (interactive)
       - Update admin navigation
       - Test polling and progress updates
     5. Integration Testing (Day 5)
       - End-to-end: Create job → Poll → Complete
       - Test with 50 products (fast)
       - Test with 4,000+ products (realistic)
       - Test both formulas
       - Test error handling

     Key Risks & Mitigations

     Risk 1: Long execution time (4,000+ products)
     - Mitigation: Set expectations in UI, show progress, allow navigation away

     Risk 2: Formula confusion
     - Mitigation: Clear descriptions with examples in UI

     Risk 3: Pricing errors
     - Mitigation: Respect overrides by default, log formula used, allow re-run

     Risk 4: Database lock contention
     - Mitigation: Update products one at a time, small transactions

     Risk 5: Concurrent jobs
     - Mitigation: Check for active job before creating new one

     Success Criteria

     - ✅ All migrations run successfully
     - ✅ Backward compatibility: ERP sync still works
     - ✅ Formula 1 matches current pricing logic
     - ✅ Formula 2 excludes shipping from price
     - ✅ Progress updates every 100 products
     - ✅ Polling works (every 2 seconds)
     - ✅ UI shows real-time progress
     - ✅ Can recalculate 4,000+ products without timeout
     - ✅ Respects manual price overrides
     - ✅ Error handling continues processing on failures
     - ✅ History shows recent recalculations

     Notes

     - Pattern mirrors proven ERP sync implementation
     - Unified background_jobs table supports future job types
     - Two pricing formulas enable A/B testing
     - Non-blocking design prevents timeouts
     - Comprehensive error logging for debugging
     - Progress tracking provides transparency

● Perfect! The plan has been approved. Let me create a todo list to track the implementation and then start with Phase 1: Database Migrations.

● Now I'll start implementing Phase 1: Database Migrations. Let me create the first migration to generalize the background jobs table.

● Write(zyro-app/supabase/migrations/20251208000000_generalize_background_jobs.sql)
  ⎿  Wrote 50 lines to zyro-app/supabase/migrations/20251208000000_generalize_background_jobs.sql
     -- Generalize Background Jobs System
     -- Date: December 8, 2025
     -- Purpose: Rename erp_sync_jobs to background_jobs and support multiple job types
     -- Create job_type enum
     CREATE TYPE job_type AS ENUM ('erp_sync', 'pricing_recalculation');
     -- Rename table from erp_sync_jobs to background_jobs
     ALTER TABLE erp_sync_jobs RENAME TO background_jobs;
     … +40 lines (ctrl+o to expand)

● Write(zyro-app/supabase/migrations/20251208000001_pricing_recalculation_logs.sql)
  ⎿  Wrote 72 lines to zyro-app/supabase/migrations/20251208000001_pricing_recalculation_logs.sql
     -- Pricing Recalculation Logs Table
     -- Date: December 8, 2025
     -- Purpose: Audit log for pricing recalculation jobs (similar to erp_sync_logs)
     CREATE TABLE IF NOT EXISTS pricing_recalculation_logs (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       -- Status tracking
       status TEXT NOT NULL DEFAULT 'running'
         CHECK (status IN ('running', 'success', 'partial', 'failed')),
     … +62 lines (ctrl+o to expand)

● Write(zyro-app/supabase/migrations/20251208000002_pricing_recalculation_errors.sql)
  ⎿  Wrote 42 lines to zyro-app/supabase/migrations/20251208000002_pricing_recalculation_errors.sql
     -- Pricing Recalculation Errors Table
     -- Date: December 8, 2025
     -- Purpose: Detailed error logging for individual product pricing failures
     CREATE TABLE IF NOT EXISTS pricing_recalculation_errors (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       -- Relationships
       log_id UUID NOT NULL REFERENCES pricing_recalculation_logs(id) ON DELETE CASCADE,
       product_id UUID REFERENCES products(id) ON DELETE SET NULL,
     … +32 lines (ctrl+o to expand)

● Excellent! All three database migrations are created. Now let me apply them to the database.

● Bash(cd /workspaces/Zyro/zyro-app && npx supabase db push) timeout: 1m 0s
  ⎿  Error: Exit code 1
     Cannot find project ref. Have you run supabase link?
     Try rerunning the command with --debug to troubleshoot the error.

● I see the Supabase project needs to be linked first. Let me continue with the implementation - you can apply the migrations later through the
  Supabase dashboard. Now I'll move to Phase 2: Service Layer. Let me update the PricingService to support both pricing formulas.

● Update(zyro-app/lib/services/pricing-service.ts)
  ⎿  Updated zyro-app/lib/services/pricing-service.ts with 40 additions and 6 removals                  
        86      }
        87    
        88      /**
        89 -     * Calculate complete pricing for a product
        89 +     * Calculate complete pricing for a product with formula selection
        90       *
        91       * @param dubrosCost - Wholesale cost per unit from dubros.com (after dozen calculation)
        92       * @param shippingCost - Flat shipping cost per product (default: $25)
        93 +     * @param formula - Pricing formula to use (1 or 2)
        94 +     *   - Formula 1: price = shippingCost + (dubrosCost × markup) [CURRENT/DEFAULT]
        95 +     *   - Formula 2: price = dubrosCost × markup [NEW - shipping separate]
        96       * @returns Complete pricing breakdown or null if no tier found
        97       */
        98 -    calculatePrice(
        98 +    calculatePriceWithFormula(
        99        dubrosCost: number,
       100 -      shippingCost: number = 25
       100 +      shippingCost: number = 25,
       101 +      formula: 1 | 2 = 1
       102      ): PricingResult | null {
       103        // Validate inputs
       104        if (dubrosCost < 0) {
     ...
       107          return null;
       108        }
       109    
       110 +      if (formula !== 1 && formula !== 2) {
       111 +        console.error('[PricingService] Invalid formula:', formula);
       112 +        return null;
       113 +      }
       114 +  
       115        // Find matching tier
       116        const tier = this.findTier(dubrosCost);
       117    
     ...
       114          return null;
       115        }
       116    
       117 -      // Calculate pricing
       118 -      // Formula: Selling Price = Shipping + (Dubros Cost × Markup)
       117 +      // Calculate pricing based on selected formula
       118        const costTotal = dubrosCost + shippingCost;
       119 -      const sellingPrice = shippingCost + (dubrosCost * tier.markup_multiplier);
       119 +      let sellingPrice: number;
       120 +  
       121 +      if (formula === 1) {
       122 +        // Formula 1 (Current): price = shipping + (cost × markup)
       123 +        // Example: $25 + ($15 × 2.5) = $62.50
       124 +        sellingPrice = shippingCost + (dubrosCost * tier.markup_multiplier);
       125 +      } else {
       126 +        // Formula 2 (New): price = cost × markup (shipping separate)
       127 +        // Example: $15 × 2.5 = $37.50 (+ $25 shipping at checkout)
       128 +        sellingPrice = dubrosCost * tier.markup_multiplier;
       129 +      }
       130 +  
       131        const profit = sellingPrice - costTotal;
       132        const marginPercent = costTotal > 0 ? (profit / costTotal) * 100 : 0;
       133    
     ...
       135      }
       136    
       137      /**
       138 +     * Calculate complete pricing for a product (backward compatible)
       139 +     *
       140 +     * @param dubrosCost - Wholesale cost per unit from dubros.com (after dozen calculation)
       141 +     * @param shippingCost - Flat shipping cost per product (default: $25)
       142 +     * @returns Complete pricing breakdown or null if no tier found
       143 +     */
       144 +    calculatePrice(
       145 +      dubrosCost: number,
       146 +      shippingCost: number = 25
       147 +    ): PricingResult | null {
       148 +      // Use Formula 1 (current/default) for backward compatibility
       149 +      return this.calculatePriceWithFormula(dubrosCost, shippingCost, 1);
       150 +    }
       151 +  
       152 +    /**
       153       * Get all loaded tiers (for display/debugging)
       154       */
       155      getTiers(): PricingTier[] {

● Perfect! Now let me create the PricingRecalculationService that mirrors the ERP sync pattern. First, let me read the ERP sync service to ensure I
  follow the same pattern.

● Read(zyro-app/lib/services/erp-sync-service.ts)
  ⎿  Read 711 lines

● Now I'll create the PricingRecalculationService following the same pattern as ErpSyncService:

● Write(zyro-app/lib/services/pricing-recalculation-service.ts)
  ⎿  Wrote 420 lines to zyro-app/lib/services/pricing-recalculation-service.ts 
     // Pricing Recalculation Service - Orchestrates background pricing updates
     // Mirrors ERP sync pattern for consistency
     import { createAdminClient } from '@/lib/supabase/admin';
     import { PricingService } from './pricing-service';
     /**
      * Parameters for pricing recalculation job
      */
     export interface RecalculationParams {
     … +410 lines (ctrl+o to expand)
  ⎿  Limit reached · resets 2am (UTC) · /upgrade to Max or turn on /extra-usage
     Opening your options…