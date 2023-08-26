namespace Azure.Sdk.Tools.AI.Helper;

public class OpenAiConfig
{
    public string? Endpoint { get; set; }

    public OpenAiConfig(string endpoint)
    {
        Endpoint = endpoint;
    }

    public OpenAiConfig()
    {
        Endpoint = Environment.GetEnvironmentVariable("AIHELPER__OPENAI__ENDPOINT") ?? throw new ArgumentNullException("OpenAI endpoint is not provided");
    }
}

public class SearchConfig
{
    public string? Endpoint { get; set; }
    public string? Key { get; set; }
    public string? IndexName { get; set; }

    public SearchConfig(string endpoint, string key, string indexName)
    {
        Endpoint = endpoint;
        Key = key;
        IndexName = indexName;
    }

    public SearchConfig()
    {
        Endpoint = Environment.GetEnvironmentVariable("AIHELPER__SEARCH__ENDPOINT") ?? throw new ArgumentNullException("Search endpoint is not provided");
        Key = Environment.GetEnvironmentVariable("AIHELPER__SEARCH__KEY") ?? throw new ArgumentNullException("Search key is not provided");
        IndexName = Environment.GetEnvironmentVariable("AIHELPER__SEARCH__INDEX") ?? throw new ArgumentNullException("Search index is not provided");
    }
}
