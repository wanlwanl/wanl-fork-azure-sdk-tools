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

  // TODO:
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

      expect(messagesMap.size).toBe(1);
      const messages = messagesMap.get('test.api.md') as PatchMessage[];
      expect(messages.length).toBe(1);
      const message = messages[0];
      expect(message.kind).toBe(RuleMessageKind.PatchMessage);
      expect(message.id).toBe(RuleIds.includeInterface);
      expect(message.incompatibleTypeAlias).toBeUndefined();
      expect(message.breakingChanges?.size).toBe(1);
      const breakingChange = message.breakingChanges!.get('basic');

      console.log('-----------res-----', message.breakingChanges);

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

  test('detect inside of interface breaking changes for include-interface rule', async () => {
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

      // basic test
      expect(messagesMap.size).toBe(1);
      const messages = messagesMap.get('test.api.md') as PatchMessage[];
      expect(messages.length).toBe(1);
      const message = messages[0];
      expect(message.kind).toBe(RuleMessageKind.PatchMessage);
      expect(message.id).toBe(RuleIds.includeInterface);
      expect(message.incompatibleTypeAlias).toBeUndefined();
      expect(message.breakingChanges?.size).toBe(2);

      // check Routes_Inherit
      {
        const inheritBreakingChanges = message.breakingChanges!.get('Routes_Inherit')!;
        expect(inheritBreakingChanges.length).toBe(3);

        // call signature removed
        expect(inheritBreakingChanges[0].location).toBe(BreakingLocation.PropertyCall);
        expect(inheritBreakingChanges[0].reasons).toBe(BreakingReasons.Removed);
        expect(inheritBreakingChanges[0].baseline?.name).toBe('(path: "path_base_remove"): string;');
        expect(inheritBreakingChanges[0].current?.name).toBeUndefined();

        // call signature removed
        expect(inheritBreakingChanges[1].location).toBe(BreakingLocation.PropertyCall);
        expect(inheritBreakingChanges[1].reasons).toBe(BreakingReasons.Removed);
        expect(inheritBreakingChanges[1].baseline?.name).toBe('(path: "path_cross_remove"): number;');
        expect(inheritBreakingChanges[1].current?.name).toBeUndefined();

        // parameter's type changed in call signature
        expect(inheritBreakingChanges[2].location).toBe(BreakingLocation.PropertyFunctionParameter);
        expect(inheritBreakingChanges[2].reasons).toBe(BreakingReasons.TypeChanged);
        expect(inheritBreakingChanges[2].baseline?.name).toBe('method_base_incompatible_parameter_1_baseline');
        expect(inheritBreakingChanges[2].current?.name).toBe('method_base_incompatible_parameter_1_current');
      }

      // check Routes_Extends
      {
        const extendedBreakingChanges = message.breakingChanges!.get('Routes_Extends')!;
        // TODO: check size
        expect(extendedBreakingChanges.length).toBe(32);

        let ind = 0;
        // check call signatures
        {
          // call signature removed
          expect(extendedBreakingChanges[ind].location).toBe(BreakingLocation.PropertyCall);
          expect(extendedBreakingChanges[ind].reasons).toBe(BreakingReasons.Removed);
          expect(extendedBreakingChanges[ind].baseline?.name).toBe('(path: "path_remove"): string;');
          expect(extendedBreakingChanges[ind].current?.name).toBeUndefined();

          // call signature removed in base interface
          ind = 1;
          expect(extendedBreakingChanges[ind].location).toBe(BreakingLocation.PropertyCall);
          expect(extendedBreakingChanges[ind].reasons).toBe(BreakingReasons.Removed);
          expect(extendedBreakingChanges[ind].baseline?.name).toBe('(path: "path_base_remove"): string;');
          expect(extendedBreakingChanges[ind].current?.name).toBeUndefined();

          // call signature removed in cross interfaces
          ind = 2;
          expect(extendedBreakingChanges[ind].location).toBe(BreakingLocation.PropertyCall);
          expect(extendedBreakingChanges[ind].reasons).toBe(BreakingReasons.Removed);
          expect(extendedBreakingChanges[ind].baseline?.name).toBe('(path: "path_cross_remove"): number;');
          expect(extendedBreakingChanges[ind].current?.name).toBeUndefined();
        }

        // check classic properties
        {
          // remove a property
          ind = 3;
          expect(extendedBreakingChanges[ind].location).toBe(BreakingLocation.PropertyClassicProperty);
          expect(extendedBreakingChanges[ind].reasons).toBe(BreakingReasons.Removed);
          expect(extendedBreakingChanges[ind].baseline?.name).toBe('prop_remove');
          expect(extendedBreakingChanges[ind].current?.name).toBeUndefined();

          // check return type change
          ind = 4;
          expect(extendedBreakingChanges[ind].location).toBe(BreakingLocation.PropertyFunctionReturnType);
          expect(extendedBreakingChanges[ind].reasons).toBe(BreakingReasons.TypeChanged);
          expect(extendedBreakingChanges[ind].baseline?.name).toBe(
            'method_return_type_incompatible_return_type_baseline'
          );
          expect(extendedBreakingChanges[ind].current?.name).toBe('string');

          // check return type change from concrete type to any
        }
      }
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

      // basic test
      expect(messagesMap.size).toBe(1);
      const messages = messagesMap.get('test.api.md') as PatchMessage[];
      expect(messages.length).toBe(1);
      const message = messages[0];
      expect(message.kind).toBe(RuleMessageKind.PatchMessage);
      expect(message.id).toBe(RuleIds.includeFunction);
      expect(message.incompatibleTypeAlias).toBeUndefined();
      expect(message.breakingChanges?.size).toBe(3);
      const breakingChanges = message.breakingChanges!;

      // basic parameter type change
      expect(breakingChanges.get('basic_incompatible')?.length).toBe(1);
      const parameterTypePair = breakingChanges.get('basic_incompatible')![0];
      expect(parameterTypePair.location).toBe(BreakingLocation.PropertyFunctionParameter);
      expect(parameterTypePair.reasons).toBe(BreakingReasons.TypeChanged);
      expect(parameterTypePair.baseline?.name).toBe('basic_incompatible_para_1_baseline');
      expect(parameterTypePair.current?.name).toBe('basic_incompatible_para_1_current');

      // type guard parameter type change
      expect(breakingChanges.get('type_guard_incompatible_1')?.length).toBe(1);
      const typeGuardParameterTypePair = breakingChanges.get('type_guard_incompatible_1')![0];
      expect(typeGuardParameterTypePair.location).toBe(BreakingLocation.PropertyFunctionParameter);
      expect(typeGuardParameterTypePair.reasons).toBe(BreakingReasons.TypeChanged);
      expect(typeGuardParameterTypePair.baseline?.name).toBe('type_guard_incompatible_1_para_1_baseline');
      expect(typeGuardParameterTypePair.current?.name).toBe('type_guard_incompatible_1_para_1_current');

      // type guard return type change
      expect(breakingChanges.get('type_guard_incompatible_2')?.length).toBe(1);
      const typeGuardReturnTypePair = breakingChanges.get('type_guard_incompatible_2')![0];
      expect(typeGuardReturnTypePair.location).toBe(BreakingLocation.PropertyFunctionReturnType);
      expect(typeGuardReturnTypePair.reasons).toBe(BreakingReasons.TypeChanged);
      expect(typeGuardReturnTypePair.baseline?.name).toBe('type_guard_incompatible_2_para_1_baseline is Derived1');
      expect(typeGuardReturnTypePair.current?.name).toBe('type_guard_incompatible_2_para_1_current is Derived2');
    } catch (err) {
      throw err;
    } finally {
      await remove(tempFolder);
    }
  });
});
