import { Node, SourceFile } from 'ts-morph';
import { DetectProject } from '../../azure/common/types';

export function findIncompatibleDeclarations<TNode extends Node>(
  detectProject: DetectProject,
  findDeclaration: (sourceFile: SourceFile) => Map<string, TNode>
): Set<string> {
  const baselineDeclarations = findDeclaration(detectProject.baseline.getSourceFile());
  const currentDeclarations = findDeclaration(detectProject.current.getSourceFile());
  const incompatibleDeclarations = new Set<string>();
  baselineDeclarations.forEach((baselineDeclaration, name) => {
    const currentDeclaration = currentDeclarations.get(name);
    if (!currentDeclaration?.getType().isAssignableTo(baselineDeclaration.getType())) {
      incompatibleDeclarations.add(name);
    }
  });
  return incompatibleDeclarations;
}
