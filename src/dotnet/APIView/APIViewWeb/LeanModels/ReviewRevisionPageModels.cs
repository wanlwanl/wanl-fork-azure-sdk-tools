using System.Collections.Generic;
using ApiView;
using APIView;

namespace APIViewWeb.LeanModels
{
    public class ReviewContentModel
    {
        public ReviewListItemModel Review { get; set; }
        public NavigationItem[] Navigation { get; set; }
        public CodeLine[] codeLines { get; set; }
        public Dictionary<string, List<ReviewRevisionListItemModel>> ReviewRevisions { get; set; }
        public ReviewRevisionListItemModel ActiveRevision { get; set; }
    }

    public class CodeFileModel
    {
        public string ReviewFileId { get; set; }
        public string Name { get; set; }
    }
}
