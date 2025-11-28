-- Add author information to commits table
ALTER TABLE commits 
ADD COLUMN IF NOT EXISTS author_name TEXT,
ADD COLUMN IF NOT EXISTS author_email TEXT;

-- Create index for faster author lookups
CREATE INDEX IF NOT EXISTS idx_commits_author_name ON commits(author_name);
