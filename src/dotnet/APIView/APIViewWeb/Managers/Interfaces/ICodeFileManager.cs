using System.IO;
using System.Threading.Tasks;
using ApiView;

namespace APIViewWeb.Managers.Interfaces
{
    public interface ICodeFileManager
    {
        public Task<APICodeFileModel> CreateCodeFileAsync(string revisionId, string originalName, Stream fileStream, bool runAnalysis, string language);
        public Task<CodeFile> CreateCodeFileAsync(string originalName, Stream fileStream, bool runAnalysis, MemoryStream memoryStream, string language = null);
        public Task<APICodeFileModel> CreateReviewCodeFileModel(string revisionId, MemoryStream memoryStream, CodeFile codeFile);

    }
}
