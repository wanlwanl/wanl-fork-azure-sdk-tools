## API Report File for "@azure/arm-networkanalytics"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts
// @public (undocumented)
export interface DataProductsCatalogsOperations {
    // (undocumented)
    get: (subscriptionId: string, resourceGroupName: string, options?: DataProductsCatalogsGetOptionalParams) => Promise<DataProductsCatalog>;
    // (undocumented)
    listByResourceGroup_NEW: (subscriptionId: string, resourceGroupName: string, options?: DataProductsCatalogsListByResourceGroupOptionalParams) => PagedAsyncIterableIterator<DataProductsCatalog>;
    // (undocumented)
    listBySubscription: (subscriptionId: string, options?: DataProductsCatalogsListBySubscriptionOptionalParams) => PagedAsyncIterableIterator<DataProductsCatalog>;
}
// (No @packageDocumentation comment for this package)
```