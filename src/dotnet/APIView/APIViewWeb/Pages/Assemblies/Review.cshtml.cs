using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Reflection.Metadata.Ecma335;
using System.Threading.Tasks;
using ApiView;
using APIView;
using APIView.DIff;
using APIView.Model;
using APIViewWeb.Helpers;
using APIViewWeb.Hubs;
using APIViewWeb.LeanModels;
using APIViewWeb.Managers;
using APIViewWeb.Managers.Interfaces;
using APIViewWeb.Models;
using APIViewWeb.Repositories;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.Mvc.ViewEngines;
using Microsoft.AspNetCore.SignalR;
using Microsoft.CodeAnalysis;
using Microsoft.Extensions.Configuration;


namespace APIViewWeb.Pages.Assemblies
{
    public class ReviewPageModel : PageModel
    {
        private static int REVIEW_DIFF_CONTEXT_SIZE = 3;
        private const string DIFF_CONTEXT_SEPERATOR = "<br><span>.....</span><br>";
        private readonly IReviewManager _reviewManager;
        private readonly IAPIRevisionsManager _apiRevisionsManager;
        private readonly IPullRequestManager _pullRequestManager;
        private readonly IBlobCodeFileRepository _codeFileRepository;
        private readonly ICommentsManager _commentsManager;
        private readonly INotificationManager _notificationManager;
        public readonly UserPreferenceCache _preferenceCache;
        private readonly ICosmosUserProfileRepository _userProfileRepository;
        private readonly IConfiguration _configuration;
        private readonly IHubContext<SignalRHub> _signalRHubContext;

        public ReviewPageModel(
            IReviewManager reviewManager,
            IAPIRevisionsManager reviewRevisionManager,
            IPullRequestManager pullRequestManager,
            IBlobCodeFileRepository codeFileRepository,
            ICommentsManager commentsManager,
            INotificationManager notificationManager,
            UserPreferenceCache preferenceCache,
            ICosmosUserProfileRepository userProfileRepository,
            IConfiguration configuration,
            IHubContext<SignalRHub> signalRHub)
        {
            _reviewManager = reviewManager;
            _apiRevisionsManager = reviewRevisionManager;
            _pullRequestManager = pullRequestManager;
            _codeFileRepository = codeFileRepository;
            _commentsManager = commentsManager;
            _notificationManager = notificationManager;
            _preferenceCache = preferenceCache;
            _userProfileRepository = userProfileRepository;
            _configuration = configuration;
            _signalRHubContext = signalRHub;
        }

        public ReviewContentModel ReviewContent { get; set; }
        public ReviewCommentsModel Comments { get; set; }
        [BindProperty(SupportsGet = true)]
        public string DiffRevisionId { get; set; }
        // Flag to decide whether to  include documentation
        [BindProperty(Name = "doc", SupportsGet = true)]
        public bool ShowDocumentation { get; set; }
        [BindProperty(Name = "diffOnly", SupportsGet = true)]
        public bool ShowDiffOnly { get; set; }

        public async Task<IActionResult> OnGetAsync(string id, string revisionId = null)
        {
            TempData["Page"] = "api";

            ReviewContent = await PageModelHelpers.GetReviewContentAsync(configuration: _configuration,
                reviewManager: _reviewManager, preferenceCache: _preferenceCache, userProfileRepository: _userProfileRepository,
                reviewRevisionsManager: _apiRevisionsManager, commentManager: _commentsManager, codeFileRepository: _codeFileRepository,
                signalRHubContext: _signalRHubContext, user: User, reviewId: id, revisionId: revisionId, diffRevisionId: DiffRevisionId,
                showDocumentation: ShowDocumentation, showDiffOnly: ShowDiffOnly, diffContextSize: REVIEW_DIFF_CONTEXT_SIZE,
                diffContextSeperator: DIFF_CONTEXT_SEPERATOR);

            if (!ReviewContent.APIRevisions.Any())
            {
                return RedirectToPage("LegacyReview", new { id = id });
            }

            return Page();
        }

        public async Task<PartialViewResult> OnGetCodeLineSectionAsync(
            string id, int sectionKey, int? sectionKeyA = null, int? sectionKeyB = null,
            string revisionId = null, string diffRevisionId = null, bool diffOnly = false)
        {
            await GetReviewPageModelPropertiesAsync(id, revisionId, diffRevisionId, diffOnly);

            var codeLines = PageModelHelpers.GetCodeLineSection(user: User, reviewManager: _reviewManager,
            apiRevisionsManager: _apiRevisionsManager, commentManager: _commentsManager,
            codeFileRepository: _codeFileRepository, reviewId: id, sectionKey: sectionKey, revisionId: revisionId,
            diffRevisionId: diffRevisionId, diffContextSize: REVIEW_DIFF_CONTEXT_SIZE, diffContextSeperator: DIFF_CONTEXT_SEPERATOR,
            sectionKeyA: sectionKeyA, sectionKeyB: sectionKeyB
            );

            var userPrefernce = await _preferenceCache.GetUserPreferences(User) ?? new UserPreferenceModel();

            TempData["CodeLineSection"] = codeLines;
            TempData["UserPreference"] = userPrefernce;
            return Partial("_CodeLinePartial", sectionKey);
        }
        /// <summary>
        /// Toggle Review State
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        public async Task<ActionResult> OnPostToggleClosedAsync(string id)
        {
            await _reviewManager.ToggleReviewIsClosedAsync(User, id);
            return RedirectToPage(new { id = id });
        }

        /// <summary>
        /// Subscribe or UnSubscribe to a Review
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        public async Task<ActionResult> OnPostToggleSubscribedAsync(string id)
        {
            await _notificationManager.ToggleSubscribedAsync(User, id);
            return RedirectToPage(new { id = id });
        }

        /// <summary>
        /// Approve or Revert Approval for a Review
        /// </summary>
        /// <param name="id"></param>
        /// <param name="revisionId"></param>
        /// <returns></returns>
        public async Task<IActionResult> OnPostToggleReviewApprovalAsync(string id, string revisionId)
        {
            await _reviewManager.ToggleReviewApprovalAsync(User, id, revisionId);
            return RedirectToPage(new { id = id });
        }

        /// <summary>
        /// Approve or Revert Approval for a Revision
        /// </summary>
        /// <param name="id"></param>
        /// <param name="revisionId"></param>
        /// <returns></returns>
        public async Task<IActionResult> OnPostToggleRevisionApprovalAsync(string id, string revisionId)
        {
            await _apiRevisionsManager.ToggleAPIRevisionApprovalAsync(User, id, revisionId);
            return RedirectToPage(new { id = id });
        }

        /// <summary>
        /// Request Reviewers for a Review Revision
        /// </summary>
        /// <param name="id"></param>
        /// <param name="revisionId"></param>
        /// <param name="reviewers"></param>
        /// <returns></returns>
        public async Task<ActionResult> OnPostRequestReviewersAsync(string id, string revisionId, HashSet<string> reviewers)
        {
            await _reviewManager.AssignReviewersToReviewAsync(User, revisionId, reviewers);
            await _notificationManager.NotifyApproversOfReview(User, id, reviewers);
            return RedirectToPage(new { id = id });
        }
        /// <summary>
        /// Get Routing Data for a Review
        /// </summary>
        /// <param name="diffRevisionId"></param>
        /// <param name="showDiffOnly"></param>
        /// <param name="showDocumentation"></param>
        /// <param name="revisionId"></param>
        /// <returns></returns>
        public Dictionary<string, string> GetRoutingData(string diffRevisionId = null, bool? showDiffOnly = null, bool? showDocumentation = null, string revisionId = null)
        {
            var routingData = new Dictionary<string, string>();
            routingData["revisionId"] = revisionId;
            routingData["diffRevisionId"] = diffRevisionId;
            routingData["doc"] = (showDocumentation ?? false).ToString();
            routingData["diffOnly"] = (showDiffOnly ?? false).ToString();
            return routingData;
        }
        /// <summary>
        /// Get Pull Requests for a Review
        /// </summary>
        /// <returns></returns>
        public async Task<IEnumerable<PullRequestModel>> GetAssociatedPullRequest()
        {
            return await _pullRequestManager.GetPullRequestsModel(ReviewContent.Review.Id);
        }

        /// <summary>
        /// Get PR of Associated Reviews
        /// </summary>
        /// <returns></returns>
        public async Task<IEnumerable<PullRequestModel>> GetPRsOfAssoicatedReviews()
        {
            var creatingPR = (await _pullRequestManager.GetPullRequestsModel(ReviewContent.Review.Id)).FirstOrDefault();
            return await _pullRequestManager.GetPullRequestsModel(creatingPR.PullRequestNumber, creatingPR.RepoName);;
        }

        private async Task GetReviewPageModelPropertiesAsync(string id, string revisionId = null, string diffRevisionId = null, bool diffOnly = false)
        {
            Comments = await _commentsManager.GetReviewCommentsAsync(id);
            DiffRevisionId = (DiffRevisionId == null) ? diffRevisionId : DiffRevisionId;
            ShowDiffOnly = (ShowDiffOnly == false) ? diffOnly : ShowDiffOnly;
        }
    }
}
