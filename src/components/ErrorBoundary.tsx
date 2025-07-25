/**
 * React Error Boundary Component
 * Catches JavaScript errors in React component tree and displays fallback UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Store error info in state
    this.setState({ errorInfo });
    
    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleReload = () => {
    // Reset error boundary state
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleFullReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI with terminal theme
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
          color: '#e1e1e1',
          fontFamily: 'ui-monospace, "JetBrains Mono", "Fira Code", monospace',
          padding: '40px 20px',
          textAlign: 'center'
        }}>
          <div style={{
            marginBottom: '24px',
            color: '#ff4757',
            fontSize: '48px'
          }}>
            ⚠️
          </div>
          
          <h2 style={{
            color: '#ff4757',
            marginBottom: '16px',
            fontSize: '24px',
            fontWeight: '600'
          }}>
            Terminal Error
          </h2>
          
          <p style={{
            color: '#888',
            marginBottom: '24px',
            fontSize: '16px',
            maxWidth: '600px',
            lineHeight: '1.5'
          }}>
            Something went wrong with the terminal interface. This is usually caused by a temporary issue.
          </p>

          {this.state.error && (
            <details style={{
              background: 'rgba(255, 71, 87, 0.1)',
              border: '1px solid rgba(255, 71, 87, 0.3)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px',
              maxWidth: '800px',
              width: '100%',
              fontSize: '12px',
              fontFamily: 'monospace'
            }}>
              <summary style={{
                color: '#ff4757',
                cursor: 'pointer',
                marginBottom: '12px',
                fontWeight: '600'
              }}>
                Error Details
              </summary>
              <pre style={{
                color: '#e1e1e1',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                margin: 0,
                fontSize: '11px',
                lineHeight: '1.4'
              }}>
                {this.state.error.name}: {this.state.error.message}
                {this.state.error.stack && (
                  <>
                    {'\n\nStack Trace:\n'}
                    {this.state.error.stack}
                  </>
                )}
                {this.state.errorInfo?.componentStack && (
                  <>
                    {'\n\nComponent Stack:\n'}
                    {this.state.errorInfo.componentStack}
                  </>
                )}
              </pre>
            </details>
          )}
          
          <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            <button
              onClick={this.handleReload}
              style={{
                background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 255, 136, 0.2))',
                border: '2px solid rgba(0, 255, 136, 0.4)',
                color: '#00ff88',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: 'inherit'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 255, 136, 0.2), rgba(0, 255, 136, 0.3))';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 255, 136, 0.2))';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              🔄 Try Again
            </button>
            
            <button
              onClick={this.handleFullReload}
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.2))',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                color: '#e1e1e1',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: 'inherit'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.3))';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.2))';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              🔃 Reload Page
            </button>
          </div>
          
          <p style={{
            color: '#666',
            fontSize: '12px',
            marginTop: '24px',
            fontStyle: 'italic'
          }}>
            If this error persists, try refreshing the page or checking the browser console for more details.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component wrapper for easy usage
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  return (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
};