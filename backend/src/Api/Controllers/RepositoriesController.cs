using Microsoft.AspNetCore.Mvc;
using CodeFamily.Api.Core.Interfaces;
using CodeFamily.Api.Core.Models;

namespace CodeFamily.Api.Controllers;

[ApiController]
[Route("repositories")]
public class RepositoriesController : ControllerBase
{
    private readonly IGitHubService _github;
    private readonly IDatabaseService _db;
    private readonly IAnalysisService _analysis;

    public RepositoriesController(IGitHubService github, IDatabaseService db, IAnalysisService analysis)
    {
        _github = github;
        _db = db;
        _analysis = analysis;
    }

    [HttpGet]
    public async Task<IActionResult> GetRepositories([FromHeader(Name = "Authorization")] string authorization, [FromQuery] Guid userId)
    {
        try
        {
            var token = authorization.Replace("Bearer ", "");
            var githubRepos = await _github.GetUserRepositories(token);

            // Get analyzed repos
            var analyzedRepos = await _db.GetUserRepositories(userId);

            var result = githubRepos.Select(gr => new
            {
                gr.Id,
                gr.Name,
                gr.Owner.Login,
                gr.Description,
                gr.CloneUrl,
                Analyzed = analyzedRepos.Any(ar => ar.Name == gr.Name && ar.OwnerUsername == gr.Owner.Login),
                Status = analyzedRepos.FirstOrDefault(ar => ar.Name == gr.Name && ar.OwnerUsername == gr.Owner.Login)?.Status
            });

            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{owner}/{repo}/analyze")]
    public async Task<IActionResult> AnalyzeRepository(string owner, string repo, [FromQuery] Guid userId)
    {
        try
        {
            // Check if already exists
            var existing = await _db.GetRepositoryByName(owner, repo);
            if (existing != null)
            {
                return Ok(new { message = "Repository already analyzed", repositoryId = existing.Id });
            }

            // Create repository record
            var repository = await _db.CreateRepository(new Repository
            {
                Name = repo,
                OwnerUsername = owner,
                Status = "pending",
                ConnectedByUserId = userId
            });

            // Start analysis in background
            _ = Task.Run(async () =>
            {
                await _analysis.AnalyzeRepository(owner, repo, repository.Id, userId);
            });

            return Ok(new { message = "Analysis started", repositoryId = repository.Id });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{repositoryId}")]
    public async Task<IActionResult> GetRepository(Guid repositoryId)
    {
        var repo = await _db.GetRepositoryById(repositoryId);
        if (repo == null) return NotFound();

        return Ok(repo);
    }

    [HttpGet("{owner}/{repo}/status")]
    public async Task<IActionResult> GetRepositoryStatus(string owner, string repo)
    {
        try
        {
            var repository = await _db.GetRepositoryByName(owner, repo);
            if (repository == null)
            {
                return Ok(new { analyzed = false });
            }

            return Ok(new
            {
                analyzed = true,
                repositoryId = repository.Id,
                status = repository.Status,
                name = repository.Name,
                owner = repository.OwnerUsername
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
