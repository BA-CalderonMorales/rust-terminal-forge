import { TerminalCommand } from '../types';
import { BaseCommandHandler } from './BaseCommandHandler';
import { SecureExecutor } from '../SecureExecutor';

export class ClaudeCodeCommands extends BaseCommandHandler {
  private secureExecutor = new SecureExecutor({
    allowRealExecution: localStorage.getItem('allowRealExecution') === 'true',
    allowedCommands: ['claude', 'which']
  });

  private getHelpText(): string {
    return `Claude Code - AI Assistant for Development

Usage: claude-code [OPTIONS] [PROMPT]

REPL Usage:
  claude-code                      Start interactive REPL
  claude-code "query"              Start REPL with initial prompt
  
One-shot Usage:
  claude-code -p "query"           Query via SDK and exit
  claude-code -c                   Continue most recent conversation
  claude-code -r "<session-id>"    Resume session by ID

Commands:
  claude-code update               Update to latest version
  claude-code mcp                  Configure Model Context Protocol servers

Options:
  --add-dir <PATH>           Add working directory
  --allowedTools <TOOLS>     Specify allowed tools (comma-separated)
  --disallowedTools <TOOLS>  Specify disallowed tools (comma-separated)
  -p, --print                Print response without interactive mode
  --output-format <FORMAT>   Set response output format (text, json)
  --verbose                  Enable detailed logging
  --model <MODEL>            Set specific model for session
  --permission-mode <MODE>   Set permission mode (strict, normal, loose)
  -c, --continue             Load most recent conversation
  -r, --resume <SESSION>     Resume specific session
  --dangerously-skip-permissions  Skip permission prompts (use with caution)
  --help                     Show this help message
  --version                  Show version information

Examples:
  claude-code "Explain this React component"
  claude-code -p "Write a Python function to sort an array"
  claude-code --add-dir ./src "Review this codebase"
  claude-code -c "Can you elaborate on that?"
  claude-code --model claude-3-opus-20240229 "Complex analysis task"`;
  }

  /**
   * Handle claude main command
   */
  async handleClaude(args: string[], id: string, command: string, timestamp: string): Promise<TerminalCommand> {
    // Show help if no args or help requested
    if (args.length === 0 || args.includes('--help')) {
      return this.generateCommand(id, command, this.getHelpText(), timestamp, 0);
    }

    // Check if claude is available
    const availabilityCheck = await this.checkClaudeAvailability(id, command, timestamp);
    if (availabilityCheck.exitCode !== 0) {
      return availabilityCheck;
    }

    // Execute the claude command through SecureExecutor
    try {
      return await this.secureExecutor.executeCommand('claude', args, id, command, timestamp);
    } catch (error) {
      return this.generateCommand(
        id, 
        command, 
        `Error executing claude: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        timestamp, 
        1
      );
    }
  }

  /**
   * Handle specific claude subcommands
   */
  async handleClaudeUpdate(args: string[], id: string, command: string, timestamp: string): Promise<TerminalCommand> {
    return this.handleClaude(['update', ...args], id, command, timestamp);
  }

  async handleClaudeMcp(args: string[], id: string, command: string, timestamp: string): Promise<TerminalCommand> {
    return this.handleClaude(['mcp', ...args], id, command, timestamp);
  }

  /**
   * Check if claude CLI is available in the system
   */
  private async checkClaudeAvailability(id: string, command: string, timestamp: string): Promise<TerminalCommand> {
    try {
      const result = await this.secureExecutor.executeCommand('which', ['claude'], id, `which claude`, timestamp);
      
      if (result.exitCode === 0) {
        // claude is available
        return this.generateCommand(id, command, '', timestamp, 0);
      } else {
        // claude is not available, provide installation instructions
        const installInstructions = `Claude CLI is not available in the system PATH.

To install claude-code, you have several options:

1. Install via npm (recommended):
   npm install -g @anthropic-ai/claude-code

2. Install via pip:
   pip install claude-code

3. Download from GitHub releases:
   https://github.com/anthropics/claude-code/releases

4. Install via Homebrew (macOS):
   brew install anthropics/claude/claude-code

After installation:
1. Authenticate with your Anthropic API key:
   claude-code auth

2. Start using Claude Code:
   claude-code "Hello Claude!"
   
3. Or start an interactive session:
   claude-code

Note: You'll need an Anthropic API key with Claude Code access.
Get one at: https://console.anthropic.com/

Until claude-code is properly installed, this terminal will provide 
simulated responses to help you understand the interface.`;

        return this.generateCommand(id, command, installInstructions, timestamp, 1);
      }
    } catch (error) {
      return this.generateCommand(
        id, 
        command, 
        `Error checking claude-code availability: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        timestamp, 
        1
      );
    }
  }

  /**
   * Check if claude-code is properly configured
   */
  async isConfigured(): Promise<boolean> {
    try {
      const whichResult = await this.secureExecutor.executeCommand(
        'which', 
        ['claude'], 
        'temp-id', 
        'which claude', 
        new Date().toISOString()
      );
      
      if (whichResult.exitCode !== 0) {
        return false;
      }

      // Try to run claude --help to see if it's working
      const helpResult = await this.secureExecutor.executeCommand(
        'claude', 
        ['--help'], 
        'temp-id', 
        'claude --help', 
        new Date().toISOString()
      );
      
      return helpResult.exitCode === 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get claude-code version
   */
  async getVersion(): Promise<string> {
    try {
      const result = await this.secureExecutor.executeCommand(
        'claude', 
        ['--version'], 
        'temp-id', 
        'claude --version', 
        new Date().toISOString()
      );
      
      if (result.exitCode === 0) {
        return result.output.trim();
      } else {
        return 'Unknown version';
      }
    } catch (error) {
      return 'Unknown version';
    }
  }
}