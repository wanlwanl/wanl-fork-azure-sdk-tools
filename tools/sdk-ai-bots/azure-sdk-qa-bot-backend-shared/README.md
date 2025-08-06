# Azure SDK QA Bot Backend Shared Service

## Overview

This shared service provides preprocessing capabilities for the Azure SDK QA Bot, including content extraction from inline links and image processing functionalities.

## Getting Started

### Starting the Server

1. **Download Credentials**:
   - Access Azure Key Vault `AzureSDKQABotConfig`
   - Download the `PREPROCESS-ENV-LOCAL-BASE64` secret
   - Decode the content from base64 format

2. **Configure Environment**:
   - Create `env/.env.local` file
   - Add the decoded credential content to the file

3. **Start the Development Server**:
   ```bash
   npm run dev:local
   ```

### Testing the API

1. **Install REST Client Extension** in VS Code
2. **Configure API Request**:
   - Open the [preprocess request sample](./sample/preprocess.http)
   - Replace `YOUR_API_KEY` with your actual API key
   - Click `Send Request`
3. **View Additional Examples**:
   - See [end-to-end tests](./src/test/test.e2e.test.ts) for more usage examples

## API Reference

### Request Format

#### Request Body
```typescript
interface PreprocessRequestBody {
  text: string;           // Text content to process
  images?: string[];      // Optional array of image URLs/data
}
```

#### Request Headers
```typescript
interface Headers {
  'x-api-key': string;    // API authentication key
}
```

### Response Format

#### Response Body
```typescript
interface PreprocessWarning {
  id: string;             // Warning identifier
  warning: string;        // Warning message description
}

interface PreprocessResult {
  text: string;           // Processed text content
  warnings?: PreprocessWarning[];  // Optional warnings (e.g., failed link parsing)
}
```

## Features

- **Link Processing**: Extracts and processes content from inline links
- **Image Handling**: Processes and analyzes image content
- **Error Handling**: Provides detailed warnings for failed operations
- **API Security**: Secure API key-based authentication

## Development

### Prerequisites
- Node.js (version 18 or higher)
- npm or yarn package manager
- Access to Azure Key Vault for credentials

### Local Development
1. Follow the setup steps in "Getting Started"
2. The service will be available at `http://localhost:3000` (or configured port)
3. Use the provided test samples to verify functionality

### Testing
Run the test suite:
```bash
npm test
```

For end-to-end testing:
```bash
npm run test:e2e
```
