using Microsoft.AspNetCore.Mvc;
using CodeFamily.Api.Core.Interfaces;
using CodeFamily.Api.Core.Models;

namespace CodeFamily.Api.Controllers;

[ApiController]
[Route("files")]
public class FilesController : ControllerBase
{
    private readonly IDatabaseService _db;
    private readonly IRepositoryService _repoService;
    private readonly ILogger<FilesController> _logger;

    public FilesController(
        IDatabaseService db, 
        IRepositoryService repoService,
        ILogger<FilesController> logger)
    {
        _db = db;
        _repoService = repoService;
        _logger = logger;
    }

    [HttpGet("repository/{repositoryId}")]
    public async Task<IActionResult> GetFiles(Guid repositoryId)
    {
        var files = await _db.GetFilesByRepository(repositoryId);
        return Ok(files);
    }

    // Get individual file metadata
    [HttpGet("{fileId}")]
    public async Task<IActionResult> GetFile(Guid fileId)
    {
        var file = await _db.GetFileById(fileId);
        if (file == null) return NotFound(new { error = "File not found" });

        // Get file analysis data
        var ownership = await _db.GetFileOwnership(fileId);
        var dependencies = await _db.GetDependenciesForFile(fileId);
        var dependents = await _db.GetDependentsForFile(fileId);
        var embeddings = await _db.GetEmbeddingsByFile(fileId);
        var changes = await _db.GetFileChangesByFile(fileId);

        // Get semantic neighbors (similar files)
        var similarFiles = new List<RepositoryFile>();
        if (embeddings.Any())
        {
            try
            {
                var neighbors = await _db.FindSimilarFiles(embeddings.First().Embedding!, file.RepositoryId, 5);
                similarFiles = neighbors.Select(n => n.Item1).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Failed to find similar files: {ex.Message}");
            }
        }

        // Get dependency file details
        var dependencyDetails = new List<object>();
        foreach (var dep in dependencies)
        {
            var targetFile = await _db. GetFileById(dep.TargetFileId);
            if (targetFile != null)
            {
                dependencyDetails.Add(new
                {
                    filePath = targetFile.FilePath,
                    dependencyType = dep.DependencyType,
                    strength = dep.Strength
                });
            }
        }

        // Get dependent file details
        var dependentDetails = new List<object>();
        foreach (var dep in dependents)
        {
            var sourceFile = await _db.GetFileById(dep.SourceFileId);
            if (sourceFile != null)
            {
                dependentDetails.Add(new
                {
                    filePath = sourceFile.FilePath
                });
            }
        }

        // Get ownership details with usernames
        var ownershipDetails = new List<object>();
        foreach (var own in ownership)
        {
            var user = await _db.GetUserById(own.UserId);
            ownershipDetails.Add(new
            {
                username = user?.Username ?? "Unknown",
                semanticScore = Math.Round((double)own.SemanticScore, 2)
            });
        }

        return Ok(new
        {
            id = file.Id,
            filePath = file.FilePath,
            totalLines = file.TotalLines,
            purpose = "Semantic summary will be generated from embeddings", // TODO: Generate from embeddings
            owners = ownershipDetails,
            dependencies = dependencyDetails,
            dependents = dependentDetails,
            semanticNeighbors = similarFiles.Select(f => new { filePath = f.FilePath }),
            changeCount = changes.Count,
            mostFrequentAuthor = "N/A", // TODO: Calculate from changes
            lastModified = changes.Any() ? changes.Max(c => c.CreatedAt) : (DateTime?)null,
            isInOpenPr = false // TODO: Check against open PRs
        });
    }

    // Get file content from Git repository
    [HttpGet("{fileId}/content")]
    public async Task<IActionResult> GetFileContent(Guid fileId, [FromQuery] string? commitSha = null)
    {
        try
        {
            var file = await _db.GetFileById(fileId);
            if (file == null) return NotFound(new { error = "File not found" });

            var repository = await _db.GetRepositoryById(file.RepositoryId);
            if (repository == null) return NotFound(new { error = "Repository not found" });

            // Get the cloned repository
            using var repo = _repoService.GetRepository(repository.OwnerUsername, repository.Name);

            // If no commit SHA specified, use HEAD
            var commit = commitSha != null 
                ? repo.Lookup(commitSha) as LibGit2Sharp.Commit
                : repo.Head.Tip;

            if (commit == null) return NotFound(new { error = "Commit not found" });

            // Get the blob (file content) at this commit
            var blob = commit[file.FilePath]?.Target as LibGit2Sharp.Blob;
            if (blob == null) return NotFound(new { error = "File not found in commit" });

            // Return content as text
            var content = blob.GetContentText();

            return Ok(new
            {
                filePath = file.FilePath,
                commitSha = commit.Sha,
                content = content,
                size = blob.Size
            });
        }
        catch (Exception ex)
        {
            _logger.LogError($"Failed to get file content: {ex.Message}");
            return StatusCode(500, new { error = $"Failed to retrieve file content: {ex.Message}" });
        }
    }
}
