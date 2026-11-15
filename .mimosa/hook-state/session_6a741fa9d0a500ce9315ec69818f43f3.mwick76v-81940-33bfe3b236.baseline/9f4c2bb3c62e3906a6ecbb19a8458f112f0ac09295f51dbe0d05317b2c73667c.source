/**
 * @file version-manager.ts
 * @description YYC³ AI-PAI version-manager.ts module
 * @author YanYuCloudCube Team
 * @version v1.0.0
 * @created 2026-05-06
 * @updated 2026-05-06
 * @status active
 * @tags [config]
 */

import semver from 'semver'

export interface VersionInfo {
  major: number
  minor: number
  patch: number
  prerelease?: string[]
  build?: string[]
  version: string
  raw: string
}

export interface VersionRange {
  range: string
  satisfies: boolean
  minVersion: string | null
  maxSatisfying?: string | null
  minSatisfying?: string | null
}

export interface VersionComparison {
  target: string
  result: -1 | 0 | 1
  description: string
}

export class YYC3VersionManager {
  private version: string

  constructor(version: string = '1.0.0') {
    const cleaned = semver.clean(version)
    if (!cleaned) {
      throw new Error(`Invalid semantic version: ${version}`)
    }
    this.version = cleaned
  }

  getVersion(): string {
    return this.version
  }

  setVersion(version: string): this {
    const cleaned = semver.clean(version)
    if (!cleaned) {
      throw new Error(`Invalid semantic version: ${version}`)
    }
    this.version = cleaned
    return this
  }

  getInfo(): VersionInfo {
    const parsed = semver.parse(this.version)
    if (!parsed) {
      throw new Error(`Failed to parse version: ${this.version}`)
    }

    return {
      major: parsed.major,
      minor: parsed.minor,
      patch: parsed.patch,
      prerelease: parsed.prerelease.length > 0 ? [...parsed.prerelease] as unknown as string[] : undefined,
      build: parsed.build.length > 0 ? [...parsed.build] as unknown as string[] : undefined,
      version: parsed.version,
      raw: parsed.raw || parsed.version
    }
  }

  increment(type: 'major' | 'minor' | 'patch' | 'premajor' | 'preminor' | 'prepatch' | 'prerelease', identifier?: string): string {
    const next = identifier ? semver.inc(this.version, type, identifier) : semver.inc(this.version, type)
    if (!next) {
      throw new Error(`Failed to increment version: ${this.version} by ${type}`)
    }
    this.version = next
    return next
  }

  bumpMajor(): string {
    return this.increment('major')
  }

  bumpMinor(): string {
    return this.increment('minor')
  }

  bumpPatch(): string {
    return this.increment('patch')
  }

  satisfies(range: string): boolean {
    return semver.satisfies(this.version, range)
  }

  compare(other: string): VersionComparison {
    const result = semver.compare(this.version, other)
    
    let description: string
    switch (result) {
      case -1:
        description = `${this.version} is less than ${other}`
        break
      case 0:
        description = `${this.version} is equal to ${other}`
        break
      case 1:
        description = `${this.version} is greater than ${other}`
        break
      default:
        description = `Comparison failed`
    }

    return {
      target: other,
      result: result as -1 | 0 | 1,
      description
    }
  }

  gt(other: string): boolean {
    return semver.gt(this.version, other)
  }

  lt(other: string): boolean {
    return semver.lt(this.version, other)
  }

  eq(other: string): boolean {
    return semver.eq(this.version, other)
  }

  gte(other: string): boolean {
    return semver.gte(this.version, other)
  }

  lte(other: string): boolean {
    return semver.lte(this.version, other)
  }

  neq(other: string): boolean {
    return semver.neq(this.version, other)
  }

  diff(other: string): semver.ReleaseType | null {
    return semver.diff(this.version, other)
  }

  analyzeRange(range: string): VersionRange {
    const satisfies = semver.satisfies(this.version, range)
    const minVersion = semver.minVersion(range)

    return {
      range,
      satisfies,
      minVersion: minVersion?.version || null
    }
  }

  coerce(input: string): { coerced: string | null; valid: boolean } {
    const coerced = semver.coerce(input)
    return {
      coerced: coerced?.version || null,
      valid: semver.valid(coerced?.version || '') !== null
    }
  }

  isValid(): boolean {
    return semver.valid(this.version) !== null
  }

  static validate(version: string): { valid: boolean; cleaned: string | null; error?: string } {
    const cleaned = semver.clean(version)
    if (cleaned) {
      return { valid: true, cleaned }
    }
    return { valid: false, cleaned: null, error: `Invalid semantic version: ${version}` }
  }

  static sort(versions: string[]): string[] {
    return semver.sort(versions.filter(v => semver.valid(v) !== null))
  }

  static rsort(versions: string[]): string[] {
    return semver.rsort(versions.filter(v => semver.valid(v) !== null))
  }

  static maxSatisfying(versions: string[], range: string): string | null {
    return semver.maxSatisfying(versions, range)
  }

  static minSatisfying(versions: string[], range: string): string | null {
    return semver.minSatisfying(versions, range)
  }

  static intersects(range1: string, range2: string): boolean {
    return semver.intersects(range1, range2)
  }

  toString(): string {
    return this.version
  }

  toJSON(): VersionInfo {
    return this.getInfo()
  }

  [Symbol.for('nodejs.util.inspect.custom')](): string {
    return `YYC3VersionManager(${this.version})`
  }
}
