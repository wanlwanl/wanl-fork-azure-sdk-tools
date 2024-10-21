# patch

``` ts
// @public (undocumented)
export class MongoClusterManagementClient {
    constructor(a: string);
    readonly firewallRules: FirewallRulesOperations;
}

// @public
export interface FirewallRulesOperations {
    createOrUpdate: (a: string) => string;
    get: (a: string) => string;
}
```
