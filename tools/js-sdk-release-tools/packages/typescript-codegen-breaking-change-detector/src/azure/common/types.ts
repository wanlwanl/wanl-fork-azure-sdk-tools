import { RuleListener, RuleModule } from '@typescript-eslint/utils/eslint-utils';

import { ParserServices } from '@typescript-eslint/parser';
import type { ScopeManager } from '@typescript-eslint/scope-manager';
import { TSESTree } from '@typescript-eslint/utils';
import type { VisitorKeys } from '@typescript-eslint/visitor-keys';
import {
  EnumDeclaration,
  InterfaceDeclaration,
  Project,
  SourceFile,
  Structure,
  StructureKind,
  SyntaxKind,
  TypeAliasDeclaration,
  Node,
  TypeNode,
} from 'ts-morph';

export interface ParseForESLintResult {
  ast: TSESTree.Program & {
    range?: [number, number];
    tokens?: TSESTree.Token[];
    comments?: TSESTree.Comment[];
  };
  services: ParserServices;
  visitorKeys: VisitorKeys;
  scopeManager: ScopeManager;
}

export interface CreateOperationRule {
  (
    baselineParsedResult: ParseForESLintResult | undefined,
    detectProject: DetectProject
  ): RuleModule<'default', readonly unknown[], unknown, RuleListener>;
}

export interface RuleMessage {
  id: string;
  kind: RuleMessageKind;
}

export enum RuleMessageKind {
  InlineDeclarationNameSetMessage = 'InlineDeclarationNameSetMessage',
  PatchMessage = 'PatchMessage',
}

export interface InlineDeclarationNameSetMessage extends RuleMessage {
  baseline: Map<string, NodeContext>;
  current: Map<string, NodeContext>;
  kind: RuleMessageKind.InlineDeclarationNameSetMessage;
}

export interface NameNode {
  name: string;
  node: Node | TypeNode;
}

export enum BreakingReasons {
  None = 0,
  Removed = 1,
  TypeChanged = 2,
  CountChanged = 4,
  RequiredToOptional = 8,
  ReadonlyToMutable = 16,
}

export interface BreakingPair {
  baseline: NameNode | undefined;
  current: NameNode | undefined;
  location: BreakingLocation;
  reasons: BreakingReasons;
  messages: Map<BreakingReasons, string>;
}

export enum BreakingLocation {
  None = 0,
  PropertyCall = 1,
  PropertyFunction = 2,
  PropertyFunctionReturnType = 3,
  PropertyFunctionParameterList = 4,
  PropertyFunctionParameter = 5,
  PropertyClassicProperty = 6,
  PropertyGeneral = 7,
}

export interface PatchMessage extends RuleMessage {
  // TODO: add more info
  incompatibleTypeAlias?: Set<string>;
  breakingChanges?: Map<string, BreakingPair[]>;
  kind: RuleMessageKind.PatchMessage;
}

export interface LinterSettings {
  report<TMessage extends RuleMessage>(message: TMessage): void;
}

export interface NodeContext {
  node: InterfaceDeclaration | TypeAliasDeclaration | EnumDeclaration;
  used: boolean;
}

export interface RenameAbleDeclarations {
  interfaces: InterfaceDeclaration[];
  typeAliases: TypeAliasDeclaration[];
  enums: EnumDeclaration[];
}

export interface DetectProject {
  baseline: SourceFile;
  current: SourceFile;
  project: Project;
}
