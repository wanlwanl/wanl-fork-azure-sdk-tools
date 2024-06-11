import path from 'path';
import fs from 'fs';
import { ApiVersionType, SDKType } from "./types";
import * as mlcApi from '../mlc/apiVersion/apiVersionTypeExtractor'
import * as hlcApi from '../hlc/apiVersion/apiVersionTypeExtractor'
import { logger } from '../utils/logger';
import { getApiReviewPath } from './utils';
import { TSExportedMetaData, readSourceAndExtractMetaData } from '../changelog/extractMetaData';

export class PackageContext {
    private _root: string;
    private _name: string;
    private _sdkType: SDKType;
    private _apiVersionType: ApiVersionType;
    private _rootApiViewPath: string;
    // package.json
    private _config: any;

    constructor(root: string) {
        this._root = root;
        const packageJsonPath = path.join(root, 'package.json');
        const content = fs.readFileSync(packageJsonPath, { encoding: 'utf-8' });
        const json = JSON.parse(content);
        this._sdkType = this._getSDKType();
        this._name = json.name;
        this._apiVersionType = this._getApiVersionType();
        // TODO: remove getApiReviewPath() function in utils
        this._rootApiViewPath = getApiReviewPath(this.root);
    }

    get root(): string {
        return this._root;
    }
    
    get name(): string {
        return this._name;
    }

    get sdkType(): SDKType {
        return this._sdkType;
    }

    get apiVersionType(): ApiVersionType {
        return this._apiVersionType;
    }

    public async GetRootApiViewTsMetaData(): Promise<TSExportedMetaData> {
        const data = await readSourceAndExtractMetaData(this._rootApiViewPath);
        return data;
    }

    private _getSDKType(): SDKType {
        const isTrack1Client = !("sdk-type" in this._config);
        if (isTrack1Client) { return SDKType.Track1Client; }
        const npmSdkType = this._config["sdk-type"];
        if (npmSdkType !== "mgmt" && npmSdkType !== "client") { throw new Error(`Not supported NPM SDK Type '${npmSdkType}'`); }
        if (npmSdkType === "mgmt") { return SDKType.HighLevelClient; }
        // npmSdkType === "client"
        const isRestLevelClient = this._name.startsWith('@azure-rest/');
        return isRestLevelClient ? SDKType.RestLevelClient : SDKType.ModularClient;
    }

    // TODO: remove getApiVersionType() functions ouside of this class
    private _getApiVersionType(): ApiVersionType {
    switch (this._sdkType) {
        case SDKType.ModularClient:
            return mlcApi.getApiVersionType(this._root);
        case SDKType.HighLevelClient:
            return hlcApi.getApiVersionType(this._root);
        default:
            logger.logWarn(`Unsupported SDK type ${this._sdkType} to get detact api version`);
            return ApiVersionType.None;
    }
    }
}