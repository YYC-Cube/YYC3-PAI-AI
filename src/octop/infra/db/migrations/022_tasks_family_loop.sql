-- Schema v22: family task loop — dispatch (assignee) and follow-up (due_at).

ALTER TABLE tasks ADD COLUMN assignee_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN due_at INTEGER;

CREATE INDEX IF NOT EXISTS idx_tasks_assignee_updated
    ON tasks(assignee_user_id, updated_at)
    WHERE assignee_user_id IS NOT NULL;

UPDATE _schema_version SET version = 22;
