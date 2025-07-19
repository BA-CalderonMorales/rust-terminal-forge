// Claude API Client for Anthropic's Claude Code integration
export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  role: 'assistant';
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface ClaudeStreamChunk {
  type: 'message_start' | 'content_block_start' | 'content_block_delta' | 'content_block_stop' | 'message_delta' | 'message_stop';
  message?: ClaudeResponse;
  delta?: {
    text?: string;
    stop_reason?: string;
  };
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface ApiError {
  type: string;
  message: string;
  code?: string;
  details?: any;
}

export interface ClaudeApiConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export class ClaudeApiClient {
  private config: ClaudeApiConfig;
  private baseUrl = 'https://api.anthropic.com/v1/messages';

  constructor(config: ClaudeApiConfig) {
    this.config = {
      model: 'claude-3-sonnet-20240229',
      maxTokens: 4096,
      temperature: 0.7,
      ...config
    };
  }

  async sendMessage(messages: ClaudeMessage[]): Promise<ClaudeResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.config.model,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          messages
        })
      });

      if (!response.ok) {
        await this.handleApiError(response);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error or unexpected failure');
    }
  }

  async streamMessage(messages: ClaudeMessage[], onChunk?: (chunk: ClaudeStreamChunk) => void): Promise<AsyncGenerator<ClaudeStreamChunk, void, unknown>> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.config.model,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          messages,
          stream: true
        })
      });

      if (!response.ok) {
        await this.handleApiError(response);
      }

      return this.parseStreamResponse(response, onChunk);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during streaming');
    }
  }

  /**
   * Extract code blocks from Claude's response
   */
  extractCodeBlocks(text: string): Array<{ language: string; code: string }> {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const blocks: Array<{ language: string; code: string }> = [];
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      blocks.push({
        language: match[1] || 'text',
        code: match[2].trim()
      });
    }

    return blocks;
  }

  /**
   * Check if Claude's response contains potentially dangerous code
   */
  containsDangerousCode(code: string): boolean {
    const dangerousPatterns = [
      /rm\s+-rf/,
      /sudo\s+/,
      /curl.*\|.*sh/,
      /wget.*\|.*sh/,
      /exec\s*\(/,
      /eval\s*\(/,
      /system\s*\(/,
      /os\.system/,
      /subprocess\.call/,
      /import\s+subprocess/,
      /fs\.unlink/,
      /fs\.rmdir/,
      /process\.exit/
    ];

    return dangerousPatterns.some(pattern => pattern.test(code));
  }

  /**
   * Handle API errors with detailed error information
   */
  private async handleApiError(response: Response): Promise<never> {
    let errorData: any;
    try {
      errorData = await response.json();
    } catch {
      errorData = { error: { message: response.statusText } };
    }

    const error = errorData.error || {};
    const statusCode = response.status;

    // Handle specific API error types
    switch (statusCode) {
      case 400:
        throw new Error(`Bad Request: ${error.message || 'Invalid request format'}`);
      case 401:
        throw new Error('Authentication failed: Invalid API key');
      case 403:
        throw new Error('Access forbidden: Check your API key permissions');
      case 429:
        const retryAfter = response.headers.get('retry-after');
        throw new Error(`Rate limit exceeded. ${retryAfter ? `Retry after ${retryAfter} seconds.` : 'Please wait before retrying.'}`);
      case 500:
        throw new Error('Claude API server error. Please try again later.');
      case 529:
        throw new Error('Claude API is temporarily overloaded. Please try again later.');
      default:
        throw new Error(`Claude API error (${statusCode}): ${error.message || response.statusText}`);
    }
  }

  /**
   * Parse streaming response from Claude API
   */
  private async *parseStreamResponse(response: Response, onChunk?: (chunk: ClaudeStreamChunk) => void): AsyncGenerator<ClaudeStreamChunk, void, unknown> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get stream reader');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const data = trimmed.slice(6);
          if (data === '[DONE]') {
            return;
          }

          try {
            const chunk: ClaudeStreamChunk = JSON.parse(data);
            onChunk?.(chunk);
            yield chunk;
          } catch (error) {
            console.warn('Failed to parse stream chunk:', error);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Check if the API key is properly configured
   */
  isConfigured(): boolean {
    return !!this.config.apiKey && ClaudeApiClient.validateApiKey(this.config.apiKey);
  }

  /**
   * Get current model configuration
   */
  getModelInfo(): { model: string; maxTokens: number; temperature: number } {
    return {
      model: this.config.model || 'claude-3-sonnet-20240229',
      maxTokens: this.config.maxTokens || 4096,
      temperature: this.config.temperature || 0.7
    };
  }

  /**
   * Test connection to Claude API
   */
  async testConnection(): Promise<{ success: boolean; message: string; usage?: any }> {
    try {
      const response = await this.sendMessage([
        { role: 'user', content: 'Hello, just testing the connection. Please respond with "Connection successful!"' }
      ]);
      
      return {
        success: true,
        message: 'Connection test successful!',
        usage: response.usage
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validate API key format
   */
  static validateApiKey(apiKey: string): boolean {
    // Anthropic API keys start with 'sk-ant-' and are followed by base64-like characters
    return /^sk-ant-[a-zA-Z0-9_-]+$/.test(apiKey);
  }
}