// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Collections.Immutable;
using System.Text.RegularExpressions;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.Diagnostics;

namespace Azure.ClientSdk.Analyzers.ModelName
{
    /// <summary>
    /// Analyzer to check general model name suffix issues.
    /// </summary>
    [DiagnosticAnalyzer(LanguageNames.CSharp)]
    public class GeneralSuffixAnalyzer : SuffixAnalyzerBase
    {
        public const string DiagnosticId = nameof(AZC0030);

        private static readonly string messageFormat = "Model name '{0}' ends with '{1}'. Suggest to rename it to {2} or any other appropriate name.";

        private static readonly ImmutableHashSet<string> reservedNames = ImmutableHashSet.Create("ErrorResponse");

        private static readonly DiagnosticDescriptor AZC0030 = new DiagnosticDescriptor(DiagnosticId, Title,
            messageFormat, DiagnosticCategory.Naming, DiagnosticSeverity.Warning, isEnabledByDefault: true,
            description: Description);

        // Avoid to use suffixes "Request(s)", "Parameter(s)", "Option(s)", "Response(s)", "Collection"
        private static readonly Regex generalSuffixRegex = new Regex(".+(?<Suffix>(Requests?)|(Responses?)|(Parameters?)|(Options?)|(Collection))$");

        public override ImmutableArray<DiagnosticDescriptor> SupportedDiagnostics { get { return ImmutableArray.Create(AZC0030); } }

        protected override bool ShouldSkip(INamedTypeSymbol symbol, SymbolAnalysisContext context) => reservedNames.Contains(symbol.Name);

        protected override Regex SuffixRegex => generalSuffixRegex;
        protected override Diagnostic GetDiagnostic(INamedTypeSymbol typeSymbol, string suffix, SymbolAnalysisContext context)
        {
            var name = typeSymbol.Name;
            var suggestedName = GetSuggestedName(name, suffix);
            return Diagnostic.Create(AZC0030, context.Symbol.Locations[0],
                new Dictionary<string, string> { { "SuggestedName", suggestedName } }.ToImmutableDictionary(), name, suffix, suggestedName);
        }

        private string GetSuggestedName(string originalName, string suffix)
        {
            var nameWithoutSuffix = originalName.Substring(0, originalName.Length - suffix.Length);
            return suffix switch
            {
                "Request" or "Requests" => $"'{nameWithoutSuffix}Content'",
                "Parameter" or "Parameters" => $"'{nameWithoutSuffix}Content' or '{nameWithoutSuffix}Patch'",
                "Option" or "Options" => $"'{nameWithoutSuffix}Config'",
                "Response" => $"'{nameWithoutSuffix}Result'",
                "Responses" => $"'{nameWithoutSuffix}Results'",
                "Collection" => $"'{nameWithoutSuffix}Group' or '{nameWithoutSuffix}List'",
                _ => nameWithoutSuffix,
            };
        }
    }
}
