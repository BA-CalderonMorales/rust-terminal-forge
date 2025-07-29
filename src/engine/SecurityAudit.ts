/**
 * 🔒 Security Audit Engine - Rick's Paranoid Security System
 * Zero tolerance for console warnings, bulletproof CSP, and vulnerability scanning
 */

export interface SecurityAuditResult {
  passed: boolean;
  issues: SecurityIssue[];
  score: number;
  timestamp: number;
}

export interface SecurityIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'console' | 'csp' | 'vulnerability' | 'xss' | 'injection';
  description: string;
  location?: string;
  fix?: string;
}

export interface CSPPolicy {
  'default-src': string[];
  'script-src': string[];
  'style-src': string[];
  'img-src': string[];
  'connect-src': string[];
  'font-src': string[];
  'media-src': string[];
  'object-src': string[];
  'frame-src': string[];
}

/**
 * Security Audit Engine - Rick's Zero-Tolerance Security Scanner
 */
export class SecurityAudit {
  private issues: SecurityIssue[] = [];
  private consoleMonitor: ConsoleMonitor;
  private vulnerabilityScanner: VulnerabilityScanner;
  private xssProtection: XSSProtection;

  constructor() {
    this.consoleMonitor = new ConsoleMonitor();
    this.vulnerabilityScanner = new VulnerabilityScanner();
    this.xssProtection = new XSSProtection();
  }

  /**
   * Run comprehensive security audit
   */
  async runSecurityAudit(): Promise<SecurityAuditResult> {
    this.issues = [];

    // Run all security checks
    await Promise.all([
      this.auditConsole(),
      this.auditCSP(),
      this.auditVulnerabilities(),
      this.auditXSSProtection(),
      this.auditInjectionPrevention(),
      this.auditPermissions(),
      this.auditDataLeakage()
    ]);

    // Calculate security score
    const score = this.calculateSecurityScore();

    return {
      passed: this.issues.filter(issue => issue.severity === 'critical' || issue.severity === 'high').length === 0,
      issues: this.issues,
      score,
      timestamp: Date.now()
    };
  }

  /**
   * Audit console for warnings and errors
   */
  private async auditConsole(): Promise<void> {
    const consoleIssues = await this.consoleMonitor.getConsoleIssues();
    
    consoleIssues.forEach(issue => {
      this.issues.push({
        severity: issue.level === 'error' ? 'critical' : 'medium',
        category: 'console',
        description: `Console ${issue.level}: ${issue.message}`,
        location: issue.source,
        fix: this.getConsoleIssueFix(issue.message)
      });
    });

    // Rick's zero tolerance policy
    if (consoleIssues.length > 0) {
      this.issues.push({
        severity: 'high',
        category: 'console',
        description: `Rick demands zero console output. Found ${consoleIssues.length} issues.`,
        fix: 'Eliminate all console warnings and errors'
      });
    }
  }

  /**
   * Audit Content Security Policy
   */
  private async auditCSP(): Promise<void> {
    const currentCSP = this.getCurrentCSP();
    const recommendedCSP = this.getRecommendedCSP();

    // Check if CSP is properly configured
    if (!currentCSP) {
      this.issues.push({
        severity: 'critical',
        category: 'csp',
        description: 'No Content Security Policy detected',
        fix: 'Implement strict CSP headers'
      });
      return;
    }

    // Validate CSP directives
    this.validateCSPDirectives(currentCSP, recommendedCSP);
  }

  /**
   * Audit for known vulnerabilities
   */
  private async auditVulnerabilities(): Promise<void> {
    const vulnerabilities = await this.vulnerabilityScanner.scanDependencies();
    
    vulnerabilities.forEach(vuln => {
      this.issues.push({
        severity: vuln.severity,
        category: 'vulnerability',
        description: `${vuln.package}: ${vuln.title}`,
        location: vuln.package,
        fix: `Update ${vuln.package} to ${vuln.fixVersion || 'latest'}`
      });
    });
  }

  /**
   * Audit XSS protection mechanisms
   */
  private async auditXSSProtection(): Promise<void> {
    const xssIssues = await this.xssProtection.scanForXSSVulnerabilities();
    
    xssIssues.forEach(issue => {
      this.issues.push({
        severity: 'critical',
        category: 'xss',
        description: issue.description,
        location: issue.location,
        fix: issue.fix
      });
    });

    // Check LLM output sanitization
    if (!this.xssProtection.isLLMOutputSanitized()) {
      this.issues.push({
        severity: 'high',
        category: 'xss',
        description: 'LLM outputs not properly sanitized',
        fix: 'Implement DOMPurify for all LLM content'
      });
    }
  }

  /**
   * Audit injection prevention
   */
  private async auditInjectionPrevention(): Promise<void> {
    // Check for code injection vulnerabilities
    const injectionPoints = this.findInjectionPoints();
    
    injectionPoints.forEach(point => {
      this.issues.push({
        severity: 'high',
        category: 'injection',
        description: `Potential injection point: ${point.type}`,
        location: point.location,
        fix: point.fix
      });
    });
  }

  /**
   * Audit browser permissions
   */
  private async auditPermissions(): Promise<void> {
    const permissions = await this.getRequestedPermissions();
    const unnecessary = this.findUnnecessaryPermissions(permissions);
    
    unnecessary.forEach(perm => {
      this.issues.push({
        severity: 'medium',
        category: 'vulnerability',
        description: `Unnecessary permission requested: ${perm}`,
        fix: `Remove ${perm} permission request`
      });
    });
  }

  /**
   * Audit for data leakage
   */
  private async auditDataLeakage(): Promise<void> {
    // Check for sensitive data in console logs
    const sensitivePatterns = [
      /api[_-]?key/i,
      /secret/i,
      /password/i,
      /token/i,
      /bearer/i,
      /auth/i
    ];

    const consoleMessages = await this.consoleMonitor.getAllMessages();
    
    consoleMessages.forEach(message => {
      sensitivePatterns.forEach(pattern => {
        if (pattern.test(message.content)) {
          this.issues.push({
            severity: 'critical',
            category: 'vulnerability',
            description: 'Potential sensitive data in console logs',
            location: message.source,
            fix: 'Remove sensitive data from console output'
          });
        }
      });
    });
  }

  /**
   * Get recommended CSP for the application
   */
  private getRecommendedCSP(): CSPPolicy {
    return {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'"], // Minimize unsafe-inline
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'blob:'],
      'connect-src': ["'self'", 'ws:', 'wss:'],
      'font-src': ["'self'", 'data:'],
      'media-src': ["'none'"],
      'object-src': ["'none'"],
      'frame-src': ["'none'"]
    };
  }

  /**
   * Validate CSP directives against recommendations
   */
  private validateCSPDirectives(current: CSPPolicy, recommended: CSPPolicy): void {
    Object.keys(recommended).forEach(directive => {
      const currentValue = current[directive as keyof CSPPolicy] || [];
      const recommendedValue = recommended[directive as keyof CSPPolicy];

      // Check for unsafe directives
      if (currentValue.includes("'unsafe-eval'")) {
        this.issues.push({
          severity: 'high',
          category: 'csp',
          description: `Unsafe CSP directive: ${directive} contains 'unsafe-eval'`,
          fix: `Remove 'unsafe-eval' from ${directive}`
        });
      }

      // Check for overly permissive directives
      if (currentValue.includes('*')) {
        this.issues.push({
          severity: 'medium',
          category: 'csp',
          description: `Overly permissive CSP: ${directive} allows '*'`,
          fix: `Restrict ${directive} to specific domains`
        });
      }
    });
  }

  /**
   * Find potential injection points
   */
  private findInjectionPoints(): Array<{type: string; location: string; fix: string}> {
    const injectionPoints = [];

    // Check for innerHTML usage (potential XSS)
    if (this.hasInnerHTMLUsage()) {
      injectionPoints.push({
        type: 'innerHTML usage',
        location: 'React components',
        fix: 'Use textContent or sanitize with DOMPurify'
      });
    }

    // Check for eval() usage
    if (this.hasEvalUsage()) {
      injectionPoints.push({
        type: 'eval() usage',
        location: 'JavaScript code',
        fix: 'Remove eval() and use safer alternatives'
      });
    }

    // Check for dangerouslySetInnerHTML
    if (this.hasDangerouslySetInnerHTML()) {
      injectionPoints.push({
        type: 'dangerouslySetInnerHTML',
        location: 'React components',
        fix: 'Sanitize content with DOMPurify before rendering'
      });
    }

    return injectionPoints;
  }

  /**
   * Get console issue fix recommendations
   */
  private getConsoleIssueFix(message: string): string {
    if (message.includes('Warning: Each child in a list should have a unique "key" prop')) {
      return 'Add unique key props to React list items';
    }
    if (message.includes('Warning: Failed prop type')) {
      return 'Fix PropType validation errors';
    }
    if (message.includes('404')) {
      return 'Fix broken resource URLs';
    }
    if (message.includes('CORS')) {
      return 'Configure proper CORS headers';
    }
    return 'Investigate and fix console issue';
  }

  /**
   * Calculate overall security score (0-100)
   */
  private calculateSecurityScore(): number {
    const weights = {
      critical: 25,
      high: 10,
      medium: 5,
      low: 1
    };

    const totalPenalty = this.issues.reduce((total, issue) => {
      return total + weights[issue.severity];
    }, 0);

    return Math.max(0, 100 - totalPenalty);
  }

  // Helper methods (simplified implementations)
  private getCurrentCSP(): CSPPolicy | null {
    const metaCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (!metaCSP) return null;
    
    // Parse CSP from meta tag (simplified)
    return this.parseCSP(metaCSP.getAttribute('content') || '');
  }

  private parseCSP(cspString: string): CSPPolicy {
    // Simplified CSP parsing
    const policy: CSPPolicy = {
      'default-src': [],
      'script-src': [],
      'style-src': [],
      'img-src': [],
      'connect-src': [],
      'font-src': [],
      'media-src': [],
      'object-src': [],
      'frame-src': []
    };

    const directives = cspString.split(';');
    directives.forEach(directive => {
      const [key, ...values] = directive.trim().split(' ');
      if (key in policy) {
        policy[key as keyof CSPPolicy] = values;
      }
    });

    return policy;
  }

  private async getRequestedPermissions(): Promise<string[]> {
    // Check for requested browser permissions
    const permissions: string[] = [];
    
    if ('permissions' in navigator) {
      // Common permissions to check
      const permissionNames = ['camera', 'microphone', 'geolocation', 'notifications'];
      
      for (const name of permissionNames) {
        try {
          const result = await navigator.permissions.query({ name: name as any });
          if (result.state !== 'denied') {
            permissions.push(name);
          }
        } catch (error) {
          // Permission not supported
        }
      }
    }
    
    return permissions;
  }

  private findUnnecessaryPermissions(permissions: string[]): string[] {
    // For a terminal app, most permissions are unnecessary
    const necessary = ['notifications']; // Only notifications might be useful
    return permissions.filter(perm => !necessary.includes(perm));
  }

  private hasInnerHTMLUsage(): boolean {
    // Check if codebase uses innerHTML (simplified check)
    return document.body.innerHTML.includes('innerHTML') ||
           document.scripts.toString().includes('innerHTML');
  }

  private hasEvalUsage(): boolean {
    // Check for eval usage (simplified)
    return document.scripts.toString().includes('eval(');
  }

  private hasDangerouslySetInnerHTML(): boolean {
    // Check for React dangerouslySetInnerHTML usage
    return document.body.innerHTML.includes('dangerouslySetInnerHTML');
  }
}

/**
 * Console Monitor - Tracks all console output
 */
class ConsoleMonitor {
  private messages: Array<{level: string; message: string; source?: string; timestamp: number}> = [];

  constructor() {
    this.initializeConsoleInterception();
  }

  private initializeConsoleInterception(): void {
    const originalConsole = { ...console };

    ['log', 'warn', 'error', 'info'].forEach(level => {
      const originalMethod = (console as any)[level];
      (console as any)[level] = (...args: any[]) => {
        this.messages.push({
          level,
          message: args.join(' '),
          source: this.getStackTrace(),
          timestamp: Date.now()
        });
        
        // Call original console method
        originalMethod?.apply(console, args);
      };
    });
  }

  async getConsoleIssues(): Promise<Array<{level: string; message: string; source?: string}>> {
    return this.messages.filter(msg => 
      msg.level === 'warn' || msg.level === 'error'
    );
  }

  async getAllMessages(): Promise<Array<{content: string; source?: string}>> {
    return this.messages.map(msg => ({
      content: msg.message,
      source: msg.source
    }));
  }

  private getStackTrace(): string {
    const stack = new Error().stack;
    return stack ? stack.split('\n')[3] || 'unknown' : 'unknown';
  }
}

/**
 * Vulnerability Scanner - Checks dependencies
 */
class VulnerabilityScanner {
  async scanDependencies(): Promise<Array<{
    package: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    fixVersion?: string;
  }>> {
    // In a real implementation, this would call npm audit or similar
    // For now, return empty array
    return [];
  }
}

/**
 * XSS Protection - Prevents cross-site scripting
 */
class XSSProtection {
  async scanForXSSVulnerabilities(): Promise<Array<{
    description: string;
    location: string;
    fix: string;
  }>> {
    const vulnerabilities = [];

    // Check for potential XSS in React components
    if (this.hasUnsafeHTML()) {
      vulnerabilities.push({
        description: 'Unsafe HTML rendering detected',
        location: 'React components',
        fix: 'Use DOMPurify to sanitize HTML content'
      });
    }

    return vulnerabilities;
  }

  isLLMOutputSanitized(): boolean {
    // Check if LLM outputs are properly sanitized
    // This is a simplified check
    return !document.body.innerHTML.includes('dangerouslySetInnerHTML');
  }

  private hasUnsafeHTML(): boolean {
    // Check for potential unsafe HTML rendering
    return document.querySelectorAll('[data-unsafe-html]').length > 0;
  }
}

/**
 * React Hook for Security Audit Integration
 */
export function useSecurityAudit() {
  const securityAudit = new SecurityAudit();

  const runAudit = async () => {
    return await securityAudit.runSecurityAudit();
  };

  return {
    runAudit,
    SecurityAudit
  };
}