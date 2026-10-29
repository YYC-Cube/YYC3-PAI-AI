/**
 * @file AudioUploader.tsx
 * @description 音频上传组件 - 支持拖拽、多选、格式验证
 */

import { AlertCircle, CheckCircle, FileAudio, Music, Upload, X } from 'lucide-react'
import React, { useCallback, useRef, useState } from 'react'
import { getAudioEngine, type AudioTrack } from '../../utils/audio-engine'

interface AudioUploaderProps {
  onUploadComplete?: (tracks: AudioTrack[]) => void
  onError?: (error: string) => void
  maxFileSize?: number // MB
  acceptedFormats?: string[]
  multiple?: boolean
  className?: string
}

const ACCEPTED_FORMATS = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mpeg', 'audio/flac', 'audio/aac']
const MAX_FILE_SIZE = 50 // MB

export function AudioUploader({
  onUploadComplete,
  onError,
  maxFileSize = MAX_FILE_SIZE,
  acceptedFormats = ACCEPTED_FORMATS,
  multiple = true,
  className = '',
}: AudioUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState<string[]>([])
  const [errors, setErrors] = useState<{ file: string; error: string }[]>([])
  const [successFiles, setSuccessFiles] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioEngine = getAudioEngine()

  const validateFile = (file: File): string | null => {
    if (!acceptedFormats.includes(file.type)) {
      return `不支持的格式: ${file.type}. 支持: ${acceptedFormats.map((f) => f.split('/')[1]).join(', ')}`
    }

    if (file.size > maxFileSize * 1024 * 1024) {
      return `文件过大: ${(file.size / 1024 / 1024).toFixed(2)}MB. 最大限制: ${maxFileSize}MB`
    }

    return null
  }

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files)
      const newErrors: { file: string; error: string }[] = []
      const validFiles: File[] = []

      for (const file of fileArray) {
        const error = validateFile(file)
        if (error) {
          newErrors.push({ file: file.name, error })
        } else {
          validFiles.push(file)
        }
      }

      if (newErrors.length > 0) {
        setErrors(newErrors)
        onError?.(newErrors.map((e) => `${e.file}: ${e.error}`).join('; '))
      }

      if (validFiles.length === 0) return

      const uploadedTracks: AudioTrack[] = []
      const uploadingIds: string[] = []

      for (const file of validFiles) {
        uploadingIds.push(file.name)
        setUploading([...uploadingIds])

        try {
          const track = await audioEngine.uploadAudio(file, {
            type: 'music',
            tags: ['uploaded'],
          })
          uploadedTracks.push(track)

          setTimeout(() => {
            setUploading((prev) => prev.filter((name) => name !== file.name))
          }, 500)
        } catch (error) {
          newErrors.push({ file: file.name, error: (error as Error).message })
          setUploading((prev) => prev.filter((name) => name !== file.name))
        }
      }

      if (uploadedTracks.length > 0) {
        onUploadComplete?.(uploadedTracks)
        setSuccessFiles(uploadedTracks.map(t => t.name))
        setTimeout(() => setSuccessFiles([]), 3000)
      }
    },
      // eslint-disable-next-line react-hooks/exhaustive-deps -- audioEngine 为模块级单例（非响应式），函数为稳定引用——入依赖仅致无谓重建
    [audioEngine, acceptedFormats, maxFileSize, onUploadComplete, onError]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files)
      }
    },
    [handleFiles]
  )

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }

  return (
    <div className={`audio-uploader ${className}`}>
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-cyan-400 bg-cyan-400/10 scale-[1.02]'
            : 'border-gray-600 hover:border-gray-500 hover:bg-gray-800/30'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(',')}
          multiple={multiple}
          aria-label="上传音频文件"
          onChange={handleInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-3">
          <div
            className={`p-4 rounded-full transition-all ${
              isDragging ? 'bg-cyan-400/20' : 'bg-gray-700/50'
            }`}
          >
            <Upload size={32} className={isDragging ? 'text-cyan-400' : 'text-gray-400'} />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-200">
              {isDragging ? '释放以上传音频文件' : '拖拽音频文件到此处'}
            </p>
            <p className="text-xs text-gray-500 mt-1">或点击选择文件</p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-500">
            <span className="px-2 py-1 bg-gray-800 rounded">MP3</span>
            <span className="px-2 py-1 bg-gray-800 rounded">WAV</span>
            <span className="px-2 py-1 bg-gray-800 rounded">OGG</span>
            <span className="px-2 py-1 bg-gray-800 rounded">FLAC</span>
            <span className="px-2 py-1 bg-gray-800 rounded">AAC</span>
          </div>

          <p className="text-xs text-gray-600">最大 {maxFileSize}MB{multiple ? ', 支持多选' : ''}</p>
        </div>
      </div>

      {uploading.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium text-cyan-400 flex items-center gap-2">
            <Music size={14} />
            上传中...
          </p>
          {uploading.map((fileName) => (
            <div
              key={fileName}
              className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 rounded animate-pulse"
            >
              <FileAudio size={16} className="text-cyan-400" />
              <span className="text-xs text-gray-300 truncate flex-1">{fileName}</span>
            </div>
          ))}
        </div>
      )}

      {errors.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium text-red-400 flex items-center gap-2">
            <AlertCircle size={14} />
            上传错误
          </p>
          {errors.map((err, idx) => (
            <div
              key={`${err.file}-${idx}`}
              className="flex items-start gap-2 px-3 py-2 bg-red-900/20 border border-red-900/30 rounded"
            >
              <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-red-300 font-medium truncate">{err.file}</p>
                <p className="text-xs text-red-400/70">{err.error}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setErrors((prev) => prev.filter((_, i) => i !== idx))
                }}
                aria-label="关闭错误提示"
                className="shrink-0 hover:text-red-300"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {successFiles.length > 0 && (
        <div className="mt-4 p-3 bg-green-900/20 border border-green-900/30 rounded-lg">
          <p className="text-xs font-medium text-green-400 flex items-center gap-2 mb-2">
            <CheckCircle size={14} />
            上传成功 ({successFiles.length} 个文件)
          </p>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {successFiles.map((fileName, idx) => (
              <div key={idx} className="flex items-center gap-2 px-2 py-1">
                <CheckCircle size={12} className="text-green-400" />
                <span className="text-xs text-gray-300 truncate">{fileName}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default AudioUploader
