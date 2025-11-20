using CodeFamily.Api.Core.Models;
using Octokit;

namespace CodeFamily.Api.Core.Interfaces;

public interface IGitHubService
{
    // OAuth
    string GetOAuthUrl(string redirectUri);
    Task<string> ExchangeCodeForToken(string code);
    Task<GitHubUserDto> GetAuthenticatedUser(string accessToken);

    // Repositories
    Task<List<Octokit.Repository>> GetUserRepositories(string accessToken);
    Task<Octokit.Repository> GetRepository(string owner, string repo);

    // Commits
    Task<IReadOnlyList<GitHubCommit>> GetCommits(string owner, string repo);
    Task<GitHubCommit> GetCommit(string owner, string repo, string sha);

    // Pull Requests
    Task<IReadOnlyList<Octokit.PullRequest>> GetPullRequests(string owner, string repo, PullRequestRequest? request = null);
    Task<Octokit.PullRequest> GetPullRequest(string owner, string repo, int number);
    Task<IReadOnlyList<PullRequestFile>> GetPullRequestFiles(string owner, string repo, int number);

    // Webhooks
    Task<RepositoryHook> CreateWebhook(string owner, string repo, string webhookUrl, string secret);
    Task RegisterWebhook(string owner, string repo); // Convenience method using configured webhook URL
    Task<bool> VerifyWebhookSignature(string payload, string signature, string secret);

    // Status API (Merge Blocking)
    Task CreateCommitStatus(string owner, string repo, string sha, string state, string description, string context);

    // Installation Token (for GitHub App)
    Task<string> GetInstallationToken(long installationId);
}
