/**
 * @file tauri-plugin-fs.ts
 * @description YYC³ AI-PAI tauri-plugin-fs.ts module
 * @author YanYuCloudCube Team
 * @version v1.0.0
 * @created 2026-05-06
 * @updated 2026-05-06
 * @status active
 * @tags [config]
 */

export const readTextFile = async (_path: string): Promise<string> => ''
export const readFile = async (_path: string): Promise<Uint8Array> => new Uint8Array()
export const writeFile = async (_path: string, _data: string | Uint8Array): Promise<void> => {}
export const removeFile = async (_path: string): Promise<void> => {}
export const renameFile = async (_oldPath: string, _newPath: string): Promise<void> => {}
export const copyFile = async (_src: string, _dest: string): Promise<void> => {}
export const exists = async (_path: string): Promise<boolean> => false
export const stat = async (_path: string) => ({
  name: 'test',
  path: '/test',
  isFile: true,
  isDirectory: false,
  size: 1024,
  mtime: Date.now(),
  permissions: { mode: 0o644, readonly: false },
})
export const readDir = async (_path: string) => []
export const mkdir = async (_path: string, _options?: { recursive?: boolean }): Promise<void> => {}
