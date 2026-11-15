/**
 * @file KeyManagerPanel.tsx
 * @description 密钥管理面板组件，提供安全的密钥存储和管理界面
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-07
 * @updated 2026-04-07
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags security,keys,ui,component
 */
import { useState, useEffect, useCallback } from 'react'
import {
  Lock,
  Unlock,
  Key,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Upload,
  Settings,
  RefreshCw,
  X,
  Info,
} from 'lucide-react'
import { useThemeStore } from '../store/theme-store'
import { useI18n } from '../i18n/context'
import { keyManager, type KeyInfo } from '../utils/key-manager'
import { migratePlaintextKeysToVault } from '../utils/key-storage'
import { createLogger } from '../utils/logger'

const logger = createLogger('KeyManagerPanel')

interface KeyFormData {
  provider: string
  apiKey: string
  description: string
}

export function KeyManagerPanel() {
  const { tokens: tk } = useThemeStore()
  const { t } = useI18n()
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [keys, setKeys] = useState<KeyInfo[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [formData, setFormData] = useState<KeyFormData>({
    provider: '',
    apiKey: '',
    description: '',
  })
  const [showKey, setShowKey] = useState<Record<string, boolean>>({})
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(
    null
  )
  const [loading, setLoading] = useState(false)
  const [autoLockDelay, setAutoLockDelay] = useState(30)

  const loadKeys = useCallback(() => {
    if (keyManager.isUnlocked()) {
      const keyList = keyManager.listKeys()
      setKeys(keyList)
    }
  }, [])

  useEffect(() => {
    setIsUnlocked(keyManager.isUnlocked())
    loadKeys()
  }, [loadKeys])

  const handleUnlock = async () => {
    if (!password.trim()) {
      setMessage({ type: 'error', text: '请输入主密码' })
      return
    }

    setLoading(true)
    try {
      const success = await keyManager.unlock(password)
      if (success) {
        setIsUnlocked(true)
        loadKeys()
        setMessage({ type: 'success', text: '解锁成功' })
        setPassword('')
        // 解锁即迁移：把历史明文 API Key（ModelSettings/useAI/model-store）收编入保险库
        const moved = await migratePlaintextKeysToVault()
        if (moved > 0) {
          setMessage({ type: 'success', text: `解锁成功，${moved} 个明文 Key 已加密入库` })
          loadKeys()
        }
      } else {
        setMessage({ type: 'error', text: '主密码错误' })
      }
    } catch (error) {
      logger.error('[KeyManagerPanel] Failed to unlock', error)
      setMessage({ type: 'error', text: '解锁失败' })
    } finally {
      setLoading(false)
    }
  }

  const handleLock = () => {
    keyManager.lock()
    setIsUnlocked(false)
    setKeys([])
    setMessage({ type: 'info', text: '已锁定' })
  }

  const handleAddKey = async () => {
    if (!formData.provider.trim() || !formData.apiKey.trim()) {
      setMessage({ type: 'error', text: '请填写供应商和API密钥' })
      return
    }

    setLoading(true)
    try {
      await keyManager.storeKey(formData.provider, formData.apiKey, {
        description: formData.description,
      })
      loadKeys()
      setShowAddForm(false)
      setFormData({ provider: '', apiKey: '', description: '' })
      setMessage({ type: 'success', text: '密钥添加成功' })
    } catch (error) {
      logger.error('[KeyManagerPanel] Failed to add key', error)
      setMessage({ type: 'error', text: '添加密钥失败' })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteKey = async (provider: string) => {
    if (!confirm(`确定要删除 ${provider} 的密钥吗？`)) {
      return
    }

    setLoading(true)
    try {
      await keyManager.deleteKey(provider)
      loadKeys()
      setMessage({ type: 'success', text: '密钥删除成功' })
    } catch (error) {
      logger.error('[KeyManagerPanel] Failed to delete key', error)
      setMessage({ type: 'error', text: '删除密钥失败' })
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (!password.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setMessage({ type: 'error', text: '请填写所有密码字段' })
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: '新密码两次输入不一致' })
      return
    }

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: '新密码长度至少8位' })
      return
    }

    setLoading(true)
    try {
      const success = await keyManager.changePassword(password, newPassword)
      if (success) {
        setShowChangePassword(false)
        setPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setMessage({ type: 'success', text: '密码修改成功' })
      } else {
        setMessage({ type: 'error', text: '原密码错误' })
      }
    } catch (error) {
      logger.error('[KeyManagerPanel] Failed to change password', error)
      setMessage({ type: 'error', text: '密码修改失败' })
    } finally {
      setLoading(false)
    }
  }

  const handleExportKeys = async () => {
    if (!password.trim()) {
      setMessage({ type: 'error', text: '请输入导出密码' })
      return
    }

    setLoading(true)
    try {
      const exported = await keyManager.exportKeys(password)
      const blob = new Blob([exported], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `yyc3-keys-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
      setPassword('')
      setMessage({ type: 'success', text: '密钥导出成功' })
    } catch (error) {
      logger.error('[KeyManagerPanel] Failed to export keys', error)
      setMessage({ type: 'error', text: '导出失败' })
    } finally {
      setLoading(false)
    }
  }

  const handleImportKeys = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !password.trim()) {
      setMessage({ type: 'error', text: '请选择文件并输入导入密码' })
      return
    }

    setLoading(true)
    try {
      const text = await file.text()
      const imported = await keyManager.importKeys(text, password)
      loadKeys()
      setPassword('')
      setMessage({ type: 'success', text: `成功导入 ${imported} 个密钥` })
    } catch (error) {
      logger.error('[KeyManagerPanel] Failed to import keys', error)
      setMessage({ type: 'error', text: '导入失败，请检查密码是否正确' })
    } finally {
      setLoading(false)
      event.target.value = ''
    }
  }

  const handleAutoLockChange = (minutes: number) => {
    setAutoLockDelay(minutes)
    keyManager.setAutoLockDelay(minutes * 60 * 1000)
    setMessage({ type: 'info', text: `自动锁定时间已设置为 ${minutes} 分钟` })
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="h-full overflow-y-auto p-4" style={{ background: tk.background }}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: tk.foreground }}>
            <Shield size={20} style={{ color: tk.primary }} />
            {t('settings', 'keyManagement')}
          </h2>
          <div className="flex items-center gap-2">
            {isUnlocked && (
              <>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="p-2 rounded-lg transition-all hover:opacity-80"
                  style={{ background: tk.primary, color: tk.background }}
                  title="添加密钥"
                >
                  <Plus size={16} />
                </button>
                <button
                  onClick={() => setShowChangePassword(true)}
                  className="p-2 rounded-lg transition-all hover:opacity-80"
                  style={{ background: tk.inputBg, color: tk.foreground }}
                  title="修改密码"
                >
                  <Settings size={16} />
                </button>
                <button
                  onClick={handleLock}
                  className="p-2 rounded-lg transition-all hover:opacity-80"
                  style={{ background: tk.error, color: tk.background }}
                  title="锁定"
                >
                  <Lock size={16} />
                </button>
              </>
            )}
          </div>
        </div>

        {message && (
          <div
            className="flex items-center gap-2 p-3 rounded-lg border"
            style={{
              background:
                message.type === 'success'
                  ? `${tk.success}10`
                  : message.type === 'error'
                    ? `${tk.error}10`
                    : `${tk.primary}10`,
              borderColor:
                message.type === 'success'
                  ? tk.success
                  : message.type === 'error'
                    ? tk.error
                    : tk.primary,
              color:
                message.type === 'success'
                  ? tk.success
                  : message.type === 'error'
                    ? tk.error
                    : tk.primary,
            }}
          >
            {message.type === 'success' ? (
              <CheckCircle2 size={16} />
            ) : message.type === 'error' ? (
              <AlertTriangle size={16} />
            ) : (
              <Info size={16} />
            )}
            <span className="text-xs">{message.text}</span>
            <button onClick={() => setMessage(null)} className="ml-auto">
              <X size={14} />
            </button>
          </div>
        )}

        {!isUnlocked ? (
          <div
            className="p-6 rounded-lg border text-center"
            style={{ background: tk.cardBg, borderColor: tk.cardBorder }}
          >
            <Lock size={48} style={{ color: tk.foregroundMuted }} className="mx-auto mb-4" />
            <h3 className="text-sm font-medium mb-4" style={{ color: tk.foreground }}>
              {t('settings', 'enterMasterPassword')}
            </h3>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
              placeholder="主密码"
              className="w-full max-w-xs px-3 py-2 rounded-lg text-xs mb-4 outline-none"
              style={{
                background: tk.inputBg,
                border: `1px solid ${tk.inputBorder}`,
                color: tk.foreground,
              }}
            />
            <div>
              <button
                onClick={handleUnlock}
                disabled={loading}
                className="px-4 py-2 rounded-lg text-xs font-medium transition-all hover:opacity-80 disabled:opacity-50"
                style={{ background: tk.primary, color: tk.background }}
              >
                {loading ? (
                  <RefreshCw size={14} className="animate-spin inline" />
                ) : (
                  <Unlock size={14} className="inline" />
                )}
                <span className="ml-2">解锁</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            <div
              className="p-4 rounded-lg border"
              style={{ background: tk.cardBg, borderColor: tk.cardBorder }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium flex items-center gap-2" style={{ color: tk.foreground }}>
                  <Key size={16} style={{ color: tk.primary }} />
                  {t('settings', 'storedKeys')}
                </h3>
                <div className="flex items-center gap-2">
                  <select
                    value={autoLockDelay}
                    onChange={(e) => handleAutoLockChange(parseInt(e.target.value))}
                    className="px-2 py-1 rounded text-[10px]"
                    style={{
                      background: tk.inputBg,
                      border: `1px solid ${tk.inputBorder}`,
                      color: tk.foreground,
                    }}
                  >
                    <option value={5}>5分钟自动锁定</option>
                    <option value={15}>15分钟自动锁定</option>
                    <option value={30}>30分钟自动锁定</option>
                    <option value={60}>60分钟自动锁定</option>
                  </select>
                </div>
              </div>

              {keys.length === 0 ? (
                <div className="text-center py-8">
                  <Key size={32} style={{ color: tk.foregroundMuted }} className="mx-auto mb-2" />
                  <p className="text-xs" style={{ color: tk.foregroundMuted }}>
                    {t('settings', 'noStoredKeys')}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {keys.map((key) => (
                    <div
                      key={key.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                      style={{ background: tk.inputBg, borderColor: tk.inputBorder }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium" style={{ color: tk.foreground }}>
                            {key.provider}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: tk.primary + '20', color: tk.primary }}>
                            {key.keyPreview}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-[10px]" style={{ color: tk.foregroundMuted }}>
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            创建: {formatTime(key.createdAt)}
                          </span>
                          {key.lastUsed && (
                            <span className="flex items-center gap-1">
                              <RefreshCw size={10} />
                              使用: {formatTime(key.lastUsed)}
                            </span>
                          )}
                        </div>
                        {key.metadata?.description && (
                          <p className="text-[10px] mt-1" style={{ color: tk.foregroundMuted }}>
                            {key.metadata.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteKey(key.provider)}
                        className="p-2 rounded-lg transition-all hover:opacity-80"
                        style={{ color: tk.error }}
                        title="删除"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div
              className="p-4 rounded-lg border"
              style={{ background: tk.cardBg, borderColor: tk.cardBorder }}
            >
              <h3 className="text-sm font-medium mb-4 flex items-center gap-2" style={{ color: tk.foreground }}>
                <Download size={16} style={{ color: tk.primary }} />
                {t('settings', 'backupRestore')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] mb-2" style={{ color: tk.foregroundMuted }}>
                    导出密码
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="设置导出密码"
                    className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                    style={{
                      background: tk.inputBg,
                      border: `1px solid ${tk.inputBorder}`,
                      color: tk.foreground,
                    }}
                  />
                  <button
                    onClick={handleExportKeys}
                    disabled={loading || !password.trim()}
                    className="w-full mt-2 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:opacity-80 disabled:opacity-50"
                    style={{ background: tk.primary, color: tk.background }}
                  >
                    <Download size={12} className="inline mr-1" />
                    导出密钥
                  </button>
                </div>
                <div>
                  <label className="block text-[10px] mb-2" style={{ color: tk.foregroundMuted }}>
                    导入密码
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="输入导入密码"
                    className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                    style={{
                      background: tk.inputBg,
                      border: `1px solid ${tk.inputBorder}`,
                      color: tk.foreground,
                    }}
                  />
                  <label
                    className="w-full mt-2 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:opacity-80 cursor-pointer text-center block"
                    style={{
                      background: tk.inputBg,
                      border: `1px solid ${tk.inputBorder}`,
                      color: tk.foreground,
                    }}
                  >
                    <Upload size={12} className="inline mr-1" />
                    导入密钥
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportKeys}
                      className="hidden"
                      disabled={loading || !password.trim()}
                    />
                  </label>
                </div>
              </div>
            </div>
          </>
        )}

        {showAddForm && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ background: 'rgba(0,0,0,0.5)' }}
          >
            <div
              className="w-full max-w-md p-6 rounded-lg border"
              style={{ background: tk.cardBg, borderColor: tk.cardBorder }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium" style={{ color: tk.foreground }}>
                  添加密钥
                </h3>
                <button onClick={() => setShowAddForm(false)} style={{ color: tk.foregroundMuted }}>
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] mb-1" style={{ color: tk.foregroundMuted }}>
                    供应商
                  </label>
                  <input
                    type="text"
                    value={formData.provider}
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                    placeholder="例如: openai, zhipu, qwen"
                    className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                    style={{
                      background: tk.inputBg,
                      border: `1px solid ${tk.inputBorder}`,
                      color: tk.foreground,
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] mb-1" style={{ color: tk.foregroundMuted }}>
                    API 密钥
                  </label>
                  <div className="relative">
                    <input
                      type={showKey[formData.provider] ? 'text' : 'password'}
                      value={formData.apiKey}
                      onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                      placeholder="输入 API 密钥"
                      className="w-full px-3 py-2 pr-10 rounded-lg text-xs outline-none"
                      style={{
                        background: tk.inputBg,
                        border: `1px solid ${tk.inputBorder}`,
                        color: tk.foreground,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowKey({ ...showKey, [formData.provider]: !showKey[formData.provider] })
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      style={{ color: tk.foregroundMuted }}
                    >
                      {showKey[formData.provider] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] mb-1" style={{ color: tk.foregroundMuted }}>
                    描述（可选）
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="密钥描述"
                    className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                    style={{
                      background: tk.inputBg,
                      border: `1px solid ${tk.inputBorder}`,
                      color: tk.foreground,
                    }}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                    style={{ background: tk.inputBg, color: tk.foreground }}
                  >
                    取消
                  </button>
                  <button
                    onClick={handleAddKey}
                    disabled={loading}
                    className="flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:opacity-80 disabled:opacity-50"
                    style={{ background: tk.primary, color: tk.background }}
                  >
                    {loading ? <RefreshCw size={14} className="animate-spin inline" /> : '添加'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showChangePassword && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ background: 'rgba(0,0,0,0.5)' }}
          >
            <div
              className="w-full max-w-md p-6 rounded-lg border"
              style={{ background: tk.cardBg, borderColor: tk.cardBorder }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium" style={{ color: tk.foreground }}>
                  修改主密码
                </h3>
                <button
                  onClick={() => setShowChangePassword(false)}
                  style={{ color: tk.foregroundMuted }}
                >
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] mb-1" style={{ color: tk.foregroundMuted }}>
                    原密码
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="输入原密码"
                    className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                    style={{
                      background: tk.inputBg,
                      border: `1px solid ${tk.inputBorder}`,
                      color: tk.foreground,
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] mb-1" style={{ color: tk.foregroundMuted }}>
                    新密码
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="输入新密码"
                    className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                    style={{
                      background: tk.inputBg,
                      border: `1px solid ${tk.inputBorder}`,
                      color: tk.foreground,
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] mb-1" style={{ color: tk.foregroundMuted }}>
                    确认新密码
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="再次输入新密码"
                    className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                    style={{
                      background: tk.inputBg,
                      border: `1px solid ${tk.inputBorder}`,
                      color: tk.foreground,
                    }}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowChangePassword(false)}
                    className="flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                    style={{ background: tk.inputBg, color: tk.foreground }}
                  >
                    取消
                  </button>
                  <button
                    onClick={handleChangePassword}
                    disabled={loading}
                    className="flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:opacity-80 disabled:opacity-50"
                    style={{ background: tk.primary, color: tk.background }}
                  >
                    {loading ? <RefreshCw size={14} className="animate-spin inline" /> : '修改'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
