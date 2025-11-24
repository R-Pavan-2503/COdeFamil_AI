-- =====================================================
-- Migration: Add Multi-Branch Support
-- Date: 2025-11-24
-- Description: Add branches table and modify commits table to support branch tracking
-- =====================================================

-- Create branches table
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    head_commit_sha VARCHAR(40),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(repository_id, name)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_branches_repository_id ON branches(repository_id);
CREATE INDEX IF NOT EXISTS idx_branches_default ON branches(repository_id, is_default) WHERE is_default = TRUE;

-- Modify commits table to add branch tracking
ALTER TABLE commits ADD COLUMN IF NOT EXISTS branch_name VARCHAR(255);

-- Add index for branch filtering
CREATE INDEX IF NOT EXISTS idx_commits_branch ON commits(repository_id, branch_name);

-- Add comment for documentation
COMMENT ON TABLE branches IS 'Stores branch information for each repository';
COMMENT ON COLUMN branches.name IS 'Branch name (e.g., main, develop, feature/xyz)';
COMMENT ON COLUMN branches.is_default IS 'True if this is the default branch (main/master)';
COMMENT ON COLUMN commits.branch_name IS 'Branch name this commit belongs to';

-- =====================================================
-- Verification Queries (run after migration)
-- =====================================================
-- Check branches table created:
-- SELECT * FROM branches LIMIT 5;

-- Check commits table modified:
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'commits' AND column_name = 'branch_name';
