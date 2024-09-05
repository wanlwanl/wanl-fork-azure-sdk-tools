import { InterfaceDeclaration, Node, ParameterDeclaration, Signature, SyntaxKind, Symbol, SymbolFlags } from 'ts-morph';
import { turbolog, turbologDetails } from '../../utils/common-utils';

function AreEqualSignatures(left: Signature, right: Signature): boolean {
  if (left.getReturnType().getText() !== right.getReturnType().getText()) return false;
  if (left.getTypeParameters().length !== right.getTypeParameters().length) return false;
  // TODO: compare type parameters
  if (left.getParameters().length !== right.getParameters().length) return false;

  const sameParameters = left
    .getParameters()
    .map((p, i) => ({ leftParameter: p, rightParameter: right.getParameters()[i] }))
    .filter(({ leftParameter, rightParameter }) => {
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

// TODO: find a better way to compare call signatures, right now it's too strict
function compareCallSignatures(
  baselineSignatures: Signature[],
  currentSignatures: Signature[]
): { added: Signature[]; removed: Signature[] } {
  const includesSignature = (target: Signature, list: Signature[]) =>
    list.filter((s) => AreEqualSignatures(target, s)).length > 0;
  const removed = baselineSignatures.filter((s) => !includesSignature(s, currentSignatures));
  const added = currentSignatures.filter((s) => !includesSignature(s, baselineSignatures));
  console.log('************ added size', added.length);
  return { added, removed };
}

// NOTE: this function compares methods and arrow functions in interface
function compareProperties(
  baselineProperties: Symbol[],
  currentProperties: Symbol[]
): { added: Symbol[]; removed: Symbol[]; typeIncompatible: Symbol[], optionalIncompatible: Symbol[] } {
  const currentPropMap = currentProperties.reduce((map, p) => {
    map.set(p.getName(), p);
    return map;
  }, new Map<string, Symbol>());
  const baselinePropMap = baselineProperties.reduce((map, p) => {
    map.set(p.getName(), p);
    return map;
  }, new Map<string, Symbol>());
  const removed = baselineProperties.filter((baselineProperty) => {
    const name = baselineProperty.getName();
    return currentPropMap.has(name) ? false : true;
  });
  const added = currentProperties.filter((currentProperty) => {
    const name = currentProperty.getName();
    return !baselinePropMap.has(name) ? true : false;
  });
  const typeIncompatible = baselineProperties.filter((baselineProperty) => {
    const name = baselineProperty.getName();
    const currentProperty = currentPropMap.get(name);
    if (!currentProperty) return;
    const getType = (p: Symbol) => p.getValueDeclarationOrThrow().getType();
    const assignable = getType(currentProperty).isAssignableTo(getType(baselineProperty));
    return !assignable;
  });
  const optionalIncompatible = baselineProperties.filter((baselineProperty) => {
    const name = baselineProperty.getName();
    turbolog(`🚀 \t file: node-comparer.ts:73 \t optionalIncompatible \t name `, name);
    const currentProperty = currentPropMap.get(name);
    if (!currentProperty) return;
    const getType = (p: Symbol) => p.getValueDeclarationOrThrow().getType();
    const incompatibleOptional = currentProperty.isOptional() && !baselineProperty.isOptional();
    return incompatibleOptional;
  });
  return { added, removed, typeIncompatible, optionalIncompatible };
}

export function compare<TNode extends Node>(baseline: TNode, current: TNode) {}

export function compareInterfaces(baseline: InterfaceDeclaration, current: InterfaceDeclaration) {
  turbolog(`🚀 \t file: node-comparer.ts:48 \t interface `, baseline.getName());
  const baselineSignatures = baseline.getType().getCallSignatures();
  const currentSignatures = current.getType().getCallSignatures();
  const callSignatureCompareResult = compareCallSignatures(baselineSignatures, currentSignatures);

  const baselineProperties = baseline.getType().getProperties();
  const currentProperties = current.getType().getProperties();

  // const isMethod = (p: Symbol) => p.getFlags() === SymbolFlags.Method;
  // const isArrowFunction = (p: Symbol) =>
  //   p.getFlags() === SymbolFlags.Property && p.getValueDeclarationOrThrow().getType().getCallSignatures().length > 0;
  // const isMethodOrArrowFunction = (p: Symbol) => isMethod(p) || isArrowFunction(p);

  const propertyCompareResult = compareProperties(baselineProperties, currentProperties);
  turbolog(
    `🚀 \t file: node-comparer.ts:88 \t propertyFunctionCompareResult added`,
    propertyCompareResult.added.map((f) => f.getName())
  );
  turbolog(
    `🚀 \t file: node-comparer.ts:88 \t propertyFunctionCompareResult removed`,
    propertyCompareResult.removed.map((f) => f.getName())
  );
  turbolog(
    `🚀 \t file: node-comparer.ts:88 \t propertyFunctionCompareResult incompatible`,
    propertyCompareResult.typeIncompatible.map((f) => f.getName())
  );
  turbolog(
    `🚀 \t file: node-comparer.ts:88 \t propertyFunctionCompareResult incompatible`,
    propertyCompareResult.optionalIncompatible.map((f) => f.getName())
  );
}
