/**
 * @file version-manager.test.ts
 * @description YYC3VersionManager 语义化版本管理器测试 — 实例/比较/静态工具全 API
 */

import { describe, it, expect } from 'vitest'
import { YYC3VersionManager } from '../version-manager'

describe('YYC3VersionManager 构造与基础', () => {
  it('构造清理版本号并支持 get/setVersion（链式）', () => {
    const m = new YYC3VersionManager('1.2.3')
    expect(m.getVersion()).toBe('1.2.3')
    expect(m.setVersion('  v2.0.0  ').getVersion()).toBe('2.0.0')
  })

  it('非法版本构造抛错', () => {
    expect(() => new YYC3VersionManager('not-a-version')).toThrow('Invalid semantic version')
    expect(() => new YYC3VersionManager('').setVersion('bad')).toThrow('Invalid semantic version')
  })

  it('getInfo 拆解 major/minor/patch 与 prerelease（clean 会剥离 build 元数据）', () => {
    const info = new YYC3VersionManager('1.2.3-alpha.1+build.9').getInfo()
    expect(info.major).toBe(1)
    expect(info.minor).toBe(2)
    expect(info.patch).toBe(3)
    expect(info.prerelease).toEqual(['alpha', 1])
    expect(info.build).toBeUndefined()
    expect(info.raw).toBe('1.2.3-alpha.1')
  })

  it('toString/toJSON/inspect 三个序列化出口', () => {
    const m = new YYC3VersionManager('3.2.1')
    expect(m.toString()).toBe('3.2.1')
    expect(m.toJSON().version).toBe('3.2.1')
    const inspect = (m as unknown as Record<symbol, () => string>)[Symbol.for('nodejs.util.inspect.custom')]
    expect(inspect.call(m)).toContain('YYC3VersionManager(3.2.1)')
  })
})

describe('YYC3VersionManager 递增与比较', () => {
  it('bump 三连：patch/minor/major 各归零进位', () => {
    const m = new YYC3VersionManager('1.2.3')
    expect(m.bumpPatch()).toBe('1.2.4')
    expect(m.bumpMinor()).toBe('1.3.0')
    expect(m.bumpMajor()).toBe('2.0.0')
  })

  it('increment 支持标识符与 prerelease 递增语义', () => {
    const m = new YYC3VersionManager('1.0.0')
    expect(m.increment('premajor', 'beta')).toBe('2.0.0-beta.0')
    // 干净版本递增 prerelease：先补丁进位再挂预发布号
    const p = new YYC3VersionManager('1.0.0')
    expect(p.increment('prerelease')).toBe('1.0.1-0')
  })

  it('compare 返回 -1/0/1 与描述文案', () => {
    const m = new YYC3VersionManager('1.2.3')
    expect(m.compare('1.2.4').result).toBe(-1)
    expect(m.compare('1.2.4').description).toContain('less than')
    expect(m.compare('1.2.3').result).toBe(0)
    expect(m.compare('1.2.3').description).toContain('equal')
    expect(m.compare('1.2.2').result).toBe(1)
    expect(m.compare('1.2.2').description).toContain('greater than')
  })

  it('六向比较器 gt/lt/eq/gte/lte/neq', () => {
    const m = new YYC3VersionManager('2.0.0')
    expect(m.gt('1.9.9')).toBe(true)
    expect(m.lt('2.0.1')).toBe(true)
    expect(m.eq('2.0.0')).toBe(true)
    expect(m.gte('2.0.0')).toBe(true)
    expect(m.lte('1.9.9')).toBe(false)
    expect(m.neq('3.0.0')).toBe(true)
  })

  it('diff 返回发布类型，satisfies/analyzeRange 范围判定', () => {
    const m = new YYC3VersionManager('1.2.3')
    expect(m.diff('1.3.0')).toBe('minor')
    expect(m.diff('1.2.3')).toBeNull()
    expect(m.satisfies('^1.0.0')).toBe(true)
    expect(m.satisfies('>=2.0.0')).toBe(false)
    const range = m.analyzeRange('~1.2.0')
    expect(range.satisfies).toBe(true)
    expect(range.minVersion).toBe('1.2.0')
  })

  it('coerce 宽松解析与 isValid', () => {
    const m = new YYC3VersionManager('1.0.0')
    expect(m.coerce('v1.2.3-alpha').coerced).toBe('1.2.3')
    expect(m.coerce('no digits here').valid).toBe(false)
    expect(m.isValid()).toBe(true)
  })
})

describe('YYC3VersionManager 静态工具', () => {
  it('validate：合法清理 / 非法报错文案', () => {
    expect(YYC3VersionManager.validate('v1.2.3')).toEqual({ valid: true, cleaned: '1.2.3' })
    expect(YYC3VersionManager.validate('bad').valid).toBe(false)
    expect(YYC3VersionManager.validate('bad').error).toContain('Invalid')
  })

  it('sort/rsort 过滤非法项后排序', () => {
    const input = ['1.0.0', 'garbage', '0.9.0', '2.0.0']
    expect(YYC3VersionManager.sort(input)).toEqual(['0.9.0', '1.0.0', '2.0.0'])
    expect(YYC3VersionManager.rsort(input)).toEqual(['2.0.0', '1.0.0', '0.9.0'])
  })

  it('maxSatisfying/minSatisfying/intersects', () => {
    const versions = ['1.0.0', '1.5.0', '2.0.0']
    expect(YYC3VersionManager.maxSatisfying(versions, '^1.0.0')).toBe('1.5.0')
    expect(YYC3VersionManager.minSatisfying(versions, '^1.0.0')).toBe('1.0.0')
    expect(YYC3VersionManager.intersects('^1.0.0', '1.x')).toBe(true)
    expect(YYC3VersionManager.intersects('^1.0.0', '^2.0.0')).toBe(false)
  })
})
