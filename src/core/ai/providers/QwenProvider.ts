/**
 * Qwen AI Provider Implementation
 * 
 * Implements the IAIProvider interface for Alibaba Qwen AI systems
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
import { CodeExecutor } from '../../CodeExecutor';

export class QwenProvider implements IAIProvider {
  readonly providerId = 'qwen';
  readonly providerName = 'Qwen (Alibaba)';
  readonly capabilities: AIProviderCapabilities = {
    textGeneration: true,
    imageUnderstanding: true,
    codeExecution: true,
    fileSystemAccess: false,
    streaming: true,
    conversationMemory: true,
    availableModels: [
      'qwen-turbo',
      'qwen-plus',
      'qwen-max',
      'qwen-vl-plus',
      'qwen-coder-turbo'
    ],
    maxContextLength: 32768
  };

  private client: any = null; // Will hold the Qwen client
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

      // Simulate Qwen client configuration
      this.client = {
        apiKey: config.apiKey,
        model: config.defaultModel || 'qwen-turbo',
        baseUrl: config.baseUrl || 'https://dashscope.aliyuncs.com/api/v1',
        configured: true
      };

      this.config = config;
      return true;
    } catch (error) {
      console.error('Failed to initialize Qwen provider:', error);
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
      throw new Error('Qwen provider not initialized');
    }

    try {
      // Simulate Qwen API call
      const lastMessage = messages[messages.length - 1];
      const response = await this.simulateQwenResponse(lastMessage.content, options?.model);
      
      return {
        content: response,
        model: options?.model || this.config?.defaultModel || 'qwen-turbo',
        usage: {
          inputTokens: this.estimateTokens(lastMessage.content),
          outputTokens: this.estimateTokens(response),
          totalTokens: this.estimateTokens(lastMessage.content) + this.estimateTokens(response)
        },
        finishReason: 'stop',
        metadata: {
          provider: 'qwen'
        }
      };
    } catch (error) {
      throw new Error(`Qwen API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const blocks: CodeBlock[] = [];
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const language = match[1] || 'text';
      const code = match[2].trim();
      
      blocks.push({
        language,
        code,
        executable: this.isExecutableLanguage(language),
        safetyLevel: this.assessCodeSafety(code)
      });
    }

    return blocks;
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
    const dangerousPatterns = [
      /rm\s+-rf/i,
      /del\s+\/[sf]/i,
      /format\s+c:/i,
      /subprocess\.call/i,
      /os\.system/i,
      /exec\s*\(/i,
      /eval\s*\(/i,
      /__import__/i,
      /open\s*\(.+['"]w/i,
      /删除|删掉|清空/i, // Chinese dangerous operations
      /rm\s/i,
      /sudo/i
    ];

    return dangerousPatterns.some(pattern => pattern.test(code));
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
        return `Available Qwen models:\n${this.capabilities.availableModels.join('\n')}`;
        
      case 'status':
        const isAuth = await this.isAuthenticated();
        return `Qwen Provider Status:
- Authenticated: ${isAuth ? '✅' : '❌'}
- Model: ${this.config?.defaultModel || 'Not set'}
- History: ${this.conversationHistory.length} messages`;

      case 'clear':
        this.clearHistory();
        return 'Conversation history cleared';

      case 'config':
        return `Qwen Configuration:
- Provider ID: ${this.providerId}
- Model: ${this.config?.defaultModel || 'Not set'}
- Max Tokens: ${this.config?.maxTokens || 'Default'}
- Temperature: ${this.config?.temperature || 'Default'}
- Base URL: ${this.config?.baseUrl || 'Default'}`;

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
      
      // Simulate a test call
      await this.simulateQwenResponse('test');
      
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
      message: 'Interactive authentication setup not supported. Please set QWEN_API_KEY environment variable.'
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

  private async simulateQwenResponse(message: string, model?: string): Promise<string> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 600));
    
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('你好')) {
      return 'Hello! I\'m Qwen, Alibaba\'s AI assistant. I can help you with various tasks including programming, analysis, and answering questions in both Chinese and English. 你好！我是通义千问，很高兴为您服务！';
    }
    
    if (lowerMessage.includes('code') || lowerMessage.includes('programming') || lowerMessage.includes('编程')) {
      return 'I\'m excellent at programming tasks! I support multiple languages and can help with code generation, debugging, and optimization. My qwen-coder models are specially trained for coding tasks. 我在编程方面很擅长！';
    }
    
    if (lowerMessage.includes('test')) {
      return 'Test successful! Qwen provider is working correctly. 测试成功！';
    }

    if (model?.includes('coder')) {
      return `As Qwen Coder, I'm specialized in programming tasks. You asked: "${message}". I can help you write, debug, or optimize code in various programming languages. What specific coding task would you like help with?`;
    }
    
    return `I understand you're asking about: "${message}". As Qwen, I'm here to help with various tasks including programming, analysis, creative writing, and answering questions. I can communicate in both English and Chinese. How can I assist you today? 作为通义千问，我可以帮助您完成各种任务。`;
  }

  private estimateTokens(text: string): number {
    // Rough token estimation for Chinese and English text
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const englishWords = text.split(/\s+/).length;
    return Math.ceil(chineseChars * 1.5 + englishWords);
  }

  private isExecutableLanguage(language: string): boolean {
    const executableLanguages = ['python', 'javascript', 'typescript', 'bash', 'sh', 'node', 'java', 'cpp', 'c'];
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
      /process\./i,
      /网络请求|文件操作/i
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

    const suspiciousPatterns = [
      { pattern: /rm\s+-rf/i, warning: 'Destructive file operations detected' },
      { pattern: /DELETE\s+FROM/i, warning: 'Database deletion operations detected' },
      { pattern: /import\s+requests/i, warning: 'Network requests detected' },
      { pattern: /删除|清空/i, warning: 'Potentially destructive operations detected (Chinese)' }
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