-- =====================================================
-- Migration: Fix Multi-Branch Commit Relationship
-- Date: 2025-11-24
-- Description: Create commit_branches junction table for many-to-many relationship
-- =====================================================

-- Step 1: Create junction table for commit-branch relationship
CREATE TABLE IF NOT EXISTS commit_branches (
    commit_id UUID NOT NULL REFERENCES commits(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (commit_id, branch_id)
);

-- Step 2: Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_commit_branches_commit ON commit_branches(commit_id);
CREATE INDEX IF NOT EXISTS idx_commit_branches_branch ON commit_branches(branch_id);

-- Step 3: Migrate existing data from commits.branch_name to commit_branches
-- (This will link existing commits to their branches)
INSERT INTO commit_branches (commit_id, branch_id)
SELECT c.id, b.id
FROM commits c
JOIN branches b ON c.branch_name = b.name AND c.repository_id = b.repository_id
WHERE c.branch_name IS NOT NULL
ON CONFLICT (commit_id, branch_id) DO NOTHING;

-- Step 4: Remove the old branch_name column (after migration complete)
-- ALTER TABLE commits DROP COLUMN IF EXISTS branch_name;
-- (Commented out for safety - run manually after verifying data migration)

-- Add comments
COMMENT ON TABLE commit_branches IS 'Junction table linking commits to branches (many-to-many)';
COMMENT ON COLUMN commit_branches.commit_id IS 'Reference to commit';
COMMENT ON COLUMN commit_branches.branch_id IS 'Reference to branch';

-- =====================================================
-- Verification Queries
-- =====================================================
-- Check commit_branches table created:
-- SELECT COUNT(*) FROM commit_branches;

-- Check commits per branch:
-- SELECT b.name, COUNT(cb.commit_id) 
-- FROM branches b 
-- LEFT JOIN commit_branches cb ON b.id = cb.branch_id 
-- GROUP BY b.name;
