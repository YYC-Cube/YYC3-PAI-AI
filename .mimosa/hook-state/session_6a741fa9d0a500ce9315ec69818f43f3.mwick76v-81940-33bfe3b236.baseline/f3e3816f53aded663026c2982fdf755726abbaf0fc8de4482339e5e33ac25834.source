/**
 * @file version-examples.ts
 * @description YYC³ AI-PAI type definitions and examples
 * @author YanYuCloudCube Team
 * @version v1.0.0
 * @created 2026-05-06
 * @updated 2026-05-06
 * @status active
 * @tags [types]
 */

import { YYC3VersionManager } from './version-manager.js'

const currentVersion = '1.2.3'

console.log('🚀 YYC³ 版本管理器 - 使用示例')
console.log('================================\n')

const manager = new YYC3VersionManager(currentVersion)

console.log('1️⃣  基础信息:')
console.log('   当前版本:', manager.getVersion())
console.log('   版本详情:', JSON.stringify(manager.getInfo(), null, 2))

console.log('\n2️⃣  版本递增:')
console.log('   Patch:', manager.bumpPatch())
console.log('   Minor:', manager.bumpMinor())
console.log('   Major:', manager.bumpMajor())

manager.setVersion(currentVersion)

console.log('\n3️⃣  版本比较:')
console.log('   gt("1.9.9"):', manager.gt('1.9.9'))
console.log('   lt("2.0.0"):', manager.lt('2.0.0'))
console.log('   eq("1.2.3"):', manager.eq('1.2.3'))

console.log('\n4️⃣  范围匹配:')
console.log('   满足 "^1.0.0":', manager.satisfies('^1.0.0'))
console.log('   满足 ">=1.0.0 <2.0.0":', manager.satisfies('>=1.0.0 <2.0.0'))

console.log('\n5️⃣  静态方法:')
const versions = ['1.0.0', '2.0.0', '1.9.0', '0.5.0']
console.log('   排序前:', versions)
console.log('   升序排序:', YYC3VersionManager.sort(versions))
console.log('   降序排序:', YYC3VersionManager.rsort(versions))
console.log('   最大匹配版本 (>=1.0.0):', YYC3VersionManager.maxSatisfying(versions, '>=1.0.0'))

console.log('\n6️⃣  版本验证:')
const testVersions = ['1.2.3', 'v2.0.0', 'invalid', '=1.5.0']
testVersions.forEach(v => {
  const result = YYC3VersionManager.validate(v)
  console.log(`   "${v}": ${result.valid ? '✅ ' + result.cleaned : '❌ ' + (result.error || '')}`)
})

console.log('\n7️⃣  实际应用场景:')

console.log('\n   📦 场景1: 检查依赖兼容性')
const depRanges = {
  react: '^18.0.0',
  next: '>=14.0.0',
  typescript: '~5.3.0'
}
Object.entries(depRanges).forEach(([dep, range]) => {
  const compatible = new YYC3VersionManager('18.3.1').satisfies(range)
  console.log(`   ${dep}@${range}: ${compatible ? '✅ 兼容' : '❌ 不兼容'}`)
})

console.log('\n   🔧 场景2: 自动版本号管理')
const version = new YYC3VersionManager('1.0.0')
console.log(`   初始版本: ${version}`)
console.log(`   Bug修复:   ${version.bumpPatch()} (patch)`)
console.log(`   新功能:    ${version.bumpMinor()} (minor)`)
console.log(`   重大更新:  ${version.bumpMajor()} (major)`)

console.log('\n   🎯 场景3: API版本控制')
const apiVersions = ['v1.0.0', 'v1.1.0', 'v2.0.0', 'v2.1.0-beta']
const cleanVersions = apiVersions
  .map(v => v.replace(/^v/, ''))
  .filter(v => YYC3VersionManager.validate(v).valid)
console.log(`   可用API版本: ${cleanVersions.join(', ')}`)
console.log(`   最新稳定版: ${YYC3VersionManager.rsort(cleanVersions)[0]}`)

console.log('\n✅ 示例完成!')
