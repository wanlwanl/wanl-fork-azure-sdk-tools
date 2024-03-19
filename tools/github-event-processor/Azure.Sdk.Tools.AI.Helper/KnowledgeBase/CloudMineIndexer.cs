using Kusto.Data;
using Kusto.Data.Common;
using Kusto.Data.Net.Client;
using Microsoft.Extensions.Logging;

namespace Azure.Sdk.Tools.AI.Helper.KnowledgeBase;

public class CloudMineIndexer : BaseIndexer
{
    private readonly ICslQueryProvider _kustoClient;
    public CloudMineIndexer(CloudMineConfig cloudMineConfig, SearchConfig searchConfig, OpenAiConfig openAiConfig, ILoggerFactory loggerFactory) : base(searchConfig, openAiConfig, loggerFactory)
    {
        _kustoClient = KustoClientFactory.CreateCslQueryProvider(new KustoConnectionStringBuilder(cloudMineConfig.Endpoint)
            .WithAadAzCliAuthentication(true));
    }

    public async Task Index(string? language, string? mode)
    {
        using var activity = _activitySource.StartActivity("Index");
        string query = GetQuery(language, mode);
        using var reader = await _kustoClient.ExecuteQueryAsync("GitHub", query, new ClientRequestProperties());
        var issues = new List<Issue>();
        while (reader.Read())
        {
            issues.Add(Issue.Read(reader));
        }

        await _documentIndexer.CreateIndexIfNotExists();
        await _documentIndexer.Index(issues);
    }

    private static string GetQuery(string? langauge, string? mode)
    {
        string repo;
        string labelFilter = "";

        if (langauge == "dotnet")
        {
            repo = "azure-sdk-for-net";
        }
        else if (langauge == "java")
        {
            repo = "azure-sdk-for-java";
        }
        else
        {
            throw new NotImplementedException("Language not supported");
        }

        if (mode == "reference-issue")
        {
            labelFilter = " and set_has_element(labelset, \"reference-issue\")";
        }
        else if (langauge == "dotnet")
        {
            labelFilter = " and set_has_element(labelset, \"issue-addressed\")";
        }

        return $@"
let repo = ""{repo}"";
let issues = Issue 
| where CreatedAt >= ago(365d) and CreatedAt <= ago(10d) and isnotempty(ClosedAt)
| where OrganizationLogin == ""Azure"" and RepositoryName == repo
| project Title, Description = Body, OwnerId, IssueNumber = Number, ClosedAt, Labels, OwnerLogin
| mv-expand labels = parse_json(Labels)
| summarize labelset = make_set(tostring(labels[""name""])) by IssueNumber, ClosedAt, Description, Title, OwnerId, OwnerLogin
| where set_has_element(labelset, ""customer-reported""){labelFilter};
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
}
