import { RuleListener } from '@typescript-eslint/utils/eslint-utils';
import { CreateOperationRule, DetectProject, PatchMessage, RuleMessageKind } from '../types';

import { RuleContext } from '@typescript-eslint/utils/ts-eslint';
import { SourceFile, SyntaxKind, TypeAliasDeclaration, UnionTypeNode } from 'ts-morph';
import { RuleIds } from '../../../common/models/rules/rule-ids';
import { getSettings } from '../../../utils/common-utils';
import { createOperationRuleListener } from '../../utils/azure-rule-utils';
import { findIncompatibleDeclarations, getTopLevelDeclarations } from '../../../common/utils/ast-utils';

function findUnionTypes(root: SourceFile): Map<string, UnionTypeNode> {
  const typeAliasSet = getTopLevelDeclarations(root).get(SyntaxKind.TypeAliasDeclaration);
  const typeAliases: TypeAliasDeclaration[] = [];
  typeAliasSet?.forEach((s) => typeAliases.push(s.asKindOrThrow(SyntaxKind.TypeAliasDeclaration)));
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
    incompatibleTypeAlias: new Set<string>(Array.from(incompatibleTypeAlias).map(({ name }) => name)),
    kind: RuleMessageKind.PatchMessage,
    id: RuleIds.testRule,
  };

  return createOperationRuleListener(
    RuleIds.testRule,
    (context: RuleContext<string, readonly unknown[]>): RuleListener => {
      getSettings(context).report(patchMessage);
      return {};
    }
  );
};
export default rule;
