/**
 * Claude AI Provider Implementation
 * 
 * Implements the IAIProvider interface for Claude/Anthropic AI systems
 */

import { 
  IAIProvider, 
  AIProviderConfig, 
  AIProviderCapabilities, 
  AIMessage, 
  AIResponse, 
  CodeBlock, 
  AIExecutionResult 
} from '../IAIProvider';
import { ClaudeApiClient } from '../../ClaudeApiClient';
import { CodeExecutor } from '../../CodeExecutor';

export class ClaudeProvider implements IAIProvider {
  readonly providerId = 'claude';
  readonly providerName = 'Claude (Anthropic)';
  readonly capabilities: AIProviderCapabilities = {
    textGeneration: true,
    imageUnderstanding: true,
    codeExecution: true,
    fileSystemAccess: false,
    streaming: true,
    conversationMemory: true,
    availableModels: [
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229', 
      'claude-3-haiku-20240307',
      'claude-3-5-sonnet-20241022'
    ],
    maxContextLength: 200000
  };

  private client: ClaudeApiClient | null = null;
  private codeExecutor: CodeExecutor;
  private conversationHistory: AIMessage[] = [];
  private config: AIProviderConfig | null = null;

  constructor() {
    this.codeExecutor = new CodeExecutor({
      timeout: 10000,
      maxOutputLength: 10000,
      allowNetworkAccess: false,
      allowFileSystem: false
    });
  }

  async initialize(config: AIProviderConfig): Promise<boolean> {
    try {
      if (!config.apiKey) {
        return false;
      }

      if (!ClaudeApiClient.validateApiKey(config.apiKey)) {
        return false;
      }

      this.client = new ClaudeApiClient({
        apiKey: config.apiKey,
        model: config.defaultModel || 'claude-3-sonnet-20240229',
        maxTokens: config.maxTokens || 4096,
        temperature: config.temperature || 0.7
      });

      this.config = config;
      return true;
    } catch (error) {
      console.error('Failed to initialize Claude provider:', error);
      return false;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    return this.client !== null && this.config?.apiKey !== undefined;
  }

  async getAvailableModels(): Promise<string[]> {
    return this.capabilities.availableModels;
  }

  async sendMessage(
    messages: AIMessage[], 
    options?: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      stream?: boolean;
    }
  ): Promise<AIResponse> {
    if (!this.client) {
      throw new Error('Claude provider not initialized');
    }

    try {
      // Convert our AIMessage format to Claude's format
      const claudeMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await this.client.sendMessage(claudeMessages);
      
      return {
        content: response.content[0].text,
        model: response.model || options?.model || this.config?.defaultModel || 'claude-3-sonnet-20240229',
        usage: response.usage ? {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens
        } : undefined,
        finishReason: response.stop_reason === 'end_turn' ? 'stop' : 'length',
        metadata: {
          id: response.id,
          type: response.type
        }
      };
    } catch (error) {
      throw new Error(`Claude API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async chat(message: string, options?: { model?: string }): Promise<AIResponse> {
    const messages: AIMessage[] = [
      ...this.conversationHistory,
      {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      }
    ];

    const response = await this.sendMessage(messages, options);
    
    // Update conversation history
    this.conversationHistory.push(
      { role: 'user', content: message, timestamp: new Date().toISOString() },
      { role: 'assistant', content: response.content, timestamp: new Date().toISOString() }
    );

    // Keep only last 20 messages to manage token limits
    if (this.conversationHistory.length > 20) {
      this.conversationHistory = this.conversationHistory.slice(-20);
    }

    return response;
  }

  extractCodeBlocks(content: string): CodeBlock[] {
    if (!this.client) {
      return [];
    }

    const blocks = this.client.extractCodeBlocks(content);
    return blocks.map(block => ({
      language: block.language,
      code: block.code,
      executable: this.isExecutableLanguage(block.language),
      safetyLevel: this.assessCodeSafety(block.code)
    }));
  }

  async executeCode(code: string, language: string): Promise<AIExecutionResult> {
    const startTime = Date.now();
    
    try {
      const safetyChecks = this.performSafetyChecks(code);
      
      if (!safetyChecks.passed) {
        return {
          success: false,
          error: `Safety checks failed: ${safetyChecks.warnings.join(', ')}`,
          executionTime: Date.now() - startTime,
          safetyChecks
        };
      }

      const result = await this.codeExecutor.executeCode(code, language);
      
      return {
        success: result.success,
        output: result.output,
        error: result.error,
        executionTime: result.executionTime,
        safetyChecks
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown execution error',
        executionTime: Date.now() - startTime,
        safetyChecks: { passed: false, warnings: ['Execution failed'] }
      };
    }
  }

  containsDangerousCode(code: string): boolean {
    if (!this.client) {
      return true; // Err on the side of caution
    }
    return this.client.containsDangerousCode(code);
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }

  getHistory(): AIMessage[] {
    return [...this.conversationHistory];
  }

  async handleCommand(command: string, args: string[]): Promise<string> {
    switch (command) {
      case 'models':
        return `Available Claude models:\n${this.capabilities.availableModels.join('\n')}`;
        
      case 'status':
        const isAuth = await this.isAuthenticated();
        return `Claude Provider Status:
- Authenticated: ${isAuth ? '✅' : '❌'}
- Model: ${this.config?.defaultModel || 'Not set'}
- History: ${this.conversationHistory.length} messages`;

      case 'clear':
        this.clearHistory();
        return 'Conversation history cleared';

      case 'config':
        return `Claude Configuration:
- Provider ID: ${this.providerId}
- Model: ${this.config?.defaultModel || 'Not set'}
- Max Tokens: ${this.config?.maxTokens || 'Default'}
- Temperature: ${this.config?.temperature || 'Default'}`;

      default:
        return `Unknown command: ${command}. Available commands: models, status, clear, config`;
    }
  }

  async getStatus(): Promise<{
    isOnline: boolean;
    latency?: number;
    quotaRemaining?: number;
    lastError?: string;
  }> {
    if (!this.client) {
      return {
        isOnline: false,
        lastError: 'Provider not initialized'
      };
    }

    try {
      const startTime = Date.now();
      
      // Test with a minimal request
      await this.client.sendMessage([
        { role: 'user', content: 'Test connection - respond with "OK"' }
      ]);
      
      const latency = Date.now() - startTime;
      
      return {
        isOnline: true,
        latency
      };
    } catch (error) {
      return {
        isOnline: false,
        lastError: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  validateConfig(config: AIProviderConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.apiKey) {
      errors.push('API key is required');
    } else if (!ClaudeApiClient.validateApiKey(config.apiKey)) {
      errors.push('Invalid API key format');
    }

    if (config.defaultModel && !this.capabilities.availableModels.includes(config.defaultModel)) {
      errors.push(`Invalid model: ${config.defaultModel}`);
    }

    if (config.maxTokens && (config.maxTokens < 1 || config.maxTokens > this.capabilities.maxContextLength)) {
      errors.push(`Max tokens must be between 1 and ${this.capabilities.maxContextLength}`);
    }

    if (config.temperature && (config.temperature < 0 || config.temperature > 2)) {
      errors.push('Temperature must be between 0 and 2');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async setupAuthentication(): Promise<{ success: boolean; message: string }> {
    return {
      success: false,
      message: 'Interactive authentication setup not supported. Please set ANTHROPIC_API_KEY environment variable.'
    };
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const status = await this.getStatus();
      return {
        success: status.isOnline,
        message: status.isOnline 
          ? `Connection successful (latency: ${status.latency}ms)`
          : `Connection failed: ${status.lastError}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private isExecutableLanguage(language: string): boolean {
    const executableLanguages = ['python', 'javascript', 'typescript', 'bash', 'sh', 'node'];
    return executableLanguages.includes(language.toLowerCase());
  }

  private assessCodeSafety(code: string): 'safe' | 'caution' | 'dangerous' {
    if (this.containsDangerousCode(code)) {
      return 'dangerous';
    }

    const cautionPatterns = [
      /import\s+os/i,
      /import\s+subprocess/i,
      /exec\(/i,
      /eval\(/i,
      /\.system\(/i,
      /process\./i
    ];

    if (cautionPatterns.some(pattern => pattern.test(code))) {
      return 'caution';
    }

    return 'safe';
  }

  private performSafetyChecks(code: string): { passed: boolean; warnings: string[] } {
    const warnings: string[] = [];
    
    if (this.containsDangerousCode(code)) {
      warnings.push('Code contains potentially dangerous operations');
    }

    // Add more safety checks as needed
    const suspiciousPatterns = [
      { pattern: /rm\s+-rf/i, warning: 'Destructive file operations detected' },
      { pattern: /DELETE\s+FROM/i, warning: 'Database deletion operations detected' },
      { pattern: /import\s+requests/i, warning: 'Network requests detected' }
    ];

    for (const { pattern, warning } of suspiciousPatterns) {
      if (pattern.test(code)) {
        warnings.push(warning);
      }
    }

    return {
      passed: warnings.length === 0,
      warnings
    };
  }
}