using Kusto.Data;
using Kusto.Data.Common;
using Kusto.Data.Net.Client;
using Microsoft.Extensions.Logging;

namespace Azure.Sdk.Tools.AI.Helper.KnowledgeBase;

public class CloudMineIndexer : BaseIndexer
{
    private readonly ICslQueryProvider _kustoClient;
    private readonly ILogger<CloudMineIndexer> _logger;
    public CloudMineIndexer(CloudMineConfig cloudMineConfig, SearchConfig searchConfig, OpenAiConfig openAiConfig, string repoName, ILoggerFactory loggerFactory) :
        base(searchConfig, openAiConfig, repoName, loggerFactory)
    {
        _kustoClient = KustoClientFactory.CreateCslQueryProvider(new KustoConnectionStringBuilder(cloudMineConfig.Endpoint)
            .WithAadAzCliAuthentication(true));
        _logger = loggerFactory.CreateLogger<CloudMineIndexer>();
    }

    public async Task Index(string? language, IndexMode mode)
    {
        using var activity = _activitySource.StartActivity("Index");
        string query = GetQuery(language, mode);

        _logger.LogInformation("executing {query}", query);
        using var reader = await _kustoClient.ExecuteQueryAsync("GitHub", query, new ClientRequestProperties());
        var issues = new List<Issue>();
        while (reader.Read())
        {
            issues.Add(Issue.Read(reader));
        }

        _logger.LogInformation("Indexing: {count}", issues.Count);
        await _documentIndexer.CreateIndexIfNotExists();
        await _documentIndexer.Index(issues);
    }

    private static string GetLabelFilter(IndexMode mode)
    {
        switch (mode)
        {
            case IndexMode.AddressedIssues:
                return "set_has_element(labelset, \"customer-reported\") and set_has_element(labelset, \"issue-addressed\")";
            case IndexMode.ReferenceIssues:
                return "set_has_element(labelset, \"reference-issue\")";
            default:
                return "set_has_element(labelset, \"customer-reported\")";
        }
    }

    private static string GetQuery(string? langauge, IndexMode mode)
    {
        string repo = GetRepo(langauge);

        switch(mode)
        {
            case IndexMode.ReferenceIssues:
                return GetReferenceIssueQuery(repo);
            case IndexMode.AddressedIssues:
            case IndexMode.ClosedIssues:
                return GetClosedOrAddressedIssues(repo, GetLabelFilter(mode));
            default:
                throw new NotImplementedException("Mode not supported");
        }
    }

    private static string GetRepo(string? language)
    {
        if (language == "dotnet")
        {
            return "azure-sdk-for-net";
        }
        else if (language == "java")
        {
            return "azure-sdk-for-java";
        }
        else
        {
            throw new NotImplementedException("language not supported");
        }
    }

    private static string GetClosedOrAddressedIssues(string repo, string labelFilter)
    {
        return $@"
let repo = ""{repo}"";
let issues = Issue 
| where CreatedAt >= ago(365d) and CreatedAt <= ago(10d) and isnotempty(ClosedAt)
| where OrganizationLogin == ""Azure"" and RepositoryName == repo
| project Title, Description = Body, OwnerId, IssueNumber = Number, ClosedAt, Labels, OwnerLogin
| mv-expand labels = parse_json(Labels)
| summarize labelset = make_set(tostring(labels[""name""])) by IssueNumber, ClosedAt, Description, Title, OwnerId, OwnerLogin
| where {labelFilter};
let users = User | project UserId;
let AzureOrgMembers = Member
    | where OrganizationLogin == ""Azure"" // todo: it includes all people who belonged to the org at some point, but might no longer belong to it
    | project MemberId
    | distinct MemberId
    | join kind=innerunique (users)
    on $left.MemberId == $right.UserId;
let comments = IssueComment 
| where  OrganizationLogin == ""Azure"" and RepositoryName == repo
| project Comment = Body, UserId, IssueNumber, CommentTs = CreatedAt
| extend AuthorIsInAzureOrg = UserId in (AzureOrgMembers)
| join kind=inner users on UserId // exclude bots
| project-away UserId1;
issues  
| join kind=inner comments on IssueNumber
| extend reply = bag_pack(""Comment"", Comment, ""User"", UserId, ""Timestamp"", CommentTs, ""AuthorIsInAzureOrg"", AuthorIsInAzureOrg)
| summarize Comments = make_list(reply) by Title, Description, IssueNumber, OwnerId, ClosedAt, OwnerLogin";
    }

    private static string GetReferenceIssueQuery(string repo) { 
        return $@"
let repo = ""{repo}"";
Issue 
| where CreatedAt >= ago(365d) and isnotempty(ClosedAt)
| where OrganizationLogin == ""Azure"" and RepositoryName == repo
| project Title, Description = Body, OwnerId, IssueNumber = Number, ClosedAt, Labels, OwnerLogin
| mv-expand labels = parse_json(Labels)
| summarize labelset = make_set(tostring(labels[""name""])) by IssueNumber, ClosedAt, Description, Title, OwnerId, OwnerLogin
| where set_has_element(labelset, ""reference-issue"")
| project Title, Description, IssueNumber, OwnerId, ClosedAt, OwnerLogin";
    }
}
