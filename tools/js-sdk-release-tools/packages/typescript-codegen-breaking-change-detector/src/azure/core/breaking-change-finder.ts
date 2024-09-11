import {
  InterfaceDeclaration,
  Node,
  ParameterDeclaration,
  Signature,
  SyntaxKind,
  Symbol,
  SymbolFlags,
  MethodDeclaration,
  CallSignatureDeclaration,
  Type,
  FunctionTypeNode,
} from 'ts-morph';
import { turbolog, turbologDetails } from '../../utils/common-utils';
import { BreakingLocation, BreakingPair, BreakingReasons, NameNode } from '../common/types';

function isSameSignature(left: Signature, right: Signature): boolean {
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

function getType(p: Symbol) {
  return p.getValueDeclarationOrThrow().getType();
}

function isMethod(p: Symbol) {
  return p.getFlags() === SymbolFlags.Method;
}

function isArrowFunction(p: Symbol) {
  return (
    p.getFlags() === SymbolFlags.Property && p.getValueDeclarationOrThrow().getType().getCallSignatures().length > 0
  );
}

function isMethodOrArrowFunction(p: Symbol) {
  return isMethod(p) || isArrowFunction(p);
}

function isClassicProperty(p: Symbol) {
  return (p.getFlags() & SymbolFlags.Property) !== 0 && !isMethodOrArrowFunction(p);
}

function isConcretTypeToAny(baselineKind: SyntaxKind | undefined, currentKind: SyntaxKind | undefined) {
  return baselineKind !== SyntaxKind.AnyKeyword && currentKind === SyntaxKind.AnyKeyword;
}

function findClassicPropertyBreakingChanges(
  baselineProperty: Symbol,
  currentProperty: Symbol
): BreakingPair | undefined {
  const getTypeNode = (s: Symbol) =>
    s.getValueDeclarationOrThrow().asKindOrThrow(SyntaxKind.PropertySignature).getTypeNode();
  console.log(
    '----classic prop--',
    baselineProperty.getName(),
    'type',
    getTypeNode(baselineProperty)?.getText(),
    '->',
    getTypeNode(currentProperty)?.getText(),
    getTypeNode(baselineProperty)?.getKindName(),
    '->',
    getTypeNode(currentProperty)?.getKindName()
  );

  const baselinePropertyTypeKind = getTypeNode(baselineProperty)?.getKind();
  const currentPropertyTypeKind = getTypeNode(currentProperty)?.getKind();
  const assignable = getType(currentProperty).isAssignableTo(getType(baselineProperty));
  const incompatibleOptional = currentProperty.isOptional() && !baselineProperty.isOptional();
  const concretTypeToAny = isConcretTypeToAny(baselinePropertyTypeKind, currentPropertyTypeKind);
  const hasBreakingChange = !assignable || incompatibleOptional || concretTypeToAny;

  if (!hasBreakingChange) return;

  const reasons =
    (assignable ? BreakingReasons.None : BreakingReasons.TypeChanged) |
    (incompatibleOptional ? BreakingReasons.OptionalChanged : BreakingReasons.None) |
    (concretTypeToAny ? BreakingReasons.TypeChanged : BreakingReasons.None);
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

    const pair: BreakingPair = {
      location: BreakingLocation.PropertyGeneral,
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
    console.log('--property--', name);
    const currentProperty = currentPropMap.get(name);
    if (!currentProperty) return result;

    // NOTE: for method and arrow function, assignable set is the super set of non-breaking-change set,
    // it contains all non breaking changes and some breaking changes,
    // we still need to find out the whether the property has breaking changes
    console.log(
      '----incompatibleOptional--',
      name,
      'base',
      baselineProperty.isOptional(),
      'curr',
      currentProperty.isOptional()
    );

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
    console.log('----method condition--', name, isMethod(baselineProperty), isMethod(currentProperty));
    if (
      (isMethod(baselineProperty) || isArrowFunction(baselineProperty)) &&
      (isMethod(currentProperty) || isArrowFunction(currentProperty))
    ) {
      console.log('----method--', name);
      const functionPropertyDetails = findFunctionPropertyBreakingChangeDetails(baselineProperty, currentProperty);
      return [...result, ...functionPropertyDetails];
    }

    throw new Error('Should never reach here');
  }, new Array<BreakingPair>());
  return [...removed, ...changed];
}

function getArrowFunctionTypeNode(arrowFunction: Node): FunctionTypeNode {
  return arrowFunction
    .asKindOrThrow(SyntaxKind.PropertySignature)
    .getTypeNode()!
    .asKindOrThrow(SyntaxKind.FunctionType);
}

function findReturnTypeBreakingChanges(baselineMethod: Symbol, currentMethod: Symbol): BreakingPair[] {
  const getReturnType = (propertyFunction: Symbol): Type => {
    const declaration = propertyFunction.getValueDeclarationOrThrow();
    if (isMethod(propertyFunction)) return declaration.asKindOrThrow(SyntaxKind.MethodSignature).getReturnType();
    // arrow function
    return getArrowFunctionTypeNode(declaration).getReturnType();
  };

  const getReturnTypeKind = (propertyFunction: Symbol): SyntaxKind => {
    const declaration = propertyFunction.getValueDeclarationOrThrow();
    if (isMethod(propertyFunction))
      return declaration.asKindOrThrow(SyntaxKind.MethodSignature).getReturnTypeNode()!.getKind();
    // arrow function
    return getArrowFunctionTypeNode(declaration).getReturnTypeNode()!.getKind();
  };

  const assignable = getReturnType(currentMethod).isAssignableTo(getReturnType(baselineMethod));
  const baselineReturnTypeKind = getReturnTypeKind(baselineMethod);
  const currentReturnTypeKind = getReturnTypeKind(currentMethod);
  const hasBreakingChange = !assignable || isConcretTypeToAny(baselineReturnTypeKind, currentReturnTypeKind);
  if (!hasBreakingChange) return [];
  const pair: BreakingPair = {
    location: BreakingLocation.PropertyFunctionReturnType,
    reasons: BreakingReasons.TypeChanged,
    messages: new Map<BreakingReasons, string>(),
    baseline: getNameNode(baselineMethod),
    current: getNameNode(currentMethod),
  };
  return [pair];
}

function findParameterBreakingChanges(baselineMethod: Symbol, currentMethod: Symbol): BreakingPair[] {
  const getParameters = (propertyFunction: Symbol): ParameterDeclaration[] => {
    const declaration = propertyFunction.getValueDeclarationOrThrow();
    if (isMethod(propertyFunction)) return declaration.asKindOrThrow(SyntaxKind.MethodSignature).getParameters();
    return getArrowFunctionTypeNode(declaration).getParameters();
  };

  const pairs: BreakingPair[] = [];

  // handle parameter counts
  const isSameParameterCount = getParameters(baselineMethod).length === getParameters(currentMethod).length;
  console.log('--------para count--', getParameters(baselineMethod).length, getParameters(currentMethod).length);
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

  const getParameterNameNode = (p: ParameterDeclaration | undefined) =>
    p ? { name: p.getName() || '', node: p } : undefined;

  // NOTE: parameter count is the same
  // handle each parameter
  getParameters(baselineMethod).forEach((baselineParameter, i) => {
    const currentParameter = getParameters(currentMethod)[i];
    // handle optional
    const isOptionalIncompatible = currentParameter.isOptional() && !baselineParameter.isOptional();
    console.log(
      '--------isOptionalIncompatible--',
      getNameNode(baselineMethod).name,
      isOptionalIncompatible,
      'b',
      baselineParameter.isOptional(),
      'c',
      currentParameter.isOptional()
    );
    const pair: BreakingPair = {
      baseline: getParameterNameNode(baselineParameter),
      current: getParameterNameNode(currentParameter),
      location: BreakingLocation.PropertyFunctionParameter,
      reasons: BreakingReasons.None,
      messages: new Map<BreakingReasons, string>(),
    };
    if (isOptionalIncompatible) pair.reasons |= BreakingReasons.OptionalChanged;

    // handle type
    const assignable = currentParameter.getType().isAssignableTo(baselineParameter.getType());
    const concretTypeToAny = isConcretTypeToAny(
      baselineParameter.getTypeNode()?.getKind(),
      currentParameter.getTypeNode()?.getKind()
    );
    const hasBreakingChange = !assignable || concretTypeToAny;

    console.log(
      '--------handle type--',
      getNameNode(baselineMethod).name,
      'concretTypeToAny',
      concretTypeToAny,
      'assignable',
      assignable
    );

    if (hasBreakingChange) pair.reasons |= BreakingReasons.TypeChanged;
    if (pair.reasons !== BreakingReasons.None) pairs.push(pair);
  });

  return pairs;
}

function findFunctionPropertyBreakingChangeDetails(baselineMethod: Symbol, currentMethod: Symbol): BreakingPair[] {
  console.log('------detail--');
  const returnTypePairs = findReturnTypeBreakingChanges(baselineMethod, currentMethod);
  const parameterPairs = findParameterBreakingChanges(baselineMethod, currentMethod);
 
  return [...returnTypePairs, ...parameterPairs];
}

// TODO: add generic test case
export function findInterfaceBreakingChanges(
  baseline: InterfaceDeclaration,
  current: InterfaceDeclaration
): BreakingPair[] {
  turbolog(`🚀 \t file: breaking-change-finder.ts:48 \t interface `, baseline.getName());
  const baselineSignatures = baseline.getType().getCallSignatures();
  const currentSignatures = current.getType().getCallSignatures();
  const callSignatureBreakingChanges = findCallSignatureBreakingChanges(baselineSignatures, currentSignatures);
  console.log('---callSignatureBreakingChanges', callSignatureBreakingChanges);
  const baselineProperties = baseline.getType().getProperties();
  const currentProperties = current.getType().getProperties();

  const propertyBreakingChanges = findPropertyBreakingChanges(baselineProperties, currentProperties);
  turbolog(
    `🚀 \t file: breaking-change-finder.ts:222 \t propertyBreakingChanges `,
    propertyBreakingChanges.map((p) => ({
      name: p.baseline?.name ?? p.current?.name ?? 'no-name',
      kind: p.location,
      reasons: p.reasons,
    }))
  );

  return [...callSignatureBreakingChanges, ...propertyBreakingChanges];
}
