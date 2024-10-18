import { mkdirp, pathExists, remove } from 'fs-extra';
import { describe, expect, test } from 'vitest';

import { join } from 'node:path';
import { createAstContext } from '../azure/detect-breaking-changes';
import { patchFunction, patchRoutes, patchUnionType } from '../azure/patch/patch-detection';
import { createTempFolder, getFormattedDate } from './utils';
import { DiffLocation, DiffReasons, AssignDirection } from '../azure/common/types';

const testCaseDir = '../../misc/test-cases/patch-detection';

describe("patch current tool's breaking changes", async () => {
  test('detect routes', async () => {
    const currentApiViewPath = join(__dirname, testCaseDir, 'current-package/patch-mc.api.md');
    const baselineApiViewPath = join(__dirname, testCaseDir, 'baseline-package/patch-mc.api.md');
    const date = getFormattedDate();

    let tempFolder: string | undefined = undefined;
    try {
      const tempFolder = await createTempFolder(`.tmp/temp-${date}`);
      const astContext = await createAstContext(baselineApiViewPath, currentApiViewPath, tempFolder);
      const breakingPairs = patchRoutes(astContext);
      expect(breakingPairs.length).toBe(5);

      expect(breakingPairs[0].location).toBe(DiffLocation.Signature);
      expect(breakingPairs[0].reasons).toBe(DiffReasons.Removed);
      expect(breakingPairs[0].source).toBeUndefined();
      expect(breakingPairs[0].target?.node.getText()).toBe(
        '(path: "remove", subscriptionId: string, resourceGroupName: string, clusterName: string): ClustersGet;'
      );
      expect(breakingPairs[4].target).toBeUndefined();
    } finally {
      if (tempFolder) remove(tempFolder);
    }
  });
});
