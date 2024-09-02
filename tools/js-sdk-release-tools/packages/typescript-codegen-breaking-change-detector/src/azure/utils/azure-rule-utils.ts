import { ESLintUtils } from '@typescript-eslint/utils';
import { RuleContext } from '@typescript-eslint/utils/ts-eslint';
import { RuleListener } from '@typescript-eslint/utils/eslint-utils';
import { ruleDescriptions } from '../../common/models/rules/rule-descriptions';
import { RuleIds } from '../../common/models/rules/rule-ids';

// TODO: provide correct endpint
const endpoint = 'https://a.b.c/rules';
const createRule = ESLintUtils.RuleCreator((name) => `${endpoint}/${name}`);

export function createOperationRuleListener(
  id: RuleIds,
  createListener: (context: RuleContext<string, readonly unknown[]>) => RuleListener
) {
  const messages = { default: '' };
  const defaultOptions: ReadonlyArray<unknown> = [];
  const rule = createRule({
    name: id,
    meta: {
      docs: {
        description: ruleDescriptions.get(id) ?? "",
      },
      messages,
      schema: [],
      type: 'problem',
    },
    defaultOptions,
    create(context) {
      try {
        const listener = createListener(context);
        return listener;
      } catch (err) {
        console.error(err);
        throw err;
      }
    },
  });
  return rule;
}
