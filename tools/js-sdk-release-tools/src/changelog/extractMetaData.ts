import * as openapiToolsCommon from "@azure-tools/openapi-tools-common";
import { glob, globSync, globStream, globStreamSync, Glob } from 'glob'
import { FunctionDeclaration, TypescriptParser } from "parse-ts-to-ast";
import { ClassDeclaration, EnumDeclaration, InterfaceDeclaration, TypeAliasDeclaration } from "parse-ts-to-ast";
import { Changelog, changelogGenerator } from "./changelogGenerator";
import { logger } from "../utils/logger";
import path from "path";
import { getSDKType } from "../common/utils";
import { SDKType } from "../common/types";
import { SdkType } from "../utils/changeConfigOfTestAndSample";

export class TSExportedMetaData {
    public typeAlias = {};
    public operationInterface = {};
    public modelInterface = {};
    public enums = {};
    public classes = {};
    public functions = {};
}


const readMeReader = async (mdFilePath: string) => {
    const content = (await openapiToolsCommon.readFile(mdFilePath)).toString();
    const readMe = openapiToolsCommon.parseMarkdown(content);
    const tsExports = new Set<string>();
    for (const c of openapiToolsCommon.iterate(readMe.markDown)) {
        if (c.type === 'code_block' && c.info !== null && c.info === 'ts' && c.literal !== null) {
            tsExports.add(c.literal);
        }
    }
    return tsExports;
};


const extractMetaData = async (code: string, metaData: TSExportedMetaData) => {
    const tsParser = new TypescriptParser();
    const parsed = await tsParser.parseSource(code);
    parsed.declarations.forEach(declartion => {
        if (declartion instanceof TypeAliasDeclaration) {
            metaData.typeAlias[declartion.name] = declartion;
        } else if (declartion instanceof EnumDeclaration) {
            metaData.enums[declartion.name] = declartion;
        } else if (declartion instanceof ClassDeclaration) {
            metaData.classes[declartion.name] = declartion;
        } else if (declartion instanceof InterfaceDeclaration) {
            if (declartion.properties.length === 0 && declartion.methods.length > 0) {
                metaData.operationInterface[declartion.name] = declartion;
            } else {
                metaData.modelInterface[declartion.name] = declartion;
            }
        } else if (declartion instanceof FunctionDeclaration) {
            metaData.functions[declartion.name] = declartion;
        }
    });
};

const getApiViews = async (reviewPath: string): Promise<string[]> => {
    const pattern = path.posix.join(reviewPath, '**/*.md');
    const apiReports = await glob(pattern);
    return apiReports;
}

export const readAllSourcesFromApiReports = async (reviewPath: string): Promise<TSExportedMetaData> => {
    const pattern = path.posix.join(reviewPath, '**/*.md');
    const apiReports = await glob(pattern);
    console.log('apiReports', apiReports)
    const extractDataTasks = apiReports.map(async report => await readSourceAndExtractMetaData(report));
    const dataList = await Promise.all(extractDataTasks);
    const allData = dataList.reduce((all, data) => {
        all.typeAlias = { ...all.typeAlias, ...data.typeAlias };
        all.operationInterface = { ...all.operationInterface, ...data.operationInterface };
        all.modelInterface = { ...all.modelInterface, ...data.modelInterface };
        all.classes = { ...all.classes, ...data.classes };
        all.enums = { ...all.enums, ...data.enums };
        all.functions = { ...all.functions, ...data.functions };
        return all;
    }, new TSExportedMetaData());
    return allData;
}

export const readSourceAndExtractMetaData = async (mdFilePath: string) => {
    const metaData = new TSExportedMetaData();
    const tsExports = await readMeReader(mdFilePath);
    for (const t of tsExports) {
        await extractMetaData(t, metaData);
    }
    return metaData;
};

export const extractNonModulerClientExportAndGenerateChangelog = async (mdFilePathOld: string, mdFilePathNew: string) => {
    const metaDataOld = await readSourceAndExtractMetaData(mdFilePathOld);
    const metaDataNew = await readSourceAndExtractMetaData(mdFilePathNew);
    const changeLog = changelogGenerator(metaDataOld, metaDataNew);
    logger.log(changeLog.displayChangeLog());
    return changeLog;
}

export const extractExportAndGenerateChangelog = async (oldPackageRoot: string, newPackageRoot: string) => {
    const oldSdkType = getSDKType(oldPackageRoot);
    const newSdkType = getSDKType(newPackageRoot);

    6
    if (oldSdkType !== newSdkType) {
        if (oldSdkType !== SDKType.HighLevelClient || newSdkType !== SDKType.ModularClient) {
            throw new Error(
                `Unsupported types for old package '${oldSdkType}' and ${newSdkType}.\n` +
                `Supported old new pairs are:\n` +
                `${SDKType.HighLevelClient} -> ${SDKType.ModularClient}\n` +
                `${SDKType.RestLevelClient} -> ${SDKType.RestLevelClient}\n` +
                `${SDKType.ModularClient} -> ${SDKType.ModularClient}\n` +
                `${SDKType.HighLevelClient} -> ${SDKType.HighLevelClient}\n`);
            }
            
        // oldSdkType === SDKType.HighLevelClient && newSdkType === SDKType.ModularClient
        // TODO
    }

    // oldSdkType === newSdkType
    if (newSdkType !== SDKType.ModularClient) {
        const newReviewPath = path.join(newPackageRoot, 'review');
        const oldReviewPath = path.join(oldPackageRoot, 'review');
        const changelog = await extractNonModulerClientExportAndGenerateChangelog(oldReviewPath, newReviewPath);
        return changelog;
    }

    // oldSdkType === newSdkType === SDKType.ModularClient

};
