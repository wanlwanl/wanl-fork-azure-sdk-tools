// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package cmd

import (
	"errors"
	"fmt"
	"go/ast"
	"io/fs"
	"os"
	"path"
	"path/filepath"
	"strings"

	"golang.org/x/mod/modfile"
)

// indexTestdata allows tests to index this module's testdata
// (we never want to do that for real reviews)
var indexTestdata bool

// sdkDirName allows tests to set the name of the assumed common
// directory of all Azure SDK modules, which enables tests to
// pass without the code below having to compute this directory
var sdkDirName = "sdk"

// Module collects the data required to describe an Azure SDK module's public API.
type Module struct {
	Name string

	// packages maps import paths to packages
	packages map[string]*Pkg
}

// NewModule indexes an Azure SDK module's ASTs
func NewModule(dir string) (*Module, error) {
	mf, err := parseModFile(dir)
	if err != nil {
		return nil, err
	}
	// sdkRoot is the path on disk to the sdk folder e.g. /home/user/me/azure-sdk-for-go/sdk.
	// Used to find definitions of types imported from other Azure SDK modules.
	sdkRoot := ""
	if before, _, found := strings.Cut(dir, fmt.Sprintf("%s%c", sdkDirName, filepath.Separator)); found {
		sdkRoot = filepath.Join(before, sdkDirName)
	}
	m := Module{Name: filepath.Base(dir), packages: map[string]*Pkg{}}

	baseImportPath := path.Dir(mf.Module.Mod.Path) + "/"
	err = filepath.WalkDir(dir, func(path string, d fs.DirEntry, err error) error {
		if d.IsDir() {
			if !indexTestdata && strings.Contains(path, "testdata") {
				return filepath.SkipDir
			}
			p, err := NewPkg(path, m.Name)
			if err == nil {
				m.packages[baseImportPath+p.Name()] = p
			} else if !errors.Is(err, ErrNoPackages) {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	for _, p := range m.packages {
		p.Index()
	}

	// Add the definitions of types exported by alias to each package's content. For example,
	// given "type TokenCredential = shared.TokenCredential" in package azcore, this will hoist
	// the definition from azcore/internal/shared into the APIView for azcore, making the type's
	// fields visible there.
	externalPackages := map[string]*Pkg{}
	for _, p := range m.packages {
		for alias, qn := range p.typeAliases {
			// qn is a type name qualified with import path like
			// "github.com/Azure/azure-sdk-for-go/sdk/azcore/internal/shared.TokenRequestOptions"
			impPath := qn[:strings.LastIndex(qn, ".")]
			typeName := qn[len(impPath)+1:]
			var source *Pkg
			var ok bool
			if source, ok = m.packages[impPath]; !ok {
				// must be a package external to this module
				if source, ok = externalPackages[impPath]; !ok && sdkRoot != "" {
					// figure out a path to the package, index it
					if _, after, found := strings.Cut(impPath, "azure-sdk-for-go/sdk/"); found {
						path := filepath.Join(sdkRoot, after)
						pkg, err := NewPkg(path, after)
						if err == nil {
							pkg.Index()
							externalPackages[impPath] = pkg
							source = pkg
						} else {
							// types from this module will appear in the review without their definitions
							fmt.Printf("couldn't parse %s: %v\n", impPath, err)
						}
					}
				}
			}

			level := DiagnosticLevelInfo
			originalName := qn
			if _, after, found := strings.Cut(qn, m.Name); found {
				originalName = strings.TrimPrefix(after, "/")
			} else {
				// this type is defined in another module
				level = DiagnosticLevelWarning
			}

			var t TokenMaker
			if source == nil {
				t = p.c.addSimpleType(*p, alias, p.Name(), originalName)
			} else if def, ok := source.types[typeName]; ok {
				switch n := def.n.Type.(type) {
				case *ast.InterfaceType:
					t = p.c.addInterface(*def.p, alias, p.Name(), n)
				case *ast.StructType:
					t = p.c.addStruct(*def.p, alias, p.Name(), def.n)
				case *ast.Ident:
					t = p.c.addSimpleType(*p, alias, p.Name(), def.n.Type.(*ast.Ident).Name)
				default:
					fmt.Printf("unexpected node type %T\n", def.n.Type)
					t = p.c.addSimpleType(*p, alias, p.Name(), originalName)
				}
			} else {
				fmt.Println("found no definition for " + qn)
			}
			if t != nil {
				p.diagnostics = append(p.diagnostics, Diagnostic{
					Level:    level,
					TargetID: t.ID(),
					Text:     aliasFor + originalName,
				})
			}
		}
	}
	return &m, nil
}

func parseModFile(dir string) (*modfile.File, error) {
	path := filepath.Join(dir, "go.mod")
	content, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	return modfile.Parse(path, content, nil)
}
