using System.Text;
using Azure.AI.OpenAI;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Azure.Sdk.Tools.AI.Helper;

public class QueryResponse
{
    internal QueryResponse(string solution, double confidenceLevel, IEnumerable<Reference> references)
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
        ConfidenceLevel = confidenceLevel;
        References = references;
    }

    public string Solution { get; }
    public double ConfidenceLevel { get; set; }
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

    internal static QueryResponse FromChatMessage(ChatMessage message)
    {
        var responseMessage = ResponseMessage.FromString(message.Content);
        var citations = Citation.FromString(message.AzureExtensionsContext.Messages[0].Content);

        return new QueryResponse(responseMessage.Solution!, responseMessage.ConfidenceLevel, citations.Select(c => new Reference(c.Title?.Trim('#', ' '), c.Url)));
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

    internal class ResponseMessage
    {
        [JsonProperty("solution")]
        public string? Solution { get; set; }

        [JsonProperty("confidenceLevel")]
        public double ConfidenceLevel { get; set; }

        internal static ResponseMessage FromString(string? responseMessage)
        {
            if (responseMessage == null)
            {
                throw new ArgumentException("There is no message from assitant in the response");
            }

            if (responseMessage.StartsWith("{"))
            {
                return JsonConvert.DeserializeObject<ResponseMessage>(responseMessage) ?? throw new ArgumentException("Failed to deserialize response message");
            }

            return new ResponseMessage() { Solution = responseMessage, ConfidenceLevel = -1 };
        }
    }

    internal class Citation
    {
        [JsonProperty("content")]
        public string? Content { get; set; }

        [JsonProperty("title")]
        public string? Title { get; set; }

        [JsonProperty("url")]
        public string? Url { get; set; }

        internal static List<Citation> FromString(string? citationsStr)
        {
            if (citationsStr == null)
            {
                throw new ArgumentException("There is no message from the tool in the response");
            }

            var citations = JObject.Parse(citationsStr)?["citations"]?.ToObject<List<Citation>>();
            return citations ?? throw new ArgumentException("There are no citations in the response");
        }
    }

    private class ChatCompletionChoice
    {
        [JsonProperty("index")]
        public int Index { get; set; }

        [JsonProperty("messages")]
        public List<ChatCompletionMessage>? Messages { get; set; }
    }

    internal class ChatCompletionMessage
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

