import { RuleIds } from './rule-ids';

export const ruleDescriptions = new Map<RuleIds, string>( [
  [RuleIds.ignoreInlineDeclarationsInOperationGroup, 'Ignore inline types in routes'],
  [RuleIds.includeUnionTypeAlias, 'Include union type alias breaking change detection'],
  [RuleIds.includeInterface, 'Include interface breaking change detection'],
  [RuleIds.includeFunction, 'Include function breaking change detection'],
]);
