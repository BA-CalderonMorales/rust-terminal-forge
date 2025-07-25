/**
 * Structured debug logger for rust-terminal-forge
 * 
 * Features:
 * - Multiple log levels with filtering
 * - Component-specific logging
 * - Performance tracing
 * - JSON and text output formats
 * - Log persistence and retrieval
 * - Stack trace capture
 */

import { debugConfig, DebugLevel, DebugComponent, DebugConfig } from './debugConfig';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: DebugLevel;
  component: DebugComponent;
  message: string;
  data?: any;
  stackTrace?: string;
  performanceData?: {
    executionTime?: number;
    memoryUsage?: number;
    operationId?: string;
  };
}

export interface PerformanceTrace {
  id: string;
  component: DebugComponent;
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: any;
}

export class DebugLogger {
  private static instance: DebugLogger;
  private logs: LogEntry[] = [];
  private performanceTraces = new Map<string, PerformanceTrace>();
  private config: DebugConfig;
  private logCounter = 0;

  private constructor() {
    this.config = debugConfig.getConfig();
    
    // Listen for configuration changes
    debugConfig.addListener((newConfig) => {
      this.config = newConfig;
    });

    // Clean up old logs periodically
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanupLogs(), 60000); // Every minute
    }
  }

  static getInstance(): DebugLogger {
    if (!DebugLogger.instance) {
      DebugLogger.instance = new DebugLogger();
    }
    return DebugLogger.instance;
  }

  /**
   * Log an error message
   */
  error(component: DebugComponent, message: string, data?: any): void {
    this.log(DebugLevel.ERROR, component, message, data, true);
  }

  /**
   * Log a warning message
   */
  warn(component: DebugComponent, message: string, data?: any): void {
    this.log(DebugLevel.WARN, component, message, data);
  }

  /**
   * Log an info message
   */
  info(component: DebugComponent, message: string, data?: any): void {
    this.log(DebugLevel.INFO, component, message, data);
  }

  /**
   * Log a debug message
   */
  debug(component: DebugComponent, message: string, data?: any): void {
    this.log(DebugLevel.DEBUG, component, message, data);
  }

  /**
   * Log a trace message
   */
  trace(component: DebugComponent, message: string, data?: any): void {
    this.log(DebugLevel.TRACE, component, message, data, true);
  }

  /**
   * Core logging method
   */
  private log(level: DebugLevel, component: DebugComponent, message: string, data?: any, includeStack = false): void {
    // Check if logging is enabled for this component and level
    if (!debugConfig.isEnabled(component, level)) {
      return;
    }

    const entry: LogEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      level,
      component,
      message,
      data: data ? this.sanitizeData(data) : undefined
    };

    // Add stack trace if requested or configured
    if ((includeStack || this.config.includeStackTrace) && level <= DebugLevel.WARN) {
      entry.stackTrace = this.captureStackTrace();
    }

    // Add performance data if available
    if (this.config.performanceTracing) {
      entry.performanceData = this.getPerformanceData();
    }

    // Store log entry
    this.logs.push(entry);

    // Output to configured destinations
    if (this.config.logToConsole) {
      this.outputToConsole(entry);
    }

    if (this.config.logToStorage) {
      this.outputToStorage(entry);
    }

    // Trigger log size cleanup if needed
    if (this.logs.length > this.config.maxLogSize) {
      this.cleanupLogs();
    }
  }

  /**
   * Start performance tracing for an operation
   */
  startTrace(component: DebugComponent, operation: string, metadata?: any): string {
    if (!this.config.performanceTracing || !debugConfig.isEnabled(component, DebugLevel.DEBUG)) {
      return '';
    }

    const traceId = this.generateTraceId();
    const trace: PerformanceTrace = {
      id: traceId,
      component,
      operation,
      startTime: performance.now(),
      metadata
    };

    this.performanceTraces.set(traceId, trace);
    
    this.debug(component, `Started trace: ${operation}`, { traceId, metadata });
    
    return traceId;
  }

  /**
   * End performance tracing for an operation
   */
  endTrace(traceId: string, additionalData?: any): void {
    if (!traceId || !this.performanceTraces.has(traceId)) {
      return;
    }

    const trace = this.performanceTraces.get(traceId)!;
    trace.endTime = performance.now();
    trace.duration = trace.endTime - trace.startTime;

    this.debug(trace.component, `Completed trace: ${trace.operation}`, {
      traceId,
      duration: trace.duration,
      metadata: trace.metadata,
      additionalData
    });

    // Clean up completed trace
    this.performanceTraces.delete(traceId);
  }

  /**
   * Log command execution details
   */
  logCommandExecution(component: DebugComponent, command: string, args: string[], result: any, executionTime?: number): void {
    const data = {
      command,
      args,
      result: this.sanitizeData(result),
      executionTime
    };

    if (result.exitCode === 0) {
      this.debug(component, `Command executed successfully: ${command}`, data);
    } else {
      this.warn(component, `Command failed: ${command} (exit code: ${result.exitCode})`, data);
    }
  }

  /**
   * Log security events
   */
  logSecurityEvent(event: string, details: any, level: DebugLevel = DebugLevel.WARN): void {
    this.log(level, DebugComponent.SECURITY, `Security event: ${event}`, details, true);
  }

  /**
   * Log file system operations
   */
  logFileSystemOperation(operation: string, path: string, result: any): void {
    const data = {
      operation,
      path,
      result: this.sanitizeData(result)
    };

    if (result.success !== false && result.exitCode !== 1) {
      this.debug(DebugComponent.FILE_SYSTEM, `File system operation: ${operation}`, data);
    } else {
      this.warn(DebugComponent.FILE_SYSTEM, `File system operation failed: ${operation}`, data);
    }
  }

  /**
   * Get all log entries
   */
  getLogs(filter?: {
    level?: DebugLevel;
    component?: DebugComponent;
    since?: string;
    limit?: number;
  }): LogEntry[] {
    let filteredLogs = [...this.logs];

    if (filter) {
      if (filter.level !== undefined) {
        filteredLogs = filteredLogs.filter(log => log.level <= filter.level!);
      }

      if (filter.component) {
        filteredLogs = filteredLogs.filter(log => log.component === filter.component);
      }

      if (filter.since) {
        const sinceDate = new Date(filter.since);
        filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= sinceDate);
      }

      if (filter.limit) {
        filteredLogs = filteredLogs.slice(-filter.limit);
      }
    }

    return filteredLogs;
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
    this.performanceTraces.clear();
    
    if (this.config.logToStorage && typeof localStorage !== 'undefined') {
      localStorage.removeItem('rust-terminal-forge-debug-logs');
    }
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    activeTraces: number;
    completedTraces: number;
    averageLogSize: number;
    memoryUsage: string;
  } {
    return {
      activeTraces: this.performanceTraces.size,
      completedTraces: this.logCounter,
      averageLogSize: this.logs.length > 0 ? Math.round(JSON.stringify(this.logs).length / this.logs.length) : 0,
      memoryUsage: this.getMemoryUsage()
    };
  }

  /**
   * Generate unique log ID
   */
  private generateLogId(): string {
    return `log_${Date.now()}_${++this.logCounter}`;
  }

  /**
   * Generate unique trace ID
   */
  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  /**
   * Sanitize data for logging (remove sensitive information)
   */
  private sanitizeData(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    if (typeof data === 'string') {
      // Remove potential sensitive patterns
      return data.replace(/(password|token|key|secret)[\s:=]+[\w\-\.]+/gi, '$1=***REDACTED***');
    }

    if (typeof data === 'object') {
      if (data instanceof Error) {
        return {
          name: data.name,
          message: data.message,
          stack: data.stack
        };
      }

      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes('password') || lowerKey.includes('token') || lowerKey.includes('key') || lowerKey.includes('secret')) {
          sanitized[key] = '***REDACTED***';
        } else {
          sanitized[key] = typeof value === 'object' ? this.sanitizeData(value) : value;
        }
      }
      return sanitized;
    }

    return data;
  }

  /**
   * Capture stack trace
   */
  private captureStackTrace(): string {
    const stack = new Error().stack || '';
    // Remove this function and the log function from the stack trace
    return stack.split('\n').slice(3).join('\n');
  }

  /**
   * Get current performance data
   */
  private getPerformanceData(): any {
    const data: any = {};

    if (typeof performance !== 'undefined' && performance.now) {
      data.timestamp = performance.now();
    }

    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      data.memoryUsage = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      };
    }

    return data;
  }

  /**
   * Output log entry to console
   */
  private outputToConsole(entry: LogEntry): void {
    const levelNames = ['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'];
    const levelColors = [
      '\x1b[31m', // RED
      '\x1b[33m', // YELLOW
      '\x1b[36m', // CYAN
      '\x1b[37m', // WHITE
      '\x1b[90m'  // GRAY
    ];

    if (this.config.outputFormat === 'json') {
      console.log(JSON.stringify(entry, null, 2));
      return;
    }

    const timestamp = this.config.includeTimestamp ? `[${entry.timestamp}] ` : '';
    const level = `[${levelNames[entry.level]}]`;
    const component = `[${entry.component.toUpperCase()}]`;
    const color = levelColors[entry.level] || '';
    const reset = '\x1b[0m';

    let message = `${timestamp}${color}${level}${reset} ${component} ${entry.message}`;

    if (entry.data) {
      message += `\n  Data: ${JSON.stringify(entry.data, null, 2)}`;
    }

    if (entry.performanceData) {
      message += `\n  Performance: ${JSON.stringify(entry.performanceData, null, 2)}`;
    }

    if (entry.stackTrace) {
      message += `\n  Stack Trace:\n${entry.stackTrace}`;
    }

    // Use appropriate console method based on level
    switch (entry.level) {
      case DebugLevel.ERROR:
        console.error(message);
        break;
      case DebugLevel.WARN:
        console.warn(message);
        break;
      case DebugLevel.INFO:
        console.info(message);
        break;
      default:
        console.log(message);
        break;
    }
  }

  /**
   * Output log entry to storage
   */
  private outputToStorage(entry: LogEntry): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      const existingLogs = localStorage.getItem('rust-terminal-forge-debug-logs');
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      logs.push(entry);

      // Keep only the most recent logs to prevent storage overflow
      const maxStoredLogs = 500;
      if (logs.length > maxStoredLogs) {
        logs.splice(0, logs.length - maxStoredLogs);
      }

      localStorage.setItem('rust-terminal-forge-debug-logs', JSON.stringify(logs));
    } catch (error) {
      console.warn('Failed to store log entry:', error);
    }
  }

  /**
   * Clean up old logs
   */
  private cleanupLogs(): void {
    // Remove logs older than 1 hour or keep only the most recent ones
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const maxLogs = this.config.maxLogSize;

    this.logs = this.logs.filter(log => new Date(log.timestamp) > oneHourAgo);

    if (this.logs.length > maxLogs) {
      this.logs = this.logs.slice(-maxLogs);
    }

    // Clean up old performance traces (should not accumulate)
    const fiveMinutesAgo = performance.now() - 5 * 60 * 1000;
    for (const [id, trace] of this.performanceTraces.entries()) {
      if (trace.startTime < fiveMinutesAgo) {
        this.performanceTraces.delete(id);
      }
    }
  }

  /**
   * Get memory usage information
   */
  private getMemoryUsage(): string {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      const used = Math.round(memory.usedJSHeapSize / 1024 / 1024 * 100) / 100;
      const total = Math.round(memory.totalJSHeapSize / 1024 / 1024 * 100) / 100;
      return `${used}MB / ${total}MB`;
    }
    return 'Unknown';
  }
}

// Export singleton instance
export const debugLogger = DebugLogger.getInstance();

// Convenience functions for common use cases
export const logError = (component: DebugComponent, message: string, data?: any) => debugLogger.error(component, message, data);
export const logWarn = (component: DebugComponent, message: string, data?: any) => debugLogger.warn(component, message, data);
export const logInfo = (component: DebugComponent, message: string, data?: any) => debugLogger.info(component, message, data);
export const logDebug = (component: DebugComponent, message: string, data?: any) => debugLogger.debug(component, message, data);
export const logTrace = (component: DebugComponent, message: string, data?: any) => debugLogger.trace(component, message, data);