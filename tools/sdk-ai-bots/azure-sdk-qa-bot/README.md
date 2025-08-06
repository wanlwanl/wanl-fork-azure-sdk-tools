# Azure SDK QA Bot

## Overview

This application is built on the [Teams AI Library](https://aka.ms/teams-ai-library) and provides an intelligent chatbot experience similar to ChatGPT within Microsoft Teams. The bot specializes in answering questions related to Azure SDK and TypeSpec development, enabling seamless developer support directly in Teams.

## Configuration

### Display Names
- **botDisplayName**: The name displayed in Teams channels
- **TEAMS_BOT_SHORT_DISPLAY_NAME**: The name displayed when mentioning the bot with @

## Development Roadmap

### Infrastructure Tasks
- [ ] Separate environments for computer vision services
- [ ] Add Bicep templates for managed identity storage grants
- [ ] Configure `Storage Account Contributor` and `Storage Table Data Contributor` roles in IAM

### Testing Tasks
- [ ] Implement tests for conversation context handling

---

## Getting Started

### Prerequisites

To run this application locally, you'll need:

- [Node.js](https://nodejs.org/) (supported versions: 18, 20, 22)
- [Teams Toolkit Visual Studio Code Extension](https://aka.ms/teams-toolkit) (latest version) or [Teams Toolkit CLI](https://aka.ms/teamsfx-toolkit-cli)
- Access to [Azure OpenAI](https://aka.ms/oai/access) resources

> **Note**: For local debugging with Teams Toolkit CLI, refer to the [CLI debugging setup guide](https://aka.ms/teamsfx-cli-debugging).

### Building the Project

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Build the Project**:
   ```bash
   npm run build
   ```
   This command:
   - Compiles TypeScript files to JavaScript
   - Copies prompt templates to the output directory
   - Generates source maps for debugging

3. **Available Build Scripts**:
   ```bash
   npm run build        # Full production build
   npm run dev          # Development mode with hot reload
   npm start            # Start the built application
   npm run watch        # Start with file watching
   npm test             # Run tests (placeholder)
   ```

### Build Output

After running `npm run build`, you'll find:
- Compiled JavaScript files in `./lib/src/`
- Copied prompt templates in `./lib/src/prompts/`
- Source maps for debugging

### Local Development Setup

1. Open the Teams Toolkit panel in VS Code (left sidebar)
2. Configure your environment in `env/.env.testtool.user`:
   ```
   SECRET_RAG_API_KEY=<your-azure-openai-key>
   RAG_ENDPOINT=<your-azure-openai-endpoint>
   RAG_TENANT_ID=<your-deployment-name>
   ```
3. Press F5 to start debugging, which will launch the Teams App Test Tool in your browser
4. Select `Debug in Test Tool`
5. Send any message to interact with the bot

**Success!** You now have a running AI chatbot that can respond to user queries in the Teams App Test Tool.

![Basic AI Chatbot](https://github.com/OfficeDev/TeamsFx/assets/9698542/9bd22201-8fda-4252-a0b3-79531c963e5e)

## Project Structure

| Directory    | Description                                   |
| ------------ | --------------------------------------------- |
| `.vscode`    | VS Code debugging configuration files        |
| `appPackage` | Teams application manifest templates          |
| `env`        | Environment configuration files               |
| `infra`      | Azure resource provisioning templates        |
| `src`        | Application source code                       |

| Directory    | Description                                   |
| ------------ | --------------------------------------------- |
| `.vscode`    | VS Code debugging configuration files        |
| `appPackage` | Teams application manifest templates          |
| `env`        | Environment configuration files               |
| `infra`      | Azure resource provisioning templates        |
| `src`        | Application source code                       |

## Key Files

The following files provide the core functionality and can be customized for your needs:

| File                                | Purpose                                         |
| ----------------------------------- | ----------------------------------------------- |
| `src/index.ts`                      | Bot application server setup                    |
| `src/input/ConversationHandler.ts`  | Cosmos DB conversation message storage          |
| `src/adapter.ts`                    | Bot adapter configuration                       |
| `src/config.ts`                     | Environment variable definitions                |
| `src/prompts/chat/skprompt.txt`     | AI prompt templates                             |
| `src/prompts/chat/config.json`      | Prompt configuration settings                   |
| `src/app/app.ts`                    | Core chatbot business logic                     |

> **Note**: For detailed information on Cosmos DB storage setup for conversation history, see the [Cosmos DB Storage documentation](./docs/cosmos-db-storage.md).

## Teams Toolkit Configuration

These files are specific to Teams Toolkit and manage the project lifecycle:

| File                    | Purpose                                                           |
| ----------------------- | ----------------------------------------------------------------- |
| `teamsapp.yml`          | Main Teams Toolkit project file with properties and configurations |
| `teamsapp.local.yml`    | Local development and debugging overrides                        |
| `teamsapp.testtool.yml` | Teams App Test Tool specific configurations                       |

> For a comprehensive guide on Teams Toolkit, visit the [Teams Toolkit GitHub Guide](https://github.com/OfficeDev/TeamsFx/wiki/Teams-Toolkit-Visual-Studio-Code-v5-Guide#overview).

## Azure Resources

The Azure resources for this bot follow a consistent naming pattern:

### Resource Group Naming

Resource groups are named using the pattern: `azure-sdk-qa-bot-<environment>-<region>`

For example: `azure-sdk-qa-bot-prod-eastasia` - Production environment in East Asia region

### Resource Naming

Individual Azure resources within the resource groups are prefixed with: `azsdkqabot<environment><region>`.

For example, resources in the production East Asia environment would be prefixed with:

- `azsdkqabotprodea` (where "prod" is the environment and "ea" represents East Asia)

This naming convention ensures consistency and makes it easy to identify which environment and region each resource belongs to.

## Troubleshooting

The troubleshooting process involves identifying the root cause through logs, fixing issues when necessary by submitting Pull Requests, and using the Teams Toolkit Visual Studio Code Extension for provisioning or deployment. In rare cases, you may need to uninstall and reinstall the bot in Teams.

### Troubleshooting Through App Service Logs

#### Step 1: Locate the App Service in Azure Portal

1. Navigate to the Azure Portal and find the appropriate resource group based on the naming pattern described in the Azure Resources section above.
2. Look for the App Service resource within the resource group (it will have the prefix `azsdkqabot<environment><region>`). For more details, refer to [Azure Resources](#azure-resources) section.

![Resource Group Overview](./doc/images/troubleshooting/resource-group.png)

_Example: The `azure-sdk-qa-bot-prod-eastasia` resource group showing the App Service `azsdkqabotprodea` and other related resources._

#### Step 2: Access App Service Logs

1. In the App Service resource, expand the **Monitoring** section in the left-side menu.
2. Click on **Logs**.
3. Click on **Tables** tab.
4. Expand the **AppServices** category.
5. Find **AppServiceConsoleLogs** and click the **Run** button on the right side to query the logs.

![App Service Overview](./doc/images/troubleshooting/app-service.png)

#### Step 3: [Optional] Write Custom Query to Filter Logs

1. Switch to **KQL** mode.
2. Add the following query condition to filter out health check logs:
   ```kql
   AppServiceConsoleLogs
   | where * has "Health check requested" == false
   ```
3. Click the **Run** button to update the query results with the filtered logs.

![KQL Overview](./doc/images/troubleshooting/kql.png)

> **Note:** For more information about working with logs and KQL queries, please refer to the [Log Analytics workspace documentation](https://learn.microsoft.com/en-us/azure/azure-monitor/logs/log-analytics-workspace-overview). For KQL syntax reference, see [Keyword Query Language (KQL) syntax reference](https://learn.microsoft.com/en-us/sharepoint/dev/general-development/keyword-query-language-kql-syntax-reference).

#### Step 4: Analyze the Logs

1. Query the logs you are interested in. The console logs are located in the **ResultDescription** column.
2. Use the magnifying glass icon (🔍) in the top-right corner for quick search functionality.
3. Sort by **TimeGenerated** column to get logs in chronological order for easier reading and analysis.

> **Important:** Log ingestion may have delays. Based on experience, the maximum delay can be several minutes. It is recommended to wait patiently for some time after sending messages before querying the logs.

![Log Result](./doc/images/troubleshooting/log-result.png)

4. **Search logs by message content**: You can usually search logs directly using the message content.
5. **Search by Teams Activity ID** (for duplicate messages): If messages are duplicated, you can get a unique identifier by:
   1. Right-clicking the message in Teams and selecting the three dots in the upper right corner
   1. Click **Copy link**
   1. The link follows this pattern: `https://teams.microsoft.com/l/message/<channel-id>/<activity-id>?<queries>`
   1. For example, in the link `https://teams.microsoft.com/l/message/19:rMhMrxg7UjfwZmVoSeVvWvNQIfT_G6ds8napsytWqzw1@thread.tacv2/1753756500464`, the activity ID is `1753756500464`
   1. Use this activity ID to search in the logs for precise message identification

![Teams Copy Links](./doc/images/troubleshooting/teams-copy-links.png)
![Search by ID](./doc/images/troubleshooting/search-by-id.png)

> **Note:** For more information about working with logs and KQL queries, please refer to the [Log Analytics workspace documentation](https://learn.microsoft.com/en-us/azure/azure-monitor/logs/log-analytics-workspace-overview). For KQL syntax reference, see [Keyword Query Language (KQL) syntax reference](https://learn.microsoft.com/en-us/sharepoint/dev/general-development/keyword-query-language-kql-syntax-reference).

## Extending the Bot

Follow the [Build a Basic AI Chatbot in Teams](https://aka.ms/teamsfx-basic-ai-chatbot) guide to enhance your bot with additional AI capabilities:

- [Customize prompts](https://aka.ms/teamsfx-basic-ai-chatbot#customize-prompt)
- [Customize user input handling](https://aka.ms/teamsfx-basic-ai-chatbot#customize-user-input)
- [Customize conversation history](https://aka.ms/teamsfx-basic-ai-chatbot#customize-conversation-history)
- [Customize AI model selection](https://aka.ms/teamsfx-basic-ai-chatbot#customize-model-type)
- [Customize model parameters](https://aka.ms/teamsfx-basic-ai-chatbot#customize-model-parameters)
- [Handle image messages](https://aka.ms/teamsfx-basic-ai-chatbot#handle-messages-with-image)

## Additional Resources

- [Teams Toolkit Documentation](https://docs.microsoft.com/microsoftteams/platform/toolkit/teams-toolkit-fundamentals)
- [Teams Toolkit CLI Reference](https://aka.ms/teamsfx-toolkit-cli)
- [Teams Toolkit Samples](https://github.com/OfficeDev/TeamsFx-Samples)
