using APIViewWeb;
using System.Collections.Generic;
using APIViewWeb.Models;
using APIViewWeb.Repositories;
using System.Linq;
using Microsoft.Azure.Cosmos.Serialization.HybridRow;

namespace APIViewWeb.Helpers
{
    public static class PageModelHelpers
    {
        public static UserPreferenceModel GetUserPreference(UserPreferenceCache preferenceCache, string userName)
        {
            return preferenceCache.GetUserPreferences(userName).Result;
        }
    }
}
