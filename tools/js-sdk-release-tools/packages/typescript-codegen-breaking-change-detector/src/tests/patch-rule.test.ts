import { remove } from 'fs-extra';
import { describe, expect, test } from 'vitest';

import { join } from 'node:path';
import { detectBreakingChangesBetweenPackages } from '../azure/detect-breaking-changes';
import { RuleIds } from '../common/models/rules/rule-ids';
import { createTempFolder, getFormattedDate } from './utils';
import { PatchMessage, RuleMessageKind } from '../azure/common/types';

describe('patch basic breaking changes', async () => {
  const testCaseDir = '../../misc/test-cases/patch-basic-detection';
  const currentPackageFolder = join(__dirname, testCaseDir, 'current-package');
  const baselinePackageFolder = join(__dirname, testCaseDir, 'baseline-package');
  const date = getFormattedDate();
  let tempFolder = '';
  try {
    tempFolder = await createTempFolder(`.tmp/temp-${date}`);

    test('detect union type alias breaking change', async () => {
      const messagesMap = await detectBreakingChangesBetweenPackages(
        [RuleIds.includeUnionTypeAlias],
        baselinePackageFolder,
        currentPackageFolder,
        tempFolder
      );
      expect(messagesMap.size).toBe(1);
      messagesMap.forEach((messages) => {
        messages?.forEach((message) => {
          expect(message.kind).toBe(RuleMessageKind.PatchMessage);
          const patchMessage = message as PatchMessage;
          expect(patchMessage.incompatibleInterfaces).toBeUndefined();
          expect(patchMessage.incompatibleTypeAlias!.size).toBe(2);
          ['x', 'y'].forEach((key) => expect(patchMessage.incompatibleTypeAlias!.has(key)).toBe(true));
        });
      });
    });

    test('detect interface breaking change', async () => {
      const messagesMap = await detectBreakingChangesBetweenPackages(
        [RuleIds.includeInterface],
        baselinePackageFolder,
        currentPackageFolder,
        tempFolder
      );
      expect(messagesMap.size).toBe(1);
      messagesMap.forEach((messages) => {
        messages?.forEach((message) => {
          expect(message.kind).toBe(RuleMessageKind.PatchMessage);
          const patchMessage = message as PatchMessage;
          expect(patchMessage.incompatibleTypeAlias).toBeUndefined();
          expect(patchMessage.incompatibleInterfaces!.size).toBe(3);
          ['Routes1', 'Routes2', 'Routes3'].forEach((key) =>
            expect(patchMessage.incompatibleInterfaces!.has(key)).toBe(true)
          );
        });
      });
    });
  } catch (err) {
    throw err;
  } finally {
    await remove(tempFolder);
  }
});
