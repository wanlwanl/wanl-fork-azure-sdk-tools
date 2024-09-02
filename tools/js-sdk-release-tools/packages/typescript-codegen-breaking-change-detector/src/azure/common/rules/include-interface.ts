import { RuleListener } from '@typescript-eslint/utils/eslint-utils';
import { CreateOperationRule, ChangeInfo, DetectProject, PatchMessage, RuleMessageKind, ChangeType } from '../types';

import { RuleContext } from '@typescript-eslint/utils/ts-eslint';
import { Node, SourceFile, SyntaxKind } from 'ts-morph';
import { RuleIds } from '../../../common/models/rules/rule-ids';
import { getSettings } from '../../../utils/common-utils';
import { createOperationRuleListener } from '../../utils/azure-rule-utils';
import {
  findAddedDeclarations,
  findIncompatibleDeclarations,
  findRemovedDeclarations,
  getTopLevelDeclarations,
} from '../../../common/utils/ast-utils';
import { create } from '../../change-info';

function findInterfaceTypes(root: SourceFile): Map<string, Node> | undefined {
  return getTopLevelDeclarations(root).get(SyntaxKind.InterfaceDeclaration);
}

const rule: CreateOperationRule = (_, detectProject: DetectProject) => {
  const incompatibleInterfaces = findIncompatibleDeclarations(detectProject, findInterfaceTypes);
  const addedInterfaces = findAddedDeclarations(detectProject, findInterfaceTypes);
  const removedInterfaces = findRemovedDeclarations(detectProject, findInterfaceTypes);

  const interfaceChangeSet = new Map<string, ChangeInfo>();
  const detectionInfo = new Map<SyntaxKind, Map<string, ChangeInfo>>();
  detectionInfo.set(SyntaxKind.InterfaceDeclaration, interfaceChangeSet);

  incompatibleInterfaces.forEach((i) => {
    const info: ChangeInfo = create(ChangeType.Incompatible, i.baseline, i.current);
    interfaceChangeSet.set(i.current.name, info);
  });
  addedInterfaces.forEach((i) => {});
  removedInterfaces.forEach((i) => {});

  console.log('--------------------- incompatible', incompatibleInterfaces);
  console.log('--------------------- add', addedInterfaces);
  console.log('--------------------- remove', removedInterfaces);

  const patchMessage: PatchMessage = {
    detectionInfo,
    kind: RuleMessageKind.PatchMessage,
    id: RuleIds.includeInterface,
  };

  const listener = createOperationRuleListener(
    RuleIds.includeInterface,
    (context: RuleContext<string, readonly unknown[]>): RuleListener => {
      console.log('--------------------- report');
      getSettings(context).report(patchMessage);
      return {};
    }
  );
  return listener;
};
export default rule;
