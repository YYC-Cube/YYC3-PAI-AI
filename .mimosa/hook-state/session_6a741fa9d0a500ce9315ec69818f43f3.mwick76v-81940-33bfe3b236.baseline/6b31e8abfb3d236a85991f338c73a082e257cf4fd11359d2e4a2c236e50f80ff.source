/**
 * @file tauri-plugin-fs.d.ts
 * @description YYC³ AI-PAI type definitions and examples
 * @author YanYuCloudCube Team
 * @version v1.0.0
 * @created 2026-05-06
 * @updated 2026-05-06
 * @status active
 * @tags [types]
 */

declare module '@tauri-apps/plugin-fs' {
  interface FileInfo {
    name: string
    path: string
    isFile: boolean
    isDirectory: boolean
    size?: number
    mtime?: number | null
    permissions?: { mode: number; readonly: boolean }
  }

  export function readTextFile(path: string): Promise<string>
  export function readFile(path: string): Promise<Uint8Array>
  export function writeFile(path: string, data: string | Uint8Array): Promise<void>
  export function removeFile(path: string): Promise<void>
  export function renameFile(oldPath: string, newPath: string): Promise<void>
  export function copyFile(src: string, dest: string): Promise<void>
  export function exists(path: string): Promise<boolean>
  export function stat(path: string): Promise<FileInfo>
  export function readDir(path: string): Promise<FileInfo[]>
  export function mkdir(path: string, options?: { recursive?: boolean }): Promise<void>

  // Tauri event types for file watching
  interface FsChangeEvent {
    type: 'create' | 'modify' | 'remove'
    paths: string[]
  }
}
