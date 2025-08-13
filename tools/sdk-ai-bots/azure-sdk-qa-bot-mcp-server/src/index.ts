#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  CallToolResult,
  Tool,
  Resource,
} from '@modelcontextprotocol/sdk/types.js';
import { completion, CompletionRequest, CompletionResponse } from './tools/completion.js';

// Create MCP server instance
const server = new Server(
  {
    name: 'azure-sdk-qa-bot-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Available tenants and sources for reference
const TENANTS = [
  'azure_sdk_qa_bot',
  'typespec_extension', 
  'python_channel_qa_bot',
  'azure_sdk_onboarding'
] as const;

const SOURCES = [
  'typespec_docs',
  'typespec_azure_docs',
  'azure_rest_api_specs_wiki',
  'azure_sdk_for_python_docs',
  'azure_sdk_for_python_wiki',
  'static_typespec_qa',
  'azure_api_guidelines',
  'azure_resource_manager_rpc',
  'static_typespec_migration_docs',
  'azure-sdk-docs-eng',
  'azure-sdk-guidelines',
  'typespec_azure_http_specs',
  'typespec_http_specs'
] as const;

// Define tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const tools: Tool[] = [
    {
      name: 'ask_azure_sdk_qa',
      description: 'Ask a question to the Azure SDK QA bot. This tool can answer questions about Azure SDK onboarding, TypeSpec, and related development topics. Supports conversation history for context-aware responses.',
      inputSchema: {
        type: 'object',
        properties: {
          question: {
            type: 'string',
            description: 'The question to ask the Azure SDK QA bot'
          },
          history: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                role: {
                  type: 'string',
                  enum: ['user', 'assistant', 'system']
                },
                content: {
                  type: 'string',
                  description: 'The message content'
                }
              },
              required: ['role', 'content']
            },
            description: 'Optional previous conversation messages for context-aware responses'
          },
          tenant_id: {
            type: 'string',
            enum: [...TENANTS],
            description: 'The tenant/bot to query, you need to choose the most relevant tenant.',
            default: 'azure_sdk_qa_bot'
          }
        },
        required: ['question']
      }
    }
  ];

  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'ask_azure_sdk_qa': {
        const { 
          question, 
          history = [],
          tenant_id = 'azure_sdk_qa_bot',

        } = args as any;

        const options: Partial<CompletionRequest> = {
          tenant_id: tenant_id as any,
          ...(history.length > 0 && { 
            history: history.map((msg: any) => ({
              role: msg.role,
              content: msg.content
            }))
          })
        };

        const result: CompletionResponse = await completion(question, options);
        
        let responseText = `**Answer:** ${result.answer}\n\n`;
        
        if (result.references && result.references.length > 0) {
          responseText += `**References:**\n`;
          result.references.forEach((ref, i) => {
            responseText += `${i + 1}. [${ref.title}](${ref.link}) - ${ref.source}\n`;
          });
          responseText += '\n';
        }

        if (result.intension) {
          responseText += `**Question Analysis:**\n`;
          responseText += `- Category: ${result.intension.category}\n`;
          responseText += `- Scope: ${result.intension.scope || 'N/A'}\n`;
          if (result.intension.spec_type) {
            responseText += `- Spec Type: ${result.intension.spec_type}\n`;
          }
          responseText += '\n';
        }

        if (result.reasoning_progress) {
          responseText += `**Reasoning Process:**\n${result.reasoning_progress}\n\n`;
        }

        return {
          content: [
            {
              type: 'text',
              text: responseText.trim()
            }
          ]
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`
        }
      ],
      isError: true
    };
  }
});

// Define resources (informational endpoints)
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const resources: Resource[] = [
    {
      uri: 'info://tenants',
      name: 'Available Tenants',
      description: 'List of available Azure SDK QA bot tenants',
      mimeType: 'application/json'
    },
    {
      uri: 'info://sources', 
      name: 'Available Sources',
      description: 'List of available knowledge sources',
      mimeType: 'application/json'
    }
  ];

  return { resources };
});

// Handle resource reads
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  switch (uri) {
    case 'info://tenants':
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify({
              tenants: TENANTS.map(id => ({
                id,
                description: getTenantDescription(id)
              }))
            }, null, 2)
          }
        ]
      };
      
    case 'info://sources':
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify({
              sources: SOURCES.map(id => ({
                id,
                description: getSourceDescription(id)
              }))
            }, null, 2)
          }
        ]
      };
      
    default:
      throw new Error(`Resource not found: ${uri}`);
  }
});

// Helper functions
function getTenantDescription(tenantId: string): string {
  switch (tenantId) {
    case 'azure_sdk_qa_bot':
      return 'General Azure SDK questions and guidance';
    case 'typespec_extension':
      return 'TypeSpec language and tooling questions';
    case 'python_channel_qa_bot':
      return 'Python-specific Azure SDK questions';
    case 'azure_sdk_onboarding':
      return 'Getting started and onboarding questions';
    default:
      return 'Azure SDK QA bot tenant';
  }
}

function getSourceDescription(sourceId: string): string {
  switch (sourceId) {
    case 'typespec_docs':
      return 'TypeSpec language documentation';
    case 'typespec_azure_docs':
      return 'TypeSpec for Azure documentation';
    case 'azure_rest_api_specs_wiki':
      return 'Azure REST API specifications wiki';
    case 'azure_sdk_for_python_docs':
      return 'Azure SDK for Python documentation';
    case 'azure-sdk-guidelines':
      return 'Azure SDK development guidelines';
    case 'azure_api_guidelines':
      return 'Azure API design guidelines';
    default:
      return 'Knowledge source';
  }
}

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Azure SDK QA Bot MCP Server running on stdio');
}

// Handle shutdown gracefully
process.on('SIGINT', async () => {
  console.error('Shutting down server...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('Shutting down server...');
  process.exit(0);
});

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
