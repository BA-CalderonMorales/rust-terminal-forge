/**
 * Unified AI Provider Interface
 * 
 * This interface defines the contract that all AI providers must implement
 * to ensure consistent behavior across different AI systems (Claude, Gemini, Qwen, etc.)
 */

export interface AIProviderConfig {
  /** Provider identifier (e.g., 'claude', 'gemini', 'qwen') */
  providerId: string;
  /** API key or authentication token */
  apiKey?: string;
  /** Base URL for API endpoints */
  baseUrl?: string;
  /** Default model to use */
  defaultModel?: string;
  /** Maximum tokens for responses */
  maxTokens?: number;
  /** Temperature for response generation */
  temperature?: number;
  /** Provider-specific configuration */
  customConfig?: Record<string, any>;
}

export interface AIProviderCapabilities {
  /** Text generation support */
  textGeneration: boolean;
  /** Image understanding support */
  imageUnderstanding: boolean;
  /** Code execution support */
  codeExecution: boolean;
  /** File system access */
  fileSystemAccess: boolean;
  /** Real-time streaming */
  streaming: boolean;
  /** Conversation memory */
  conversationMemory: boolean;
  /** Available models */
  availableModels: string[];
  /** Maximum context length */
  maxContextLength: number;
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}

export interface AIResponse {
  content: string;
  model: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  finishReason?: 'stop' | 'length' | 'tool_use' | 'error';
  metadata?: Record<string, any>;
}

export interface CodeBlock {
  language: string;
  code: string;
  executable: boolean;
  safetyLevel: 'safe' | 'caution' | 'dangerous';
}

export interface AIExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  executionTime: number;
  safetyChecks: {
    passed: boolean;
    warnings: string[];
  };
}

/**
 * Main AI Provider Interface
 * All AI providers must implement this interface
 */
export interface IAIProvider {
  /** Provider identifier */
  readonly providerId: string;
  /** Provider display name */
  readonly providerName: string;
  /** Provider capabilities */
  readonly capabilities: AIProviderCapabilities;
  
  /**
   * Initialize the provider with configuration
   */
  initialize(config: AIProviderConfig): Promise<boolean>;
  
  /**
   * Check if provider is properly configured and authenticated
   */
  isAuthenticated(): Promise<boolean>;
  
  /**
   * Get available models for this provider
   */
  getAvailableModels(): Promise<string[]>;
  
  /**
   * Send a message and get response
   */
  sendMessage(
    messages: AIMessage[], 
    options?: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      stream?: boolean;
    }
  ): Promise<AIResponse>;
  
  /**
   * Send a single chat message (convenience method)
   */
  chat(message: string, options?: { model?: string }): Promise<AIResponse>;
  
  /**
   * Extract code blocks from response
   */
  extractCodeBlocks(content: string): CodeBlock[];
  
  /**
   * Execute code with safety checks
   */
  executeCode(code: string, language: string): Promise<AIExecutionResult>;
  
  /**
   * Check if code contains dangerous operations
   */
  containsDangerousCode(code: string): boolean;
  
  /**
   * Clear conversation history
   */
  clearHistory(): void;
  
  /**
   * Get conversation history
   */
  getHistory(): AIMessage[];
  
  /**
   * Handle provider-specific commands
   */
  handleCommand(command: string, args: string[]): Promise<string>;
  
  /**
   * Get provider status and health information
   */
  getStatus(): Promise<{
    isOnline: boolean;
    latency?: number;
    quotaRemaining?: number;
    lastError?: string;
  }>;
  
  /**
   * Validate provider configuration
   */
  validateConfig(config: AIProviderConfig): { valid: boolean; errors: string[] };
  
  /**
   * Handle authentication setup
   */
  setupAuthentication(): Promise<{ success: boolean; message: string }>;
  
  /**
   * Test provider connection
   */
  testConnection(): Promise<{ success: boolean; message: string }>;
}

/**
 * Provider Registration Interface
 */
export interface AIProviderRegistration {
  provider: IAIProvider;
  priority: number;
  enabled: boolean;
  fallbackOrder?: number;
}

/**
 * Provider switching result
 */
export interface ProviderSwitchResult {
  success: boolean;
  previousProvider: string;
  newProvider: string;
  message: string;
  contextPreserved: boolean;
}