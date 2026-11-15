/**
 * @file TrackDialogs.tsx
 * @description YYC³ AI-PAI Track Dialogs.tsx component
 * @author YanYuCloudCube Team
 * @version v1.0.0
 * @created 2026-05-06
 * @updated 2026-05-06
 * @status active
 * @tags [component]
 */

import type { ThemeTokens } from '../../store/theme-store'
import { useState } from 'react'

interface TrackInfo {
  id: string
  name: string
  metadata?: {
    artist?: string
  }
}

interface DeleteConfirmDialogProps {
  track: TrackInfo | null
  onConfirm: () => void
  onCancel: () => void
  tokens: ThemeTokens
}

export function DeleteConfirmDialog({ track, onConfirm, onCancel, tokens }: DeleteConfirmDialogProps) {
  if (!track) return null

  return (
    <div
      className="fixed inset-0 z-[10001] bg-black/60 backdrop-blur-sm flex items-center justify-center"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-xl p-6 m-4"
        style={{
          background: tokens.cardBg,
          border: `1px solid ${tokens.border}`,
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold mb-2" style={{ color: tokens.foreground }}>
          确认删除歌曲？
        </h3>
        <p className="text-sm mb-6" style={{ color: tokens.foregroundMuted }}>
          即将删除 <span className="font-medium" style={{ color: tokens.foreground }}>{track.name}</span>
          ，此操作无法撤销。
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            type="button"
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
            style={{
              background: `${tokens.codeBg}`,
              border: `1px solid ${tokens.borderDim}`,
              color: tokens.foregroundMuted
            }}
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            type="button"
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
            style={{
              background: '#dc2626',
              color: 'white'
            }}
          >
            确认删除
          </button>
        </div>
      </div>
    </div>
  )
}

interface EditTrackDialogProps {
  track: TrackInfo
  onSave: (name: string, artist?: string) => void
  onClose: () => void
  tokens: ThemeTokens
}

export function EditTrackDialog({ track, onSave, onClose, tokens }: EditTrackDialogProps) {
  const [name, setName] = useState(track.name)
  const [artist, setArtist] = useState(track.metadata?.artist || '')

  const handleSubmit = () => {
    if (!name.trim()) return
    onSave(name.trim(), artist.trim() || undefined)
  }

  return (
    <div
      className="fixed inset-0 z-[10001] bg-black/60 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl p-6 m-4"
        style={{
          background: tokens.cardBg,
          border: `1px solid ${tokens.border}`,
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold mb-4" style={{ color: tokens.foreground }}>
          编辑歌曲信息
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: tokens.foregroundMuted }}>
              歌曲名称 *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={{
                background: tokens.codeBg,
                border: `1px solid ${tokens.borderDim}`,
                color: tokens.foreground
              }}
              placeholder="输入歌曲名称"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: tokens.foregroundMuted }}>
              艺术家
            </label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={{
                background: tokens.codeBg,
                border: `1px solid ${tokens.borderDim}`,
                color: tokens.foreground
              }}
              placeholder="输入艺术家名称（可选）"
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
            style={{
              background: `${tokens.codeBg}`,
              border: `1px solid ${tokens.borderDim}`,
              color: tokens.foregroundMuted
            }}
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            type="button"
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80 disabled:opacity-50"
            style={{
              background: tokens.primary,
              color: 'white'
            }}
          >
            保存修改
          </button>
        </div>
      </div>
    </div>
  )
}
