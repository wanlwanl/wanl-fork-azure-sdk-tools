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
  FunctionDeclaration,
  PropertyDeclaration,
  TypeNode,
} from 'ts-morph';
import { turbolog, turbologDetails } from '../../utils/common-utils';
import { BreakingLocation, BreakingPair, BreakingReasons, NameNode } from '../common/types';
import {
  getCallableEntityParameters,
  getCallableEntityParametersFromSymbol,
  getCallableEntityReturnTypeNode,
  getCallableEntityReturnTypeNodeFromSymbol,
  isArrowFunction,
  isMethod,
  isSameSignature,
} from './node-revealers/callable-entity-revealer';

function findBreakingReasons(baselineNode: Node, currentNode: Node): BreakingReasons {
  let breakingReasons = BreakingReasons.None;

  const baselineTypeNode = 'getTypeNode' in baselineNode ? (baselineNode as any).getTypeNode() : undefined;
  const currentTypeNode = 'getTypeNode' in currentNode ? (currentNode as any).getTypeNode() : undefined;

  // check if concrete type -> any. e.g. string -> any
  const isConcretTypeToAny = canConvertConcretTypeToAny(baselineTypeNode, currentTypeNode);
  if (isConcretTypeToAny) breakingReasons |= BreakingReasons.TypeChanged;

  // check type predicates
  if (baselineTypeNode && currentTypeNode && baselineTypeNode.getKind() === SyntaxKind.TypePredicate && currentTypeNode.getKind() === SyntaxKind.TypePredicate) {
        
  }

  // check assignability
  const assignable = currentNode.getType().isAssignableTo(baselineNode.getType());
  if (!assignable) breakingReasons |= BreakingReasons.TypeChanged;


  // check required -> optional
  const isBaselineNodeOptional = baselineNode.getSymbolOrThrow().isOptional();
  const isCurrentNodeOptional = currentNode.getSymbolOrThrow().isOptional();
  const incompatibleOptional = isBaselineNodeOptional && !isCurrentNodeOptional;
  if (incompatibleOptional) breakingReasons |= BreakingReasons.OptionalChanged;

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

function getType(p: Symbol) {
  return p.getValueDeclarationOrThrow().getType();
}

function isMethodOrArrowFunction(p: Symbol) {
  return isMethod(p) || isArrowFunction(p);
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

function findReturnTypeBreakingChanges(baselineMethod: Symbol, currentMethod: Symbol): BreakingPair[] {
  const getReturnType = (propertyFunction: Symbol): Type => {
    const type = getCallableEntityReturnTypeNodeFromSymbol(propertyFunction)?.getType();
    if (!type) throw new Error(`Unable to get return type of ${propertyFunction.getName()}`);
    return type;
  };

  const getReturnTypeKind = (propertyFunction: Symbol): SyntaxKind => {
    const kind = getCallableEntityReturnTypeNodeFromSymbol(propertyFunction)?.getKind();
    if (!kind) throw new Error('Implicit return type is not supported.');
    return kind;
  };

  const assignable = getReturnType(currentMethod).isAssignableTo(getReturnType(baselineMethod));
  const baselineReturnTypeKind = getReturnTypeKind(baselineMethod);
  const currentReturnTypeKind = getReturnTypeKind(currentMethod);
  const reasons = findBreakingReasons(
    baselineMethod.getValueDeclarationOrThrow(),
    currentMethod.getValueDeclarationOrThrow()
  );
  console.log(
    '-- returnn type--',
    currentMethod.getValueDeclarationOrThrow().getText(),
    assignable,
    baselineReturnTypeKind,
    currentReturnTypeKind,
    reasons
  );
  if (reasons === BreakingReasons.None) return [];
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
  const pairs: BreakingPair[] = [];

  // handle parameter counts
  const baselineParameters = getCallableEntityParametersFromSymbol(baselineMethod);
  const currentParameters = getCallableEntityParametersFromSymbol(currentMethod);
  const isSameParameterCount = baselineParameters.length === currentParameters.length;
  console.log(
    '--------para count--',
    getCallableEntityParametersFromSymbol(baselineMethod).length,
    getCallableEntityParametersFromSymbol(currentMethod).length
  );
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

    console.log('--------handle type--', getNameNode(baselineMethod).name, 'reasons', pair.reasons);

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

export function findFunctionBreakingChanges(
  baselineFunction: FunctionDeclaration,
  currentFunction: FunctionDeclaration
): BreakingPair[] {
  const baselineMethod = baselineFunction.getSymbol();
  const currentMethod = currentFunction.getSymbol();
  if (!baselineMethod || !currentMethod) return [];
  return findFunctionPropertyBreakingChangeDetails(baselineMethod, currentMethod);
}
