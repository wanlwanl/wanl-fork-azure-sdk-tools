using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using ApiView;
using APIViewWeb.Managers.Interfaces;
using APIViewWeb.Repositories;
using Microsoft.CodeAnalysis.Host;

namespace APIViewWeb.Managers
{
    public class CodeFileManager : ICodeFileManager
    {
        private readonly IEnumerable<LanguageService> _languageServices;
        private readonly IBlobCodeFileRepository _codeFileRepository;
        private readonly IBlobOriginalsRepository _originalsRepository;
        public CodeFileManager(
            IEnumerable<LanguageService> languageServices, IBlobCodeFileRepository codeFileRepository,
            IBlobOriginalsRepository originalsRepository)
        {
            _originalsRepository = originalsRepository;
            _codeFileRepository = codeFileRepository;
            _languageServices = languageServices;
        }

        /// <summary>
        /// Create Code File
        /// </summary>
        /// <param name="revisionId"></param>
        /// <param name="originalName"></param>
        /// <param name="fileStream"></param>
        /// <param name="runAnalysis"></param>
        /// <param name="language"></param>
        /// <returns></returns>
        public async Task<APICodeFileModel> CreateCodeFileAsync(
            string revisionId,
            string originalName,
            Stream fileStream,
            bool runAnalysis,
            string language)
        {
            using var memoryStream = new MemoryStream();
            var codeFile = await CreateCodeFileAsync(originalName, fileStream, runAnalysis, memoryStream, language);
            var reviewCodeFileModel = await CreateReviewCodeFileModel(revisionId, memoryStream, codeFile);
            reviewCodeFileModel.FileName = originalName;
            return reviewCodeFileModel;
        }

        /// <summary>
        /// Create Code File
        /// </summary>
        /// <param name="originalName"></param>
        /// <param name="fileStream"></param>
        /// <param name="runAnalysis"></param>
        /// <param name="memoryStream"></param>
        /// <param name="language"></param>
        /// <returns></returns>
        public async Task<CodeFile> CreateCodeFileAsync(
            string originalName,
            Stream fileStream,
            bool runAnalysis,
            MemoryStream memoryStream,
            string language = null)
        {
            var languageService = _languageServices.FirstOrDefault(s => (language != null ? s.Name == language : s.IsSupportedFile(originalName)));
            if (fileStream != null)
            {
                await fileStream.CopyToAsync(memoryStream);
                memoryStream.Position = 0;
            }
            CodeFile codeFile = null;
            if (languageService.IsReviewGenByPipeline)
            {
                codeFile = languageService.GetReviewGenPendingCodeFile(originalName);
            }
            else
            {
                codeFile = await languageService.GetCodeFileAsync(
                originalName,
                memoryStream,
                runAnalysis);
            }
            return codeFile;
        }

        /// <summary>
        /// Create Code File
        /// </summary>
        /// <param name="revisionId"></param>
        /// <param name="memoryStream"></param>
        /// <param name="codeFile"></param>
        /// <returns></returns>
        public async Task<APICodeFileModel> CreateReviewCodeFileModel(string revisionId, MemoryStream memoryStream, CodeFile codeFile)
        {
            var reviewCodeFileModel = new APICodeFileModel
            {
                HasOriginal = true,
            };

            InitializeFromCodeFile(reviewCodeFileModel, codeFile);
            if (memoryStream != null)
            {
                memoryStream.Position = 0;
                await _originalsRepository.UploadOriginalAsync(reviewCodeFileModel.FileId, memoryStream);
            }
            await _codeFileRepository.UpsertCodeFileAsync(revisionId, reviewCodeFileModel.FileId, codeFile);
            return reviewCodeFileModel;
        }

        private void InitializeFromCodeFile(APICodeFileModel file, CodeFile codeFile)
        {
            file.Language = codeFile.Language;
            file.LanguageVariant = codeFile.LanguageVariant;
            file.VersionString = codeFile.VersionString;
            file.Name = codeFile.Name;
            file.PackageName = codeFile.PackageName;
        }
    }
}
