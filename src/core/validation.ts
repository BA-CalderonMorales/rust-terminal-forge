
import { z } from 'zod'

// Input validation schemas for security
export const ValidationSchemas = {
  // User input validation
  username: z.string()
    .min(1, 'Username is required')
    .max(50, 'Username too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username contains invalid characters'),

  // Command validation (enhanced security)
  command: z.string()
    .min(1, 'Command cannot be empty')
    .max(500, 'Command too long')
    .regex(/^[a-zA-Z0-9\s\-_.~:"'=@/]+$/, 'Command contains forbidden characters')
    .refine(cmd => !cmd.includes('rm -rf'), 'Dangerous command not allowed')
    .refine(cmd => !cmd.includes('sudo'), 'Sudo commands not allowed')
    .refine(cmd => !cmd.includes('..'), 'Path traversal not allowed')
    .refine(cmd => !/(&&|\|\||;|`|\$\()/g.test(cmd), 'Command chaining not allowed'),

  // Path validation
  path: z.string()
    .max(500, 'Path too long')
    .refine(path => !path.includes('..'), 'Path traversal not allowed')
    .refine(path => !path.includes('<'), 'Invalid characters in path')
    .refine(path => !path.includes('>'), 'Invalid characters in path'),

  // Session name validation
  sessionName: z.string()
    .min(1, 'Session name required')
    .max(100, 'Session name too long')
    .regex(/^[a-zA-Z0-9\s_-]+$/, 'Session name contains invalid characters'),

  // File name validation
  fileName: z.string()
    .min(1, 'File name required')
    .max(255, 'File name too long')
    .regex(/^[a-zA-Z0-9._-]+$/, 'File name contains invalid characters')
    .refine(name => !name.startsWith('.'), 'File name cannot start with dot')
}

export class InputValidator {
  /**
   * Validate and sanitize user input
   */
  static validateUsername(input: string): { isValid: boolean; value?: string; error?: string } {
    const result = ValidationSchemas.username.safeParse(input.trim())
    return {
      isValid: result.success,
      value: result.success ? result.data : undefined,
      error: result.success ? undefined : result.error.errors[0].message
    }
  }

  static validateCommand(input: string): { isValid: boolean; value?: string; error?: string } {
    const result = ValidationSchemas.command.safeParse(input.trim())
    return {
      isValid: result.success,
      value: result.success ? result.data : undefined,
      error: result.success ? undefined : result.error.errors[0].message
    }
  }

  static validatePath(input: string): { isValid: boolean; value?: string; error?: string } {
    const result = ValidationSchemas.path.safeParse(input.trim())
    return {
      isValid: result.success,
      value: result.success ? result.data : undefined,
      error: result.success ? undefined : result.error.errors[0].message
    }
  }

  static validateSessionName(input: string): { isValid: boolean; value?: string; error?: string } {
    const result = ValidationSchemas.sessionName.safeParse(input.trim())
    return {
      isValid: result.success,
      value: result.success ? result.data : undefined,
      error: result.success ? undefined : result.error.errors[0].message
    }
  }

  /**
   * Comprehensive input sanitization
   */
  static sanitizeInput(input: string): string {
    return input
      // Normalize unicode to prevent bypasses
      .normalize('NFKC')
      // Remove dangerous characters
      .replace(/[<>'"&\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Remove path traversal attempts
      .replace(/\.\./g, '')
      // Limit length
      .substring(0, 1000)
      .trim()
  }
}
