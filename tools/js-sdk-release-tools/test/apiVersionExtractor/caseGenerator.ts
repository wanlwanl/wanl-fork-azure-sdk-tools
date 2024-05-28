import path from "path";

import { SDKType } from "../../src/common/types";

export const TEMP_CONTENT_ROOT = path.join(__dirname, '.temp');

interface MlcSdkContent {

    apiViewPath: string;
    parameterViewPath: string;
}

interface HlcSdkContent {
    apiViewPath: string;
    parameterViewPath: string;
}

function generateMlcSdkContents(config: TestCaseConfig): MlcSdkContent {

}

function generateHlcSdkContents(config: TestCaseConfig): HlcSdkContent {
    const packageName = "package"; // TODO: add random value
    const apiViewPath = path.join(TEMP_CONTENT_ROOT, packageName, "review", `${packageName}.api.md`);
    const parameterViewPath = path.join(TEMP_CONTENT_ROOT, packageName, "src/models/parameters.ts");

    const content: HlcSdkContent = { apiViewPath, parameterViewPath };
    return content;
}

export interface TestCaseConfig {
    sdkType: SDKType;
    clientApiVersion: string | undefined;
    operationApiVersions: string | undefined;
}

export function GenerateTestCase(config: TestCaseConfig): MlcSdkContent | HlcSdkContent | undefined {
    switch (config.sdkType) {
        case SDKType.HLC:
            return generateHlcSdkContents(config);
        case SDKType.MLC:
            return generateMlcSdkContents(config);
        default:
            return undefined;
    }
}