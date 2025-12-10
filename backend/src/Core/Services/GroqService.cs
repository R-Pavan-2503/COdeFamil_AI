using System.Text;
using System.Text.Json;
using CodeFamily.Api.Core.Interfaces;
using CodeFamily.Api.Core.Models;
using Microsoft.Extensions.Options;

namespace CodeFamily.Api.Core.Services;

public class GroqService : IGroqService
{
    private readonly HttpClient _httpClient;
    private readonly GroqSettings _settings;
    private readonly ILogger<GroqService> _logger;

    public GroqService(
        IHttpClientFactory httpClientFactory,
        IOptions<AppSettings> appSettings,
        ILogger<GroqService> logger)
    {
        _httpClient = httpClientFactory.CreateClient();
        _settings = appSettings.Value.Groq;
        _logger = logger;
    }

    public async Task<(bool success, string? summary, string? error)> GenerateFileSummaryAsync(List<string> codeChunks)
    {
        try
        {
            if (codeChunks == null || !codeChunks.Any())
            {
                return (false, null, "No code chunks provided");
            }

            // Combine all chunks with separators
            var chunksText = string.Join("\n\n---\n\n", codeChunks);

            // Create intelligent prompt that handles mismatched/fragmented chunks
            var prompt = $@"You are a senior software architect analyzing code chunks from a single file.

IMPORTANT: The code chunks below may be:
- Out of chronological order
- Fragmented or incomplete
- Missing context (imports, comments, etc.)

Your task:
1. Identify the overall purpose of this file
2. Understand what problem it solves
3. Recognize key patterns and responsibilities
4. Provide a concise 2-5 line summary

Focus on:
✓ What this file DOES (not how)
✓ Its role in the codebase
✓ Main functionality or exports
✗ Do not list every function
✗ Do not mention that chunks are fragmented

Code Chunks:
---
{chunksText}
---

Summary (2-5 lines):";

            // Prepare API request
            var requestBody = new
            {
                model = _settings.Model,
                messages = new[]
                {
                    new
                    {
                        role = "user",
                        content = prompt
                    }
                },
                max_tokens = _settings.MaxTokens,
                temperature = _settings.Temperature
            };

            var jsonContent = JsonSerializer.Serialize(requestBody);
            var httpContent = new StringContent(jsonContent, Encoding.UTF8, "application/json");

            // Add authorization header
            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_settings.ApiKey}");

            // Call Groq API
            _logger.LogInformation("Calling Groq API to generate file summary...");
            var response = await _httpClient.PostAsync(_settings.ApiUrl, httpContent);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError($"Groq API error: {response.StatusCode} - {errorContent}");

                if (response.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
                {
                    return (false, null, "Too many requests. Please try again later.");
                }

                return (false, null, "Service temporarily unavailable");
            }

            // Parse response
            var responseContent = await response.Content.ReadAsStringAsync();
            var responseJson = JsonSerializer.Deserialize<JsonElement>(responseContent);

            var summary = responseJson
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();

            if (string.IsNullOrWhiteSpace(summary))
            {
                return (false, null, "Failed to generate summary");
            }

            _logger.LogInformation("Successfully generated file summary");
            return (true, summary.Trim(), null);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError($"Network error calling Groq API: {ex.Message}");
            return (false, null, "Network error. Please check your connection.");
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error generating file summary: {ex.Message}");
            return (false, null, "An unexpected error occurred");
        }
    }
}
