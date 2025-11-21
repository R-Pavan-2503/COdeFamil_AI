-- ============================================
-- FILE OWNERSHIP TABLE MIGRATION
-- Change from user_id (UUID) to author_name (TEXT)
-- ============================================

-- WARNING: This migration will delete all existing file ownership data
-- Make sure to recalculate ownership after running this

-- Step 1: Drop foreign key constraint (if it exists)
ALTER TABLE file_ownership DROP CONSTRAINT IF EXISTS file_ownership_user_id_fkey;

-- Step 2: Drop existing primary key
ALTER TABLE file_ownership DROP CONSTRAINT IF EXISTS file_ownership_pkey;

-- Step 3: Remove user_id column
ALTER TABLE file_ownership DROP COLUMN IF EXISTS user_id;

-- Step 4: Add author_name column
ALTER TABLE file_ownership ADD COLUMN IF NOT EXISTS author_name TEXT;

-- Step 5: Recreate primary key with new structure
ALTER TABLE file_ownership ADD PRIMARY KEY (file_id, author_name);

-- Verification query
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'file_ownership'
ORDER BY ordinal_position;
