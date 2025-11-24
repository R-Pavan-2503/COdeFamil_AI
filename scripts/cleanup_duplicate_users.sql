-- ============================================
-- USER DEDUPLICATION - DATABASE CLEANUP
-- ============================================
-- Run these queries in Supabase SQL Editor

-- STEP 1: Check current duplicate status
-- This shows how many duplicate usernames exist
SELECT 
    username, 
    COUNT(*) as count, 
    array_agg(id) as user_ids,
    array_agg(email) as emails,
    array_agg(github_id) as github_ids
FROM users 
GROUP BY username 
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- STEP 2: Remove fake email users
-- This deletes users with fake generated emails
DELETE FROM users 
WHERE email LIKE '%@github.com' 
   OR email LIKE '%@users.noreply.github.com'
   OR email = 'incremental@update.com';

-- STEP 3: Verify no duplicates remain
-- Should return no results after cleanup
SELECT 
    username, 
    COUNT(*) as count
FROM users 
GROUP BY username 
HAVING COUNT(*) > 1;

-- STEP 4: Check GitHub ID population
-- PR authors should have real GitHub IDs
SELECT 
    username, 
    email, 
    github_id,
    avatar_url
FROM users 
WHERE github_id > 0
ORDER BY username;

-- STEP 5: List all users (final check)
SELECT 
    id,
    github_id,
    username,
    email,
    avatar_url
FROM users
ORDER BY username;
