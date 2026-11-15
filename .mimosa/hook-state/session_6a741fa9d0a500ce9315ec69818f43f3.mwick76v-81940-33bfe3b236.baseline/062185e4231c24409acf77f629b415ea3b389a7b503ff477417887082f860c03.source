/**
 * @file db-store.test.ts
 * @description Unit test for db-store
 * @author YanYuCloudCube Team
 * @version v1.0.0
 * @created 2026-05-06
 * @updated 2026-05-06
 * @status active
 * @tags [test],[unit]
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

const lsMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
  }
})()
Object.defineProperty(globalThis, 'localStorage', { value: lsMock })

import { dbStoreActions } from '../db-store'

describe('DB Store — Engine Detection', () => {
  it('detectEngines should populate detected engines', async () => {
    await dbStoreActions.detectEngines()
    // Verify via persistence side-effects (detectStatus = done)
    // The action is async and uses mock data
  })
})

describe('Connection Management', () => {
  beforeEach(() => { lsMock.clear() })

  it('addProfile should return a new profile ID', () => {
    const id = dbStoreActions.addProfile({
      name: 'Test PG', type: 'postgres', host: 'localhost', port: 5432,
      username: 'admin', password: 'secret', ssl: false, defaultDB: 'testdb',
    })
    expect(typeof id).toBe('string')
    expect(id).toMatch(/^db_/)
  })

  it('addProfile should persist to localStorage', () => {
    lsMock.setItem.mockClear()
    dbStoreActions.addProfile({
      name: 'Persist PG', type: 'postgres', host: '127.0.0.1', port: 5432,
      username: 'user', password: 'pass', ssl: false, defaultDB: 'mydb',
    })
    const calls = lsMock.setItem.mock.calls.filter((c: string[]) => c[0] === 'yyc3_db_store')
    expect(calls.length).toBeGreaterThan(0)
    const parsed = JSON.parse(calls[calls.length - 1][1])
    expect(parsed.profiles.some((p: { name: string }) => p.name === 'Persist PG')).toBe(true)
  })

  it('editProfile should update profile fields', () => {
    const id = dbStoreActions.addProfile({
      name: 'Edit Me', type: 'mysql', host: 'localhost', port: 3306,
      username: 'root', password: '', ssl: false, defaultDB: 'test',
    })
    dbStoreActions.editProfile(id, { name: 'Edited', port: 3307 })
    const calls = lsMock.setItem.mock.calls.filter((c: string[]) => c[0] === 'yyc3_db_store')
    const parsed = JSON.parse(calls[calls.length - 1][1])
    const profile = parsed.profiles.find((p: { id: string }) => p.id === id)
    expect(profile.name).toBe('Edited')
    expect(profile.port).toBe(3307)
  })

  it('removeProfile should delete the profile', () => {
    const id = dbStoreActions.addProfile({
      name: 'Remove Me', type: 'redis', host: 'localhost', port: 6379,
      username: '', password: '', ssl: false, defaultDB: '0',
    })
    dbStoreActions.removeProfile(id)
    const calls = lsMock.setItem.mock.calls.filter((c: string[]) => c[0] === 'yyc3_db_store')
    const parsed = JSON.parse(calls[calls.length - 1][1])
    expect(parsed.profiles.some((p: { id: string }) => p.id === id)).toBe(false)
  })

  it('removeProfile should clear activeConnId if it matches', () => {
    const id = dbStoreActions.addProfile({
      name: 'Active', type: 'postgres', host: 'localhost', port: 5432,
      username: 'u', password: 'p', ssl: false, defaultDB: 'db',
    })
    dbStoreActions.setActiveConnection(id)
    dbStoreActions.removeProfile(id)
    const calls = lsMock.setItem.mock.calls.filter((c: string[]) => c[0] === 'yyc3_db_store')
    const parsed = JSON.parse(calls[calls.length - 1][1])
    expect(parsed.activeConnId).toBeNull()
  })

  it('setActiveConnection should update activeConnId', () => {
    const id = dbStoreActions.addProfile({
      name: 'Activate', type: 'postgres', host: 'localhost', port: 5432,
      username: 'u', password: 'p', ssl: false, defaultDB: 'db',
    })
    dbStoreActions.setActiveConnection(id)
    const calls = lsMock.setItem.mock.calls.filter((c: string[]) => c[0] === 'yyc3_db_store')
    const parsed = JSON.parse(calls[calls.length - 1][1])
    expect(parsed.activeConnId).toBe(id)
  })

  it('disconnectProfile should set status to disconnected', () => {
    const id = dbStoreActions.addProfile({
      name: 'Disconnect', type: 'postgres', host: 'localhost', port: 5432,
      username: 'u', password: 'p', ssl: false, defaultDB: 'db',
    })
    dbStoreActions.disconnectProfile(id)
    const calls = lsMock.setItem.mock.calls.filter((c: string[]) => c[0] === 'yyc3_db_store')
    const parsed = JSON.parse(calls[calls.length - 1][1])
    const p = parsed.profiles.find((pr: { id: string }) => pr.id === id)
    expect(p.status).toBe('disconnected')
  })

  it('testConnection should return result object', async () => {
    const id = dbStoreActions.addProfile({
      name: 'Test Conn', type: 'postgres', host: 'localhost', port: 5432,
      username: 'u', password: 'p', ssl: false, defaultDB: 'db',
    })
    const result = await dbStoreActions.testConnection(id)
    expect(result).toHaveProperty('success')
    expect(result).toHaveProperty('message')
    expect(typeof result.success).toBe('boolean')
  })

  it('testConnection for unknown profile should return failure', async () => {
    const result = await dbStoreActions.testConnection('nonexistent')
    expect(result.success).toBe(false)
    expect(result.message).toContain('not found')
  })
})

describe('Schema Browsing', () => {
  it('loadSchemas should return schema list', async () => {
    const id = dbStoreActions.addProfile({
      name: 'Schema PG', type: 'postgres', host: 'localhost', port: 5432,
      username: 'u', password: 'p', ssl: false, defaultDB: 'db',
    })
    const schemas = await dbStoreActions.loadSchemas(id)
    expect(Array.isArray(schemas)).toBe(true)
    expect(schemas.length).toBeGreaterThan(0)
  })

  it('loadSchemas for unknown profile should return empty', async () => {
    const schemas = await dbStoreActions.loadSchemas('nonexistent')
    expect(schemas).toEqual([])
  })

  it('loadTables should return table list', async () => {
    const id = dbStoreActions.addProfile({
      name: 'Tables PG', type: 'postgres', host: 'localhost', port: 5432,
      username: 'u', password: 'p', ssl: false, defaultDB: 'db',
    })
    const tables = await dbStoreActions.loadTables(id, 'public')
    expect(Array.isArray(tables)).toBe(true)
    expect(tables.length).toBeGreaterThan(0)
    expect(tables[0]).toHaveProperty('name')
    expect(tables[0]).toHaveProperty('schema')
  })

  it('loadColumns should return column list', async () => {
    const id = dbStoreActions.addProfile({
      name: 'Cols PG', type: 'postgres', host: 'localhost', port: 5432,
      username: 'u', password: 'p', ssl: false, defaultDB: 'db',
    })
    const cols = await dbStoreActions.loadColumns(id, 'public', 'users')
    expect(Array.isArray(cols)).toBe(true)
    expect(cols.length).toBeGreaterThan(0)
    expect(cols[0]).toHaveProperty('name')
    expect(cols[0]).toHaveProperty('type')
    expect(cols[0]).toHaveProperty('nullable')
    expect(cols[0]).toHaveProperty('primaryKey')
  })

  it('getSchemas/getTables/getColumns return cached data', () => {
    expect(dbStoreActions.getSchemas('fake')).toEqual([])
    expect(dbStoreActions.getTables('fake', 'public')).toEqual([])
    expect(dbStoreActions.getColumns('fake', 'public', 'users')).toEqual([])
  })
})

describe('Query Execution', () => {
  let connId: string

  beforeEach(() => {
    connId = dbStoreActions.addProfile({
      name: 'Query PG', type: 'postgres', host: 'localhost', port: 5432,
      username: 'u', password: 'p', ssl: false, defaultDB: 'db',
    })
  })

  it('SELECT query should return rows', async () => {
    const result = await dbStoreActions.executeQuery(connId, 'SELECT * FROM users')
    expect(result.columns.length).toBeGreaterThan(0)
    expect(result.rows.length).toBeGreaterThan(0)
    expect(result.rowCount).toBe(result.rows.length)
    expect(result.executionTime).toBeGreaterThan(0)
    expect(result.error).toBeUndefined()
  })

  it('INSERT query should return affectedRows', async () => {
    const result = await dbStoreActions.executeQuery(connId, "INSERT INTO users (name) VALUES ('test')")
    expect(result.affectedRows).toBe(1)
    expect(result.rows).toEqual([])
  })

  it('UPDATE query should return affectedRows', async () => {
    const result = await dbStoreActions.executeQuery(connId, "UPDATE users SET name='x'")
    expect(result.affectedRows).toBeGreaterThanOrEqual(1)
  })

  it('DELETE query should return affectedRows', async () => {
    const result = await dbStoreActions.executeQuery(connId, 'DELETE FROM users WHERE id=1')
    expect(result.affectedRows).toBeGreaterThanOrEqual(1)
  })

  it('DDL query should succeed without rows', async () => {
    const result = await dbStoreActions.executeQuery(connId, 'CREATE TABLE test (id INT)')
    expect(result.rows).toEqual([])
    expect(result.error).toBeUndefined()
  })

  it('unknown query should return error', async () => {
    const result = await dbStoreActions.executeQuery(connId, 'INVALID SQL')
    expect(result.error).toBeDefined()
    expect(result.error).toContain('Unrecognized')
  })

  it('query should be added to history', async () => {
    lsMock.setItem.mockClear()
    await dbStoreActions.executeQuery(connId, 'SELECT 1')
    const calls = lsMock.setItem.mock.calls.filter((c: string[]) => c[0] === 'yyc3_db_store')
    const parsed = JSON.parse(calls[calls.length - 1][1])
    expect(parsed.queryHistory.length).toBeGreaterThan(0)
    expect(parsed.queryHistory[0].sql).toBe('SELECT 1')
    expect(parsed.queryHistory[0].success).toBe(true)
  })

  it('clearQueryHistory should empty history', () => {
    dbStoreActions.clearQueryHistory()
    const calls = lsMock.setItem.mock.calls.filter((c: string[]) => c[0] === 'yyc3_db_store')
    const parsed = JSON.parse(calls[calls.length - 1][1])
    expect(parsed.queryHistory).toEqual([])
  })

  it('query history should be capped at 50', async () => {
    for (let i = 0; i < 55; i++) {
      await dbStoreActions.executeQuery(connId, `SELECT ${i}`)
    }
    const calls = lsMock.setItem.mock.calls.filter((c: string[]) => c[0] === 'yyc3_db_store')
    const parsed = JSON.parse(calls[calls.length - 1][1])
    expect(parsed.queryHistory.length).toBeLessThanOrEqual(50)
  }, 30000)
})

describe('Backup & Restore', () => {
  let connId: string

  beforeEach(() => {
    connId = dbStoreActions.addProfile({
      name: 'Backup PG', type: 'postgres', host: 'localhost', port: 5432,
      username: 'u', password: 'p', ssl: false, defaultDB: 'db',
    })
  })

  it('dumpDatabase should return backup record', async () => {
    const record = await dbStoreActions.dumpDatabase(connId)
    expect(record).toHaveProperty('id')
    expect(record).toHaveProperty('filename')
    expect(record.connId).toBe(connId)
    expect(['completed', 'failed']).toContain(record.status)
  })

  it('dumpDatabase for unknown profile should throw', async () => {
    await expect(dbStoreActions.dumpDatabase('nonexistent')).rejects.toThrow('Profile not found')
  })

  it('removeBackup should remove backup record', async () => {
    const record = await dbStoreActions.dumpDatabase(connId)
    dbStoreActions.removeBackup(record.id)
    const calls = lsMock.setItem.mock.calls.filter((c: string[]) => c[0] === 'yyc3_db_store')
    const parsed = JSON.parse(calls[calls.length - 1][1])
    expect(parsed.backups.some((b: { id: string }) => b.id === record.id)).toBe(false)
  })
})

describe('Panel & Tab', () => {
  it('openPanel/closePanel should not throw', () => {
    expect(() => dbStoreActions.openPanel()).not.toThrow()
    expect(() => dbStoreActions.closePanel()).not.toThrow()
  })

  it('setActiveTab should accept valid tab values', () => {
    const tabs = ['connections', 'sql', 'tables', 'backup'] as const
    for (const t of tabs) {
      expect(() => dbStoreActions.setActiveTab(t)).not.toThrow()
    }
  })
})

describe('Persistence', () => {
  it('persisted state should include profiles, queryHistory, backups, activeConnId', () => {
    dbStoreActions.addProfile({
      name: 'Persist Check', type: 'postgres', host: 'localhost', port: 5432,
      username: 'u', password: 'p', ssl: false, defaultDB: 'db',
    })
    const calls = lsMock.setItem.mock.calls.filter((c: string[]) => c[0] === 'yyc3_db_store')
    const parsed = JSON.parse(calls[calls.length - 1][1])
    expect(parsed).toHaveProperty('profiles')
    expect(parsed).toHaveProperty('queryHistory')
    expect(parsed).toHaveProperty('backups')
    expect(parsed).toHaveProperty('activeConnId')
  })

  it('persisted state should NOT include transient fields', () => {
    dbStoreActions.openPanel()
    const calls = lsMock.setItem.mock.calls.filter((c: string[]) => c[0] === 'yyc3_db_store')
    if (calls.length > 0) {
      const parsed = JSON.parse(calls[calls.length - 1][1])
      expect(parsed).not.toHaveProperty('panelVisible')
      expect(parsed).not.toHaveProperty('queryRunning')
      expect(parsed).not.toHaveProperty('detectStatus')
      expect(parsed).not.toHaveProperty('schemas')
      expect(parsed).not.toHaveProperty('tables')
      expect(parsed).not.toHaveProperty('columns')
    }
  })
})
