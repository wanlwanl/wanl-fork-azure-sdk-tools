// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Xml.Linq;
using ApiView;
using APIView.DIff;
using APIView.Model;
using Markdig.Syntax.Inlines;
using Microsoft.Azure.Cosmos.Serialization.HybridRow;
using Octokit;

namespace APIViewWeb.Models
{
    public enum RenderType { Normal, ReadOnly, Text }

    public class RenderedCodeFile
    {
        private CodeLine[] _rendered;
        private CodeLine[] _renderedReadOnly;
        private CodeLine[] _renderedText;

        public RenderedCodeFile(CodeFile codeFile)
        {
            CodeFile = codeFile;
        }

        public CodeFile CodeFile { get; }
        public RenderResult RenderResult { get; private set; }

        public CodeLine[] Render(bool showDocumentation)
        {
            //Always render when documentation is requested to avoid cach thrashing
            if (showDocumentation)
            {
                return CodeFileHtmlRenderer.Normal.Render(CodeFile, showDocumentation: true).CodeLines;
            }

            if (_rendered == null)
            {
                RenderResult = CodeFileHtmlRenderer.Normal.Render(CodeFile);
                _rendered = RenderResult.CodeLines;
            }

            return _rendered;
        }

        public CodeLine[] RenderReadOnly(bool showDocumentation)
        {
            if (showDocumentation)
            {
                return CodeFileHtmlRenderer.ReadOnly.Render(CodeFile, showDocumentation: true).CodeLines;
            }

            if (_renderedReadOnly == null)
            {
                RenderResult = CodeFileHtmlRenderer.ReadOnly.Render(CodeFile);
                _renderedReadOnly = RenderResult.CodeLines;
            }

            return _renderedReadOnly;
        }

        internal CodeLine[] RenderText(bool showDocumentation, bool skipDiff = false)
        {
            if (showDocumentation || skipDiff)
            {
                RenderResult = CodeFileRenderer.Instance.Render(CodeFile, showDocumentation: showDocumentation, enableSkipDiff: skipDiff);
                return RenderResult.CodeLines;
            }

            if (_renderedText == null)
            {
                RenderResult = CodeFileRenderer.Instance.Render(CodeFile);
                _renderedText = RenderResult.CodeLines;
            }

            return _renderedText;
        }

        public CodeLine[] GetCodeLineSection(int sectionId = 0, RenderType renderType = RenderType.Normal, bool skipDiff = false)
        {
            var result = new List<CodeLine>();
                
            if (RenderResult.Sections.Count > sectionId)
            {
                var section = RenderResult.Sections[sectionId];

                using (IEnumerator<TreeNode<CodeLine>> enumerator = section.GetEnumerator())
                {
                    enumerator.MoveNext();
                    while (enumerator.MoveNext())
                    {
                        var node = enumerator.Current;
                        var lineClass = new List<string>();
                        var indent = node.Level;

                        // Add classes for managing tree hierachy
                        if (node.Children.Count > 0)
                            lineClass.Add($"lvl_{node.Level}_parent_{node.PositionAmongSiblings}");

                        if (!node.IsRoot)
                            lineClass.Add($"lvl_{node.Level}_child_{node.PositionAmongSiblings}");

                        if (node.Level > 1)
                            lineClass.Add("d-none");

                        var lineClasses = String.Join(' ', lineClass);

                        if (!String.IsNullOrWhiteSpace(node.Data.LineClass))
                            lineClasses = node.Data.LineClass.Trim() + $" {lineClasses}";

                        if (node.IsLeaf)
                        {
                            CodeLine[] renderedLeafSection = GetDetachedLeafSectionLines(node, renderType: renderType, skipDiff: skipDiff);

                            if (renderedLeafSection.Length > 0)
                            {
                                var placeHolderLineNumber = node.Data.LineNumber;
                                int index = 0;
                                foreach (var codeLine in renderedLeafSection)
                                {
                                    index++;
                                    lineClasses = Regex.Replace(lineClasses, @"_child_[0-9]+", $"_child_{index}");
                                    if (!String.IsNullOrWhiteSpace(codeLine.LineClass))
                                    {
                                        lineClasses = codeLine.LineClass.Trim() + $" {lineClasses}";
                                    }
                                    result.Add(new CodeLine(codeLine, lineClass: lineClasses, lineNumber: placeHolderLineNumber, indent: indent));
                                    placeHolderLineNumber++;
                                }
                            }
                            else
                            {
                                result.Add(new CodeLine(node.Data, lineClass: lineClasses, indent: indent));
                            }
                        }
                        else
                        {
                            result.Add(new CodeLine(node.Data, lineClass: lineClasses, indent: indent));
                        }
                    }
                }
            }
            return result.ToArray();
        }

        public InlineDiffLine<CodeLine>[] GetDiffCodeLineSection(TreeNode<InlineDiffLine<CodeLine>> sectionNode, RenderType renderType = RenderType.Normal, bool skipDiff = false)
        {
            var result = new List<InlineDiffLine<CodeLine>>();

            using (IEnumerator<TreeNode<InlineDiffLine<CodeLine>>> enumerator = sectionNode.GetEnumerator())
            {
                TreeNode<InlineDiffLine<CodeLine>> detachedLeafParent = null;
                InlineDiffLine<CodeLine> diffLine;
                int ? detachedLeafParentLineNo = null;

                enumerator.MoveNext();
                while (enumerator.MoveNext())
                {
                    var node = enumerator.Current;
                    if (node.WasDetachedLeafParent)
                    {
                        detachedLeafParent = node;
                        detachedLeafParentLineNo = detachedLeafParent.Data.Line.LineNumber;
                        continue;
                    }

                    if (!node.IsLeaf)
                    {
                        detachedLeafParent = null;
                        detachedLeafParentLineNo = null;
                    }

                    var lineClass = new List<string>();
                    var level = (detachedLeafParent == null) ? node.Level : node.Level - 1;

                    // Add classes for managing tree hierachy
                    if (node.Children.Count > 0)
                        lineClass.Add($"lvl_{level}_parent_{node.PositionAmongSiblings}");

                    if (!node.IsRoot)
                        lineClass.Add($"lvl_{level}_child_{node.PositionAmongSiblings}");

                    if (level > 1)
                        lineClass.Add("d-none");

                    var lineClasses = String.Join(' ', lineClass);

                    if (!String.IsNullOrWhiteSpace(node.Data.Line.LineClass))
                        lineClasses = node.Data.Line.LineClass.Trim() + $" {lineClasses}";

                    if (detachedLeafParent != null && detachedLeafParent.IsParentOf(node))
                    {
                        diffLine = new InlineDiffLine<CodeLine>(new CodeLine(node.Data.Line, lineClass: lineClasses, lineNumber: detachedLeafParentLineNo, indent: level), node.Data.Kind);
                        result.Add(diffLine);
                        detachedLeafParentLineNo++;
                    }
                    else
                    {
                        diffLine = new InlineDiffLine<CodeLine>(new CodeLine(node.Data.Line, lineClass: lineClasses, indent: level), node.Data.Kind);
                        result.Add(diffLine);
                    }
                }
            }
            return result.ToArray();
        }

        public TreeNode<CodeLine> GetCodeLineSectionRoot(int sectionId)
        {
            if (RenderResult.Sections.Count > sectionId)
            {
                return RenderResult.Sections[sectionId];
            }
            return null;
        }

        public CodeLine[] GetDetachedLeafSectionLines(TreeNode<CodeLine> parentNode, RenderType renderType = RenderType.Normal, bool skipDiff = false)
        {
            int leafSectionId;
            bool parseWorked = Int32.TryParse(parentNode.Data.DisplayString, out leafSectionId);
            CodeLine[] renderedLeafSection = new CodeLine[] { };

            if (parseWorked && CodeFile.LeafSections.Count > leafSectionId)
            {
                var leafSection = CodeFile.LeafSections[leafSectionId];

                if (renderType == RenderType.Normal)
                {
                    renderedLeafSection = CodeFileHtmlRenderer.Normal.Render(leafSection);
                }
                else if (renderType == RenderType.Text)
                {
                    renderedLeafSection = CodeFileHtmlRenderer.Instance.Render(leafSection, enableSkipDiff: skipDiff);
                }
                else
                {
                    renderedLeafSection = CodeFileHtmlRenderer.ReadOnly.Render(leafSection);
                }

            }
            return renderedLeafSection;
        }
    }
}
