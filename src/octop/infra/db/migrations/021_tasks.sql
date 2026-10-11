-- Schema v21: A2A-style stateful task lifecycle (dispatch → execute → feedback).

CREATE TABLE IF NOT EXISTS tasks (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id     TEXT NOT NULL UNIQUE,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agent_id    TEXT,
    title       TEXT NOT NULL,
    instruction TEXT,
    status      TEXT NOT NULL DEFAULT 'submitted',
    result      TEXT,
    error       TEXT,
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_updated ON tasks(user_id, updated_at);

UPDATE _schema_version SET version = 21;
