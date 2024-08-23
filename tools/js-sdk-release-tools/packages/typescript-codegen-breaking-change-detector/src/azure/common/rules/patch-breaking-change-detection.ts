import { RuleListener } from '@typescript-eslint/utils/eslint-utils';
import {
  CreateOperationRule,
  DetectProject, PatchMessage
} from '../types';

import { RuleContext } from '@typescript-eslint/utils/ts-eslint';
import { SourceFile, SyntaxKind, UnionTypeNode } from 'ts-morph';
import { RuleIds } from '../../../common/models/rules/rule-ids';
import { getSettings } from '../../../utils/common-utils';
import { createOperationRuleListener } from '../../utils/azure-rule-utils';

function findUnionTypes(root: SourceFile): Map<string, UnionTypeNode> {
  const typeAliases = root
    .getStatements()
    .filter((s) => s.getKind() === SyntaxKind.TypeAliasDeclaration)
    .map((s) => s.asKindOrThrow(SyntaxKind.TypeAliasDeclaration));
  const unionTypes = typeAliases
    .filter((s) => s.getTypeNode()?.getKind() === SyntaxKind.UnionType)
    .reduce((map, s) => {
      const union = s.getTypeNode()!.asKindOrThrow(SyntaxKind.UnionType);
      map.set(s.getName(), union);
      return map;
    }, new Map<string, UnionTypeNode>());
  return unionTypes;
}

function findIncompatibleTypeAlias(detectProject: DetectProject): Set<string> {
  const baselineUnionTypes = findUnionTypes(detectProject.baseline.getSourceFile());
  const currentUnionTypes = findUnionTypes(detectProject.current.getSourceFile());
  const incompatibleTypeAlias = new Set<string>();
  baselineUnionTypes.forEach((baselineUnion, name) => {
    const currentUnion = currentUnionTypes.get(name);
    if (!currentUnion?.getType().isAssignableTo(baselineUnion.getType())) {
      incompatibleTypeAlias.add(name);
    }
  });
  return incompatibleTypeAlias;
}

const rule: CreateOperationRule = (_, detectProject: DetectProject) => {
  const incompatibleTypeAlias = findIncompatibleTypeAlias(detectProject);
  const patchMessage = <PatchMessage>{ incompatibleTypeAlias };

  return createOperationRuleListener(
    RuleIds.patchBreakingChangeDetection,
    (context: RuleContext<string, readonly unknown[]>): RuleListener => {
      getSettings(context).report(patchMessage);
      return {};
    }
  );
};
export default rule;