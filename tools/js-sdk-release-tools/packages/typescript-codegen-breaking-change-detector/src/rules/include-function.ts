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
import { getSettings, turbolog } from '../utils/common-utils';
import { createOperationRuleListener } from '../azure/utils/azure-rule-utils';
import {
  findIncompatibleDeclarations,
  findRemovedDeclarations,
  getTopLevelDeclarations,
} from '../common/utils/ast-utils';
import { findFunctionBreakingChanges } from '../azure/core/breaking-change-finder';

function findFunctionTypes(root: SourceFile): Map<string, Node> | undefined {
  const normalFunctions = getTopLevelDeclarations(root).get(SyntaxKind.FunctionDeclaration);
  // const arrowFunctions: Map<string, Node> | undefined = new Map<string, Node>();
  // getTopLevelDeclarations(root)
  //   .get(SyntaxKind.VariableStatement)
  //   ?.forEach((stat) => {
  //     stat
  //       .asKindOrThrow(SyntaxKind.VariableStatement)
  //       .getDeclarations()
  //       .forEach((decl) => {
  //         console.log(`)))))))))))))))))))))))) --- decl: ${decl?.getText()}`);

  //         const arrowFunction = decl
  //           .asKindOrThrow(SyntaxKind.VariableDeclaration)
  //           .getInitializer()
  //           ?.asKind(SyntaxKind.ArrowFunction);
  //         console.log(`)))))))))))))))))))))))) --- arrow: ${arrowFunction?.getText()}`);
  //         if (arrowFunction!) return;
  //         arrowFunctions.set(decl.getText(), arrowFunction!);
  //       });
  //   });
  return normalFunctions;
  // return new Map<string, Node>([...normalFunctions!.entries(), ...arrowFunctions.entries()]);
}

const rule: CreateOperationRule = (_, detectProject: DetectProject) => {
  const incompatibleFunctions = findIncompatibleDeclarations(detectProject, findFunctionTypes);

  const removedFunctions = findRemovedDeclarations(detectProject, findFunctionTypes);
  turbolog(`🚀 \t file: include-function.ts:31 \t removedFunctions `);
  removedFunctions.forEach((i) => turbolog(`name: `, i.name));

  const functionChangeSet = new Map<string, BreakingPair[]>();

  incompatibleFunctions.forEach((i) => {
    console.log(`
      ******** incompa func
        baseline: ${i.baseline.node.getText()}
      `);
    const baseline = i.baseline.node.asKindOrThrow(SyntaxKind.FunctionDeclaration);
    const current = i.current.node.asKindOrThrow(SyntaxKind.FunctionDeclaration);
    const breakingChanges = findFunctionBreakingChanges(baseline, current);
    if (breakingChanges.length === 0)
      throw new Error(`Failed to find breaking changes for (${i.baseline.name}, ${i.current.name})`);
    functionChangeSet.set(i.current.name, breakingChanges);
  });

  incompatibleFunctions.forEach((i) => {
    console.log('--- function incompatible: ', i.current.name);
  });

  functionChangeSet.forEach((bc, name) => {
    console.log('--- function breaking change:');
    const res = bc.map((b) => {
      return { 'name:': name, 'children:': b.current?.name, 'location:': b.location, 'reasons:': b.reasons };
    });
    console.log(res);
  });

  const listener = createOperationRuleListener(
    RuleIds.includeFunction,
    (context: RuleContext<string, readonly unknown[]>): RuleListener => {
      // TODO: report message
      // getSettings(context).report(patchMessage);
      return {};
    }
  );
  return listener;
};
export default rule;
