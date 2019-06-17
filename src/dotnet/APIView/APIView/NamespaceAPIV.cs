﻿using Microsoft.CodeAnalysis;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Text;

namespace APIView
{
    /// <summary>
    /// Class representing a C# namespace. Each namespace can contain named types 
    /// and/or other namespaces.
    /// 
    /// NamespaceAPIV is an immutable, thread-safe type.
    /// </summary>
    public class NamespaceAPIV
    {
        public string Name { get; }

        public ImmutableArray<NamedTypeAPIV> NamedTypes { get; }
        public ImmutableArray<NamespaceAPIV> Namespaces { get; }

        /// <summary>
        /// Construct a new NamespaceAPIV instance, represented by the provided symbol.
        /// </summary>
        /// <param name="symbol">The symbol representing the namespace.</param>
        public NamespaceAPIV(INamespaceSymbol symbol)
        {
            this.Name = symbol.Name;

            List<NamedTypeAPIV> namedTypes = new List<NamedTypeAPIV>();
            List<NamespaceAPIV> namespaces = new List<NamespaceAPIV>();

            foreach (var memberSymbol in symbol.GetMembers().OfType<INamespaceOrTypeSymbol>())
            {
                if (memberSymbol.DeclaredAccessibility != Accessibility.Public) continue;

                if (memberSymbol is INamedTypeSymbol nt) namedTypes.Add(new NamedTypeAPIV(nt));

                else if (memberSymbol is INamespaceSymbol ns) namespaces.Add(new NamespaceAPIV(ns));
            }

            this.NamedTypes = namedTypes.ToImmutableArray();
            this.Namespaces = namespaces.ToImmutableArray();
        }

        public override string ToString()
        {
            var returnString = new StringBuilder();
            TreeRendererAPIV.RenderText(this, returnString);
            return returnString.ToString();
        }
    }
}
