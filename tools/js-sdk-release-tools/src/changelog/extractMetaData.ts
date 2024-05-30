import * as openapiToolsCommon from "@azure-tools/openapi-tools-common";
import { glob, globSync, globStream, globStreamSync, Glob } from 'glob'
import { FunctionDeclaration, TypescriptParser } from "parse-ts-to-ast";
import { ClassDeclaration, EnumDeclaration, InterfaceDeclaration, TypeAliasDeclaration } from "parse-ts-to-ast";
import { Changelog, changelogGenerator } from "./changelogGenerator";
import { logger } from "../utils/logger";
import path, { basename } from "path";
import { getNpmPackageName, getRootApiReviewPath, getSDKType } from "../common/utils";
import { SDKType } from "../common/types";
import { StringMap } from "@azure-tools/openapi-tools-common";

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

const getSubApiViewPaths = async (reviewPath: string, packageName: string): Promise<string[]> => {
    const pattern = path.posix.join(reviewPath, '**/*.md');
    const reportPaths = (await glob(pattern)).filter(p => {
        const nameWithoutExtension = path.parse(p).name;
        return packageName !== nameWithoutExtension;
    });
    return reportPaths;
}

const createSubChangelogsCore = async(toScanMap: StringMap<string>, toCheckMap: StringMap<string>, handledNames: Set<string>):  Promise<Array<Changelog>>=> {
    const changelogs = new Array<Changelog>();
    for (const scanName in Object.keys(toScanMap)) {
        if (handledNames.has(scanName)) {continue;}
        handledNames.add(scanName);
        const scanPath = toScanMap[scanName];
        const scanData = await readSourceAndExtractMetaData(scanPath!);
        let checkData =   new TSExportedMetaData();
        if (scanName in toCheckMap) { 
            const checkPath = toCheckMap[scanName];
            checkData = await readSourceAndExtractMetaData(checkPath!);
        }
        const changeLog = changelogGenerator(scanData, checkData);
        changelogs.push(changeLog);
    }
    return changelogs;
}

const createSubChangelogs = async(oldMap: StringMap<string>, newMap: StringMap<string>, handledNames: Set<string>):  Promise<Array<Changelog>>=> {
    const changelogs = [
        ...await createSubChangelogsCore(oldMap, newMap, handledNames), 
        ...await createSubChangelogsCore(newMap, oldMap, handledNames)];
    return changelogs;
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

export const extractSubModularClientExportAndGenerateChangelog = async (packageName: string, oldSubApiViewPaths: Array<string>, newSubApiViewPaths: Array<string>) => {
    const oldMap = oldSubApiViewPaths.reduce((map, p) => {
        const fileName = path.basename(p);
        map[fileName] = p;
        return map;
    }, {});
    const newMap = newSubApiViewPaths.reduce((map, p) => {
        const fileName = path.basename(p);
        map[fileName] = p;
        return map;
    }, {});
    
    const handledNames = new Set<string>();
    const subChangelogs = createSubChangelogs(oldMap, newMap, handledNames);
    return subChangelogs;
}

export const extractExportAndGenerateChangelog = async (oldPackageRoot: string, newPackageRoot: string) => {
    const oldSdkType = getSDKType(oldPackageRoot);
    const newSdkType = getSDKType(newPackageRoot);

    const newApiReviewPath = getRootApiReviewPath(newPackageRoot);
    const oldApiReviewPath = getRootApiReviewPath(oldPackageRoot);

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
        const changelog = await extractNonModulerClientExportAndGenerateChangelog(oldApiReviewPath, newApiReviewPath);
        return changelog;
    }

    // oldSdkType === newSdkType
    if (newSdkType !== SDKType.ModularClient) {
        const changelog = await extractNonModulerClientExportAndGenerateChangelog(oldApiReviewPath, newApiReviewPath);
        return changelog;
    }

    // oldSdkType === newSdkType === SDKType.ModularClient
    const packageName = getNpmPackageName(oldPackageRoot);
    const getReviewFolderPath = (root: string) => path.join(root, 'review');
    const oldSubApiViewPaths = await getSubApiViewPaths(getReviewFolderPath(oldPackageRoot), packageName);
    const newSubApiViewPaths = await getSubApiViewPaths(getReviewFolderPath(newPackageRoot), packageName);
    const subChangelogs = await extractSubModularClientExportAndGenerateChangelog(packageName, oldSubApiViewPaths, newSubApiViewPaths);
    const rootChangelog = 
};
