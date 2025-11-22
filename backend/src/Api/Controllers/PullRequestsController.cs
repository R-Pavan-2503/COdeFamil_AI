using Microsoft.AspNetCore.Mvc;
using CodeFamily.Api.Core.Interfaces;

namespace CodeFamily.Api.Controllers;

[ApiController]
[Route("pullrequests")]
public class PullRequestsController : ControllerBase
{
    private readonly IDatabaseService _db;
    private readonly IGitHubService _github;

    public PullRequestsController(IDatabaseService db, IGitHubService github)
    {
        _db = db;
        _github = github;
    }

    [HttpGet("repository/{repositoryId}")]
    public async Task<IActionResult> GetPullRequests(Guid repositoryId)
    {
        var prs = await _db.GetAllPullRequests(repositoryId);
        return Ok(prs);
    }

    [HttpGet("{prId}")]
    public async Task<IActionResult> GetPullRequest(Guid prId)
    {
        var pr = await _db.GetPullRequestByNumber(Guid.Empty, 0); // Simplified
        if (pr == null) return NotFound();

        var files = await _db.GetPrFiles(prId);

        return Ok(new { pr, files });
    }

    [HttpGet("{owner}/{repo}/{prNumber}/details")]
    public async Task<IActionResult> GetPullRequestDetails(string owner, string repo, int prNumber)
    {
        try
        {
            string? accessToken = null;
            if (Request.Headers.TryGetValue("Authorization", out var authHeader))
            {
                var headerValue = authHeader.ToString();
                if (headerValue.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                {
                    accessToken = headerValue.Substring("Bearer ".Length).Trim();
                }
            }

            // Get PR from GitHub API
            var pr = await _github.GetPullRequest(owner, repo, prNumber, accessToken);
            
            // Get files changed
            var files = await _github.GetPullRequestFiles(owner, repo, prNumber, accessToken);
            
            // Return comprehensive details
            return Ok(new
            {
                Number = pr.Number,
                Title = pr.Title,
                Body = pr.Body,
                State = pr.State.StringValue,
                Author = new
                {
                    Login = pr.User.Login,
                    AvatarUrl = pr.User.AvatarUrl
                },
                BaseBranch = pr.Base.Ref,
                HeadBranch = pr.Head.Ref,
                CreatedAt = pr.CreatedAt,
                UpdatedAt = pr.UpdatedAt,
                MergedAt = pr.MergedAt,
                Merged = pr.Merged,
                Mergeable = pr.Mergeable,
                FilesChanged = files.Select(f => new
                {
                    Filename = f.FileName,
                    Status = f.Status,
                    Additions = f.Additions,
                    Deletions = f.Deletions,
                    Changes = f.Changes,
                    Patch = f.Patch
                })
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = $"Failed to fetch PR details: {ex.Message}" });
        }
    }
}
