using CodeFamily.Api.Core.Models;

namespace CodeFamily.Api.Core.Interfaces;

public interface IDatabaseService
{
    // Users
    Task<User?> GetUserByGitHubId(long githubId);
    Task<User?> GetUserByEmail(string email);
    Task<User> CreateUser(User user);
    Task<User?> GetUserById(Guid id);

    // Repositories
    Task<Repository?> GetRepositoryByName(string owner, string name);
    Task<Repository> CreateRepository(Repository repository);
    Task UpdateRepositoryStatus(Guid repositoryId, string status);
    Task<List<Repository>> GetUserRepositories(Guid userId);
    Task<Repository?> GetRepositoryById(Guid id);
    Task<List<Repository>> GetAnalyzedRepositories(Guid userId, string filter);

    // Commits
    Task<Commit> CreateCommit(Commit commit);
    Task<List<Commit>> GetCommitsByRepository(Guid repositoryId);
    Task<Commit?> GetCommitById(Guid id);
    Task<Commit?> GetCommitBySha(Guid repositoryId, string sha);

    // Files
    Task<RepositoryFile?> GetFileByPath(Guid repositoryId, string filePath);
    Task<RepositoryFile> CreateFile(RepositoryFile file);
    Task<List<RepositoryFile>> GetFilesByRepository(Guid repositoryId);
    Task<RepositoryFile?> GetFileById(Guid fileId);

    // File Changes
    Task CreateFileChange(FileChange fileChange);
    Task<List<FileChange>> GetFileChangesByCommit(Guid commitId);
    Task<List<FileChange>> GetFileChangesByFile(Guid fileId);

    // Embeddings
    Task<CodeEmbedding> CreateEmbedding(CodeEmbedding embedding);
    Task<List<CodeEmbedding>> GetEmbeddingsByFile(Guid fileId);
    Task<List<(RepositoryFile File, double Similarity)>> FindSimilarFiles(float[] embedding, Guid repositoryId, int limit = 10);

    // Dependencies
    Task CreateDependency(Dependency dependency);
    Task<List<Dependency>> GetDependenciesForFile(Guid fileId);
    Task<List<Dependency>> GetDependentsForFile(Guid fileId);

    // File Ownership
    Task UpsertFileOwnership(FileOwnership ownership);
    Task<List<FileOwnership>> GetFileOwnership(Guid fileId);

    // Pull Requests
    Task<PullRequest?> GetPullRequestByNumber(Guid repositoryId, int prNumber);
    Task<PullRequest> CreatePullRequest(PullRequest pr);
    Task<List<PullRequest>> GetOpenPullRequests(Guid repositoryId);
    Task<List<PullRequest>> GetAllPullRequests(Guid repositoryId);
    Task UpdatePullRequestState(Guid prId, string state);

    // PR Files
    Task CreatePrFileChanged(PrFileChanged prFile);
    Task<List<RepositoryFile>> GetPrFiles(Guid prId);

    // Webhook Queue
    Task<long> EnqueueWebhook(string payload);
    Task<WebhookQueueItem?> GetNextPendingWebhook();
    Task UpdateWebhookStatus(long id, string status);
}
