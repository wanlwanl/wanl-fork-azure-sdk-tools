import { Node, SourceFile, SyntaxKind } from 'ts-morph';
import { NameNode, DetectProject } from '../../azure/common/types';

function findDeclarations<TNode extends Node>(
  detectProject: DetectProject,
  findDeclaration: (sourceFile: SourceFile) => Map<string, TNode> | undefined
): { baseline: Map<string, TNode>; current: Map<string, TNode> } {
  const baseline = findDeclaration(detectProject.baseline.getSourceFile());
  const current = findDeclaration(detectProject.current.getSourceFile());
  if (!baseline) throw new Error(`Failed to find baseline declarations`);
  if (!current) throw new Error(`Failed to find current declarations`);
  return { baseline: baseline, current: current };
}

// TODO: consider "any" keyword case, assignableTo is not enough
// TODO: pass top level declarations instead
export function findIncompatibleDeclarations(
  detectProject: DetectProject,
  findDeclaration: (sourceFile: SourceFile) => Map<string, Node> | undefined
): Set<{ baseline: NameNode; current: NameNode }> {
  const declarations = findDeclarations(detectProject, findDeclaration);
  const incompatibleDeclarations = new Set<{ baseline: NameNode; current: NameNode }>();
  declarations.baseline.forEach((baselineDeclaration, name) => {
    const currentDeclaration = declarations.current.get(name);
    if (currentDeclaration?.getType().isAssignableTo(baselineDeclaration.getType()) === false) {
      const baseline: NameNode = { name, node: baselineDeclaration };
      const current: NameNode = { name, node: currentDeclaration };
      incompatibleDeclarations.add({ baseline, current });
    }
  });
  return incompatibleDeclarations;
}

// TODO: pass top level declarations instead
export function findAddedDeclarations(
  detectProject: DetectProject,
  findDeclaration: (sourceFile: SourceFile) => Map<string, Node> | undefined
): Set<NameNode> {
  const declarations = findDeclarations(detectProject, findDeclaration);
  const addedDeclarations = new Set<NameNode>();
  declarations.current.forEach((currentDeclaration, name) => {
    if (!declarations.baseline.has(name)) addedDeclarations.add({ name, node: currentDeclaration });
  });
  return addedDeclarations;
}

// TODO: pass top level declarations instead
export function findRemovedDeclarations(
  detectProject: DetectProject,
  findDeclaration: (sourceFile: SourceFile) => Map<string, Node> | undefined
): Set<NameNode> {
  const declarations = findDeclarations(detectProject, findDeclaration);
  const removedDeclarations = new Set<NameNode>();
  declarations.baseline.forEach((baselineDeclaration, name) => {
    if (!declarations.current.has(name)) removedDeclarations.add({ name, node: baselineDeclaration });
  });
  return removedDeclarations;
}

// TODO: remove, ts-morph is enough
export function getTopLevelDeclarations(sourceFile: SourceFile): Map<SyntaxKind, Map<string, Node>> {
  const map = new Map<SyntaxKind, Map<string, Node>>();
  const statements = sourceFile.getStatements();
  statements.forEach((s) => {
    const kind = s.getKind();

    let name: string;
    if (Node.isNameable(s) && s.getName()) name = s.getName()!;
    else name = s.getText();

    if (!map.has(kind)) map.set(kind, new Map<string, Node>());
    map.get(kind)!.set(name, s);
  });
  return map;
}
