import { RuleListener } from '@typescript-eslint/utils/eslint-utils';
import { CreateOperationRule, DetectProject, PatchMessage, RuleMessageKind } from '../types';

import { RuleContext } from '@typescript-eslint/utils/ts-eslint';
import { SourceFile, SyntaxKind, UnionTypeNode } from 'ts-morph';
import { RuleIds } from '../../../common/models/rules/rule-ids';
import { getSettings } from '../../../utils/common-utils';
import { createOperationRuleListener } from '../../utils/azure-rule-utils';
import { findIncompatibleDeclarations } from '../../../common/utils/ast-utils';

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

const rule: CreateOperationRule = (_, detectProject: DetectProject) => {
  const incompatibleTypeAlias = findIncompatibleDeclarations(detectProject, findUnionTypes);
  const patchMessage: PatchMessage = {
    incompatibleTypeAlias,
    kind: RuleMessageKind.PatchMessage,
    id: RuleIds.includeUnionTypeAlias,
  };

  return createOperationRuleListener(
    RuleIds.includeUnionTypeAlias,
    (context: RuleContext<string, readonly unknown[]>): RuleListener => {
      getSettings(context).report(patchMessage);
      return {};
    }
  );
};
export default rule;
