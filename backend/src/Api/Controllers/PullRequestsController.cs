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
}
