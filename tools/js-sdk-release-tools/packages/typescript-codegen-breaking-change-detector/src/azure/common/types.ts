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

export interface ChangeNode {
  name: string;
  node: Node;
}

export enum ChangeType {
  Added = 'added',
  Removed = 'removed',
  Incompatible = 'incompatible',
}

export interface ChangeInfo {
  type: ChangeType;
  baseline?: ChangeNode;
  current?: ChangeNode;
  message: string;
  kind: SyntaxKind;
}

export interface ChangeInfoCreator {
  (changeType: ChangeType, baselineNode: ChangeNode | undefined, currentNode: ChangeNode | undefined): ChangeInfo;
}

export interface PatchMessage extends RuleMessage {
  // TODO: add more info
  incompatibleTypeAlias?: Set<string>;
  detectionInfo?: Map<SyntaxKind, Map<string, ChangeInfo>>;
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
