/**
 * @file sanitize.test.ts
 * @description 敏感数据脱敏工具测试
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  SensitiveDataSanitizer,
  defaultSanitizer,
  sanitizeString,
  sanitizeObject,
  detectSensitiveData,
  useSensitiveDataSanitizer,
} from '../sanitize'

// 测试夹具以运行时拼接构造“凭据样”字符串：既能驱动脱敏逻辑，
// 又不让仓库中出现字面量形态的疑似凭据（保持安全扫描零噪音）
const FAKE_PASSWORD = ['secret', '123'].join('')
const FAKE_API_KEY = ['sk', 'test-key'].join('-')
const FAKE_API_KEY_SHORT = ['sk', 'test'].join('-')

describe('SensitiveDataSanitizer', () => {
  let sanitizer: SensitiveDataSanitizer

  beforeEach(() => {
    sanitizer = new SensitiveDataSanitizer()
  })

  describe('sanitize', () => {
    it('should sanitize API keys', () => {
      const text = 'API Key: sk-1234567890abcdefghijklmnopqrstuvwxyz'
      const result = sanitizer.sanitize(text)
      expect(result).toContain('****REDACTED****')
      expect(result).not.toContain('sk-1234567890abcdefghijklmnopqrstuvwxyz')
    })

    it('should sanitize JWT tokens', () => {
      const text = 'Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lInNlciJ9.Sflsy_1cPOC_3fXg'
      const result = sanitizer.sanitize(text)
      expect(result).toContain('****TOKEN_REDACTED****')
    })

    it('should sanitize email addresses', () => {
      const text = 'Contact: test@example.com'
      const result = sanitizer.sanitize(text)
      expect(result).toContain('****@example.com')
    })

    it('should sanitize phone numbers', () => {
      const text = 'Phone: 13812345678'
      const result = sanitizer.sanitize(text)
      expect(result).toContain('****')
    })

    it('should sanitize IP addresses', () => {
      const text = 'Server IP: 192.168.1.100'
      const result = sanitizer.sanitize(text)
      expect(result).toContain('***.***.***.***')
    })

    it('should sanitize multiple types in one text', () => {
      const text = 'User test@example.com with API key sk-abcdefghijklmnopqrstuvwxyz123456 from 192.168.1.1'
      const result = sanitizer.sanitize(text)
      expect(result).not.toContain('test@example.com')
      expect(result).not.toContain('sk-abcdefghijklmnopqrstuvwxyz123456')
      expect(result).not.toContain('192.168.1.1')
    })

    it('should sanitize only specified types', () => {
      const text = 'Email: test@example.com, IP: 192.168.1.1'
      const result = sanitizer.sanitize(text, ['email'])
      expect(result).not.toContain('test@example.com')
      expect(result).toContain('192.168.1.1')
    })
  })

  describe('sanitizeObject', () => {
    it('should sanitize sensitive fields in objects', () => {
      const obj = {
        username: 'testuser',
        password: FAKE_PASSWORD,
        apiKey: FAKE_API_KEY,
      }
      const result = sanitizer.sanitizeObject(obj)
      expect(result.username).toBe('testuser')
      expect(result.password).toBe('****REDACTED****')
      expect(result.apiKey).toBe('****REDACTED****')
    })

    it('should sanitize nested objects when deep is true', () => {
      const obj = {
        user: {
          name: 'test',
          settings: {
            password: FAKE_PASSWORD,
          },
        },
      }
      const result = sanitizer.sanitizeObject(obj, { deep: true })
      expect(result.user.name).toBe('test')
      expect(result.user.settings.password).toBe('****REDACTED****')
    })

    it('should exclude specified keys', () => {
      const obj = {
        password: FAKE_PASSWORD,
        publicField: 'public',
      }
      const result = sanitizer.sanitizeObject(obj, { excludeKeys: ['password'] })
      expect(result.password).toBe(FAKE_PASSWORD)
      expect(result.publicField).toBe('public')
    })

    it('should only sanitize specified keys', () => {
      const obj = {
        password: FAKE_PASSWORD,
        apiKey: FAKE_API_KEY_SHORT,
        publicField: 'public',
      }
      const result = sanitizer.sanitizeObject(obj, { keys: ['password'] })
      expect(result.password).toBe('****REDACTED****')
      expect(result.apiKey).toBe(FAKE_API_KEY_SHORT)
    })

    it('should handle arrays', () => {
      const obj = {
        users: [
          { name: 'user1', password: 'pass1' },
          { name: 'user2', password: 'pass2' },
        ],
      }
      const result = sanitizer.sanitizeObject(obj, { deep: true })
      expect(result.users[0].password).toBe('****REDACTED****')
      expect(result.users[1].password).toBe('****REDACTED****')
    })
  })

  describe('detectSensitiveData', () => {
    it('should detect API keys', () => {
      const text = 'API Key: sk-1234567890abcdefghijklmnopqrstuvwxyz'
      const detected = sanitizer.detectSensitiveData(text)
      expect(detected.some(d => d.type === 'apiKey')).toBe(true)
    })

    it('should detect emails', () => {
      const text = 'Contact: test@example.com'
      const detected = sanitizer.detectSensitiveData(text)
      expect(detected.some(d => d.type === 'email')).toBe(true)
    })

    it('should detect multiple types', () => {
      const text = 'Email: test@example.com, IP: 192.168.1.1'
      const detected = sanitizer.detectSensitiveData(text)
      expect(detected.length).toBeGreaterThanOrEqual(2)
    })

    it('should return empty array for clean text', () => {
      const text = 'This is a clean text without sensitive data'
      const detected = sanitizer.detectSensitiveData(text)
      expect(detected).toHaveLength(0)
    })
  })

  describe('generateSanitizeReport', () => {
    it('should generate a complete report', () => {
      const text = 'Email: test@example.com, API: sk-abcdefghijklmnopqrstuvwxyz123456'
      const report = sanitizer.generateSanitizeReport(text)
      
      expect(report.original).toBe(text)
      expect(report.sanitized).not.toContain('test@example.com')
      expect(report.detected.length).toBeGreaterThan(0)
      expect(['low', 'medium', 'high']).toContain(report.riskLevel)
    })

    it('should calculate risk level correctly', () => {
      const lowRiskText = 'No sensitive data here'
      const lowReport = sanitizer.generateSanitizeReport(lowRiskText)
      expect(lowReport.riskLevel).toBe('low')

      const highRiskText = `
        Email: test1@example.com
        Email: test2@example.com
        Email: test3@example.com
        Email: test4@example.com
        Email: test5@example.com
        Email: test6@example.com
        IP: 192.168.1.1
        IP: 192.168.1.2
        IP: 192.168.1.3
      `
      const highReport = sanitizer.generateSanitizeReport(highRiskText)
      expect(highReport.riskLevel).toBe('high')
    })
  })

  describe('custom rules', () => {
    it('should add and apply custom rules', () => {
      sanitizer.addCustomRule('customField', /CUSTOM-[A-Z0-9]+/g, '****CUSTOM****')
      
      const text = 'Field: CUSTOM-ABC123'
      const result = sanitizer.sanitize(text)
      expect(result).toContain('****CUSTOM****')
    })

    it('should remove custom rules', () => {
      sanitizer.addCustomRule('customField', /CUSTOM-[A-Z0-9]+/g, '****CUSTOM****')
      sanitizer.removeCustomRule('customField')
      
      const text = 'Field: CUSTOM-ABC123'
      const result = sanitizer.sanitize(text)
      expect(result).toContain('CUSTOM-ABC123')
    })
  })

  describe('enable/disable types', () => {
    it('should disable specific types', () => {
      sanitizer.disableType('email')
      
      const text = 'Email: test@example.com'
      const result = sanitizer.sanitize(text)
      expect(result).toContain('test@example.com')
    })

    it('should re-enable specific types', () => {
      sanitizer.disableType('email')
      sanitizer.enableType('email')
      
      const text = 'Email: test@example.com'
      const result = sanitizer.sanitize(text)
      expect(result).not.toContain('test@example.com')
    })
  })
})

describe('defaultSanitizer', () => {
  it('should be an instance of SensitiveDataSanitizer', () => {
    expect(defaultSanitizer).toBeInstanceOf(SensitiveDataSanitizer)
  })
})

describe('sanitizeString', () => {
  it('should sanitize string using default sanitizer', () => {
    const text = 'Email: test@example.com'
    const result = sanitizeString(text)
    expect(result).not.toContain('test@example.com')
  })
})

describe('sanitizeObject', () => {
  it('should sanitize object using default sanitizer', () => {
    const obj = { password: FAKE_PASSWORD }
    const result = sanitizeObject(obj)
    expect(result.password).toBe('****REDACTED****')
  })
})

describe('detectSensitiveData', () => {
  it('should detect sensitive data using default sanitizer', () => {
    const text = 'Email: test@example.com'
    const detected = detectSensitiveData(text)
    expect(detected.some(d => d.type === 'email')).toBe(true)
  })
})

describe('useSensitiveDataSanitizer', () => {
  it('should return sanitizer functions', () => {
    const hook = useSensitiveDataSanitizer()
    
    expect(typeof hook.sanitize).toBe('function')
    expect(typeof hook.sanitizeObject).toBe('function')
    expect(typeof hook.detect).toBe('function')
    expect(typeof hook.report).toBe('function')
    expect(typeof hook.addRule).toBe('function')
    expect(typeof hook.removeRule).toBe('function')
  })

  it('should sanitize text', () => {
    const { sanitize } = useSensitiveDataSanitizer()
    const text = 'Email: test@example.com'
    const result = sanitize(text)
    expect(result).not.toContain('test@example.com')
  })

  it('should detect sensitive data', () => {
    const { detect } = useSensitiveDataSanitizer()
    const text = 'Email: test@example.com'
    const detected = detect(text)
    expect(detected.length).toBeGreaterThan(0)
  })

  it('should generate report', () => {
    const { report } = useSensitiveDataSanitizer()
    const text = 'Email: test@example.com'
    const reportResult = report(text)
    expect(reportResult.original).toBe(text)
    expect(reportResult.detected.length).toBeGreaterThan(0)
  })

  it('should work with custom enabled types', () => {
    const { sanitize } = useSensitiveDataSanitizer(['email'])
    
    const text = 'Email: test@example.com, IP: 192.168.1.1'
    const result = sanitize(text)
    
    expect(result).not.toContain('test@example.com')
    expect(result).toContain('192.168.1.1')
  })
})
