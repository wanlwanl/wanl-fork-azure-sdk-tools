import { remove } from 'fs-extra';
import { describe, expect, test } from 'vitest';

import { join } from 'node:path';
import { detectBreakingChangesBetweenPackages } from '../azure/breaking-change-detector';
import { RuleIds } from '../common/models/rules/rule-ids';
import { createTempFolder, getFormattedDate } from './utils';
import { PatchMessage, RuleMessageKind } from '../azure/common/types';

describe('patch basic breaking changes', async () => {
  test('detect union type alias breaking change', async () => {
    const testCaseDir = '../../misc/test-cases/patch-basic-detection/include-union-type-alias';
    const currentPackageFolder = join(__dirname, testCaseDir, 'current-package');
    const baselinePackageFolder = join(__dirname, testCaseDir, 'baseline-package');
    const date = getFormattedDate();
    let tempFolder = '';
    try {
      tempFolder = await createTempFolder(`.tmp/temp-${date}`);
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
          expect(patchMessage.incompatibleTypeAlias!.size).toBe(2);
          ['x', 'y'].forEach((key) => expect(patchMessage.incompatibleTypeAlias!.has(key)).toBe(true));
        });
      });
    } catch (err) {
      throw err;
    } finally {
      await remove(tempFolder);
    }
  });

  test('detect interface\'s breaking changes for include-interface rule', async () => {
    const testCaseDir = '../../misc/test-cases/patch-basic-detection/include-interface/interface-level';
    const currentPackageFolder = join(__dirname, testCaseDir, 'current-package');
    const baselinePackageFolder = join(__dirname, testCaseDir, 'baseline-package');
    const date = getFormattedDate();
    let tempFolder = '';
    try {
      tempFolder = await createTempFolder(`.tmp/temp-${date}`);
      const messagesMap = await detectBreakingChangesBetweenPackages(
        [RuleIds.includeInterface],
        baselinePackageFolder,
        currentPackageFolder,
        tempFolder
      );

      console.log('-----------res-----', messagesMap);
      expect(messagesMap.size).toBe(1);
      messagesMap.forEach((messages) => {
        messages?.forEach((message) => {
          expect(message.kind).toBe(RuleMessageKind.PatchMessage);
          const patchMessage = message as PatchMessage;
          expect(patchMessage.incompatibleTypeAlias).toBeUndefined();
        });
      });
    } catch (err) {
      throw err;
    } finally {
      await remove(tempFolder);
    }
  });

  test('detect children\'s of interface breaking changes for include-interface rule', async () => {
    const testCaseDir = '../../misc/test-cases/patch-basic-detection/include-interface/property-level';
    const currentPackageFolder = join(__dirname, testCaseDir, 'current-package');
    const baselinePackageFolder = join(__dirname, testCaseDir, 'baseline-package');
    const date = getFormattedDate();
    let tempFolder = '';
    try {
      tempFolder = await createTempFolder(`.tmp/temp-${date}`);
      const messagesMap = await detectBreakingChangesBetweenPackages(
        [RuleIds.includeInterface],
        baselinePackageFolder,
        currentPackageFolder,
        tempFolder
      );

      console.log('-----------res-----', messagesMap);
      expect(messagesMap.size).toBe(1);
      messagesMap.forEach((messages) => {
        messages?.forEach((message) => {
          expect(message.kind).toBe(RuleMessageKind.PatchMessage);
          const patchMessage = message as PatchMessage;
          expect(patchMessage.incompatibleTypeAlias).toBeUndefined();
        });
      });
    } catch (err) {
      throw err;
    } finally {
      await remove(tempFolder);
    }
  });
});
