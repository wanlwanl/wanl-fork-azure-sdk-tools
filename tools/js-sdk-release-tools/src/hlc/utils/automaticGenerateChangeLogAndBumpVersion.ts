import fs from 'fs';
import path from 'path';
import shell from 'shelljs';

import {extractExportAndGenerateChangelog, readSourceAndExtractMetaData } from "../../changelog/extractMetaData";
import {Changelog, changelogGenerator } from "../../changelog/changelogGenerator";
import {NPMScope, NPMViewResult, npmView} from "@ts-common/azure-js-dev-tools";
import {
    makeChangesForFirstRelease,
    makeChangesForMigrateTrack1ToTrack2, makeChangesForPatchReleasingTrack2,
    makeChangesForReleasingTrack2
} from "./modifyChangelogFileAndBumpVersion";
import {logger} from "../../utils/logger";
import {
    bumpPatchVersion,
    bumpPreviewVersion,
    getNewVersion,
    getVersion,
    isBetaVersion
} from "../../utils/version";
import {execSync} from "child_process";
import { getversionDate } from "../../utils/version";
import { ApiVersionType, SDKType } from "../../common/types"
import { getApiReviewPath, getNpmPackageName } from '../../common/utils';
import { PackageContext } from '../../common/PackageContext';

function getNextVersionChangelog(packageContext: PackageContext, npmViewResult: NPMViewResult) : string | undefined {
    const stableVersion = getVersion(npmViewResult,"latest");
    const nextVersion = getVersion(npmViewResult, "next");

    if (!nextVersion) { return undefined; }
    if (!stableVersion) { throw new Error(`Invalid latest version ${stableVersion}`); }

    const packageFolderPath = packageContext.root;
    shell.cd(path.join(packageFolderPath, 'changelog-temp'));
    shell.mkdir(path.join(packageFolderPath, 'changelog-temp', 'next'));
    shell.cd(path.join(packageFolderPath,'changelog-temp', 'next'));
    shell.exec(`npm pack ${packageContext.name}@${nextVersion}`);
    const files = shell.ls('*.tgz');
    shell.exec(`tar -xzf ${files[0]}`);
    shell.cd(packageFolderPath);
    logger.log("Create next folder successfully")

    const latestDate = getversionDate(npmViewResult, stableVersion);
    const nextDate = getversionDate(npmViewResult,nextVersion);
    if (latestDate && nextDate && latestDate <= nextDate){
        const originalChangeLogContent = fs.readFileSync(path.join(packageFolderPath,'changelog-temp', 'next', 'package', 'CHANGELOG.md'), {encoding: 'utf-8'});
        logger.log('Need to keep previous preview changelog');
        return originalChangeLogContent;
    }
    return undefined;
}

function ensureValidPackageComparison(oldPackageContext: PackageContext, newPackageContext: PackageContext): void {
    const oldSdkType = oldPackageContext.sdkType;
    const newSdkType = newPackageContext.sdkType;
    if (oldSdkType === newSdkType ||
        oldSdkType === SDKType.HighLevelClient && newSdkType === SDKType.ModularClient ||
        oldSdkType === SDKType.Track1Client && newSdkType === SDKType.HighLevelClient ||
        oldSdkType === SDKType.Track1Client && newSdkType === SDKType.ModularClient) { 
            return;
    }
    throw new Error(`Unsupported types for old package ${oldSdkType} and ${newSdkType}.\n`);
}

async function generateRestLevelClientChangelog(oldPackageContext: PackageContext, newPackageContext: PackageContext): Changelog {
    const oldTsMeta = await oldPackageContext.GetRootApiViewTsMetaData();
    const newTsMeta = await newPackageContext.GetRootApiViewTsMetaData();

}

export async function generateChangelogAndBumpVersion(packageFolderPath: string) {
    const jsSdkRepoPath = String(shell.pwd());
    packageFolderPath = path.join(jsSdkRepoPath, packageFolderPath);

    const packageContext = new PackageContext(packageFolderPath);
    const isStableRelease = packageContext.apiVersionType != ApiVersionType.Preview;
    const packageName = getNpmPackageName(packageFolderPath);
    const npm = new NPMScope({ executionFolderPath: packageFolderPath });
    const npmViewResult: NPMViewResult = await npm.view({ packageName });
    const stableVersion = getVersion(npmViewResult,"latest");

    if (npmViewResult.exitCode !== 0 || (!!stableVersion && isBetaVersion(stableVersion) && isStableRelease)) {
        logger.log(`Package ${packageName} is first${npmViewResult.exitCode !== 0? ' ': ' stable'} release, generating changelogs and setting version for first${npmViewResult.exitCode !== 0? ' ': ' stable'} release...`);
        makeChangesForFirstRelease(packageFolderPath, isStableRelease);
        logger.log(`Generate changelogs and setting version for first${npmViewResult.exitCode !== 0? ' ': ' stable'} release successfully`);
    } else {
        if (!stableVersion) {
            logger.logError(`Invalid latest version ${stableVersion}`);
            process.exit(1);
        }
        logger.log(`Package ${packageName} has been released before, checking whether previous release is track2 sdk...`)
        const usedVersions = npmViewResult['versions'];
        // In our rule, we always compare to stableVersion. 
        // But here we should pay attention to the some stableVersion which contains beta,
        // which means the package has not been GA.
        try {
            shell.mkdir(path.join(packageFolderPath, 'changelog-temp'));
            shell.cd(path.join(packageFolderPath, 'changelog-temp'));
            shell.exec(`npm pack ${packageName}@${stableVersion}`);
            const files = shell.ls('*.tgz');
            shell.exec(`tar -xzf ${files[0]}`);
            shell.cd(packageFolderPath);

            // only track2 sdk includes sdk-type with value mgmt
            const npmPackageRoot = path.join(packageFolderPath, 'changelog-temp', 'package');
            const npmPackageContext = new PackageContext(npmPackageRoot); 

            ensureValidPackageComparison(npmPackageContext, packageContext);

            if (npmPackageContext.sdkType === SDKType.Track1Client) {
                logger.log(`Package ${packageName} released before is track1 sdk`);
                logger.log('Generating changelog of migrating track1 to track2 sdk...');
                const newVersion = getNewVersion(stableVersion, usedVersions, true, isStableRelease);
                makeChangesForMigrateTrack1ToTrack2(packageFolderPath, newVersion);
                logger.log('Generate changelogs and setting version for migrating track1 to track2 successfully');
                return;
            }

            if (npmPackageContext.sdkType === SDKType.RestLevelClient && packageContext.sdkType == SDKType.RestLevelClient) {
                generateRestLevelClientChangelog(npmPackageContext, packageContext); 
                return;
            }

            // TODO: compare modular client's API views (root, model and api layers)

            // TODO: refactor this long code
            // Only compare root API view
            logger.log(`Package ${packageName} released before is track2 sdk`);
            logger.log('Generating changelog by comparing api.md...');
            const apiMdFileNPM = getApiReviewPath(npmPackageRoot);
            const apiMdFileLocal = getApiReviewPath(packageFolderPath);
            const changelog: Changelog = await extractExportAndGenerateChangelog(apiMdFileNPM, apiMdFileLocal);
            let originalChangeLogContent = fs.readFileSync(path.join(packageFolderPath, 'changelog-temp', 'package', 'CHANGELOG.md'), {encoding: 'utf-8'});
            const nextVersionChangelog = getNextVersionChangelog(packageContext, npmViewResult);
            if (nextVersionChangelog) {originalChangeLogContent = nextVersionChangelog;}
            if(originalChangeLogContent.includes("https://aka.ms/js-track2-quickstart")){
                originalChangeLogContent=originalChangeLogContent.replace("https://aka.ms/js-track2-quickstart","https://aka.ms/azsdk/js/mgmt/quickstart");
            }
            if (!changelog.hasBreakingChange && !changelog.hasFeature) {
                logger.logError('Cannot generate changelog because the codes of local and npm may be the same.');
                logger.log('Try to bump a fix version');
                const oriPackageJson = execSync(`git show HEAD:${path.relative(jsSdkRepoPath, path.join(packageFolderPath, 'package.json')).replace(/\\/g, '/')}`, {encoding: 'utf-8'});
                const oriVersion = JSON.parse(oriPackageJson).version;
                const oriVersionReleased = !usedVersions? false : usedVersions.includes(oriVersion);
                let newVersion = oriVersion;
                if (oriVersionReleased) {
                    newVersion = isBetaVersion(oriVersion)? bumpPreviewVersion(oriVersion, usedVersions) : bumpPatchVersion(oriVersion, usedVersions);
                }
                makeChangesForPatchReleasingTrack2(packageFolderPath, newVersion);
            } else {
                const newVersion = getNewVersion(stableVersion, usedVersions, changelog.hasBreakingChange, isStableRelease);
                makeChangesForReleasingTrack2(packageFolderPath, newVersion, changelog, originalChangeLogContent,stableVersion);
                logger.log('Generate changelogs and setting version for track2 release successfully');
                return changelog;
            }
        } finally {
            shell.rm('-r', `${path.join(packageFolderPath, 'changelog-temp')}`);
            shell.cd(jsSdkRepoPath);
        }
    }
}
