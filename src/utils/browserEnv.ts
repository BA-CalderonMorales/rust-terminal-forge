/**
 * Browser-safe environment utilities
 * Provides safe alternatives to Node.js process globals in browser context
 */

export interface BrowserEnvironment {
  NODE_ENV: string;
  [key: string]: string;
}

export interface BrowserProcess {
  env: BrowserEnvironment;
  cwd: () => string;
  platform: string;
}

/**
 * Safe environment detection utility
 */
export const getEnvironment = (): string => {
  if (typeof window !== 'undefined') {
    return 'browser';
  }
  
  // In Node.js environment
  return (globalThis as any).process?.env?.NODE_ENV || 'development';
};

/**
 * Browser-safe process substitute
 * Provides safe defaults when process is not available
 */
export const getBrowserProcess = (): BrowserProcess => {
  // If we're in a Node.js environment, use the real process
  if (typeof window === 'undefined' && typeof (globalThis as any).process !== 'undefined') {
    return (globalThis as any).process;
  }

  // Browser environment - provide safe defaults
  return {
    env: {
      NODE_ENV: 'production',
      BROWSER: 'true',
      PWD: '/',
      HOME: '/',
      USER: 'user',
      SHELL: '/bin/bash',
      TERM: 'xterm-256color',
      PATH: '/usr/local/bin:/usr/bin:/bin'
    },
    cwd: () => '/',
    platform: 'browser'
  };
};

/**
 * Safe environment variable access
 */
export const safeEnvAccess = (key: string, fallback: string = ''): string => {
  try {
    if (typeof window !== 'undefined') {
      // Browser environment - return safe defaults
      const browserDefaults: Record<string, string> = {
        NODE_ENV: 'production',
        HOME: '/',
        PWD: '/',
        USER: 'user',
        SHELL: '/bin/bash',
        TERM: 'xterm-256color'
      };
      return browserDefaults[key] || fallback;
    }
    
    // Node.js environment
    return (globalThis as any).process?.env?.[key] || fallback;
  } catch (error) {
    console.warn(`Failed to access environment variable ${key}:`, error);
    return fallback;
  }
};

/**
 * Safe current working directory access
 */
export const safeCwd = (): string => {
  try {
    if (typeof window !== 'undefined') {
      return '/'; // Browser default
    }
    
    // Node.js environment
    return (globalThis as any).process?.cwd?.() || '/';
  } catch (error) {
    console.warn('Failed to access current working directory:', error);
    return '/';
  }
};