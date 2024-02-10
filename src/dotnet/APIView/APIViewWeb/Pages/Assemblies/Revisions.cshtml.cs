using System.Collections.Generic;
using System.Threading.Tasks;
using APIViewWeb.LeanModels;
using APIViewWeb.Managers;
using APIViewWeb.Managers.Interfaces;
using APIViewWeb.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace APIViewWeb.Pages.Assemblies
{
    public class RevisionsPageModel : PageModel
    {
        private readonly IReviewManager _reviewManager;
        private readonly IAPIRevisionsManager _apiRevisionsManager;
        private readonly ISamplesRevisionsManager _samplesRevisionsManager;
        public readonly UserPreferenceCache _preferenceCache;

        public RevisionsPageModel(
            IReviewManager manager,
            IAPIRevisionsManager reviewRevisionsManager,
            ISamplesRevisionsManager samplesRevisionsManager,
            UserPreferenceCache preferenceCache)
        {
            _reviewManager = manager;
            _apiRevisionsManager = reviewRevisionsManager;
            _samplesRevisionsManager = samplesRevisionsManager;
            _preferenceCache = preferenceCache;
        }

        public ReviewListItemModel Review { get; set; }
        public IEnumerable<SamplesRevisionModel> SamplesRevisions { get; set; }
        public IEnumerable<APIRevisionListItemModel> APIRevisions { get; set; }

        public async Task<IActionResult> OnGetAsync(string id)
        {
            TempData["Page"] = "revisions";

            Review = await _reviewManager.GetReviewAsync(User, id);
            APIRevisions = await _apiRevisionsManager.GetAPIRevisionsAsync(Review.Id);
            SamplesRevisions = await _samplesRevisionsManager.GetSamplesRevisionsAsync(Review.Id);

            return Page();
        }

        public async Task<IActionResult> OnPostUploadAsync(string id, [FromForm] IFormFile upload, [FromForm] string label, [FromForm] string filePath)
        {
            if (!ModelState.IsValid)
            {
                return RedirectToPage();
            }

            if (upload != null)
            {
                var openReadStream = upload.OpenReadStream();
                await _apiRevisionsManager.AddAPIRevisionAsync(User, id, APIRevisionType.Manual, upload.FileName, label, openReadStream, language: null);
            }
            else
            {
                await _apiRevisionsManager.AddAPIRevisionAsync(User, id, APIRevisionType.Manual, filePath, label, null);
            }

            return RedirectToPage();
        }

        public async Task<IActionResult> OnPostRenameAsync(string id, string revisionId, string newLabel)
        {
            await _apiRevisionsManager.UpdateAPIRevisionLabelAsync(User, revisionId, newLabel);
            return Content(newLabel);
        }

        /// <summary>
        /// Delete API Revision
        /// </summary>
        /// <param name="id"></param>
        /// <param name="revisionId"></param>
        /// <returns></returns>
        public async Task<IActionResult> OnDeleteAsync(string id, string revisionId)
        {
            await _apiRevisionsManager.SoftDeleteAPIRevisionAsync(User, id, revisionId);
            return new NoContentResult();
        }
    }
}
