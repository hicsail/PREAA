import DeepchatProxy, { DeepchatProxies } from '@/app/schemas/deepchat-proxy';
import { inject, singleton } from 'tsyringe';
import { LITELLM_PROVIDER } from '../container';
import type { Client as LiteLLMClient } from '../client-litellm/core/types';
import { chatCompletionV1ChatCompletionsPost } from '../client-litellm';

@singleton()
export class ProxyService {
  constructor(@inject(LITELLM_PROVIDER) private readonly litellmClient: LiteLLMClient) {}

  async create(newProxy: any): Promise<DeepchatProxies> {
    return DeepchatProxy.create(newProxy);
  }

  async get(id: string): Promise<DeepchatProxies | null> {
    return DeepchatProxy.findById(id);
  }

  async getAll(): Promise<DeepchatProxies[]> {
    return DeepchatProxy.find({});
  }

  async delete(id: string): Promise<DeepchatProxies | null> {
    const existing = await this.get(id);
    if (!existing) {
      return null;
    }

    await DeepchatProxy.deleteOne({ _id: id });

    return existing;
  }

  async proxyRequest(id: string, body: any, stream: boolean = false): Promise<any> {
    // Get the proxy information
    const proxy = await DeepchatProxy.findById(id);
    if (!proxy) {
      console.error(`Proxy with id ${id} not found`);
      throw new Error('Missing proxy data for id');
    }

    // Transform the body - handle both DeepChat format and OpenAI format
    // DeepChat uses "ai" for assistant role, but OpenAI/LiteLLM expects "assistant"
    // Filter out empty messages and properly map roles
    const messages = body.messages
      .filter((message: any) => {
        // Filter out messages with no content
        const content = message.text || message.content || '';
        return content && content.trim().length > 0;
      })
      .map((message: any, index: number) => {
        let role = message.role;
        
        // DeepChat uses "ai" for assistant, map to "assistant" for OpenAI/LiteLLM format
        if (role === 'ai') {
          role = 'assistant';
        } else if (!role) {
          // If no role provided, infer based on index: typically user messages are even-indexed
          // DeepChat sends messages in conversation order: [user, ai, user, ai, ...]
          // So even indices (0, 2, 4...) are typically user messages
          role = index % 2 === 0 ? 'user' : 'assistant';
        }
        
        // Ensure we have valid roles for OpenAI format
        if (role !== 'user' && role !== 'assistant' && role !== 'system') {
          // Default to user for invalid roles
          role = 'user';
        }
        
        const content = message.text || message.content || '';
        
        return {
          role: role,
          content: content
        };
      });
    
    // Ensure we have at least one message
    if (messages.length === 0) {
      throw new Error('No valid messages provided');
    }

    const request: any = {
      messages: messages,
      model: proxy.modelName,
      stream: stream
    };

    // For streaming, make a direct fetch request to LiteLLM to handle the stream
    if (stream) {
      const litellmUrl = process.env.LITELLM_BASE_URL || 'http://localhost:4000';
      const litellmApiKey = process.env.LITELLM_API_KEY || '';

      const response = await fetch(`${litellmUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${litellmApiKey}`,
          'x-litellm-api-key': litellmApiKey
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('[ProxyService] LiteLLM streaming error:', response.status, error);
        throw new Error(`LiteLLM request failed: ${response.status} ${error}`);
      }

      if (!response.body) {
        throw new Error('LiteLLM streaming response has no body');
      }

      return response;
    }

    // Non-streaming: use existing logic
    const result = await chatCompletionV1ChatCompletionsPost({
      body: request,
      client: this.litellmClient as any
    });

    if (result.error) {
      console.error(result.error);
      throw new Error('Failed to make LiteLLM request');
    }

    if (!result.data) {
      console.error('Missing data payload from liteLLM');
      throw new Error('Missing LiteLLM Payload');
    }

    // Transform the data
    const response = result.data as any;
    response.text = response.choices[0].message.content;

    return response;
  }
}
