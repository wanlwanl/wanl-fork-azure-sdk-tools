using Newtonsoft.Json;
using System.Data;

namespace Azure.Sdk.Tools.AI.Helper.KnowledgeBase;

public class Issue
{
    public long? IssueNumber { get; set; }
    public string? Description { get; set; }
    public string? Title { get; set; }
    public long? OwnerId { get; set; }
    public string? OwnerLogin { get; set; }
    public bool? IsAddressed { get; set; }
    public DateTime? ClosedAt { get; set; }
    public IEnumerable<IssueComment>? Comments { get; set; }

    public bool TrySetField(string name, object value)
    {
        if (name == nameof(OwnerId)) OwnerId = value as long?;
        else if (name == nameof(OwnerLogin)) OwnerLogin = value as string;
        else if (name == nameof(IssueNumber)) IssueNumber = value as long?;
        else if (name == nameof(Title)) Title = value as string;
        else if (name == nameof(Description)) Description = value as string;
        else if (name == nameof(ClosedAt)) ClosedAt = value as DateTime?;
        else if (name == nameof(IsAddressed)) IsAddressed = value is sbyte i && i > 0;
        else if (name == nameof(Comments)) Comments = JsonConvert.DeserializeObject<IEnumerable<IssueComment>>(JsonConvert.SerializeObject(value));
        else
        {
            Console.WriteLine($"could not parse, unknown field '{name}'");
            return false;
        }

        // Console.WriteLine($"parsed '{name}'='{value}'");
        return true;
    }

    public static Issue Read(IDataReader reader)
    {
        var issue = new Issue();
        for (int i = 0; i < reader.FieldCount; i++)
        {
            issue.TrySetField(reader.GetName(i), reader.GetValue(i));
        }

        if (issue.Comments == null)
        {
            issue.Comments = Enumerable.Empty<IssueComment>();
        } 
        else
        {
            issue.Comments = issue.Comments
                .Where(comment => comment.Timestamp <= issue.ClosedAt)
                .OrderBy(comment => comment.Timestamp);
        }

        return issue;
    }
}

public class IssueComment
{
    public DateTime? Timestamp { get; set; }
    public string? Comment { get; set; }
    public long? User { get; set; }
    public bool? AuthorIsInAzureOrg { get; set; }
}
