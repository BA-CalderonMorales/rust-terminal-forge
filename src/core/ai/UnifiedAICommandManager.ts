/**
 * Unified AI Command Manager
 * 
 * Provides a unified interface for interacting with multiple AI providers
 * through a single command interface with automatic provider switching
 */

import { TerminalCommand } from '../types';
import { BaseCommandHandler } from '../commands/BaseCommandHandler';
import { AIProviderRegistry } from './AIProviderRegistry';
import { ClaudeProvider } from './providers/ClaudeProvider';
import { GeminiProvider } from './providers/GeminiProvider';
import { QwenProvider } from './providers/QwenProvider';

export class UnifiedAICommandManager extends BaseCommandHandler {
  private registry: AIProviderRegistry;
  private initialized = false;

  constructor() {
    super();
    this.registry = AIProviderRegistry.getInstance();
    this.initializeProviders();
  }

  /**
   * Initialize all AI providers
   */
  private async initializeProviders(): Promise<void> {
    if (this.initialized) return;

    // Register all providers
    this.registry.registerProvider('claude', new ClaudeProvider(), {
      priority: 100,
      enabled: true,
      fallbackOrder: 1
    });

    this.registry.registerProvider('gemini', new GeminiProvider(), {
      priority: 90,
      enabled: true,
      fallbackOrder: 2
    });

    this.registry.registerProvider('qwen', new QwenProvider(), {
      priority: 80,
      enabled: true,
      fallbackOrder: 3
    });

    // Initialize providers with environment configuration
    await this.registry.initializeProvidersFromEnvironment();

    // Select best available provider
    await this.registry.selectBestProvider();

    this.initialized = true;
  }

  /**
   * Handle unified AI command - works with any provider
   */
  async handleAICommand(args: string[], id: string, command: string, timestamp: string): Promise<TerminalCommand> {
    await this.initializeProviders();

    if (args.length === 0 || args.includes('--help')) {
      return this.generateCommand(id, command, this.getHelpText(), timestamp, 0);
    }

    const subCommand = args[0];
    const subArgs = args.slice(1);

    try {
      switch (subCommand) {
        case 'chat':
          return await this.handleChat(subArgs, id, command, timestamp);
        case 'switch':
          return await this.handleSwitch(subArgs, id, command, timestamp);
        case 'providers':
          return await this.handleProviders(subArgs, id, command, timestamp);
        case 'status':
          return await this.handleStatus(subArgs, id, command, timestamp);
        case 'models':
          return await this.handleModels(subArgs, id, command, timestamp);
        case 'exec':
          return await this.handleExec(subArgs, id, command, timestamp);
        case 'config':
          return await this.handleConfig(subArgs, id, command, timestamp);
        case 'clear':
          return await this.handleClear(subArgs, id, command, timestamp);
        default:
          // Default to chat if no recognized subcommand
          const message = args.join(' ');
          return await this.handleDirectChat(message, id, command, timestamp);
      }
    } catch (error) {
      return this.generateCommand(
        id,
        command,
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp,
        1
      );
    }
  }

  /**
   * Handle chat command
   */
  private async handleChat(args: string[], id: string, command: string, timestamp: string): Promise<TerminalCommand> {
    if (args.includes('--help')) {
      const helpText = `AI Chat - Unified interface for all providers

Usage: ai chat [OPTIONS] [MESSAGE]

Options:
  --help              Show this help message
  --provider PROVIDER Use specific provider (claude, gemini, qwen)
  --model MODEL       Use specific model
  --stream            Stream response (if supported)
  --clear             Clear conversation history

Examples:
  ai chat "Write a Python function to sort an array"
  ai chat --provider gemini "Explain machine learning"
  ai chat --model claude-3-opus "Complex reasoning task"
  ai chat --clear`;

      return this.generateCommand(id, command, helpText, timestamp, 0);
    }

    if (args.includes('--clear')) {
      this.registry.clearAllContext();
      return this.generateCommand(id, command, 'All conversation histories cleared', timestamp, 0);
    }

    // Extract provider and model options
    let provider: string | undefined;
    let model: string | undefined;
    const messageArgs: string[] = [];

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg === '--provider' && i + 1 < args.length) {
        provider = args[i + 1];
        i++; // Skip next arg
      } else if (arg === '--model' && i + 1 < args.length) {
        model = args[i + 1];
        i++; // Skip next arg
      } else if (!arg.startsWith('--')) {
        messageArgs.push(arg);
      }
    }

    if (messageArgs.length === 0) {
      return this.generateCommand(id, command, 'Error: No message provided', timestamp, 1);
    }

    const message = messageArgs.join(' ');

    // Switch provider if specified
    if (provider && provider !== this.registry.getActiveProviderId()) {
      const switchResult = await this.registry.switchProvider(provider, true);
      if (!switchResult.success) {
        return this.generateCommand(id, command, `Failed to switch to provider '${provider}': ${switchResult.message}`, timestamp, 1);
      }
    }

    // Send message to AI
    const response = await this.registry.chat(message, { model });
    
    let output = `[${response.model}] ${response.content}`;
    
    if (response.usage) {
      output += `\n\n💡 Token usage: ${response.usage.totalTokens} (${response.usage.inputTokens} input + ${response.usage.outputTokens} output)`;
    }

    return this.generateCommand(id, command, output, timestamp, 0);
  }

  /**
   * Handle direct chat (when message is provided directly)
   */
  private async handleDirectChat(message: string, id: string, command: string, timestamp: string): Promise<TerminalCommand> {
    try {
      const response = await this.registry.chat(message);
      const activeProvider = this.registry.getActiveProviderId() || 'unknown';
      
      let output = `[${activeProvider}] ${response.content}`;
      
      if (response.usage) {
        output += `\n\n💡 Token usage: ${response.usage.totalTokens} (${response.usage.inputTokens} input + ${response.usage.outputTokens} output)`;
      }

      return this.generateCommand(id, command, output, timestamp, 0);
    } catch (error) {
      return this.generateCommand(
        id,
        command,
        `Chat failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp,
        1
      );
    }
  }

  /**
   * Handle provider switching
   */
  private async handleSwitch(args: string[], id: string, command: string, timestamp: string): Promise<TerminalCommand> {
    if (args.length === 0 || args.includes('--help')) {
      const helpText = `AI Provider Switching

Usage: ai switch [PROVIDER] [OPTIONS]

Providers:
  claude    Claude (Anthropic)
  gemini    Gemini (Google)
  qwen      Qwen (Alibaba)

Options:
  --help                Show this help message
  --preserve-context    Preserve conversation context (default)
  --fresh-start         Start with clean context

Examples:
  ai switch claude
  ai switch gemini --fresh-start
  ai switch qwen --preserve-context`;

      return this.generateCommand(id, command, helpText, timestamp, 0);
    }

    const provider = args[0];
    const preserveContext = !args.includes('--fresh-start');

    const result = await this.registry.switchProvider(provider, preserveContext);
    
    let output = result.success ? `✅ ${result.message}` : `❌ ${result.message}`;
    
    if (result.success && result.contextPreserved) {
      output += '\n📝 Conversation context preserved';
    } else if (result.success && !result.contextPreserved) {
      output += '\n🆕 Starting with fresh context';
    }

    return this.generateCommand(id, command, output, timestamp, result.success ? 0 : 1);
  }

  /**
   * Handle providers list command
   */
  private async handleProviders(args: string[], id: string, command: string, timestamp: string): Promise<TerminalCommand> {
    const status = await this.registry.getProviderStatusSummary();
    
    let output = 'AI Providers Status:\n\n';
    
    for (const provider of status.providers) {
      const activeIndicator = status.activeProvider === provider.id ? ' ⭐ ACTIVE' : '';
      const healthIndicator = provider.healthy ? '🟢' : '🔴';
      const enabledIndicator = provider.enabled ? '✅' : '❌';
      
      output += `${healthIndicator} ${provider.name} (${provider.id})${activeIndicator}\n`;
      output += `   Priority: ${provider.priority} | Enabled: ${enabledIndicator} | Health: ${provider.healthy ? 'Online' : 'Offline'}\n\n`;
    }

    if (!status.activeProvider) {
      output += '⚠️ No active provider selected\n';
    }

    return this.generateCommand(id, command, output, timestamp, 0);
  }

  /**
   * Handle status command
   */
  private async handleStatus(args: string[], id: string, command: string, timestamp: string): Promise<TerminalCommand> {
    const activeProvider = this.registry.getActiveProvider();
    const activeProviderId = this.registry.getActiveProviderId();
    
    if (!activeProvider || !activeProviderId) {
      return this.generateCommand(id, command, '❌ No active AI provider', timestamp, 1);
    }

    try {
      const providerStatus = await activeProvider.getStatus();
      const context = this.registry.getConversationContext();
      
      let output = `AI System Status:

Active Provider: ${activeProvider.providerName} (${activeProviderId})
Status: ${providerStatus.isOnline ? '🟢 Online' : '🔴 Offline'}`;

      if (providerStatus.latency) {
        output += `\nLatency: ${providerStatus.latency}ms`;
      }

      if (providerStatus.quotaRemaining) {
        output += `\nQuota Remaining: ${providerStatus.quotaRemaining}`;
      }

      if (providerStatus.lastError) {
        output += `\nLast Error: ${providerStatus.lastError}`;
      }

      output += `\nConversation Context: ${context.length} messages`;
      
      const models = await activeProvider.getAvailableModels();
      output += `\nAvailable Models: ${models.join(', ')}`;

      return this.generateCommand(id, command, output, timestamp, 0);
    } catch (error) {
      return this.generateCommand(
        id,
        command,
        `Failed to get status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp,
        1
      );
    }
  }

  /**
   * Handle models command
   */
  private async handleModels(args: string[], id: string, command: string, timestamp: string): Promise<TerminalCommand> {
    const activeProvider = this.registry.getActiveProvider();
    
    if (!activeProvider) {
      return this.generateCommand(id, command, '❌ No active AI provider', timestamp, 1);
    }

    try {
      const models = await activeProvider.getAvailableModels();
      const capabilities = activeProvider.capabilities;
      
      let output = `Available Models for ${activeProvider.providerName}:\n\n`;
      
      models.forEach((model, index) => {
        output += `${index + 1}. ${model}\n`;
      });

      output += `\nCapabilities:
- Text Generation: ${capabilities.textGeneration ? '✅' : '❌'}
- Image Understanding: ${capabilities.imageUnderstanding ? '✅' : '❌'}
- Code Execution: ${capabilities.codeExecution ? '✅' : '❌'}
- Streaming: ${capabilities.streaming ? '✅' : '❌'}
- Max Context: ${capabilities.maxContextLength.toLocaleString()} tokens`;

      return this.generateCommand(id, command, output, timestamp, 0);
    } catch (error) {
      return this.generateCommand(
        id,
        command,
        `Failed to get models: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp,
        1
      );
    }
  }

  /**
   * Handle code execution
   */
  private async handleExec(args: string[], id: string, command: string, timestamp: string): Promise<TerminalCommand> {
    if (args.includes('--help')) {
      const helpText = `AI Code Execution

Usage: ai exec [OPTIONS] [PROMPT]

Options:
  --help              Show this help message
  --language LANG     Specify programming language
  --provider PROVIDER Use specific provider
  --model MODEL       Use specific model

Examples:
  ai exec "Write and run a Python script to calculate fibonacci"
  ai exec --language python "Sort this array: [3,1,4,1,5]"
  ai exec --provider claude "Complex algorithm implementation"`;

      return this.generateCommand(id, command, helpText, timestamp, 0);
    }

    // Extract options
    let language: string | undefined;
    let provider: string | undefined;
    let model: string | undefined;
    const promptArgs: string[] = [];

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg === '--language' && i + 1 < args.length) {
        language = args[i + 1];
        i++;
      } else if (arg === '--provider' && i + 1 < args.length) {
        provider = args[i + 1];
        i++;
      } else if (arg === '--model' && i + 1 < args.length) {
        model = args[i + 1];
        i++;
      } else if (!arg.startsWith('--')) {
        promptArgs.push(arg);
      }
    }

    if (promptArgs.length === 0) {
      return this.generateCommand(id, command, 'Error: No prompt provided', timestamp, 1);
    }

    const prompt = promptArgs.join(' ');
    const enhancedPrompt = language 
      ? `Write ${language} code to: ${prompt}. Please provide complete, runnable code.`
      : `${prompt}. Please provide complete, runnable code with clear language indication.`;

    // Switch provider if specified
    if (provider && provider !== this.registry.getActiveProviderId()) {
      const switchResult = await this.registry.switchProvider(provider, true);
      if (!switchResult.success) {
        return this.generateCommand(id, command, `Failed to switch to provider '${provider}': ${switchResult.message}`, timestamp, 1);
      }
    }

    try {
      const response = await this.registry.chat(enhancedPrompt, { model });
      const activeProvider = this.registry.getActiveProvider();
      
      if (!activeProvider) {
        return this.generateCommand(id, command, 'No active provider available', timestamp, 1);
      }

      const codeBlocks = activeProvider.extractCodeBlocks(response.content);
      
      let output = `${activeProvider.providerName} Response:\n${response.content}\n\n`;

      if (codeBlocks.length === 0) {
        output += '⚠️ No executable code blocks found';
      } else {
        output += `Found ${codeBlocks.length} code block(s):\n\n`;
        
        codeBlocks.forEach((block, index) => {
          const safetyIcon = block.safetyLevel === 'safe' ? '✅' : 
                            block.safetyLevel === 'caution' ? '⚠️' : '🚨';
          
          output += `[Code Block ${index + 1} - ${block.language.toUpperCase()}] ${safetyIcon}\n`;
          output += '='.repeat(50) + '\n';
          output += block.code + '\n';
          output += '='.repeat(50) + '\n\n';
          
          if (block.safetyLevel === 'dangerous') {
            output += '🚨 WARNING: This code contains potentially dangerous operations!\n\n';
          }
        });

        output += '💡 Use provider-specific commands (claude run, gemini exec, etc.) to execute code blocks';
      }

      return this.generateCommand(id, command, output, timestamp, 0);
    } catch (error) {
      return this.generateCommand(
        id,
        command,
        `Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp,
        1
      );
    }
  }

  /**
   * Handle configuration
   */
  private async handleConfig(args: string[], id: string, command: string, timestamp: string): Promise<TerminalCommand> {
    const activeProvider = this.registry.getActiveProvider();
    const activeProviderId = this.registry.getActiveProviderId();
    
    if (!activeProvider || !activeProviderId) {
      return this.generateCommand(id, command, '❌ No active AI provider', timestamp, 1);
    }

    const configInfo = await activeProvider.handleCommand('config', []);
    
    let output = `Current AI Configuration:

${configInfo}

Available Providers: ${this.registry.getRegisteredProviders().join(', ')}
Switch providers with: ai switch [provider]`;

    return this.generateCommand(id, command, output, timestamp, 0);
  }

  /**
   * Handle clear command
   */
  private async handleClear(args: string[], id: string, command: string, timestamp: string): Promise<TerminalCommand> {
    this.registry.clearAllContext();
    return this.generateCommand(id, command, '🧹 All AI conversation histories cleared', timestamp, 0);
  }

  /**
   * Get help text
   */
  private getHelpText(): string {
    return `Unified AI Command Interface

Usage: ai [COMMAND] [OPTIONS] [ARGS]
   or: ai [MESSAGE]                    (Direct chat)

Commands:
  chat [MESSAGE]        Chat with current AI provider
  switch [PROVIDER]     Switch between AI providers
  providers             List all available providers
  status                Show current provider status
  models                List available models
  exec [PROMPT]         Generate and display code
  config                Show current configuration
  clear                 Clear all conversation histories

Providers:
  claude                Claude (Anthropic) - Advanced reasoning
  gemini                Gemini (Google) - Multimodal capabilities  
  qwen                  Qwen (Alibaba) - Multilingual support

Global Options:
  --help                Show this help message
  --provider PROVIDER   Use specific provider for this command
  --model MODEL         Use specific model for this command

Examples:
  ai "Write a Python function to sort an array"
  ai chat --provider claude "Explain quantum computing"
  ai switch gemini
  ai providers
  ai status
  ai exec "Create a REST API endpoint"
  ai clear

Authentication:
  Set environment variables:
  - ANTHROPIC_API_KEY for Claude
  - GEMINI_API_KEY for Gemini  
  - QWEN_API_KEY for Qwen

The system automatically selects the best available provider and supports
seamless switching with context preservation.`;
  }

  /**
   * Get the registry instance (for external access)
   */
  getRegistry(): AIProviderRegistry {
    return this.registry;
  }
}