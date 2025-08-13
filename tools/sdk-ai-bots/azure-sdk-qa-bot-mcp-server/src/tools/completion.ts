import axios from 'axios';

// Configuration
const COMPLETION_API_URL = process.env.BACKEND_URL || 'http://localhost:8088/completion';
const API_KEY = process.env.API_KEY; // Optional, not needed for localhost

// Types matching the backend API
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  raw_content?: string;
  name?: string;
}

export interface AdditionalInfo {
  type: 'link' | 'image';
  content: string;
  link: string;
}

export interface CompletionRequest {
  tenant_id: 'azure_sdk_qa_bot' | 'typespec_extension' | 'python_channel_qa_bot' | 'azure_sdk_onboarding';
  prompt_template?: string;
  intension_prompt_template?: string;
  prompt_template_arguments?: string;
  top_k?: number;
  sources?: string[];
  message: Message;
  history?: Message[];
  with_full_context?: boolean;
  with_preprocess?: boolean;
  additional_infos?: AdditionalInfo[];
}

export interface Reference {
  title: string;
  source: string;
  link: string;
  content: string;
}

export interface IntensionResult {
  question: string;
  category: string;
  spec_type?: string;
  scope?: 'unknown' | 'branded' | 'unbranded';
}

export interface CompletionResponse {
  id: string;
  answer: string;
  has_result: boolean;
  references?: Reference[];
  full_context?: string;
  intension?: IntensionResult;
  reasoning_progress?: string;
}

export async function completion(
  prompt: string,
  options: Partial<CompletionRequest> = {}
): Promise<CompletionResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Add API key if provided and not running on localhost
  if (API_KEY) {
    headers['X-API-Key'] = API_KEY;
  }

  const requestPayload: CompletionRequest = {
    tenant_id: 'azure_sdk_qa_bot', // Default tenant
    ...options,
    // Ensure message is properly set - this will override any message from options
    message: {
      role: 'user',
      content: prompt,
      ...options.message
    }
  };

  try {
    const response = await axios.post<CompletionResponse>(
      COMPLETION_API_URL,
      requestPayload,
      { headers }
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      throw new Error(`API Error: ${JSON.stringify(error.response.data)}`);
    }
    throw new Error(`Request failed: ${error.message}`);
  }
}
