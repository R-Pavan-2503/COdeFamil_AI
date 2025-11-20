using CodeFamily.Api.Core.Interfaces;
using CodeFamily.Api.Core.Models;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Configuration;
using Npgsql;
using System.Text.Json;

namespace CodeFamily.Api.Core.Services;

/// <summary>
/// Database service using raw Npgsql for maximum control.
/// Connects to Supabase PostgreSQL with pgvector support.
/// </summary>
public class DatabaseService : IDatabaseService
{
    private readonly string _connectionString;

    public DatabaseService(IOptions<AppSettings> appSettings, IConfiguration configuration)
    {
        // Use the direct PostgreSQL connection string from appsettings/settings.json
        _connectionString = configuration.GetConnectionString("DefaultConnection") 
            ?? throw new Exception("ConnectionStrings:DefaultConnection is required in settings.json");
    }

    private NpgsqlConnection GetConnection()
    {
        return new NpgsqlConnection(_connectionString);
    }

    // Users
    public async Task<User?> GetUserByGitHubId(long githubId)
    {
        using var conn = GetConnection();
        await conn.OpenAsync();

        using var cmd = new NpgsqlCommand("SELECT id, github_id, username, email, avatar_url FROM users WHERE github_id = @githubId", conn);
        cmd.Parameters.AddWithValue("githubId", githubId);

        using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return new User
            {
                Id = reader.GetGuid(0),
                GithubId = reader.GetInt64(1),
                Username = reader.GetString(2),
                Email = reader.IsDBNull(3) ? null : reader.GetString(3),
                AvatarUrl = reader.IsDBNull(4) ? null : reader.GetString(4)
            };
        }
        return null;
    }

    public async Task<User> CreateUser(User user)
    {
        using var conn = GetConnection();
        await conn.OpenAsync();

        using var cmd = new NpgsqlCommand(
            "INSERT INTO users (github_id, username, email, avatar_url) VALUES (@githubId, @username, @email, @avatarUrl) RETURNING id",
            conn);

        cmd.Parameters.AddWithValue("githubId", user.GithubId);
        cmd.Parameters.AddWithValue("username", user.Username);
        cmd.Parameters.AddWithValue("email", (object?)user.Email ?? DBNull.Value);
        cmd.Parameters.AddWithValue("avatarUrl", (object?)user.AvatarUrl ?? DBNull.Value);

        user.Id = (Guid)(await cmd.ExecuteScalarAsync())!;
        return user;
    }

    public async Task<User?> GetUserById(Guid id)
    {
        using var conn = GetConnection();
        await conn.OpenAsync();

        using var cmd = new NpgsqlCommand("SELECT id, github_id, username, email, avatar_url FROM users WHERE id = @id", conn);
        cmd.Parameters.AddWithValue("id", id);

        using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return new User
            {
                Id = reader.GetGuid(0),
                GithubId = reader.GetInt64(1),
                Username = reader.GetString(2),
                Email = reader.IsDBNull(3) ? null : reader.GetString(3),
                AvatarUrl = reader.IsDBNull(4) ? null : reader.GetString(4)
            };
        }
        return null;
    }

    // Repositories
    public async Task<Repository?> GetRepositoryByName(string owner, string name)
    {
        using var conn = GetConnection();
        await conn.OpenAsync();

        using var cmd = new NpgsqlCommand(
            "SELECT id, name, owner_username, status, is_active_blocking, connected_by_user_id FROM repositories WHERE owner_username = @owner AND name = @name",
            conn);

        cmd.Parameters.AddWithValue("owner", owner);
        cmd.Parameters.AddWithValue("name", name);

        using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return new Repository
            {
                Id = reader.GetGuid(0),
                Name = reader.GetString(1),
                OwnerUsername = reader.GetString(2),
                Status = reader.IsDBNull(3) ? null : reader.GetString(3),
                IsActiveBlocking = reader.GetBoolean(4),
                ConnectedByUserId = reader.IsDBNull(5) ? null : reader.GetGuid(5)
            };
        }
        return null;
    }

    public async Task<Repository> CreateRepository(Repository repository)
    {
        using var conn = GetConnection();
        await conn.OpenAsync();

        using var cmd = new NpgsqlCommand(
            "INSERT INTO repositories (name, owner_username, status, is_active_blocking, connected_by_user_id) VALUES (@name, @owner, @status, @blocking, @userId) RETURNING id",
            conn);

        cmd.Parameters.AddWithValue("name", repository.Name);
        cmd.Parameters.AddWithValue("owner", repository.OwnerUsername);
        cmd.Parameters.AddWithValue("status", (object?)repository.Status ?? DBNull.Value);
        cmd.Parameters.AddWithValue("blocking", repository.IsActiveBlocking);
        cmd.Parameters.AddWithValue("userId", (object?)repository.ConnectedByUserId ?? DBNull.Value);

        repository.Id = (Guid)(await cmd.ExecuteScalarAsync())!;
        return repository;
    }

    public async Task UpdateRepositoryStatus(Guid repositoryId, string status)
    {
        using var conn = GetConnection();
        await conn.OpenAsync();

        using var cmd = new NpgsqlCommand("UPDATE repositories SET status = @status WHERE id = @id", conn);
        cmd.Parameters.AddWithValue("status", status);
        cmd.Parameters.AddWithValue("id", repositoryId);

        await cmd.ExecuteNonQueryAsync();
    }

    public async Task<List<Repository>> GetUserRepositories(Guid userId)
    {
        using var conn = GetConnection();
        await conn.OpenAsync();

        using var cmd = new NpgsqlCommand(
            "SELECT id, name, owner_username, status, is_active_blocking, connected_by_user_id FROM repositories WHERE connected_by_user_id = @userId",
            conn);

        cmd.Parameters.AddWithValue("userId", userId);

        var repositories = new List<Repository>();
        using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            repositories.Add(new Repository
            {
                Id = reader.GetGuid(0),
                Name = reader.GetString(1),
                OwnerUsername = reader.GetString(2),
                Status = reader.IsDBNull(3) ? null : reader.GetString(3),
                IsActiveBlocking = reader.GetBoolean(4),
                ConnectedByUserId = reader.IsDBNull(5) ? null : reader.GetGuid(5)
            });
        }
        return repositories;
    }

    public async Task<Repository?> GetRepositoryById(Guid id)
    {
        using var conn = GetConnection();
        await conn.OpenAsync();

        using var cmd = new NpgsqlCommand(
            "SELECT id, name, owner_username, status, is_active_blocking, connected_by_user_id FROM repositories WHERE id = @id",
            conn);

        cmd.Parameters.AddWithValue("id", id);

        using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return new Repository
            {
                Id = reader.GetGuid(0),
                Name = reader.GetString(1),
                OwnerUsername = reader.GetString(2),
                Status = reader.IsDBNull(3) ? null : reader.GetString(3),
                IsActiveBlocking = reader.GetBoolean(4),
                ConnectedByUserId = reader.IsDBNull(5) ? null : reader.GetGuid(5)
            };
        }
        return null;
    }

    // Commits
    public async Task<Commit> CreateCommit(Commit commit)
    {
        using var conn = GetConnection();
        await conn.OpenAsync();

        using var cmd = new NpgsqlCommand(
            "INSERT INTO commits (repository_id, sha, message, committed_at) VALUES (@repoId, @sha, @message, @committedAt) RETURNING id",
            conn);

        cmd.Parameters.AddWithValue("repoId", commit.RepositoryId);
        cmd.Parameters.AddWithValue("sha", commit.Sha);
        cmd.Parameters.AddWithValue("message", (object?)commit.Message ?? DBNull.Value);
        cmd.Parameters.AddWithValue("committedAt", commit.CommittedAt);

        commit.Id = (Guid)(await cmd.ExecuteScalarAsync())!;
        return commit;
    }

    public async Task<List<Commit>> GetCommitsByRepository(Guid repositoryId)
    {
        using var conn = GetConnection();
        await conn.OpenAsync();

        using var cmd = new NpgsqlCommand(
            "SELECT id, repository_id, sha, message, committed_at FROM commits WHERE repository_id = @repoId ORDER BY committed_at DESC",
            conn);

        cmd.Parameters.AddWithValue("repoId", repositoryId);

        var commits = new List<Commit>();
        using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            commits.Add(new Commit
            {
                Id = reader.GetGuid(0),
                RepositoryId = reader.GetGuid(1),
                Sha = reader.GetString(2),
                Message = reader.IsDBNull(3) ? null : reader.GetString(3),
                CommittedAt = reader.GetDateTime(4)
            });
        }
        return commits;
    }

    public async Task<Commit?> GetCommitById(Guid id)
    {
        using var conn = GetConnection();
        await conn.OpenAsync();

        using var cmd = new NpgsqlCommand(
            "SELECT id, repository_id, sha, message, committed_at FROM commits WHERE id = @id",
            conn);

        cmd.Parameters.AddWithValue("id", id);

        using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return new Commit
            {
                Id = reader.GetGuid(0),
                RepositoryId = reader.GetGuid(1),
                Sha = reader.GetString(2),
                Message = reader.IsDBNull(3) ? null : reader.GetString(3),
                CommittedAt = reader.GetDateTime(4)
            };
        }
        return null;
    }

    public async Task<Commit?> GetCommitBySha(Guid repositoryId, string sha)
    {
        using var conn = GetConnection();
        await conn.OpenAsync();

        using var cmd = new NpgsqlCommand(
            "SELECT id, repository_id, sha, message, committed_at FROM commits WHERE repository_id = @repoId AND sha = @sha",
            conn);

        cmd.Parameters.AddWithValue("repoId", repositoryId);
        cmd.Parameters.AddWithValue("sha", sha);

        using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return new Commit
            {
                Id = reader.GetGuid(0),
                RepositoryId = reader.GetGuid(1),
                Sha = reader.GetString(2),
                Message = reader.IsDBNull(3) ? null : reader.GetString(3),
                CommittedAt = reader.GetDateTime(4)
            };
        }
        return null;
    }

    // Files
    public async Task<RepositoryFile?> GetFileByPath(Guid repositoryId, string filePath)
    {
        using var conn = GetConnection();
        await conn.OpenAsync();

        using var cmd = new NpgsqlCommand(
            "SELECT id, repository_id, file_path, total_lines FROM repository_files WHERE repository_id = @repoId AND file_path = @path",
            conn);

        cmd.Parameters.AddWithValue("repoId", repositoryId);
        cmd.Parameters.AddWithValue("path", filePath);

        using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return new RepositoryFile
            {
                Id = reader.GetGuid(0),
                RepositoryId = reader.GetGuid(1),
                FilePath = reader.GetString(2),
                TotalLines = reader.IsDBNull(3) ? null : reader.GetInt32(3)
            };
        }
        return null;
    }

    public async Task<RepositoryFile> CreateFile(RepositoryFile file)
    {
        using var conn = GetConnection();
        await conn.OpenAsync();

        using var cmd = new NpgsqlCommand(
            "INSERT INTO repository_files (repository_id, file_path, total_lines) VALUES (@repoId, @path, @lines) RETURNING id",
            conn);

        cmd.Parameters.AddWithValue("repoId", file.RepositoryId);
        cmd.Parameters.AddWithValue("path", file.FilePath);
        cmd.Parameters.AddWithValue("lines", (object?)file.TotalLines ?? DBNull.Value);

        file.Id = (Guid)(await cmd.ExecuteScalarAsync())!;
        return file;
    }

    public async Task<List<RepositoryFile>> GetFilesByRepository(Guid repositoryId)
    {
        using var conn = GetConnection();
        await conn.OpenAsync();

        using var cmd = new NpgsqlCommand(
            "SELECT id, repository_id, file_path, total_lines FROM repository_files WHERE repository_id = @repoId ORDER BY file_path",
            conn);

        cmd.Parameters.AddWithValue("repoId", repositoryId);

        var files = new List<RepositoryFile>();
        using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            files.Add(new RepositoryFile
            {
                Id = reader.GetGuid(0),
                RepositoryId = reader.GetGuid(1),
                FilePath = reader.GetString(2),
                TotalLines = reader.IsDBNull(3) ? null : reader.GetInt32(3)
            });
        }
        return files;
    }

    public async Task<RepositoryFile?> GetFileById(Guid fileId)
    {
        using var conn = GetConnection();
        await conn.OpenAsync();

        using var cmd = new NpgsqlCommand(
            "SELECT id, repository_id, file_path, total_lines FROM repository_files WHERE id = @id",
            conn);

        cmd.Parameters.AddWithValue("id", fileId);

        using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return new RepositoryFile
            {
                Id = reader.GetGuid(0),
                RepositoryId = reader.GetGuid(1),
                FilePath = reader.GetString(2),
                TotalLines = reader.IsDBNull(3) ? null : reader.GetInt32(3)
            };
        }
        return null;
    }

    // File Changes
    public async Task CreateFileChange(FileChange fileChange)
    {
        using var conn = GetConnection();
        await conn.OpenAsync();

        using var cmd = new NpgsqlCommand(
            "INSERT INTO file_changes (commit_id, file_id, additions, deletions) VALUES (@commitId, @fileId, @additions, @deletions) ON CONFLICT (commit_id, file_id) DO UPDATE SET additions = @additions, deletions = @deletions",
            conn);

        cmd.Parameters.AddWithValue("commitId", fileChange.CommitId);
        cmd.Parameters.AddWithValue("fileId", fileChange.FileId);
        cmd.Parameters.AddWithValue("additions", (object?)fileChange.Additions ?? DBNull.Value);
        cmd.Parameters.AddWithValue("deletions", (object?)fileChange.Deletions ?? DBNull.Value);

        await cmd.ExecuteNonQueryAsync();
    }

    public async Task<List<FileChange>> GetFileChangesByCommit(Guid commitId)
    {
        using var conn = GetConnection();
        await conn.OpenAsync();

        using var cmd = new NpgsqlCommand(
            "SELECT commit_id, file_id, additions, deletions FROM file_changes WHERE commit_id = @commitId",
            conn);

        cmd.Parameters.AddWithValue("commitId", commitId);

        var changes = new List<FileChange>();
        using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            changes.Add(new FileChange
            {
                CommitId = reader.GetGuid(0),
                FileId = reader.GetGuid(1),
                Additions = reader.IsDBNull(2) ? null : reader.GetInt32(2),
                Deletions = reader.IsDBNull(3) ? null : reader.GetInt32(3)
            });
        }
        return changes;
    }

    public async Task<List<FileChange>> GetFileChangesByFile(Guid fileId)
    {
        using var conn = GetConnection();
        await conn.OpenAsync();

        using var cmd = new NpgsqlCommand(
            "SELECT commit_id, file_id, additions, deletions FROM file_changes WHERE file_id = @fileId",
            conn);

        cmd.Parameters.AddWithValue("fileId", fileId);

        var changes = new List<FileChange>();
        using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            changes.Add(new FileChange
            {
                CommitId = reader.GetGuid(0),
                FileId = reader.GetGuid(1),
                Additions = reader.IsDBNull(2) ? null : reader.GetInt32(2),
                Deletions = reader.IsDBNull(3) ? null : reader.GetInt32(3)
            });
        }
        return changes;
    }

    // Embeddings
    public async Task<CodeEmbedding> CreateEmbedding(CodeEmbedding embedding)
    {
        using var conn = GetConnection();
        await conn.OpenAsync();

        using var cmd = new NpgsqlCommand(
            "INSERT INTO code_embeddings (file_id, embedding, chunk_content, created_at) VALUES (@fileId, @embedding::vector, @content, @createdAt) RETURNING id",
            conn);

        cmd.Parameters.AddWithValue("fileId", embedding.FileId);
        cmd.Parameters.AddWithValue("embedding", $"[{string.Join(",", embedding.Embedding!)}]");
        cmd.Parameters.AddWithValue("content", (object?)embedding.ChunkContent ?? DBNull.Value);
        cmd.Parameters.AddWithValue("createdAt", embedding.CreatedAt);

        embedding.Id = (Guid)(await cmd.ExecuteScalarAsync())!;
        return embedding;
    }

    public async Task<List<CodeEmbedding>> GetEmbeddingsByFile(Guid fileId)
    {
        using var conn = GetConnection();
        await conn.OpenAsync();

        using var cmd = new NpgsqlCommand(
            "SELECT id, file_id, embedding::text, chunk_content, created_at FROM code_embeddings WHERE file_id = @fileId",
            conn);

        cmd.Parameters.AddWithValue("fileId", fileId);

        var embeddings = new List<CodeEmbedding>();
        using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            var embeddingStr = reader.GetString(2).Trim('[', ']');
            var embeddingValues = embeddingStr.Split(',').Select(float.Parse).ToArray();

            embeddings.Add(new CodeEmbedding
            {
                Id = reader.GetGuid(0),
                FileId = reader.GetGuid(1),
                Embedding = embeddingValues,
                ChunkContent = reader.IsDBNull(3) ? null : reader.GetString(3),
                CreatedAt = reader.GetDateTime(4)
            });
        }
        return embeddings;
    }

    public async Task<List<(RepositoryFile File, double Similarity)>> FindSimilarFiles(float[] embedding, Guid repositoryId, int limit = 10)
    {
        using var conn = GetConnection();
        await conn.OpenAsync();

        // Use pgvector cosine similarity search
        var embeddingStr = $"[{string.Join(",", embedding)}]";

        using var cmd = new NpgsqlCommand(
            @"SELECT rf.id, rf.repository_id, rf.file_path, rf.total_lines, 
                     (1 - (ce.embedding <=> @embedding::vector)) as similarity
              FROM code_embeddings ce
              JOIN repository_files rf ON ce.file_id = rf.id
              WHERE rf.repository_id = @repoId
              GROUP BY rf.id, rf.repository_id, rf.file_path, rf.total_lines, ce.embedding
              ORDER BY ce.embedding <=> @embedding::vector
              LIMIT @limit",
            conn);

        cmd.Parameters.AddWithValue("embedding", embeddingStr);
        cmd.Parameters.AddWithValue("repoId", repositoryId);
        cmd.Parameters.AddWithValue("limit", limit);

        var results = new List<(RepositoryFile, double)>();
        using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            var file = new RepositoryFile
            {
                Id = reader.GetGuid(0),
                RepositoryId = reader.GetGuid(1),
                FilePath = reader.GetString(2),
                TotalLines = reader.IsDBNull(3) ? null : reader.GetInt32(3)
            };
            var similarity = reader.GetDouble(4);
            results.Add((file, similarity));
        }
        return results;
    }

    // Dependencies
    public async Task CreateDependency(Dependency dependency)
    {
        using var conn = GetConnection();
        await conn.OpenAsync();

        using var cmd = new NpgsqlCommand(
            "INSERT INTO dependencies (source_file_id, target_file_id, dependency_type, strength) VALUES (@sourceId, @targetId, @type, @strength) ON CONFLICT (source_file_id, target_file_id) DO UPDATE SET dependency_type = @type, strength = @strength",
            conn);

        cmd.Parameters.AddWithValue("sourceId", dependency.SourceFileId);
        cmd.Parameters.AddWithValue("targetId", dependency.TargetFileId);
        cmd.Parameters.AddWithValue("type", (object?)dependency.DependencyType ?? DBNull.Value);
        cmd.Parameters.AddWithValue("strength", (object?)dependency.Strength ?? DBNull.Value);

        await cmd.ExecuteNonQueryAsync();
    }

    public async Task<List<Dependency>> GetDependenciesForFile(Guid fileId)
    {
        using var conn = GetConnection();
        await conn.OpenAsync();

        using var cmd = new NpgsqlCommand(
            "SELECT source_file_id, target_file_id, dependency_type, strength FROM dependencies WHERE source_file_id = @fileId",
            conn);

        cmd.Parameters.AddWithValue("fileId", fileId);

        var dependencies = new List<Dependency>();
        using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            dependencies.Add(new Dependency
            {
                SourceFileId = reader.GetGuid(0),
                TargetFileId = reader.GetGuid(1),
                DependencyType = reader.IsDBNull(2) ? null : reader.GetString(2),
                Strength = reader.IsDBNull(3) ? null : reader.GetInt32(3)
            });
        }
        return dependencies;
    }

    public async Task<List<Dependency>> GetDependentsForFile(Guid fileId)
    {
        using var conn = GetConnection();
        await conn.OpenAsync();

        using var cmd = new NpgsqlCommand(
            "SELECT source_file_id, target_file_id, dependency_type, strength FROM dependencies WHERE target_file_id = @fileId",
            conn);

        cmd.Parameters.AddWithValue("fileId", fileId);

        var dependencies = new List<Dependency>();
        using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            dependencies.Add(new Dependency
            {
                SourceFileId = reader.GetGuid(0),
                TargetFileId = reader.GetGuid(1),
                DependencyType = reader.IsDBNull(2) ? null : reader.GetString(2),
                Strength = reader.IsDBNull(3) ? null : reader.GetInt32(3)
            });
        }
        return dependencies;
    }

    // File Ownership
    public async Task UpsertFileOwnership(FileOwnership ownership)
    {
        using var conn = GetConnection();
        await conn.OpenAsync();

        using var cmd = new NpgsqlCommand(
            "INSERT INTO file_ownership (file_id, user_id, semantic_score, last_updated) VALUES (@fileId, @userId, @score, @updated) ON CONFLICT (file_id, user_id) DO UPDATE SET semantic_score = @score, last_updated = @updated",
            conn);

        cmd.Parameters.AddWithValue("fileId", ownership.FileId);
        cmd.Parameters.AddWithValue("userId", ownership.UserId);
        cmd.Parameters.AddWithValue("score", (object?)ownership.SemanticScore ?? DBNull.Value);
        cmd.Parameters.AddWithValue("updated", ownership.LastUpdated);

        await cmd.ExecuteNonQueryAsync();
    }

    public async Task<List<FileOwnership>> GetFileOwnership(Guid fileId)
    {
        using var conn = GetConnection();
        await conn.OpenAsync();

        using var cmd = new NpgsqlCommand(
            "SELECT file_id, user_id, semantic_score, last_updated FROM file_ownership WHERE file_id = @fileId ORDER BY semantic_score DESC",
            conn);

        cmd.Parameters.AddWithValue("fileId", fileId);

        var ownerships = new List<FileOwnership>();
        using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            ownerships.Add(new FileOwnership
            {
                FileId = reader.GetGuid(0),
                UserId = reader.GetGuid(1),
                SemanticScore = reader.IsDBNull(2) ? null : reader.GetDecimal(2),
                LastUpdated = reader.GetDateTime(3)
            });
        }
        return ownerships;
    }

    // Pull Requests
    public async Task<PullRequest?> GetPullRequestByNumber(Guid repositoryId, int prNumber)
    {
        using var conn = GetConnection();
        await conn.OpenAsync();

        using var cmd = new NpgsqlCommand(
            "SELECT id, repository_id, pr_number, state, author_id FROM pull_requests WHERE repository_id = @repoId AND pr_number = @prNumber",
            conn);

        cmd.Parameters.AddWithValue("repoId", repositoryId);
        cmd.Parameters.AddWithValue("prNumber", prNumber);

        using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return new PullRequest
            {
                Id = reader.GetGuid(0),
                RepositoryId = reader.GetGuid(1),
                PrNumber = reader.GetInt32(2),
                State = reader.IsDBNull(3) ? null : reader.GetString(3),
                AuthorId = reader.IsDBNull(4) ? null : reader.GetGuid(4)
            };
        }
        return null;
    }

    public async Task<PullRequest> CreatePullRequest(PullRequest pr)
    {
        using var conn = GetConnection();
        await conn.OpenAsync();

        using var cmd = new NpgsqlCommand(
            "INSERT INTO pull_requests (repository_id, pr_number, state, author_id) VALUES (@repoId, @prNumber, @state, @authorId) RETURNING id",
            conn);

        cmd.Parameters.AddWithValue("repoId", pr.RepositoryId);
        cmd.Parameters.AddWithValue("prNumber", pr.PrNumber);
        cmd.Parameters.AddWithValue("state", (object?)pr.State ?? DBNull.Value);
        cmd.Parameters.AddWithValue("authorId", (object?)pr.AuthorId ?? DBNull.Value);

        pr.Id = (Guid)(await cmd.ExecuteScalarAsync())!;
        return pr;
    }

    public async Task<List<PullRequest>> GetOpenPullRequests(Guid repositoryId)
    {
        using var conn = GetConnection();
        await conn.OpenAsync();

        using var cmd = new NpgsqlCommand(
            "SELECT id, repository_id, pr_number, state, author_id FROM pull_requests WHERE repository_id = @repoId AND state = 'open'",
            conn);

        cmd.Parameters.AddWithValue("repoId", repositoryId);

        var prs = new List<PullRequest>();
        using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            prs.Add(new PullRequest
            {
                Id = reader.GetGuid(0),
                RepositoryId = reader.GetGuid(1),
                PrNumber = reader.GetInt32(2),
                State = reader.IsDBNull(3) ? null : reader.GetString(3),
                AuthorId = reader.IsDBNull(4) ? null : reader.GetGuid(4)
            });
        }
        return prs;
    }

    public async Task<List<PullRequest>> GetAllPullRequests(Guid repositoryId)
    {
        using var conn = GetConnection();
        await conn.OpenAsync();

        using var cmd = new NpgsqlCommand(
            "SELECT id, repository_id, pr_number, state, author_id FROM pull_requests WHERE repository_id = @repoId ORDER BY pr_number DESC",
            conn);

        cmd.Parameters.AddWithValue("repoId", repositoryId);

        var prs = new List<PullRequest>();
        using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            prs.Add(new PullRequest
            {
                Id = reader.GetGuid(0),
                RepositoryId = reader.GetGuid(1),
                PrNumber = reader.GetInt32(2),
                State = reader.IsDBNull(3) ? null : reader.GetString(3),
                AuthorId = reader.IsDBNull(4) ? null : reader.GetGuid(4)
            });
        }
        return prs;
    }

    public async Task UpdatePullRequestState(Guid prId, string state)
    {
        using var conn = GetConnection();
        await conn.OpenAsync();

        using var cmd = new NpgsqlCommand("UPDATE pull_requests SET state = @state WHERE id = @id", conn);
        cmd.Parameters.AddWithValue("state", state);
        cmd.Parameters.AddWithValue("id", prId);

        await cmd.ExecuteNonQueryAsync();
    }

    // PR Files
    public async Task CreatePrFileChanged(PrFileChanged prFile)
    {
        using var conn = GetConnection();
        await conn.OpenAsync();

        using var cmd = new NpgsqlCommand(
            "INSERT INTO pr_files_changed (pr_id, file_id) VALUES (@prId, @fileId) ON CONFLICT (pr_id, file_id) DO NOTHING",
            conn);

        cmd.Parameters.AddWithValue("prId", prFile.PrId);
        cmd.Parameters.AddWithValue("fileId", prFile.FileId);

        await cmd.ExecuteNonQueryAsync();
    }

    public async Task<List<RepositoryFile>> GetPrFiles(Guid prId)
    {
        using var conn = GetConnection();
        await conn.OpenAsync();

        using var cmd = new NpgsqlCommand(
            "SELECT rf.id, rf.repository_id, rf.file_path, rf.total_lines FROM repository_files rf JOIN pr_files_changed pfc ON rf.id = pfc.file_id WHERE pfc.pr_id = @prId",
            conn);

        cmd.Parameters.AddWithValue("prId", prId);

        var files = new List<RepositoryFile>();
        using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            files.Add(new RepositoryFile
            {
                Id = reader.GetGuid(0),
                RepositoryId = reader.GetGuid(1),
                FilePath = reader.GetString(2),
                TotalLines = reader.IsDBNull(3) ? null : reader.GetInt32(3)
            });
        }
        return files;
    }

    // Webhook Queue
    public async Task<long> EnqueueWebhook(string payload)
    {
        using var conn = GetConnection();
        await conn.OpenAsync();

        using var cmd = new NpgsqlCommand(
            "INSERT INTO webhook_queue (payload, status) VALUES (@payload::jsonb, 'pending') RETURNING id",
            conn);

        cmd.Parameters.AddWithValue("payload", payload);

        return (long)(await cmd.ExecuteScalarAsync())!;
    }

    public async Task<WebhookQueueItem?> GetNextPendingWebhook()
    {
        using var conn = GetConnection();
        await conn.OpenAsync();

        using var cmd = new NpgsqlCommand(
            "UPDATE webhook_queue SET status = 'processing' WHERE id = (SELECT id FROM webhook_queue WHERE status = 'pending' ORDER BY id LIMIT 1 FOR UPDATE SKIP LOCKED) RETURNING id, payload, status",
            conn);

        using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return new WebhookQueueItem
            {
                Id = reader.GetInt64(0),
                Payload = reader.GetString(1),
                Status = reader.GetString(2)
            };
        }
        return null;
    }

    public async Task UpdateWebhookStatus(long id, string status)
    {
        using var conn = GetConnection();
        await conn.OpenAsync();

        using var cmd = new NpgsqlCommand("UPDATE webhook_queue SET status = @status WHERE id = @id", conn);
        cmd.Parameters.AddWithValue("status", status);
        cmd.Parameters.AddWithValue("id", id);

        await cmd.ExecuteNonQueryAsync();
    }
}
