// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using APIViewWeb.LeanModels;
using APIViewWeb.Repositories;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Configuration;


namespace APIViewWeb
{
    public class CosmosReviewRepository : ICosmosReviewRepository
    {
        private readonly Container _reviewsContainer;

        public CosmosReviewRepository(IConfiguration configuration, CosmosClient cosmosClient)
        {
            _reviewsContainer = cosmosClient.GetContainer("APIViewV2", "Reviews");
        }

        public async Task UpsertReviewAsync(ReviewListItemModel review)
        {
            review.LastUpdatedOn = DateTime.UtcNow;
            await _reviewsContainer.UpsertItemAsync(review, new PartitionKey(review.Id));
        }

        public async Task<ReviewListItemModel> GetReviewAsync(string reviewId)
        {
            return await _reviewsContainer.ReadItemAsync<ReviewListItemModel>(reviewId, new PartitionKey(reviewId));
        }

        public async Task<ReviewListItemModel> GetReviewAsync(string language, string packageName, bool isClosed = false)
        {
            var queryStringBuilder = new StringBuilder("SELECT * FROM Reviews r WHERE r.IsClosed = false");
            queryStringBuilder.Append(" AND r.Language = @language");
            queryStringBuilder.Append(" AND r.PackageName = @packageName");
            queryStringBuilder.Append(" AND r.IcClosed = @isClosed");

            var queryDefinition = new QueryDefinition(queryStringBuilder.ToString())
                .WithParameter("@language", language)
                .WithParameter("@packageName", packageName)
                .WithParameter("@isClosed", isClosed);

            var itemQueryIterator = _reviewsContainer.GetItemQueryIterator<ReviewListItemModel>(queryDefinition);
            var result = await itemQueryIterator.ReadNextAsync();
            return result.Resource.FirstOrDefault();    
        }

        public async Task<IEnumerable<ReviewModel>> GetReviewsAsync(bool isClosed, string language, string packageName = null, ReviewType? filterType = null, bool fetchAllPages = false)
        {
            var queryStringBuilder = new StringBuilder("SELECT * FROM Reviews r WHERE (IS_DEFINED(r.IsClosed) ? r.IsClosed : false) = @isClosed ");

            //Add filter if looking for automatic, manual or PR reviews
            if (filterType != null && filterType != ReviewType.All)
            {
                queryStringBuilder.Append("AND (IS_DEFINED(r.FilterType) ? r.FilterType : 0) = @filterType ");
            }

            // Add language and package name clause
            // Currently we don't have any use case of searching for a package name across languages
            if (language != "All")
            {
                queryStringBuilder.Append("AND EXISTS (SELECT VALUE revision FROM revision in r.Revisions WHERE EXISTS (SELECT VALUE files from files in revision.Files WHERE files.Language = @language");
                if (!String.IsNullOrEmpty(packageName))
                {
                    queryStringBuilder.Append(" AND files.PackageName = @packageName");
                }
                queryStringBuilder.Append("))");
            }

            // Limit to top 50
            if (!fetchAllPages)
            {
                queryStringBuilder.Append("OFFSET 0 LIMIT 50");
            }
            

            var allReviews = new List<ReviewModel>();
            var queryDefinition = new QueryDefinition(queryStringBuilder.ToString())
                .WithParameter("@language", language)
                .WithParameter("@packageName", packageName)
                .WithParameter("@filterType", filterType)
                .WithParameter("@isClosed", isClosed);

            var itemQueryIterator = _reviewsContainer.GetItemQueryIterator<ReviewModel>(queryDefinition);
            while (itemQueryIterator.HasMoreResults)
            {
                var result = await itemQueryIterator.ReadNextAsync();
                allReviews.AddRange(result.Resource);
            }

            return allReviews.OrderByDescending(r => r.LastUpdated);
        }

        public async Task<IEnumerable<ReviewModel>> GetReviewsAsync(string serviceName, string packageDisplayName, IEnumerable<ReviewType> filterTypes = null)
        {
            var queryStringBuilder = new StringBuilder("SELECT * FROM Reviews r WHERE r.IsClosed = false");
            queryStringBuilder.Append(" AND r.ServiceName = @serviceName");
            queryStringBuilder.Append(" AND r.PackageDisplayName = @packageDisplayName");
            if (filterTypes != null && filterTypes.Count() > 0)
            {
                var filterTypesAsInts = filterTypes.Cast<int>().ToList();
                var filterTypeAsQueryStr = ArrayToQueryString<int>(filterTypesAsInts);
                queryStringBuilder.Append($" AND r.FilterType IN {filterTypeAsQueryStr} ");
            }

            var reviews = new List<ReviewModel>();
            var queryDefinition = new QueryDefinition(queryStringBuilder.ToString())
                .WithParameter("@serviceName", serviceName)
                .WithParameter("@packageDisplayName", packageDisplayName);

            var itemQueryIterator = _reviewsContainer.GetItemQueryIterator<ReviewModel>(queryDefinition);
            while (itemQueryIterator.HasMoreResults)
            {
                var result = await itemQueryIterator.ReadNextAsync();
                reviews.AddRange(result.Resource);
            }
            return reviews.OrderBy(r => r.Name).ThenByDescending(r => r.LastUpdated);
        }

        public async Task<IEnumerable<ReviewListItemModel>> GetReviewsAssignedToUser(string userName)
        {
            var query = $"SELECT * FROM Reviews r" +
                $" JOIN ar IN r.AssignedReviewers" +
                $" WHERE ar.AssingedTo = @userName";

            var reviews = new List<ReviewListItemModel>();
            var queryDefinition = new QueryDefinition(query).WithParameter("@userName", userName);
            var itemQueryIterator = _reviewsContainer.GetItemQueryIterator<ReviewListItemModel>(queryDefinition);
            while (itemQueryIterator.HasMoreResults)
            {
                var result = await itemQueryIterator.ReadNextAsync();
                reviews.AddRange(result.Resource);
            }

            return reviews.OrderByDescending(r => r.LastUpdatedOn);
        }

        public async Task<IEnumerable<string>> GetReviewFirstLevelPropertiesAsync(string propertyName)
        {
            var query = $"SELECT DISTINCT VALUE r.{propertyName} FROM Reviews r";
            var properties = new List<string>();

            QueryDefinition queryDefinition = new QueryDefinition(query);
            using FeedIterator<string> feedIterator = _reviewsContainer.GetItemQueryIterator<string>(queryDefinition);

            while (feedIterator.HasMoreResults)
            {
                FeedResponse<string> response = await feedIterator.ReadNextAsync();
                properties.AddRange(response);
            }
            return properties;
        }

        /// <summary>
        /// Get Reviews based on search criteria
        /// </summary>
        /// <param name="search"></param>
        /// <param name="languages"></param>
        /// <param name="isClosed"></param>
        /// <param name="isApproved"></param>
        /// <param name="offset"></param>
        /// <param name="limit"></param>
        /// <param name="orderBy"></param>
        /// <returns></returns>
        public async Task<(IEnumerable<ReviewListItemModel> Reviews, int TotalCount)> GetReviewsAsync(
            IEnumerable<string> search, IEnumerable<string> languages, bool? isClosed, bool? isApproved, int offset, int limit, string orderBy)
        {
            (IEnumerable<ReviewListItemModel> Reviews, int TotalCount) result = (Reviews: new List<ReviewListItemModel>(), TotalCount: 0);

            // Build up Query
            var queryStringBuilder = new StringBuilder("SELECT * FROM Reviews r");
            queryStringBuilder.Append(" WHERE r.IsDeleted"); // Allows for appending the other query parts as AND's in any order

            if (search != null && search.Any())
            {
                var searchAsQueryStr = ArrayToQueryString<string>(search);
                var searchAsSingleString = '"' + String.Join(' ', search) + '"';

                var hasExactMatchQuery = search.Any(
                    s => (
                    s.StartsWith("package:") || 
                    s.StartsWith("author:") || 
                    s.StartsWith("name:")
                ));

                if (hasExactMatchQuery)
                {
                    foreach (var item in search)
                    {
                        if (item.StartsWith("package:"))
                        {
                            var query = '"' + $"{item.Replace("package:", "")}" + '"';
                            queryStringBuilder.Append($" AND STRINGEQUALS(r.PackageName, {query}, true)");
                        }
                        else if (item.StartsWith("author:"))
                        {
                            var query = '"' + $"{item.Replace("author:", "")}" + '"';
                            queryStringBuilder.Append($" AND STRINGEQUALS(r.CreatedBy, {query}, true)");
                        }
                        else if (item.StartsWith("name:"))
                        {
                            var query = '"' + $"{item.Replace("name:", "")}" + '"';
                            queryStringBuilder.Append($" AND CONTAINS(r.PackageName, {query}, true)");
                        }
                        else
                        {
                            var query = '"' + $"{item}" + '"';
                            queryStringBuilder.Append($" AND CONTAINS(r.PackageName, {query}, true)");
                        }
                    }
                }
                else
                {
                    queryStringBuilder.Append($" AND (r.Author IN {searchAsQueryStr}");
                    foreach (var item in search) 
                    {
                        var query = '"' + $"{item}" + '"';
                        queryStringBuilder.Append($" OR CONTAINS(r.PackageName, {query}, true)");
                    }
                    queryStringBuilder.Append($")");
                }
            }

            if (languages != null && languages.Any())
            {
                var languagesAsQueryStr = ArrayToQueryString<string>(languages);
                queryStringBuilder.Append($" AND r.Language IN {languagesAsQueryStr}");
            }

            if (isClosed != null)
            {
                queryStringBuilder.Append(" AND r.IsClosed = @isClosed");
            }

            if (isApproved != null)
            {
                queryStringBuilder.Append(" AND r.IsApproved = @isApproved");
            }

            // First get the total count to help with paging
            var countQuery = $"SELECT VALUE COUNT(1) FROM({queryStringBuilder.ToString()})";
            QueryDefinition countQueryDefinition = new QueryDefinition(countQuery)
                .WithParameter("@isClosed", isClosed)
                .WithParameter("@isApproved", isApproved);

            using FeedIterator<int> countFeedIterator = _reviewsContainer.GetItemQueryIterator<int>(countQueryDefinition);
            while (countFeedIterator.HasMoreResults)
            {
                result.TotalCount = (await countFeedIterator.ReadNextAsync()).SingleOrDefault();
            }

            queryStringBuilder.Append($" ORDER BY r.{orderBy} DESC");
            queryStringBuilder.Append(" OFFSET @offset LIMIT @limit");

            var reviews = new List<ReviewListItemModel>();
            QueryDefinition queryDefinition = new QueryDefinition(queryStringBuilder.ToString())
                .WithParameter("@isClosed", isClosed)
                .WithParameter("@isApproved", isApproved)
                .WithParameter("@offset", offset)
                .WithParameter("@limit", limit);

            using FeedIterator<ReviewListItemModel> feedIterator = _reviewsContainer.GetItemQueryIterator<ReviewListItemModel>(queryDefinition);
            while (feedIterator.HasMoreResults)
            {
                FeedResponse<ReviewListItemModel> response = await feedIterator.ReadNextAsync();
                reviews.AddRange(response);
            }
            result.Reviews = reviews;
            return result;
        }

        private static string ArrayToQueryString<T>(IEnumerable<T> items)
        {
            var result = new StringBuilder();
            result.Append("(");
            foreach (var item in items)
            {
                if (item is int)
                {
                    result.Append($"{item},");
                }
                else
                {
                    result.Append($"\"{item}\",");
                }

            }
            result.Remove(result.Length - 1, 1);
            result.Append(")");
            return result.ToString();
        }
    }
}
