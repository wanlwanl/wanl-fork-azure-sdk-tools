// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using ApiView;
using APIView.DIff;
using APIView.Model;
using APIViewWeb.Hubs;
using APIViewWeb.Models;
using APIViewWeb.Repositories;
using Microsoft.ApplicationInsights;
using Microsoft.ApplicationInsights.DataContracts;
using Microsoft.ApplicationInsights.Extensibility;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Configuration;
using System.Net.Http;
using System.Text.Json;
using System.Data;
using APIViewWeb.LeanModels;
using APIViewWeb.Helpers;
using APIViewWeb.Managers.Interfaces;

namespace APIViewWeb.Managers
{
    public class ReviewManager : IReviewManager
    {

        private readonly IAuthorizationService _authorizationService;
        private readonly ICosmosReviewRepository _reviewsRepository;
        private readonly IAPIRevisionsManager _apiRevisionsManager;
        private readonly ICommentsManager _commentManager;
        private readonly IBlobCodeFileRepository _codeFileRepository;
        private readonly IBlobOriginalsRepository _originalsRepository;
        private readonly ICosmosCommentsRepository _commentsRepository;
        private readonly IEnumerable<LanguageService> _languageServices;
        private readonly INotificationManager _notificationManager;
        private readonly IDevopsArtifactRepository _devopsArtifactRepository;
        private readonly IPackageNameManager _packageNameManager;
        private readonly IHubContext<SignalRHub> _signalRHubContext;
        private readonly ICodeFileManager _codeFileManager;

        static TelemetryClient _telemetryClient = new(TelemetryConfiguration.CreateDefault());

        public ReviewManager (
            IAuthorizationService authorizationService, ICosmosReviewRepository reviewsRepository,
            IAPIRevisionsManager apiRevisionsManager, ICommentsManager commentManager,
            IBlobCodeFileRepository codeFileRepository, IBlobOriginalsRepository originalsRepository,
            ICosmosCommentsRepository commentsRepository, IEnumerable<LanguageService> languageServices,
            INotificationManager notificationManager, IDevopsArtifactRepository devopsClient, IPackageNameManager packageNameManager,
            IHubContext<SignalRHub> signalRHubContext, ICodeFileManager codeFileManager)

        {
            _authorizationService = authorizationService;
            _reviewsRepository = reviewsRepository;
            _apiRevisionsManager = apiRevisionsManager;
            _commentManager = commentManager;
            _codeFileRepository = codeFileRepository;
            _originalsRepository = originalsRepository;
            _commentsRepository = commentsRepository;
            _languageServices = languageServices;
            _notificationManager = notificationManager;
            _devopsArtifactRepository = devopsClient;
            _packageNameManager = packageNameManager;
            _signalRHubContext = signalRHubContext;
            _codeFileManager = codeFileManager;
        }

        public async Task<ReviewListItemModel> CreateReviewAsync(ClaimsPrincipal user, string originalName, string label, Stream fileStream, bool runAnalysis, string langauge, bool awaitComputeDiff = false)
        {
            var review = new ReviewListItemModel
            {
                CreatedBy = user.GetGitHubLogin(),
                CreatedOn = DateTime.UtcNow,
            };
            await _apiRevisionsManager.AddAPIRevisionAsync(user, review, originalName, label, fileStream, langauge, awaitComputeDiff);
            return review;
        }

        public Task<ReviewListItemModel> GetReviewAsync(string language, string packageName, bool isClosed = false)
        {
            return _reviewsRepository.GetReviewAsync(language, packageName, isClosed);
        }
        /// <summary>
        /// Get Reviews that have been assigned for review to a user
        /// </summary>
        /// <param name="userName"></param>
        /// <returns></returns>
        public async Task<IEnumerable<ReviewListItemModel>> GetReviewsAssignedToUser(string userName)
        {
            return await _reviewsRepository.GetReviewsAssignedToUser(userName);
        }

        /// <summary>
        /// Get List of Reviews for the Review Page
        /// </summary>
        /// <param name="search"></param>
        /// <param name="languages"></param>
        /// <param name="isClosed"></param>
        /// <param name="filterTypes"></param>
        /// <param name="isApproved"></param>
        /// <param name="offset"></param>
        /// <param name="limit"></param>
        /// <param name="orderBy"></param>
        /// <returns></returns>
        public async Task<(IEnumerable<ReviewListItemModel> Reviews, int TotalCount, int TotalPages, int CurrentPage, int? PreviousPage, int? NextPage)> GetPagedReviewListAsync(
            IEnumerable<string> search, IEnumerable<string> languages, bool? isClosed, IEnumerable<int> filterTypes, bool? isApproved, int offset, int limit, string orderBy)
        {
            var result = await _reviewsRepository.GetReviewsAsync(search: search, languages: languages, isClosed: isClosed, isApproved:  isApproved, offset: offset, limit: limit, orderBy: orderBy);

            // Calculate and add Previous and Next and Current page to the returned result
            var totalPages = (int)Math.Ceiling(result.TotalCount / (double)limit);
            var currentPage = offset == 0 ? 1 : offset / limit + 1;

            (IEnumerable<ReviewListItemModel> Reviews, int TotalCount, int TotalPages, int CurrentPage, int? PreviousPage, int? NextPage) resultToReturn = (
                result.Reviews, result.TotalCount, TotalPages: totalPages,
                CurrentPage: currentPage,
                PreviousPage: currentPage == 1 ? null : currentPage - 1,
                NextPage: currentPage >= totalPages ? null : currentPage + 1
            );
            return resultToReturn;
        }

        /// <summary>
        /// SoftDeleteReviewAsync
        /// </summary>
        /// <param name="user"></param>
        /// <param name="id"></param>
        /// <returns></returns>
        public async Task SoftDeleteReviewAsync(ClaimsPrincipal user, string id)
        {
            var review = await _reviewsRepository.GetReviewAsync(id);
            await AssertReviewOwnerAsync(user, review);

            var changeUpdate = ChangeHistoryHelpers.UpdateBinaryChangeAction(review.ChangeHistory, ReviewChangeAction.Deleted, user.GetGitHubLogin());
            review.ChangeHistory = changeUpdate.ChangeHistory;
            review.IsDeleted = changeUpdate.ChangeStatus;
            await _reviewsRepository.UpsertReviewAsync(review);

            foreach (var apiRevisionId in review.APIRevisions)
            {
                await _apiRevisionsManager.SoftDeleteAPIRevisionAsync(user, review.Id, apiRevisionId);
            }
            await _commentManager.SoftDeleteCommentsAsync(user, review.Id);
        }

        /// <summary>
        /// Get Reviews
        /// </summary>
        /// <param name="user"></param>
        /// <param name="id"></param>
        /// <returns></returns>
        /// <exception cref="UnauthorizedAccessException"></exception>
        public async Task<ReviewListItemModel> GetReviewAsync(ClaimsPrincipal user, string id)
        {
            if (user == null)
            {
                throw new UnauthorizedAccessException();
            }

            var review = await _reviewsRepository.GetReviewAsync(id);
            return review;
        }

        /// <summary>
        /// Toggle Review Open/Closed state
        /// </summary>
        /// <param name="user"></param>
        /// <param name="id"></param>
        /// <returns></returns>
        public async Task ToggleReviewIsClosedAsync(ClaimsPrincipal user, string id)
        {
            var review = await _reviewsRepository.GetReviewAsync(id);
            var userId = user.GetGitHubLogin();
            var changeUpdate = ChangeHistoryHelpers.UpdateBinaryChangeAction<ReviewChangeHistoryModel, ReviewChangeAction>(
                review.ChangeHistory, ReviewChangeAction.Closed, userId);
            review.ChangeHistory = changeUpdate.ChangeHistory;
            review.IsClosed = changeUpdate.ChangeStatus;
            await _reviewsRepository.UpsertReviewAsync(review);
        }

        /// <summary>
        /// Add new Approval or ApprovalReverted action to the ChangeHistory of a Review. Serves as firstRelease approval
        /// </summary>
        /// <param name="user"></param>
        /// <param name="id"></param>
        /// <param name="revisionId"></param>
        /// <param name="notes"></param>
        /// <returns></returns>
        public async Task ToggleReviewApprovalAsync(ClaimsPrincipal user, string id, string revisionId, string notes="")
        {
            ReviewListItemModel review = await _reviewsRepository.GetReviewAsync(id);
            await ManagerHelpers.AssertApprover<ReviewListItemModel>(user, review, _authorizationService);
            var userId = user.GetGitHubLogin();
            var changeUpdate = ChangeHistoryHelpers.UpdateBinaryChangeAction<ReviewChangeHistoryModel, ReviewChangeAction>(
                review.ChangeHistory, ReviewChangeAction.Approved, userId, notes);
            review.ChangeHistory = changeUpdate.ChangeHistory;
            review.IsApproved = changeUpdate.ChangeStatus;

            await _reviewsRepository.UpsertReviewAsync(review);
            await _signalRHubContext.Clients.Group(userId).SendAsync("ReceiveApprovalSelf", id, revisionId, review.IsApproved);
            await _signalRHubContext.Clients.All.SendAsync("ReceiveApproval", id, revisionId, userId, review.IsApproved);
        }

        public async Task<ReviewRevisionModel> CreateMasterReviewAsync(ClaimsPrincipal user, string originalName, string label, Stream fileStream, bool compareAllRevisions)
        {
            //Generate code file from new uploaded package
            using var memoryStream = new MemoryStream();
            var codeFile = await _codeFileManager.CreateCodeFileAsync(originalName, fileStream, false, memoryStream);
            return await CreateMasterReviewAsync(user, codeFile, originalName, label, memoryStream, compareAllRevisions);
        }


        public async Task UpdateReviewBackground(HashSet<string> updateDisabledLanguages, int backgroundBatchProcessCount)
        {
            foreach(var language in LanguageService.SupportedLanguages)
            {
                if (updateDisabledLanguages.Contains(language))
                {
                    _telemetryClient.TrackTrace("Background task to update API review at startup is disabled for langauge " + language);
                    continue;
                }

                var languageService = GetLanguageService(language);
                if (languageService == null)
                    return;

                // If review is updated using devops pipeline then batch process update review requests
                if (languageService.IsReviewGenByPipeline)
                {
                    await UpdateReviewsUsingPipeline(language, languageService, backgroundBatchProcessCount);
                }
                else
                {
                    var reviews = await _reviewsRepository.GetReviewsAsync(false, language, fetchAllPages: true);
                    foreach (var review in reviews.Where(r => IsUpdateAvailable(r)))
                    {
                        var requestTelemetry = new RequestTelemetry { Name = "Updating Review " + review.ReviewId };
                        var operation = _telemetryClient.StartOperation(requestTelemetry);
                        try
                        {
                            await Task.Delay(500);
                            await UpdateReviewAsync(review, languageService);
                        }
                        catch (Exception e)
                        {
                            _telemetryClient.TrackException(e);
                        }
                        finally
                        {
                            _telemetryClient.StopOperation(operation);
                        }
                    }
                }                
            }            
        }

        /// <summary>
        /// Assign reviewers to a review
        /// </summary>
        /// <param name="User"></param>
        /// <param name="reviewId"></param>
        /// <param name="reviewers"></param>
        /// <returns></returns>
        public async Task AssignReviewersToReviewAsync(ClaimsPrincipal User, string reviewId, HashSet<string> reviewers)
        {
            ReviewListItemModel review = await _reviewsRepository.GetReviewAsync(reviewId);
            foreach (var reviewer in reviewers)
            {
                if (!review.AssignedReviewers.Where(x => x.AssingedTo == reviewer).Any())
                {
                    review.AssignedReviewers.Append(new ReviewAssignmentModel()
                    {
                        AssingedTo = reviewer,
                        AssignedBy = User.GetGitHubLogin(),
                        AssingedOn = DateTime.Now,
                    });
                }
            }
            await _reviewsRepository.UpsertReviewAsync(review);
        }

        // Languages that full ysupport sandboxing updates reviews using Azure devops pipeline
        // We should batch all eligible reviews to avoid a pipeline run storm
        private async Task UpdateReviewsUsingPipeline(string language, LanguageService languageService, int backgroundBatchProcessCount)
        {
            var reviews = await _reviewsRepository.GetReviewsAsync(false, language, fetchAllPages: true);
            var paramList = new List<APIRevisionGenerationPipelineParamModel>();

            foreach(var review in reviews)
            {
                foreach (var revision in review.Revisions.Reverse())
                {
                    foreach (var file in revision.Files)
                    {
                        //Don't include current revision if file is not required to be updated.
                        // E.g. json token file is uploaded for a language, specific revision was already upgraded.
                        if (!file.HasOriginal || file.FileName == null || !languageService.IsSupportedFile(file.FileName) || !languageService.CanUpdate(file.VersionString))
                        {
                            continue;
                        }

                        _telemetryClient.TrackTrace($"Updating review: {review.ReviewId}, revision: {revision.RevisionId}");
                        paramList.Add(new APIRevisionGenerationPipelineParamModel()
                        {
                            FileID = file.FileId,
                            ReviewID = review.ReviewId,
                            RevisionID = revision.RevisionId,
                            FileName = Path.GetFileName(file.FileName)
                        });
                    }
                }

                // This should be changed to configurable batch count
                if (paramList.Count >= backgroundBatchProcessCount)
                {
                    _telemetryClient.TrackTrace($"Running pipeline to update reviews for {language} with batch size {paramList.Count}");
                    await _apiRevisionsManager.RunAPIRevisionGenerationPipeline(paramList, languageService.Name);
                    // Delay of 10 minute before starting next batch
                    // We should try to increase the number of revisions in the batch than number of runs.
                    await Task.Delay(600000);
                    paramList.Clear();
                }                
            }

            if (paramList.Count > 0)
            {
                _telemetryClient.TrackTrace($"Running pipeline to update reviews for {language} with batch size {paramList.Count}");
                await _apiRevisionsManager.RunAPIRevisionGenerationPipeline(paramList, languageService.Name);
            }
        }

        public async Task<CodeFile> GetCodeFile(string repoName,
            string buildId,
            string artifactName,
            string packageName,
            string originalFileName,
            string codeFileName,
            MemoryStream originalFileStream,
            string baselineCodeFileName = "",
            MemoryStream baselineStream = null,
            string project = "public"
            )
        {
            Stream stream = null;
            CodeFile codeFile = null;
            if (string.IsNullOrEmpty(codeFileName))
            {
                // backward compatibility until all languages moved to sandboxing of codefile to pipeline
                stream = await _devopsArtifactRepository.DownloadPackageArtifact(repoName, buildId, artifactName, originalFileName, format: "file", project: project);
                codeFile = await _codeFileManager.CreateCodeFileAsync(Path.GetFileName(originalFileName), stream, false, originalFileStream);
            }
            else
            {
                stream = await _devopsArtifactRepository.DownloadPackageArtifact(repoName, buildId, artifactName, packageName, format: "zip", project: project);
                var archive = new ZipArchive(stream);
                foreach (var entry in archive.Entries)
                {
                    var fileName = Path.GetFileName(entry.Name);
                    if (fileName == originalFileName)
                    {
                        await entry.Open().CopyToAsync(originalFileStream);
                    }

                    if (fileName == codeFileName)
                    {
                        codeFile = await CodeFile.DeserializeAsync(entry.Open());
                    }
                    else if (fileName == baselineCodeFileName)
                    {
                        await entry.Open().CopyToAsync(baselineStream);
                    }
                }
            }

            return codeFile;
        }

        public async Task<ReviewRevisionModel> CreateApiReview(
            ClaimsPrincipal user,
            string buildId,
            string artifactName,
            string originalFileName,
            string label,
            string repoName,
            string packageName,
            string codeFileName,
            bool compareAllRevisions,
            string project
            )
        {
            using var memoryStream = new MemoryStream();
            var codeFile = await GetCodeFile(repoName, buildId, artifactName, packageName, originalFileName, codeFileName, memoryStream, project: project);
            return await CreateMasterReviewAsync(user, codeFile, originalFileName, label, memoryStream, compareAllRevisions);
        }

        public async Task AutoArchiveReviews(int archiveAfterMonths)
        {
            var reviews = await _reviewsRepository.GetReviewsAsync(false, "All", filterType: ReviewType.Manual, fetchAllPages: true);
            // Find all inactive reviews
            reviews = reviews.Where(r => r.LastUpdated.AddMonths(archiveAfterMonths) < DateTime.Now);
            foreach (var review in reviews)
            {
                var requestTelemetry = new RequestTelemetry { Name = "Archiving Review " + review.ReviewId };
                var operation = _telemetryClient.StartOperation(requestTelemetry);
                try
                {
                    review.IsClosed = true;
                    await _reviewsRepository.UpsertReviewAsync(review);
                    await Task.Delay(500);
                }
                catch (Exception e)
                {
                    _telemetryClient.TrackException(e);
                }
                finally
                {
                    _telemetryClient.StopOperation(operation);
                }
            }
        }

        public async Task UpdateReviewCodeFiles(string repoName, string buildId, string artifact, string project)
        {
            var stream = await _devopsArtifactRepository.DownloadPackageArtifact(repoName, buildId, artifact, filePath: null, project: project, format: "zip");
            var archive = new ZipArchive(stream);
            foreach (var entry in archive.Entries)
            {
                var reviewFilePath = entry.FullName;
                var reviewDetails = reviewFilePath.Split("/");

                if (reviewDetails.Length < 4 || !reviewFilePath.EndsWith(".json"))
                    continue;

                var reviewId = reviewDetails[1];
                var revisionId = reviewDetails[2];
                var codeFile = await CodeFile.DeserializeAsync(entry.Open());

                // Update code file with one downloaded from pipeline
                var review = await _reviewsRepository.GetReviewAsync(reviewId);
                if (review != null)
                {
                    var revision = review.Revisions.SingleOrDefault(review => review.RevisionId == revisionId);
                    if (revision != null)
                    {
                        await _codeFileRepository.UpsertCodeFileAsync(revisionId, revision.SingleFile.ReviewFileId, codeFile);
                        var file = revision.Files.FirstOrDefault();
                        file.VersionString = codeFile.VersionString;
                        file.PackageName = codeFile.PackageName;
                        await _reviewsRepository.UpsertReviewAsync(review);

                        if (!String.IsNullOrEmpty(review.Language) && review.Language == "Swagger")
                        {
                            // Trigger diff calculation using updated code file from sandboxing pipeline
                            await _apiRevisionsManager.GetLineNumbersOfHeadingsOfSectionsWithDiff(review.ReviewId, revision);
                        }
                    }
                }
            }
        }

        public async Task<bool> IsApprovedForFirstRelease(string language, string packageName)
        {
            var reviews = await _reviewsRepository.GetApprovedForFirstReleaseReviews(language, packageName);
            if (!reviews.Any())
            {
                reviews = await _reviewsRepository.GetApprovedReviews(language, packageName);
            }
            return reviews.Any();
        }

        /// <summary>
        /// Sends info to AI service for generating initial review on APIReview file
        /// </summary>
        public async Task<int> GenerateAIReview(string reviewId, string revisionId)
        {
            var review = await _reviewsRepository.GetReviewAsync(reviewId);
            var revision = review.Revisions.Where(r => r.RevisionId == revisionId).FirstOrDefault();
            var codeFile = await _codeFileRepository.GetCodeFileAsync(revision, false);
            var codeLines = codeFile.RenderText(false);

            var reviewText = new StringBuilder();
            foreach (var codeLine in codeLines)
            {
                reviewText.Append(codeLine.DisplayString);
                reviewText.Append("\\n");
            }

            var url = "https://apiview-gpt.azurewebsites.net/python";
            var client = new HttpClient();
            client.Timeout = TimeSpan.FromMinutes(20);
            var payload = new
            {
                content = reviewText.ToString()
            };

            var result = new AIReviewModel();
            try {
                var response = await client.PostAsync(url, new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json"));
                response.EnsureSuccessStatusCode();
                var responseString = await response.Content.ReadAsStringAsync();
                var responseSanitized = JsonSerializer.Deserialize<string>(responseString);
                result = JsonSerializer.Deserialize<AIReviewModel>(responseSanitized);
            }
            catch (Exception e ) {
                throw new Exception($"Copilot Failed: {e.Message}");
            }
           
            // Write back result as comments to APIView
            foreach (var violation in result.Violations)
            {
                var codeLine = codeLines[violation.LineNo];
                var comment = new CommentItemModel();
                comment.CreatedOn = DateTime.UtcNow;
                comment.ReviewId = reviewId;
                comment.RevisionId = revisionId;
                comment.ElementId = codeLine.ElementId;
                //comment.SectionClass = sectionClass; // This will be needed for swagger

                var commentText = new StringBuilder();
                commentText.AppendLine($"Suggestion: `{violation.Suggestion}`");
                commentText.AppendLine();
                commentText.AppendLine(violation.Comment);
                foreach (var id in violation.RuleIds)
                {
                    commentText.AppendLine($"See: https://guidelinescollab.github.io/azure-sdk/{id}");
                }
                comment.ResolutionLocked = false;
                comment.CreatedBy = "azure-sdk";
                comment.CommentText = commentText.ToString();

                await _commentsRepository.UpsertCommentAsync(comment);
            }
            return result.Violations.Count;
        }


        private async Task UpdateReviewAsync(ReviewModel review, LanguageService languageService)
        {
            foreach (var revision in review.Revisions.Reverse())
            {
                foreach (var file in revision.Files)
                {
                    if (!file.HasOriginal || !languageService.CanUpdate(file.VersionString))
                    {
                        continue;
                    }

                    try
                    {
                        var fileOriginal = await _originalsRepository.GetOriginalAsync(file.FileId);
                        // file.Name property has been repurposed to store package name and version string
                        // This is causing issue when updating review using latest parser since it expects Name field as file name
                        // We have added a new property FileName which is only set for new reviews
                        // All older reviews needs to be handled by checking review name field
                        var fileName = file.FileName ?? (Path.HasExtension(review.Name) ? review.Name : file.Name);
                        var codeFile = await languageService.GetCodeFileAsync(fileName, fileOriginal, review.RunAnalysis);
                        await _codeFileRepository.UpsertCodeFileAsync(revision.RevisionId, file.FileId, codeFile);
                        // update only version string
                        file.VersionString = codeFile.VersionString;
                        await _reviewsRepository.UpsertReviewAsync(review);
                    }
                    catch (Exception ex)
                    {
                        _telemetryClient.TrackTrace("Failed to update review " + review.ReviewId);
                        _telemetryClient.TrackException(ex);
                    }
                }
            }
        }

        private LanguageService GetLanguageService(string language)
        {
            return _languageServices.FirstOrDefault(service => service.Name == language);
        }

        private void  AssertReviewDeletion(ReviewListItemModel reviewModel)
        {
            // We allow deletion of manual API review only.
            // Server side assertion to ensure we are not processing any requests to delete automatic and PR API review
            if (reviewModel.FilterType != ReviewType.Manual)
            {
                throw new UnDeletableReviewException();
            }
        }

        private async Task AssertReviewOwnerAsync(ClaimsPrincipal user, ReviewListItemModel reviewModel)
        {
            var result = await _authorizationService.AuthorizeAsync(user, reviewModel, new[] { ReviewOwnerRequirement.Instance });
            if (!result.Succeeded)
            {
                throw new AuthorizationFailedException();
            }
        }

        private async Task AssertRevisionOwner(ClaimsPrincipal user, ReviewRevisionModel revisionModel)
        {
            var result = await _authorizationService.AuthorizeAsync(
                user,
                revisionModel,
                new[] { RevisionOwnerRequirement.Instance });
            if (!result.Succeeded)
            {
                throw new AuthorizationFailedException();
            }
        }

        private bool IsUpdateAvailable(ReviewModel review)
        {
            return review.Revisions
               .SelectMany(r => r.Files)
               .Any(f => f.HasOriginal && GetLanguageService(f.Language)?.CanUpdate(f.VersionString) == true);
        }

        private async Task<ReviewRevisionModel> CreateMasterReviewAsync(ClaimsPrincipal user, CodeFile codeFile, string originalName, string label, MemoryStream memoryStream, bool compareAllRevisions)
        {
            var renderedCodeFile = new RenderedCodeFile(codeFile);

            //Get current master review for package and language
            var review = await _reviewsRepository.GetReviewAsync(codeFile.Language, codeFile.PackageName);
            var createNewRevision = true;
            ReviewRevisionModel reviewRevision = null;
            if (review != null)
            {
                // Delete pending revisions if it is not in approved state and if it doesn't have any comments before adding new revision
                // This is to keep only one pending revision since last approval or from initial review revision
                var lastRevision = review.Revisions.LastOrDefault();
                var comments = await _commentsRepository.GetCommentsAsync(review.ReviewId);
                while (lastRevision.Approvers.Count == 0 &&
                       review.Revisions.Count > 1 &&
                       !await _apiRevisionsManager.IsAPIRevisionTheSame(lastRevision, renderedCodeFile) &&
                       !comments.Any(c => lastRevision.RevisionId == c.RevisionId))
                {
                    review.Revisions.Remove(lastRevision);
                    lastRevision = review.Revisions.LastOrDefault();
                }
                // We should compare against only latest revision when calling this API from scheduled CI runs
                // But any manual pipeline run at release time should compare against all approved revisions to ensure hotfix release doesn't have API change
                // If review surface doesn't match with any approved revisions then we will create new revision if it doesn't match pending latest revision
                if (compareAllRevisions)
                {
                    foreach (var approvedRevision in review.Revisions.Where(r => r.IsApproved).Reverse())
                    {
                        if (await _apiRevisionsManager.IsAPIRevisionTheSame(approvedRevision, renderedCodeFile))
                        {
                            return approvedRevision;
                        }
                    }
                }

                if (await _apiRevisionsManager.IsAPIRevisionTheSame(lastRevision, renderedCodeFile))
                {
                    reviewRevision = lastRevision;
                    createNewRevision = false;
                }
            }
            else
            {
                // Package and language combination doesn't have automatically created review. Create a new review.
                review = new ReviewModel
                {
                    Author = user.GetGitHubLogin(),
                    CreationDate = DateTime.UtcNow,
                    RunAnalysis = false,
                    Name = originalName,
                    FilterType = ReviewType.Automatic
                };
            }

            // Check if user is authorized to modify automatic review
            await AssertAutomaticReviewModifier(user, review);
            if (createNewRevision)
            {
                // Update or insert review with new revision
                reviewRevision = new ReviewRevisionModel()
                {
                    Author = user.GetGitHubLogin(),
                    Label = label
                };
                var reviewCodeFileModel = await _codeFileManager.CreateReviewCodeFileModel(reviewRevision.RevisionId, memoryStream, codeFile);
                reviewCodeFileModel.FileName = originalName;
                reviewRevision.Files.Add(reviewCodeFileModel);
                review.Revisions.Add(reviewRevision);
            }

            // Check if review can be marked as approved if another review with same surface level is in approved status
            if (review.Revisions.Last().Approvers.Count() == 0)
            {
                var matchingApprovedRevision = await FindMatchingApprovedRevision(review);
                if (matchingApprovedRevision != null)
                {
                    foreach (var approver in matchingApprovedRevision.Approvers)
                    {
                        review.Revisions.Last().Approvers.Add(approver);
                    }
                }
            }
            await _reviewsRepository.UpsertReviewAsync(review);
            return reviewRevision;
        }

        public async Task AssertAutomaticReviewModifier(ClaimsPrincipal user, ReviewListItemModel reviewModel)
        {
            var result = await _authorizationService.AuthorizeAsync(
                user,
                reviewModel,
                new[] { AutoReviewModifierRequirement.Instance });
            if (!result.Succeeded)
            {
                throw new AuthorizationFailedException();
            }
        }

        private async Task<ReviewRevisionModel> FindMatchingApprovedRevision(ReviewModel review)
        {
            var revisionModel = review.Revisions.LastOrDefault();
            var revisionFile = revisionModel.Files.FirstOrDefault();
            var codeFile = await _codeFileRepository.GetCodeFileAsync(revisionModel);

            // Get manual reviews to check if a matching review is in approved state
            var reviews = await _reviewsRepository.GetReviewsAsync(false, revisionFile.Language, revisionFile.PackageName, ReviewType.Manual);
            var prReviews = await _reviewsRepository.GetReviewsAsync(false, revisionFile.Language, revisionFile.PackageName, ReviewType.PullRequest);
            reviews = reviews.Concat(prReviews);
            foreach (var r in reviews)
            {
                var approvedRevision = r.Revisions.Where(r => r.IsApproved).LastOrDefault();
                if (approvedRevision != null)
                {
                    var isReviewSame = await _apiRevisionsManager.IsAPIRevisionTheSame(approvedRevision, codeFile);
                    if (isReviewSame)
                    {
                        return approvedRevision;
                    }
                }
            }
            return null;
        }
    }
}
