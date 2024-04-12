using Azure.Monitor.OpenTelemetry.Exporter;
using Azure.Sdk.Tools.AI.Helper.KnowledgeBase;
using CommandLine;
using Microsoft.Extensions.Azure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using OpenTelemetry.Logs;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
namespace Azure.Sdk.Tools.AI.Helper;

/// <summary>
/// This is a test program that can be used to experiment with bot features.
/// </summary>
internal class Program
{
    private class ConsoleOptions
    {
        [Option('l', "language", HelpText = "Select Azure SDK language (only `dotnet` and `java` are supported")]
        public string? Language { get; set; }

        [Option('c', "command", HelpText = "Select command, one of: `index`, `query`", Required = true)]
        public string? Command { get; set; }

        [Option('m', "mode", HelpText = "Select indexing data subset: one of `Docs`, `ReferenceIssues`, `AddressedIssues`, `ClosedIssues`", Default = IndexMode.ClosedIssues)]
        public IndexMode Mode { get; set; }

        [Option('p', "path", HelpText = "When indexing markdown documents, path to the root - all md files except changelogs, swaggers, contributing will be indexed recursively")]
        public string? Path { get; set; }

        [Option('k', "drop-index", HelpText = "Drop existing index. Defaults to false", Default = false)]
        public bool DropIndex { get; set; }

        [Option('q', "question", HelpText = "Issue description to get bot suggestion for")]
        public string? Question { get; set; }
    }

    public static async Task Main(string[] args)
    {
        var parser = new Parser(settings =>
        {
            settings.CaseSensitive = false;
            settings.HelpWriter = Console.Error;
            settings.IgnoreUnknownArguments = true;
        });

        await parser.ParseArguments<ConsoleOptions>(args).WithParsedAsync(options => Run(options));
    }

    private static async Task Run(ConsoleOptions options)
    {
        var configuration = SetupConfiguration();
        var loggerFactory = SetupLogging(configuration);
        using var tracerProvider = SetupTracing(configuration);

        var openAiConfig = ResolveConfig<OpenAiConfig>("OpenAI", configuration);
        var cloudMineConfig = ResolveConfig<CloudMineConfig>("CloudMine", configuration);
        var searchConfig = ResolveConfig<SearchConfig>("Search", configuration);


        if (options.Command == "query")
        {
            await GetBotSuggestion(searchConfig, openAiConfig, loggerFactory, options);
        }
        else if (options.Command == "index")
        {
            if (options.Mode == IndexMode.Docs)
            {
                await IndexDocs(searchConfig, openAiConfig, loggerFactory, options);
            } 
            else
            {
                await IndexIssues(cloudMineConfig, searchConfig, openAiConfig, loggerFactory, options);
            }
        }
        else
        {
            throw new NotImplementedException("Mode not supported");
        }
    }

    private static async Task IndexIssues(CloudMineConfig cloudMineConfig, SearchConfig searchConfig, OpenAiConfig openAiConfig, ILoggerFactory loggerFactory, ConsoleOptions options)
    {
        var cloudMineIndexer = new CloudMineIndexer(cloudMineConfig, searchConfig, openAiConfig, GetRepoName(options), loggerFactory);
        if (options.DropIndex)
        {
            await cloudMineIndexer.DeleteIndex();
        }
        await cloudMineIndexer.Index(options.Language, options.Mode);
    }

    private static async Task IndexDocs(SearchConfig searchConfig, OpenAiConfig openAiConfig, ILoggerFactory loggerFactory, ConsoleOptions options)
    {
        var mdIndexer = new MarkdownFileIndexer(searchConfig, openAiConfig, GetRepoName(options), loggerFactory);
        if (options.DropIndex)
        {
            await mdIndexer.DeleteIndex();
        }
        await mdIndexer.Index(options.Path);
    }

    private static async Task GetBotSuggestion(SearchConfig searchConfig, OpenAiConfig openAiConfig, ILoggerFactory loggerFactory, ConsoleOptions options)
    {
        var query = options.Question ?? SampleQuery;
        var bot = new KnownIssueAIBot(openAiConfig, searchConfig);
        try
        {
            var suggestion = await bot.GetSuggestionAsync(query, default);
            //if (suggestion.ConfidenceLevel >= 8)
            //{
            Console.WriteLine(suggestion.Solution);
            Console.WriteLine();
            Console.WriteLine($"Related issues and documents:\r\n  - {string.Join("\r\n  - ", suggestion.References)}");
            Console.WriteLine($"<!-- Confidence Level: {suggestion.ConfidenceLevel} -->\r\n");
            //}
        }
        catch (Exception ex)
        {
            loggerFactory.CreateLogger<Program>().LogError(ex, "Failed to get suggestion");
        }
    }

    private static string GetRepoName(ConsoleOptions options)
    {
        if (options.Language == "dotnet") return "azure-sdk-for-net";
        if (options.Language == "java") return "azure-sdk-for-java";
        throw new NotSupportedException("Language is not supported");
    }


    private const string SampleQuery = @"
[BUG] Azure.Security.KeyVault.Secrets GetSecret tries to spawn a child process even though it's a synchronous function. 

### Library name and version

Azure.Security.KeyVault.Secrets

### Describe the bug

When I call the code below as part of a word VSTO App
```csharp
var client = new SecretClient(new Uri($""https://some_keyvault.azure.net/""), new DefaultAzureCredential());
client.GetSecret(""some connection-connection-string"")'
```
It is blocked by my customers IT policy because it is a word child process.
![image](https://github.com/Azure/azure-sdk-for-net/assets/1802579/989a0931-ceec-42b9-bdb5-cf1cbdd42768)


### Expected behavior

for the GetSecret function to not spawn a child process.

### Actual behavior

GetSecret spawns a child process on `_pipeline.SendRequest`

### Reproduction Steps

create a string you want to fetch from a keyvault using a connection string
create a skeleton vsto app.
your `ThisAddIn_Startup` should look like this
```csharp
private void ThisAddIn_Startup(object sender, System.EventArgs e) {
var client = new SecretClient(new Uri($""https://some_keyvault.azure.net/""), new DefaultAzureCredential());
client.GetSecret(""some connection-connection-string"")'
}
```
Run the application.

";
    private static ILoggerFactory SetupLogging(IConfigurationRoot configuration)
    {
        ILoggerFactory loggerFactory = LoggerFactory.Create(b => b
            .AddConfiguration(configuration.GetSection("Logging"))
            .AddOpenTelemetry(o =>
            {
                o.SetResourceBuilder(CreateResource());
                o.IncludeFormattedMessage = false;
                o.IncludeScopes = false;
                o.ParseStateValues = true;
                // can add more exporters, e.g. ApplicationInsights
                o.AddConsoleExporter();
            }));

        AzureEventSourceLogForwarder logForwarder = new AzureEventSourceLogForwarder(loggerFactory);
        logForwarder.Start();

        return loggerFactory;
    }

    private static IConfigurationRoot SetupConfiguration()
    {
        return new ConfigurationBuilder()
            .AddJsonFile("appsettings.json")
            .AddUserSecrets<Program>()
            .Build();
    }

    private static T ResolveConfig<T>(string section, IConfiguration configuration) where T : new()
    {
        var config = new T();
        configuration.GetSection(section).Bind(config);

        return config;
    }

    private static TracerProvider SetupTracing(IConfiguration configuration)
    {
        AppContext.SetSwitch("Azure.Experimental.EnableActivitySource", true);
        string connectionString = configuration.GetSection("AzureMonitor").GetValue<string>("ConnectionString");
        var tpb = OpenTelemetry.Sdk.CreateTracerProviderBuilder()
            .SetResourceBuilder(CreateResource())
            .AddSource("Azure.*");
            //.AddHttpClientInstrumentation();

        if (connectionString == null)
        {
            tpb.AddConsoleExporter();
        } 
        else
        {
            tpb.AddAzureMonitorTraceExporter(o => o.ConnectionString = connectionString);
        }
        
        return tpb.Build()!;
    }

    private static ResourceBuilder CreateResource()
    {
        return ResourceBuilder.CreateEmpty().AddService("ai-bot");
    }
}

