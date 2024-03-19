using Azure.AI.OpenAI;
using Azure.Search.Documents;
using Azure.Search.Documents.Indexes;
using Azure.Search.Documents.Indexes.Models;
using Microsoft.Extensions.Logging;
using System.Text;

namespace Azure.Sdk.Tools.AI.Helper.KnowledgeBase;

public class DocumentIndexer
{
    private readonly SearchIndexClient _indexClient;
    private readonly SearchClient _searchClient;
    private readonly OpenAIClient _openAi;
    private readonly ILogger<DocumentIndexer>? _logger;
    private readonly string _indexName;
    private readonly string _embeddingsModel;

    public DocumentIndexer(SearchConfig searchConfig, OpenAiConfig openAiConfig, ILogger<DocumentIndexer>? logger)
    {
        _indexName = searchConfig.IndexName
            ?? throw new ArgumentNullException("IndexName");

        _logger = logger;

        var endpointUrl = new Uri(searchConfig.Endpoint ?? throw new ArgumentNullException("Endpoint"));

        var searchOption = new SearchClientOptions();
        searchOption.Diagnostics.IsLoggingContentEnabled = true;
        _indexClient = new SearchIndexClient(endpointUrl, new AzureKeyCredential(searchConfig.Key ?? throw new ArgumentNullException("Key")), searchOption);
        _searchClient = _indexClient.GetSearchClient(_indexName);

        var openAiEndpoint = new Uri(openAiConfig?.Endpoint ?? throw new ArgumentNullException("OpenAI Endpoint is null"));
        _openAi = new OpenAIClient(openAiEndpoint, new AzureKeyCredential(openAiConfig.Key ?? throw new ArgumentNullException("OpenAI key is null")));
        _embeddingsModel = openAiConfig?.EmbeddingModel ?? throw new ArgumentNullException("OpenAI EmbeddingsModel is null");
    }

    public async Task CreateIndexIfNotExists()
    {
        // GetIndex(name) throws if there is no index
        await foreach(var indexName in _indexClient.GetIndexNamesAsync())
        {
            if (indexName == _indexName) {
                return;
            }
        }

        await CreateIndex();
    }

    public async Task CreateIndex()
    {
        string vectorSearchConfigName = "my-vector-config";
        var index = new SearchIndex(_indexName)
        {
           Fields =
           {
                new SimpleField("Id", SearchFieldDataType.String) { IsKey = true, IsFilterable = true },
                new SearchableField("Content") { IsFilterable = true },
                new SearchField("ContentVector", SearchFieldDataType.Collection(SearchFieldDataType.Single))
                {
                    IsSearchable = true,
                    VectorSearchDimensions = 1536,
                    VectorSearchConfiguration = vectorSearchConfigName
                },
                new SearchableField("Source") { IsFilterable = true, IsSortable = true, IsFacetable = true},
                new SearchableField("Title") { IsFilterable = true, IsSortable = true, IsFacetable = true},
           },
           VectorSearch = new()
           {
               AlgorithmConfigurations =
               {
                   new HnswVectorSearchAlgorithmConfiguration(vectorSearchConfigName)
               }
           }
        };

        await _indexClient.CreateIndexAsync(index);
    }

    public async Task DeleteIndex()
    {
        await _indexClient.DeleteIndexAsync(_indexName);
    }

    public async Task Index(IEnumerable<Issue> issues)
    {
        var documents = issues
            .Select(async i => await DocumentsFromIssue(i))
            .Select(t => t.Result)
            .Where(d => d != null)
            .Cast<Document>();

        using SearchIndexingBufferedSender<Document> sender = new(_searchClient);
        await sender.MergeOrUploadDocumentsAsync(documents);
    }

    public async Task Index(IEnumerable<string> mdFiles, string azSdkRepoPath)
    {
        var documents = mdFiles
            .Select(async f => await FromMdFile(f, Path.GetRelativePath(azSdkRepoPath, f)))
            .Select(t => t.Result)
            .Where(d => d != null)
            .Cast<Document>();

        using SearchIndexingBufferedSender<Document> sender = new(_searchClient);
        await sender.MergeOrUploadDocumentsAsync(documents);
    }

    private async Task<IReadOnlyList<float>> Vectorize(string text)
    {
        var embeddings = await _openAi.GetEmbeddingsAsync(_embeddingsModel, new EmbeddingsOptions(text));

        return embeddings.Value.Data[0].Embedding;
    }

    private async Task<Document?> DocumentsFromIssue(Issue issue)
    {
        var content = Document.GetFullContent(issue);

        if (content.Length > 8000)
        {
            _logger?.LogWarning("Issue {issue} content length is too long - {length}", issue.IssueNumber, content.Length);
            Console.WriteLine($"Issue {issue.IssueNumber} content length is too long - {content.Length}");
            return null;
        }
        return new Document()
        {
            Id = string.Concat(Document.RepoName, "_", issue.IssueNumber),
            Source = string.Concat(Document.RepoUrl, "issues/", issue.IssueNumber),
            Title = issue.Title,
            Content = content,
            ContentVector = await Vectorize(content)
        };
    }

    public async Task<Document?> FromMdFile(string absolutePath, string relativePath)
    {
        var text = File.ReadAllText(absolutePath);
        var firstLineEnd = text.Trim().IndexOfAny(Document.EndOfLine);

        if (firstLineEnd <= 0)
        {
            return null;
        }

        var firstLine = text[..firstLineEnd];

        if (text.Length > 8000)
        {
            _logger?.LogWarning("Document {path} content length is too long - {length}", absolutePath, text.Length);
            return null;
        }

        return new Document()
        {
            Id = string.Concat(Document.RepoName, "_", Document.GetId(relativePath)),
            Source = string.Concat(Document.RepoUrl, "tree/main/", relativePath),
            Title = firstLine,
            Content = text,
            ContentVector = await Vectorize(text)
        };
    }

    public class Document
    {
        internal const string Separator = "\n~~~END~~~\n";
        internal const string RepoName = "azure-sdk-for-net"; //TODO
        internal static readonly string RepoUrl = $"https://github.com/Azure/{RepoName}/";
        internal static readonly char[] EndOfLine = new[] { '\n', '\r' };

        internal static string GetId(string url)
        {
            // todo optimize
            var sb = new StringBuilder(url.Length);
            for (int i = 0; i < url.Length; i ++)
            {
                if ((url[i] >= 'a' && url[i] <= 'z')
                    || (url[i] >= 'A' && url[i] <= 'Z')
                    || (url[i] >= '0' && url[i] <= '9')
                    || url[i] == '-')
                {
                    sb.Append(url[i]);
                }
                else
                {
                    sb.Append('_');
                }
            }

            return sb.ToString();
        }
        public string? Id { get; set; }

        public string? Source { get; set; }
        public string? Title { get; set; }

        public string? Content { get; set; }

        public IReadOnlyList<float>? ContentVector { get; set; }

        internal static string GetFullContent(Issue issue)
        {
            string description = issue.Description ?? throw new ArgumentException("issue description is null");
            int envStart = description.IndexOf("### Environment");
            if (envStart > 0)
            {
                description = description.Substring(0, envStart);
            }

            var content = new StringBuilder()
                .AppendLine(issue.Title)
                .AppendFormat("Customer: {0} ", description.Trim())
                .Append(Separator);

            foreach (IssueComment comment in issue.Comments!)
            {
                if (comment.AuthorIsInAzureOrg == true)
                {
                    content.Append("Agent: ");
                }
                else
                {
                    content.Append("Customer: ");
                }

                content.Append(comment.Comment?.Trim()).Append(Separator);
            }

            return content.ToString();
        }
    }
}
