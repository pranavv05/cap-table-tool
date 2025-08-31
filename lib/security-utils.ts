import crypto from 'crypto'
import { z } from 'zod'

// Encryption utilities
export class DataEncryption {
  private static readonly ALGORITHM = 'aes-256-gcm'
  private static readonly KEY_LENGTH = 32
  private static readonly IV_LENGTH = 16
  private static readonly TAG_LENGTH = 16

  private static getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET
    if (!key) {
      throw new Error('ENCRYPTION_KEY or NEXTAUTH_SECRET must be set')
    }
    return crypto.scryptSync(key, 'salt', DataEncryption.KEY_LENGTH)
  }

  static encrypt(text: string): string {
    try {
      const key = this.getEncryptionKey()
      const iv = crypto.randomBytes(DataEncryption.IV_LENGTH)
      const cipher = crypto.createCipher(DataEncryption.ALGORITHM, key)
      cipher.setAAD(Buffer.from('cap-table-tool', 'utf8'))
      
      let encrypted = cipher.update(text, 'utf8', 'hex')
      encrypted += cipher.final('hex')
      
      const tag = cipher.getAuthTag()
      
      // Combine iv + tag + encrypted
      return iv.toString('hex') + tag.toString('hex') + encrypted
    } catch (error) {
      console.error('Encryption failed:', error)
      throw new Error('Failed to encrypt data')
    }
  }

  static decrypt(encryptedData: string): string {
    try {
      const key = this.getEncryptionKey()
      
      // Extract components
      const iv = Buffer.from(encryptedData.slice(0, DataEncryption.IV_LENGTH * 2), 'hex')
      const tag = Buffer.from(encryptedData.slice(DataEncryption.IV_LENGTH * 2, (DataEncryption.IV_LENGTH + DataEncryption.TAG_LENGTH) * 2), 'hex')
      const encrypted = encryptedData.slice((DataEncryption.IV_LENGTH + DataEncryption.TAG_LENGTH) * 2)
      
      const decipher = crypto.createDecipher(DataEncryption.ALGORITHM, key)
      decipher.setAAD(Buffer.from('cap-table-tool', 'utf8'))
      decipher.setAuthTag(tag)
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      
      return decrypted
    } catch (error) {
      console.error('Decryption failed:', error)
      throw new Error('Failed to decrypt data')
    }
  }

  static hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex')
  }

  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex')
  }
}

// Input sanitization
export class InputSanitizer {
  // XSS prevention
  static sanitizeHTML(input: string): string {
    if (!input) return ''
    
    const htmlEntities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    }
    
    return input.replace(/[&<>"'/]/g, (char) => htmlEntities[char] || char)
  }

  // SQL injection prevention (additional layer)
  static sanitizeSQL(input: string): string {
    if (!input) return ''
    
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
      /(--|\/\*|\*\/|;|'|")/g,
      /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/gi
    ]
    
    let sanitized = input
    sqlPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '')
    })
    
    return sanitized.trim()
  }

  // File name sanitization
  static sanitizeFileName(fileName: string): string {
    if (!fileName) return ''
    
    return fileName
      .replace(/[^\w\s.-]/gi, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/\.+/g, '.') // Remove multiple dots
      .toLowerCase()
      .substring(0, 100) // Limit length
  }

  // Email sanitization
  static sanitizeEmail(email: string): string {
    if (!email) return ''
    
    return email
      .toLowerCase()
      .trim()
      .replace(/[^\w@.-]/g, '') // Only allow alphanumeric, @, ., -
  }

  // Phone number sanitization
  static sanitizePhone(phone: string): string {
    if (!phone) return ''
    
    return phone.replace(/[^\d+()-\s]/g, '').trim()
  }
}

// Advanced validation schemas
export const SecuritySchemas = {
  // Password validation
  password: z.string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/\d/, 'Password must contain number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain special character')
    .refine(val => !val.includes('password'), 'Password cannot contain "password"')
    .refine(val => !val.includes('123456'), 'Password cannot contain common patterns'),

  // Safe file upload
  fileUpload: z.object({
    name: z.string()
      .refine(name => InputSanitizer.sanitizeFileName(name) === name, 'Invalid file name')
      .refine(name => name.length <= 100, 'File name too long'),
    size: z.number()
      .max(10 * 1024 * 1024, 'File size cannot exceed 10MB'),
    type: z.string()
      .refine(type => ['text/csv', 'application/json', 'text/plain'].includes(type), 'Invalid file type')
  }),

  // API request validation
  apiRequest: z.object({
    userAgent: z.string().optional(),
    referer: z.string().url().optional(),
    contentLength: z.number().max(1024 * 1024, 'Request too large').optional()
  }),

  // Sensitive data fields
  socialSecurityNumber: z.string()
    .regex(/^\d{3}-\d{2}-\d{4}$/, 'Invalid SSN format')
    .transform(val => DataEncryption.encrypt(val)),

  taxId: z.string()
    .regex(/^\d{2}-\d{7}$/, 'Invalid Tax ID format')
    .transform(val => DataEncryption.encrypt(val)),

  bankAccount: z.string()
    .min(8).max(17)
    .regex(/^\d+$/, 'Invalid bank account format')
    .transform(val => DataEncryption.encrypt(val))
}

// Security audit logging
export class SecurityAuditLogger {
  static async logEvent(event: {
    type: 'AUTH' | 'DATA_ACCESS' | 'DATA_CHANGE' | 'SECURITY_VIOLATION' | 'EXPORT' | 'IMPORT'
    userId?: string
    companyId?: string
    resource?: string
    action?: string
    details?: any
    ipAddress?: string
    userAgent?: string
    success: boolean
    risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  }) {
    const auditEntry = {
      ...event,
      timestamp: new Date().toISOString(),
      id: DataEncryption.generateSecureToken(16)
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Security Audit:', JSON.stringify(auditEntry, null, 2))
    }

    // In production, send to your audit logging service
    if (process.env.NODE_ENV === 'production') {
      try {
        // Send to external logging service (Sentry, LogRocket, etc.)
        await fetch(process.env.AUDIT_LOG_ENDPOINT || '', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(auditEntry)
        })
      } catch (error) {
        console.error('Failed to send audit log:', error)
      }
    }

    return auditEntry.id
  }

  static async logDataAccess(userId: string, companyId: string, resource: string, success: boolean = true) {
    return this.logEvent({
      type: 'DATA_ACCESS',
      userId,
      companyId,
      resource,
      action: 'READ',
      success,
      risk: 'LOW'
    })
  }

  static async logDataChange(userId: string, companyId: string, resource: string, action: string, details: any) {
    return this.logEvent({
      type: 'DATA_CHANGE',
      userId,
      companyId,
      resource,
      action,
      details,
      success: true,
      risk: action === 'delete' ? 'HIGH' : 'MEDIUM'
    })
  }

  static async logSecurityViolation(type: string, details: any, risk: 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'HIGH') {
    return this.logEvent({
      type: 'SECURITY_VIOLATION',
      action: type,
      details,
      success: false,
      risk
    })
  }
}

// Session security
export class SessionSecurity {
  private static readonly SESSION_TIMEOUT = 8 * 60 * 60 * 1000 // 8 hours
  private static readonly MAX_CONCURRENT_SESSIONS = 3

  static generateSessionToken(): string {
    return DataEncryption.generateSecureToken(64)
  }

  static isSessionValid(sessionStart: Date, lastActivity: Date): boolean {
    const now = new Date()
    const sessionAge = now.getTime() - sessionStart.getTime()
    const inactivityTime = now.getTime() - lastActivity.getTime()

    return sessionAge < this.SESSION_TIMEOUT && inactivityTime < (30 * 60 * 1000) // 30 min inactivity
  }

  static async validateConcurrentSessions(userId: string, currentSessionId: string): Promise<boolean> {
    // In production, check against your session store (Redis, database, etc.)
    // For now, return true (implement based on your session storage)
    return true
  }
}

// Data validation helpers
export const validateAndSanitize = {
  email: (email: string) => {
    const sanitized = InputSanitizer.sanitizeEmail(email)
    const result = z.string().email().safeParse(sanitized)
    return result.success ? sanitized : null
  },

  phone: (phone: string) => {
    const sanitized = InputSanitizer.sanitizePhone(phone)
    const result = z.string().regex(/^[\d+()-\s]{10,}$/).safeParse(sanitized)
    return result.success ? sanitized : null
  },

  name: (name: string) => {
    const sanitized = InputSanitizer.sanitizeHTML(name)
    const result = z.string().min(1).max(100).safeParse(sanitized)
    return result.success ? sanitized : null
  },

  currency: (amount: number) => {
    const result = z.number().min(0).max(1e12).safeParse(amount)
    return result.success ? Math.round(amount * 100) / 100 : null // Round to 2 decimals
  }
}

export default {
  DataEncryption,
  InputSanitizer,
  SecuritySchemas,
  SecurityAuditLogger,
  SessionSecurity,
  validateAndSanitize
}