/**
 * @file sanitize.ts
 * @description 敏感数据脱敏工具
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-04
 * @updated 2026-04-04
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags security,sanitize,privacy
 */

/**
 * 敏感数据类型
 */
export type SensitiveDataType = 
  | 'apiKey'
  | 'token'
  | 'password'
  | 'email'
  | 'phone'
  | 'idCard'
  | 'bankCard'
  | 'ip'
  | 'url'
  | 'jwt'

/**
 * 脱敏规则配置
 */
interface SanitizeRule {
  pattern: RegExp
  replacement: string
  description: string
}

/**
 * 预定义的脱敏规则
 */
const SANITIZE_RULES: Record<SensitiveDataType, SanitizeRule> = {
  apiKey: {
    pattern: /(sk-[a-zA-Z0-9]{20,})/g,
    replacement: 'sk-****REDACTED****',
    description: 'API Key',
  },
  token: {
    pattern: /(eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*)/g,
    replacement: '****TOKEN_REDACTED****',
    description: 'JWT Token',
  },
  password: {
    pattern: /(?<=password["\s:=]+)["']?([^"'\s]{6,})["']?/gi,
    replacement: '****',
    description: 'Password',
  },
  email: {
    pattern: /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
    replacement: '$1****@$2',
    description: 'Email',
  },
  phone: {
    pattern: /(\+?86[-\s]?)?1[3-9]\d{9}/g,
    replacement: '$1**** ****',
    description: 'Phone Number',
  },
  idCard: {
    pattern: /\d{17}[\dXx]/g,
    replacement: '******************',
    description: 'ID Card',
  },
  bankCard: {
    pattern: /\d{16,19}/g,
    replacement: '**** **** **** ****',
    description: 'Bank Card',
  },
  ip: {
    pattern: /(\d{1,3}\.){3}\d{1,3}/g,
    replacement: '***.***.***.***',
    description: 'IP Address',
  },
  url: {
    pattern: /(https?:\/\/)([^\s/$.?#].[^\s]*)/g,
    replacement: '$1****REDACTED****',
    description: 'URL with credentials',
  },
  jwt: {
    pattern: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,
    replacement: '****JWT_REDACTED****',
    description: 'JWT Token',
  },
}

/**
 * 敏感数据脱敏器
 */
export class SensitiveDataSanitizer {
  private customRules: Map<string, SanitizeRule> = new Map()
  private enabledTypes: Set<SensitiveDataType>

  constructor(enabledTypes?: SensitiveDataType[]) {
    this.enabledTypes = new Set(enabledTypes || Object.keys(SANITIZE_RULES) as SensitiveDataType[])
  }

  /**
   * 添加自定义脱敏规则
   */
  addCustomRule(name: string, pattern: RegExp, replacement: string, description?: string): void {
    this.customRules.set(name, {
      pattern,
      replacement,
      description: description || name,
    })
  }

  /**
   * 移除自定义脱敏规则
   */
  removeCustomRule(name: string): boolean {
    return this.customRules.delete(name)
  }

  /**
   * 启用特定类型的脱敏
   */
  enableType(type: SensitiveDataType): void {
    this.enabledTypes.add(type)
  }

  /**
   * 禁用特定类型的脱敏
   */
  disableType(type: SensitiveDataType): void {
    this.enabledTypes.delete(type)
  }

  /**
   * 对字符串进行脱敏处理
   */
  sanitize(text: string, types?: SensitiveDataType[]): string {
    let result = text
    const typesToUse = types || Array.from(this.enabledTypes)

    // 应用预定义规则
    for (const type of typesToUse) {
      const rule = SANITIZE_RULES[type]
      if (rule) {
        result = result.replace(rule.pattern, rule.replacement)
      }
    }

    // 应用自定义规则
    for (const rule of this.customRules.values()) {
      result = result.replace(rule.pattern, rule.replacement)
    }

    return result
  }

  /**
   * 对对象进行脱敏处理
   */
  sanitizeObject<T extends Record<string, unknown>>(
    obj: T,
    options?: {
      keys?: string[]
      excludeKeys?: string[]
      deep?: boolean
    }
  ): T {
    const { keys, excludeKeys = [], deep = true } = options || {}

    const sanitizeValue = (value: unknown): unknown => {
      if (typeof value === 'string') {
        return this.sanitize(value)
      }
      if (Array.isArray(value)) {
        return value.map(sanitizeValue)
      }
      if (typeof value === 'object' && value !== null) {
        if (deep) {
          return this.sanitizeObject(value as Record<string, unknown>, options)
        }
      }
      return value
    }

    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      if (excludeKeys.includes(key)) {
        result[key] = value
        continue
      }

      if (keys && !keys.includes(key)) {
        result[key] = value
        continue
      }

      // 对特定敏感键名进行脱敏
      const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'credential', 'key']
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        if (typeof value === 'string') {
          result[key] = '****REDACTED****'
        } else {
          result[key] = value
        }
        continue
      }

      result[key] = sanitizeValue(value)
    }

    return result as T
  }

  /**
   * 检测文本中的敏感数据
   */
  detectSensitiveData(text: string): Array<{ type: SensitiveDataType | string; matches: string[]; description: string }> {
    const results: Array<{ type: SensitiveDataType | string; matches: string[]; description: string }> = []

    // 检查预定义类型
    for (const [type, rule] of Object.entries(SANITIZE_RULES) as [SensitiveDataType, SanitizeRule][]) {
      const matches = text.match(rule.pattern)
      if (matches && matches.length > 0) {
        results.push({
          type,
          matches: [...new Set(matches)],
          description: rule.description,
        })
      }
    }

    // 检查自定义规则
    for (const [name, rule] of this.customRules) {
      const matches = text.match(rule.pattern)
      if (matches && matches.length > 0) {
        results.push({
          type: name,
          matches: [...new Set(matches)],
          description: rule.description,
        })
      }
    }

    return results
  }

  /**
   * 生成脱敏报告
   */
  generateSanitizeReport(text: string): {
    original: string
    sanitized: string
    detected: Array<{ type: SensitiveDataType | string; count: number; description: string }>
    riskLevel: 'low' | 'medium' | 'high'
  } {
    const detected = this.detectSensitiveData(text)
    const sanitized = this.sanitize(text)

    const totalMatches = detected.reduce((sum, d) => sum + d.matches.length, 0)
    let riskLevel: 'low' | 'medium' | 'high' = 'low'
    if (totalMatches > 5) {
      riskLevel = 'high'
    } else if (totalMatches > 2) {
      riskLevel = 'medium'
    }

    return {
      original: text,
      sanitized,
      detected: detected.map(d => ({
        type: d.type,
        count: d.matches.length,
        description: d.description,
      })),
      riskLevel,
    }
  }
}

/**
 * 默认脱敏器实例
 */
export const defaultSanitizer = new SensitiveDataSanitizer()

/**
 * 快捷函数：脱敏字符串
 */
export function sanitizeString(text: string, types?: SensitiveDataType[]): string {
  return defaultSanitizer.sanitize(text, types)
}

/**
 * 快捷函数：脱敏对象
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  options?: {
    keys?: string[]
    excludeKeys?: string[]
    deep?: boolean
  }
): T {
  return defaultSanitizer.sanitizeObject(obj, options)
}

/**
 * 快捷函数：检测敏感数据
 */
export function detectSensitiveData(text: string): Array<{ type: SensitiveDataType | string; matches: string[]; description: string }> {
  return defaultSanitizer.detectSensitiveData(text)
}

/**
 * React Hook: 使用敏感数据脱敏
 */
export function useSensitiveDataSanitizer(enabledTypes?: SensitiveDataType[]) {
  const sanitizer = new SensitiveDataSanitizer(enabledTypes)

  return {
    sanitize: (text: string) => sanitizer.sanitize(text),
    sanitizeObject: <T extends Record<string, unknown>>(obj: T, options?: { keys?: string[]; excludeKeys?: string[]; deep?: boolean }) => 
      sanitizer.sanitizeObject(obj, options),
    detect: (text: string) => sanitizer.detectSensitiveData(text),
    report: (text: string) => sanitizer.generateSanitizeReport(text),
    addRule: (name: string, pattern: RegExp, replacement: string, description?: string) => 
      sanitizer.addCustomRule(name, pattern, replacement, description),
    removeRule: (name: string) => sanitizer.removeCustomRule(name),
  }
}
