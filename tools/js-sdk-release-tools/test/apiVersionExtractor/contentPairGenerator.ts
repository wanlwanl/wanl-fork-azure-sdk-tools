import util from 'node:util';

const apiViewContentBase = `
import * as coreAuth from '@azure/core-auth';
import * as coreClient from '@azure/core-client';
import { PagedAsyncIterableIterator } from '@azure/core-paging';

// @public (undocumented)
export class AdvisorManagementClient extends coreClient.ServiceClient {
}

// @public (undocumented)
export interface ExampleInterface {
    para?: string;
}
`;

const hlcParameterContentTemplate = `
export const apiVersion: OperationQueryParameter = {
  parameterPath: "apiVersion",
  mapper: {
    defaultValue: "%s",
    isConstant: true,
    serializedName: "api-version",
    type: {
      name: "String"
    }
  }
};
`;

const mlcParameterContentTemplate = `
`;

interface ChangePair {
    getOldContent(): string;
    getNewContent(): string;
}

function createInterfaceContent(name: string = "DefaultInterface", propertyName: string | undefined = "para", propertyType: string | undefined = "string"): string {
    const property = propertyName && propertyType && propertyName.length > 0 && propertyType.length > 0 ?
        `${propertyName}: ${propertyType};` : "";
    return `
// @public (undocumented)
export interface ${name} {
    ${property}
}`;
}

export class HlcApiVersionPair implements ChangePair {
    private oldApiVersion: string | undefined;
    private newApiVersion: string | undefined;
    constructor(oldApiVersion: string | undefined = undefined, newApiVersion: string | undefined = undefined) {
        this.oldApiVersion = oldApiVersion;
        this.newApiVersion = newApiVersion;
    }
    public getOldContent(): string {
        return this.getContent(this.oldApiVersion);
    }
    public getNewContent(): string {
        return this.getContent(this.newApiVersion);
    }
    private getContent(apiVersion: string | undefined) {
        if (!apiVersion) return "";
        return util.format(hlcParameterContentTemplate, apiVersion);

    }
}

export class AddInterfacePair implements ChangePair {
    private name: string;
    constructor(name: string = "AddInterface") {
        this.name = name;
    }
    public getOldContent(): string {
        return "";
    }
    public getNewContent() {
        return createInterfaceContent(this.name);
    }
}

export class RemoveInterfacePair implements ChangePair {
    private name: string;
    constructor(name: string = "RemoveInterface") {
        this.name = name;
    }
    public getOldContent(): string {
        return createInterfaceContent(this.name);
    }
    public getNewContent() {
        return "";
    }
}

export class RenameInterfacePair implements ChangePair {
    private oldName: string;
    private newName: string;
    constructor(oldName: string = "OldRenameInterface", newName: string = "NewRenameInterface") {
        this.oldName = oldName;
        this.newName = newName;
    }
    public getOldContent(): string {
        return createInterfaceContent(this.oldName);
    }
    public getNewContent() {
        return createInterfaceContent(this.newName);
    }
}

export class RenamePropertyInterfacePair implements ChangePair {
    private name: string;
    private oldPropertyName: string;
    private newPropertyName: string;
    constructor(name: string = "RenamePropertyInterface", oldPropertyName: string = "oldPara", newPropertyName: string = "newPara") {
        this.name = name;
        this.oldPropertyName = oldPropertyName;
        this.newPropertyName = newPropertyName;
    }
    public getOldContent(): string {
        return createInterfaceContent(this.name, this.oldPropertyName);
    }
    public getNewContent() {
        return createInterfaceContent(this.name, this.newPropertyName);
    }
}

export class RetypePropertyInterfacePair implements ChangePair {
    private name: string;
    private propertyName: string;
    private oldPropertyType: string;
    private newPropertyType: string;
    constructor(name: string = "RetypePropertyInterface", propertyName: string = "para", oldPropertyType: string = "oldType", newPropertyType: string = "newType") {
        this.name = name;
        this.propertyName = propertyName;
        this.oldPropertyType = oldPropertyType;
        this.newPropertyType = newPropertyType;
    }
    public getOldContent(): string {
        return createInterfaceContent(this.name, this.propertyName, this.oldPropertyType);
    }
    public getNewContent() {
        return createInterfaceContent(this.name, this.propertyName, this.newPropertyType);
    }
}

export class AddPropertyInterfacePair implements ChangePair {
    private name: string;
    private propertyName: string;
    constructor(name: string = "AddPropertyInterface", propertyName: string = "para") {
        this.name = name;
        this.propertyName = propertyName;
    }
    public getOldContent(): string {
        return createInterfaceContent(this.name, undefined);
    }
    public getNewContent() {
        return createInterfaceContent(this.name, this.propertyName);
    }
}

export class RemovePropertyInterfacePair implements ChangePair {
    private name: string;
    private propertyName: string;
    constructor(name: string = "RemovePropertyInterface", propertyName: string = "para") {
        this.name = name;
        this.propertyName = propertyName;
    }
    public getOldContent(): string {
        return createInterfaceContent(this.name, this.propertyName);
    }
    public getNewContent() {
        return createInterfaceContent(this.name, undefined);
    }
}

export interface ApiViewContentPair {
    old: string;
    new: string;
}

export function generateHlcToHlcContentPair(pairs: Array<ChangePair>): ApiViewContentPair {
    const content: ApiViewContentPair = { old: apiViewContentBase, new: apiViewContentBase };
    pairs.forEach(diff => {
        content.old += diff.getOldContent();
        content.new += diff.getNewContent();
    });
    return content;
}