# OpenAI Bot Helper

This project contains a class library with OpenAI support bot primitives.
It also contains a test app to play and test OpenAI bot and bulk-index .NET and Java repos.

## Prerequisites

- .NET 6.0
- Access to [CloudMine](https://eng.ms/docs/products/1es-cloudmine) is needed to index issues in existing repositories
- Resources are specified in the [bot-resources.bicep](./bot-resources.bicep) file
- Make sure to update configuration:
  - via [appsettings.json](./appsettings.json)
  - or provide them as env vars (see [Config.cs](./Configs.cs))
  - you can also setup secrets via Visual Studio: right-click on the project and select "Manage User Secrets". Add `OpenAi:Key`, `Search:Key` and other as JSON properties.

## Usage

Cd into `Azure.Sdk.Tools.AI.Helper` folder.

1. To get suggestion based on indexed data, do

```bash
dotnet run --command query --question <your text>
```

There's a default issue text inside `Program.cs`, so `--question` is optional.

2. To index existing issues (created by customers, closed, marked with `issue-addressed`) in the dotnet repo, do

```bash
dotnet run --command index --language dotnet --mode issues
```

Only `dotnet` and `java` are supported.

3. As a variation, you can index all issues marked with `reference-issue` with

```bash
dotnet run --command index --language java --mode reference-issues
```

4. To index all markdown docs in the path (except CHANGELOG, CONTRIBUTING, swaggers)

```bash
dotnet run --command index --language java --mode docs --path c:\repo\azure-sdk-for-java\sdk
```

> Note: when indexing data, existing index with provided name is deleted first. If you want to preserve the index, pass `--delete_index false`

You can always get cli help with `dotnet run -- -h`

## Troubleshooting

You can configure log level for individual categories via `appsettings.json`.

You can also enable distributed tracing by providing ApplicationInsights connection string in one of the following ways:
- set `"AzureMonitor": {"ConnectionString": ...}` to `appsetting.json`
- set it via `AzureMonitor:ConnectionString` or `AZUREMONITOR__CONNECTIONSTRING` environment variables