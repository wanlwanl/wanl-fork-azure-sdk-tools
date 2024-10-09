// TODO: support class

import {
  InterfaceDeclaration,
  Node,
  ParameterDeclaration,
  Signature,
  SyntaxKind,
  Symbol,
  SymbolFlags,
  FunctionDeclaration,
  TypePredicateNode,
  PropertySignature,
  TypeNode,
  PropertyDeclaration,
  MethodDeclaration,
} from 'ts-morph';
import { BreakingLocation, BreakingPair, BreakingReasons, NameNode } from '../common/types';
import {
  getCallableEntityParametersFromSymbol,
  getCallableEntityReturnTypeNodeFromSymbol,
  isMethodOrArrowFunction,
  isPropertyArrowFunction,
  isPropertyMethod,
  isSameSignature,
} from './node-revealers/callable-entity-revealer';

function findBreakingReasons(baselineNode: Node, currentNode: Node): BreakingReasons {
  // Note: if return type node defined,
  // it's a funtion/method/signature's return type node,
  // return it, it will be used to compare later
  // Otherwise, it's a non-funtion/method/signature node, return its type node
  const getTypeNode = (node: Node): TypeNode => {
    if (Node.isReturnTyped(node)) return node.getReturnTypeNodeOrThrow();
    if (Node.isTyped(node)) return node.getTypeNodeOrThrow();
    throw new Error(`Unsupported ${node.getKindName()} node: "${node.getText()}"`);
  };
  let breakingReasons = BreakingReasons.None;

  const baselineTypeNode = getTypeNode(baselineNode);
  const currentTypeNode = getTypeNode(currentNode);

  // check if concrete type -> any. e.g. string -> any
  const isConcretTypeToAny = canConvertConcretTypeToAny(baselineTypeNode?.getKind(), currentTypeNode?.getKind());
  if (isConcretTypeToAny) breakingReasons |= BreakingReasons.TypeChanged;

  // check type predicates
  if (
    baselineTypeNode &&
    currentTypeNode &&
    baselineTypeNode.isKind(SyntaxKind.TypePredicate) &&
    currentTypeNode.isKind(SyntaxKind.TypePredicate)
  ) {
    const getTypeName = (node: TypeNode) => node.asKindOrThrow(SyntaxKind.TypePredicate).getTypeNodeOrThrow().getText();
    if (getTypeName(baselineTypeNode) !== getTypeName(currentTypeNode)) breakingReasons |= BreakingReasons.TypeChanged;
  }

  // check type
  const assignable = currentTypeNode.getType().isAssignableTo(baselineTypeNode.getType());
  if (!assignable) breakingReasons |= BreakingReasons.TypeChanged;

  // check required -> optional
  const isOptional = (node: Node) => node.getSymbolOrThrow().isOptional();
  const incompatibleOptional = isOptional(baselineNode) && !isOptional(currentNode);
  if (incompatibleOptional) breakingReasons |= BreakingReasons.RequiredToOptional;

  // check readonly -> mutable
  const isReadonly = (node: Node) => Node.isReadonlyable(node) && node.isReadonly();
  const incompatibleReadonly = isReadonly(baselineNode) && !isReadonly(currentNode);

  // debug
  if (currentNode.asKind(SyntaxKind.PropertySignature)?.getName() === 'prop_readonly_to_mutable') {
    console.log('--- prop_readonly_to_mutable', isReadonly(baselineNode), isReadonly(currentNode));
  }

  if (incompatibleReadonly) breakingReasons |= BreakingReasons.ReadonlyToMutable;

  return breakingReasons;
}

function findCallSignatureBreakingChanges(
  baselineSignatures: Signature[],
  currentSignatures: Signature[]
): BreakingPair[] {
  const includesSignature = (target: Signature, list: Signature[]): Signature | undefined => {
    const filtered = list.filter((s) => isSameSignature(target, s));
    const found = filtered.length > 0 ? filtered[0] : undefined;
    return found;
  };
  const pairs = baselineSignatures.reduce((result, baselineSignature) => {
    const currentSignature = includesSignature(baselineSignature, currentSignatures);
    if (currentSignature) return result;
    const getSignatureNode = (s: Signature): Node => s.compilerSignature.getDeclaration() as unknown as Node;
    const getSignatureName = (s: Signature): string => s.compilerSignature.getDeclaration().getText();
    const getSignatureNameNode = (s: Signature): NameNode => ({ name: getSignatureName(s), node: getSignatureNode(s) });
    const pair: BreakingPair = {
      location: BreakingLocation.PropertyCall,
      reasons: BreakingReasons.Removed,
      messages: new Map<BreakingReasons, string>(),
      baseline: getSignatureNameNode(baselineSignature),
      current: undefined,
    };
    result.push(pair);
    return result;
  }, new Array<BreakingPair>());
  return pairs;
}

function getNameNode(s: Symbol): NameNode {
  return { name: s.getName(), node: s.getValueDeclarationOrThrow() };
}

function isClassicProperty(p: Symbol) {
  return (p.getFlags() & SymbolFlags.Property) !== 0 && !isMethodOrArrowFunction(p);
}

function canConvertConcretTypeToAny(baselineKind: SyntaxKind | undefined, currentKind: SyntaxKind | undefined) {
  return baselineKind !== SyntaxKind.AnyKeyword && currentKind === SyntaxKind.AnyKeyword;
}

function findClassicPropertyBreakingChanges(
  baselineProperty: Symbol,
  currentProperty: Symbol
): BreakingPair | undefined {
  const reasons = findBreakingReasons(
    baselineProperty.getValueDeclarationOrThrow(),
    currentProperty.getValueDeclarationOrThrow()
  );

  if (reasons === BreakingReasons.None) return undefined;
  return {
    location: BreakingLocation.PropertyClassicProperty,
    reasons,
    messages: new Map<BreakingReasons, string>(),
    baseline: getNameNode(baselineProperty),
    current: getNameNode(currentProperty),
  };
}

// NOTE: this function compares methods and arrow functions in interface
function findPropertyBreakingChanges(baselineProperties: Symbol[], currentProperties: Symbol[]): BreakingPair[] {
  const currentPropMap = currentProperties.reduce((map, p) => {
    map.set(p.getName(), p);
    return map;
  }, new Map<string, Symbol>());

  const removed = baselineProperties.reduce((result, baselineProperty) => {
    const name = baselineProperty.getName();
    if (currentPropMap.has(name)) {
      return result;
    }

    const isPropertyFunction = isMethodOrArrowFunction(baselineProperty);
    const location = isPropertyFunction ? BreakingLocation.PropertyFunction : BreakingLocation.PropertyClassicProperty;

    const pair: BreakingPair = {
      location,
      reasons: BreakingReasons.Removed,
      messages: new Map<BreakingReasons, string>(),
      baseline: getNameNode(baselineProperty),
      current: undefined,
    };
    result.push(pair);
    return result;
  }, new Array<BreakingPair>());

  const changed = baselineProperties.reduce((result, baselineProperty) => {
    const name = baselineProperty.getName();
    const currentProperty = currentPropMap.get(name);
    if (!currentProperty) return result;

    const isBaselinePropertyClassic = isClassicProperty(baselineProperty);
    const isCurrentPropertyClassic = isClassicProperty(currentProperty);

    // handle different property kinds
    if (isBaselinePropertyClassic !== isCurrentPropertyClassic) {
      return [
        ...result,
        {
          baseline: getNameNode(baselineProperty),
          current: getNameNode(currentProperty),
          location: BreakingLocation.PropertyFunction,
          reasons: BreakingReasons.TypeChanged,
          messages: new Map<BreakingReasons, string>(),
        },
      ];
    }

    // handle classic property
    if (isBaselinePropertyClassic && isCurrentPropertyClassic) {
      const classicBreakingPair = findClassicPropertyBreakingChanges(baselineProperty, currentProperty);
      if (!classicBreakingPair) return result;
      return [...result, classicBreakingPair];
    }

    // handle method and arrow function
    if (
      (isPropertyMethod(baselineProperty) || isPropertyArrowFunction(baselineProperty)) &&
      (isPropertyMethod(currentProperty) || isPropertyArrowFunction(currentProperty))
    ) {
      const functionPropertyDetails = findFunctionPropertyBreakingChangeDetails(baselineProperty, currentProperty);
      return [...result, ...functionPropertyDetails];
    }

    throw new Error('Should never reach here');
  }, new Array<BreakingPair>());
  return [...removed, ...changed];
}

function findReturnTypeBreakingChanges(baselineMethod: Symbol, currentMethod: Symbol): BreakingPair[] {
  const reasons = findBreakingReasons(
    baselineMethod.getValueDeclarationOrThrow(),
    currentMethod.getValueDeclarationOrThrow()
  );

  if (reasons === BreakingReasons.None) return [];
  const baselineReturnTypeNode = getCallableEntityReturnTypeNodeFromSymbol(baselineMethod);
  const currentReturnTypeNode = getCallableEntityReturnTypeNodeFromSymbol(currentMethod);
  const baselineNameNode = baselineReturnTypeNode
    ? { name: baselineReturnTypeNode.getText(), node: baselineReturnTypeNode }
    : undefined;
  const currentNameNode = currentReturnTypeNode
    ? { name: currentReturnTypeNode.getText(), node: currentReturnTypeNode }
    : undefined;
  const pair: BreakingPair = {
    location: BreakingLocation.PropertyFunctionReturnType,
    reasons: BreakingReasons.TypeChanged,
    messages: new Map<BreakingReasons, string>(),
    baseline: baselineNameNode,
    current: currentNameNode,
  };
  return [pair];
}

function findParameterBreakingChanges(baselineMethod: Symbol, currentMethod: Symbol): BreakingPair[] {
  const pairs: BreakingPair[] = [];

  // handle parameter counts
  const baselineParameters = getCallableEntityParametersFromSymbol(baselineMethod);
  const currentParameters = getCallableEntityParametersFromSymbol(currentMethod);
  const isSameParameterCount = baselineParameters.length === currentParameters.length;
  if (!isSameParameterCount) {
    const pair: BreakingPair = {
      location: BreakingLocation.PropertyFunctionParameterList,
      reasons: BreakingReasons.CountChanged,
      messages: new Map<BreakingReasons, string>(),
      baseline: getNameNode(baselineMethod),
      current: getNameNode(currentMethod),
    };
    pairs.push(pair);
    return pairs;
  }

  // NOTE: parameter count is the same
  // handle each parameter
  baselineParameters.forEach((baselineParameter, i) => {
    const currentParameter = currentParameters[i];
    const getParameterNameNode = (p: ParameterDeclaration | undefined) =>
      p ? { name: p.getName() || '', node: p } : undefined;
    const pair: BreakingPair = {
      baseline: getParameterNameNode(baselineParameter),
      current: getParameterNameNode(currentParameter),
      location: BreakingLocation.PropertyFunctionParameter,
      reasons: BreakingReasons.None,
      messages: new Map<BreakingReasons, string>(),
    };
    pair.reasons = findBreakingReasons(baselineParameter, currentParameter);
    if (pair.reasons !== BreakingReasons.None) pairs.push(pair);
  });

  return pairs;
}

function findFunctionPropertyBreakingChangeDetails(baselineMethod: Symbol, currentMethod: Symbol): BreakingPair[] {
  const returnTypePairs = findReturnTypeBreakingChanges(baselineMethod, currentMethod);
  const parameterPairs = findParameterBreakingChanges(baselineMethod, currentMethod);
  return [...returnTypePairs, ...parameterPairs];
}

// TODO: support readonly properties
// TODO: add generic test case: parameter with generic, return type with generic
export function findInterfaceBreakingChanges(
  baseline: InterfaceDeclaration,
  current: InterfaceDeclaration
): BreakingPair[] {
  const baselineSignatures = baseline.getType().getCallSignatures();
  const currentSignatures = current.getType().getCallSignatures();
  const callSignatureBreakingChanges = findCallSignatureBreakingChanges(baselineSignatures, currentSignatures);
  const baselineProperties = baseline.getType().getProperties();
  const currentProperties = current.getType().getProperties();

  const propertyBreakingChanges = findPropertyBreakingChanges(baselineProperties, currentProperties);

  return [...callSignatureBreakingChanges, ...propertyBreakingChanges];
}

// TODO: support arrow function
export function findFunctionBreakingChanges(
  baselineFunction: FunctionDeclaration,
  currentFunction: FunctionDeclaration
): BreakingPair[] {
  const baselineMethod = baselineFunction.getSymbol();
  const currentMethod = currentFunction.getSymbol();
  if (!baselineMethod || !currentMethod) return [];
  return findFunctionPropertyBreakingChangeDetails(baselineMethod, currentMethod);
}
