using System.Collections.Generic;
using System.Threading.Tasks;
using APIViewWeb;
using APIViewWeb.Repositories;
using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Configuration;
using Xunit;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc.ViewEngines;
using System.IO;
using System;
using System.IO.Pipes;
using Microsoft.VisualStudio.Services.UserMapping;
using APIView.Identity;
using SendGrid;
using SendGrid.Helpers.Mail;
using System.Threading;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using static Microsoft.VisualStudio.Services.Graph.Constants;
using Microsoft.Azure.Cosmos.Serialization.HybridRow;
using System.Linq;

namespace APIViewIntegrationTests
{
    public class ReviewManagerTests : IDisposable
    {
        ReviewManager reviewManager;
        FileStream fileStreamA;
        FileStream fileStreamB;
        ClaimsPrincipal user;

        string fileNameA = "TokenFileWithSectionsRevision1.json";
        string fileNameB = "TokenFileWithSectionsRevision2.json";

        public ReviewManagerTests()
        {

            var config = new ConfigurationBuilder()
                .AddJsonFile("config.json")
                .Build();

            var services = new ServiceCollection();
            services.AddSingleton<IConfiguration>(config);
            services.AddMemoryCache();
            services.AddSingleton<PackageNameManager>();
            services.AddSingleton<LanguageService, JsonLanguageService>();
            services.AddSingleton<LanguageService, CSharpLanguageService>();
            services.AddSingleton<LanguageService, CLanguageService>();
            services.AddSingleton<LanguageService, JavaLanguageService>();
            services.AddSingleton<LanguageService, PythonLanguageService>();
            services.AddSingleton<LanguageService, JavaScriptLanguageService>();
            services.AddSingleton<LanguageService, CppLanguageService>();
            services.AddSingleton<LanguageService, GoLanguageService>();
            services.AddSingleton<LanguageService, ProtocolLanguageService>();
            services.AddSingleton<LanguageService, SwaggerLanguageService>();
            services.AddSingleton<LanguageService, SwiftLanguageService>();
            services.AddSingleton<LanguageService, XmlLanguageService>();
            var serviceProvider = services.BuildServiceProvider();
            var memoryCache = serviceProvider.GetService<IMemoryCache>();
            var langusgeServices = serviceProvider.GetServices<LanguageService>();
            var packageManager = serviceProvider.GetService<PackageNameManager>();

            CosmosClient cosmosClient = new CosmosClient(config["CosmosEmulatorConnectionString"]);
            CosmosReviewRepository cosmosReviewRepository = new CosmosReviewRepository(null, cosmosClient);
            CosmosCommentsRepository cosmosCommentsRepository = new CosmosCommentsRepository(null, cosmosClient);
            BlobContainerClient blobCodeFileContainerClient = new BlobContainerClient(config["AzuriteBlobConnectionString"], "codefiles");
            BlobContainerClient blobOriginalContainerClient = new BlobContainerClient(config["AzuriteBlobConnectionString"], "originals");
            BlobCodeFileRepository blobCodeFileRepository = new BlobCodeFileRepository(null, memoryCache, blobCodeFileContainerClient);
            BlobOriginalsRepository blobOriginalsRepository = new BlobOriginalsRepository(null, blobOriginalContainerClient);
            CosmosUserProfileRepository cosmosUserProfileRepository = new CosmosUserProfileRepository(config, cosmosClient);

            var authorizationServiceMoq = new Mock<IAuthorizationService>();
            authorizationServiceMoq.Setup(_ => _.AuthorizeAsync(It.IsAny<ClaimsPrincipal>(), It.IsAny<Object>(), It.IsAny<IEnumerable<IAuthorizationRequirement>>()))
                .ReturnsAsync(AuthorizationResult.Success);

            var sendGridClientMock = new Mock<ISendGridClient>();
            sendGridClientMock.Setup(_ => _.SendEmailAsync(It.IsAny<SendGridMessage>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new Response(HttpStatusCode.OK, null, null));
            NotificationManager notificationManager = new NotificationManager(config, cosmosReviewRepository, cosmosUserProfileRepository, sendGridClientMock.Object);

            var devopsArtifactRepositoryMoq = new Mock<IDevopsArtifactRepository>();
            devopsArtifactRepositoryMoq.Setup(_ => _.DownloadPackageArtifact(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync(new MemoryStream());
            devopsArtifactRepositoryMoq.Setup(_ => _.RunPipeline(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
                .Returns(Task.CompletedTask);

            string filePathA = Path.Combine("SampleTestFiles", fileNameA);
            string filePathB = Path.Combine("SampleTestFiles", fileNameB);
            FileInfo fileInfoA = new FileInfo(filePathA);
            FileInfo fileInfoB = new FileInfo(filePathB);
            fileStreamA = fileInfoA.Open(FileMode.Open, FileAccess.Read, FileShare.Read);
            fileStreamB = fileInfoB.Open(FileMode.Open, FileAccess.Read, FileShare.Read);
            user = TestUser.GetTestuser();
            reviewManager = new ReviewManager(
                authorizationServiceMoq.Object, cosmosReviewRepository, blobCodeFileRepository, blobOriginalsRepository, cosmosCommentsRepository,
                langusgeServices, notificationManager, devopsArtifactRepositoryMoq.Object, packageManager);
        }

        public void Dispose()
        {
            fileStreamA.Dispose();
            fileStreamB.Dispose();
        }

        [Fact(Skip = "Azurite process fails to run on DevOps")]
        public async Task AddRevisionAsync_Computes_Diff_In_Background()
        {
            var review = await reviewManager.CreateReviewAsync(user, fileNameA, "Revision1", fileStreamA, false, true);
            await reviewManager.AddRevisionAsync(user, review.ReviewId, fileNameB, "Revision2", fileStreamB, true);
            review = await reviewManager.GetReviewAsync(user, review.ReviewId);
            var headingWithDiffInSections = review.Revisions[1].DiffLines[review.Revisions[0].RevisionId];
            Assert.All(headingWithDiffInSections,
                item => Assert.Contains(item, new int[] { 2, 17, 16 }));
        }


    }
}
