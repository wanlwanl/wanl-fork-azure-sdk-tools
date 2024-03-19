
@description('The base resource name.')
param baseName string = resourceGroup().name

@description('The location of the resources. By default, this is the same as the resource group.')
param location string = resourceGroup().location

param embeddingsCapacity int = 20
param inferenceCapacity int = 10

var embeddingModelName = 'text-embedding-3-small'
var inferenceModelName = 'gpt-4'

// var openAiDeployments = [
//   {
//     name: inferenceModelName
//     sku: {
//       name: 'Standard'
//       capacity: inferenceCapacity
//     }
//   }
//   {
//     name: embeddingModelName
//     sku: {
//       name: 'Standard'
//       capacity: embeddingsCapacity
//     }
//   }
// ]

// resource knowledgebase 'Microsoft.Search/searchServices@2023-11-01' = {
//   name: baseName
//   location: location
//   tags: {}
//   properties: {
//     replicaCount: 1
//     partitionCount: 1
//     hostingMode: 'default'
//     publicNetworkAccess: 'enabled'
//     networkRuleSet: {
//       ipRules: []
//     }
//     encryptionWithCmk: {
//       enforcement: 'Unspecified'
//     }
//     disableLocalAuth: false
//     authOptions: {
//       apiKeyOnly: {}
//     }
//     semanticSearch: 'disabled'
//   }
//   sku: {
//     name: 'basic'
//   }
// }

// resource openai 'Microsoft.CognitiveServices/accounts@2023-10-01-preview' = {
//   name: baseName
//   location: location
//   sku: {
//     name: 'S0'
//   }
//   kind: 'OpenAI'
//   tags: {}
//   properties: {
//     customSubDomainName: toLower(baseName)
//     networkAcls: {
//       defaultAction: 'Allow'
//       virtualNetworkRules: []
//       ipRules: []
//     }
//     publicNetworkAccess: 'Enabled'
//   }
// }

// @batchSize(1)
// resource deployment 'Microsoft.CognitiveServices/accounts/deployments@2023-05-01'= [for deployment in openAiDeployments: {
//   parent: openai
//   name: deployment.name
//   properties: {
//     model: {
//       format: 'OpenAI'
//       name: deployment.name
//     }
//   }
//   sku: deployment.sku
// }]

resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2021-06-01' = {
  name: baseName
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

resource applicationInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: baseName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalyticsWorkspace.id
    Flow_Type: 'Bluefield'
  }
}

// output OPENAI__ENDPOINT string = openai.properties.endpoint
// output OPENAI__KEY string = openai.listKeys().key1
// output OPENAI__EMBEDDINGMODEL string = embeddingModelName
// output OPENAI__INFERENCEMODEL string = inferenceModelName

// output SEARCH__ENDPOINT string = 'https://${knowledgebase.name}.search.windows.net/'
// output SEARCH__KEY string = knowledgebase.listQueryKeys().value[0].key

output AZUREMONITOR_CONNECTIONSTRING string = applicationInsights.properties.ConnectionString
