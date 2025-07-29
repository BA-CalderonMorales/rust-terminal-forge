// Real-time security monitoring system
import { SecurityUtils } from './securityUtils';

export interface SecurityEvent {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  sessionId: string;
  timestamp: number;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export class SecurityMonitor {
  private static events: SecurityEvent[] = [];
  private static readonly MAX_EVENTS = 1000;
  private static readonly ALERT_THRESHOLDS = {
    failed_logins: 5,
    rate_limit_violations: 10,
    suspicious_commands: 3,
    invalid_api_keys: 3
  };
  
  private static sessionActivity: Map<string, number[]> = new Map();

  /**
   * Log a security event
   */
  static logEvent(
    type: string,
    severity: SecurityEvent['severity'],
    sessionId: string,
    details: Record<string, unknown>
  ): void {
    const event: SecurityEvent = {
      type,
      severity,
      sessionId,
      timestamp: Date.now(),
      details,
      ipAddress: this.getClientIP(),
      userAgent: this.getUserAgent()
    };

    this.events.push(event);
    
    // Keep only recent events
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }

    // Check for alert conditions
    this.checkAlertConditions(type, sessionId);

    // Log to console for development
    if (severity === 'high' || severity === 'critical') {
      console.warn(`Security Alert [${severity.toUpperCase()}]:`, event);
    }
  }

  /**
   * Get recent security events
   */
  static getRecentEvents(minutes: number = 60): SecurityEvent[] {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.events.filter(event => event.timestamp > cutoff);
  }

  /**
   * Get events for a specific session
   */
  static getSessionEvents(sessionId: string, minutes: number = 60): SecurityEvent[] {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.events.filter(event => 
      event.sessionId === sessionId && event.timestamp > cutoff
    );
  }

  /**
   * Check if a session shows suspicious activity
   */
  static isSuspiciousSession(sessionId: string): boolean {
    const recentEvents = this.getSessionEvents(sessionId, 30);
    
    // Count different types of suspicious events
    const suspiciousTypes = recentEvents.filter(event => 
      event.severity === 'high' || event.severity === 'critical'
    );

    return suspiciousTypes.length >= 3;
  }

  /**
   * Get security dashboard data
   */
  static getDashboardData(): {
    totalEvents: number;
    recentEvents: number;
    criticalEvents: number;
    suspiciousSessions: number;
    topEvents: Array<{ type: string; count: number }>;
  } {
    const recent = this.getRecentEvents(60);
    const critical = recent.filter(e => e.severity === 'critical');
    
    // Count event types
    const eventCounts = new Map<string, number>();
    recent.forEach(event => {
      eventCounts.set(event.type, (eventCounts.get(event.type) || 0) + 1);
    });

    const topEvents = Array.from(eventCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Count suspicious sessions
    const sessions = new Set(recent.map(e => e.sessionId));
    const suspiciousSessions = Array.from(sessions).filter(sessionId => 
      this.isSuspiciousSession(sessionId)
    ).length;

    return {
      totalEvents: this.events.length,
      recentEvents: recent.length,
      criticalEvents: critical.length,
      suspiciousSessions,
      topEvents
    };
  }

  /**
   * Check for alert conditions
   */
  private static checkAlertConditions(eventType: string, sessionId: string): void {
    const recentEvents = this.getSessionEvents(sessionId, 60);
    const typeCount = recentEvents.filter(e => e.type === eventType).length;

    // Check thresholds
    if (this.ALERT_THRESHOLDS[eventType as keyof typeof this.ALERT_THRESHOLDS]) {
      const threshold = this.ALERT_THRESHOLDS[eventType as keyof typeof this.ALERT_THRESHOLDS];
      
      if (typeCount >= threshold) {
        this.triggerAlert(eventType, sessionId, typeCount, threshold);
      }
    }
  }

  /**
   * Trigger security alert
   */
  private static triggerAlert(
    eventType: string,
    sessionId: string,
    count: number,
    threshold: number
  ): void {
    console.error(`🚨 SECURITY ALERT: ${eventType} threshold exceeded`, {
      sessionId,
      count,
      threshold,
      timestamp: new Date().toISOString()
    });

    // In a real implementation, this would:
    // - Send notifications to administrators
    // - Block the session if necessary
    // - Update firewall rules
    // - Log to external security systems
  }

  /**
   * Get client IP (browser environment simulation)
   */
  private static getClientIP(): string | undefined {
    // In a real browser environment, this would be handled by the backend
    return 'client-ip-placeholder';
  }

  /**
   * Get user agent
   */
  private static getUserAgent(): string | undefined {
    if (typeof navigator !== 'undefined') {
      return navigator.userAgent;
    }
    return 'server-environment';
  }

  /**
   * Export security report
   */
  static generateSecurityReport(): {
    summary: ReturnType<typeof SecurityMonitor.getDashboardData>;
    recentEvents: SecurityEvent[];
    suspiciousSessions: Array<{
      sessionId: string;
      eventCount: number;
      lastActivity: number;
    }>;
  } {
    const summary = this.getDashboardData();
    const recentEvents = this.getRecentEvents(60);
    
    // Identify suspicious sessions
    const sessionMap = new Map<string, SecurityEvent[]>();
    recentEvents.forEach(event => {
      if (!sessionMap.has(event.sessionId)) {
        sessionMap.set(event.sessionId, []);
      }
      sessionMap.get(event.sessionId)!.push(event);
    });

    const suspiciousSessions = Array.from(sessionMap.entries())
      .filter(([sessionId]) => this.isSuspiciousSession(sessionId))
      .map(([sessionId, events]) => ({
        sessionId,
        eventCount: events.length,
        lastActivity: Math.max(...events.map(e => e.timestamp))
      }))
      .sort((a, b) => b.lastActivity - a.lastActivity);

    return {
      summary,
      recentEvents: recentEvents.slice(-50), // Last 50 events
      suspiciousSessions
    };
  }
}
