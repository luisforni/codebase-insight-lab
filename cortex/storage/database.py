import aiosqlite
from contextlib import asynccontextmanager
from config import settings

_CREATE_TABLES = """
CREATE TABLE IF NOT EXISTS explanations (
    id           TEXT PRIMARY KEY,
    file_path    TEXT NOT NULL,
    element_type TEXT NOT NULL,
    element_name TEXT NOT NULL,
    line_number  INTEGER NOT NULL,
    content      TEXT NOT NULL,
    agent_source TEXT NOT NULL,
    model_used   TEXT NOT NULL,
    workspace_id TEXT NOT NULL DEFAULT '',
    created_at   INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_explanations_file ON explanations(file_path);
CREATE INDEX IF NOT EXISTS idx_explanations_line  ON explanations(file_path, line_number);

CREATE TABLE IF NOT EXISTS analysis_history (
    id           TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    file_path    TEXT NOT NULL,
    agent_id     TEXT NOT NULL,
    query        TEXT,
    content      TEXT NOT NULL,
    model_used   TEXT NOT NULL,
    created_at   INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_history_workspace ON analysis_history(workspace_id);
CREATE INDEX IF NOT EXISTS idx_history_file      ON analysis_history(file_path);
"""


async def init_db():
    async with aiosqlite.connect(settings.db_path) as db:
        await db.executescript(_CREATE_TABLES)
        await db.commit()


@asynccontextmanager
async def get_db():
    db = await aiosqlite.connect(settings.db_path)
    db.row_factory = aiosqlite.Row
    try:
        yield db
    finally:
        await db.close()


async def save_explanation(data: dict):
    async with get_db() as db:
        await db.execute(
            """INSERT OR REPLACE INTO explanations
               (id, file_path, element_type, element_name, line_number, content, agent_source, model_used, workspace_id, created_at)
               VALUES (:id, :file_path, :element_type, :element_name, :line_number, :content, :agent_source, :model_used, :workspace_id, :created_at)""",
            data,
        )
        await db.commit()


async def get_explanations(file_path: str) -> list[dict]:
    async with get_db() as db:
        cursor = await db.execute(
            "SELECT * FROM explanations WHERE file_path = ? ORDER BY line_number",
            (file_path,),
        )
        rows = await cursor.fetchall()
        return [dict(r) for r in rows]


async def save_analysis(data: dict):
    async with get_db() as db:
        await db.execute(
            """INSERT INTO analysis_history
               (id, workspace_id, file_path, agent_id, query, content, model_used, created_at)
               VALUES (:id, :workspace_id, :file_path, :agent_id, :query, :content, :model_used, :created_at)""",
            data,
        )
        await db.commit()
