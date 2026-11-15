/**
 * @file SystemPanel.tsx
 * @description 系统面板组件，提供系统信息功能
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags panel,system,ui,component
 */

import { useState, useEffect, useCallback } from 'react'
import {
  X, Puzzle, Shield, Wifi, WifiOff, Lock, Unlock,
  HardDrive, Database, Cloud, Trash2, RefreshCw,
  CheckCircle, XCircle, AlertTriangle, Loader2,
  Settings, Eye, EyeOff, Upload,
  ToggleLeft, ToggleRight, Clock, Zap, FileBox,
  Bot, Github, Paintbrush, Keyboard,
  ShieldCheck, Activity, Server,
} from 'lucide-react'
import { useThemeStore, Z_INDEX, BLUR, type ThemeTokens } from '../store/theme-store'
import { useI18n } from '../i18n/context'
import { CyberTooltip } from './CyberTooltip'
import { cyberToast } from './CyberToast'
import { usePluginStore, pluginStoreActions, MARKETPLACE_PLUGINS, type PluginMeta, type RegisteredPlugin } from '../store/plugin-store'
import { useCryptoStore, cryptoStoreActions } from '../store/crypto-store'
import { useOfflineStore, offlineStoreActions, type CacheEntry } from '../store/offline-store'

// ===== Icon Map for Plugin Icons =====
const ICON_MAP: Record<string, typeof Puzzle> = {
  HardDrive, Database, Cloud, FileBox, Bot, Github, Paintbrush, Keyboard, Puzzle, Zap, Server,
}
function getPluginIcon(name: string) { return ICON_MAP[name] ?? Puzzle }

// ===== Tab Definitions =====
type SystemTab = 'plugins' | 'security' | 'offline'

// ===== Plugin Tab =====
function PluginTab({ tk, isZh }: { tk: ThemeTokens; isZh: boolean }) {
  const { plugins } = usePluginStore()
  const [subTab, setSubTab] = useState<'installed' | 'marketplace'>('installed')

  const installedPlugins = plugins
  const activeCount = plugins.filter(p => p.status === 'active').length

  const handleToggle = useCallback(async (plugin: RegisteredPlugin) => {
    if (plugin.meta.enabled) {
      await pluginStoreActions.disablePlugin(plugin.meta.id)
      cyberToast(isZh ? `${plugin.meta.displayName} 已停用` : `${plugin.meta.displayName} disabled`)
    } else {
      await pluginStoreActions.enablePlugin(plugin.meta.id)
      cyberToast(isZh ? `${plugin.meta.displayName} 已启用` : `${plugin.meta.displayName} enabled`)
    }
  }, [isZh])

  const handleInstall = useCallback(async (meta: PluginMeta) => {
    const ok = await pluginStoreActions.installPlugin(meta)
    cyberToast(ok ? (isZh ? `${meta.displayName} 已安装` : `${meta.displayName} installed`) : (isZh ? '安装失败' : 'Install failed'))
  }, [isZh])

  const handleUninstall = useCallback(async (id: string) => {
    const ok = await pluginStoreActions.unregisterPlugin(id)
    cyberToast(ok ? (isZh ? '已卸载' : 'Uninstalled') : (isZh ? '无法卸载内置插件' : 'Cannot uninstall built-in'))
  }, [isZh])

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tabs */}
      <div className="flex items-center gap-2 px-3 py-1.5 shrink-0" style={{ borderBottom: `1px solid ${tk.borderDim}` }}>
        <button className="px-2 py-0.5 rounded transition-all" style={{ fontFamily: tk.fontMono, fontSize: '9px', color: subTab === 'installed' ? tk.primary : tk.foregroundMuted, background: subTab === 'installed' ? tk.primaryGlow : 'transparent' }} onClick={() => setSubTab('installed')}>
          {isZh ? `已安装 (${installedPlugins.length})` : `Installed (${installedPlugins.length})`}
        </button>
        <button className="px-2 py-0.5 rounded transition-all" style={{ fontFamily: tk.fontMono, fontSize: '9px', color: subTab === 'marketplace' ? tk.primary : tk.foregroundMuted, background: subTab === 'marketplace' ? tk.primaryGlow : 'transparent' }} onClick={() => setSubTab('marketplace')}>
          {isZh ? '插件市场' : 'Marketplace'}
        </button>
        <span className="ml-auto px-1.5 py-0.5 rounded" style={{ fontFamily: tk.fontMono, fontSize: '7px', color: tk.success, background: `${tk.success}12` }}>
          {activeCount} {isZh ? '个活跃' : 'active'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto neon-scrollbar p-2 flex flex-col gap-1.5">
        {subTab === 'installed' ? installedPlugins.map(plugin => {
          const Icon = getPluginIcon(plugin.meta.icon)
          return (
            <div key={plugin.meta.id} className="rounded-lg p-3 transition-all hover:bg-white/3 group" style={{ border: `1px solid ${tk.borderDim}`, background: plugin.status === 'active' ? `${plugin.meta.color}05` : 'transparent' }}>
              <div className="flex items-center gap-2">
                <Icon size={14} color={plugin.meta.color} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate" style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foreground }}>{plugin.meta.displayName}</span>
                    <span className="px-1 py-0.5 rounded shrink-0" style={{ fontFamily: tk.fontMono, fontSize: '6px', color: tk.foregroundMuted, background: tk.backgroundAlt }}>v{plugin.meta.version}</span>
                    {plugin.meta.builtin && <span className="px-1 py-0.5 rounded shrink-0" style={{ fontFamily: tk.fontMono, fontSize: '6px', color: tk.warning, background: `${tk.warning}12` }}>{isZh ? '内置' : 'BUILT-IN'}</span>}
                  </div>
                  <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>{plugin.meta.description}</span>
                </div>
                <div className="flex items-center gap-1">
                  {plugin.status === 'error' && <CyberTooltip label={plugin.error ?? ''}><AlertTriangle size={10} color={tk.error} /></CyberTooltip>}
                  <button onClick={() => handleToggle(plugin)} className="p-0.5 rounded hover:bg-white/10 transition-all">
                    {plugin.meta.enabled ? <ToggleRight size={14} color={tk.success} /> : <ToggleLeft size={14} color={tk.foregroundMuted} />}
                  </button>
                  {!plugin.meta.builtin && (
                    <button onClick={() => handleUninstall(plugin.meta.id)} className="p-0.5 rounded hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100">
                      <Trash2 size={10} color={tk.error} style={{ opacity: 0.5 }} />
                    </button>
                  )}
                </div>
              </div>
              {/* Permissions & Category */}
              <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                <span className="px-1 py-0.5 rounded" style={{ fontFamily: tk.fontMono, fontSize: '7px', color: plugin.meta.color, background: `${plugin.meta.color}12` }}>
                  {plugin.meta.category}
                </span>
                {plugin.meta.permissions.slice(0, 3).map(perm => (
                  <span key={perm} className="px-1 py-0.5 rounded" style={{ fontFamily: tk.fontMono, fontSize: '6px', color: tk.foregroundMuted, background: tk.backgroundAlt }}>
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          )
        }) : (
          /* Marketplace */
          MARKETPLACE_PLUGINS.map(meta => {
            const Icon = getPluginIcon(meta.icon)
            const installed = installedPlugins.some(p => p.meta.id === meta.id)
            return (
              <div key={meta.id} className="rounded-lg p-3 transition-all hover:bg-white/3" style={{ border: `1px solid ${tk.borderDim}` }}>
                <div className="flex items-center gap-2">
                  <Icon size={14} color={meta.color} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foreground }}>{meta.displayName}</span>
                      <span className="px-1 py-0.5 rounded" style={{ fontFamily: tk.fontMono, fontSize: '6px', color: tk.foregroundMuted, background: tk.backgroundAlt }}>v{meta.version}</span>
                    </div>
                    <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>{meta.description}</span>
                    <div className="mt-0.5"><span style={{ fontFamily: tk.fontMono, fontSize: '7px', color: tk.primaryDim }}>{meta.author}</span></div>
                  </div>
                  <button
                    className="px-2 py-1 rounded transition-all hover:opacity-80 shrink-0"
                    style={{
                      fontFamily: tk.fontMono, fontSize: '8px',
                      color: installed ? tk.foregroundMuted : tk.primary,
                      background: installed ? 'transparent' : tk.primaryGlow,
                      border: `1px solid ${installed ? tk.borderDim : tk.primary + '44'}`,
                    }}
                    onClick={() => !installed && handleInstall(meta)}
                    disabled={installed}
                  >
                    {installed ? (isZh ? '已安装' : 'Installed') : (isZh ? '安装' : 'Install')}
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* registerPlugin API hint */}
      <div className="px-3 py-2 shrink-0" style={{ borderTop: `1px solid ${tk.borderDim}`, background: tk.backgroundAlt }}>
        <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>
          API: <span style={{ color: tk.primary }}>window.yyc3RegisterPlugin(name, api)</span>
        </span>
      </div>
    </div>
  )
}

// ===== Security Tab =====
function SecurityTab({ tk, isZh }: { tk: ThemeTokens; isZh: boolean }) {
  const { passphraseSet, vaultUnlocked, encryptedItemCount, auditLog, autoLockTimeout, encryptionStrength } = useCryptoStore()
  const [passphrase, setPassphrase] = useState('')
  const [showPassphrase, setShowPassphrase] = useState(false)
  const [processing, setProcessing] = useState(false)

  const handleSetPassphrase = useCallback(async () => {
    if (!passphrase.trim() || passphrase.length < 6) {
      cyberToast(isZh ? '密码至少 6 位' : 'Passphrase must be at least 6 characters')
      return
    }
    setProcessing(true)
    const ok = await cryptoStoreActions.setPassphrase(passphrase)
    setProcessing(false)
    setPassphrase('')
    cyberToast(ok ? (isZh ? '主密码已设置，保险库已解锁' : 'Passphrase set, vault unlocked') : (isZh ? '设置失败' : 'Failed'))
  }, [passphrase, isZh])

  const handleUnlock = useCallback(async () => {
    if (!passphrase.trim()) return
    setProcessing(true)
    const ok = await cryptoStoreActions.unlockVault(passphrase)
    setProcessing(false)
    setPassphrase('')
    cyberToast(ok ? (isZh ? '保险库已解锁' : 'Vault unlocked') : (isZh ? '密码错误' : 'Invalid passphrase'))
  }, [passphrase, isZh])

  const handleLock = useCallback(() => {
    cryptoStoreActions.lockVault()
    cyberToast(isZh ? '保险库已锁定' : 'Vault locked')
  }, [isZh])

  const STRENGTHS: Array<{ id: typeof encryptionStrength; label: string; iters: string }> = [
    { id: 'standard', label: isZh ? '标准' : 'Standard', iters: '100K' },
    { id: 'high', label: isZh ? '高强度' : 'High', iters: '250K' },
    { id: 'maximum', label: isZh ? '最高' : 'Maximum', iters: '600K' },
  ]

  const auditActionLabels: Record<string, string> = {
    encrypt: isZh ? '加密' : 'Encrypt',
    decrypt: isZh ? '解密' : 'Decrypt',
    key_derive: isZh ? '密钥派生' : 'Key Derive',
    passphrase_set: isZh ? '设置密码' : 'Set Passphrase',
    passphrase_verify: isZh ? '验证密码' : 'Verify',
    vault_lock: isZh ? '锁定' : 'Lock',
    vault_unlock: isZh ? '解锁' : 'Unlock',
  }

  return (
    <div className="flex flex-col h-full">
      {/* Vault Status */}
      <div className="px-3 py-3 shrink-0" style={{ borderBottom: `1px solid ${tk.borderDim}` }}>
        <div className="flex items-center gap-2 mb-2">
          {vaultUnlocked ? <Unlock size={14} color={tk.success} /> : <Lock size={14} color={tk.warning} />}
          <span style={{ fontFamily: tk.fontMono, fontSize: '11px', color: tk.foreground }}>
            {isZh ? '安全保险库' : 'Security Vault'}
          </span>
          <span className="px-1.5 py-0.5 rounded" style={{
            fontFamily: tk.fontMono, fontSize: '8px',
            color: vaultUnlocked ? tk.success : tk.warning,
            background: vaultUnlocked ? `${tk.success}12` : `${tk.warning}12`,
          }}>
            {vaultUnlocked ? (isZh ? '已解锁' : 'UNLOCKED') : (isZh ? '已锁定' : 'LOCKED')}
          </span>
        </div>

        {/* Passphrase Input */}
        {(!passphraseSet || !vaultUnlocked) && (
          <div className="flex gap-2 mt-2">
            <div className="flex-1 relative">
              <input
                type={showPassphrase ? 'text' : 'password'}
                value={passphrase}
                onChange={e => setPassphrase(e.target.value)}
                placeholder={passphraseSet ? (isZh ? '输入主密码解锁...' : 'Enter passphrase...') : (isZh ? '设置主密码 (≥6位)...' : 'Set passphrase (≥6)...')}
                className="w-full px-3 py-1.5 rounded bg-transparent outline-none pr-8"
                style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foreground, border: `1px solid ${tk.borderDim}` }}
                onKeyDown={e => { if (e.key === 'Enter') { if (passphraseSet) { handleUnlock() } else { handleSetPassphrase() } } }}
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => setShowPassphrase(!showPassphrase)}>
                {showPassphrase ? <EyeOff size={10} color={tk.foregroundMuted} /> : <Eye size={10} color={tk.foregroundMuted} />}
              </button>
            </div>
            <button
              className="px-3 py-1.5 rounded transition-all hover:opacity-80 shrink-0"
              style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.primary, background: tk.primaryGlow, border: `1px solid ${tk.primary}44` }}
              onClick={passphraseSet ? handleUnlock : handleSetPassphrase}
              disabled={processing}
            >
              {processing ? <Loader2 size={10} className="animate-spin" /> : passphraseSet ? (isZh ? '解锁' : 'Unlock') : (isZh ? '设置' : 'Set')}
            </button>
          </div>
        )}

        {vaultUnlocked && (
          <div className="flex items-center gap-2 mt-2">
            <button className="flex items-center gap-1 px-2 py-1 rounded transition-all hover:opacity-80" style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.warning, background: `${tk.warning}12`, border: `1px solid ${tk.warning}33` }} onClick={handleLock}>
              <Lock size={9} /> {isZh ? '锁定保险库' : 'Lock Vault'}
            </button>
            <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>
              {encryptedItemCount} {isZh ? '个加密项' : 'encrypted items'}
            </span>
          </div>
        )}
      </div>

      {/* Encryption Strength */}
      <div className="px-3 py-2 shrink-0" style={{ borderBottom: `1px solid ${tk.borderDim}` }}>
        <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted, display: 'block', marginBottom: 4 }}>
          {isZh ? '加密强度 (PBKDF2 迭代)' : 'Encryption Strength (PBKDF2 iterations)'}
        </span>
        <div className="flex gap-1.5">
          {STRENGTHS.map(s => (
            <button
              key={s.id}
              className="flex-1 py-1 rounded text-center transition-all"
              style={{
                fontFamily: tk.fontMono, fontSize: '8px',
                color: encryptionStrength === s.id ? tk.primary : tk.foregroundMuted,
                background: encryptionStrength === s.id ? tk.primaryGlow : 'transparent',
                border: `1px solid ${encryptionStrength === s.id ? tk.primary + '44' : tk.borderDim}`,
              }}
              onClick={() => cryptoStoreActions.setEncryptionStrength(s.id)}
            >
              {s.label} ({s.iters})
            </button>
          ))}
        </div>
      </div>

      {/* Auto-lock */}
      <div className="px-3 py-2 shrink-0 flex items-center gap-2" style={{ borderBottom: `1px solid ${tk.borderDim}` }}>
        <Clock size={10} color={tk.primaryDim} />
        <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted }}>{isZh ? '自动锁定' : 'Auto-lock'}</span>
        <select
          className="ml-auto bg-transparent rounded px-2 py-0.5 outline-none"
          style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foreground, border: `1px solid ${tk.borderDim}` }}
          value={autoLockTimeout}
          onChange={e => cryptoStoreActions.setAutoLockTimeout(Number(e.target.value))}
        >
          <option value={5}>5 min</option>
          <option value={15}>15 min</option>
          <option value={30}>30 min</option>
          <option value={60}>60 min</option>
          <option value={0}>{isZh ? '永不' : 'Never'}</option>
        </select>
      </div>

      {/* Audit Log */}
      <div className="flex items-center gap-2 px-3 py-1.5 shrink-0" style={{ borderBottom: `1px solid ${tk.borderDim}` }}>
        <Activity size={10} color={tk.primary} />
        <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foreground }}>{isZh ? '安全审计' : 'Audit Log'}</span>
        <span className="px-1 py-0.5 rounded" style={{ fontFamily: tk.fontMono, fontSize: '7px', color: tk.foregroundMuted, background: tk.backgroundAlt }}>{auditLog.length}</span>
        {auditLog.length > 0 && (
          <button className="ml-auto px-1 py-0.5 rounded hover:bg-white/5 transition-all" style={{ fontFamily: tk.fontMono, fontSize: '7px', color: tk.error }} onClick={() => cryptoStoreActions.clearAuditLog()}>
            {isZh ? '清除' : 'Clear'}
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto neon-scrollbar">
        {auditLog.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10">
            <ShieldCheck size={20} color={tk.borderDim} className="mb-2" />
            <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted }}>{isZh ? '暂无审计记录' : 'No audit entries'}</span>
          </div>
        ) : auditLog.map(entry => (
          <div key={entry.id} className="flex items-center gap-2 px-3 py-1.5 border-b transition-colors hover:bg-white/2" style={{ borderColor: `${tk.borderDim}08` }}>
            {entry.success ? <CheckCircle size={8} color={tk.success} /> : <XCircle size={8} color={tk.error} />}
            <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.primary }}>{auditActionLabels[entry.action] ?? entry.action}</span>
            <span className="truncate" style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>{entry.target}</span>
            <span className="ml-auto shrink-0" style={{ fontFamily: tk.fontMono, fontSize: '7px', color: tk.foregroundMuted }}>
              {new Date(entry.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ===== Offline Tab =====
function OfflineTab({ tk, isZh }: { tk: ThemeTokens; isZh: boolean }) {
  const { networkStatus, isOffline, cacheEntries, totalCacheSize, maxCacheSize, syncQueue, lastSyncTime, isSyncing, swStatus, networkLatency } = useOfflineStore()

  const pendingCount = syncQueue.filter(q => q.status === 'pending').length
  const failedCount = syncQueue.filter(q => q.status === 'failed').length

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  const networkColor = networkStatus === 'online' ? tk.success : networkStatus === 'slow' ? tk.warning : networkStatus === 'checking' ? tk.primary : tk.error
  const categoryColors: Record<string, string> = {
    'ui-asset': '#00f0ff', 'file-version': '#39ff14', 'db-profile': '#f5a623', 'ai-response': '#bd10e0', 'plugin-data': '#4a90d9', 'user-pref': '#888',
  }
  const categoryLabels: Record<string, string> = {
    'ui-asset': isZh ? 'UI 资源' : 'UI Assets', 'file-version': isZh ? '文件版本' : 'File Versions',
    'db-profile': isZh ? 'DB 配置' : 'DB Profiles', 'ai-response': isZh ? 'AI 响应' : 'AI Responses',
    'plugin-data': isZh ? '插件数据' : 'Plugin Data', 'user-pref': isZh ? '用户偏好' : 'Preferences',
  }

  // Group cache by category
  const categoryGroups: Record<string, { count: number; size: number }> = {}
  cacheEntries.forEach(e => {
    if (!categoryGroups[e.category]) categoryGroups[e.category] = { count: 0, size: 0 }
    categoryGroups[e.category].count++
    categoryGroups[e.category].size += e.sizeBytes
  })

  return (
    <div className="flex flex-col h-full">
      {/* Network Status */}
      <div className="px-3 py-3 shrink-0" style={{ borderBottom: `1px solid ${tk.borderDim}` }}>
        <div className="flex items-center gap-2 mb-2">
          {isOffline ? <WifiOff size={14} color={tk.error} /> : <Wifi size={14} color={networkColor} />}
          <span style={{ fontFamily: tk.fontMono, fontSize: '11px', color: tk.foreground }}>
            {isZh ? '网络状态' : 'Network Status'}
          </span>
          <span className="px-1.5 py-0.5 rounded" style={{
            fontFamily: tk.fontMono, fontSize: '8px', color: networkColor, background: `${networkColor}12`,
          }}>
            {networkStatus === 'online' ? (isZh ? '在线' : 'ONLINE') : networkStatus === 'slow' ? (isZh ? '缓慢' : 'SLOW') : networkStatus === 'checking' ? (isZh ? '检测中' : 'CHECKING') : (isZh ? '离线' : 'OFFLINE')}
          </span>
          {networkLatency !== null && (
            <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>{networkLatency}ms</span>
          )}
          <button className="ml-auto p-1 rounded hover:bg-white/10 transition-all" onClick={() => offlineStoreActions.checkConnectivity()}>
            <RefreshCw size={10} color={tk.primaryDim} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>
            Service Worker: <span style={{ color: swStatus === 'active' ? tk.success : tk.warning }}>{swStatus.toUpperCase()}</span>
          </span>
          {lastSyncTime && (
            <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>
              {isZh ? '最后同步' : 'Last sync'}: {new Date(lastSyncTime).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Cache Overview */}
      <div className="px-3 py-2 shrink-0" style={{ borderBottom: `1px solid ${tk.borderDim}` }}>
        <div className="flex items-center gap-2 mb-2">
          <HardDrive size={10} color={tk.primary} />
          <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foreground }}>{isZh ? '缓存概览' : 'Cache Overview'}</span>
          <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>
            {formatSize(totalCacheSize)} / {formatSize(maxCacheSize)}
          </span>
          <div className="ml-auto flex items-center gap-1">
            <CyberTooltip label={isZh ? '清理过期' : 'Clean Expired'} position="left">
              <button className="p-0.5 rounded hover:bg-white/10 transition-all" onClick={() => { offlineStoreActions.cleanExpiredCache(); cyberToast(isZh ? '已清理过期缓存' : 'Expired cache cleaned') }}>
                <RefreshCw size={9} color={tk.primaryDim} />
              </button>
            </CyberTooltip>
            <CyberTooltip label={isZh ? '清除全部' : 'Clear All'} position="left">
              <button className="p-0.5 rounded hover:bg-white/10 transition-all" onClick={() => { offlineStoreActions.clearAllCache(); cyberToast(isZh ? '缓存已清除' : 'Cache cleared') }}>
                <Trash2 size={9} color={tk.error} style={{ opacity: 0.5 }} />
              </button>
            </CyberTooltip>
          </div>
        </div>
        {/* Usage bar */}
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: tk.backgroundAlt }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (totalCacheSize / maxCacheSize) * 100)}%`, background: totalCacheSize / maxCacheSize > 0.9 ? tk.error : totalCacheSize / maxCacheSize > 0.7 ? tk.warning : tk.primary }} />
        </div>
        {/* Category breakdown */}
        <div className="flex flex-wrap gap-1 mt-2">
          {Object.entries(categoryGroups).map(([cat, data]) => (
            <button key={cat} className="flex items-center gap-1 px-1.5 py-0.5 rounded transition-all hover:bg-white/5" style={{ border: `1px solid ${categoryColors[cat] ?? tk.borderDim}20` }}
              onClick={() => { offlineStoreActions.clearCacheByCategory(cat as CacheEntry['category']); cyberToast(isZh ? `已清除 ${categoryLabels[cat]}` : `Cleared ${categoryLabels[cat]}`) }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: categoryColors[cat] ?? tk.foregroundMuted }} />
              <span style={{ fontFamily: tk.fontMono, fontSize: '7px', color: tk.foregroundMuted }}>{categoryLabels[cat] ?? cat}</span>
              <span style={{ fontFamily: tk.fontMono, fontSize: '7px', color: categoryColors[cat] ?? tk.foregroundMuted }}>{data.count} · {formatSize(data.size)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sync Queue */}
      <div className="flex items-center gap-2 px-3 py-1.5 shrink-0" style={{ borderBottom: `1px solid ${tk.borderDim}` }}>
        <Upload size={10} color={tk.primary} />
        <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foreground }}>{isZh ? '同步队列' : 'Sync Queue'}</span>
        {pendingCount > 0 && <span className="px-1 py-0.5 rounded" style={{ fontFamily: tk.fontMono, fontSize: '7px', color: tk.warning, background: `${tk.warning}12` }}>{pendingCount} {isZh ? '待处理' : 'pending'}</span>}
        {failedCount > 0 && <span className="px-1 py-0.5 rounded" style={{ fontFamily: tk.fontMono, fontSize: '7px', color: tk.error, background: `${tk.error}12` }}>{failedCount} {isZh ? '失败' : 'failed'}</span>}
        {isSyncing && <Loader2 size={9} color={tk.primary} className="animate-spin" />}
        <div className="ml-auto flex items-center gap-1">
          <button className="px-1.5 py-0.5 rounded hover:bg-white/5 transition-all" style={{ fontFamily: tk.fontMono, fontSize: '7px', color: tk.primary }} onClick={() => offlineStoreActions.processSyncQueue()}>
            {isZh ? '立即同步' : 'Sync Now'}
          </button>
          <button className="px-1.5 py-0.5 rounded hover:bg-white/5 transition-all" style={{ fontFamily: tk.fontMono, fontSize: '7px', color: tk.foregroundMuted }} onClick={() => offlineStoreActions.clearCompletedSync()}>
            {isZh ? '清除已完成' : 'Clear Done'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto neon-scrollbar">
        {syncQueue.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10">
            <CheckCircle size={20} color={tk.borderDim} className="mb-2" />
            <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted }}>{isZh ? '同步队列为空' : 'Sync queue empty'}</span>
          </div>
        ) : syncQueue.map(item => (
          <div key={item.id} className="flex items-center gap-2 px-3 py-1.5 border-b transition-colors hover:bg-white/2" style={{ borderColor: `${tk.borderDim}08` }}>
            {item.status === 'completed' ? <CheckCircle size={8} color={tk.success} /> :
              item.status === 'failed' ? <XCircle size={8} color={tk.error} /> :
              item.status === 'syncing' ? <Loader2 size={8} color={tk.primary} className="animate-spin" /> :
              <Clock size={8} color={tk.warning} />}
            <span className="px-1 py-0.5 rounded" style={{ fontFamily: tk.fontMono, fontSize: '7px', color: tk.primaryDim, background: `${tk.primaryDim}12` }}>{item.action}</span>
            <span className="truncate" style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foreground }}>{item.resource}</span>
            {item.status === 'failed' && (
              <button className="ml-auto p-0.5 rounded hover:bg-white/10 transition-all shrink-0" onClick={() => offlineStoreActions.retrySyncItem(item.id)}>
                <RefreshCw size={8} color={tk.warning} />
              </button>
            )}
            <span className="ml-auto shrink-0" style={{ fontFamily: tk.fontMono, fontSize: '7px', color: tk.foregroundMuted }}>
              {new Date(item.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ===== Main System Panel =====
export function SystemPanel() {
  const { tokens: tk } = useThemeStore()
  const { locale } = useI18n()
  const isZh = locale === 'zh'
  const { panelVisible: pluginVisible } = usePluginStore()
  const { panelVisible: securityVisible } = useCryptoStore()
  const { panelVisible: offlineVisible } = useOfflineStore()

  const visible = pluginVisible || securityVisible || offlineVisible

  const [activeTab, setActiveTab] = useState<SystemTab>(
    pluginVisible ? 'plugins' : securityVisible ? 'security' : 'offline'
  )

  useEffect(() => {
    if (pluginVisible) queueMicrotask(() => setActiveTab('plugins'))
    else if (securityVisible) queueMicrotask(() => setActiveTab('security'))
    else if (offlineVisible) queueMicrotask(() => setActiveTab('offline'))
  }, [pluginVisible, securityVisible, offlineVisible])

  const handleClose = useCallback(() => {
    pluginStoreActions.closePanel()
    cryptoStoreActions.closePanel()
    offlineStoreActions.closePanel()
  }, [])

  if (!visible) return null

  const TABS: Array<{ id: SystemTab; label: string; icon: typeof Puzzle }> = [
    { id: 'plugins', label: isZh ? '插件' : 'Plugins', icon: Puzzle },
    { id: 'security', label: isZh ? '安全' : 'Security', icon: Shield },
    { id: 'offline', label: isZh ? '离线' : 'Offline', icon: Wifi },
  ]

  return (
    <div
      className="fixed right-0 top-0 h-full flex flex-col"
      style={{
        width: 420,
        zIndex: Z_INDEX.modal,
        background: tk.panelBg,
        borderLeft: `1px solid ${tk.cardBorder}`,
        backdropFilter: BLUR.lg,
        boxShadow: tk.shadowHover,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 shrink-0" style={{ borderBottom: `1px solid ${tk.borderDim}` }}>
        <Settings size={14} color={tk.primary} />
        <span style={{ fontFamily: tk.fontMono, fontSize: '12px', color: tk.foreground }}>
          {isZh ? '系统管理' : 'System Manager'}
        </span>
        <span className="px-1.5 py-0.5 rounded" style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted, background: tk.backgroundAlt }}>v4.8.0</span>
        <button className="ml-auto p-1 rounded hover:bg-white/10 transition-all" onClick={handleClose}>
          <X size={14} color={tk.foregroundMuted} />
        </button>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 px-3 py-1.5 shrink-0" style={{ borderBottom: `1px solid ${tk.borderDim}` }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded transition-all"
            style={{
              fontFamily: tk.fontMono, fontSize: '9px',
              color: activeTab === tab.id ? tk.primary : tk.foregroundMuted,
              background: activeTab === tab.id ? tk.primaryGlow : 'transparent',
              border: `1px solid ${activeTab === tab.id ? tk.primary + '44' : 'transparent'}`,
            }}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={10} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'plugins' && <PluginTab tk={tk} isZh={isZh} />}
        {activeTab === 'security' && <SecurityTab tk={tk} isZh={isZh} />}
        {activeTab === 'offline' && <OfflineTab tk={tk} isZh={isZh} />}
      </div>
    </div>
  )
}
