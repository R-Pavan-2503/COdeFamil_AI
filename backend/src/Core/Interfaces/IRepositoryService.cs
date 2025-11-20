using LibGit2Sharp;

namespace CodeFamily.Api.Core.Interfaces;

public interface IRepositoryService
{
    /// <summary>
    /// Clone a repository as a bare clone for efficient access.
    /// Returns the path to the bare repository.
    /// </summary>
    Task<string> CloneBareRepository(string cloneUrl, string owner, string repoName);

    /// <summary>
    /// Get the LibGit2Sharp Repository object for a bare clone.
    /// </summary>
    LibGit2Sharp.Repository GetRepository(string owner, string repoName);

    /// <summary>
    /// Read file content at a specific commit SHA.
    /// </summary>
    string? GetFileContentAtCommit(LibGit2Sharp.Repository repo, string commitSha, string filePath);

    /// <summary>
    /// Get all commits in reverse chronological order.
    /// </summary>
    List<LibGit2Sharp.Commit> GetAllCommits(LibGit2Sharp.Repository repo);

    /// <summary>
    /// Get file paths changed in a commit.
    /// </summary>
    List<string> GetChangedFiles(LibGit2Sharp.Repository repo, LibGit2Sharp.Commit commit);

    /// <summary>
    /// Fetch latest changes from remote.
    /// </summary>
    Task FetchRepository(string owner, string repoName);

    /// <summary>
    /// Determine language from file extension.
    /// </summary>
    string GetLanguageFromPath(string filePath);
}
