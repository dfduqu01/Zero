# ERP Sync Debug Session - November 22, 2025

## Problem Summary
The ERP sync with dubros.com returns HTTP 200 after ~100 seconds but saves **0 records** to the database.

## What We Tried

### 1. Changed from `createClient()` to `createAdminClient()`
- **Why**: To bypass RLS (Row Level Security) policies that use `auth.uid()`
- **File**: `/workspaces/Zyro/zyro-app/lib/supabase/admin.ts`
- **Result**: Still 0 records

### 2. Increased API Route Timeout
- **From**: 60 seconds
- **To**: 180 seconds (5 minutes max)
- **File**: `/workspaces/Zyro/zyro-app/app/api/admin/erp-sync/route.ts` line 11
- **Result**: Server completes but GitHub Codespaces tunnel times out at ~100s causing 504

### 3. Added maxRecords Optimization
- **Purpose**: Fetch only 50 products instead of all to reduce time
- **Files Modified**:
  - `/workspaces/Zyro/zyro-app/lib/erp/types.ts` - Added `maxRecords` to `FetchOptions`
  - `/workspaces/Zyro/zyro-app/lib/erp/dubros-client.ts` - Implemented maxRecords in `fetchPaginated()`
  - `/workspaces/Zyro/zyro-app/lib/services/erp-sync-service.ts` - Pass testLimit as maxRecords
- **Result**: Still takes 100 seconds because dubros.com first page is slow

### 4. Fixed PostgreSQL Enum Error
- **Error Found in Supabase Logs**: `invalid input value for enum erp_sync_status: "test"`
- **Fix**: Changed `status: 'test'` to `status: 'running'` in test insert
- **Valid enum values**: 'success', 'failed', 'partial', 'running'
- **Result**: Fixed enum error but still 0 records

### 5. Added Diagnostic DB Counts to API Response
- **Purpose**: See actual database counts after sync completes
- **File**: `/workspaces/Zyro/zyro-app/app/api/admin/erp-sync/route.ts` lines 186-206
- **Counts Added**: syncLogs, products, categories, brands (filtered by erp_id not null)

### 6. Added quickTest Mode (NOT WORKING)
- **Purpose**: Test DB writes without waiting 100s for dubros fetch
- **Implementation**: Added `quickTest` parameter to POST body
- **File**: `/workspaces/Zyro/zyro-app/app/api/admin/erp-sync/route.ts` lines 51, 144-152
- **Status**: Code added but UI button not appearing (possibly caching issue)

## Key Files

### API Route
`/workspaces/Zyro/zyro-app/app/api/admin/erp-sync/route.ts`
- POST: Triggers sync
- GET: Returns sync status and recent syncs
- Has admin authentication check
- Creates test insert to verify DB writes before full sync

### Sync Service
`/workspaces/Zyro/zyro-app/lib/services/erp-sync-service.ts`
- `executeSync()` - Main sync logic
- Fetches categories, brands, materials first
- Then fetches products and upserts to database
- Uses admin client for all database operations

### Dubros Client
`/workspaces/Zyro/zyro-app/lib/erp/dubros-client.ts`
- Handles HTTP communication with dubros.com
- `fetchProducts()` - Requires auth for Price field
- `fetchPaginated()` - Handles cursor-based pagination

### UI Component
`/workspaces/Zyro/zyro-app/app/admin/erp-sync/ErpSyncClient.tsx`
- Shows sync status, history, and results
- Has "Sincronizar Ahora" button
- Displays diagnostics with DB counts

## Environment Variables Required
- `SUPABASE_SERVICE_ROLE_KEY` - For admin client to bypass RLS
- `DUBROS_API_URL` - dubros.com API endpoint
- `DUBROS_BEARER_TOKEN` - For authenticated requests (needed for Price field)

## Known Issues

### 1. GitHub Codespaces Tunnel Timeout
- Times out at ~100 seconds
- Returns 504 with HTML error page
- Browser shows "The string did not match the expected pattern" (JSON parse error on HTML)

### 2. dubros.com API is Slow
- First page of products takes ~100 seconds
- Even with `maxRecords: 50`, still takes 100s because first page is slow
- Bubble.io backend limitation

### 3. Console.log Not Visible
- Turbopack stdout buffering prevents console.log from appearing
- Solution: Return diagnostics in API response instead

## Next Steps to Debug

### Option A: Test DB Writes in Isolation
1. Create a simple test endpoint that only does DB insert/delete
2. Call it from browser to verify admin client can write
3. Example: POST `/api/admin/test-db-write`

### Option B: Check Supabase Service Role Key
1. Verify key has correct permissions
2. Check if key is being loaded correctly in admin.ts
3. Test with direct Supabase MCP tool

### Option C: Add More Granular Logging
1. Log each step of sync service with timestamps
2. Return partial results even on timeout
3. Use database to store progress instead of memory

### Option D: Run Sync as Background Job
1. Return immediately with sync job ID
2. Poll for status
3. Avoid timeout issues entirely

## Database Tables Involved

- `erp_sync_logs` - Sync operation logs
- `erp_sync_errors` - Individual product sync errors
- `products` - Main products table (has erp_id, erp_last_synced_at, erp_data)
- `categories` - Has erp_id column
- `brands` - Has erp_id column
- `frame_materials` - Has erp_id column
- `product_images` - Product images

## Useful Commands

```bash
# Restart dev server with fresh build
rm -rf .next && npm run dev

# Check Supabase logs
# Use Supabase MCP: mcp__supabase__get_logs service: "postgres"

# Check database counts
# Use Supabase MCP: mcp__supabase__execute_sql
# SELECT COUNT(*) FROM products WHERE erp_id IS NOT NULL;
# SELECT COUNT(*) FROM erp_sync_logs;
```

## Core Mystery - SOLVED

### Database Investigation Results (Nov 22)

**Current database state:**
- categories: 3 total, **1 with erp_id** (our test insert)
- brands: 6 total, **1 with erp_id** (our test insert)
- frame_materials: 6 total, **0 with erp_id**
- products: 3 total, **0 with erp_id**
- erp_sync_logs: **0 total**

**Key finding:** The sync has NEVER successfully written anything! 0 erp_sync_logs means sync log creation itself is failing.

### RLS Configuration
All tables have RLS enabled with policy:
```sql
EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true)
```

### Root Cause
The admin client is configured correctly but **RLS is blocking writes**. The service role key should bypass RLS, but:
1. Either the key is invalid/expired
2. Or the client isn't using it correctly

### Direct SQL Works
Using Supabase MCP (which uses service role), inserts work fine:
```sql
INSERT INTO categories (name, slug, erp_id) VALUES ('Test', 'test', 'test-id')
-- Works!
```

### Next Steps
1. Verify the service role key in `.env.local` matches Supabase dashboard
2. Add logging to admin.ts to confirm key is being loaded
3. Test if the admin client can do a simple query (SELECT) to verify connection
