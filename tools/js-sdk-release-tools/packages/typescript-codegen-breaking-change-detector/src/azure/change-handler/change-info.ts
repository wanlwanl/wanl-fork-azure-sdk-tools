import { Node, SyntaxKind } from 'ts-morph';
import { ChangeInfo, ChangeInfoCreator, ChangeNode, ChangeType } from '../common/types';

function updateAddedMessage(info: ChangeInfo): void {
  switch (info.kind) {
    case SyntaxKind.InterfaceDeclaration:
      info.message = `Added interface ${info.current!.name}`;
    default:
      throw new Error(`Unknown node syntax kind: ${info.kind}`);
  }
}

function updateRemovedMessage(info: ChangeInfo): void {
  switch (info.kind) {
    case SyntaxKind.InterfaceDeclaration:
      info.message = `Removed interface ${info.baseline!.name}`;
      return;
    default:
      throw new Error(`Unknown node syntax kind: ${info.kind}`);
  }
}

function HandleInterfaceDeclaration(info: ChangeInfo) {
  const baseline = info.baseline!.node.asKindOrThrow(SyntaxKind.InterfaceDeclaration);
  const current = info.current!.node.asKindOrThrow(SyntaxKind.InterfaceDeclaration);
}

// TODO: impl
function updateInCompatibleMessage(info: ChangeInfo): void {
  if (!info.current || !info.baseline) throw new Error('Any of current or baseline change info is undefined.');
  switch (info.kind) {
    case SyntaxKind.InterfaceDeclaration:
      HandleInterfaceDeclaration(info);
      return;
    default:
      throw new Error(`Unknown node syntax kind: ${info.kind}`);
  }
}

function updateMessage(info: ChangeInfo): void {
  switch (info.type) {
    case ChangeType.Added:
      updateAddedMessage(info);
      return;
    case ChangeType.Removed:
      updateRemovedMessage(info);
      return;
    case ChangeType.Incompatible:
      updateInCompatibleMessage(info);
      return;
    default:
      throw new Error(`Unknown type: ${info.type}`);
  }
}

export const create: ChangeInfoCreator = (
  changeType: ChangeType,
  baseline: ChangeNode | undefined,
  current: ChangeNode | undefined
) => {
  if (!baseline && !current) throw new Error('Both baseline and current nodes are undefined');

  const kind = baseline?.node?.getKind() ?? current?.node?.getKind();
  const info: ChangeInfo = {
    type: changeType,
    message: '',
    kind: kind!,
    baseline,
    current,
  };
  updateMessage(info);
  return info;
};
