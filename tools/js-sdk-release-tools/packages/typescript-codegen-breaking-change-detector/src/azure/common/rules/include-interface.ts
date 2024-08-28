import { RuleListener } from '@typescript-eslint/utils/eslint-utils';
import { CreateOperationRule, DetectProject, PatchMessage, RuleMessageKind } from '../types';

import { RuleContext } from '@typescript-eslint/utils/ts-eslint';
import { InterfaceDeclaration, SourceFile, SyntaxKind } from 'ts-morph';
import { RuleIds } from '../../../common/models/rules/rule-ids';
import { getSettings } from '../../../utils/common-utils';
import { createOperationRuleListener } from '../../utils/azure-rule-utils';
import { findIncompatibleDeclarations } from '../../../common/utils/ast-utils';

function findInterfaceTypes(root: SourceFile): Map<string, InterfaceDeclaration> {
  const interfaces = root
    .getStatements()
    .filter((s) => s.getKind() === SyntaxKind.InterfaceDeclaration)
    .reduce((map, s) => {
      const itf = s.asKindOrThrow(SyntaxKind.InterfaceDeclaration);
      map.set(itf.getName(), itf);
      return map;
    }, new Map<string, InterfaceDeclaration>());
  return interfaces;
}

const rule: CreateOperationRule = (_, detectProject: DetectProject) => {
  const incompatibleInterfaces = findIncompatibleDeclarations(detectProject, findInterfaceTypes);
  const patchMessage: PatchMessage = {
    incompatibleInterfaces,
    kind: RuleMessageKind.PatchMessage,
    id: RuleIds.includeInterface,
  };

  return createOperationRuleListener(
    RuleIds.includeInterface,
    (context: RuleContext<string, readonly unknown[]>): RuleListener => {
      getSettings(context).report(patchMessage);
      return {};
    }
  );
};
export default rule;
