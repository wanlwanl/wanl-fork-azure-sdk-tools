import { RuleIds } from './rule-ids';

export const ruleDescriptions = new Map<RuleIds, string>( [
  [RuleIds.ignoreInlineDeclarationsInOperationGroup, 'Ignore inline types in routes'],
  [RuleIds.includeUnionTypeAlias, 'Include union type alias for breaking change detection patching in js-sdk-release-tools'],
  [RuleIds.includeInterface, 'Include interface for breaking change detection patching in js-sdk-release-tools'],
  [RuleIds.testRule, 'Include interface for breaking change detection patching in js-sdk-release-tools'],
]);
