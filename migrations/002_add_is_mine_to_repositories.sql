-- Add is_mine column to repositories table
-- This flag indicates if the repository belongs to the user who added it
-- TRUE = repository belongs to the logged-in user's GitHub account
-- FALSE = repository belongs to someone else (added via URL)

ALTER TABLE repositories 
ADD COLUMN is_mine BOOLEAN DEFAULT FALSE;

-- Update existing repositories to set is_mine based on owner match
-- This will set is_mine = TRUE for repositories where the owner matches the connected user
-- Note: You may need to run a more sophisticated query if you have existing data
-- For now, we'll default all existing to FALSE and let the application set it correctly going forward

COMMENT ON COLUMN repositories.is_mine IS 'TRUE if this repository belongs to the connected user GitHub account, FALSE if added from another user';
