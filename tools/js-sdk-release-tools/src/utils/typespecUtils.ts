import { SDKType } from "../common/types";
import path from "path";
import { exists } from "fs-extra";

export async function hasOperations(packageRoot: string, sdkType: SDKType) {
    switch (sdkType) {
        case SDKType.ModularClient: {
            const operationsPath = path.join(
                packageRoot,
                "src/generated/api/operations.ts"
            );
            return await exists(operationsPath);
        }
        case SDKType.RestLevelClient: {
            const parametersPath = path.join(
                packageRoot,
                "generated/parameters.ts"
            );
            return await exists(parametersPath);
        }
        case SDKType.HighLevelClient: {
            const parameterPath = path.join(
                packageRoot,
                "src/models/parameters.ts"
            );
            return await exists(parameterPath);
        }
        default:
            return true;
    }
}
