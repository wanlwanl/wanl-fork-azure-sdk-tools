namespace Azure.Sdk.Tools.AI.Helper;

public class OpenAiConfig
{
    public string? Endpoint { get; set; }
    public string? Key { get; set; }
    public string? EmbeddingModel { get; set; }
    public string? InferenceModel { get; set; }

    public OpenAiConfig(string endpoint, string key, string embeddingModel, string inferenceModel)
    {
        Endpoint = endpoint;
        Key = key;
        EmbeddingModel = embeddingModel;
        InferenceModel = inferenceModel;
    }

    public OpenAiConfig()
    {
        // todo: proper config support with IConfiguration
        Endpoint = Environment.GetEnvironmentVariable("OPENAI__ENDPOINT");
        Key = Environment.GetEnvironmentVariable("OPENAI__KEY");
        EmbeddingModel = Environment.GetEnvironmentVariable("OPENAI__EMBEDDINGMODEL");
        InferenceModel = Environment.GetEnvironmentVariable("OPENAI__INFERENCEMODEL");
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
        Endpoint = Environment.GetEnvironmentVariable("SEARCH__ENDPOINT");
        Key = Environment.GetEnvironmentVariable("SEARCH__KEY");
        IndexName = Environment.GetEnvironmentVariable("SEARCH__INDEX");
    }
}

public class CloudMineConfig
{
    public string? Endpoint { get; set; }

    public CloudMineConfig(string endpoint)
    {
        Endpoint = endpoint;
    }

    public CloudMineConfig()
    {
        Endpoint = Environment.GetEnvironmentVariable("CLOUDMINE__ENDPOINT");
    }
}
