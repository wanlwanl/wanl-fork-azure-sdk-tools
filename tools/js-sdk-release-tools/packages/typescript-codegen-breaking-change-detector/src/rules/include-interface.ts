import { RuleListener } from '@typescript-eslint/utils/eslint-utils';
import {
  BreakingPair,
  BreakingReasons,
  CreateOperationRule,
  DetectProject,
  PatchMessage,
  RuleMessageKind,
} from '../azure/common/types';

import { RuleContext } from '@typescript-eslint/utils/ts-eslint';
import { Node, SourceFile, SyntaxKind } from 'ts-morph';
import { RuleIds } from '../common/models/rules/rule-ids';
import { getSettings, turbolog, turbologDetails } from '../utils/common-utils';
import { createOperationRuleListener } from '../azure/utils/azure-rule-utils';
import {
  findAddedDeclarations,
  findIncompatibleDeclarations,
  findRemovedDeclarations,
  getTopLevelDeclarations,
} from '../common/utils/ast-utils';
import { findInterfaceBreakingChanges } from '../azure/core/breaking-change-finder';

function findInterfaceTypes(root: SourceFile): Map<string, Node> | undefined {
  return getTopLevelDeclarations(root).get(SyntaxKind.InterfaceDeclaration);
}

const rule: CreateOperationRule = (_, detectProject: DetectProject) => {
  const incompatibleInterfaces = findIncompatibleDeclarations(detectProject, findInterfaceTypes);
  const removedInterfaces = findRemovedDeclarations(detectProject, findInterfaceTypes);
  removedInterfaces.forEach((i) => turbolog(`name: `, i.name));
  
  const interfaceChangeSet = new Map<string, BreakingPair[]>();

  incompatibleInterfaces.forEach((i) => {
    const baseline = i.baseline.node.asKindOrThrow(SyntaxKind.InterfaceDeclaration);
    const current = i.current.node.asKindOrThrow(SyntaxKind.InterfaceDeclaration);
    const breakingChanges = findInterfaceBreakingChanges(baseline, current);
    if (breakingChanges.length === 0) throw new Error(`Failed to find breaking changes for (${i.baseline.name}, ${i.current.name})`);
    interfaceChangeSet.set(i.current.name, breakingChanges);
  });

  // debug
  interfaceChangeSet.forEach((bc, name) => {
    console.log('--- interface breaking change:');
    const res = bc.map(b => { 
      return ({ 'name:': name, 'children:': b.current?.name, 'location:': b.location, 'reasons:': b.reasons });
    })
    console.log(res)
  })

  // TODO: add message
  const patchMessage: PatchMessage = {
    breakingChanges: interfaceChangeSet,
    kind: RuleMessageKind.PatchMessage,
    id: RuleIds.includeInterface,
  };

  const listener = createOperationRuleListener(
    RuleIds.includeInterface,
    (context: RuleContext<string, readonly unknown[]>): RuleListener => {
      getSettings(context).report(patchMessage);
      return {};
    }
  );
  return listener;
};
export default rule;
