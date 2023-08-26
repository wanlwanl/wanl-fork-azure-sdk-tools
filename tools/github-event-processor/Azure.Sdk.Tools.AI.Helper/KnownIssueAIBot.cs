using System.Text;
using Azure.AI.OpenAI;
using Azure.Core;
using Azure.Core.Pipeline;
using Azure.Identity;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json.Serialization;

namespace Azure.Sdk.Tools.AI.Helper;

public class KnownIssueAIBot
{
    private const string OpenAiApiVersion = "2023-06-01-preview";
    private const string Prompt = @"""You are a support bot that replies to user questions or problems. 
You should find similar issues in the data source and if there is a known solution,
you should reply with it and your confidence level on a scale of 10 that measures how relevant the solution is.

Return the response as JSON with the following properties: ""solution"" and ""confidenceLevel""";

    private const string DeploymentName = "gpt-4";
    private static readonly object SystemPrompt = new { role = "system", content = Prompt };
    private readonly HttpPipeline _pipeline;
    private readonly OpenAIClient _openAi;
    private readonly RequestUriBuilder _completionsUri;
    private readonly object[] _dataSources;

    public KnownIssueAIBot(OpenAiConfig openAiConfig, SearchConfig searchConfig)
    {
        var endpoint = new Uri(openAiConfig?.Endpoint ?? throw new ArgumentNullException("OpenAI endpoint is null"));
        _openAi = new OpenAIClient(endpoint,  new DefaultAzureCredential());
        _pipeline = _openAi.Pipeline;
        _dataSources = new[] { GetDataSource(searchConfig) };
        _completionsUri = GetUriBuilder(endpoint);
    }

    public async Task<QueryResponse> GetSuggestionAsync(string issueText, CancellationToken cancellationToken)
    {
        var request = CreateRequest(issueText);
        var message = new HttpMessage(request, _pipeline.ResponseClassifier);

        await _pipeline.SendAsync(message, cancellationToken);
        if (!message.HasResponse)
        {
            throw new Exception("did not receive response");
        }

        var responseMessage = message.Response.Content.ToString();
        return DeserializeResponse(responseMessage);
    }

    private QueryResponse DeserializeResponse(string response)
    {
        var responseObj = JObject.Parse(response);
        if (!responseObj.ContainsKey("choices") || responseObj["choices"] == null)
        {
            throw new ArgumentException("response does not contain `choices` property");
        }

        var choices = responseObj["choices"]!.ToObject<List<ChatCompletionChoice>>();
        if (!choices!.Any())
        {
            throw new ArgumentException("`choices` property is empty");
        }

        var messages = choices![0].Messages;
        if (messages == null || !choices!.Any())
        {
            throw new ArgumentException("`messages` property is empty");
        }

        var responseMessage = ParseResponseMessage(messages.Where(m => m.Role == "assistant").FirstOrDefault()?.Content);
        var citations = ParseCitations(messages.Where(m => m.Role == "tool").FirstOrDefault()?.Content);

        return new QueryResponse(responseMessage.Solution, responseMessage.ConfidenceLevel, citations.Select(c => new Reference(c.Title.Trim('#', ' '), c.Url)));
    }

    private ResponseMessage ParseResponseMessage(string? responseMessage)
    {
        if (responseMessage == null)
        {
            throw new ArgumentException("There is no message from assitant in the response");
        }

        return JsonConvert.DeserializeObject<ResponseMessage>(responseMessage) ?? throw new ArgumentException("Failed to deserialize response message");
    }

    private List<Citation> ParseCitations(string? citationsStr)
    {
        if (citationsStr == null)
        {
            throw new ArgumentException("There is no message from the tool in the response");
        }

        var citations = JObject.Parse(citationsStr)?["citations"]?.ToObject<List<Citation>>();
        return citations ?? throw new ArgumentException("There are no citations in the response");
    }

    private Request CreateRequest(string message)
    {
        var content = new
        {
            dataSources = _dataSources,
            messages = new[] { SystemPrompt, new { role = "user", content = message } },
            deployment = DeploymentName,
            temperature = 0,
            top_p = 0.9,
            max_tokens = 800,
            stream = false,
            n = 1
        };

        var jsonContent = JsonConvert.SerializeObject(content);
        var request = _pipeline.CreateRequest();
        request.Uri = _completionsUri;
        request.Method = RequestMethod.Post;
        request.Content = RequestContent.Create(jsonContent);
        request.Headers.Add("Content-Type", "application/json");

        return request;
    }

    private static RequestUriBuilder GetUriBuilder(Uri endpoint)
    {
        var uri = new RequestUriBuilder();
        uri.Reset(endpoint);
        uri.AppendPath("/openai", false);
        uri.AppendPath("/deployments/", false);
        uri.AppendPath(DeploymentName, true);
        uri.AppendPath("/extensions/chat/completions", false);
        uri.AppendQuery("api-version", OpenAiApiVersion, true);

        return uri;
    }

    private static object GetDataSource(SearchConfig searchConfig)
    {
        return new
        {
            type = "AzureCognitiveSearch",
            parameters = new
            {
                endpoint = searchConfig.Endpoint,
                key = searchConfig.Key,
                indexName = searchConfig.IndexName,
                semanticConfiguration = "",
                queryType = "simple",
                fieldsMapping = new
                {
                    contentFieldsSeparator = "\n",
                    contentFields = new[] { "FullContent" },
                    filepathField = "Title",
                    titleField = "Title",
                    urlField = "Url"
                },
                inScope = true,
                roleInformation = Prompt
            }
        };
    }

    public class QueryResponse
    {
        internal QueryResponse(string solution, int confidendeLevel, IEnumerable<Reference> references)
        {
            var refList = new List<Reference>(references);
            for (int i = 1; i <= refList.Count; i ++)
            {
                var marker = string.Concat("[doc", i, "]");
                if (solution.Contains(marker))
                {
                    solution = solution.Replace(marker, $"(refer to {refList[i - 1]})");
                }
            }
            Solution = solution;
            ConfidenceLevel = confidendeLevel;
            References = references;
        }

        public string Solution { get; }
        public int ConfidenceLevel { get; set; }
        public IEnumerable<Reference> References { get; set; }

        public string ToComment(string author)
        {
            var disclaimer = $"Hi @{author}, thank you reporting this issue!" + @" 

> **Note**
> **This response is generated with Azure OpenAI service and is based on similar issues in this repository.**
If this suggestion addressed your problem or question, please close the issue, otherwise, a human will be here shortly.";

            var comment = new StringBuilder(disclaimer)
                .AppendLine()
                .AppendLine()
                .AppendLine(Solution)
                .AppendLine()
                .AppendLine("Related issues and documents:");

            foreach (var reference in References)
            {
                comment.Append("  - ").AppendLine(reference.ToString());
            }

            comment.AppendLine($"<!-- Confidence Level: {ConfidenceLevel} -->\r\n");

            return comment.ToString();
        }
    }

    public class Reference
    {
        internal Reference(string title, string url)
        {
            Title = title;
            Url = url;
        }

        public string Title { get; }

        public string Url { get; }

        public override string ToString()
        {
            return $"[{Title}]({Url})";
        }
    }

    private class ResponseMessage
    {
        [JsonProperty("solution")]
        public string? Solution { get; set; }

        [JsonProperty("confidenceLevel")]
        public int ConfidenceLevel { get; set; }
    }

    private class Citation
    {
        [JsonProperty("content")]
        public string? Content { get; set; }

        [JsonProperty("title")]
        public string? Title { get; set; }

        [JsonProperty("url")]
        public string? Url { get; set; }
    }

    private class ChatCompletionChoice
    {
        [JsonProperty("index")]
        public int Index { get; set; }

        [JsonProperty("messages")]
        public List<ChatCompletionMessage>? Messages { get; set; }
    }

    private class ChatCompletionMessage
    {
        [JsonProperty("index")]
        public int Index { get; set; }

        [JsonProperty("role")]
        public string? Role { get; set; }

        [JsonProperty("content")]
        public string? Content { get; set; }

        [JsonProperty("end_turn")]
        public bool EndTurn { get; set; }
    }
}
