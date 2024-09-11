import { Node, SyntaxKind } from 'ts-morph';
import { BreakingChangeContext, BreakingChangeContextCreator, NameNode, BreakingChangeCategory } from '../common/types';

function updateRemovedMessage(info: BreakingChangeContext): void {
  switch (info.kind) {
    case SyntaxKind.InterfaceDeclaration:
      info.message = `Removed interface ${info.baseline!.name}`;
      return;
    default:
      throw new Error(`Unknown node syntax kind: ${info.kind}`);
  }
}

function HandleInterfaceDeclaration(info: BreakingChangeContext) {
  const baseline = info.baseline!.node.asKindOrThrow(SyntaxKind.InterfaceDeclaration);
  const current = info.current!.node.asKindOrThrow(SyntaxKind.InterfaceDeclaration);
}

// TODO: impl
function updateInCompatibleMessage(info: BreakingChangeContext): void {
  if (!info.current || !info.baseline) throw new Error('Any of current or baseline change info is undefined.');
  switch (info.kind) {
    case SyntaxKind.InterfaceDeclaration:
      HandleInterfaceDeclaration(info);
      return;
    default:
      throw new Error(`Unknown node syntax kind: ${info.kind}`);
  }
}

function updateMessage(info: BreakingChangeContext): void {
  switch (info.type) {
    case BreakingChangeCategory.Removed:
      updateRemovedMessage(info);
      return;
    case BreakingChangeCategory.Incompatible:
      updateInCompatibleMessage(info);
      return;
    default:
      throw new Error(`Unknown type: ${info.type}`);
  }
}

export const create: BreakingChangeContextCreator = (
  changeType: BreakingChangeCategory,
  baseline: NameNode | undefined,
  current: NameNode | undefined
) => {
  if (!baseline && !current) throw new Error('Both baseline and current nodes are undefined');

  const kind = baseline?.node?.getKind() ?? current?.node?.getKind();
  const info: BreakingChangeContext = {
    type: changeType,
    message: '',
    kind: kind!,
    baseline,
    current,
  };
  updateMessage(info);
  return info;
};
