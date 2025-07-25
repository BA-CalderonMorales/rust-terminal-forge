# Multi-AI Integration Architecture Guide

This document provides a comprehensive guide to the Multi-AI Integration system implemented in the Rust Terminal Forge project.

## 🎯 Overview

The Multi-AI Integration system provides a unified interface for interacting with multiple AI providers (Claude, Gemini, Qwen) through a single command interface with automatic provider switching, context preservation, and intelligent fallback mechanisms.

## 🏗️ Architecture

### Core Components

1. **IAIProvider Interface** (`src/core/ai/IAIProvider.ts`)
   - Defines the contract that all AI providers must implement
   - Ensures consistent behavior across different AI systems
   - Provides standardized authentication, configuration, and execution patterns

2. **AIProviderRegistry** (`src/core/ai/AIProviderRegistry.ts`)
   - Central registry for managing multiple AI providers
   - Handles provider switching with context preservation
   - Implements automatic fallback mechanisms
   - Monitors provider health and availability

3. **Provider Implementations**
   - **ClaudeProvider** (`src/core/ai/providers/ClaudeProvider.ts`) - Anthropic Claude integration
   - **GeminiProvider** (`src/core/ai/providers/GeminiProvider.ts`) - Google Gemini integration
   - **QwenProvider** (`src/core/ai/providers/QwenProvider.ts`) - Alibaba Qwen integration

4. **UnifiedAICommandManager** (`src/core/ai/UnifiedAICommandManager.ts`)
   - Provides unified command interface for all AI providers
   - Handles command parsing and routing
   - Manages provider switching and configuration

## 🚀 Usage

### Basic Commands

```bash
# Direct chat with current provider
ai "Write a Python function to sort an array"

# Chat with specific provider
ai chat --provider claude "Explain quantum computing"
ai chat --provider gemini "Analyze this image"
ai chat --provider qwen "用中文解释机器学习"

# Switch providers
ai switch claude
ai switch gemini --fresh-start
ai switch qwen --preserve-context

# List available providers
ai providers

# Check system status
ai status

# List available models
ai models

# Generate and display code
ai exec "Create a REST API endpoint"
ai exec --language python "Sort this array: [3,1,4,1,5]"

# Configuration management
ai config
ai clear
```

### Advanced Features

#### Provider-Specific Commands

Each provider maintains its own command interface while also supporting the unified interface:

```bash
# Claude-specific commands (existing)
claude "Write a function"
claude exec "Generate code"
claude run 1

# Gemini-specific commands (existing)
gemini chat "Hello"
gemini list --detailed

# Unified interface (new)
ai "Write a function"                    # Uses active provider
ai exec --provider claude "Generate code" # Forces Claude
ai switch gemini                         # Switch to Gemini
ai "Continue the conversation"           # Now uses Gemini
```

#### Context Preservation

The system automatically preserves conversation context when switching providers:

```bash
ai "Start explaining machine learning"
ai switch gemini --preserve-context
ai "Continue where you left off"  # Gemini continues the ML explanation
```

#### Automatic Fallback

If the active provider fails, the system automatically falls back to the next available provider:

```bash
ai "Hello"  # Tries Claude first
# If Claude fails, automatically tries Gemini
# If Gemini fails, tries Qwen
# Maintains conversation context across attempts
```

## 🔧 Configuration

### Environment Variables

Set up authentication for each provider:

```bash
# Claude (Anthropic)
export ANTHROPIC_API_KEY="sk-ant-your-key-here"

# Gemini (Google)
export GEMINI_API_KEY="your-gemini-key-here"

# Qwen (Alibaba)
export QWEN_API_KEY="your-qwen-key-here"
```

### Provider Priority

Providers are automatically prioritized based on:
1. **Claude**: Priority 100 (highest) - Advanced reasoning
2. **Gemini**: Priority 90 - Multimodal capabilities
3. **Qwen**: Priority 80 - Multilingual support

### Initialization

The system automatically:
- Detects available API keys
- Initializes configured providers
- Selects the best available provider
- Monitors provider health

## 🛡️ Security Features

### Code Execution Safety

All providers implement comprehensive safety checks:

```typescript
interface SafetyLevel {
  'safe'      // No dangerous operations detected
  'caution'   // Minor security concerns (e.g., file I/O)
  'dangerous' // Potentially harmful operations detected
}
```

### Input Validation

- Command injection prevention
- Path traversal protection
- Rate limiting per session
- Input sanitization

### Provider Isolation

Each provider operates in isolation with:
- Separate conversation contexts
- Independent authentication
- Isolated error handling
- Resource usage monitoring

## 📊 Monitoring & Analytics

### Provider Health Monitoring

```bash
ai status
# Output:
# AI System Status:
# Active Provider: Claude (claude)
# Status: 🟢 Online
# Latency: 245ms
# Conversation Context: 12 messages
# Available Models: claude-3-opus-20240229, claude-3-sonnet-20240229, ...
```

### Usage Analytics

The system tracks:
- Token usage per provider
- Response latency
- Error rates
- Provider switching frequency
- Context preservation success rate

## 🔄 Integration Points

### Command Processor Integration

The unified AI system integrates seamlessly with the existing `SecureCommandProcessor`:

```typescript
// New unified command
case 'ai':
  return await this.unifiedAIManager.handleAICommand(args, id, command, timestamp);

// Existing provider-specific commands remain unchanged
case 'claude':
  return await this.handleClaudeCommand(args, id, command, timestamp);
case 'gemini':
  return await this.handleGeminiCommand(args, id, command, timestamp);
```

### Terminal Interface

The system provides consistent terminal output:
- Provider identification in responses
- Token usage information
- Error handling with fallback notifications
- Context preservation indicators

## 🎨 Customization

### Adding New Providers

To add a new AI provider:

1. **Implement the IAIProvider interface**:
```typescript
export class NewProvider implements IAIProvider {
  readonly providerId = 'newprovider';
  readonly providerName = 'New AI Provider';
  // ... implement all required methods
}
```

2. **Register with the registry**:
```typescript
this.registry.registerProvider('newprovider', new NewProvider(), {
  priority: 70,
  enabled: true,
  fallbackOrder: 4
});
```

3. **Add environment configuration**:
```typescript
case 'newprovider':
  const newKey = envManager.getVariable('NEW_PROVIDER_API_KEY');
  return newKey ? { providerId: 'newprovider', apiKey: newKey } : null;
```

### Custom Command Extensions

Extend the UnifiedAICommandManager to add custom commands:

```typescript
class CustomAIManager extends UnifiedAICommandManager {
  async handleCustomCommand(args: string[]): Promise<TerminalCommand> {
    // Custom implementation
  }
}
```

## 🧪 Testing

### Unit Tests

Each provider includes comprehensive tests:
- Authentication validation
- Message sending/receiving
- Code extraction and execution
- Safety checks
- Error handling

### Integration Tests

System-wide integration tests cover:
- Provider switching
- Context preservation
- Fallback mechanisms
- Multi-provider scenarios

### Manual Testing

```bash
# Test provider availability
ai providers

# Test switching with context
ai "Start a story about AI"
ai switch gemini --preserve-context
ai "Continue the story"

# Test fallback (disable current provider's API key)
unset ANTHROPIC_API_KEY
ai "This should fall back to Gemini"
```

## 🔍 Troubleshooting

### Common Issues

1. **Provider Not Available**
   ```bash
   ai providers  # Check provider status
   ai status     # Check active provider details
   ```

2. **Authentication Failures**
   ```bash
   # Check environment variables
   echo $ANTHROPIC_API_KEY
   echo $GEMINI_API_KEY
   echo $QWEN_API_KEY
   
   # Test connections
   ai switch claude
   ai "test connection"
   ```

3. **Context Loss**
   ```bash
   # Check conversation history
   ai status  # Shows context message count
   
   # Clear and restart if needed
   ai clear
   ```

### Debug Mode

Enable debug logging by setting:
```bash
export DEBUG_AI_INTEGRATION=true
```

## 🚀 Future Enhancements

### Planned Features

1. **Model-Specific Optimization**
   - Automatic model selection based on task type
   - Performance benchmarking
   - Cost optimization

2. **Advanced Context Management**
   - Cross-provider context translation
   - Context summarization for long conversations
   - Context persistence across sessions

3. **Integration Expansions**
   - OpenAI GPT integration
   - Local model support (Ollama, etc.)
   - Custom API endpoint support

4. **Enhanced Analytics**
   - Provider performance comparison
   - Usage pattern analysis
   - Automated provider recommendations

### Extension Points

The architecture is designed for easy extension:
- Plugin system for new providers
- Custom command handlers
- Middleware for request/response processing
- Event hooks for monitoring and analytics

## 📚 API Reference

### IAIProvider Interface

```typescript
interface IAIProvider {
  // Provider identification
  readonly providerId: string;
  readonly providerName: string;
  readonly capabilities: AIProviderCapabilities;
  
  // Core functionality
  initialize(config: AIProviderConfig): Promise<boolean>;
  isAuthenticated(): Promise<boolean>;
  sendMessage(messages: AIMessage[], options?): Promise<AIResponse>;
  chat(message: string, options?): Promise<AIResponse>;
  
  // Code handling
  extractCodeBlocks(content: string): CodeBlock[];
  executeCode(code: string, language: string): Promise<AIExecutionResult>;
  containsDangerousCode(code: string): boolean;
  
  // Management
  clearHistory(): void;
  getHistory(): AIMessage[];
  handleCommand(command: string, args: string[]): Promise<string>;
  getStatus(): Promise<ProviderStatus>;
}
```

### AIProviderRegistry

```typescript
class AIProviderRegistry {
  registerProvider(id: string, provider: IAIProvider, options?): void;
  switchProvider(id: string, preserveContext?: boolean): Promise<ProviderSwitchResult>;
  sendMessage(messages: AIMessage[], options?): Promise<AIResponse>;
  chat(message: string, options?): Promise<AIResponse>;
  getProviderStatusSummary(): Promise<ProviderStatusSummary>;
}
```

## 🤝 Contributing

To contribute to the Multi-AI Integration system:

1. Follow the IAIProvider interface for new providers
2. Add comprehensive tests for new functionality
3. Update this documentation for any new features
4. Ensure backward compatibility with existing commands

## 📄 License

This Multi-AI Integration system is part of the Rust Terminal Forge project and follows the same licensing terms.

---

**Built with ❤️ for seamless AI integration**