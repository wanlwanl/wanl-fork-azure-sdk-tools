import { expect, describe, it } from "vitest";
import { hasOperations } from "../../utils/typespecUtils";
import { SDKType } from "../../common/types";
import { resolve } from "path";

interface Case {
    description: string;
    packageRoot: string;
    sdkType: SDKType;
    expected: boolean;
}

describe("detect operations in specification", () => {
    const cases: Case[] = [
        // TODO: add case 
        {
            description: "should return true on HLC",
            packageRoot: resolve(
                __dirname,
                "testCases/highLevelClient/specification"
            ),
            sdkType: SDKType.HighLevelClient,
            expected: true,
        },
        {
            description: "should return false on RLC with operations",
            packageRoot: resolve(
                __dirname,
                "testCases/restLevelClient/withOperations"
            ),
            sdkType: SDKType.RestLevelClient,
            expected: true,
        },
        {
            description: "should return false on RLC without operations",
            packageRoot: resolve(__dirname, "testCases/withoutOperations"),
            sdkType: SDKType.RestLevelClient,
            expected: false,
        },
        {
            description: "should return true on Modular client with operations",
            packageRoot: resolve(
                __dirname,
                "testCases/modularClient/withOperations"
            ),
            sdkType: SDKType.ModularClient,
            expected: true,
        },
        {
            description:
                "should return false on Modular client without operations",
            packageRoot: resolve(__dirname, "testCases/withoutOperations"),
            sdkType: SDKType.ModularClient,
            expected: false,
        },
    ];
    it.each(cases)("$description", async (c: Case) => {
        expect(await hasOperations(c.packageRoot, c.sdkType)).toBe(c.expected);
    });
});
