import { ignoreInlineDeclarationsInOperationGroup, patchBreakingChangeDetection } from './rule-ids';

export const ruleDescriptions: { [ruleId: string]: string } = {
  [ignoreInlineDeclarationsInOperationGroup]: 'Ignore inline types in routes',
  [patchBreakingChangeDetection]: 'Patch breaking change detection in js-sdk-release-tools',
};
