using APIViewWeb.Helpers;
using APIViewWeb.LeanModels;
using APIViewWeb.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;
using APIViewWeb.Managers.Interfaces;
using System.Collections.Generic;

namespace APIViewWeb.LeanControllers
{
    public class APIRevisionsController : BaseApiController
    {
        private readonly ILogger<APIRevisionsController> _logger;
        private readonly IAPIRevisionsManager _apiRevisionsManager;
        
        public APIRevisionsController(ILogger<APIRevisionsController> logger,
            IAPIRevisionsManager apiRevisionsManager)
        {
            _logger = logger;
            _apiRevisionsManager = apiRevisionsManager;
        }

        /// <summary>
        /// Endpoint used by Client SPA for listing reviews.
        /// </summary>
        /// <param name="pageParams"></param>
        /// <param name="filterAndSortParams"></param>
        /// <returns></returns>
        [HttpPost(Name = "GetAPIRevisions")]
        public async Task<ActionResult<PagedList<APIRevisionListItemModel>>> GetAPIRevisionsAsync([FromQuery] PageParams pageParams, [FromBody] APIRevisionsFilterAndSortParams filterAndSortParams)
        {
            var result = await _apiRevisionsManager.GetAPIRevisionsAsync(pageParams, filterAndSortParams);
            Response.AddPaginationHeader(new PaginationHeader(result.NoOfItemsRead, result.PageSize, result.TotalCount));
            return new LeanJsonResult(result, StatusCodes.Status200OK);
        }

        /// <summary>
        /// Endpoint used by Client SPA for Deleting reviews.
        /// </summary>
        /// <param name="reviewId"></param>
        /// <param name="apiRevisionIds"></param>
        /// <returns></returns>
        [HttpPut(Name = "DeleteAPIRevisions")]
        public async Task DeleteAPIRevisionsAsync([FromBody] APIRevisionSoftDeleteParam deleteParams)
        {
            foreach (var apiRevisionId in deleteParams.apiRevisionIds)
            {
                await _apiRevisionsManager.SoftDeleteAPIRevisionAsync(user: User, reviewId: deleteParams.reviewId, revisionId: apiRevisionId);
            }
        }
    }
}
