-- Local campaign state. Schema and indexing are safe to replay.
CREATE TABLE IF NOT EXISTS campaign_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
INSERT OR IGNORE INTO campaign_meta VALUES ('revision', '0');
CREATE TABLE IF NOT EXISTS campaign_records (
 id TEXT PRIMARY KEY, kind TEXT NOT NULL, body TEXT NOT NULL,
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS campaign_facts (
 id TEXT PRIMARY KEY, record_id TEXT NOT NULL REFERENCES campaign_records(id) ON DELETE CASCADE,
 text TEXT NOT NULL, visibility TEXT NOT NULL, npc_ids TEXT NOT NULL,
 player_safe INTEGER NOT NULL DEFAULT 0, epistemic TEXT NOT NULL, provenance TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS campaign_facts_record ON campaign_facts(record_id);
CREATE TABLE IF NOT EXISTS campaign_sources (
 id TEXT PRIMARY KEY, filename TEXT NOT NULL, sha256 TEXT NOT NULL,
 visibility TEXT NOT NULL, format TEXT NOT NULL, page_count INTEGER NOT NULL,
 ingested_at TEXT NOT NULL, metadata TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS campaign_chunks (
 id TEXT PRIMARY KEY, source_id TEXT NOT NULL REFERENCES campaign_sources(id) ON DELETE CASCADE,
 page INTEGER NOT NULL, chunk_index INTEGER NOT NULL, text TEXT NOT NULL,
 sha256 TEXT NOT NULL, epistemic TEXT NOT NULL DEFAULT 'unresolved'
);
CREATE INDEX IF NOT EXISTS campaign_chunks_source ON campaign_chunks(source_id);
CREATE TABLE IF NOT EXISTS campaign_audit (
 id INTEGER PRIMARY KEY AUTOINCREMENT, revision INTEGER NOT NULL,
 actor TEXT NOT NULL, session_id TEXT, created_at TEXT NOT NULL, mutations TEXT NOT NULL
);
CREATE VIRTUAL TABLE IF NOT EXISTS campaign_search USING fts5(
 id UNINDEXED, doc_type UNINDEXED, text, tokenize='unicode61'
);
CREATE TABLE IF NOT EXISTS campaign_seeded (
 record_id TEXT PRIMARY KEY, seeded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
