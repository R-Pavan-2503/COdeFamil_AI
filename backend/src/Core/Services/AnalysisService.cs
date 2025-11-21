using CodeFamily.Api.Core.Interfaces;
using CodeFamily.Api.Core.Models;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using LibGit2Sharp;

using LibGitRepository = LibGit2Sharp.Repository;
using LibGitCommit = LibGit2Sharp.Commit;
using DbCommit = CodeFamily.Api.Core.Models.Commit;
using DbRepository = CodeFamily.Api.Core.Models.Repository;

namespace CodeFamily.Api.Core.Services;

/// <summary>
/// ENHANCED Analysis Service implementing COMPLETE ingestion pipeline.
/// </summary>
public class AnalysisService : IAnalysisService
{
    private readonly IDatabaseService _db;
    private readonly IRepositoryService _repoService;
    private readonly ITreeSitterService _treeSitter;
    private readonly IGeminiService _gemini;
    private readonly IGitHubService _github;
    private readonly ILogger<AnalysisService> _logger;

    // Track author contributions per file for ownership calculation
    private readonly Dictionary<Guid, Dictionary<string, List<double>>> _fileAuthorDeltas = new();

    public AnalysisService(
        IDatabaseService db,
        IRepositoryService repoService,
        ITreeSitterService treeSitter,
        IGeminiService gemini,
        IGitHubService github,
        ILogger<AnalysisService> logger)
    {
        _db = db;
        _repoService = repoService;
        _treeSitter = treeSitter;
        _gemini = gemini;
        _github = github;
        _logger = logger;
    }

    public async Task AnalyzeRepository(string owner, string repoName, Guid repositoryId, Guid userId)
    {
        _logger.LogInformation($"🚀 Starting COMPLETE analysis of {owner}/{repoName}");
        _fileAuthorDeltas.Clear();

        try
        {
            await _db.UpdateRepositoryStatus(repositoryId, "analyzing");

            // Step 1: Bare clone (or reuse existing)
            var cloneUrl = $"https://github.com/{owner}/{repoName}.git";
            var repoPath = await _repoService.CloneBareRepository(cloneUrl, owner, repoName);

            using var repo = _repoService.GetRepository(owner, repoName);

            // Step 2: Get ALL commits (full history)
            var commits = _repoService.GetAllCommits(repo);
            _logger.LogInformation($"📊 Found {commits.Count} commits to process");

            // Step 3: Process each commit with author tracking
            int processedCount = 0;
            foreach (var gitCommit in commits)
            {
                try
                {
                    var authorEmail = gitCommit.Author.Email ?? "unknown@example.com";
                    var authorName = gitCommit.Author.Name ?? "unknown";

                    // Ensure author exists in DB
                    var authorUser = await GetOrCreateAuthorUser(authorEmail, authorName);

                    // Store commit if not already present
                    var commit = await _db.GetCommitBySha(repositoryId, gitCommit.Sha);
                    if (commit == null)
                    {
                        commit = await _db.CreateCommit(new DbCommit
                        {
                            RepositoryId = repositoryId,
                            Sha = gitCommit.Sha,
                            Message = gitCommit.MessageShort,
                            CommittedAt = gitCommit.Author.When.UtcDateTime
                        });
                    }

                    // Get changed files for this commit
                    var changedFiles = _repoService.GetChangedFiles(repo, gitCommit);

                    foreach (var filePath in changedFiles)
                    {
                        await ProcessFile(repo, commit, gitCommit.Sha, filePath, authorUser.Id, authorEmail);
                    }

                    processedCount++;
                    if (processedCount % 10 == 0)
                    {
                        _logger.LogInformation($"📈 Processed {processedCount}/{commits.Count} commits");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError($"❌ Error processing commit {gitCommit.Sha}: {ex.Message}");
                }
            }

            _logger.LogInformation($"✅ Processed all {processedCount} commits");

            // Step 4: Calculate semantic ownership for ALL files
            _logger.LogInformation("🧮 Calculating semantic ownership scores...");
            await CalculateAllFileOwnership(repositoryId);

            // Step 5: Calculate dependency graph and blast radius
            _logger.LogInformation("📊 Calculating dependency graph and blast radius...");
            await CalculateDependencyMetrics(repositoryId);

            // Step 6: Register webhook for real‑time updates
            _logger.LogInformation($"🔔 Registering webhook for {owner}/{repoName}...");
            await RegisterWebhook(owner, repoName);

            await _db.UpdateRepositoryStatus(repositoryId, "ready");
            _logger.LogInformation($"🎉 COMPLETE analysis finished for {owner}/{repoName}");
        }
        catch (Exception ex)
        {
            _logger.LogError($"💥 Analysis failed for {owner}/{repoName}: {ex.Message}");
            await _db.UpdateRepositoryStatus(repositoryId, "error");
            throw;
        }
    }

    // ---------------------------------------------------------------------
    // Helper: Get or create a user record for an author email
    // ---------------------------------------------------------------------
    private async Task<User> GetOrCreateAuthorUser(string email, string name)
    {
        // Try to find an existing user by email (implementation assumed on IDatabaseService)
        var existing = await _db.GetUserByEmail(email);
        if (existing != null)
        {
            return existing;
        }

        // Create a placeholder user – in a real system you would enrich this later
        var newUser = await _db.CreateUser(new User
        {
            Email = email,
            Username = string.IsNullOrWhiteSpace(name) ? email.Split('@')[0] : name,
            AvatarUrl = $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(name)}",
            GithubId = 0 // will be updated when linked to a real GitHub account
        });
        return newUser;
    }

    // ---------------------------------------------------------------------
    // Process a single file at a specific commit
    // ---------------------------------------------------------------------
    private async Task ProcessFile(
        LibGitRepository repo,
        DbCommit commit,
        string commitSha,
        string filePath,
        Guid authorId,
        string authorEmail)
    {
        // Ensure file record exists
        var file = await _db.GetFileByPath(commit.RepositoryId, filePath);
        if (file == null)
        {
            file = await _db.CreateFile(new RepositoryFile
            {
                RepositoryId = commit.RepositoryId,
                FilePath = filePath
            });
        }

        // Retrieve file content at this commit
        var content = _repoService.GetFileContentAtCommit(repo, commitSha, filePath);
        if (string.IsNullOrEmpty(content)) return; // nothing to analyse

        // Determine language for parsing
        var language = _repoService.GetLanguageFromPath(filePath);
        if (language == "unknown") return; // skip unsupported files

        // Parse source code using Tree‑sitter
        var parseResult = await _treeSitter.ParseCode(content, language);

        // -----------------------------------------------------------------
        // Embeddings & semantic delta tracking
        // -----------------------------------------------------------------
        var previousEmbeddings = await _db.GetEmbeddingsByFile(file.Id);
        var currentDeltas = new List<double>();
        foreach (var function in parseResult.Functions)
        {
            try
            {
                var embedding = await _gemini.GenerateEmbedding(function.Code);
                await _db.CreateEmbedding(new CodeEmbedding
                {
                    FileId = file.Id,
                    Embedding = embedding,
                    ChunkContent = function.Code,
                    CreatedAt = DateTime.UtcNow
                });

                if (previousEmbeddings.Count > 0)
                {
                    var delta = CalculateSemanticDelta(embedding, previousEmbeddings[^1].Embedding);
                    currentDeltas.Add(delta);
                    _logger.LogInformation($"📊 File {file.Id} has semantic delta of {delta}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning($"⚠️ Failed to generate embedding for function in {filePath}: {ex.Message}");
            }
        }

        // -----------------------------------------------------------------
        // Ownership contribution aggregation
        // -----------------------------------------------------------------
        if (currentDeltas.Count > 0)
        {
            if (!_fileAuthorDeltas.ContainsKey(file.Id))
                _fileAuthorDeltas[file.Id] = new Dictionary<string, List<double>>();

            if (!_fileAuthorDeltas[file.Id].ContainsKey(authorEmail))
                _fileAuthorDeltas[file.Id][authorEmail] = new List<double>();

            _fileAuthorDeltas[file.Id][authorEmail].AddRange(currentDeltas);
        }

        // -----------------------------------------------------------------
        // Dependency creation based on imports
        // -----------------------------------------------------------------
        // -----------------------------------------------------------------
        // Dependency creation based on imports
        // -----------------------------------------------------------------
        _logger.LogInformation($"🔍 Analyzing dependencies for {filePath}. Found {parseResult.Imports.Count} imports.");
        
        foreach (var import in parseResult.Imports)
        {
            try
            {
                _logger.LogInformation($"  👉 Processing import: '{import.Module}'");
                var targetPath = await ResolveImportPathAsync(filePath, import.Module, language, commit.RepositoryId);
                
                if (targetPath != null)
                {
                    _logger.LogInformation($"    ✅ Resolved path: {targetPath}");
                    var targetFile = await _db.GetFileByPath(commit.RepositoryId, targetPath);
                    
                    if (targetFile != null)
                    {
                        await _db.CreateDependency(new Dependency
                        {
                            SourceFileId = file.Id,
                            TargetFileId = targetFile.Id,
                            DependencyType = "import",
                            Strength = 1
                        });
                        _logger.LogInformation($"    🔗 Created dependency: {filePath} -> {targetPath}");
                    }
                    else
                    {
                        _logger.LogWarning($"    ⚠️ Resolved path '{targetPath}' not found in database for repo {commit.RepositoryId}");
                    }
                }
                else
                {
                    _logger.LogInformation($"    ❌ Could not resolve path for '{import.Module}'");
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning($"    ⚠️ Exception processing import '{import.Module}': {ex.Message}");
            }
        }

        // -----------------------------------------------------------------
        // Record file change (additions approximated by line count)
        // -----------------------------------------------------------------
        await _db.CreateFileChange(new FileChange
        {
            CommitId = commit.Id,
            FileId = file.Id,
            Additions = content.Split('\n').Length,
            Deletions = 0
        });
    }

    // ---------------------------------------------------------------------
    // Calculate and persist ownership percentages for all files in a repo
    // ---------------------------------------------------------------------
    private async Task CalculateAllFileOwnership(Guid repositoryId)
    {
        var files = await _db.GetFilesByRepository(repositoryId);
        foreach (var file in files)
        {
            await CalculateSemanticOwnership(file.Id, repositoryId);
        }
    }

    public async Task CalculateSemanticOwnership(Guid fileId, Guid repositoryId)
    {
        if (!_fileAuthorDeltas.ContainsKey(fileId)) return;

        var authorContributions = _fileAuthorDeltas[fileId];
        var totalDelta = authorContributions.Values.SelectMany(d => d).Sum();
        if (totalDelta == 0) return;

        foreach (var kvp in authorContributions)
        {
            var authorEmail = kvp.Key;
            var deltas = kvp.Value;
            var authorDelta = deltas.Sum();
            var ownershipScore = (decimal)(authorDelta / totalDelta * 100);

            // Resolve or create user record
            var user = await GetOrCreateAuthorUser(authorEmail, authorEmail.Split('@')[0]);

            _logger.LogInformation($"👤 File {fileId}: {authorEmail} owns {ownershipScore:F2}%");
            await _db.UpsertFileOwnership(new FileOwnership
            {
                FileId = fileId,
                AuthorName = authorEmail,
                SemanticScore = ownershipScore,
                LastUpdated = DateTime.UtcNow
            });
        }
    }

    // ---------------------------------------------------------------------
    // Dependency graph metrics (blast radius etc.)
    // ---------------------------------------------------------------------
    private async Task CalculateDependencyMetrics(Guid repositoryId)
    {
        var files = await _db.GetFilesByRepository(repositoryId);
        foreach (var file in files)
        {
            var dependencies = await _db.GetDependenciesForFile(file.Id);
            var dependents = await _db.GetDependentsForFile(file.Id);
            _logger.LogInformation($"📦 File {file.FilePath}: {dependencies.Count} dependencies, {dependents.Count} dependents");
            // Blast radius is simply the number of dependents for now
            // TODO: Persist if needed
        }
    }

    // ---------------------------------------------------------------------
    // Register GitHub webhook via the GitHub service
    // ---------------------------------------------------------------------
    // ---------------------------------------------------------------------
// Register GitHub webhook via the GitHub service
// ---------------------------------------------------------------------
private async Task RegisterWebhook(string owner, string repo)
{
    try
    {
        await _github.RegisterWebhook(owner, repo);
        _logger.LogInformation($"✅ Webhook registered for {owner}/{repo}");
    }
    catch (Exception ex)
    {
        _logger.LogWarning($"⚠️ Failed to register webhook for {owner}/{repo}. Error: {ex.Message}");
        _logger.LogWarning($"   Ensure the GitHub App is installed on this repository and has 'write' permissions for webhooks.");
    }
}


    //---------------------------------------------------------------------
    // Helper: Resolve import paths using repository files from database
    // ---------------------------------------------------------------------
    private async Task<string?> ResolveImportPathAsync(string sourceFile, string importModule, string language, Guid repositoryId)
    {
        // Normalize paths
        sourceFile = sourceFile.Replace("\\", "/");
        var sourceDir = Path.GetDirectoryName(sourceFile)?.Replace("\\", "/") ?? "";
        
        // _logger.LogInformation($"    Resolving '{importModule}' from '{sourceDir}' (Language: {language})");

        string? targetPath = null;

        // Handle relative imports (./ or ../)
        if (importModule.StartsWith("./") || importModule.StartsWith("../"))
        {
            // Use a fake root to resolve relative paths cleanly
            var fakeRoot = "/root";
            var combined = Path.Combine(fakeRoot, sourceDir, importModule);
            var resolved = Path.GetFullPath(combined).Replace("\\", "/");
            
            // Remove the fake root to get back the repo-relative path
            if (resolved.StartsWith(fakeRoot))
            {
                targetPath = resolved.Substring(fakeRoot.Length).TrimStart('/');
            }
            else
            {
                // Path went above root (e.g. ../../../)
                targetPath = null;
            }
        }
        else if (language is "javascript" or "typescript")
        {
            // Non-relative import - could be local package or npm module
            // Try to find it in the repository
            var allFiles = await _db.GetFilesByRepository(repositoryId);
            var matches = allFiles.Where(f => f.FilePath.Contains(importModule)).ToList();
            
            if (matches.Count == 1)
            {
                return matches[0].FilePath;
            }
            else if (matches.Count > 1)
            {
                // Prefer exact match
                var exact = matches.FirstOrDefault(f => 
                    f.FilePath.EndsWith("/" + importModule) ||
                    f.FilePath.EndsWith("/" + importModule + ".js") ||
                    f.FilePath.EndsWith("/" + importModule + ".jsx") ||
                    f.FilePath.EndsWith("/" + importModule + ".ts") ||
                    f.FilePath.EndsWith("/" + importModule + ".tsx"));
                if (exact != null) return exact.FilePath;
            }
            
            // If no match, it's likely an npm package - skip
            return null;
        }
        else
        {
            // Other languages - only handle relative imports for now
            return null;
        }

        // Get all repository files
        var repoFiles = await _db.GetFilesByRepository(repositoryId);
        
        // Try exact match
        var exactFile = repoFiles.FirstOrDefault(f => f.FilePath.Equals(targetPath, StringComparison.OrdinalIgnoreCase));
        if (exactFile != null) return exactFile.FilePath;

        // Try with common extensions
        var extensions = new[] { ".js", ".jsx", ".ts", ".tsx", ".py", ".go", ".java", ".cs" };
        foreach (var ext in extensions)
        {
            var withExt = repoFiles.FirstOrDefault(f => f.FilePath.Equals(targetPath + ext, StringComparison.OrdinalIgnoreCase));
            if (withExt != null) return withExt.FilePath;
        }

        // Try index files
        foreach (var ext in extensions)
        {
            var indexPath = Path.Combine(targetPath, "index" + ext).Replace("\\", "/");
            var indexFile = repoFiles.FirstOrDefault(f => f.FilePath.Equals(indexPath, StringComparison.OrdinalIgnoreCase));
            if (indexFile != null) return indexFile.FilePath;
        }

        return null;
    }

    // ---------------------------------------------------------------------
    // Semantic delta calculation (Euclidean distance)
    // ---------------------------------------------------------------------
    private double CalculateSemanticDelta(float[] newEmbedding, float[] oldEmbedding)
    {
        double sum = 0;
        int len = Math.Min(newEmbedding.Length, oldEmbedding.Length);
        for (int i = 0; i < len; i++)
        {
            var diff = newEmbedding[i] - oldEmbedding[i];
            sum += diff * diff;
        }
        return Math.Sqrt(sum);
    }

    // ---------------------------------------------------------------------
    // Existing interface methods (kept for compatibility)
    // ---------------------------------------------------------------------
    public async Task<double> CalculateRisk(Guid fileId1, Guid fileId2)
    {
        var embeddings1 = await _db.GetEmbeddingsByFile(fileId1);
        var embeddings2 = await _db.GetEmbeddingsByFile(fileId2);
        if (embeddings1.Count == 0 || embeddings2.Count == 0) return 0;
        var e1 = embeddings1[^1].Embedding;
        var e2 = embeddings2[^1].Embedding;
        double dot = 0, norm1 = 0, norm2 = 0;
        for (int i = 0; i < Math.Min(e1.Length, e2.Length); i++)
        {
            dot += e1[i] * e2[i];
            norm1 += e1[i] * e1[i];
            norm2 += e2[i] * e2[i];
        }
        return dot / (Math.Sqrt(norm1) * Math.Sqrt(norm2));
    }

    public async Task<RiskAnalysisResult> CalculateRisk(Guid repositoryId, List<string> changedFiles, List<float[]> newEmbeddings)
    {
        var result = new RiskAnalysisResult
        {
            RiskScore = 0,
            StructuralOverlap = 0,
            SemanticOverlap = 0,
            ConflictingPrs = new List<ConflictingPr>()
        };
        try
        {
            var openPRs = await _db.GetOpenPullRequests(repositoryId);
            foreach (var pr in openPRs)
            {
                var prFiles = await _db.GetPrFiles(pr.Id);
                var structuralOverlap = changedFiles.Intersect(prFiles.Select(f => f.FilePath)).ToList();
                double maxSemanticSimilarity = 0;
                foreach (var changedFile in changedFiles)
                {
                    var file = await _db.GetFileByPath(repositoryId, changedFile);
                    if (file == null) continue;
                    foreach (var prFile in prFiles)
                    {
                        var similarity = await CalculateRisk(file.Id, prFile.Id);
                        if (similarity > maxSemanticSimilarity) maxSemanticSimilarity = similarity;
                    }
                }
                var structuralScore = structuralOverlap.Count > 0 ? 1.0 : 0.0;
                var semanticScore = maxSemanticSimilarity;
                var riskScore = (structuralScore * 0.4) + (semanticScore * 0.6);
                if (riskScore > 0.8)
                {
                    result.ConflictingPrs.Add(new ConflictingPr
                    {
                        PrNumber = pr.PrNumber,
                        Title = null,
                        Risk = riskScore,
                        ConflictingFiles = structuralOverlap
                    });
                }
                result.RiskScore = Math.Max(result.RiskScore, riskScore);
                result.StructuralOverlap = Math.Max(result.StructuralOverlap, structuralScore);
                result.SemanticOverlap = Math.Max(result.SemanticOverlap, semanticScore);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError($"Risk calculation failed: {ex.Message}");
        }
        return result;
    }

    public async Task ProcessIncrementalUpdate(Guid repositoryId, string commitSha, List<string> changedFiles)
    {
        _logger.LogInformation($"Processing incremental update for commit {commitSha}");
        try
        {
            var repository = await _db.GetRepositoryById(repositoryId);
            if (repository == null)
            {
                _logger.LogError($"Repository {repositoryId} not found");
                return;
            }
            using var repo = _repoService.GetRepository(repository.OwnerUsername, repository.Name);
            var commit = await _db.GetCommitBySha(repositoryId, commitSha);
            if (commit == null)
            {
                var gitCommit = repo.Lookup(commitSha) as LibGitCommit;
                if (gitCommit == null)
                {
                    _logger.LogError($"Commit {commitSha} not found in repository");
                    return;
                }
                commit = await _db.CreateCommit(new DbCommit
                {
                    RepositoryId = repositoryId,
                    Sha = commitSha,
                    Message = gitCommit.MessageShort,
                    CommittedAt = gitCommit.Author.When.UtcDateTime
                });
            }
            foreach (var filePath in changedFiles)
            {
                // For incremental updates we don't have author info – use placeholder
                var placeholderEmail = "incremental@update.com";
                var placeholderUser = await GetOrCreateAuthorUser(placeholderEmail, "incremental");
                await ProcessFile(repo, commit, commitSha, filePath, placeholderUser.Id, placeholderEmail);
            }
            _logger.LogInformation($"Incremental update complete for {changedFiles.Count} files");
        }
        catch (Exception ex)
        {
            _logger.LogError($"Incremental update failed: {ex.Message}");
            throw;
        }
    }
}
