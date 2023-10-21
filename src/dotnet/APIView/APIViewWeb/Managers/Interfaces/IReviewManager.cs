using System.Collections.Generic;
using System.IO;
using System.Security.Claims;
using System.Threading.Tasks;
using ApiView;
using APIView.DIff;
using APIView.Model;
using APIViewWeb.LeanModels;
using APIViewWeb.Models;

namespace APIViewWeb.Managers
{
    public interface IReviewManager
    {
        public Task<ReviewModel> CreateReviewAsync(ClaimsPrincipal user, string originalName, string label, Stream fileStream, bool runAnalysis, string langauge, bool awaitComputeDiff = false);
        public Task<ReviewRevisionModel> CreateMasterReviewAsync(ClaimsPrincipal user, string originalName, string label, Stream fileStream, bool compareAllRevisions);
        public Task UpdateReviewBackground(HashSet<string> updateDisabledLanguages, int backgroundBatchProcessCount);
        public Task<CodeFile> GetCodeFile(string repoName, string buildId, string artifactName, string packageName, string originalFileName, string codeFileName,
            MemoryStream originalFileStream, string baselineCodeFileName = "", MemoryStream baselineStream = null, string project = "public");
        public Task<ReviewRevisionModel> CreateApiReview(ClaimsPrincipal user, string buildId, string artifactName, string originalFileName, string label,
            string repoName, string packageName, string codeFileName, bool compareAllRevisions, string project);
        public Task AutoArchiveReviews(int archiveAfterMonths);
        public Task UpdateReviewCodeFiles(string repoName, string buildId, string artifact, string project);








        public Task<ReviewListItemModel> GetReviewAsync(string language, string packageName, bool isClosed = false);
        public Task<IEnumerable<ReviewListItemModel>> GetReviewsAssignedToUser(string userName);
        public Task<(IEnumerable<ReviewListItemModel> Reviews, int TotalCount, int TotalPages, int CurrentPage, int? PreviousPage, int? NextPage)> GetPagedReviewListAsync(
            IEnumerable<string> search, IEnumerable<string> languages, bool? isClosed, bool? isApproved, int offset, int limit, string orderBy);
        public Task SoftDeleteReviewAsync(ClaimsPrincipal user, string id);
        public Task<ReviewListItemModel> GetReviewAsync(ClaimsPrincipal user, string id);
        public Task ToggleReviewIsClosedAsync(ClaimsPrincipal user, string id);
        public Task ToggleReviewApprovalAsync(ClaimsPrincipal user, string id, string revisionId, string notes="");
        public Task AssignReviewersToReviewAsync(ClaimsPrincipal User, string reviewId, HashSet<string> reviewers);


   
        public Task<bool> IsApprovedForFirstRelease(string language, string packageName);
        public Task<int> GenerateAIReview(string reviewId, string revisionId);
        public Task AssertAutomaticReviewModifier(ClaimsPrincipal user, ReviewListItemModel reviewModel);
    }
}
