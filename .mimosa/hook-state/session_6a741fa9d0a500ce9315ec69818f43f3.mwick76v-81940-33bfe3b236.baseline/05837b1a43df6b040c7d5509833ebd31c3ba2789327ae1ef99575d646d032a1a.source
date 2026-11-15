/**
 * @file tauri-plugin-shell.d.ts
 * @description YYC³ AI-PAI type definitions and examples
 * @author YanYuCloudCube Team
 * @version v1.0.0
 * @created 2026-05-06
 * @updated 2026-05-06
 * @status active
 * @tags [types]
 */

declare module '@tauri-apps/plugin-shell' {
  interface CommandResult {
    code: number | null
    stdout: string
    stderr: string
  }

  interface CommandOptions {
    /** 子进程环境变量（plugin-shell v2 第三参：下发 PGPASSWORD/MYSQL_PWD 等） */
    env?: Record<string, string>
    cwd?: string
  }

  class Command {
    constructor(program: string, args?: string[], options?: CommandOptions)
    execute(): Promise<CommandResult>
  }
}
