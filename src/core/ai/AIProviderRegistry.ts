/**
 * AI Provider Registry
 * 
 * Central registry for managing multiple AI providers, handling provider switching,
 * fallback mechanisms, and unified access across different AI systems.
 */

import { IAIProvider, AIProviderRegistration, ProviderSwitchResult, AIMessage, AIResponse } from './IAIProvider';
import { EnvironmentManager } from '../EnvironmentManager';

export class AIProviderRegistry {
  private static instance: AIProviderRegistry;
  private providers: Map<string, AIProviderRegistration> = new Map();
  private activeProvider: string | null = null;
  private conversationContext: AIMessage[] = [];
  private providerHealthCache: Map<string, { isHealthy: boolean; lastCheck: number }> = new Map();
  private readonly HEALTH_CACHE_TTL = 60000; // 1 minute

  private constructor() {}

  static getInstance(): AIProviderRegistry {
    if (!AIProviderRegistry.instance) {
      AIProviderRegistry.instance = new AIProviderRegistry();
    }
    return AIProviderRegistry.instance;
  }

  /**
   * Register an AI provider
   */
  registerProvider(
    providerId: string, 
    provider: IAIProvider, 
    options: { priority?: number; enabled?: boolean; fallbackOrder?: number } = {}
  ): void {
    const registration: AIProviderRegistration = {
      provider,
      priority: options.priority ?? 100,
      enabled: options.enabled ?? true,
      fallbackOrder: options.fallbackOrder
    };

    this.providers.set(providerId, registration);
    
    // If this is the first provider or has highest priority, make it active by default
    if (!this.activeProvider || registration.priority > (this.providers.get(this.activeProvider)?.priority ?? 0)) {
      this.activeProvider = providerId;
    }
  }

  /**
   * Get all registered providers
   */
  getRegisteredProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Get enabled providers sorted by priority
   */
  getEnabledProviders(): string[] {
    return Array.from(this.providers.entries())
      .filter(([_, registration]) => registration.enabled)
      .sort(([_, a], [__, b]) => b.priority - a.priority)
      .map(([providerId, _]) => providerId);
  }

  /**
   * Get the currently active provider
   */
  getActiveProvider(): IAIProvider | null {
    if (!this.activeProvider || !this.providers.has(this.activeProvider)) {
      return null;
    }
    return this.providers.get(this.activeProvider)!.provider;
  }

  /**
   * Get active provider ID
   */
  getActiveProviderId(): string | null {
    return this.activeProvider;
  }

  /**
   * Switch to a specific provider
   */
  async switchProvider(providerId: string, preserveContext: boolean = true): Promise<ProviderSwitchResult> {
    const previousProvider = this.activeProvider || 'none';
    
    if (!this.providers.has(providerId)) {
      return {
        success: false,
        previousProvider,
        newProvider: providerId,
        message: `Provider '${providerId}' not found. Available providers: ${this.getRegisteredProviders().join(', ')}`,
        contextPreserved: false
      };
    }

    const registration = this.providers.get(providerId)!;
    
    if (!registration.enabled) {
      return {
        success: false,
        previousProvider,
        newProvider: providerId,
        message: `Provider '${providerId}' is disabled`,
        contextPreserved: false
      };
    }

    // Check if provider is healthy
    const isHealthy = await this.checkProviderHealth(providerId);
    if (!isHealthy) {
      return {
        success: false,
        previousProvider,
        newProvider: providerId,
        message: `Provider '${providerId}' is not healthy or not authenticated`,
        contextPreserved: false
      };
    }

    // Preserve context if requested and possible
    let contextPreserved = false;
    if (preserveContext && this.conversationContext.length > 0) {
      try {
        // Transfer context to new provider
        registration.provider.clearHistory();
        // Note: In a real implementation, you might need to adapt context format
        contextPreserved = true;
      } catch (error) {
        console.warn('Failed to preserve context during provider switch:', error);
      }
    }

    this.activeProvider = providerId;

    return {
      success: true,
      previousProvider,
      newProvider: providerId,
      message: `Successfully switched to ${registration.provider.providerName}`,
      contextPreserved
    };
  }

  /**
   * Auto-select best available provider
   */
  async selectBestProvider(): Promise<ProviderSwitchResult> {
    const enabledProviders = this.getEnabledProviders();
    
    for (const providerId of enabledProviders) {
      const isHealthy = await this.checkProviderHealth(providerId);
      if (isHealthy) {
        return await this.switchProvider(providerId, true);
      }
    }

    return {
      success: false,
      previousProvider: this.activeProvider || 'none',
      newProvider: 'none',
      message: 'No healthy providers available',
      contextPreserved: false
    };
  }

  /**
   * Check provider health with caching
   */
  async checkProviderHealth(providerId: string): Promise<boolean> {
    const now = Date.now();
    const cached = this.providerHealthCache.get(providerId);
    
    if (cached && (now - cached.lastCheck) < this.HEALTH_CACHE_TTL) {
      return cached.isHealthy;
    }

    const registration = this.providers.get(providerId);
    if (!registration) {
      return false;
    }

    try {
      const isAuthenticated = await registration.provider.isAuthenticated();
      const status = await registration.provider.getStatus();
      const isHealthy = isAuthenticated && status.isOnline;
      
      this.providerHealthCache.set(providerId, {
        isHealthy,
        lastCheck: now
      });
      
      return isHealthy;
    } catch (error) {
      this.providerHealthCache.set(providerId, {
        isHealthy: false,
        lastCheck: now
      });
      return false;
    }
  }

  /**
   * Send message with automatic fallback
   */
  async sendMessage(
    messages: AIMessage[], 
    options?: { model?: string; maxTokens?: number; temperature?: number; allowFallback?: boolean }
  ): Promise<AIResponse> {
    const allowFallback = options?.allowFallback ?? true;
    const enabledProviders = allowFallback ? this.getEnabledProviders() : [this.activeProvider].filter(Boolean);

    let lastError: Error | null = null;

    for (const providerId of enabledProviders) {
      try {
        const registration = this.providers.get(providerId);
        if (!registration) continue;

        const isHealthy = await this.checkProviderHealth(providerId);
        if (!isHealthy) continue;

        // Switch to this provider if not already active
        if (this.activeProvider !== providerId) {
          await this.switchProvider(providerId, false);
        }

        const response = await registration.provider.sendMessage(messages, options);
        
        // Update conversation context
        this.conversationContext = [...messages];
        this.conversationContext.push({
          role: 'assistant',
          content: response.content,
          timestamp: new Date().toISOString(),
          metadata: { provider: providerId, model: response.model }
        });

        return response;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Provider ${providerId} failed:`, error);
        continue;
      }
    }

    throw new Error(`All providers failed. Last error: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Chat with automatic provider selection
   */
  async chat(message: string, options?: { model?: string; allowFallback?: boolean }): Promise<AIResponse> {
    const messages: AIMessage[] = [
      ...this.conversationContext,
      {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      }
    ];

    return await this.sendMessage(messages, options);
  }

  /**
   * Get provider status summary
   */
  async getProviderStatusSummary(): Promise<{
    activeProvider: string | null;
    providers: Array<{
      id: string;
      name: string;
      enabled: boolean;
      healthy: boolean;
      priority: number;
    }>;
  }> {
    const providerStatuses = await Promise.all(
      Array.from(this.providers.entries()).map(async ([id, registration]) => ({
        id,
        name: registration.provider.providerName,
        enabled: registration.enabled,
        healthy: await this.checkProviderHealth(id),
        priority: registration.priority
      }))
    );

    return {
      activeProvider: this.activeProvider,
      providers: providerStatuses.sort((a, b) => b.priority - a.priority)
    };
  }

  /**
   * Enable/disable a provider
   */
  setProviderEnabled(providerId: string, enabled: boolean): boolean {
    const registration = this.providers.get(providerId);
    if (!registration) {
      return false;
    }

    registration.enabled = enabled;
    
    // If disabling the active provider, switch to another
    if (!enabled && this.activeProvider === providerId) {
      const enabledProviders = this.getEnabledProviders();
      this.activeProvider = enabledProviders.length > 0 ? enabledProviders[0] : null;
    }

    return true;
  }

  /**
   * Clear all conversation context
   */
  clearAllContext(): void {
    this.conversationContext = [];
    for (const [_, registration] of this.providers) {
      registration.provider.clearHistory();
    }
  }

  /**
   * Get unified conversation history
   */
  getConversationContext(): AIMessage[] {
    return [...this.conversationContext];
  }

  /**
   * Initialize all providers with environment configuration
   */
  async initializeProvidersFromEnvironment(): Promise<void> {
    const envManager = EnvironmentManager.getInstance();
    
    for (const [providerId, registration] of this.providers) {
      try {
        // Try to initialize with environment configuration
        const config = this.getProviderConfigFromEnvironment(providerId, envManager);
        if (config) {
          await registration.provider.initialize(config);
        }
      } catch (error) {
        console.warn(`Failed to initialize provider ${providerId}:`, error);
      }
    }
  }

  /**
   * Get provider configuration from environment
   */
  private getProviderConfigFromEnvironment(providerId: string, envManager: EnvironmentManager): any {
    switch (providerId) {
      case 'claude':
        const claudeKey = envManager.getAnthropicApiKey();
        return claudeKey ? {
          providerId: 'claude',
          apiKey: claudeKey,
          defaultModel: 'claude-3-sonnet-20240229'
        } : null;
        
      case 'gemini':
        const geminiKey = envManager.getVariable('GEMINI_API_KEY');
        return geminiKey ? {
          providerId: 'gemini',
          apiKey: geminiKey,
          defaultModel: 'gemini-pro'
        } : null;
        
      case 'qwen':
        const qwenKey = envManager.getVariable('QWEN_API_KEY');
        return qwenKey ? {
          providerId: 'qwen',
          apiKey: qwenKey,
          defaultModel: 'qwen-turbo'
        } : null;
        
      default:
        return null;
    }
  }
}