using System;
using System.Threading.Tasks;
using Azure.Sdk.Tools.PipelineWitness.Configuration;
using Azure.Sdk.Tools.PipelineWitness.Services;
using Azure.Storage.Blobs;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Microsoft.TeamFoundation.Build.WebApi;
using Microsoft.VisualStudio.Services.Account;
using Microsoft.VisualStudio.Services.Common;
using Microsoft.VisualStudio.Services.TestResults.WebApi;
using Microsoft.VisualStudio.Services.WebApi;
using Xunit;

namespace Azure.Sdk.Tools.PipelineWitness.Tests
{
    public class BlobUploadProcessorIntegrationTests
    {
        private VssCredentials VisualStudioCredentials;
        private VssConnection VisualStudioConnection;
        private string TARGET_ACCOUNT_ID = "azure-sdk";
        private Guid TARGET_PROJECT_ID = new Guid("29ec6040-b234-4e31-b139-33dc4287b756");
        private int TARGET_BUILD_ID = 3297647; //https://dev.azure.com/azure-sdk/public/_build/results?buildId=3297647&view=results
        private string DEVOPS_PATH = "https://dev.azure.com/azure-sdk";
        private PipelineWitnessSettings TestSettings = new PipelineWitnessSettings()
        {
            PipelineOwnersDefinitionId = 5112,
                PipelineOwnersFilePath = "pipelineOwners/pipelineOwners.json",
                PipelineOwnersArtifactName = "pipelineOwners"
            };


        public BlobUploadProcessorIntegrationTests()
        {
            var pat = Environment.GetEnvironmentVariable("AZURESDK_DEVOPS_TOKEN");
            var blobUri = Environment.GetEnvironmentVariable("AZURESDK_BLOB_CS");

            if (!string.IsNullOrWhiteSpace(pat) && !string.IsNullOrWhiteSpace(blobUri) )
            {
                VisualStudioCredentials = new VssBasicCredential("nobody", pat);
                VisualStudioConnection = new VssConnection(new Uri(DEVOPS_PATH), VisualStudioCredentials);
            }
        }

        [EnvironmentConditionalSkipFact]
        public async Task BasicBlobProcessInvokesSuccessfully()
        {
            var buildLogProvider = new BuildLogProvider(logger: null, VisualStudioConnection);
            var blobServiceClient = new BlobServiceClient(Environment.GetEnvironmentVariable("AZURESDK_BLOB_CS"));
            var buildHttpClient = VisualStudioConnection.GetClient<BuildHttpClient>();
            var testResultsBuiltClient = VisualStudioConnection.GetClient<TestResultsHttpClient>();

            BlobUploadProcessor processor = new BlobUploadProcessor(logger: new NullLogger<BlobUploadProcessor>(),
                logProvider: buildLogProvider,
                blobServiceClient: blobServiceClient,
                buildClient: buildHttpClient,
                testResultsClient: testResultsBuiltClient,
                options: Options.Create<PipelineWitnessSettings>(TestSettings),
                failureAnalyzer: new PassThroughFailureAnalyzer());

            await processor.UploadBuildBlobsAsync(TARGET_ACCOUNT_ID, TARGET_PROJECT_ID, TARGET_BUILD_ID);
        }
    }
}