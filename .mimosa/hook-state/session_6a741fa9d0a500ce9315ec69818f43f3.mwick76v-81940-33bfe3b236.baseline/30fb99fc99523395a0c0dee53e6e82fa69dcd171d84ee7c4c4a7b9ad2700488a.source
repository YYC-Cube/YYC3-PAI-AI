/**
 * @file AudioUploader.test.tsx
 * @description 音频上传组件专项 — 桩 audio-engine（uploadAudio），驱动：点击唤起文件选择、合法上传成功面板
 *              与回调、上传中指示与 500ms 延时移除、格式/大小校验与错误回调、错误条目移除、拖拽态与拖放上传、
 *              文件输入变更直传、上传异常容错、自定义格式白名单
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'

const h = vi.hoisted(() => {
  const engine = {
    uploadAudio: vi.fn(
      async (_file: File, _opts?: unknown): Promise<UploadedTrack> => ({
        id: 'up1',
        name: 'demo',
        url: 'blob:x',
        duration: 33,
        size: 4,
        type: 'music',
        tags: [],
        createdAt: 1,
        updatedAt: 1,
      })
    ),
  }
  return { engine }
})

vi.mock('../../../utils/audio-engine', () => ({
  getAudioEngine: () => h.engine,
}))

import { AudioUploader } from '../AudioUploader'
import type { AudioTrack as UploadedTrack } from '../../../utils/audio-engine'
import type { AudioTrack } from '../../../utils/audio-engine'

const mkFile = (name: string, size = 1024, type = 'audio/mpeg') => new File([new Uint8Array(size)], name, { type })

/** 向隐藏 file input 注入 FileList（jsdom 无法构造 FileList，直接以数组充当可迭代集合） */
const setFiles = (input: HTMLInputElement, files: File[]) => {
  Object.defineProperty(input, 'files', { value: files, configurable: true })
}

const trackOf = (name: string): AudioTrack => ({
  id: `id-${name}`,
  name,
  url: `blob:x/${name}`,
  duration: 10,
  size: 1,
  type: 'music',
  tags: [],
  createdAt: 1,
  updatedAt: 1,
})

beforeEach(() => {
  vi.resetAllMocks()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('AudioUploader（音频上传）', () => {
  it('点击上传区 → 唤起隐藏文件输入（click 转发）', () => {
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {})
    const { container } = render(<AudioUploader />)
    fireEvent.click(container.querySelector('.audio-uploader > div')!)
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(container.querySelector('input[aria-label="上传音频文件"]')).toBeTruthy()
    clickSpy.mockRestore()
  })

  it('合法文件直传：uploadAudio 带 music 类型与 uploaded 标签、成功面板列出文件名并回调 onUploadComplete', async () => {
    const onUploadComplete = vi.fn()
    h.engine.uploadAudio.mockImplementation(async (file: File) => trackOf(file.name))
    const { container } = render(<AudioUploader onUploadComplete={onUploadComplete} />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement

    setFiles(input, [mkFile('song-a.mp3'), mkFile('song-b.wav', 2048, 'audio/wav')])
    fireEvent.change(input)
    await act(async () => {})

    expect(h.engine.uploadAudio).toHaveBeenCalledTimes(2)
    expect(h.engine.uploadAudio.mock.calls[0][1]).toEqual({ type: 'music', tags: ['uploaded'] })
    expect(onUploadComplete).toHaveBeenCalledTimes(1)
    expect(onUploadComplete.mock.calls[0][0].map((t: AudioTrack) => t.name)).toEqual([
      'song-a.mp3',
      'song-b.wav',
    ])
    expect(container.textContent).toContain('上传成功 (2 个文件)')
    expect(container.textContent).toContain('song-a.mp3')
  })

  it('上传中指示：uploadAudio 挂起时显示文件名与「上传中...」，完成后 500ms 延时移除', async () => {
    vi.useFakeTimers()
    let resolveUpload!: (t: AudioTrack) => void
    h.engine.uploadAudio.mockImplementation(
      () => new Promise<AudioTrack>((resolve) => { resolveUpload = resolve })
    )
    const { container } = render(<AudioUploader />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    setFiles(input, [mkFile('slow.flac', 8, 'audio/flac')])
    fireEvent.change(input)

    // 挂起中：上传区可见文件名
    await act(async () => { await Promise.resolve() })
    expect(container.textContent).toContain('上传中...')
    expect(container.textContent).toContain('slow')

    resolveUpload(trackOf('slow'))
    await act(async () => { await vi.advanceTimersByTimeAsync(500) })
    expect(container.textContent).not.toContain('上传中...')
    // 成功面板 3 秒后自动消失
    expect(container.textContent).toContain('上传成功')
    await act(async () => { await vi.advanceTimersByTimeAsync(3000) })
    expect(container.textContent).not.toContain('上传成功')
  })

  it('格式校验失败：错误面板含具体格式提示、onError 汇总消息、uploadAudio 不执行', async () => {
    const onError = vi.fn()
    const { container } = render(<AudioUploader onError={onError} />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement

    setFiles(input, [mkFile('doc.pdf', 10, 'application/pdf')])
    fireEvent.change(input)
    await act(async () => {})

    expect(h.engine.uploadAudio).not.toHaveBeenCalled()
    expect(container.textContent).toContain('上传错误')
    expect(container.textContent).toContain('doc.pdf')
    expect(container.textContent).toContain('不支持的格式: application/pdf')
    expect(container.textContent).toContain('mp3, wav, ogg, mpeg, flac, aac')
    expect(onError).toHaveBeenCalledWith(expect.stringContaining('doc.pdf: 不支持的格式'))
  })

  it('大小校验失败：超过 50MB 提示「文件过大」并给出 MB 换算', async () => {
    const { container } = render(<AudioUploader />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement

    setFiles(input, [mkFile('huge.mp3', 51 * 1024 * 1024)])
    fireEvent.change(input)
    await act(async () => {})

    expect(h.engine.uploadAudio).not.toHaveBeenCalled()
    expect(container.textContent).toContain('文件过大: 51.00MB')
    expect(container.textContent).toContain('最大限制: 50MB')
  })

  it('上传异常：错误条目渲染 + onError 回调（41号已修）', async () => {
    const onError = vi.fn()
    h.engine.uploadAudio.mockRejectedValueOnce(new Error('磁盘已满'))
    const { container } = render(<AudioUploader onError={onError} />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement

    setFiles(input, [mkFile('broken.ogg', 4, 'audio/ogg')])
    fireEvent.change(input)
    await act(async () => {})

    // 41号已修：上传异常入 setErrors + onError 回调——UI 渲染错误条目
    expect(container.textContent).toContain('磁盘已满')
    expect(container.textContent).not.toContain('上传中...')
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError.mock.calls[0][0]).toContain('broken.ogg: 磁盘已满')
  })

  it('错误条目可逐条移除（X 按钮）', async () => {
    const { container } = render(<AudioUploader />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    setFiles(input, [mkFile('a.txt', 4, 'text/plain'), mkFile('b.txt', 4, 'text/plain')])
    fireEvent.change(input)
    await act(async () => {})
    expect(container.querySelectorAll('[aria-label="关闭错误提示"]')).toHaveLength(2)

    fireEvent.click(container.querySelectorAll('[aria-label="关闭错误提示"]')[0])
    expect(container.querySelectorAll('[aria-label="关闭错误提示"]')).toHaveLength(1)
    expect(container.textContent).not.toContain('a.txt')
  })

  it('拖拽态：dragover 高亮提示「释放以上传音频文件」、dragleave 还原；拖放合法文件触发上传', async () => {
    h.engine.uploadAudio.mockImplementation(async (file: File) => trackOf(file.name))
    const { container } = render(<AudioUploader />)
    const zone = container.querySelector('.audio-uploader > div') as HTMLElement

    expect(container.textContent).toContain('拖拽音频文件到此处')
    fireEvent.dragOver(zone)
    expect(container.textContent).toContain('释放以上传音频文件')
    fireEvent.dragLeave(zone)
    expect(container.textContent).toContain('拖拽音频文件到此处')

    fireEvent.drop(zone, { dataTransfer: { files: [mkFile('dropped.mp3')] } })
    await act(async () => {})
    expect(h.engine.uploadAudio).toHaveBeenCalledTimes(1)
    expect(h.engine.uploadAudio.mock.calls[0][0].name).toBe('dropped.mp3')
    expect(container.textContent).toContain('上传成功 (1 个文件)')
  })

  it('空拖放（无文件）不触发上传；自定义白名单与上限生效', async () => {
    const { container } = render(
      <AudioUploader acceptedFormats={['audio/custom']} maxFileSize={1} />
    )
    const zone = container.querySelector('.audio-uploader > div') as HTMLElement
    const input = container.querySelector('input[type="file"]') as HTMLInputElement

    fireEvent.drop(zone, { dataTransfer: { files: [] } })
    expect(h.engine.uploadAudio).not.toHaveBeenCalled()

    setFiles(input, [mkFile('c.mp3', 1024)]) // mp3 不在自定义白名单
    fireEvent.change(input)
    await act(async () => {})
    expect(container.textContent).toContain('不支持的格式: audio/mpeg')

    setFiles(input, [mkFile('d.custom', 2 * 1024 * 1024, 'audio/custom')])
    fireEvent.change(input)
    await act(async () => {})
    expect(container.textContent).toContain('文件过大: 2.00MB')
    expect(container.textContent).toContain('最大限制: 1MB')
    expect(h.engine.uploadAudio).not.toHaveBeenCalled()
  })
})
