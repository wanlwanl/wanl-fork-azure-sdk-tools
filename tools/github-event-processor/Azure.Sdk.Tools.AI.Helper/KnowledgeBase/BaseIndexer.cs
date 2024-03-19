using System.Diagnostics;
using Microsoft.Extensions.Logging;

namespace Azure.Sdk.Tools.AI.Helper.KnowledgeBase;

public abstract class BaseIndexer
{
    protected readonly DocumentIndexer _documentIndexer;
    protected readonly ActivitySource _activitySource;
    public BaseIndexer(SearchConfig searchConfig, OpenAiConfig openAiConfig, string repoName, ILoggerFactory loggerFactory)
    {
        _documentIndexer = new DocumentIndexer(searchConfig, openAiConfig, repoName, loggerFactory?.CreateLogger<DocumentIndexer>());
        _activitySource = new ActivitySource(GetType().FullName ?? throw new ArgumentNullException("GetType().FullName is null"));
    }

    public async Task DeleteIndex()
    {
        await _documentIndexer.DeleteIndex();
    }
}
