-- Background Job Queue for ERP Sync
-- Date: December 1, 2025
-- Purpose: Enable async processing of large product syncs (4,000+ products)

-- Create job queue table
CREATE TABLE IF NOT EXISTS erp_sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),

  -- Progress tracking (0-100)
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  current_step TEXT,
  current_item_count INTEGER DEFAULT 0,
  total_item_count INTEGER,

  -- Sync metadata
  sync_type TEXT DEFAULT 'manual' CHECK (sync_type IN ('manual', 'scheduled', 'test')),
  test_limit INTEGER,

  -- Relationships
  sync_log_id UUID REFERENCES erp_sync_logs(id) ON DELETE CASCADE,
  created_by UUID,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Error tracking
  error_message TEXT,
  error_details JSONB,

  -- Cancel support
  cancel_requested BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID
);

-- Indexes for performance
CREATE INDEX idx_erp_sync_jobs_status ON erp_sync_jobs(status);
CREATE INDEX idx_erp_sync_jobs_created_at ON erp_sync_jobs(created_at DESC);
CREATE INDEX idx_erp_sync_jobs_sync_log_id ON erp_sync_jobs(sync_log_id);

-- RLS policies
ALTER TABLE erp_sync_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view jobs"
  ON erp_sync_jobs FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage all jobs"
  ON erp_sync_jobs FOR ALL
  USING (true);

-- Add job_id to erp_sync_logs for backward linking
ALTER TABLE erp_sync_logs ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES erp_sync_jobs(id);

CREATE INDEX IF NOT EXISTS idx_erp_sync_logs_job_id ON erp_sync_logs(job_id);

-- Add comment for documentation
COMMENT ON TABLE erp_sync_jobs IS 'Job queue for async ERP sync operations. Enables syncing 4,000+ products without timeout issues.';
COMMENT ON COLUMN erp_sync_jobs.progress IS 'Progress percentage (0-100) updated every 100 products';
COMMENT ON COLUMN erp_sync_jobs.current_step IS 'Human-readable description of current operation';
