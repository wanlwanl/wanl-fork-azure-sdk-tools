import shell from 'shelljs';
import path from 'path';
import fs from 'fs';

import { SDKType } from './types'
import { Project, ScriptTarget, SourceFile } from 'ts-morph';

export function getClassicClientParametersPath(packageRoot: string): string {
    return path.join(packageRoot, 'src', 'models', 'parameters.ts');
}

export function getSDKType(packageRoot: string): SDKType {
    const packageJsonPath = path.join(packageRoot, 'package.json');
    const packageJson = fs.readFileSync(packageJsonPath, { encoding: 'utf-8' });
    const parsed = JSON.parse(packageJson);
    const isTrack1Client = !("sdk-type" in parsed);
    if (isTrack1Client) { return SDKType.Track1Client; }
    const npmSdkType = parsed["sdk-type"];
    if (npmSdkType !== "mgmt" && npmSdkType !== "client") { throw new Error(`Not supported NPM SDK Type '${npmSdkType}'`); }
    if (npmSdkType === "mgmt") { return SDKType.HighLevelClient; }
    // npmSdkType === "client"
    const packageName = parsed.name;
    const isRestLevelClient = packageName.startsWith('@azure-rest/');
    return isRestLevelClient ? SDKType.RestLevelClient : SDKType.ModularClient;
}

export function getNpmPackageName(packageRoot: string): string {
    const packageJsonPath = path.join(packageRoot, 'package.json');
    const packageJson = fs.readFileSync(packageJsonPath, { encoding: 'utf-8' });
    const packageName = JSON.parse(packageJson).name;
    return packageName;
}

export function getApiReviewPath(packageRoot: string): string {
    const sdkType = getSDKType(packageRoot);
    const reviewDir = path.join(packageRoot, 'review');
    switch (sdkType) {
        case SDKType.ModularClient:
            const npmPackageName = getNpmPackageName(packageRoot);
            const packageName = npmPackageName.substring("@azure/".length);
            const apiViewFileName = `${packageName}.api.md`;
            return path.join(packageRoot, 'review', apiViewFileName);
        case SDKType.HighLevelClient:
        case SDKType.RestLevelClient:
        default:
            // only one xxx.api.md
            return path.join(packageRoot, 'review', fs.readdirSync(reviewDir)[0]);
    }
}

export function getTsSourceFile(filePath: string): SourceFile | undefined {
    const target = ScriptTarget.ES2015;
    const compilerOptions = { target };
    const project = new Project({ compilerOptions });
    project.addSourceFileAtPath(filePath);
    return project.getSourceFile(filePath);
}