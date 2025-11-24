-- Remove HEAD branch from database
-- HEAD is a symbolic reference, not a real branch

DELETE FROM commit_branches 
WHERE branch_id IN (SELECT id FROM branches WHERE name = 'HEAD');

DELETE FROM branches 
WHERE name = 'HEAD';
