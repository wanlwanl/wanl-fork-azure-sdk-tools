import { remove } from 'fs-extra';
import { describe, expect, test } from 'vitest';

import { join } from 'node:path';
import { detectBreakingChangesBetweenPackages } from '../azure/detect-breaking-changes';
import { createTempFolder, getFormattedDate } from './utils';
import { RuleIds } from '../common/models/rules/rule-ids';

describe('detect rest level client breaking changes', async () => {
  test('should ignore operation rename', async () => {
    const testCaseDir = '../../misc/test-cases/rest-level-client-to-rest-level-client/';
    const currentPackageFolder = join(__dirname, testCaseDir, 'current-package');
    const baselinePackageFolder = join(__dirname, testCaseDir, 'baseline-package');
    const date = getFormattedDate();
    const tempFolder = await createTempFolder(`.tmp/temp-${date}`);
    try {
      const messagesMap = await detectBreakingChangesBetweenPackages(
        [RuleIds.ignoreInlineDeclarationsInOperationGroup],
        baselinePackageFolder,
        currentPackageFolder,
        tempFolder
      );
      expect(messagesMap.size).toBe(1);
      // TODO: add more checks
    } finally {
      await remove(tempFolder);
    }
  });
});
