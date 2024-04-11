using Azure.AI.OpenAI;
using Newtonsoft.Json;

namespace Azure.Sdk.Tools.AI.Helper;

public class KnownIssueAIBot
{
    private const string Prompt = @"""You are a support bot that replies to user questions or problems.
When user asks a question, you must return the response formatted JSON, don't include anything except JSON response that contains two properties ""solution"" and ""confidenceLevel"".

You should return a known solution and your confidence level on a scale of 10 that measures how relevant the solution is.";

    private readonly string _inferenceModel;
    private readonly OpenAIClient _openAi;
    private readonly AzureChatExtensionsOptions _extOptions;

    public KnownIssueAIBot(OpenAiConfig openAiConfig, SearchConfig searchConfig)
    {
        var endpoint = new Uri(openAiConfig?.Endpoint ?? throw new ArgumentNullException("OpenAI endpoint is null"));
        _openAi = new OpenAIClient(endpoint, new AzureKeyCredential(openAiConfig.Key ?? throw new ArgumentNullException("OpenAI key is null")));
        _extOptions = new()
        {
            Extensions = { GetDataSourceConfiguration(searchConfig, openAiConfig) }
        };
        _inferenceModel = openAiConfig.InferenceModel ?? throw new ArgumentNullException("OpenAI inference model is null");
    }

    public async Task<QueryResponse> GetSuggestionAsync(string issueText, CancellationToken cancellationToken)
    {
        var chatCompletionsOptions = new ChatCompletionsOptions()
        {
            Messages = { new ChatMessage(ChatRole.User, issueText) }
        };
        chatCompletionsOptions.AzureExtensionsOptions = _extOptions;

        var answers = await _openAi.GetChatCompletionsAsync(_inferenceModel, chatCompletionsOptions, cancellationToken);
        return QueryResponse.FromChatMessage(answers.Value.Choices[0].Message);
    }

    private static AzureChatExtensionConfiguration GetDataSourceConfiguration(SearchConfig searchConfig, OpenAiConfig openAiConfig)
    {
        var parameters = new
        {
            embeddingDeploymentName = openAiConfig.EmbeddingModel,
            endpoint = searchConfig.Endpoint,
            fieldsMapping = new
            {
                contentFields = new[] { "Content" },
                vectorFields = new[] { "ContentVector" },
                urlField = "Source",
                titleField = "Title"
            },
            inScope = true,
            indexName = searchConfig.IndexName,
            key = searchConfig.Key,
            queryType = "vector",
            roleInformation = Prompt,
            topNDocuments = 3,
            strictness = 3,
            semanticConfiguration = "default",
        };

        return new AzureChatExtensionConfiguration(AzureChatExtensionType.AzureCognitiveSearch,
            BinaryData.FromString(JsonConvert.SerializeObject(parameters)));
    }
}
