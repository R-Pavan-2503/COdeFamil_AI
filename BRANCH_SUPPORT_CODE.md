// RepositoryService.cs - Add these methods to the existing RepositoryService class

public List<string> GetAllBranches(LibGit2Sharp.Repository repo)
{
return repo.Branches
.Where(b => !b.IsRemote || b.FriendlyName.StartsWith("origin/"))
.Select(b => b.FriendlyName.Replace("origin/", ""))
.Distinct()
.OrderBy(name => name != "main" && name != "master") // Put main/master first
.ThenBy(name => name)
.ToList();
}

public List<LibGit2Sharp.Commit> GetCommitsByBranch(LibGit2Sharp.Repository repo, string branchName)
{
// Normalize branch name (remove origin/ prefix if present)
var normalizedBranchName = branchName.Replace("origin/", "");

    // Try to find the branch (check both local and remote)
    var branch = repo.Branches[normalizedBranchName]
                 ?? repo.Branches[$"origin/{normalizedBranchName}"];

    if (branch == null)
    {
        return new List<LibGit2Sharp.Commit>();
    }

    return branch.Commits
        .OrderByDescending(c => c.Author.When)
        .ToList();

}
