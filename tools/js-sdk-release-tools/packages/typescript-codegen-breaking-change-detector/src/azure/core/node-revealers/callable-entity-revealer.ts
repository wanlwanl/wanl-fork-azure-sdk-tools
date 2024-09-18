import { SyntaxKind, TypeNode, Node, Signature, ParameterDeclaration, SymbolFlags, Symbol } from 'ts-morph';

export function getCallableEntityReturnTypeNode(node: Node): TypeNode | undefined {
  switch (node.getKind()) {
    case SyntaxKind.MethodSignature:
      return node.asKindOrThrow(SyntaxKind.MethodSignature).getReturnTypeNode();
    case SyntaxKind.FunctionDeclaration:
      return node.asKindOrThrow(SyntaxKind.FunctionDeclaration).getReturnTypeNode();
    case SyntaxKind.PropertySignature:
      return node.asKindOrThrow(SyntaxKind.PropertySignature).getTypeNode();
    default:
      throw new Error(`Unsupported function kind: ${node.getKindName()}`);
  }
}

export function getCallableEntityReturnTypeNodeFromSymbol(symbol: Symbol): TypeNode | undefined {
  const node = symbol.getValueDeclarationOrThrow();
  return getCallableEntityReturnTypeNode(node);
}

export function getCallableEntityParameters(node: Node): ParameterDeclaration[] {
  switch (node.getKind()) {
    case SyntaxKind.MethodSignature:
      return node.asKindOrThrow(SyntaxKind.MethodSignature).getParameters();
    case SyntaxKind.FunctionDeclaration:
      return node.asKindOrThrow(SyntaxKind.FunctionDeclaration).getParameters();
    case SyntaxKind.PropertySignature:
      return getCallableEntityReturnTypeNode(node)?.asKindOrThrow(SyntaxKind.FunctionType).getParameters() ?? [];
    default:
      throw new Error(`Unsupported function kind: ${node.getKindName()}`);
  }
}

export function getCallableEntityParametersFromSymbol(symbol: Symbol): ParameterDeclaration[] {
  const node = symbol.getValueDeclarationOrThrow();
  return getCallableEntityParameters(node);
}

export function isSameSignature(left: Signature, right: Signature): boolean {
  if (left.getReturnType().getText() !== right.getReturnType().getText()) return false;
  if (left.getTypeParameters().length !== right.getTypeParameters().length) return false;
  if (left.getParameters().length !== right.getParameters().length) return false;

  const sameParameters = left.getParameters().filter((leftParameter, i) => {
    const rightParameter = right.getParameters()[i];
    if (leftParameter.getName() !== rightParameter.getName()) return false;

    const getParameterType = (parameter: Symbol) =>
      (parameter.getValueDeclaration() as ParameterDeclaration)?.getTypeNode()?.getType();
    const leftParaType = getParameterType(leftParameter);
    const rightParaType = getParameterType(rightParameter);

    if (!leftParaType && !rightParaType) return true;
    if (!leftParaType || !rightParaType) return false;
    if (!leftParaType.isAssignableTo(rightParaType) || !rightParaType.isAssignableTo(leftParaType)) return false;
    return true;
  });
  return sameParameters.length === left.getParameters().length;
}

export function isPropertyMethod(p: Symbol) {
  return p.getFlags() === SymbolFlags.Method;
}

export function isPropertyArrowFunction(p: Symbol) {
  return (
    p.getFlags() === SymbolFlags.Property && p.getValueDeclarationOrThrow().getType().getCallSignatures().length > 0
  );
}

export function isMethodOrArrowFunction(p: Symbol) {
  return isPropertyMethod(p) || isPropertyArrowFunction(p);
}
