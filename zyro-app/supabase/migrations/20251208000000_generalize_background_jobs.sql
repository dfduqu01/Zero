-- Generalize Background Jobs System
-- Date: December 8, 2025
-- Purpose: Rename erp_sync_jobs to background_jobs and support multiple job types

-- Create job_type enum
CREATE TYPE job_type AS ENUM ('erp_sync', 'pricing_recalculation');

-- Rename table from erp_sync_jobs to background_jobs
ALTER TABLE erp_sync_jobs RENAME TO background_jobs;

-- Add new columns for generalized job system
ALTER TABLE background_jobs ADD COLUMN job_type job_type NOT NULL DEFAULT 'erp_sync';
ALTER TABLE background_jobs ADD COLUMN job_params JSONB;

-- Rename indexes to reflect new table name
ALTER INDEX idx_erp_sync_jobs_status RENAME TO idx_background_jobs_status;
ALTER INDEX idx_erp_sync_jobs_created_at RENAME TO idx_background_jobs_created_at;
ALTER INDEX idx_erp_sync_jobs_sync_log_id RENAME TO idx_background_jobs_sync_log_id;

-- Add new index for job_type filtering
CREATE INDEX idx_background_jobs_job_type ON background_jobs(job_type);
CREATE INDEX idx_background_jobs_type_status ON background_jobs(job_type, status);

-- Drop old RLS policies
DROP POLICY IF EXISTS "Anyone can view jobs" ON background_jobs;
DROP POLICY IF EXISTS "Service role can manage all jobs" ON background_jobs;

-- Create new RLS policies with updated table name
CREATE POLICY "Anyone can view jobs"
  ON background_jobs FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage all jobs"
  ON background_jobs FOR ALL
  USING (true);

-- Create backward-compatible view for existing ERP sync code
CREATE VIEW erp_sync_jobs AS
  SELECT * FROM background_jobs WHERE job_type = 'erp_sync';

-- Add comment for documentation
COMMENT ON TABLE background_jobs IS 'Unified background job queue for async operations (ERP sync, pricing recalculation, etc.). Enables processing 4,000+ items without timeout issues.';
COMMENT ON COLUMN background_jobs.job_type IS 'Type of job: erp_sync or pricing_recalculation';
COMMENT ON COLUMN background_jobs.job_params IS 'Job-specific parameters stored as JSON';
COMMENT ON COLUMN background_jobs.progress IS 'Progress percentage (0-100) updated periodically';
COMMENT ON COLUMN background_jobs.current_step IS 'Human-readable description of current operation';

-- Add comment to view
COMMENT ON VIEW erp_sync_jobs IS 'Backward-compatible view for existing ERP sync code. Filters background_jobs to only show erp_sync job types.';
