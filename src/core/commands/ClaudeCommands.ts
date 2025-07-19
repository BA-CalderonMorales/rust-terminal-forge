import { TerminalCommand } from '../types';
import { BaseCommandHandler } from './BaseCommandHandler';
import { SecureExecutor } from '../SecureExecutor';
import { ClaudeApiClient, ClaudeMessage } from '../ClaudeApiClient';
import { EnvironmentManager } from '../EnvironmentManager';
import { CodeExecutor, ExecutionResult } from '../CodeExecutor';

export class ClaudeCommands extends BaseCommandHandler {
  private secureExecutor: SecureExecutor;
  private claudeClient: ClaudeApiClient | null = null;
  private codeExecutor: CodeExecutor;
  private conversationHistory: ClaudeMessage[] = [];
  private lastCodeBlocks: Array<{ language: string; code: string }> = [];

  constructor() {
    super();
    this.secureExecutor = new SecureExecutor({
      allowRealExecution: false, // Start with simulated execution for safety
      allowedCommands: ['claude']
    });
    this.codeExecutor = new CodeExecutor({
      timeout: 10000,
      maxOutputLength: 10000,
      allowNetworkAccess: false,
      allowFileSystem: false
    });
  }

  /**
   * Initialize Claude API client with API key
   */
  private initializeClaudeClient(): boolean {
    const envManager = EnvironmentManager.getInstance();
    const apiKey = envManager.getAnthropicApiKey();
    
    if (!apiKey) {
      return false;
    }

    if (!ClaudeApiClient.validateApiKey(apiKey)) {
      return false;
    }

    this.claudeClient = new ClaudeApiClient({
      apiKey,
      model: 'claude-3-sonnet-20240229',
      maxTokens: 4096,
      temperature: 0.7
    });

    return true;
  }

  async handleClaude(args: string[], id: string, command: string, timestamp: string): Promise<TerminalCommand> {
    if (args.includes('--help')) {
      const helpText = `Claude Code - AI Assistant for Development

Usage: claude [MESSAGE]
   or: claude [COMMAND] [OPTIONS]

Direct Usage (like current session):
  claude "Write a Python function to sort an array"
  claude "Explain React hooks"
  claude "Help me debug this code"

Commands:
  auth             Manage authentication
  config           Configure Claude settings
  exec             Execute code with Claude's help
  run [ID]         Run a specific code block from last response
  clear            Clear conversation history

Options:
  --help           Show this help message
  --model MODEL    Specify Claude model
  --max-tokens N   Maximum tokens in response
  --stream         Stream response (real-time)

Authentication:
  1. Set your API key: claude auth --setup
  2. Or use: env set ANTHROPIC_API_KEY "sk-ant-your-key-here"
  3. Test connection: claude auth --test

Examples:
  claude "Write a Python function to sort an array"
  claude auth --status
  claude exec "Write and run Python code"
  claude run 1`;

      return this.generateCommand(id, command, helpText, timestamp);
    }

    // If no args, show help
    if (args.length === 0) {
      return this.generateCommand(id, command, 'Claude Code - Type "claude --help" for usage information, or "claude auth --setup" to get started.', timestamp);
    }

    // Handle direct message (the main use case)
    if (!args[0].startsWith('-') && !['auth', 'config', 'exec', 'run', 'clear'].includes(args[0])) {
      // Treat the entire args as a message to Claude
      const message = args.join(' ');
      return await this.handleClaudeChat(['chat', message], id, command, timestamp);
    }

    // Handle sub-commands
    const subCommand = args[0];
    const subArgs = args.slice(1);

    switch (subCommand) {
      case 'auth':
        return await this.handleClaudeAuth(subArgs, id, command, timestamp);
      case 'chat':
        return await this.handleClaudeChat(subArgs, id, command, timestamp);
      case 'exec':
        return await this.handleClaudeExec(subArgs, id, command, timestamp);
      case 'run':
        return await this.handleClaudeRun(subArgs, id, command, timestamp);
      case 'clear':
        this.clearHistory();
        return this.generateCommand(id, command, 'Conversation history cleared', timestamp);
      default:
        // Default: treat as direct message
        const message = args.join(' ');
        return await this.handleClaudeChat(['chat', message], id, command, timestamp);
    }
  }

  /**
   * Handle Claude authentication
   */
  async handleClaudeAuth(args: string[], id: string, command: string, timestamp: string): Promise<TerminalCommand> {
    if (args.includes('--help')) {
      const helpText = `Claude Authentication

Usage: claude auth [OPTIONS]

Options:
  --help        Show this help message
  --status      Check authentication status
  --setup       Setup API key
  --test        Test connection

Examples:
  claude auth --status
  claude auth --setup
  claude auth --test`;

      return this.generateCommand(id, command, helpText, timestamp);
    }

    if (args.includes('--status')) {
      const isInitialized = this.initializeClaudeClient();
      const status = isInitialized 
        ? '✅ Authenticated with Claude API'
        : '❌ Not authenticated. Set ANTHROPIC_API_KEY environment variable or use --setup';
      
      return this.generateCommand(id, command, status, timestamp);
    }

    if (args.includes('--setup')) {
      const setupText = `To set up Claude authentication:

1. Get your API key from https://console.anthropic.com/
2. Set your API key using one of these methods:

   Method 1 - Using env command (recommended):
   env set ANTHROPIC_API_KEY "sk-ant-your-key-here"
   
   Method 2 - Browser console:
   window.ANTHROPIC_API_KEY = "sk-ant-your-key-here"

3. Run "claude auth --test" to verify connection
4. Start chatting: "claude chat Hello Claude!"

Your API key will be stored securely in browser localStorage.`;

      return this.generateCommand(id, command, setupText, timestamp);
    }

    if (args.includes('--set-key')) {
      if (args.length < 3) {
        return this.generateCommand(id, command, 'Usage: claude auth --set-key "your-api-key-here"', timestamp, 1);
      }

      const apiKey = args[args.indexOf('--set-key') + 1];
      const envManager = EnvironmentManager.getInstance();
      const result = envManager.setAnthropicApiKey(apiKey);

      if (result.success) {
        return this.generateCommand(id, command, '✅ API key set successfully! Run "claude auth --test" to verify.', timestamp);
      } else {
        return this.generateCommand(id, command, `❌ ${result.message}`, timestamp, 1);
      }
    }

    if (args.includes('--test')) {
      if (!this.initializeClaudeClient()) {
        return this.generateCommand(id, command, '❌ API key not found or invalid', timestamp, 1);
      }

      try {
        const response = await this.claudeClient!.sendMessage([
          { role: 'user', content: 'Hello, just testing the connection. Please respond with "Connection successful!"' }
        ]);
        
        return this.generateCommand(id, command, '✅ Connection test successful!', timestamp);
      } catch (error) {
        return this.generateCommand(id, command, `❌ Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`, timestamp, 1);
      }
    }

    return this.generateCommand(id, command, 'Use "claude auth --help" for usage information', timestamp);
  }

  /**
   * Handle Claude chat functionality
   */
  async handleClaudeChat(args: string[], id: string, command: string, timestamp: string): Promise<TerminalCommand> {
    // Handle special case where args[0] is 'chat' (called from main handler)
    let actualArgs = args;
    if (args.length > 0 && args[0] === 'chat') {
      actualArgs = args.slice(1);
    }

    if (actualArgs.includes('--help')) {
      const helpText = `Claude Chat

Usage: claude [MESSAGE]
   or: claude chat [OPTIONS] [MESSAGE]

Options:
  --help           Show this help message
  --stream         Stream response in real-time
  --clear          Clear conversation history
  --context        Show conversation context

Examples:
  claude "Write a function to reverse a string"
  claude "Explain React hooks"
  claude chat --clear`;

      return this.generateCommand(id, command, helpText, timestamp);
    }

    if (actualArgs.includes('--clear')) {
      this.conversationHistory = [];
      return this.generateCommand(id, command, 'Conversation history cleared', timestamp);
    }

    if (actualArgs.includes('--context')) {
      if (this.conversationHistory.length === 0) {
        return this.generateCommand(id, command, 'No conversation history', timestamp);
      }

      const context = this.conversationHistory
        .map((msg, i) => `${i + 1}. ${msg.role}: ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`)
        .join('\n');

      return this.generateCommand(id, command, `Conversation Context:\n${context}`, timestamp);
    }

    if (!this.initializeClaudeClient()) {
      return this.generateCommand(id, command, '❌ Not authenticated. Run "claude auth --setup" first', timestamp, 1);
    }

    // Extract message from args (filter out options)
    const messageArgs: string[] = [];
    for (let i = 0; i < actualArgs.length; i++) {
      const arg = actualArgs[i];
      if (arg.startsWith('--')) {
        continue;
      }
      messageArgs.push(arg);
    }

    if (messageArgs.length === 0) {
      return this.generateCommand(id, command, 'Error: No message provided. Try: claude "your message here"', timestamp, 1);
    }

    const message = messageArgs.join(' ');
    
    try {
      // Add user message to history
      this.conversationHistory.push({ role: 'user', content: message });

      // Keep only last 10 messages to avoid token limits
      if (this.conversationHistory.length > 10) {
        this.conversationHistory = this.conversationHistory.slice(-10);
      }

      const response = await this.claudeClient!.sendMessage(this.conversationHistory);
      const assistantMessage = response.content[0].text;

      // Add assistant response to history
      this.conversationHistory.push({ role: 'assistant', content: assistantMessage });

      // Check for code blocks and offer execution
      const codeBlocks = this.claudeClient!.extractCodeBlocks(assistantMessage);
      this.lastCodeBlocks = codeBlocks; // Store for potential execution
      let output = assistantMessage;

      if (codeBlocks.length > 0) {
        output += '\n\n' + this.formatCodeBlocksForTerminal(codeBlocks);
        output += '\n\n💡 Use "claude run [number]" to execute a code block (e.g., "claude run 1")';
      }

      return this.generateCommand(id, command, output, timestamp);
    } catch (error) {
      return this.generateCommand(id, command, `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`, timestamp, 1);
    }
  }

  /**
   * Handle Claude code execution
   */
  async handleClaudeExec(args: string[], id: string, command: string, timestamp: string): Promise<TerminalCommand> {
    if (args.includes('--help')) {
      const helpText = `Claude Code Execution

Usage: claude exec [OPTIONS] [PROMPT]

Options:
  --help           Show this help message
  --language LANG  Specify language (python, javascript, bash)
  --confirm        Always ask for confirmation before execution

Examples:
  claude exec "Write and run a Python script to calculate fibonacci"
  claude exec --language python "Sort this array: [3,1,4,1,5]"`;

      return this.generateCommand(id, command, helpText, timestamp);
    }

    if (!this.initializeClaudeClient()) {
      return this.generateCommand(id, command, '❌ Not authenticated. Run "claude auth --setup" first', timestamp, 1);
    }

    // Extract prompt from args
    const promptArgs: string[] = [];
    let specifiedLanguage = '';
    let requireConfirm = args.includes('--confirm');

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg === '--language' && i + 1 < args.length) {
        specifiedLanguage = args[i + 1];
        i++; // Skip next arg
      } else if (arg.startsWith('--')) {
        continue;
      } else {
        promptArgs.push(arg);
      }
    }

    if (promptArgs.length === 0) {
      return this.generateCommand(id, command, 'Error: No prompt provided. Use "claude exec --help" for usage.', timestamp, 1);
    }

    const prompt = promptArgs.join(' ');
    const enhancedPrompt = specifiedLanguage 
      ? `Write ${specifiedLanguage} code to: ${prompt}. Please provide complete, runnable code.`
      : `${prompt}. Please provide complete, runnable code with clear language indication.`;

    try {
      const response = await this.claudeClient!.sendMessage([
        { role: 'user', content: enhancedPrompt }
      ]);

      const assistantMessage = response.content[0].text;
      const codeBlocks = this.claudeClient!.extractCodeBlocks(assistantMessage);

      if (codeBlocks.length === 0) {
        return this.generateCommand(id, command, `Claude Response:\n${assistantMessage}\n\n⚠️ No executable code blocks found`, timestamp);
      }

      let output = `Claude Response:\n${assistantMessage}\n\n`;
      output += this.formatCodeBlocksForTerminal(codeBlocks);

      // Check for dangerous code
      for (const block of codeBlocks) {
        if (this.claudeClient!.containsDangerousCode(block.code)) {
          output += `\n⚠️ WARNING: Code block contains potentially dangerous operations. Review carefully before execution.`;
        }
      }

      return this.generateCommand(id, command, output, timestamp);
    } catch (error) {
      return this.generateCommand(id, command, `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`, timestamp, 1);
    }
  }

  /**
   * Handle Claude code execution by block number
   */
  async handleClaudeRun(args: string[], id: string, command: string, timestamp: string): Promise<TerminalCommand> {
    if (args.includes('--help')) {
      const helpText = `Claude Run Code Block

Usage: claude run [OPTIONS] [BLOCK_NUMBER]

Options:
  --help           Show this help message
  --list           List available code blocks
  --confirm        Always ask for confirmation (default)
  --force          Skip confirmation (dangerous!)

Examples:
  claude run 1
  claude run --list
  claude run 2 --force`;

      return this.generateCommand(id, command, helpText, timestamp);
    }

    if (args.includes('--list')) {
      if (this.lastCodeBlocks.length === 0) {
        return this.generateCommand(id, command, 'No code blocks available from last Claude response', timestamp);
      }

      const list = this.lastCodeBlocks.map((block, index) => {
        const preview = block.code.split('\n')[0];
        return `${index + 1}. ${block.language.toUpperCase()}: ${preview}${block.code.length > preview.length ? '...' : ''}`;
      }).join('\n');

      return this.generateCommand(id, command, `Available Code Blocks:\n${list}`, timestamp);
    }

    // Extract block number
    const blockNum = args.find(arg => /^\d+$/.test(arg));
    if (!blockNum) {
      return this.generateCommand(id, command, 'Error: Please specify a block number. Use "claude run --list" to see available blocks.', timestamp, 1);
    }

    const blockIndex = parseInt(blockNum) - 1;
    if (blockIndex < 0 || blockIndex >= this.lastCodeBlocks.length) {
      return this.generateCommand(id, command, `Error: Block ${blockNum} not found. Available blocks: 1-${this.lastCodeBlocks.length}`, timestamp, 1);
    }

    const codeBlock = this.lastCodeBlocks[blockIndex];
    const skipConfirmation = args.includes('--force');

    try {
      // Safety check
      if (this.claudeClient!.containsDangerousCode(codeBlock.code) && !skipConfirmation) {
        return this.generateCommand(id, command, 
          `⚠️ WARNING: Code block contains potentially dangerous operations.\n\n` +
          `Code preview:\n${codeBlock.code.substring(0, 200)}${codeBlock.code.length > 200 ? '...' : ''}\n\n` +
          `Use "claude run ${blockNum} --force" to execute anyway (not recommended).`, 
          timestamp, 1);
      }

      // Execute the code
      const result = await this.codeExecutor.executeCode(codeBlock.code, codeBlock.language);
      
      let output = `Executed Code Block ${blockNum} (${codeBlock.language.toUpperCase()})\n`;
      output += '='.repeat(50) + '\n';
      output += codeBlock.code + '\n';
      output += '='.repeat(50) + '\n';
      
      if (result.success) {
        output += `✅ Execution successful (${result.executionTime}ms)\n`;
        if (result.output) {
          output += `Output:\n${result.output}`;
        } else {
          output += 'No output generated';
        }
      } else {
        output += `❌ Execution failed (${result.executionTime}ms)\n`;
        output += `Error: ${result.error}`;
      }

      return this.generateCommand(id, command, output, timestamp, result.success ? 0 : 1);
    } catch (error) {
      return this.generateCommand(id, command, `❌ Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`, timestamp, 1);
    }
  }

  /**
   * Format code blocks for terminal display
   */
  private formatCodeBlocksForTerminal(codeBlocks: Array<{ language: string; code: string }>): string {
    return codeBlocks.map((block, index) => {
      const header = `[Code Block ${index + 1} - ${block.language.toUpperCase()}]`;
      const separator = '='.repeat(50);
      const dangerousWarning = this.claudeClient!.containsDangerousCode(block.code) 
        ? ' ⚠️ WARNING: Contains potentially dangerous code' 
        : '';
      return `${header}${dangerousWarning}\n${separator}\n${block.code}\n${separator}`;
    }).join('\n\n');
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Get conversation history
   */
  getHistory(): ClaudeMessage[] {
    return [...this.conversationHistory];
  }

  /**
   * Enable real execution mode (requires proper API setup)
   */
  enableRealExecution(): void {
    this.secureExecutor = new SecureExecutor({
      allowRealExecution: true,
      allowedCommands: ['claude']
    });
  }

  /**
   * Check if real execution is available
   */
  isRealExecutionEnabled(): boolean {
    return this.secureExecutor['config'].allowRealExecution;
  }
}