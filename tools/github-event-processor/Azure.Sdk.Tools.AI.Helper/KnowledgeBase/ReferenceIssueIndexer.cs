using Microsoft.Extensions.Logging;

namespace Azure.Sdk.Tools.AI.Helper.KnowledgeBase;

public class ReferenceIssueIndexer : BaseIndexer
{
    public ReferenceIssueIndexer(SearchConfig searchConfig, OpenAiConfig openAiConfig, string repoName, ILoggerFactory loggerFactory) : base(searchConfig, openAiConfig, repoName, loggerFactory)
    {
    }

    public async Task Index(Issue issue)
    {
        using var activity = _activitySource.StartActivity("Index");
        await _documentIndexer.CreateIndexIfNotExists();
        await _documentIndexer.Index(new[] { issue });
    }
}
