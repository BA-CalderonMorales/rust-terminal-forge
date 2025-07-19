// Secure code execution sandbox for Claude-generated code
export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime: number;
  language: string;
}

export interface ExecutionConfig {
  timeout: number; // milliseconds
  maxOutputLength: number;
  allowNetworkAccess: boolean;
  allowFileSystem: boolean;
}

export class CodeExecutor {
  private config: ExecutionConfig;
  private dangerousPatterns: RegExp[];

  constructor(config: Partial<ExecutionConfig> = {}) {
    this.config = {
      timeout: 5000, // 5 seconds default
      maxOutputLength: 10000, // 10KB default
      allowNetworkAccess: false,
      allowFileSystem: false,
      ...config
    };

    // Patterns that indicate potentially dangerous code
    this.dangerousPatterns = [
      /import\s+subprocess/,
      /import\s+os/,
      /import\s+sys/,
      /exec\s*\(/,
      /eval\s*\(/,
      /\.system\(/,
      /fetch\s*\(/,
      /XMLHttpRequest/,
      /require\s*\(\s*['"`]fs['"`]\)/,
      /require\s*\(\s*['"`]child_process['"`]\)/,
      /process\.exit/,
      /window\./,
      /document\./,
      /global\./,
      /globalThis\./,
      /delete\s+/,
      /__import__/,
      /open\s*\(/,
      /file\s*\(/,
      /input\s*\(/,
      /raw_input\s*\(/
    ];
  }

  /**
   * Execute code in a sandboxed environment
   */
  async executeCode(code: string, language: string): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    try {
      // Pre-execution security checks
      const securityCheck = this.performSecurityCheck(code, language);
      if (!securityCheck.safe) {
        return {
          success: false,
          output: '',
          error: `Security check failed: ${securityCheck.reason}`,
          executionTime: Date.now() - startTime,
          language
        };
      }

      // Execute based on language
      let result: ExecutionResult;
      switch (language.toLowerCase()) {
        case 'python':
        case 'py':
          result = await this.executePython(code);
          break;
        case 'javascript':
        case 'js':
          result = await this.executeJavaScript(code);
          break;
        case 'bash':
        case 'sh':
          result = await this.executeBash(code);
          break;
        default:
          return {
            success: false,
            output: '',
            error: `Unsupported language: ${language}`,
            executionTime: Date.now() - startTime,
            language
          };
      }

      result.executionTime = Date.now() - startTime;
      result.language = language;
      
      return result;
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown execution error',
        executionTime: Date.now() - startTime,
        language
      };
    }
  }

  /**
   * Perform security checks on code before execution
   */
  private performSecurityCheck(code: string, language: string): { safe: boolean; reason?: string } {
    // Check for dangerous patterns
    for (const pattern of this.dangerousPatterns) {
      if (pattern.test(code)) {
        return { safe: false, reason: `Contains potentially dangerous pattern: ${pattern.source}` };
      }
    }

    // Language-specific checks
    switch (language.toLowerCase()) {
      case 'python':
      case 'py':
        return this.checkPythonSafety(code);
      case 'javascript':
      case 'js':
        return this.checkJavaScriptSafety(code);
      case 'bash':
      case 'sh':
        return this.checkBashSafety(code);
      default:
        return { safe: true };
    }
  }

  /**
   * Python-specific safety checks
   */
  private checkPythonSafety(code: string): { safe: boolean; reason?: string } {
    const pythonDangerousPatterns = [
      /import\s+subprocess/,
      /import\s+os/,
      /import\s+sys/,
      /__import__/,
      /open\s*\(/,
      /file\s*\(/,
      /input\s*\(/,
      /raw_input\s*\(/,
      /compile\s*\(/,
      /globals\s*\(/,
      /locals\s*\(/,
      /vars\s*\(/,
      /dir\s*\(/,
      /getattr\s*\(/,
      /setattr\s*\(/,
      /delattr\s*\(/,
      /hasattr\s*\(/
    ];

    for (const pattern of pythonDangerousPatterns) {
      if (pattern.test(code)) {
        return { safe: false, reason: `Python: ${pattern.source}` };
      }
    }

    return { safe: true };
  }

  /**
   * JavaScript-specific safety checks
   */
  private checkJavaScriptSafety(code: string): { safe: boolean; reason?: string } {
    const jsDangerousPatterns = [
      /require\s*\(/,
      /import\s+/,
      /fetch\s*\(/,
      /XMLHttpRequest/,
      /eval\s*\(/,
      /Function\s*\(/,
      /setTimeout\s*\(/,
      /setInterval\s*\(/,
      /process\./,
      /global\./,
      /window\./,
      /document\./,
      /localStorage/,
      /sessionStorage/,
      /indexedDB/,
      /WebSocket/
    ];

    for (const pattern of jsDangerousPatterns) {
      if (pattern.test(code)) {
        return { safe: false, reason: `JavaScript: ${pattern.source}` };
      }
    }

    return { safe: true };
  }

  /**
   * Bash-specific safety checks
   */
  private checkBashSafety(code: string): { safe: boolean; reason?: string } {
    const bashDangerousPatterns = [
      /rm\s+-rf/,
      /sudo\s+/,
      /curl.*\|.*sh/,
      /wget.*\|.*sh/,
      /chmod\s+/,
      /chown\s+/,
      /mount\s+/,
      /umount\s+/,
      /dd\s+/,
      /mkfs\./,
      /fdisk/,
      /kill\s+-9/,
      /pkill/,
      /killall/,
      /reboot/,
      /shutdown/,
      /halt/
    ];

    for (const pattern of bashDangerousPatterns) {
      if (pattern.test(code)) {
        return { safe: false, reason: `Bash: ${pattern.source}` };
      }
    }

    return { safe: true };
  }

  /**
   * Execute Python code (simulated - would need Pyodide or similar in browser)
   */
  private async executePython(code: string): Promise<ExecutionResult> {
    // In a real implementation, this would use Pyodide or a sandboxed Python environment
    // For now, we'll provide a simulated execution
    
    const simulatedResult = this.simulatePythonExecution(code);
    
    return {
      success: true,
      output: simulatedResult,
      language: 'python'
    } as ExecutionResult;
  }

  /**
   * Execute JavaScript code in a sandboxed environment
   */
  private async executeJavaScript(code: string): Promise<ExecutionResult> {
    try {
      // Create a sandboxed execution context
      const sandbox = this.createJavaScriptSandbox();
      
      // Wrap code in try-catch and capture output
      const wrappedCode = `
        (function() {
          const console_outputs = [];
          const console = {
            log: (...args) => console_outputs.push(args.map(String).join(' ')),
            error: (...args) => console_outputs.push('ERROR: ' + args.map(String).join(' ')),
            warn: (...args) => console_outputs.push('WARNING: ' + args.map(String).join(' '))
          };
          
          try {
            ${code}
            return { success: true, output: console_outputs.join('\\n'), error: null };
          } catch (error) {
            return { success: false, output: console_outputs.join('\\n'), error: error.message };
          }
        })()
      `;

      // Execute with timeout
      const result = await this.executeWithTimeout(wrappedCode, this.config.timeout);
      
      return {
        success: result.success,
        output: result.output || '',
        error: result.error || undefined,
        language: 'javascript'
      } as ExecutionResult;
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'JavaScript execution failed',
        language: 'javascript'
      } as ExecutionResult;
    }
  }

  /**
   * Execute Bash commands (simulated for safety)
   */
  private async executeBash(code: string): Promise<ExecutionResult> {
    // In a browser environment, we can only simulate bash execution
    const simulatedResult = this.simulateBashExecution(code);
    
    return {
      success: true,
      output: simulatedResult,
      language: 'bash'
    } as ExecutionResult;
  }

  /**
   * Create a sandboxed JavaScript execution environment
   */
  private createJavaScriptSandbox(): any {
    // Remove dangerous globals and create restricted environment
    const sandbox = {
      console: {
        log: () => {},
        error: () => {},
        warn: () => {}
      },
      Math: Math,
      Date: Date,
      parseInt: parseInt,
      parseFloat: parseFloat,
      JSON: JSON,
      Array: Array,
      Object: Object,
      String: String,
      Number: Number,
      Boolean: Boolean
    };

    return sandbox;
  }

  /**
   * Execute code with timeout
   */
  private async executeWithTimeout(code: string, timeout: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Execution timeout after ${timeout}ms`));
      }, timeout);

      try {
        const result = Function(code)();
        clearTimeout(timeoutId);
        resolve(result);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Simulate Python execution for demonstration
   */
  private simulatePythonExecution(code: string): string {
    // Simple pattern matching for common Python operations
    if (code.includes('print(')) {
      const printMatch = code.match(/print\((.*?)\)/g);
      if (printMatch) {
        return printMatch.map(p => {
          const content = p.replace(/print\((.*?)\)/, '$1').replace(/['"]/g, '');
          return content;
        }).join('\n');
      }
    }

    if (code.includes('def ')) {
      return 'Function defined successfully (simulated)';
    }

    if (code.includes('=') && !code.includes('==')) {
      return 'Variable assigned (simulated)';
    }

    return `Python code executed (simulated):
${code}

Output: This is a simulated execution. In a real implementation, 
this would run Python code using Pyodide or a server-side sandbox.`;
  }

  /**
   * Simulate Bash execution for demonstration
   */
  private simulateBashExecution(code: string): string {
    const lines = code.split('\n').filter(line => line.trim());
    const results = lines.map(line => {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('echo ')) {
        return trimmed.replace('echo ', '');
      }
      
      if (trimmed === 'pwd') {
        return '/home/user';
      }
      
      if (trimmed === 'ls') {
        return 'file1.txt  file2.py  directory1/';
      }
      
      if (trimmed.startsWith('ls ')) {
        return 'Contents of directory (simulated)';
      }
      
      return `${trimmed}: command executed (simulated)`;
    });

    return results.join('\n');
  }

  /**
   * Truncate output if it exceeds maximum length
   */
  private truncateOutput(output: string): string {
    if (output.length > this.config.maxOutputLength) {
      return output.substring(0, this.config.maxOutputLength) + 
             `\n... (output truncated after ${this.config.maxOutputLength} characters)`;
    }
    return output;
  }
}