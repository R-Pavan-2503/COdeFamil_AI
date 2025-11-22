-- Migration: Add title column to pull_requests table
-- This stores the PR title/message so users can see what the PR is about

ALTER TABLE pull_requests 
ADD COLUMN title TEXT;

COMMENT ON COLUMN pull_requests.title IS 'The title/message of the pull request';
