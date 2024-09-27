import { remove } from 'fs-extra';
import { describe, expect, test } from 'vitest';

import { join } from 'node:path';
import { detectBreakingChangesBetweenPackages } from '../azure/breaking-change-detector';
import { RuleIds } from '../common/models/rules/rule-ids';
import { createTempFolder, getFormattedDate } from './utils';
import { BreakingLocation, BreakingReasons, PatchMessage, RuleMessageKind } from '../azure/common/types';

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

  test("detect interface's breaking changes for include-interface rule", async () => {
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

  test("detect inside of interface breaking changes for include-interface rule", async () => {
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

  test("detect function's breaking changes for include-function rule", async () => {
    const testCaseDir = '../../misc/test-cases/patch-basic-detection/include-function/';
    const currentPackageFolder = join(__dirname, testCaseDir, 'current-package');
    const baselinePackageFolder = join(__dirname, testCaseDir, 'baseline-package');
    const date = getFormattedDate();
    let tempFolder = '';
    try {
      tempFolder = await createTempFolder(`.tmp/temp-${date}`);
      const messagesMap = await detectBreakingChangesBetweenPackages(
        [RuleIds.includeFunction],
        baselinePackageFolder,
        currentPackageFolder,
        tempFolder
      );

      expect(messagesMap.size).toBe(1);
      const messages = messagesMap.get('test.api.md') as PatchMessage[];
      expect(messages.length).toBe(1);
      const message = messages[0];
      console.log('-----------res-----', message);
      expect(message.kind).toBe(RuleMessageKind.PatchMessage);
      expect(message.incompatibleTypeAlias).toBeUndefined();
      expect(message.breakingChanges?.size).toBe(3);
      const breakingChanges = message.breakingChanges!;
      
      // basic parameter type change
      expect(breakingChanges.get('basic_incompatible')?.length).toBe(1);
      const parameterTypePair = breakingChanges.get('basic_incompatible')![0];
      expect(parameterTypePair.location).toBe(BreakingLocation.PropertyFunctionParameter)
      expect(parameterTypePair.reasons).toBe(BreakingReasons.TypeChanged)
      expect(parameterTypePair.baseline?.name).toBe('basic_incompatible_para_1_baseline')
      expect(parameterTypePair.current?.name).toBe('basic_incompatible_para_1_current')
      
      // type guard parameter type change
      expect(breakingChanges.get('type_guard_incompatible_1')?.length).toBe(1);
      const typeGuardParameterTypePair = breakingChanges.get('type_guard_incompatible_1')![0];
      expect(typeGuardParameterTypePair.location).toBe(BreakingLocation.PropertyFunctionParameter)
      expect(typeGuardParameterTypePair.reasons).toBe(BreakingReasons.TypeChanged)
      expect(typeGuardParameterTypePair.baseline?.name).toBe('type_guard_incompatible_1_para_1_baseline')
      expect(typeGuardParameterTypePair.current?.name).toBe('type_guard_incompatible_1_para_1_current')

      // type guard return type change
      expect(breakingChanges.get('type_guard_incompatible_2')?.length).toBe(1);
      const typeGuardReturnTypePair = breakingChanges.get('type_guard_incompatible_2')![0];
      expect(typeGuardReturnTypePair.location).toBe(BreakingLocation.PropertyFunctionReturnType)
      expect(typeGuardReturnTypePair.reasons).toBe(BreakingReasons.TypeChanged)
      expect(typeGuardReturnTypePair.baseline?.name).toBe('type_guard_incompatible_2_para_1_baseline is Derived1')
      expect(typeGuardReturnTypePair.current?.name).toBe('type_guard_incompatible_2_para_1_current is Derived2')

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
