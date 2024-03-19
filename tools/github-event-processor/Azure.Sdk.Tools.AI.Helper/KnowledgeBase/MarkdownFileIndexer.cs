using Microsoft.Extensions.Logging;

namespace Azure.Sdk.Tools.AI.Helper.KnowledgeBase;

public class MarkdownFileIndexer : BaseIndexer
{
    public MarkdownFileIndexer(SearchConfig searchConfig, OpenAiConfig openAiConfig, ILoggerFactory loggerFactory) : base(searchConfig, openAiConfig, loggerFactory)
    {
    }

    public async Task Index(string? path)
    {
        if (path == null)
        {
            throw new ArgumentNullException(nameof(path));
        }

        using var activity = _activitySource.StartActivity("Index");
        var mdFiles = Directory.EnumerateFiles(path, "*.md", SearchOption.AllDirectories);
        var documents = mdFiles
            .Where(file => !file.Contains("changelog", StringComparison.OrdinalIgnoreCase) &&
                           !file.Contains("swagger", StringComparison.OrdinalIgnoreCase) &&
                           !file.Contains("contributing", StringComparison.OrdinalIgnoreCase));

        await _documentIndexer.CreateIndexIfNotExists();
        await _documentIndexer.Index(documents, path);
    }
}
