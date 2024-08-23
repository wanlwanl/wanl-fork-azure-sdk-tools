import { remove } from 'fs-extra';
import { describe, expect, test } from 'vitest';

import { join } from 'node:path';
import { detectBreakingChangesBetweenPackages } from '../azure/detect-breaking-changes';
import { RuleIds } from '../common/models/rules/rule-ids';
import { createTempFolder, getFormattedDate } from './utils';
import { turbolog, turbologDetails } from '../utils/common-utils';

describe('detect rest level client breaking changes', async () => {
  test('qqqqqq should ignore operation rename', async () => {
    const testCaseDir = '../../misc/test-cases/patch-basic-detection';
    const currentPackageFolder = join(__dirname, testCaseDir, 'current-package');
    const baselinePackageFolder = join(__dirname, testCaseDir, 'baseline-package');
    const date = getFormattedDate();
    const tempFolder = await createTempFolder(`.tmp/temp-${date}`);
    try {
      const messagesMap = await detectBreakingChangesBetweenPackages(
        [RuleIds.patchBreakingChangeDetection],
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
